/**
 * Content Studio — Data Assembly Layer
 *
 * Queries DB via existing functions, shapes data, passes to templates.
 */

import { getAllBrandsWithLatestScores, type BrandWithLatestScore } from "@/lib/db/queries";
import { getNewsArticles, getScanHealth } from "@/lib/db/admin-queries";
import { AI_AGENT_PROFILES } from "@/lib/ai-agents";
import { CATEGORY_CONFIG, GRADE_THRESHOLDS } from "@/lib/constants";
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

function scoreToGrade(score: number): string {
  for (const t of GRADE_THRESHOLDS) {
    if (score >= t.min) return t.grade;
  }
  return "F";
}

function getAgentScoreForBrand(
  brand: BrandWithLatestScore,
  agentId: string
): number {
  if (brand.aiAgentScores && brand.aiAgentScores[agentId] !== undefined) {
    return brand.aiAgentScores[agentId];
  }
  // Fallback: compute from category scores if agent scores not precomputed
  const profile = AI_AGENT_PROFILES.find((p) => p.id === agentId);
  if (!profile || brand.categoryScores.length === 0) return 0;
  let weighted = 0;
  for (const [catId, weight] of Object.entries(profile.weights)) {
    const cat = brand.categoryScores.find((c) => c.categoryId === catId);
    weighted += (cat?.score ?? 0) * weight;
  }
  return Math.round(weighted);
}

// ── Generators ──────────────────────────────────────────────────────

function generateCategoryLeaderboard(
  platform: Platform,
  categoryId: string,
  count: number
): GenerateResult {
  const brands = getAllBrandsWithLatestScores();
  const catConfig = CATEGORY_CONFIG[categoryId as keyof typeof CATEGORY_CONFIG];
  const categoryName = catConfig?.name ?? categoryId;

  const filtered = brands
    .filter((b) => {
      const catScore = b.categoryScores.find((c) => c.categoryId === categoryId);
      return catScore && catScore.score > 0;
    })
    .sort((a, b) => {
      const aScore = a.categoryScores.find((c) => c.categoryId === categoryId)?.score ?? 0;
      const bScore = b.categoryScores.find((c) => c.categoryId === categoryId)?.score ?? 0;
      return bScore - aScore;
    })
    .slice(0, count)
    .map((brand, i) => {
      const catScore = brand.categoryScores.find((c) => c.categoryId === categoryId)!;
      return {
        rank: i + 1,
        name: brand.name,
        score: catScore.score,
        grade: scoreToGrade(catScore.score),
      };
    });

  const content = categoryLeaderboardTemplate(platform, {
    categoryName,
    categoryId,
    brands: filtered,
    totalBrands: brands.filter((b) => b.latestScore !== null).length,
  });

  return { content, charCount: content.length, platform, contentType: "category-leaderboard" };
}

function generateScoreSpotlight(
  platform: Platform,
  brandSlug: string
): GenerateResult {
  const brands = getAllBrandsWithLatestScores();
  const brand = brands.find((b) => b.slug === brandSlug);

  if (!brand || brand.latestScore === null) {
    const content = `Brand "${brandSlug}" not found or has no score data.`;
    return { content, charCount: content.length, platform, contentType: "score-spotlight" };
  }

  const categoryBreakdown = brand.categoryScores.map((cs) => {
    const config = CATEGORY_CONFIG[cs.categoryId as keyof typeof CATEGORY_CONFIG];
    return {
      name: config?.name ?? cs.categoryId,
      score: cs.score,
      grade: scoreToGrade(cs.score),
    };
  });

  const content = scoreSpotlightTemplate(platform, {
    brandName: brand.name,
    brandSlug: brand.slug,
    overallScore: brand.latestScore,
    grade: brand.latestGrade ?? scoreToGrade(brand.latestScore),
    categoryBreakdown,
    previousScore: brand.previousScore,
  });

  return { content, charCount: content.length, platform, contentType: "score-spotlight" };
}

function generateBiggestMovers(
  platform: Platform,
  direction: "up" | "down" | "both",
  count: number
): GenerateResult {
  const brands = getAllBrandsWithLatestScores();

  const withDelta = brands
    .filter((b) => b.latestScore !== null && b.previousScore !== null)
    .map((b) => ({
      name: b.name,
      score: b.latestScore!,
      previousScore: b.previousScore!,
      delta: b.latestScore! - b.previousScore!,
      grade: b.latestGrade ?? scoreToGrade(b.latestScore!),
    }))
    .filter((m) => {
      if (direction === "up") return m.delta > 0;
      if (direction === "down") return m.delta < 0;
      return m.delta !== 0;
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, count);

  const content = biggestMoversTemplate(platform, {
    direction,
    movers: withDelta,
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

  const brands = getAllBrandsWithLatestScores();
  const scored = brands
    .filter((b) => b.latestScore !== null)
    .map((b) => ({
      name: b.name,
      score: getAgentScoreForBrand(b, agentId),
      grade: "",
    }))
    .map((b) => ({ ...b, grade: scoreToGrade(b.score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map((b, i) => ({ ...b, rank: i + 1 }));

  const content = agentReadinessTemplate(platform, {
    agentName: profile.name,
    agentType: profile.type,
    agentCompany: profile.company,
    brands: scored,
    totalBrands: brands.filter((b) => b.latestScore !== null).length,
  });

  return { content, charCount: content.length, platform, contentType: "agent-readiness" };
}

function generateWeeklyRoundup(platform: Platform): GenerateResult {
  const brands = getAllBrandsWithLatestScores();
  const health = getScanHealth();

  const scoredBrands = brands
    .filter((b) => b.latestScore !== null)
    .sort((a, b) => b.latestScore! - a.latestScore!);

  const topBrands = scoredBrands.slice(0, 10).map((b) => ({
    name: b.name,
    score: b.latestScore!,
    grade: b.latestGrade ?? scoreToGrade(b.latestScore!),
  }));

  const movers = brands
    .filter((b) => b.latestScore !== null && b.previousScore !== null && b.latestScore !== b.previousScore)
    .map((b) => ({
      name: b.name,
      delta: b.latestScore! - b.previousScore!,
      score: b.latestScore!,
    }))
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  let recentArticles: { title: string }[] = [];
  try {
    const articles = getNewsArticles({ limit: 5 });
    recentArticles = articles.map((a) => ({ title: a.title }));
  } catch {
    // news table may not exist
  }

  const content = weeklyRoundupTemplate(platform, {
    totalBrands: health.totalBrands,
    avgScore: health.avgScore,
    topBrands,
    movers,
    recentArticles,
    todayScans: health.todayScans,
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
        request.categoryId ?? "discoverability",
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
