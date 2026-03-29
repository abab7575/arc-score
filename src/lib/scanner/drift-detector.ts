/**
 * Drift Detector — Post-run anomaly detection for scan integrity.
 *
 * After each scan run completes, this module checks for signs that the
 * scanner itself is broken rather than the brands having changed:
 *
 * 1. Volume anomaly: >20% of brands changed the same field on the same day
 * 2. Completion rate: dropped below 95%
 * 3. Inconclusive rate: >10% of brands failed or had inconclusive results
 * 4. Flagship consistency: priority alert when a flagship brand's status changes
 */

import { db, schema } from "@/lib/db";
import { eq, and, sql, gte } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────

interface DriftAlert {
  type: "volume_anomaly" | "low_completion" | "high_inconclusive" | "flagship_change";
  severity: "warning" | "critical";
  message: string;
  details?: string;
}

export interface DriftReport {
  runId: number;
  alerts: DriftAlert[];
  metrics: {
    completionRate: number;
    failedCount: number;
    inconclusiveRate: number;
    changesDetected: number;
    flagshipChanges: string[];
  };
  healthy: boolean;
}

// ── Flagship Brands ──────────────────────────────────────────────────

const FLAGSHIP_SLUGS: string[] = [
  "nike", "amazon", "apple", "walmart", "target",
  "costco", "sephora", "nordstrom", "macys", "best-buy",
  "home-depot", "lowes", "wayfair", "zappos", "gap",
  "old-navy", "hm", "zara", "uniqlo", "adidas",
  "puma", "new-balance", "under-armour", "lululemon", "patagonia",
  "rei", "the-north-face", "columbia", "ikea", "williams-sonoma",
  "pottery-barn", "crate-and-barrel", "west-elm", "bed-bath-beyond", "ulta",
  "bath-and-body-works", "victorias-secret", "coach", "kate-spade", "michael-kors",
  "tiffany", "gucci", "louis-vuitton", "burberry", "ralph-lauren",
  "tommy-hilfiger", "calvin-klein", "levis", "crocs", "allbirds",
];

// ── Thresholds ───────────────────────────────────────────────────────

const VOLUME_ANOMALY_THRESHOLD = 0.20; // >20% of brands changed same field
const COMPLETION_RATE_THRESHOLD = 0.95; // <95% completion is suspicious
const INCONCLUSIVE_RATE_THRESHOLD = 0.10; // >10% inconclusive/failed is suspicious

// ── Main Entry Point ────────────────────────────────────────────────

export function runDriftChecks(runId: number): DriftReport {
  const alerts: DriftAlert[] = [];

  // Load the run
  const run = db
    .select()
    .from(schema.scanRuns)
    .where(eq(schema.scanRuns.id, runId))
    .get();

  if (!run) {
    return {
      runId,
      alerts: [{
        type: "low_completion",
        severity: "critical",
        message: `Scan run #${runId} not found`,
      }],
      metrics: {
        completionRate: 0,
        failedCount: 0,
        inconclusiveRate: 0,
        changesDetected: 0,
        flagshipChanges: [],
      },
      healthy: false,
    };
  }

  const totalBrands = run.totalBrands;
  const completedCount = run.completedCount;
  const failedCount = run.failedCount;
  const changesDetected = run.changesDetected;

  // ── 1. Completion Rate Check ──────────────────────────────────────

  const completionRate = totalBrands > 0
    ? completedCount / totalBrands
    : 0;

  if (completionRate < COMPLETION_RATE_THRESHOLD) {
    const severity = completionRate < 0.80 ? "critical" : "warning";
    alerts.push({
      type: "low_completion",
      severity,
      message: `Completion rate ${(completionRate * 100).toFixed(1)}% is below ${COMPLETION_RATE_THRESHOLD * 100}% threshold`,
      details: `${completedCount}/${totalBrands} completed, ${failedCount} failed`,
    });
  }

  // ── 2. Inconclusive / Failed Rate Check ───────────────────────────

  // Count jobs with "failed" status for this run
  const failedJobs = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(schema.scanJobs)
    .where(
      and(
        eq(schema.scanJobs.runId, runId),
        eq(schema.scanJobs.status, "failed"),
      ),
    )
    .get();

  const actualFailedCount = failedJobs?.count ?? 0;
  const inconclusiveRate = totalBrands > 0
    ? actualFailedCount / totalBrands
    : 0;

  if (inconclusiveRate > INCONCLUSIVE_RATE_THRESHOLD) {
    const severity = inconclusiveRate > 0.25 ? "critical" : "warning";
    alerts.push({
      type: "high_inconclusive",
      severity,
      message: `Inconclusive/failed rate ${(inconclusiveRate * 100).toFixed(1)}% exceeds ${INCONCLUSIVE_RATE_THRESHOLD * 100}% threshold`,
      details: `${actualFailedCount} of ${totalBrands} brands failed or returned inconclusive results`,
    });
  }

  // ── 3. Volume Anomaly Check ───────────────────────────────────────
  // If >20% of brands show the same field change on the same day,
  // the scanner is probably broken — not the brands.

  const todayStart = getTodayStart();

  const fieldChangeCounts = db
    .select({
      field: schema.changelogEntries.field,
      count: sql<number>`count(DISTINCT brand_id)`,
    })
    .from(schema.changelogEntries)
    .where(gte(schema.changelogEntries.detectedAt, todayStart))
    .groupBy(schema.changelogEntries.field)
    .all();

  for (const { field, count } of fieldChangeCounts) {
    const changeRate = totalBrands > 0 ? count / totalBrands : 0;
    if (changeRate > VOLUME_ANOMALY_THRESHOLD) {
      alerts.push({
        type: "volume_anomaly",
        severity: "critical",
        message: `${count} brands (${(changeRate * 100).toFixed(1)}%) changed "${field}" today — likely a scanner issue, not real changes`,
        details: `Threshold: ${VOLUME_ANOMALY_THRESHOLD * 100}% of ${totalBrands} brands = ${Math.ceil(totalBrands * VOLUME_ANOMALY_THRESHOLD)} brands`,
      });
    }
  }

  // ── 4. Flagship Consistency Check ─────────────────────────────────
  // Look for changelog entries today for any flagship brand.

  const flagshipBrands = db
    .select({ id: schema.brands.id, slug: schema.brands.slug })
    .from(schema.brands)
    .where(sql`slug IN (${sql.join(FLAGSHIP_SLUGS.map(s => sql`${s}`), sql`, `)})`)
    .all();

  const flagshipIdToSlug = new Map(flagshipBrands.map(b => [b.id, b.slug]));
  const flagshipIds = flagshipBrands.map(b => b.id);

  const flagshipChanges: string[] = [];

  if (flagshipIds.length > 0) {
    const flagshipChangeRows = db
      .select({
        brandId: schema.changelogEntries.brandId,
        field: schema.changelogEntries.field,
        oldValue: schema.changelogEntries.oldValue,
        newValue: schema.changelogEntries.newValue,
      })
      .from(schema.changelogEntries)
      .where(
        and(
          gte(schema.changelogEntries.detectedAt, todayStart),
          sql`brand_id IN (${sql.join(flagshipIds.map(id => sql`${id}`), sql`, `)})`,
        ),
      )
      .all();

    for (const change of flagshipChangeRows) {
      const slug = flagshipIdToSlug.get(change.brandId) ?? `brand-${change.brandId}`;
      flagshipChanges.push(`${slug}: ${change.field} (${change.oldValue ?? "null"} -> ${change.newValue ?? "null"})`);
    }

    if (flagshipChanges.length > 0) {
      alerts.push({
        type: "flagship_change",
        severity: "warning",
        message: `${flagshipChanges.length} flagship brand change(s) detected — review for accuracy`,
        details: flagshipChanges.join("; "),
      });
    }
  }

  // ── Build Report ──────────────────────────────────────────────────

  const healthy = alerts.filter(a => a.severity === "critical").length === 0;

  const report: DriftReport = {
    runId,
    alerts,
    metrics: {
      completionRate: Math.round(completionRate * 1000) / 10, // e.g. 98.5
      failedCount: actualFailedCount,
      inconclusiveRate: Math.round(inconclusiveRate * 1000) / 10, // e.g. 3.2
      changesDetected,
      flagshipChanges,
    },
    healthy,
  };

  return report;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getTodayStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}
