/**
 * Content Studio — Data Assembly Layer
 *
 * Queries DB via lightweight_scans (getMatrixData), shapes data, passes to templates.
 */

import {
  getMatrixData,
  getTopMovers,
  getWeeklyTotals,
  getRecentChangelog,
} from "@/lib/db/queries";
import { getNewsArticles } from "@/lib/db/admin-queries";
import { AI_AGENT_PROFILES } from "@/lib/ai-agents";
import {
  type Platform,
  type ContentType,
  categoryLeaderboardTemplate,
  scoreSpotlightTemplate,
  biggestMoversTemplate,
  agentReadinessTemplate,
  weeklyRoundupTemplate,
  newsReactionTemplate,
} from "./templates";

// ── Types ───────────────────────────────────────────────────────────

export interface GenerateRequest {
  contentType: ContentType;
  platform: Platform;
  categoryId?: string;
  brandSlug?: string;
  agentId?: string;
  direction?: "up" | "down" | "both";
  count?: number;
  articleIds?: number[];
  commentary?: string;
}

export interface GenerateResult {
  content: string;
  charCount: number;
  platform: Platform;
  contentType: ContentType;
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Lightweight scan → signal booleans list */
function countSignals(scan: NonNullable<ReturnType<typeof getMatrixData>[number]["scan"]>): number {
  let count = 0;
  if (scan.hasJsonLd) count++;
  if (scan.hasSchemaProduct) count++;
  if (scan.hasOpenGraph) count++;
  if (scan.hasSitemap) count++;
  if (scan.hasProductFeed) count++;
  if (scan.hasAgentsTxt) count++;
  if (scan.hasUcp) count++;
  return count;
}

/** Composite AI readiness score from lightweight scan signals */
function computeReadinessScore(scan: NonNullable<ReturnType<typeof getMatrixData>[number]["scan"]>): number {
  const openAgents = scan.allowedAgentCount ?? 0;
  const signals = countSignals(scan);
  const llmsBonus = scan.hasLlmsTxt ? 15 : 0;
  return openAgents * 10 + signals * 5 + llmsBonus;
}

/** Readiness score → letter tier */
function readinessTier(score: number): string {
  if (score >= 80) return "Leader";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Limited";
  return "Minimal";
}

/** Parse agentStatusJson safely */
function parseAgentStatus(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ── Generators ──────────────────────────────────────────────────────

function generateCategoryLeaderboard(
  platform: Platform,
  categoryId: string,
  count: number
): GenerateResult {
  const rows = getMatrixData();
  // categoryId maps to brand.category (e.g. "fashion", "electronics")
  const categoryName = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);

  const withScans = rows
    .filter((r) => r.scan && r.brand.category === categoryId)
    .map((r) => {
      const score = computeReadinessScore(r.scan!);
      return {
        rank: 0,
        name: r.brand.name,
        score,
        tier: readinessTier(score),
        signals: countSignals(r.scan!),
        openAgents: r.scan!.allowedAgentCount ?? 0,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((b, i) => ({ ...b, rank: i + 1 }));

  const totalBrands = rows.filter((r) => r.scan).length;

  const content = categoryLeaderboardTemplate(platform, {
    categoryName,
    categoryId,
    brands: withScans,
    totalBrands,
  });

  return { content, charCount: content.length, platform, contentType: "category-leaderboard" };
}

function generateScoreSpotlight(
  platform: Platform,
  brandSlug: string
): GenerateResult {
  const rows = getMatrixData();
  const row = rows.find((r) => r.brand.slug === brandSlug);

  if (!row || !row.scan) {
    const content = `Brand "${brandSlug}" not found or has no scan data.`;
    return { content, charCount: content.length, platform, contentType: "score-spotlight" };
  }

  const scan = row.scan;
  const readinessScore = computeReadinessScore(scan);
  const agentStatus = parseAgentStatus(scan.agentStatusJson);

  // Build signal breakdown
  const signalBreakdown = [
    { name: "JSON-LD", present: scan.hasJsonLd },
    { name: "Schema.org Product", present: scan.hasSchemaProduct },
    { name: "Open Graph", present: scan.hasOpenGraph },
    { name: "Sitemap", present: scan.hasSitemap },
    { name: "Product Feed", present: scan.hasProductFeed },
    { name: "llms.txt", present: scan.hasLlmsTxt },
    { name: "agents.txt", present: scan.hasAgentsTxt },
    { name: "UCP", present: scan.hasUcp },
  ];

  // Agent access summary
  const agentAccess = Object.entries(agentStatus).map(([agent, status]) => ({
    agent,
    status,
  }));

  // Peer comparison: how this brand ranks among all scanned brands
  const allScores = rows
    .filter((r) => r.scan)
    .map((r) => computeReadinessScore(r.scan!))
    .sort((a, b) => b - a);
  const rank = allScores.findIndex((s) => s <= readinessScore) + 1;
  const totalBrands = allScores.length;

  const content = scoreSpotlightTemplate(platform, {
    brandName: row.brand.name,
    brandSlug: row.brand.slug,
    readinessScore,
    tier: readinessTier(readinessScore),
    signalBreakdown,
    agentAccess,
    openAgents: scan.allowedAgentCount ?? 0,
    blockedAgents: scan.blockedAgentCount ?? 0,
    rank,
    totalBrands,
  });

  return { content, charCount: content.length, platform, contentType: "score-spotlight" };
}

function generateBiggestMovers(
  platform: Platform,
  direction: "up" | "down" | "both",
  count: number
): GenerateResult {
  // Use changelog-based movers
  const movers = getTopMovers(7, count * 2);

  // Get scan data to enrich with current readiness info
  const rows = getMatrixData();
  const scanByBrandId = new Map(rows.filter(r => r.scan).map(r => [r.brand.id, r]));

  const enriched = movers
    .map((m) => {
      const row = scanByBrandId.get(m.brandId);
      const score = row?.scan ? computeReadinessScore(row.scan) : 0;
      return {
        name: m.brandName,
        changeCount: m.changeCount,
        score,
        tier: readinessTier(score),
      };
    })
    .slice(0, count);

  const content = biggestMoversTemplate(platform, {
    direction,
    movers: enriched,
  });

  return { content, charCount: content.length, platform, contentType: "biggest-movers" };
}

function generateAgentReadiness(
  platform: Platform,
  agentId: string,
  count: number
): GenerateResult {
  const profile = AI_AGENT_PROFILES.find((p) => p.id === agentId);
  if (!profile) {
    const content = `Agent "${agentId}" not found.`;
    return { content, charCount: content.length, platform, contentType: "agent-readiness" };
  }

  const rows = getMatrixData();

  // Find the relevant UA strings for this agent
  const agentUAs = profile.userAgentStrings;

  const scored = rows
    .filter((r) => r.scan)
    .map((r) => {
      const agentStatus = parseAgentStatus(r.scan!.agentStatusJson);
      // Determine this agent's status: check all UA strings, pick the best
      const statuses = agentUAs.map((ua) => agentStatus[ua] ?? "no_rule");
      // Priority: allowed > no_rule > inconclusive > restricted > blocked
      const statusPriority = ["allowed", "no_rule", "inconclusive", "restricted", "blocked"];
      const bestStatus = statuses.sort(
        (a, b) => statusPriority.indexOf(a) - statusPriority.indexOf(b)
      )[0] ?? "no_rule";

      return {
        name: r.brand.name,
        status: bestStatus,
        readinessScore: computeReadinessScore(r.scan!),
        openAgents: r.scan!.allowedAgentCount ?? 0,
      };
    })
    .sort((a, b) => {
      // Sort: allowed first, then by readiness score
      const statusOrder: Record<string, number> = { allowed: 0, no_rule: 1, inconclusive: 2, restricted: 3, blocked: 4 };
      const aDiff = statusOrder[a.status] ?? 2;
      const bDiff = statusOrder[b.status] ?? 2;
      if (aDiff !== bDiff) return aDiff - bDiff;
      return b.readinessScore - a.readinessScore;
    })
    .slice(0, count)
    .map((b, i) => ({ ...b, rank: i + 1 }));

  const totalBrands = rows.filter((r) => r.scan).length;
  const allowedCount = scored.filter((s) => s.status === "allowed").length;
  const blockedCount = rows
    .filter((r) => r.scan)
    .filter((r) => {
      const st = parseAgentStatus(r.scan!.agentStatusJson);
      return agentUAs.some((ua) => st[ua] === "blocked");
    }).length;

  const content = agentReadinessTemplate(platform, {
    agentName: profile.name,
    agentType: profile.type,
    agentCompany: profile.company,
    brands: scored,
    totalBrands,
    allowedCount,
    blockedCount,
  });

  return { content, charCount: content.length, platform, contentType: "agent-readiness" };
}

function generateWeeklyRoundup(platform: Platform): GenerateResult {
  const rows = getMatrixData();
  const weeklyTotals = getWeeklyTotals(7);
  const topMovers = getTopMovers(7, 5);
  const changelog = getRecentChangelog(10);

  // Top brands by readiness score
  const topBrands = rows
    .filter((r) => r.scan)
    .map((r) => ({
      name: r.brand.name,
      score: computeReadinessScore(r.scan!),
      tier: readinessTier(computeReadinessScore(r.scan!)),
      openAgents: r.scan!.allowedAgentCount ?? 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Movers from changelog
  const movers = topMovers.map((m) => ({
    name: m.brandName,
    changeCount: m.changeCount,
  }));

  // Recent changes for flavor
  const recentChanges = changelog.slice(0, 5).map((c) => ({
    field: c.field,
    oldValue: c.oldValue,
    newValue: c.newValue,
  }));

  let recentArticles: { title: string }[] = [];
  try {
    const articles = getNewsArticles({ limit: 5 });
    recentArticles = articles.map((a) => ({ title: a.title }));
  } catch {
    // news table may not exist
  }

  const totalBrands = rows.filter((r) => r.scan).length;

  const content = weeklyRoundupTemplate(platform, {
    totalBrands,
    totalChanges: weeklyTotals.totalChanges,
    brandsMoving: weeklyTotals.brandsMoving,
    topBrands,
    movers,
    recentChanges,
    recentArticles,
  });

  return { content, charCount: content.length, platform, contentType: "weekly-roundup" };
}

function generateNewsReaction(
  platform: Platform,
  articleIds: number[],
  commentary: string
): GenerateResult {
  let allArticles: ReturnType<typeof getNewsArticles> = [];
  try {
    allArticles = getNewsArticles({ limit: 200 });
  } catch {
    // news table may not exist
  }

  const selected = articleIds
    .map((id) => allArticles.find((a) => a.id === id))
    .filter(Boolean)
    .map((a) => ({
      title: a!.title,
      url: a!.url,
      sourceName: a!.sourceName,
    }));

  if (selected.length === 0) {
    const content = "No articles found with the given IDs.";
    return { content, charCount: content.length, platform, contentType: "news-reaction" };
  }

  const content = newsReactionTemplate(platform, {
    articles: selected,
    commentary,
  });

  return { content, charCount: content.length, platform, contentType: "news-reaction" };
}

// ── Main Export ──────────────────────────────────────────────────────

export function generateContent(request: GenerateRequest): GenerateResult {
  const { contentType, platform, count = 5 } = request;

  switch (contentType) {
    case "category-leaderboard":
      return generateCategoryLeaderboard(
        platform,
        request.categoryId ?? "fashion",
        count
      );
    case "score-spotlight":
      return generateScoreSpotlight(platform, request.brandSlug ?? "");
    case "biggest-movers":
      return generateBiggestMovers(platform, request.direction ?? "both", count);
    case "agent-readiness":
      return generateAgentReadiness(
        platform,
        request.agentId ?? "chatgpt-shopping",
        count
      );
    case "weekly-roundup":
      return generateWeeklyRoundup(platform);
    case "news-reaction":
      return generateNewsReaction(
        platform,
        request.articleIds ?? [],
        request.commentary ?? ""
      );
    default:
      return {
        content: `Unknown content type: ${contentType}`,
        charCount: 0,
        platform,
        contentType,
      };
  }
}
