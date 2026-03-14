/**
 * Content Intelligence Engine
 *
 * Analyzes current data and returns ranked story candidates.
 * Reuses existing query functions — no new DB access patterns.
 */

import { getAllBrandsWithLatestScores, type BrandWithLatestScore } from "@/lib/db/queries";
import { getNewsArticles, getRecentContentTypes } from "@/lib/db/admin-queries";
import { AI_AGENT_PROFILES } from "@/lib/ai-agents";
import { CATEGORY_CONFIG, GRADE_THRESHOLDS } from "@/lib/constants";
import { EDUCATIONAL_TOPICS } from "./educational-topics";
import type { Platform, ContentType } from "./templates";

// ── Types ───────────────────────────────────────────────────────────

export interface StoryCandidate {
  id: string; // unique key for dedup
  priority: number; // 0-100
  contentType: ContentType | "educational";
  title: string;
  platforms: Platform[];
  templateData: Record<string, unknown>;
  imageTemplate: string; // scorecard, leaderboard, mover-alert, educational, news-react
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
  const profile = AI_AGENT_PROFILES.find((p) => p.id === agentId);
  if (!profile || brand.categoryScores.length === 0) return 0;
  let weighted = 0;
  for (const [catId, weight] of Object.entries(profile.weights)) {
    const cat = brand.categoryScores.find((c) => c.categoryId === catId);
    weighted += (cat?.score ?? 0) * weight;
  }
  return Math.round(weighted);
}

// ── Story Detectors ────────────────────────────────────────────────

function detectNewsStories(): StoryCandidate[] {
  const stories: StoryCandidate[] = [];

  try {
    const articles = getNewsArticles({ limit: 20 });
    const cutoff48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    for (const article of articles) {
      if (article.publishedAt && article.publishedAt < cutoff48h) continue;

      if (article.relevanceScore >= 80) {
        stories.push({
          id: `news-trending-${article.id}`,
          priority: 90 + Math.min(10, Math.round((article.relevanceScore - 80) / 2)),
          contentType: "news-reaction",
          title: article.title,
          platforms: ["x", "linkedin"],
          templateData: {
            articleIds: [article.id],
            articleTitle: article.title,
            articleSource: article.sourceName,
            articleUrl: article.url,
            relevanceScore: article.relevanceScore,
          },
          imageTemplate: "news-react",
        });
      } else if (article.relevanceScore >= 65) {
        stories.push({
          id: `news-hot-${article.id}`,
          priority: 75 + Math.min(10, Math.round((article.relevanceScore - 65) / 2)),
          contentType: "news-reaction",
          title: article.title,
          platforms: ["x", "linkedin"],
          templateData: {
            articleIds: [article.id],
            articleTitle: article.title,
            articleSource: article.sourceName,
            articleUrl: article.url,
            relevanceScore: article.relevanceScore,
          },
          imageTemplate: "news-react",
        });
      }
    }
  } catch {
    // news table may not exist
  }

  return stories;
}

function detectBigMovers(brands: BrandWithLatestScore[]): StoryCandidate[] {
  const stories: StoryCandidate[] = [];

  const movers = brands
    .filter((b) => b.latestScore !== null && b.previousScore !== null)
    .map((b) => ({
      name: b.name,
      slug: b.slug,
      score: b.latestScore!,
      previousScore: b.previousScore!,
      delta: b.latestScore! - b.previousScore!,
      grade: scoreToGrade(b.latestScore!),
      categoryScores: b.categoryScores,
    }))
    .filter((m) => Math.abs(m.delta) >= 5)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  for (const mover of movers.slice(0, 3)) {
    stories.push({
      id: `mover-${mover.slug}`,
      priority: 60 + Math.min(15, Math.abs(mover.delta)),
      contentType: "biggest-movers",
      title: `${mover.name}: ${mover.delta > 0 ? "+" : ""}${mover.delta} points`,
      platforms: ["x", "linkedin"],
      templateData: {
        brandName: mover.name,
        brandSlug: mover.slug,
        previousScore: mover.previousScore,
        currentScore: mover.score,
        delta: mover.delta,
        grade: mover.grade,
      },
      imageTemplate: "mover-alert",
    });
  }

  return stories;
}

function detectNewBrands(brands: BrandWithLatestScore[]): StoryCandidate[] {
  const stories: StoryCandidate[] = [];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // We don't have createdAt on brands in the query result — use scannedAt
  // A brand scanned recently with no previousScore is likely new
  const newBrands = brands
    .filter(
      (b) =>
        b.latestScore !== null &&
        b.previousScore === null &&
        b.scannedAt &&
        b.scannedAt >= weekAgo
    )
    .sort((a, b) => b.latestScore! - a.latestScore!);

  for (const brand of newBrands.slice(0, 2)) {
    const categories = brand.categoryScores.map((cs) => {
      const config = CATEGORY_CONFIG[cs.categoryId as keyof typeof CATEGORY_CONFIG];
      return { name: config?.name ?? cs.categoryId, score: cs.score, grade: scoreToGrade(cs.score) };
    });

    stories.push({
      id: `new-brand-${brand.slug}`,
      priority: 50 + Math.min(15, Math.round(brand.latestScore! / 7)),
      contentType: "score-spotlight",
      title: `New: ${brand.name} scores ${brand.latestScore}/100`,
      platforms: ["x", "linkedin"],
      templateData: {
        brandName: brand.name,
        brandSlug: brand.slug,
        overallScore: brand.latestScore,
        grade: brand.latestGrade ?? scoreToGrade(brand.latestScore!),
        categories,
      },
      imageTemplate: "scorecard",
    });
  }

  return stories;
}

function detectCategoryLeaderboards(
  brands: BrandWithLatestScore[],
  recentTopics: Set<string>
): StoryCandidate[] {
  const stories: StoryCandidate[] = [];
  const categoryIds = Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>;

  // Sort by least-recently-covered first
  const sorted = categoryIds.sort((a, b) => {
    const aRecent = recentTopics.has(`cat-${a}`) ? 1 : 0;
    const bRecent = recentTopics.has(`cat-${b}`) ? 1 : 0;
    return aRecent - bRecent;
  });

  const picked = sorted[0];
  if (!picked) return stories;

  const catConfig = CATEGORY_CONFIG[picked];
  const ranked = brands
    .filter((b) => {
      const cs = b.categoryScores.find((c) => c.categoryId === picked);
      return cs && cs.score > 0;
    })
    .sort((a, b) => {
      const aScore = a.categoryScores.find((c) => c.categoryId === picked)?.score ?? 0;
      const bScore = b.categoryScores.find((c) => c.categoryId === picked)?.score ?? 0;
      return bScore - aScore;
    })
    .slice(0, 8)
    .map((brand, i) => {
      const cs = brand.categoryScores.find((c) => c.categoryId === picked)!;
      return { rank: i + 1, name: brand.name, score: cs.score, grade: scoreToGrade(cs.score) };
    });

  if (ranked.length >= 3) {
    stories.push({
      id: `leaderboard-${picked}`,
      priority: 45 + Math.round(Math.random() * 10),
      contentType: "category-leaderboard",
      title: `${catConfig.name} Leaderboard`,
      platforms: ["x", "linkedin"],
      templateData: {
        categoryName: catConfig.name,
        categoryId: picked,
        brands: ranked,
        totalBrands: brands.filter((b) => b.latestScore !== null).length,
      },
      imageTemplate: "leaderboard",
    });
  }

  return stories;
}

function detectAgentReadiness(
  brands: BrandWithLatestScore[],
  recentTopics: Set<string>
): StoryCandidate[] {
  const stories: StoryCandidate[] = [];

  const sorted = [...AI_AGENT_PROFILES].sort((a, b) => {
    const aRecent = recentTopics.has(`agent-${a.id}`) ? 1 : 0;
    const bRecent = recentTopics.has(`agent-${b.id}`) ? 1 : 0;
    return aRecent - bRecent;
  });

  const picked = sorted[0];
  if (!picked) return stories;

  const scored = brands
    .filter((b) => b.latestScore !== null)
    .map((b) => ({
      name: b.name,
      score: getAgentScoreForBrand(b, picked.id),
      grade: "",
    }))
    .map((b) => ({ ...b, grade: scoreToGrade(b.score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((b, i) => ({ ...b, rank: i + 1 }));

  if (scored.length >= 3) {
    stories.push({
      id: `agent-readiness-${picked.id}`,
      priority: 40 + Math.round(Math.random() * 15),
      contentType: "agent-readiness",
      title: `Top brands for ${picked.name}`,
      platforms: ["x", "linkedin"],
      templateData: {
        agentName: picked.name,
        agentId: picked.id,
        agentType: picked.type,
        agentCompany: picked.company,
        brands: scored,
        totalBrands: brands.filter((b) => b.latestScore !== null).length,
      },
      imageTemplate: "leaderboard",
    });
  }

  return stories;
}

function detectEducationalTopics(recentTopics: Set<string>): StoryCandidate[] {
  const stories: StoryCandidate[] = [];

  const sorted = [...EDUCATIONAL_TOPICS].sort((a, b) => {
    const aRecent = recentTopics.has(`edu-${a.id}`) ? 1 : 0;
    const bRecent = recentTopics.has(`edu-${b.id}`) ? 1 : 0;
    return aRecent - bRecent;
  });

  const picked = sorted[0];
  if (!picked) return stories;

  stories.push({
    id: `educational-${picked.id}`,
    priority: 30 + Math.round(Math.random() * 15),
    contentType: "educational",
    title: picked.title,
    platforms: ["x", "linkedin"],
    templateData: {
      topicId: picked.id,
      title: picked.title,
      subtitle: picked.subtitle,
      bullets: picked.bullets,
      accentColor: picked.accentColor,
    },
    imageTemplate: "educational",
  });

  return stories;
}

// ── Main Intelligence Function ─────────────────────────────────────

export function discoverStories(): StoryCandidate[] {
  const brands = getAllBrandsWithLatestScores();

  // Get recently covered topics to avoid repetition
  let recentItems: ReturnType<typeof getRecentContentTypes> = [];
  try {
    recentItems = getRecentContentTypes(3);
  } catch {
    // table may not exist yet
  }

  const recentTopics = new Set<string>();
  for (const item of recentItems) {
    try {
      const meta = JSON.parse(item.metadata);
      if (meta.categoryId) recentTopics.add(`cat-${meta.categoryId}`);
      if (meta.agentId) recentTopics.add(`agent-${meta.agentId}`);
      if (meta.topicId) recentTopics.add(`edu-${meta.topicId}`);
    } catch {
      // ignore parse errors
    }
  }

  // Collect all story candidates
  const allStories: StoryCandidate[] = [
    ...detectNewsStories(),
    ...detectBigMovers(brands),
    ...detectNewBrands(brands),
    ...detectCategoryLeaderboards(brands, recentTopics),
    ...detectAgentReadiness(brands, recentTopics),
    ...detectEducationalTopics(recentTopics),
  ];

  // Sort by priority descending
  allStories.sort((a, b) => b.priority - a.priority);

  // Apply selection rules: max 2 of any content type, pick top 5-8
  const typeCounts: Record<string, number> = {};
  const selected: StoryCandidate[] = [];

  for (const story of allStories) {
    if (selected.length >= 8) break;

    const typeCount = typeCounts[story.contentType] || 0;
    if (typeCount >= 2) continue;

    // Trending news (90+) always gets in
    if (story.priority >= 90 || typeCount < 2) {
      selected.push(story);
      typeCounts[story.contentType] = typeCount + 1;
    }
  }

  return selected;
}
