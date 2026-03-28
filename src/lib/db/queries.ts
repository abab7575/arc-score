import { db, schema } from "./index";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";
import type { ScanReport } from "@/types/report";
import type { LightweightScanResult } from "@/lib/scanner/lightweight-scanner";

export interface BrandWithLatestScore {
  id: number;
  slug: string;
  name: string;
  url: string;
  category: string;
  latestScore: number | null;
  latestGrade: string | null;
  previousScore: number | null;
  scannedAt: string | null;
  categoryScores: { categoryId: string; score: number }[];
  scoreHistory: { date: string; score: number }[];
  aiAgentScores?: Record<string, number>;
}

export function getAllBrandsWithLatestScores(): BrandWithLatestScore[] {
  const brands = db.select().from(schema.brands).where(eq(schema.brands.active, true)).all();

  return brands.map((brand) => {
    // Get the two most recent scans for this brand
    const recentScans = db
      .select({
        id: schema.scans.id,
        overallScore: schema.scans.overallScore,
        grade: schema.scans.grade,
        scannedAt: schema.scans.scannedAt,
        reportJson: schema.scans.reportJson,
      })
      .from(schema.scans)
      .where(eq(schema.scans.brandId, brand.id))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(2)
      .all();

    const latest = recentScans[0] ?? null;
    const previous = recentScans[1] ?? null;

    // Get category scores for the latest scan
    let catScores: { categoryId: string; score: number }[] = [];
    if (latest) {
      catScores = db
        .select({
          categoryId: schema.categoryScores.categoryId,
          score: schema.categoryScores.score,
        })
        .from(schema.categoryScores)
        .where(eq(schema.categoryScores.scanId, latest.id))
        .all();
    }

    // Get last 7 scores for sparkline
    const history = db
      .select({
        date: schema.scans.scannedAt,
        score: schema.scans.overallScore,
      })
      .from(schema.scans)
      .where(eq(schema.scans.brandId, brand.id))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(7)
      .all()
      .reverse();

    // Extract aiAgentScores from the report JSON if present
    let aiAgentScores: Record<string, number> | undefined;
    if (latest?.reportJson) {
      try {
        const report = JSON.parse(latest.reportJson);
        if (report.aiAgentScores) {
          aiAgentScores = report.aiAgentScores;
        }
      } catch {
        // ignore parse errors
      }
    }

    return {
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      url: brand.url,
      category: brand.category,
      latestScore: latest?.overallScore ?? null,
      latestGrade: latest?.grade ?? null,
      previousScore: previous?.overallScore ?? null,
      scannedAt: latest?.scannedAt ?? null,
      categoryScores: catScores,
      scoreHistory: history,
      aiAgentScores,
    };
  });
}

export function getScoreHistory(brandId: number, days: number = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db
    .select({
      date: schema.scans.scannedAt,
      score: schema.scans.overallScore,
      grade: schema.scans.grade,
    })
    .from(schema.scans)
    .where(
      and(
        eq(schema.scans.brandId, brandId),
        gte(schema.scans.scannedAt, cutoff.toISOString())
      )
    )
    .orderBy(schema.scans.scannedAt)
    .all();
}

export function getBrandBySlug(slug: string) {
  return db
    .select()
    .from(schema.brands)
    .where(eq(schema.brands.slug, slug))
    .get();
}

export function getFullScanReport(scanId: number): ScanReport | null {
  const scan = db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.id, scanId))
    .get();

  if (!scan) return null;
  try {
    return JSON.parse(scan.reportJson) as ScanReport;
  } catch {
    console.error(`Failed to parse reportJson for scan ${scanId}`);
    return null;
  }
}

export function getLatestScanForBrand(brandId: number) {
  return db
    .select()
    .from(schema.scans)
    .where(eq(schema.scans.brandId, brandId))
    .orderBy(desc(schema.scans.scannedAt))
    .limit(1)
    .get();
}

export function insertScan(
  brandId: number,
  report: ScanReport
): number {
  const result = db
    .insert(schema.scans)
    .values({
      brandId,
      overallScore: report.overallScore,
      grade: report.grade,
      verdict: report.verdict,
      comparison: report.comparison,
      reportJson: JSON.stringify(report),
      scannedAt: report.scannedAt,
    })
    .returning({ id: schema.scans.id })
    .get();

  const scanId = result.id;

  // Insert category scores
  for (const cat of report.categories) {
    db.insert(schema.categoryScores).values({
      scanId,
      categoryId: cat.id,
      score: cat.score,
      grade: cat.grade,
      summary: cat.summary,
    }).run();
  }

  // Insert findings
  for (const finding of report.findings) {
    db.insert(schema.findings).values({
      scanId,
      severity: finding.severity,
      category: finding.category,
      title: finding.title,
      whatHappened: finding.whatHappened,
      whyItMatters: finding.whyItMatters,
      fixJson: JSON.stringify(finding.fix),
      priority: finding.priority,
      effort: finding.effort,
      estimatedPointsGain: finding.estimatedPointsGain,
    }).run();
  }

  // Insert journey steps and agent summaries
  for (const journey of report.journeys) {
    db.insert(schema.agentSummaries).values({
      scanId,
      agentType: journey.agentType,
      overallResult: journey.overallResult,
      narrative: journey.narrative,
    }).run();

    for (const step of journey.steps) {
      db.insert(schema.journeySteps).values({
        scanId,
        agentType: journey.agentType,
        stepNumber: step.stepNumber,
        action: step.action,
        description: step.description,
        result: step.result,
        narration: step.narration,
        screenshotUrl: step.screenshotUrl,
        thought: step.thought,
        duration: step.duration,
      }).run();
    }
  }

  return scanId;
}

export function insertSubmission(data: {
  brandName: string;
  url: string;
  productUrl?: string;
  category?: string;
  email?: string;
}) {
  return db
    .insert(schema.submissions)
    .values({
      brandName: data.brandName,
      url: data.url,
      productUrl: data.productUrl,
      category: data.category,
      email: data.email,
    })
    .returning({ id: schema.submissions.id })
    .get();
}

/**
 * Compute real percentile for a given score against all latest scans in the DB.
 * Returns { totalBrands, brandsBelowScore } so the caller can format it.
 */
export function getPercentileData(overallScore: number): { totalBrands: number; brandsBelowScore: number } {
  const result = db
    .select({
      totalBrands: sql<number>`COUNT(*)`,
      brandsBelowScore: sql<number>`COUNT(CASE WHEN overall_score < ${overallScore} THEN 1 END)`,
    })
    .from(schema.scans)
    .where(
      sql`id IN (SELECT MAX(id) FROM ${schema.scans} GROUP BY brand_id)`
    )
    .get();

  return {
    totalBrands: result?.totalBrands ?? 0,
    brandsBelowScore: result?.brandsBelowScore ?? 0,
  };
}

export function formatPercentileComparison(overallScore: number): string {
  const { totalBrands, brandsBelowScore } = getPercentileData(overallScore);
  if (totalBrands <= 1) {
    return "First brand scanned — more comparisons coming soon";
  }
  return `Scored higher than ${brandsBelowScore} of ${totalBrands} brands we've scanned`;
}

export function getAllScansForBrand(brandId: number) {
  return db
    .select({
      id: schema.scans.id,
      overallScore: schema.scans.overallScore,
      grade: schema.scans.grade,
      scannedAt: schema.scans.scannedAt,
    })
    .from(schema.scans)
    .where(eq(schema.scans.brandId, brandId))
    .orderBy(desc(schema.scans.scannedAt))
    .all();
}

// ── Lightweight Scan Queries ────────────────────────────────────────

export function insertLightweightScan(brandId: number, result: LightweightScanResult) {
  const agentStatus: Record<string, string> = {};
  for (const agent of result.robotsTxt.allowedAgents) {
    agentStatus[agent] = "allowed";
  }
  for (const agent of result.robotsTxt.blockedAgents) {
    agentStatus[agent] = "blocked";
  }
  // Agents not mentioned get "no_rule"
  const allAgents = ["GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-Web", "PerplexityBot", "Google-Extended", "CCBot", "Amazonbot"];
  for (const agent of allAgents) {
    if (!agentStatus[agent]) {
      agentStatus[agent] = "no_rule";
    }
  }

  // Enrich agent status with UA test results (more authoritative than robots.txt)
  for (const test of result.userAgentTests) {
    if (test.verdict === "blocked" && agentStatus[test.userAgent] !== "blocked") {
      agentStatus[test.userAgent] = "blocked";
    }
  }

  const blockedCount = Object.values(agentStatus).filter(v => v === "blocked").length;
  const allowedCount = Object.values(agentStatus).filter(v => v !== "blocked").length;

  return db
    .insert(schema.lightweightScans)
    .values({
      brandId,
      robotsTxtFound: result.robotsTxt.found,
      blockedAgentCount: blockedCount,
      allowedAgentCount: allowedCount,
      platform: result.platform.platform,
      cdn: result.cdn.cdn,
      waf: result.waf.waf,
      hasJsonLd: result.jsonLd.found,
      hasSchemaProduct: result.schemaOrg.found,
      hasOpenGraph: result.openGraph.found,
      hasSitemap: result.sitemap.found,
      hasProductFeed: result.feeds.some(f => f.found),
      hasLlmsTxt: result.llmsTxt.found,
      hasUcp: result.ucpFile.found,
      homepageResponseMs: result.responseTime.homepage,
      resultJson: JSON.stringify(result),
      agentStatusJson: JSON.stringify(agentStatus),
      scannedAt: result.scannedAt,
    })
    .returning({ id: schema.lightweightScans.id })
    .get();
}

export function getLatestLightweightScan(brandId: number) {
  return db
    .select()
    .from(schema.lightweightScans)
    .where(eq(schema.lightweightScans.brandId, brandId))
    .orderBy(desc(schema.lightweightScans.scannedAt))
    .limit(1)
    .get();
}

export function getLightweightScanHistory(brandId: number, days: number = 90) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return db
    .select()
    .from(schema.lightweightScans)
    .where(
      and(
        eq(schema.lightweightScans.brandId, brandId),
        gte(schema.lightweightScans.scannedAt, cutoff.toISOString())
      )
    )
    .orderBy(desc(schema.lightweightScans.scannedAt))
    .all();
}

export function getMatrixData() {
  // Get the latest lightweight scan for each brand using a subquery
  const latestScans = db
    .select()
    .from(schema.lightweightScans)
    .where(
      sql`id IN (SELECT MAX(id) FROM lightweight_scans GROUP BY brand_id)`
    )
    .all();

  const brands = db
    .select()
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  const scanByBrandId = new Map(latestScans.map(s => [s.brandId, s]));

  return brands.map(brand => ({
    brand: {
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      url: brand.url,
      category: brand.category,
    },
    scan: scanByBrandId.get(brand.id) ?? null,
  }));
}

export function getRecentChangelog(limit: number = 50) {
  return db
    .select({
      id: schema.changelogEntries.id,
      brandId: schema.changelogEntries.brandId,
      field: schema.changelogEntries.field,
      oldValue: schema.changelogEntries.oldValue,
      newValue: schema.changelogEntries.newValue,
      detectedAt: schema.changelogEntries.detectedAt,
    })
    .from(schema.changelogEntries)
    .orderBy(desc(schema.changelogEntries.detectedAt))
    .limit(limit)
    .all();
}

export function getChangelogForBrand(brandId: number, limit: number = 50) {
  return db
    .select()
    .from(schema.changelogEntries)
    .where(eq(schema.changelogEntries.brandId, brandId))
    .orderBy(desc(schema.changelogEntries.detectedAt))
    .limit(limit)
    .all();
}

export function insertChangelogEntry(brandId: number, field: string, oldValue: string | null, newValue: string | null) {
  return db
    .insert(schema.changelogEntries)
    .values({ brandId, field, oldValue, newValue })
    .run();
}

export function getPreviousLightweightScan(brandId: number, beforeDate: string) {
  return db
    .select()
    .from(schema.lightweightScans)
    .where(
      and(
        eq(schema.lightweightScans.brandId, brandId),
        lt(schema.lightweightScans.scannedAt, beforeDate)
      )
    )
    .orderBy(desc(schema.lightweightScans.scannedAt))
    .limit(1)
    .get();
}
