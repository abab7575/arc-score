/**
 * Scan Worker — Serial job processor for the lightweight scanner.
 *
 * Processes scan_jobs one at a time from the queue.
 * Designed to run as an in-process worker within the Next.js app.
 *
 * Features:
 * - Single-worker guarantee via system_state lock
 * - Serial processing (one brand at a time)
 * - 60-second per-brand timeout
 * - Crash recovery: stale "running" jobs re-queued on startup
 * - 200ms pause between jobs to avoid starving the web app
 */

import { db, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { runLightweightScan } from "./lightweight-scanner";
import { insertLightweightScan, getLatestLightweightScan, getPreviousLightweightScan } from "@/lib/db/queries";
import { processChangelog, cleanupRevertedPendingChanges } from "./changelog-engine";
import { runDriftChecks, type DriftReport } from "./drift-detector";

interface FailureReport {
  failedBrands?: Array<{
    brandId: number;
    slug: string;
    name: string;
    error: string;
  }>;
  errorCounts?: Array<{
    error: string;
    count: number;
  }>;
}

const WORKER_TICK_MS = 1000; // Check for jobs every 1 second
const JOB_TIMEOUT_MS = 60000; // 60 second per-brand timeout
const PAUSE_BETWEEN_JOBS_MS = 200; // Brief pause between jobs
const LOCK_STALE_MS = 120000; // Consider lock stale after 2 minutes of no heartbeat
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

let workerRunning = false;
let workerInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Attempt to acquire the worker lock. Returns true if acquired.
 */
function acquireLock(): boolean {
  const now = new Date().toISOString();

  // Check for existing lock
  const existing = db
    .select()
    .from(schema.systemState)
    .where(eq(schema.systemState.key, "scan_worker_lock"))
    .get();

  if (existing) {
    const lockAge = Date.now() - new Date(existing.updatedAt).getTime();
    if (lockAge < LOCK_STALE_MS) {
      // Lock is fresh, someone else is running
      return false;
    }
    // Lock is stale, claim it
    db.update(schema.systemState)
      .set({ value: WORKER_ID, updatedAt: now })
      .where(eq(schema.systemState.key, "scan_worker_lock"))
      .run();
    return true;
  }

  // No lock exists, create it
  db.insert(schema.systemState)
    .values({ key: "scan_worker_lock", value: WORKER_ID, updatedAt: now })
    .run();
  return true;
}

/**
 * Refresh the lock heartbeat so it doesn't go stale.
 */
function refreshLock(): void {
  db.update(schema.systemState)
    .set({ updatedAt: new Date().toISOString() })
    .where(
      and(
        eq(schema.systemState.key, "scan_worker_lock"),
        eq(schema.systemState.value, WORKER_ID),
      ),
    )
    .run();
}

/**
 * Release the worker lock.
 */
function releaseLock(): void {
  db.delete(schema.systemState)
    .where(
      and(
        eq(schema.systemState.key, "scan_worker_lock"),
        eq(schema.systemState.value, WORKER_ID),
      ),
    )
    .run();
}

/**
 * Recover from crash: re-queue any jobs stuck in "running" state.
 */
function recoverStalledJobs(): number {
  const result = db
    .update(schema.scanJobs)
    .set({
      status: "queued",
      startedAt: null,
    })
    .where(eq(schema.scanJobs.status, "running"))
    .run();

  const count = result.changes;
  if (count > 0) {
    console.log(`[scan-worker] Recovered ${count} stalled jobs`);
  }

  return count;
}

/**
 * Get the next queued job for the current active run.
 */
function getNextJob() {
  return db
    .select({
      job: schema.scanJobs,
      brand: schema.brands,
    })
    .from(schema.scanJobs)
    .innerJoin(schema.brands, eq(schema.scanJobs.brandId, schema.brands.id))
    .where(eq(schema.scanJobs.status, "queued"))
    .orderBy(schema.scanJobs.id)
    .limit(1)
    .get();
}

/**
 * Process a single scan job.
 */
async function processJob(
  job: typeof schema.scanJobs.$inferSelect,
  brand: typeof schema.brands.$inferSelect,
): Promise<void> {
  const startTime = Date.now();

  // Mark as running
  db.update(schema.scanJobs)
    .set({ status: "running", startedAt: new Date().toISOString() })
    .where(eq(schema.scanJobs.id, job.id))
    .run();

  try {
    // Run the scan with timeout
    const result = await Promise.race([
      runLightweightScan(brand.url, brand.productUrl ?? undefined),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout after 60s")), JOB_TIMEOUT_MS),
      ),
    ]);

    const duration = Date.now() - startTime;

    // Store scan result
    insertLightweightScan(brand.id, result);

    // Process changelog: compare with previous scan and apply confirmation rules
    let changelogCount = 0;
    try {
      const latestScan = getLatestLightweightScan(brand.id);
      if (latestScan) {
        const previousScan = getPreviousLightweightScan(brand.id, latestScan.scannedAt);
        if (previousScan) {
          changelogCount = processChangelog(brand.id, latestScan, previousScan);
          // Clean up pending changes for fields that reverted to their previous value
          cleanupRevertedPendingChanges(brand.id, latestScan, previousScan);
        }
      }
    } catch (changelogError) {
      console.error(
        `[scan-worker] changelog error for ${brand.slug}:`,
        changelogError instanceof Error ? changelogError.message : changelogError,
      );
    }

    // Mark job as completed
    db.update(schema.scanJobs)
      .set({
        status: "completed",
        scanDurationMs: duration,
        completedAt: new Date().toISOString(),
      })
      .where(eq(schema.scanJobs.id, job.id))
      .run();

    // Update run progress (include confirmed changelog changes)
    db.update(schema.scanRuns)
      .set({
        completedCount: sql`completed_count + 1`,
        changesDetected: sql`changes_detected + ${changelogCount}`,
      })
      .where(eq(schema.scanRuns.id, job.runId))
      .run();

    const blockedCount =
      result.userAgentTests?.filter(
        (t: { verdict: string }) => t.verdict === "blocked",
      ).length ?? 0;
    console.log(
      `[scan-worker] done ${brand.slug}: ${result.platform?.platform ?? "unknown"} | ${blockedCount} blocked | ${changelogCount} changes | ${duration}ms`,
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    // Mark job as failed
    db.update(schema.scanJobs)
      .set({
        status: "failed",
        error: errorMessage,
        scanDurationMs: duration,
        completedAt: new Date().toISOString(),
        retryCount: sql`retry_count + 1`,
      })
      .where(eq(schema.scanJobs.id, job.id))
      .run();

    // Update run progress
    db.update(schema.scanRuns)
      .set({
        failedCount: sql`failed_count + 1`,
      })
      .where(eq(schema.scanRuns.id, job.runId))
      .run();

    console.error(
      `[scan-worker] fail ${brand.slug}: ${errorMessage} (${duration}ms)`,
    );
  }
}

/**
 * Main worker tick — process one job, then schedule next.
 */
async function workerTick(): Promise<void> {
  if (!workerRunning) return;

  // Refresh lock heartbeat
  refreshLock();

  const next = getNextJob();
  if (!next) {
    // No more jobs — check if there's a running scan_run to complete
    const runningRun = db
      .select()
      .from(schema.scanRuns)
      .where(eq(schema.scanRuns.status, "running"))
      .get();

    if (runningRun) {
      // All jobs done — run drift checks before marking complete
      let driftReport: DriftReport | null = null;
      try {
        driftReport = runDriftChecks(runningRun.id);

        if (driftReport.alerts.length > 0) {
          const criticalCount = driftReport.alerts.filter(a => a.severity === "critical").length;
          const warningCount = driftReport.alerts.filter(a => a.severity === "warning").length;
          console.log(
            `[scan-worker] Drift check for run #${runningRun.id}: ${criticalCount} critical, ${warningCount} warning alerts`,
          );
          for (const alert of driftReport.alerts) {
            console.log(
              `[scan-worker]   [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`,
            );
          }
        } else {
          console.log(`[scan-worker] Drift check for run #${runningRun.id}: healthy, no alerts`);
        }
      } catch (driftError) {
        console.error(
          `[scan-worker] Drift check failed for run #${runningRun.id}:`,
          driftError instanceof Error ? driftError.message : driftError,
        );
      }

      // Mark run as completed and store drift report
      db.update(schema.scanRuns)
        .set({
          status: "completed",
          completedAt: new Date().toISOString(),
          driftReport: driftReport ? JSON.stringify(driftReport) : null,
        })
        .where(eq(schema.scanRuns.id, runningRun.id))
        .run();

      const duration = runningRun.startedAt
        ? Math.round(
            (Date.now() - new Date(runningRun.startedAt).getTime()) / 1000,
          )
        : 0;

      console.log(
        `[scan-worker] Run #${runningRun.id} completed: ${runningRun.completedCount + runningRun.failedCount} brands in ${duration}s (${runningRun.failedCount} failed)`,
      );
    }
    return;
  }

  await processJob(next.job, next.brand);

  // Brief pause between jobs
  await new Promise((r) => setTimeout(r, PAUSE_BETWEEN_JOBS_MS));
}

/**
 * Enqueue a new lightweight scan run for all active brands.
 * Returns the run ID.
 */
export function enqueueLightweightScan(): {
  runId: number;
  brandCount: number;
} {
  // Check if there's already an active run
  const activeRun = db
    .select()
    .from(schema.scanRuns)
    .where(eq(schema.scanRuns.status, "running"))
    .get();

  if (activeRun) {
    const remaining = db
      .select({ count: sql<number>`count(*)` })
      .from(schema.scanJobs)
      .where(
        and(
          eq(schema.scanJobs.runId, activeRun.id),
          eq(schema.scanJobs.status, "queued"),
        ),
      )
      .get();

    throw new Error(
      `Scan run #${activeRun.id} is already in progress (${remaining?.count ?? 0} jobs remaining)`,
    );
  }

  // Get all active brands
  const activeBrands = db
    .select({ id: schema.brands.id })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  // Create the run
  const run = db
    .insert(schema.scanRuns)
    .values({
      scanType: "lightweight",
      status: "running",
      totalBrands: activeBrands.length,
      startedAt: new Date().toISOString(),
    })
    .returning()
    .get();

  // Create jobs for each brand
  for (const brand of activeBrands) {
    db.insert(schema.scanJobs)
      .values({
        runId: run.id,
        brandId: brand.id,
        status: "queued",
      })
      .run();
  }

  console.log(
    `[scan-worker] Enqueued run #${run.id}: ${activeBrands.length} brands`,
  );

  return { runId: run.id, brandCount: activeBrands.length };
}

/**
 * Start the scan worker. Call once on app startup.
 */
export function startScanWorker(): void {
  if (workerRunning) {
    console.log("[scan-worker] Already running");
    return;
  }

  if (!acquireLock()) {
    console.log("[scan-worker] Another worker is active, skipping");
    return;
  }

  // Recover any stalled jobs from a previous crash
  recoverStalledJobs();

  workerRunning = true;
  console.log(`[scan-worker] Started (${WORKER_ID})`);

  // Run the worker loop
  workerInterval = setInterval(async () => {
    try {
      await workerTick();
    } catch (error) {
      console.error("[scan-worker] Tick error:", error);
    }
  }, WORKER_TICK_MS);
}

/**
 * Stop the scan worker.
 */
export function stopScanWorker(): void {
  workerRunning = false;
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
  }
  releaseLock();
  console.log("[scan-worker] Stopped");
}

/**
 * Get current scan health status for the dashboard.
 */
export function getScanHealth() {
  const now = new Date();
  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).toISOString();

  // Current/latest run
  const latestRun = db
    .select()
    .from(schema.scanRuns)
    .orderBy(sql`id DESC`)
    .limit(1)
    .get();

  // Today's run (if any)
  const todayRun = db
    .select()
    .from(schema.scanRuns)
    .where(sql`created_at >= ${todayStart}`)
    .orderBy(sql`id DESC`)
    .limit(1)
    .get();

  // Failed jobs from latest run
  const failedJobs = latestRun
    ? db
        .select({
          brandSlug: schema.brands.slug,
          brandName: schema.brands.name,
          error: schema.scanJobs.error,
        })
        .from(schema.scanJobs)
        .innerJoin(
          schema.brands,
          eq(schema.scanJobs.brandId, schema.brands.id),
        )
        .where(
          and(
            eq(schema.scanJobs.runId, latestRun.id),
            eq(schema.scanJobs.status, "failed"),
          ),
        )
        .all()
    : [];

  let failureReport: FailureReport | null = null;
  if (latestRun?.failureReport) {
    try {
      failureReport = JSON.parse(latestRun.failureReport) as FailureReport;
    } catch {
      // ignore parse errors
    }
  }

  const failedBrands =
    failedJobs.length > 0
      ? failedJobs
      : (failureReport?.failedBrands ?? []).map((brand) => ({
          brandSlug: brand.slug,
          brandName: brand.name,
          error: brand.error,
        }));

  // Data freshness: brands with scan data < 24 hours old
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  const totalBrands =
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.brands)
      .where(eq(schema.brands.active, true))
      .get()?.count ?? 0;

  const freshBrands =
    db
      .select({ count: sql<number>`count(DISTINCT brand_id)` })
      .from(schema.lightweightScans)
      .where(sql`scanned_at >= ${twentyFourHoursAgo}`)
      .get()?.count ?? 0;

  // Brands never scanned
  const neverScanned =
    db
      .select({ count: sql<number>`count(*)` })
      .from(schema.brands)
      .where(
        and(
          eq(schema.brands.active, true),
          sql`id NOT IN (SELECT DISTINCT brand_id FROM lightweight_scans)`,
        ),
      )
      .get()?.count ?? 0;

  // Last 7 days of runs
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const recentRuns = db
    .select()
    .from(schema.scanRuns)
    .where(sql`created_at >= ${sevenDaysAgo}`)
    .orderBy(sql`id DESC`)
    .all();

  // Parse drift report from the latest run (if available)
  let driftReport: DriftReport | null = null;
  if (latestRun?.driftReport) {
    try {
      driftReport = JSON.parse(latestRun.driftReport) as DriftReport;
    } catch {
      // ignore parse errors
    }
  }

  // Determine overall status
  let overallStatus: "green" | "yellow" | "red" = "green";
  if (!todayRun) overallStatus = "yellow";
  if (todayRun?.status === "failed") overallStatus = "red";
  if (neverScanned > 0) overallStatus = "yellow";
  if (totalBrands > 0 && freshBrands / totalBrands < 0.95)
    overallStatus = "yellow";
  if (totalBrands > 0 && freshBrands / totalBrands < 0.8)
    overallStatus = "red";

  // Drift alerts can escalate overall status
  if (driftReport && !driftReport.healthy) overallStatus = "red";
  else if (driftReport && driftReport.alerts.length > 0 && overallStatus === "green")
    overallStatus = "yellow";

  return {
    overallStatus,
    todayRun: todayRun
      ? {
          id: todayRun.id,
          status: todayRun.status,
          totalBrands: todayRun.totalBrands,
          completed: todayRun.completedCount,
          failed: todayRun.failedCount,
          startedAt: todayRun.startedAt,
          completedAt: todayRun.completedAt,
        }
      : null,
    latestRun: latestRun
      ? {
          id: latestRun.id,
          status: latestRun.status,
          totalBrands: latestRun.totalBrands,
          completed: latestRun.completedCount,
          failed: latestRun.failedCount,
          changesDetected: latestRun.changesDetected,
          startedAt: latestRun.startedAt,
          completedAt: latestRun.completedAt,
        }
      : null,
    driftReport,
    failedBrands,
    dataFreshness: {
      freshBrands,
      totalBrands,
      percentage:
        totalBrands > 0
          ? Math.round((freshBrands / totalBrands) * 100)
          : 0,
    },
    neverScanned,
    last7Days: recentRuns.map((r) => ({
      date: r.createdAt.split("T")[0],
      status: r.status,
      completed: r.completedCount,
      failed: r.failedCount,
      changes: r.changesDetected,
    })),
    workerActive: workerRunning,
  };
}
