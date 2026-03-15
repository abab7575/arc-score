/**
 * Outreach Queue Generator
 *
 * Generates personalized outreach emails from scan data.
 * Each email includes subject, body, and the brand's report URL.
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
Founder, Robot Shopper
(Yes, a real human wrote this. The robots just did the shopping part.)
robotshopper.com`;
  }

  // Standard email for accessible but low-scoring sites
  const issueList = topIssues
    .slice(0, 3)
    .map((issue, i) => `${i + 1}. ${issue}`)
    .join("\n");

  const improvement = estimatedScore - score;

  return `Hey —

We ran ${name} through our AI shopping agent test at robotshopper.com.

Your score: ${score}/100 (Grade ${grade}).

We sent 5 AI agents to try to buy from ${url} — the same kind of agents your customers are starting to use (ChatGPT Shopping, Google AI Mode, Perplexity). Here's what they found:

${issueList}

${issueCount > 3 ? `Plus ${issueCount - 3} more issues.` : ""}

Full score breakdown (free): ${reportUrl}

The good news: the top fixes alone could get you to ${estimatedScore}/100 (+${improvement} points). Most are quick wins that take hours, not weeks.

If you want the full findings with fix instructions and agent journey replays, that's on our Monitor plan — but the score and category breakdown are free to view right now.

Cheers,
Andy
Founder, Robot Shopper
(Yes, a real human wrote this. The robots just did the shopping part.)
robotshopper.com`;
}

/**
 * Generate outreach queue items for brands that haven't been contacted yet.
 */
export function generateOutreachQueue(options: {
  maxScore?: number;
  minScore?: number;
  category?: string;
  limit?: number;
}): OutreachEmail[] {
  const {
    maxScore = 70,
    minScore = 0,
    category,
    limit = 50,
  } = options;

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
  let staleSkipped = 0;

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

    if (!latestScan) continue;

    // Skip stale scans — never send outreach based on old data
    if (latestScan.scannedAt < maxScanAge) {
      staleSkipped++;
      continue;
    }

    if (latestScan.overallScore > maxScore || latestScan.overallScore < minScore) continue;

    let issueCount = 0;
    let topIssues: string[] = [];
    let estimatedScoreAfterFixes = latestScan.overallScore;
    let blockedByBot = false;

    try {
      const report = JSON.parse(latestScan.reportJson);
      issueCount = report.findings?.length ?? 0;
      topIssues = (report.findings ?? [])
        .slice(0, 5)
        .map((f: { title: string }) => f.title);
      estimatedScoreAfterFixes = report.estimatedScoreAfterFixes ?? latestScan.overallScore;

      // Check if the site blocks bots (changes email template)
      const browserJourney = report.journeys?.find((j: { agentType: string }) => j.agentType === "browser");
      if (browserJourney?.overallResult === "fail") {
        const botStep = browserJourney.steps?.find((s: { narration: string }) =>
          s.narration?.toLowerCase().includes("block") || s.narration?.toLowerCase().includes("bot")
        );
        if (botStep) blockedByBot = true;
      }
      // Also check the verdict
      if (report.verdict?.toLowerCase().includes("block")) blockedByBot = true;
    } catch { /* skip */ }

    const reportUrl = `https://robotshopper.com/brand/${brand.slug}`;
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
    });
  }

  if (staleSkipped > 0) {
    console.log(`[Outreach] Skipped ${staleSkipped} brands with stale scan data (>14 days old). Rescan them first.`);
  }

  // Sort by score ascending (worst = most compelling)
  results.sort((a, b) => a.score - b.score);

  return results.slice(0, limit);
}

/**
 * Insert generated outreach items into the database.
 */
export function insertOutreachItems(items: OutreachEmail[]): number {
  let inserted = 0;
  for (const item of items) {
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
        status: "queued",
      }).run();
      inserted++;
    } catch { /* skip duplicates */ }
  }
  return inserted;
}
