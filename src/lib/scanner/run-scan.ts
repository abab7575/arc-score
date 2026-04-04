/**
 * One-shot scan runner — runs the entire daily lightweight scan start-to-finish
 * in a single process. No resident worker, no queue, no lock.
 *
 * Replaces the old enqueue → background-worker architecture.
 */

import { db, schema } from "@/lib/db";
import { eq, and, sql } from "drizzle-orm";
import { runLightweightScan } from "./lightweight-scanner";
import {
  insertLightweightScan,
  getLatestLightweightScan,
  getPreviousLightweightScan,
} from "@/lib/db/queries";
import { processChangelog, cleanupRevertedPendingChanges } from "./changelog-engine";
import { runDriftChecks, type DriftReport } from "./drift-detector";

const STALE_RUN_THRESHOLD_MS = 30 * 60 * 1000; // 30 min
const PER_BRAND_TIMEOUT_MS = 25_000;
const DEFAULT_CONCURRENCY = 25;

export interface ScanSummary {
  runId: number;
  totalBrands: number;
  completed: number;
  failed: number;
  changesDetected: number;
  durationSec: number;
  driftAlerts: number;
}

/**
 * Abandon any "running" scan runs whose last activity exceeds the stale threshold.
 * Called at the start of a new run so stuck state never blocks future scans.
 */
function abandonStaleRuns(): number {
  const cutoff = new Date(Date.now() - STALE_RUN_THRESHOLD_MS).toISOString();

  const stale = db
    .select()
    .from(schema.scanRuns)
    .where(
      and(
        eq(schema.scanRuns.status, "running"),
        sql`COALESCE(started_at, created_at) < ${cutoff}`,
      ),
    )
    .all();

  if (stale.length === 0) return 0;

  for (const run of stale) {
    db.update(schema.scanRuns)
      .set({
        status: "abandoned",
        completedAt: new Date().toISOString(),
      })
      .where(eq(schema.scanRuns.id, run.id))
      .run();
    console.log(`[run-scan] Abandoned stale run #${run.id} (started ${run.startedAt})`);
  }

  return stale.length;
}

/**
 * Run the daily lightweight scan across all active brands.
 * Bounded, synchronous, completes in 5-10 minutes.
 */
export async function runScanOnce(options: { concurrency?: number } = {}): Promise<ScanSummary> {
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const startTime = Date.now();

  // 1. Abandon any stuck prior runs
  abandonStaleRuns();

  // 2. Refuse to start if another run is genuinely in progress (should be rare now)
  const activeRun = db
    .select()
    .from(schema.scanRuns)
    .where(eq(schema.scanRuns.status, "running"))
    .get();

  if (activeRun) {
    throw new Error(
      `Scan run #${activeRun.id} is still active and not yet stale. Wait or abandon manually.`,
    );
  }

  // 3. Pull active brands
  const brands = db
    .select({
      id: schema.brands.id,
      slug: schema.brands.slug,
      name: schema.brands.name,
      url: schema.brands.url,
      productUrl: schema.brands.productUrl,
    })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  if (brands.length === 0) {
    throw new Error("No active brands to scan.");
  }

  // 4. Create new run record
  const run = db
    .insert(schema.scanRuns)
    .values({
      scanType: "lightweight",
      status: "running",
      totalBrands: brands.length,
      startedAt: new Date().toISOString(),
    })
    .returning()
    .get();

  console.log(`[run-scan] Run #${run.id} started: ${brands.length} brands, concurrency=${concurrency}`);

  let completed = 0;
  let failed = 0;
  let changesDetected = 0;

  // 5. Process brands with a proper concurrency pool (always N in flight,
  // never waiting on a batch to drain).
  const brandQueue = [...brands];
  const progressLogEvery = 100;
  let lastLoggedMilestone = 0;

  async function processOne(brand: typeof brands[number]): Promise<void> {
    try {
      const result = await Promise.race([
        runLightweightScan(brand.url, brand.productUrl ?? undefined),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Timeout after ${PER_BRAND_TIMEOUT_MS / 1000}s`)),
            PER_BRAND_TIMEOUT_MS,
          ),
        ),
      ]);

      insertLightweightScan(brand.id, result);

      try {
        const latest = getLatestLightweightScan(brand.id);
        if (latest) {
          const previous = getPreviousLightweightScan(brand.id, latest.scannedAt);
          if (previous) {
            const brandChanges = processChangelog(brand.id, latest, previous);
            changesDetected += brandChanges;
            cleanupRevertedPendingChanges(brand.id, latest, previous);
          }
        }
      } catch (changelogError) {
        console.error(
          `[run-scan] changelog error for ${brand.slug}:`,
          changelogError instanceof Error ? changelogError.message : changelogError,
        );
      }

      completed++;
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[run-scan] fail ${brand.slug}: ${msg}`);
    }

    // Incremental progress writes to DB every 50 brands so dashboards can
    // observe progress without requiring the full run to finish.
    const done = completed + failed;
    if (done - lastLoggedMilestone >= progressLogEvery) {
      lastLoggedMilestone = done;
      const pct = Math.round((done / brands.length) * 100);
      console.log(`[run-scan] ${done}/${brands.length} (${pct}%) — ok:${completed} fail:${failed}`);
      db.update(schema.scanRuns)
        .set({ completedCount: completed, failedCount: failed, changesDetected })
        .where(eq(schema.scanRuns.id, run.id))
        .run();
    }
  }

  async function worker(): Promise<void> {
    while (brandQueue.length > 0) {
      const brand = brandQueue.shift();
      if (!brand) return;
      await processOne(brand);
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  // 6. Drift checks
  let driftReport: DriftReport | null = null;
  let driftAlerts = 0;
  try {
    driftReport = runDriftChecks(run.id);
    driftAlerts = driftReport.alerts.length;
    console.log(
      `[run-scan] Drift: ${driftAlerts} alerts (${driftReport.alerts.filter((a) => a.severity === "critical").length} critical)`,
    );
  } catch (e) {
    console.error(`[run-scan] drift check failed:`, e instanceof Error ? e.message : e);
  }

  // 7. Mark run complete
  const durationSec = Math.round((Date.now() - startTime) / 1000);
  db.update(schema.scanRuns)
    .set({
      status: "completed",
      completedAt: new Date().toISOString(),
      completedCount: completed,
      failedCount: failed,
      changesDetected,
      driftReport: driftReport ? JSON.stringify(driftReport) : null,
    })
    .where(eq(schema.scanRuns.id, run.id))
    .run();

  console.log(
    `[run-scan] Run #${run.id} complete: ${completed}/${brands.length} ok, ${failed} failed, ${changesDetected} changes, ${durationSec}s`,
  );

  return {
    runId: run.id,
    totalBrands: brands.length,
    completed,
    failed,
    changesDetected,
    durationSec,
    driftAlerts,
  };
}
