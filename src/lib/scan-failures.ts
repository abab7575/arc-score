/**
 * Failure forensics over recent scan runs. Failure reports are stored per
 * run (scan_runs.failure_report); this rolls them up so /reliability can
 * show why scans fail and which brands fail persistently.
 */

import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";

interface FailedBrand {
  brandId: number;
  slug: string;
  name: string;
  error: string;
}

export interface FailureBucket {
  error: string;
  count: number;
}

export interface RepeatOffender {
  slug: string;
  name: string;
  lastError: string;
  consecutiveRuns: number;
}

export interface FailureInsights {
  latestRunId: number | null;
  latestBuckets: FailureBucket[];
  runsExamined: number;
  repeatOffenders: RepeatOffender[];
}

export function getFailureInsights(maxRuns: number = 7): FailureInsights {
  const runs = db
    .select({
      id: schema.scanRuns.id,
      status: schema.scanRuns.status,
      failureReport: schema.scanRuns.failureReport,
    })
    .from(schema.scanRuns)
    .where(eq(schema.scanRuns.status, "completed"))
    .orderBy(desc(schema.scanRuns.id))
    .limit(maxRuns)
    .all();

  const perRunFailures: Array<Map<string, FailedBrand>> = runs.map((r) => {
    const map = new Map<string, FailedBrand>();
    if (!r.failureReport) return map;
    try {
      const report = JSON.parse(r.failureReport) as { failedBrands?: FailedBrand[] };
      for (const fb of report.failedBrands ?? []) {
        map.set(fb.slug, fb);
      }
    } catch {
      // unparseable report — treat as no data
    }
    return map;
  });

  // Buckets from the latest completed run
  let latestBuckets: FailureBucket[] = [];
  if (runs[0]?.failureReport) {
    try {
      const report = JSON.parse(runs[0].failureReport) as { errorCounts?: FailureBucket[] };
      latestBuckets = (report.errorCounts ?? []).slice(0, 15);
    } catch {
      latestBuckets = [];
    }
  }

  // Consecutive failures counted from the most recent run backwards
  const repeatOffenders: RepeatOffender[] = [];
  if (perRunFailures.length > 0) {
    for (const [slug, fb] of perRunFailures[0]) {
      let streak = 1;
      for (let i = 1; i < perRunFailures.length; i++) {
        if (perRunFailures[i].has(slug)) streak += 1;
        else break;
      }
      repeatOffenders.push({
        slug,
        name: fb.name,
        lastError: fb.error,
        consecutiveRuns: streak,
      });
    }
    repeatOffenders.sort((a, b) => b.consecutiveRuns - a.consecutiveRuns || a.slug.localeCompare(b.slug));
  }

  return {
    latestRunId: runs[0]?.id ?? null,
    latestBuckets,
    runsExamined: runs.length,
    repeatOffenders,
  };
}
