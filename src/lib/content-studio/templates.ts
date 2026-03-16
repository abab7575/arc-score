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

function gradeEmoji(grade: string): string {
  const map: Record<string, string> = {
    A: "\u{1F7E2}",
    B: "\u{1F535}",
    C: "\u{1F7E1}",
    D: "\u{1F7E0}",
    F: "\u{1F534}",
  };
  return map[grade] || "";
}

function scoreBar(score: number): string {
  const filled = Math.round(score / 10);
  return "\u2588".repeat(filled) + "\u2591".repeat(10 - filled);
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
  brands: { rank: number; name: string; score: number; grade: string }[];
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
      .map((b) => `${gradeEmoji(b.grade)} ${ordinalSuffix(b.rank)} ${b.name} (${b.score}/100)`)
      .join("\n");
    return truncate(
      `${categoryName} AI Agent Readiness Leaderboard\n\n${lines}\n\nScored across ${totalBrands} brands on arcreport.ai`,
      280
    );
  }

  if (platform === "linkedin") {
    const lines = brands
      .map(
        (b) =>
          `${gradeEmoji(b.grade)} ${ordinalSuffix(b.rank)}. ${b.name} \u2014 ${b.score}/100 (Grade ${b.grade})`
      )
      .join("\n");
    return `${categoryName} \u2014 AI Agent Readiness Leaderboard\n\nWhich ${categoryName.toLowerCase()} brands are best prepared for AI shopping agents? Here's how the top performers stack up:\n\n${lines}\n\nWe score brands across 7 categories \u2014 from discoverability and product data to cart/checkout and agentic commerce protocols.\n\n${totalBrands} brands tracked and scored weekly.\n\nFull rankings: arcreport.ai\n\n#AICommerce #Ecommerce #RetailTech #ARCReport`;
  }

  // newsletter
  const rows = brands
    .map(
      (b) =>
        `| ${b.rank} | ${b.name} | ${b.score} | ${b.grade} |`
    )
    .join("\n");
  return `## ${categoryName} \u2014 AI Agent Readiness Leaderboard\n\n| Rank | Brand | Score | Grade |\n|------|-------|-------|-------|\n${rows}\n\n*${totalBrands} brands tracked. Scores updated weekly across 7 categories.*\n\n[View full rankings \u2192](https://arcreport.ai)`;
}

// ── Score Spotlight ──────────────────────────────────────────────────

interface SpotlightData {
  brandName: string;
  brandSlug: string;
  overallScore: number;
  grade: string;
  categoryBreakdown: { name: string; score: number; grade: string }[];
  previousScore: number | null;
}

export function scoreSpotlightTemplate(
  platform: Platform,
  data: SpotlightData
): string {
  const { brandName, overallScore, grade, categoryBreakdown, previousScore } = data;
  const delta =
    previousScore !== null ? overallScore - previousScore : null;
  const deltaStr =
    delta !== null
      ? delta > 0
        ? ` (\u2191${delta})`
        : delta < 0
        ? ` (\u2193${Math.abs(delta)})`
        : " (unchanged)"
      : "";

  if (platform === "x") {
    const top = categoryBreakdown
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((c) => `${c.name}: ${c.score}`)
      .join(" | ");
    return truncate(
      `${gradeEmoji(grade)} ${brandName} scores ${overallScore}/100${deltaStr} on AI Agent Readiness\n\n${top}\n\nFull breakdown: arcreport.ai/brand/${data.brandSlug}`,
      280
    );
  }

  if (platform === "linkedin") {
    const breakdown = categoryBreakdown
      .sort((a, b) => b.score - a.score)
      .map((c) => `${gradeEmoji(c.grade)} ${c.name}: ${c.score}/100`)
      .join("\n");
    return `ARC Report Spotlight: ${brandName}\n\n${gradeEmoji(grade)} Overall: ${overallScore}/100 (Grade ${grade})${deltaStr}\n\nCategory Breakdown:\n${breakdown}\n\nARC Report measures how well e-commerce sites work with AI shopping agents \u2014 from ChatGPT Shopping to browser-automation agents like Operator.\n\nFull report: arcreport.ai/brand/${data.brandSlug}\n\n#AICommerce #Ecommerce #ARCReport`;
  }

  // newsletter
  const rows = categoryBreakdown
    .map((c) => `| ${c.name} | ${scoreBar(c.score)} | ${c.score} | ${c.grade} |`)
    .join("\n");
  return `## ARC Report Spotlight: ${brandName}\n\n**Overall: ${overallScore}/100 (Grade ${grade})**${deltaStr}\n\n| Category | | Score | Grade |\n|----------|---|-------|-------|\n${rows}\n\n[View full report \u2192](https://arcreport.ai/brand/${data.brandSlug})`;
}

// ── Biggest Movers ──────────────────────────────────────────────────

interface MoverEntry {
  name: string;
  score: number;
  previousScore: number;
  delta: number;
  grade: string;
}

interface MoversData {
  direction: "up" | "down" | "both";
  movers: MoverEntry[];
}

export function biggestMoversTemplate(
  platform: Platform,
  data: MoversData
): string {
  const { direction, movers } = data;
  const label =
    direction === "up"
      ? "Biggest Climbers"
      : direction === "down"
      ? "Biggest Drops"
      : "Biggest Movers";

  if (platform === "x") {
    const lines = movers
      .slice(0, 5)
      .map((m) => {
        const arrow = m.delta > 0 ? "\u2191" : "\u2193";
        return `${arrow}${Math.abs(m.delta)} ${m.name} (${m.score})`;
      })
      .join("\n");
    return truncate(
      `AI Agent Readiness \u2014 ${label} This Week\n\n${lines}\n\narcreport.ai`,
      280
    );
  }

  if (platform === "linkedin") {
    const lines = movers
      .map((m) => {
        const arrow = m.delta > 0 ? "\u{1F4C8}" : "\u{1F4C9}";
        return `${arrow} ${m.name}: ${m.previousScore} \u2192 ${m.score} (${m.delta > 0 ? "+" : ""}${m.delta})`;
      })
      .join("\n");
    return `AI Agent Readiness \u2014 ${label} This Week\n\nWhich brands made the biggest score changes?\n\n${lines}\n\nScores shift as brands improve (or regress) on structured data, checkout flows, and AI agent compatibility.\n\nTrack the full index: arcreport.ai\n\n#AICommerce #Ecommerce #RetailTech`;
  }

  // newsletter
  const rows = movers
    .map(
      (m) =>
        `| ${m.name} | ${m.previousScore} | ${m.score} | ${m.delta > 0 ? "+" : ""}${m.delta} | ${m.grade} |`
    )
    .join("\n");
  return `## ${label} This Week\n\n| Brand | Previous | Current | Change | Grade |\n|-------|----------|---------|--------|-------|\n${rows}\n\n*Scores measured weekly across 7 AI agent readiness categories.*`;
}

// ── Agent Readiness ─────────────────────────────────────────────────

interface AgentReadinessData {
  agentName: string;
  agentType: string;
  agentCompany: string;
  brands: { rank: number; name: string; score: number; grade: string }[];
  totalBrands: number;
}

export function agentReadinessTemplate(
  platform: Platform,
  data: AgentReadinessData
): string {
  const { agentName, agentType, brands, totalBrands } = data;

  if (platform === "x") {
    const lines = brands
      .slice(0, 5)
      .map((b) => `${gradeEmoji(b.grade)} ${b.name}: ${b.score}`)
      .join("\n");
    return truncate(
      `Top brands ready for ${agentName} (${agentType})\n\n${lines}\n\narcreport.ai/agents`,
      280
    );
  }

  if (platform === "linkedin") {
    const lines = brands
      .map(
        (b) =>
          `${gradeEmoji(b.grade)} ${ordinalSuffix(b.rank)}. ${b.name} \u2014 ${b.score}/100`
      )
      .join("\n");
    return `Which brands are most ready for ${agentName}?\n\n${agentName} is a ${agentType}-based AI shopping agent from ${data.agentCompany}. ${agentType === "feed" ? "It reads structured data and product feeds." : "It navigates sites with browser automation."}\n\nTop compatible brands:\n\n${lines}\n\nEach agent has unique needs \u2014 we score ${totalBrands} brands through 10 different agent lenses.\n\nExplore all agents: arcreport.ai/agents\n\n#AICommerce #AIAgents #Ecommerce`;
  }

  // newsletter
  const rows = brands
    .map((b) => `| ${b.rank} | ${b.name} | ${b.score} | ${b.grade} |`)
    .join("\n");
  return `## ${agentName} \u2014 Most Compatible Brands\n\n**Agent type:** ${agentType} | **Company:** ${data.agentCompany}\n\n| Rank | Brand | Score | Grade |\n|------|-------|-------|-------|\n${rows}\n\n*Compatibility scores based on ${agentName}'s weighted category priorities across ${totalBrands} brands.*`;
}

// ── Weekly Roundup ──────────────────────────────────────────────────

interface WeeklyRoundupData {
  totalBrands: number;
  avgScore: number;
  topBrands: { name: string; score: number; grade: string }[];
  movers: { name: string; delta: number; score: number }[];
  recentArticles: { title: string }[];
  todayScans: number;
}

export function weeklyRoundupTemplate(
  platform: Platform,
  data: WeeklyRoundupData
): string {
  const { totalBrands, avgScore, topBrands, movers, recentArticles } = data;

  if (platform === "x") {
    const top3 = topBrands
      .slice(0, 3)
      .map((b) => `${gradeEmoji(b.grade)} ${b.name}: ${b.score}`)
      .join("\n");
    return truncate(
      `ARC Report Weekly Roundup\n\n${totalBrands} brands tracked | Avg: ${avgScore}/100\n\nTop 3:\n${top3}\n\narcreport.ai`,
      280
    );
  }

  if (platform === "linkedin") {
    const topList = topBrands
      .slice(0, 5)
      .map((b) => `${gradeEmoji(b.grade)} ${b.name}: ${b.score}/100`)
      .join("\n");
    const moverList =
      movers.length > 0
        ? movers
            .slice(0, 3)
            .map(
              (m) =>
                `${m.delta > 0 ? "\u{1F4C8}" : "\u{1F4C9}"} ${m.name}: ${m.delta > 0 ? "+" : ""}${m.delta} (now ${m.score})`
            )
            .join("\n")
        : "No major movements this week.";
    return `ARC Report \u2014 Weekly Roundup\n\n${totalBrands} brands tracked | Average score: ${avgScore}/100\n\nTop Performers:\n${topList}\n\nBiggest Moves:\n${moverList}\n\nAI shopping agents are reshaping e-commerce. Is your site ready?\n\narcreport.ai\n\n#AICommerce #Ecommerce #WeeklyRoundup`;
  }

  // newsletter
  const topRows = topBrands
    .slice(0, 10)
    .map((b, i) => `| ${i + 1} | ${b.name} | ${b.score} | ${b.grade} |`)
    .join("\n");
  const moverRows =
    movers.length > 0
      ? movers
          .map(
            (m) =>
              `| ${m.name} | ${m.delta > 0 ? "+" : ""}${m.delta} | ${m.score} |`
          )
          .join("\n")
      : "| *No major movements* | | |";
  const newsItems =
    recentArticles.length > 0
      ? recentArticles
          .slice(0, 5)
          .map((a) => `- ${a.title}`)
          .join("\n")
      : "- *No news highlights this week*";

  return `## ARC Report \u2014 Weekly Roundup\n\n**${totalBrands} brands tracked** | Average score: **${avgScore}/100**\n\n### Top Performers\n\n| Rank | Brand | Score | Grade |\n|------|-------|-------|-------|\n${topRows}\n\n### Biggest Movers\n\n| Brand | Change | Current |\n|-------|--------|--------|\n${moverRows}\n\n### News Highlights\n\n${newsItems}\n\n---\n\n[Explore the full index \u2192](https://arcreport.ai)`;
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
  return `## News Reaction\n\n${articleBlocks}${commentBlock}\n\n---\n\n*How does this affect AI agent readiness? [See the data \u2192](https://arcreport.ai)*`;
}
