import { db, schema } from "./index";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import type { ScanReport } from "@/types/report";

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
  return JSON.parse(scan.reportJson) as ScanReport;
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
