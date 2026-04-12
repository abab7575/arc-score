/**
 * Outreach queue generator backed by live lightweight scan signals.
 *
 * The legacy full-scan score pipeline is no longer refreshed daily, so
 * outreach needs to derive from the data customers actually see today:
 * agent access, machine-readable signals, and recent changelog movement.
 */

import { db, schema } from "@/lib/db/index";
import { and, desc, eq, gte, sql } from "drizzle-orm";

interface OutreachEmail {
  brandId: number;
  brandName: string;
  brandUrl: string;
  brandSlug: string;
  score: number;
  grade: string;
  issueCount: number;
  topIssues: string[];
  subject: string;
  body: string;
  reportUrl: string;
  validationWarnings: string[];
}

interface GenerationStats {
  generated: number;
  skippedStale: number;
  skippedNoScan: number;
  skippedNoFindings: number;
  validationWarnings: number;
}

interface LatestSignalRow {
  brandId: number;
  brandName: string;
  brandSlug: string;
  brandUrl: string;
  category: string;
  blockedAgentCount: number;
  allowedAgentCount: number;
  platform: string | null;
  cdn: string | null;
  waf: string | null;
  hasJsonLd: boolean;
  hasSchemaProduct: boolean;
  hasOpenGraph: boolean;
  hasSitemap: boolean;
  hasProductFeed: boolean;
  hasLlmsTxt: boolean;
  hasAgentsTxt: boolean;
  hasUcp: boolean;
  homepageResponseMs: number | null;
  scannedAt: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreToGrade(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

function computeSignalScore(scan: LatestSignalRow, recentChangeCount: number): number {
  let score = 100;

  score -= Math.min(60, scan.blockedAgentCount * 8);
  if (!scan.hasSchemaProduct) score -= 18;
  if (!scan.hasJsonLd) score -= 8;
  if (!scan.hasProductFeed) score -= 14;
  if (!scan.hasLlmsTxt && !scan.hasAgentsTxt) score -= 10;
  if (!scan.hasSitemap) score -= 6;
  if (!scan.hasUcp) score -= 4;
  if (scan.homepageResponseMs && scan.homepageResponseMs > 2500) score -= 6;
  if (scan.waf && scan.waf !== "none-detected" && scan.blockedAgentCount >= 2) score -= 10;
  score -= Math.min(10, recentChangeCount * 2);

  return clamp(score, 0, 100);
}

function buildIssues(scan: LatestSignalRow): string[] {
  const issues: string[] = [];

  if (scan.blockedAgentCount >= 5) {
    issues.push(`Blocks ${scan.blockedAgentCount} of 8 tracked AI agent identities`);
  } else if (scan.blockedAgentCount >= 2) {
    issues.push(`${scan.blockedAgentCount} tracked AI agent identities are currently blocked`);
  } else if (scan.blockedAgentCount === 1) {
    issues.push(`One tracked AI agent identity is explicitly blocked`);
  }

  if (!scan.hasSchemaProduct && !scan.hasJsonLd) {
    issues.push("No machine-readable product schema detected on the site");
  } else if (!scan.hasSchemaProduct) {
    issues.push("Schema.org Product markup is missing");
  } else if (!scan.hasJsonLd) {
    issues.push("JSON-LD product data is incomplete");
  }

  if (!scan.hasProductFeed) {
    issues.push("No product feed was discovered for fast catalog ingestion");
  }

  if (!scan.hasLlmsTxt && !scan.hasAgentsTxt) {
    issues.push("No llms.txt or agent declaration file is published");
  }

  if (!scan.hasSitemap) {
    issues.push("No sitemap was discovered for automated discovery");
  }

  if (!scan.hasUcp) {
    issues.push("No agent-native checkout endpoint was detected");
  }

  if (scan.homepageResponseMs && scan.homepageResponseMs > 2500) {
    issues.push(`Homepage response time is slow (${scan.homepageResponseMs}ms) for automated discovery`);
  }

  if (scan.waf && scan.waf !== "none-detected" && scan.blockedAgentCount >= 2) {
    issues.push(`Security layer (${scan.waf}) appears to be restricting agent traffic`);
  }

  return issues;
}

function generateSubject(
  brandName: string,
  blockedAgentCount: number,
  issues: string[],
  recentChangeFields: string[],
): string {
  if (recentChangeFields.length > 0 && blockedAgentCount > 0) {
    return `${brandName}: ARC detected new AI-agent access friction in the latest scan`;
  }
  if (blockedAgentCount >= 4) {
    return `${brandName}: multiple AI shopping agents are being blocked`;
  }
  if (issues.some((issue) => issue.includes("product feed")) && issues.some((issue) => issue.includes("schema"))) {
    return `${brandName}: key machine-readable commerce signals are missing`;
  }
  return `${brandName}: ARC found ${issues.length} AI-commerce gaps in the latest scan`;
}

function generateBody(
  scan: LatestSignalRow,
  issues: string[],
  reportUrl: string,
  recentChangeFields: string[],
): string {
  const issueList = issues.slice(0, 4).map((issue, index) => `${index + 1}. ${issue}`).join("\n");

  const changeLine = recentChangeFields.length > 0
    ? `\nRecent movement detected: ${recentChangeFields.join(", ")}.\n`
    : "\n";

  const currentReadout = [
    `${scan.allowedAgentCount} tracked agent identities served without explicit policy friction`,
    scan.platform ? `platform: ${scan.platform}` : null,
    scan.cdn ? `cdn: ${scan.cdn}` : null,
  ].filter(Boolean).join(" | ");

  return `Hey —

ARC's latest live scan of ${scan.brandUrl} surfaced a few issues that make it harder for AI shopping agents to discover products and act on them.
${changeLine}
What we saw:

${issueList}

Current readout: ${currentReadout}

Live public readout: ${reportUrl}

If helpful, I can send the 3 fixes we'd prioritize first based on the scan.

Cheers,
Andy
Founder, ARC Report
arcreport.ai`;
}

export function generateSignalOutreachQueue(options: {
  maxScore?: number;
  category?: string;
  limit?: number;
  staleAfterHours?: number;
}): { items: OutreachEmail[]; stats: GenerationStats } {
  const {
    maxScore = 65,
    category,
    limit = 25,
    staleAfterHours = 72,
  } = options;

  const stats: GenerationStats = {
    generated: 0,
    skippedStale: 0,
    skippedNoScan: 0,
    skippedNoFindings: 0,
    validationWarnings: 0,
  };

  const existingBrandIds = new Set(
    db.select({ brandId: schema.outreach.brandId }).from(schema.outreach).all().map((row) => row.brandId),
  );

  const latestScans = db
    .select({
      brandId: schema.lightweightScans.brandId,
      brandName: schema.brands.name,
      brandSlug: schema.brands.slug,
      brandUrl: schema.brands.url,
      category: schema.brands.category,
      blockedAgentCount: schema.lightweightScans.blockedAgentCount,
      allowedAgentCount: schema.lightweightScans.allowedAgentCount,
      platform: schema.lightweightScans.platform,
      cdn: schema.lightweightScans.cdn,
      waf: schema.lightweightScans.waf,
      hasJsonLd: schema.lightweightScans.hasJsonLd,
      hasSchemaProduct: schema.lightweightScans.hasSchemaProduct,
      hasOpenGraph: schema.lightweightScans.hasOpenGraph,
      hasSitemap: schema.lightweightScans.hasSitemap,
      hasProductFeed: schema.lightweightScans.hasProductFeed,
      hasLlmsTxt: schema.lightweightScans.hasLlmsTxt,
      hasAgentsTxt: schema.lightweightScans.hasAgentsTxt,
      hasUcp: schema.lightweightScans.hasUcp,
      homepageResponseMs: schema.lightweightScans.homepageResponseMs,
      scannedAt: schema.lightweightScans.scannedAt,
    })
    .from(schema.lightweightScans)
    .innerJoin(schema.brands, eq(schema.lightweightScans.brandId, schema.brands.id))
    .where(
      and(
        eq(schema.brands.active, true),
        sql`${schema.lightweightScans.id} in (select max(id) from lightweight_scans group by brand_id)`,
      ),
    )
    .orderBy(desc(schema.lightweightScans.scannedAt))
    .all() as LatestSignalRow[];

  const recentChangeCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const recentChanges = db
    .select({
      brandId: schema.changelogEntries.brandId,
      field: schema.changelogEntries.field,
    })
    .from(schema.changelogEntries)
    .where(gte(schema.changelogEntries.detectedAt, recentChangeCutoff))
    .all();

  const recentChangesByBrand = new Map<number, string[]>();
  for (const change of recentChanges) {
    const existing = recentChangesByBrand.get(change.brandId) ?? [];
    if (!existing.includes(change.field)) {
      existing.push(change.field);
      recentChangesByBrand.set(change.brandId, existing);
    }
  }

  const staleCutoff = new Date(Date.now() - staleAfterHours * 60 * 60 * 1000).toISOString();
  const items: OutreachEmail[] = [];

  for (const scan of latestScans) {
    if (existingBrandIds.has(scan.brandId)) continue;
    if (category && scan.category !== category) continue;
    if (!scan.scannedAt) {
      stats.skippedNoScan++;
      continue;
    }
    if (scan.scannedAt < staleCutoff) {
      stats.skippedStale++;
      continue;
    }

    const recentChangeFields = recentChangesByBrand.get(scan.brandId) ?? [];
    const issues = buildIssues(scan);

    if (issues.length < 2 && recentChangeFields.length === 0) {
      stats.skippedNoFindings++;
      continue;
    }

    const score = computeSignalScore(scan, recentChangeFields.length);
    if (score > maxScore) continue;

    const grade = scoreToGrade(score);
    const reportUrl = `https://arcreport.ai/brand/${scan.brandSlug}`;
    const subject = generateSubject(scan.brandName, scan.blockedAgentCount, issues, recentChangeFields);
    const body = generateBody(scan, issues, reportUrl, recentChangeFields);

    items.push({
      brandId: scan.brandId,
      brandName: scan.brandName,
      brandUrl: scan.brandUrl,
      brandSlug: scan.brandSlug,
      score,
      grade,
      issueCount: issues.length,
      topIssues: issues,
      subject,
      body,
      reportUrl,
      validationWarnings: [],
    });
  }

  items.sort((a, b) => {
    if (a.score !== b.score) return a.score - b.score;
    return b.issueCount - a.issueCount;
  });

  stats.generated = items.length;

  return {
    items: items.slice(0, limit),
    stats,
  };
}

export function insertSignalOutreachItems(items: OutreachEmail[]): {
  inserted: number;
  needsReview: number;
  duplicates: number;
  errors: string[];
} {
  let inserted = 0;
  let needsReview = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (const item of items) {
    const status = item.validationWarnings.length > 0 ? "needs_review" : "queued";

    try {
      db.insert(schema.outreach).values({
        brandId: item.brandId,
        subject: item.subject,
        body: item.body,
        brandScore: item.score,
        brandGrade: item.grade,
        issueCount: item.issueCount,
        topIssues: JSON.stringify(item.topIssues),
        reportUrl: item.reportUrl,
        status,
        notes: item.validationWarnings.length > 0
          ? `[AUTO] Needs review: ${item.validationWarnings.join("; ")}`
          : null,
      }).run();
      inserted++;
      if (status === "needs_review") needsReview++;
    } catch (err) {
      const message = String(err);
      if (message.includes("UNIQUE") || message.includes("duplicate")) {
        duplicates++;
      } else {
        errors.push(`${item.brandName}: ${message}`);
      }
    }
  }

  return { inserted, needsReview, duplicates, errors };
}
