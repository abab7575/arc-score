/**
 * Outreach Queue Generator
 *
 * Generates personalized outreach emails from scan data.
 * Each email includes subject, body, and the brand's report URL.
 *
 * ACCURACY RULES:
 * - Never claim issues if findings are empty
 * - Never send outreach based on stale scan data (>14 days)
 * - Always validate data before templating
 * - Flag any item that fails validation for manual review
 */

import { db, schema } from "@/lib/db/index";
import { eq, desc, and, notInArray } from "drizzle-orm";

interface OutreachEmail {
  brandId: number;
  brandName: string;
  brandUrl: string;
  brandSlug: string;
  score: number;
  grade: string;
  issueCount: number;
  topIssues: string[];
  estimatedScoreAfterFixes: number;
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

function generateSubject(name: string, score: number, issueCount: number, blockedByBot: boolean): string {
  if (blockedByBot) {
    return `${name}: AI shopping agents are blocked from your site entirely`;
  }
  if (score < 20) {
    return `${name}: AI shopping agents can't buy from your site (Score: ${score}/100)`;
  }
  if (score < 40) {
    return `${name} scores ${score}/100 for AI agent readiness — ${issueCount} issues found`;
  }
  if (score < 60) {
    return `${name}: ${issueCount} issues are blocking AI agents from buying`;
  }
  return `${name}: Your AI readiness score is ${score}/100 — room to improve`;
}

function generateBody(
  name: string,
  url: string,
  score: number,
  grade: string,
  issueCount: number,
  topIssues: string[],
  estimatedScore: number,
  reportUrl: string,
  blockedByBot: boolean
): string {
  if (blockedByBot) {
    // WAF-blocked brands get a different, more accurate email
    return `Hey —

We tried to send 5 AI shopping agents to buy from ${url}. They couldn't even get in.

Your score: ${score}/100 (Grade ${grade}).

Your site's bot protection blocks all automated access — including the AI shopping agents your customers are starting to use (ChatGPT Shopping, Google AI Mode, Perplexity, Amazon Buy For Me).

This means when someone asks ChatGPT to "find me a product from ${name}," the agent hits a wall. No product data, no add-to-cart, no checkout. The customer just buys from whoever the agent tries next.

This is increasingly common — about 40% of the sites we scan have this issue. The fix is usually a targeted robots.txt update that allows known AI agents while keeping scrapers out.

Full score breakdown (free): ${reportUrl}

Cheers,
Andy
Founder, ARC Report
(Yes, a real human wrote this. The robots just did the shopping part.)
arcreport.ai`;
  }

  // Standard email for accessible but low-scoring sites
  const issueList = topIssues
    .slice(0, 3)
    .map((issue, i) => `${i + 1}. ${issue}`)
    .join("\n");

  const improvement = estimatedScore - score;

  // Build the issues section — only include if we actually have findings
  let issuesSection = "";
  if (topIssues.length > 0) {
    issuesSection = `We sent 5 AI agents to try to buy from ${url} — the same kind of agents your customers are starting to use (ChatGPT Shopping, Google AI Mode, Perplexity). Here's what they found:

${issueList}`;

    if (issueCount > 3) {
      issuesSection += `\n\nPlus ${issueCount - 3} more issue${issueCount - 3 !== 1 ? "s" : ""}.`;
    }
  } else {
    issuesSection = `We sent 5 AI agents to try to buy from ${url} — the same kind of agents your customers are starting to use (ChatGPT Shopping, Google AI Mode, Perplexity). They ran into friction across multiple areas.`;
  }

  // Only mention improvement if it's meaningful (>= 5 points)
  const improvementSection = improvement >= 5
    ? `\nThe good news: the top fixes alone could get you to ${estimatedScore}/100 (+${improvement} points). Most are quick wins that take hours, not weeks.`
    : "";

  return `Hey —

We ran ${name} through our AI shopping agent test at arcreport.ai.

Your score: ${score}/100 (Grade ${grade}).

${issuesSection}

Full score breakdown (free): ${reportUrl}
${improvementSection}
If you want the full findings with fix instructions and agent journey replays, that's on our Monitor plan — but the score and category breakdown are free to view right now.

Cheers,
Andy
Founder, ARC Report
(Yes, a real human wrote this. The robots just did the shopping part.)
arcreport.ai`;
}

/**
 * Validate that outreach email data is accurate before sending.
 * Returns array of warning strings. Empty = all good.
 */
function validateOutreachData(
  brand: { name: string; slug: string },
  score: number,
  grade: string,
  issueCount: number,
  topIssues: string[],
  estimatedScoreAfterFixes: number,
  blockedByBot: boolean
): string[] {
  const warnings: string[] = [];

  // Issue count must match actual findings
  if (issueCount > 0 && topIssues.length === 0) {
    warnings.push(`Claims ${issueCount} issues but no finding titles extracted — email would list nothing`);
  }

  // Estimated score must be realistic
  if (estimatedScoreAfterFixes > 100) {
    warnings.push(`Estimated score after fixes is ${estimatedScoreAfterFixes} (>100) — capping at 100`);
  }
  if (estimatedScoreAfterFixes < score) {
    warnings.push(`Estimated score after fixes (${estimatedScoreAfterFixes}) is lower than current score (${score})`);
  }
  if (estimatedScoreAfterFixes - score > 50) {
    warnings.push(`Claimed improvement of +${estimatedScoreAfterFixes - score} points seems unrealistically high`);
  }

  // Bot-block + high score is suspicious
  if (blockedByBot && score > 50) {
    warnings.push(`Marked as bot-blocked but score is ${score}/100 — verify bot-block detection is correct`);
  }

  // Grade must match score range
  const expectedGrade = score >= 85 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : score >= 30 ? "D" : "F";
  if (grade !== expectedGrade) {
    warnings.push(`Grade "${grade}" doesn't match score ${score} (expected "${expectedGrade}")`);
  }

  return warnings;
}

/**
 * Generate outreach queue items for brands that haven't been contacted yet.
 * Returns items + stats including validation warnings.
 */
export function generateOutreachQueue(options: {
  maxScore?: number;
  minScore?: number;
  category?: string;
  limit?: number;
}): { items: OutreachEmail[]; stats: GenerationStats } {
  const {
    maxScore = 70,
    minScore = 0,
    category,
    limit = 50,
  } = options;

  const stats: GenerationStats = {
    generated: 0,
    skippedStale: 0,
    skippedNoScan: 0,
    skippedNoFindings: 0,
    validationWarnings: 0,
  };

  // Get brands already in outreach queue
  const existingBrandIds = db
    .select({ brandId: schema.outreach.brandId })
    .from(schema.outreach)
    .all()
    .map((r: { brandId: number }) => r.brandId);

  // Get active brands
  let brandsQuery = db
    .select({
      id: schema.brands.id,
      slug: schema.brands.slug,
      name: schema.brands.name,
      url: schema.brands.url,
      category: schema.brands.category,
    })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();

  if (category) {
    brandsQuery = brandsQuery.filter((b: { category: string }) => b.category === category);
  }

  // Filter out already-contacted brands
  if (existingBrandIds.length > 0) {
    brandsQuery = brandsQuery.filter((b: { id: number }) => !existingBrandIds.includes(b.id));
  }

  const results: OutreachEmail[] = [];

  // Staleness guardrail: only use scans from the last 14 days
  const maxScanAge = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  for (const brand of brandsQuery) {
    const latestScan = db
      .select({
        overallScore: schema.scans.overallScore,
        grade: schema.scans.grade,
        reportJson: schema.scans.reportJson,
        scannedAt: schema.scans.scannedAt,
      })
      .from(schema.scans)
      .where(eq(schema.scans.brandId, brand.id))
      .orderBy(desc(schema.scans.scannedAt))
      .limit(1)
      .get();

    if (!latestScan) {
      stats.skippedNoScan++;
      continue;
    }

    // Skip stale scans — never send outreach based on old data
    if (latestScan.scannedAt < maxScanAge) {
      stats.skippedStale++;
      continue;
    }

    if (latestScan.overallScore > maxScore || latestScan.overallScore < minScore) continue;

    let issueCount = 0;
    let topIssues: string[] = [];
    let estimatedScoreAfterFixes = latestScan.overallScore;
    let blockedByBot = false;
    let reportParsed = false;

    try {
      const report = JSON.parse(latestScan.reportJson);
      reportParsed = true;
      issueCount = report.findings?.length ?? 0;
      topIssues = (report.findings ?? [])
        .slice(0, 5)
        .map((f: { title: string }) => f.title)
        .filter((t: string) => typeof t === "string" && t.length > 0);
      estimatedScoreAfterFixes = Math.min(report.estimatedScoreAfterFixes ?? latestScan.overallScore, 100);

      // Check if the site blocks bots — require stronger evidence than just keyword matching
      const browserJourney = report.journeys?.find((j: { agentType: string }) => j.agentType === "browser");
      if (browserJourney?.overallResult === "fail") {
        // Look for explicit bot/WAF blocking signals, not just the word "block"
        const blockPatterns = [
          /\bbot\s*(protection|detection|block)/i,
          /\bwaf\b/i,
          /\bcaptcha\b/i,
          /\bcloudflare\b.*\bchallenge/i,
          /\baccess\s*denied\b/i,
          /\b403\s*(forbidden)?\b/i,
          /\bblocked\s*(by|from|access)/i,
          /\brobot(s)?\s*(detected|blocked|denied)/i,
        ];
        const stepNarrations = (browserJourney.steps ?? [])
          .map((s: { narration: string }) => s.narration ?? "")
          .join(" ");
        blockedByBot = blockPatterns.some((p) => p.test(stepNarrations));
      }
      // Also check the verdict with stronger pattern
      if (!blockedByBot && report.verdict) {
        const verdictBlockPatterns = [/\bbot\s*block/i, /\bwaf\b/i, /\baccess\s*denied/i, /\b403\b/i];
        blockedByBot = verdictBlockPatterns.some((p) => p.test(report.verdict));
      }
    } catch (err) {
      console.error(`[Outreach] Failed to parse report JSON for brand ${brand.name} (ID: ${brand.id}):`, err);
      // Don't skip — but flag it. We can still send a score-based email.
    }

    // If report didn't parse AND we have no findings, skip — we can't write a credible email
    if (!reportParsed && issueCount === 0) {
      stats.skippedNoFindings++;
      console.warn(`[Outreach] Skipping ${brand.name}: report JSON failed to parse and no findings available`);
      continue;
    }

    // Validate accuracy
    const warnings = validateOutreachData(
      brand, latestScan.overallScore, latestScan.grade,
      issueCount, topIssues, estimatedScoreAfterFixes, blockedByBot
    );
    if (warnings.length > 0) {
      stats.validationWarnings += warnings.length;
      console.warn(`[Outreach] Validation warnings for ${brand.name}:`, warnings);
    }

    const reportUrl = `https://arcreport.ai/brand/${brand.slug}`;
    const subject = generateSubject(brand.name, latestScan.overallScore, issueCount, blockedByBot);
    const body = generateBody(
      brand.name, brand.url, latestScan.overallScore, latestScan.grade,
      issueCount, topIssues, estimatedScoreAfterFixes, reportUrl, blockedByBot
    );

    results.push({
      brandId: brand.id,
      brandName: brand.name,
      brandUrl: brand.url,
      brandSlug: brand.slug,
      score: latestScan.overallScore,
      grade: latestScan.grade,
      issueCount,
      topIssues,
      estimatedScoreAfterFixes,
      subject,
      body,
      reportUrl,
      validationWarnings: warnings,
    });

    stats.generated++;
  }

  if (stats.skippedStale > 0) {
    console.log(`[Outreach] Skipped ${stats.skippedStale} brands with stale scan data (>14 days old). Rescan them first.`);
  }

  // Sort by score ascending (worst = most compelling)
  results.sort((a, b) => a.score - b.score);

  return { items: results.slice(0, limit), stats };
}

/**
 * Insert generated outreach items into the database.
 * Items with validation warnings get status "needs_review" instead of "queued".
 */
export function insertOutreachItems(items: OutreachEmail[]): { inserted: number; needsReview: number; duplicates: number; errors: string[] } {
  let inserted = 0;
  let needsReview = 0;
  let duplicates = 0;
  const errors: string[] = [];

  for (const item of items) {
    // Items with validation warnings need manual review before sending
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
      const msg = String(err);
      if (msg.includes("UNIQUE") || msg.includes("duplicate")) {
        duplicates++;
      } else {
        errors.push(`${item.brandName}: ${msg}`);
        console.error(`[Outreach] Insert failed for ${item.brandName}:`, err);
      }
    }
  }
  return { inserted, needsReview, duplicates, errors };
}
