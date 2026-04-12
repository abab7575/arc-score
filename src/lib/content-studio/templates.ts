/**
 * Content Studio — Pure Template Functions
 *
 * Each function takes a platform + data and returns a formatted string.
 * No DB access — just string assembly via template literals.
 */

export type Platform = "x" | "linkedin" | "newsletter";

export type ContentType =
  | "category-leaderboard"
  | "score-spotlight"
  | "biggest-movers"
  | "agent-readiness"
  | "weekly-roundup"
  | "news-reaction";

// ── Helpers ─────────────────────────────────────────────────────────

function tierEmoji(tier: string): string {
  const map: Record<string, string> = {
    Leader: "\u{1F7E2}",
    Strong: "\u{1F535}",
    Moderate: "\u{1F7E1}",
    Limited: "\u{1F7E0}",
    Minimal: "\u{1F534}",
  };
  return map[tier] || "";
}

function statusEmoji(status: string): string {
  const map: Record<string, string> = {
    allowed: "\u2705",
    no_rule: "\u2796",
    inconclusive: "\u2753",
    restricted: "\u{1F6A7}",
    blocked: "\u{1F6D1}",
  };
  return map[status] || "";
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "\u2026";
}

// ── Category Leaderboard ────────────────────────────────────────────

interface LeaderboardData {
  categoryName: string;
  categoryId: string;
  brands: { rank: number; name: string; score: number; tier: string; signals: number; openAgents: number }[];
  totalBrands: number;
}

export function categoryLeaderboardTemplate(
  platform: Platform,
  data: LeaderboardData
): string {
  const { categoryName, brands, totalBrands } = data;

  if (platform === "x") {
    const lines = brands
      .slice(0, 5)
      .map((b) => `${tierEmoji(b.tier)} ${ordinalSuffix(b.rank)} ${b.name} (${b.openAgents} agents open, ${b.signals} signals)`)
      .join("\n");
    return truncate(
      `${categoryName} AI Readiness Leaderboard\n\n${lines}\n\n${totalBrands} brands tracked on arcreport.ai`,
      280
    );
  }

  if (platform === "linkedin") {
    const lines = brands
      .map(
        (b) =>
          `${tierEmoji(b.tier)} ${ordinalSuffix(b.rank)}. ${b.name} \u2014 ${b.openAgents} agents open, ${b.signals}/7 signals (${b.tier})`
      )
      .join("\n");
    return `${categoryName} \u2014 AI Readiness Leaderboard\n\nWhich ${categoryName.toLowerCase()} brands are most open to AI agents? Here's how the top performers stack up:\n\n${lines}\n\nWe measure agent access (robots.txt), structured data signals, and AI commerce protocols like llms.txt and UCP.\n\n${totalBrands} brands tracked daily.\n\nFull rankings: arcreport.ai\n\n#AICommerce #Ecommerce #RetailTech #ARCReport`;
  }

  // newsletter
  const rows = brands
    .map(
      (b) =>
        `| ${b.rank} | ${b.name} | ${b.openAgents} | ${b.signals}/7 | ${b.tier} |`
    )
    .join("\n");
  return `## ${categoryName} \u2014 AI Readiness Leaderboard\n\n| Rank | Brand | Open Agents | Signals | Tier |\n|------|-------|-------------|---------|------|\n${rows}\n\n*${totalBrands} brands tracked. Data updated daily.*\n\n[View full rankings \u2192](https://www.arcreport.ai)`;
}

// ── Score Spotlight ──────────────────────────────────────────────────

interface SpotlightData {
  brandName: string;
  brandSlug: string;
  readinessScore: number;
  tier: string;
  signalBreakdown: { name: string; present: boolean }[];
  agentAccess: { agent: string; status: string }[];
  openAgents: number;
  blockedAgents: number;
  rank: number;
  totalBrands: number;
}

export function scoreSpotlightTemplate(
  platform: Platform,
  data: SpotlightData
): string {
  const { brandName, readinessScore, tier, signalBreakdown, agentAccess, openAgents, blockedAgents, rank, totalBrands } = data;

  const signalsPresentCount = signalBreakdown.filter((s) => s.present).length;
  const signalsTotalCount = signalBreakdown.length;

  if (platform === "x") {
    const agentSummary = `${openAgents} agents open, ${blockedAgents} blocked`;
    const topSignals = signalBreakdown
      .filter((s) => s.present)
      .slice(0, 3)
      .map((s) => s.name)
      .join(", ");
    return truncate(
      `${tierEmoji(tier)} ${brandName}: ${agentSummary}\n\nSignals: ${topSignals}\nRank: ${ordinalSuffix(rank)} of ${totalBrands}\n\narcreport.ai/brand/${data.brandSlug}`,
      280
    );
  }

  if (platform === "linkedin") {
    const signalLines = signalBreakdown
      .map((s) => `${s.present ? "\u2705" : "\u274C"} ${s.name}`)
      .join("\n");
    const agentLines = agentAccess
      .map((a) => `${statusEmoji(a.status)} ${a.agent}: ${a.status}`)
      .join("\n");
    return `ARC Report Spotlight: ${brandName}\n\n${tierEmoji(tier)} Tier: ${tier} | ${openAgents} agents open, ${blockedAgents} blocked\nRanked ${ordinalSuffix(rank)} of ${totalBrands} brands\n\nSignals (${signalsPresentCount}/${signalsTotalCount}):\n${signalLines}\n\nAgent Access:\n${agentLines}\n\nARC Report tracks how e-commerce sites interact with AI shopping agents \u2014 from ChatGPT Shopping to browser-automation agents like Operator.\n\nFull report: arcreport.ai/brand/${data.brandSlug}\n\n#AICommerce #Ecommerce #ARCReport`;
  }

  // newsletter
  const signalRows = signalBreakdown
    .map((s) => `| ${s.name} | ${s.present ? "\u2705" : "\u274C"} |`)
    .join("\n");
  const agentRows = agentAccess
    .map((a) => `| ${a.agent} | ${a.status} |`)
    .join("\n");
  return `## ARC Report Spotlight: ${brandName}\n\n**Tier: ${tier}** | ${openAgents} agents open, ${blockedAgents} blocked | Ranked ${ordinalSuffix(rank)} of ${totalBrands}\n\n### Signals (${signalsPresentCount}/${signalsTotalCount})\n\n| Signal | Present |\n|--------|---------|\n${signalRows}\n\n### Agent Access\n\n| Agent | Status |\n|-------|--------|\n${agentRows}\n\n[View full report \u2192](https://www.arcreport.ai/brand/${data.brandSlug})`;
}

// ── Biggest Movers ──────────────────────────────────────────────────

interface MoverEntry {
  name: string;
  changeCount: number;
  score: number;
  tier: string;
}

interface MoversData {
  direction: "up" | "down" | "both";
  movers: MoverEntry[];
}

export function biggestMoversTemplate(
  platform: Platform,
  data: MoversData
): string {
  const { movers } = data;
  const label = "Most Active This Week";

  if (platform === "x") {
    const lines = movers
      .slice(0, 5)
      .map((m) => `${tierEmoji(m.tier)} ${m.name}: ${m.changeCount} changes`)
      .join("\n");
    return truncate(
      `AI Agent Readiness \u2014 ${label}\n\n${lines}\n\narcreport.ai`,
      280
    );
  }

  if (platform === "linkedin") {
    const lines = movers
      .map((m) => `\u{1F504} ${m.name}: ${m.changeCount} changes (current tier: ${m.tier})`)
      .join("\n");
    return `AI Agent Readiness \u2014 ${label}\n\nWhich brands had the most changes to their AI agent posture this week?\n\n${lines}\n\nChanges include robots.txt updates, new structured data signals, platform migrations, and more.\n\nTrack the full index: arcreport.ai\n\n#AICommerce #Ecommerce #RetailTech`;
  }

  // newsletter
  const rows = movers
    .map(
      (m) =>
        `| ${m.name} | ${m.changeCount} | ${m.score} | ${m.tier} |`
    )
    .join("\n");
  return `## ${label}\n\n| Brand | Changes | Readiness Score | Tier |\n|-------|---------|-----------------|------|\n${rows}\n\n*Changes tracked daily across robots.txt, structured data, agent access, and more.*`;
}

// ── Agent Readiness ─────────────────────────────────────────────────

interface AgentReadinessData {
  agentName: string;
  agentType: string;
  agentCompany: string;
  brands: { rank: number; name: string; status: string; readinessScore: number; openAgents: number }[];
  totalBrands: number;
  allowedCount: number;
  blockedCount: number;
}

export function agentReadinessTemplate(
  platform: Platform,
  data: AgentReadinessData
): string {
  const { agentName, agentType, brands, totalBrands, allowedCount, blockedCount } = data;

  if (platform === "x") {
    const lines = brands
      .slice(0, 5)
      .map((b) => `${statusEmoji(b.status)} ${b.name}: ${b.status}`)
      .join("\n");
    return truncate(
      `${agentName} access across top brands\n\n${lines}\n\n${allowedCount} allow / ${blockedCount} block\narcreport.ai/agents`,
      280
    );
  }

  if (platform === "linkedin") {
    const lines = brands
      .map(
        (b) =>
          `${statusEmoji(b.status)} ${ordinalSuffix(b.rank)}. ${b.name} \u2014 ${b.status}`
      )
      .join("\n");
    return `Which brands allow ${agentName}?\n\n${agentName} is a ${agentType}-based AI shopping agent from ${data.agentCompany}. ${agentType === "feed" ? "It reads structured data and product feeds." : "It navigates sites with browser automation."}\n\nTop brands by access:\n\n${lines}\n\nOf ${totalBrands} brands tracked: ${allowedCount} allow, ${blockedCount} block.\n\nExplore all agents: arcreport.ai/agents\n\n#AICommerce #AIAgents #Ecommerce`;
  }

  // newsletter
  const rows = brands
    .map((b) => `| ${b.rank} | ${b.name} | ${b.status} | ${b.readinessScore} |`)
    .join("\n");
  return `## ${agentName} \u2014 Brand Access Report\n\n**Agent type:** ${agentType} | **Company:** ${data.agentCompany}\n**${allowedCount}** brands allow | **${blockedCount}** brands block\n\n| Rank | Brand | Status | Readiness Score |\n|------|-------|--------|----------------|\n${rows}\n\n*Access status based on robots.txt policy and HTTP user-agent testing across ${totalBrands} brands.*`;
}

// ── Weekly Roundup ──────────────────────────────────────────────────

interface WeeklyRoundupData {
  totalBrands: number;
  totalChanges: number;
  brandsMoving: number;
  topBrands: { name: string; score: number; tier: string; openAgents: number }[];
  movers: { name: string; changeCount: number }[];
  recentChanges: { field: string; oldValue: string | null; newValue: string | null }[];
  recentArticles: { title: string }[];
}

export function weeklyRoundupTemplate(
  platform: Platform,
  data: WeeklyRoundupData
): string {
  const { totalBrands, totalChanges, brandsMoving, topBrands, movers, recentArticles } = data;

  if (platform === "x") {
    const top3 = topBrands
      .slice(0, 3)
      .map((b) => `${tierEmoji(b.tier)} ${b.name}: ${b.openAgents} agents open`)
      .join("\n");
    return truncate(
      `ARC Report Weekly Roundup\n\n${totalBrands} brands tracked | ${totalChanges} changes this week\n\nTop 3:\n${top3}\n\narcreport.ai`,
      280
    );
  }

  if (platform === "linkedin") {
    const topList = topBrands
      .slice(0, 5)
      .map((b) => `${tierEmoji(b.tier)} ${b.name}: ${b.openAgents} agents open (${b.tier})`)
      .join("\n");
    const moverList =
      movers.length > 0
        ? movers
            .slice(0, 3)
            .map((m) => `\u{1F504} ${m.name}: ${m.changeCount} changes`)
            .join("\n")
        : "No major movements this week.";
    return `ARC Report \u2014 Weekly Roundup\n\n${totalBrands} brands tracked | ${totalChanges} changes across ${brandsMoving} brands this week\n\nTop Performers:\n${topList}\n\nMost Active:\n${moverList}\n\nAI shopping agents are reshaping e-commerce. Is your site ready?\n\narcreport.ai\n\n#AICommerce #Ecommerce #WeeklyRoundup`;
  }

  // newsletter
  const topRows = topBrands
    .slice(0, 10)
    .map((b, i) => `| ${i + 1} | ${b.name} | ${b.openAgents} | ${b.tier} |`)
    .join("\n");
  const moverRows =
    movers.length > 0
      ? movers
          .map((m) => `| ${m.name} | ${m.changeCount} |`)
          .join("\n")
      : "| *No major movements* | |";
  const newsItems =
    recentArticles.length > 0
      ? recentArticles
          .slice(0, 5)
          .map((a) => `- ${a.title}`)
          .join("\n")
      : "- *No news highlights this week*";

  return `## ARC Report \u2014 Weekly Roundup\n\n**${totalBrands} brands tracked** | **${totalChanges} changes** across **${brandsMoving} brands** this week\n\n### Top Performers\n\n| Rank | Brand | Open Agents | Tier |\n|------|-------|-------------|------|\n${topRows}\n\n### Most Active\n\n| Brand | Changes |\n|-------|---------|\n${moverRows}\n\n### News Highlights\n\n${newsItems}\n\n---\n\n[Explore the full index \u2192](https://www.arcreport.ai)`;
}

// ── News Reaction ───────────────────────────────────────────────────

interface NewsArticle {
  title: string;
  url: string;
  sourceName: string;
}

interface NewsReactionData {
  articles: NewsArticle[];
  commentary: string;
}

export function newsReactionTemplate(
  platform: Platform,
  data: NewsReactionData
): string {
  const { articles, commentary } = data;
  const firstArticle = articles[0];
  if (!firstArticle) return "No articles selected.";

  if (platform === "x") {
    const intro = commentary
      ? commentary
      : `Interesting: "${firstArticle.title}"`;
    const tagline = "Here's what this means for AI agent readiness.";
    return truncate(`${intro}\n\n${tagline}\n\narcreport.ai`, 280);
  }

  if (platform === "linkedin") {
    const articleList = articles
      .map((a) => `\u{1F4F0} "${a.title}" (${a.sourceName})`)
      .join("\n");
    const commentBlock = commentary
      ? `\n${commentary}\n`
      : "\nThis matters for AI agent readiness because it signals how the industry is adapting to AI-powered shopping.\n";
    return `In the news:\n\n${articleList}\n${commentBlock}\nAt ARC Report, we track how ${articles.length > 1 ? "developments like these" : "this"} impacts the ability of AI agents to shop on e-commerce sites.\n\nLearn more: arcreport.ai\n\n#AICommerce #Ecommerce #RetailNews`;
  }

  // newsletter
  const articleBlocks = articles
    .map(
      (a) => `### ${a.title}\n*Source: ${a.sourceName}*\n\n[Read article \u2192](${a.url})`
    )
    .join("\n\n");
  const commentBlock = commentary
    ? `\n\n**Our take:** ${commentary}`
    : "";
  return `## News Reaction\n\n${articleBlocks}${commentBlock}\n\n---\n\n*How does this affect AI agent readiness? [See the data \u2192](https://www.arcreport.ai)*`;
}
