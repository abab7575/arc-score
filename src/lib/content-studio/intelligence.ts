/**
 * Content Intelligence Engine
 *
 * Analyzes current data and returns ranked story candidates.
 * Uses getMatrixData() (lightweight_scans) + changelog queries.
 */

import { getMatrixData, getTopMovers, getRecentChangelog } from "@/lib/db/queries";
import { getNewsArticles, getRecentContentTypes } from "@/lib/db/admin-queries";
import { AI_AGENT_PROFILES } from "@/lib/ai-agents";
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

type MatrixRow = ReturnType<typeof getMatrixData>[number];

function countSignals(scan: NonNullable<MatrixRow["scan"]>): number {
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

function computeReadinessScore(scan: NonNullable<MatrixRow["scan"]>): number {
  const openAgents = scan.allowedAgentCount ?? 0;
  const signals = countSignals(scan);
  const llmsBonus = scan.hasLlmsTxt ? 15 : 0;
  return openAgents * 10 + signals * 5 + llmsBonus;
}

function readinessTier(score: number): string {
  if (score >= 80) return "Leader";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Limited";
  return "Minimal";
}

function parseAgentStatus(json: string | null): Record<string, string> {
  if (!json) return {};
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
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

function detectBigMovers(rows: MatrixRow[]): StoryCandidate[] {
  const stories: StoryCandidate[] = [];

  // Use changelog to find brands with the most changes recently
  const movers = getTopMovers(7, 5);
  const scanByBrandId = new Map(rows.filter(r => r.scan).map(r => [r.brand.id, r]));

  for (const mover of movers.slice(0, 3)) {
    const row = scanByBrandId.get(mover.brandId);
    const score = row?.scan ? computeReadinessScore(row.scan) : 0;

    stories.push({
      id: `mover-${mover.brandSlug}`,
      priority: 60 + Math.min(15, mover.changeCount),
      contentType: "biggest-movers",
      title: `${mover.brandName}: ${mover.changeCount} changes this week`,
      platforms: ["x", "linkedin"],
      templateData: {
        brandName: mover.brandName,
        brandSlug: mover.brandSlug,
        changeCount: mover.changeCount,
        readinessScore: score,
        tier: readinessTier(score),
      },
      imageTemplate: "mover-alert",
    });
  }

  return stories;
}

function detectCategoryLeaderboards(
  rows: MatrixRow[],
  recentTopics: Set<string>
): StoryCandidate[] {
  const stories: StoryCandidate[] = [];

  // Get unique brand categories
  const categories = [...new Set(rows.map(r => r.brand.category).filter(Boolean))];

  // Sort by least-recently-covered first
  const sorted = categories.sort((a, b) => {
    const aRecent = recentTopics.has(`cat-${a}`) ? 1 : 0;
    const bRecent = recentTopics.has(`cat-${b}`) ? 1 : 0;
    return aRecent - bRecent;
  });

  const picked = sorted[0];
  if (!picked) return stories;

  const categoryName = picked.charAt(0).toUpperCase() + picked.slice(1);

  const ranked = rows
    .filter((r) => r.scan && r.brand.category === picked)
    .map((r) => {
      const score = computeReadinessScore(r.scan!);
      return {
        name: r.brand.name,
        score,
        tier: readinessTier(score),
        signals: countSignals(r.scan!),
        openAgents: r.scan!.allowedAgentCount ?? 0,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((b, i) => ({ ...b, rank: i + 1 }));

  if (ranked.length >= 3) {
    stories.push({
      id: `leaderboard-${picked}`,
      priority: 45 + Math.round(Math.random() * 10),
      contentType: "category-leaderboard",
      title: `${categoryName} Leaderboard`,
      platforms: ["x", "linkedin"],
      templateData: {
        categoryName,
        categoryId: picked,
        brands: ranked,
        totalBrands: rows.filter((r) => r.scan).length,
      },
      imageTemplate: "leaderboard",
    });
  }

  return stories;
}

function detectAgentReadiness(
  rows: MatrixRow[],
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

  const agentUAs = picked.userAgentStrings;

  const scored = rows
    .filter((r) => r.scan)
    .map((r) => {
      const agentStatus = parseAgentStatus(r.scan!.agentStatusJson);
      const statuses = agentUAs.map((ua) => agentStatus[ua] ?? "no_rule");
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
      const statusOrder: Record<string, number> = { allowed: 0, no_rule: 1, inconclusive: 2, restricted: 3, blocked: 4 };
      const aDiff = statusOrder[a.status] ?? 2;
      const bDiff = statusOrder[b.status] ?? 2;
      if (aDiff !== bDiff) return aDiff - bDiff;
      return b.readinessScore - a.readinessScore;
    })
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
        totalBrands: rows.filter((r) => r.scan).length,
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
  const rows = getMatrixData();

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
    ...detectBigMovers(rows),
    ...detectCategoryLeaderboards(rows, recentTopics),
    ...detectAgentReadiness(rows, recentTopics),
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
