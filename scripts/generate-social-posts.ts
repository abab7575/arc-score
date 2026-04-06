/**
 * Generate Social Media Posts — creates ready-to-copy X and LinkedIn posts
 * from real scan data in the SQLite database.
 *
 * Usage:
 *   npx tsx scripts/generate-social-posts.ts
 *
 * Uses the sqlite3 CLI to query the database, avoiding native module issues.
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "arc-score.db");

// ─── SQLite helper ─────────────────────────────────────────────────

function query<T = Record<string, string>>(sql: string): T[] {
  const result = execSync(
    `sqlite3 -json "${dbPath}" "${sql.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
  ).trim();
  if (!result) return [];
  return JSON.parse(result) as T[];
}

// ─── Helpers ────────────────────────────────────────────────────────

function pct(n: number, total: number): string {
  return `${Math.round((n / total) * 100)}%`;
}

function plural(n: number, word: string): string {
  return n === 1 ? `${n} ${word}` : `${n} ${word}s`;
}

function divider(title: string) {
  const line = "\u2500".repeat(60);
  console.log(`\n${line}`);
  console.log(`  ${title}`);
  console.log(`${line}\n`);
}

function printPost(label: string, text: string) {
  const charCount = text.length;
  const fits = charCount <= 280 ? "OK" : "OVER";
  console.log(`[${label}] (${charCount} chars \u2014 ${fits})`);
  console.log(text);
  console.log();
}

// ─── Data queries ───────────────────────────────────────────────────

interface LatestScan {
  brand_id: string;
  name: string;
  slug: string;
  category: string;
  allowed_agent_count: string;
  blocked_agent_count: string;
  has_llms_txt: string;
  has_agents_txt: string;
  has_sitemap: string;
  has_schema_product: string;
  has_json_ld: string;
  has_open_graph: string;
  has_product_feed: string;
  scanned_at: string;
}

const latestScans = query<LatestScan>(`
  SELECT ls.brand_id, b.name, b.slug, b.category,
         ls.allowed_agent_count, ls.blocked_agent_count,
         ls.has_llms_txt, ls.has_agents_txt, ls.has_sitemap,
         ls.has_schema_product, ls.has_json_ld, ls.has_open_graph,
         ls.has_product_feed, ls.scanned_at
  FROM lightweight_scans ls
  JOIN brands b ON b.id = ls.brand_id AND b.active = 1
  WHERE ls.id IN (SELECT MAX(id) FROM lightweight_scans GROUP BY brand_id)
  ORDER BY ls.scanned_at DESC
`);

interface ChangelogRow {
  brand_name: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
  category: string;
}

const recentChanges = query<ChangelogRow>(`
  SELECT b.name AS brand_name, ce.field, ce.old_value, ce.new_value,
         ce.detected_at, b.category
  FROM changelog_entries ce
  JOIN brands b ON b.id = ce.brand_id AND b.active = 1
  WHERE ce.detected_at >= datetime('now', '-14 days')
  ORDER BY ce.detected_at DESC
`);

// ─── Derived stats ──────────────────────────────────────────────────

const totalBrands = latestScans.length;
const fullyOpen = latestScans.filter(s => +s.blocked_agent_count === 0).length;
const blockingSome = latestScans.filter(s => +s.blocked_agent_count > 0).length;
const withLlmsTxt = latestScans.filter(s => +s.has_llms_txt === 1).length;

// ─── 1. Leaderboard Post ───────────────────────────────────────────

function computeReadinessScore(s: LatestScan): number {
  // Higher = more AI-ready. Weights chosen so agent access dominates,
  // with structured data and llms.txt as tiebreakers.
  let score = 0;
  score += +s.allowed_agent_count * 10;   // 0-80 pts
  score -= +s.blocked_agent_count * 10;   // penalty
  score += +s.has_llms_txt * 15;          // strong signal
  score += +s.has_agents_txt * 10;
  score += +s.has_sitemap * 3;
  score += +s.has_schema_product * 3;
  score += +s.has_json_ld * 3;
  score += +s.has_open_graph * 3;
  score += +s.has_product_feed * 5;
  return score;
}

function generateLeaderboardPost() {
  divider("1. LEADERBOARD POST");

  const ranked = latestScans
    .map(s => ({ ...s, score: computeReadinessScore(s) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const list = ranked.map((r, i) => `${i + 1}. ${r.name}`).join("\n");

  const xPost = [
    `This week's Top 5 AI-Ready brands:`,
    ``,
    list,
    ``,
    `Full leaderboard: arcreport.ai/leaderboard`,
  ].join("\n");

  const linkedIn = [
    `This week's Top 5 AI-Ready brands (out of ${totalBrands.toLocaleString()} scanned):`,
    ``,
    ...ranked.map((r, i) =>
      `${i + 1}. ${r.name} \u2014 ${plural(+r.allowed_agent_count, "agent")} allowed, ${+r.has_llms_txt ? "has llms.txt" : "no llms.txt"}`
    ),
    ``,
    `These brands allow all major AI agents (GPTBot, ClaudeBot, PerplexityBot, etc.) to access their product data, and publish structured signals like llms.txt.`,
    ``,
    `See the full leaderboard: arcreport.ai/leaderboard`,
  ].join("\n");

  printPost("X / Twitter", xPost);
  printPost("LinkedIn", linkedIn);
}

// ─── 2. Notable Change Post ────────────────────────────────────────

function generateNotableChangePost() {
  divider("2. NOTABLE CHANGE POST");

  // Look for the most interesting recent agent-access change
  const agentChanges = recentChanges.filter(c => c.field.startsWith("agent_access_"));

  // Group by brand to find brands that blocked or unblocked agents
  const brandChanges = new Map<string, { blocked: string[]; allowed: string[]; category: string }>();
  for (const c of agentChanges) {
    if (!brandChanges.has(c.brand_name)) {
      brandChanges.set(c.brand_name, { blocked: [], allowed: [], category: c.category });
    }
    const entry = brandChanges.get(c.brand_name)!;
    const agent = c.field.replace("agent_access_", "");
    if (c.new_value === "blocked" && c.old_value !== "blocked") {
      if (!entry.blocked.includes(agent)) entry.blocked.push(agent);
    } else if (c.old_value === "blocked" && c.new_value !== "blocked") {
      if (!entry.allowed.includes(agent)) entry.allowed.push(agent);
    }
  }

  // Pick the most notable: prefer brands that blocked many agents, or unblocked them
  let bestBrand = "";
  let bestAction = "";
  let bestAgents: string[] = [];
  let bestScore = 0;

  for (const [brand, data] of brandChanges) {
    if (data.blocked.length > bestScore) {
      bestBrand = brand;
      bestAction = "blocked";
      bestAgents = data.blocked;
      bestScore = data.blocked.length;
    }
    if (data.allowed.length > bestScore) {
      bestBrand = brand;
      bestAction = "unblocked";
      bestAgents = data.allowed;
      bestScore = data.allowed.length;
    }
  }

  if (!bestBrand) {
    // Fall back to any interesting change
    const llmsChanges = recentChanges.filter(c => c.field === "llms_txt" && c.new_value === "true");
    if (llmsChanges.length > 0) {
      const c = llmsChanges[0];
      const xPost = `${c.brand_name} just published llms.txt \u2014 a clear signal they want AI agents to understand their products.\n\nTrack who's adopting: arcreport.ai/leaderboard`;
      const linkedIn = `${c.brand_name} just published llms.txt.\n\nThis is a machine-readable file that tells AI agents what the brand sells, what pages matter, and how to navigate their catalog. It's the clearest signal a brand can send that they're ready for AI-powered shopping.\n\nSee who else is adopting: arcreport.ai/leaderboard`;
      printPost("X / Twitter", xPost);
      printPost("LinkedIn", linkedIn);
      return;
    }
    console.log("  (No notable agent-access changes found in the last 14 days)\n");
    return;
  }

  const agentList = bestAgents.length <= 3
    ? bestAgents.join(", ")
    : `${bestAgents.length} AI agents`;

  const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const xPost = bestAction === "blocked"
    ? `${bestBrand} just ${bestAction} ${agentList}.\n\nWhat that means for AI shopping: arcreport.ai/brand/${slugify(bestBrand)}`
    : `${bestBrand} just opened access to ${agentList}.\n\nThe shift toward AI-readable commerce continues: arcreport.ai/brand/${slugify(bestBrand)}`;

  const linkedIn = bestAction === "blocked"
    ? [
        `${bestBrand} just ${bestAction} ${bestAgents.join(", ")} via robots.txt.`,
        ``,
        `This means AI agents like ChatGPT, Claude, and Perplexity can no longer crawl their product pages. For consumers using AI shopping assistants, ${bestBrand} products will become less visible.`,
        ``,
        `We track these changes daily across ${totalBrands.toLocaleString()} brands: arcreport.ai`,
      ].join("\n")
    : [
        `${bestBrand} just opened access to ${bestAgents.join(", ")}.`,
        ``,
        `AI shopping agents can now crawl their product catalog, meaning ${bestBrand} products will start appearing in AI-powered recommendations.`,
        ``,
        `We track these changes daily across ${totalBrands.toLocaleString()} brands: arcreport.ai`,
      ].join("\n");

  printPost("X / Twitter", xPost);
  printPost("LinkedIn", linkedIn);
}

// ─── 3. Stats Post ─────────────────────────────────────────────────

function generateStatsPost() {
  divider("3. STATS POST");

  const openPct = pct(fullyOpen, totalBrands);
  const blockPct = pct(blockingSome, totalBrands);
  const llmsPct = pct(withLlmsTxt, totalBrands);

  const xPost = [
    `We scanned ${totalBrands.toLocaleString()} brands this week.`,
    ``,
    `${openPct} fully open to AI agents`,
    `${blockPct} blocking at least one`,
    `${llmsPct} have llms.txt`,
    ``,
    `Full breakdown: arcreport.ai/matrix`,
  ].join("\n");

  const linkedIn = [
    `We scanned ${totalBrands.toLocaleString()} brands this week. Here's the state of AI readiness in e-commerce:`,
    ``,
    `\u2022 ${openPct} are fully open to AI agents (${fullyOpen} brands)`,
    `\u2022 ${blockPct} are blocking at least one AI agent (${blockingSome} brands)`,
    `\u2022 ${llmsPct} have published an llms.txt file (${withLlmsTxt} brands)`,
    ``,
    `Most brands haven't made an active choice yet \u2014 they simply have no robots.txt rules for AI crawlers. The question is whether "no rule" becomes "allowed" or "blocked" as awareness grows.`,
    ``,
    `Explore the full matrix: arcreport.ai/matrix`,
  ].join("\n");

  printPost("X / Twitter", xPost);
  printPost("LinkedIn", linkedIn);
}

// ─── 4. New Adopter Post ───────────────────────────────────────────

function generateNewAdopterPost() {
  divider("4. NEW ADOPTER POST");

  const newLlms = recentChanges.filter(c => c.field === "llms_txt" && c.new_value === "true");

  // Deduplicate by brand name
  const seen = new Set<string>();
  const uniqueNewLlms = newLlms.filter(c => {
    if (seen.has(c.brand_name)) return false;
    seen.add(c.brand_name);
    return true;
  });

  if (uniqueNewLlms.length === 0) {
    console.log("  (No new llms.txt adopters in the last 14 days)\n");
    return;
  }

  const brandNames = uniqueNewLlms.slice(0, 5).map(c => c.brand_name);
  const count = uniqueNewLlms.length;

  const shortList = brandNames.length <= 3
    ? brandNames.join(", ")
    : brandNames.slice(0, 3).join(", ") + ` + ${count - 3} more`;

  const xPost = count === 1
    ? `${brandNames[0]} just published llms.txt \u2014 signaling AI agents are welcome.\n\nSee who's ahead: arcreport.ai/leaderboard`
    : `${plural(count, "brand")} published llms.txt this week: ${shortList}.\n\nThe adoption curve is moving.\n\narcreport.ai/leaderboard`;

  const linkedIn = [
    `${plural(count, "new brand")} published llms.txt in the last two weeks:`,
    ``,
    ...brandNames.map(n => `\u2022 ${n}`),
    ...(count > brandNames.length ? [`\u2022 ...and ${count - brandNames.length} more`] : []),
    ``,
    `llms.txt is a machine-readable file that tells AI agents what a brand sells, which pages matter, and how to navigate their catalog. It's becoming the standard way for brands to signal they're ready for AI-powered commerce.`,
    ``,
    `Total brands with llms.txt: ${withLlmsTxt} out of ${totalBrands.toLocaleString()}`,
    ``,
    `See who's adopting: arcreport.ai/leaderboard`,
  ].join("\n");

  printPost("X / Twitter", xPost);
  printPost("LinkedIn", linkedIn);
}

// ─── 5. Comparison Post ────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  fashion: "Fashion", electronics: "Electronics", beauty: "Beauty",
  home: "Home", "food-beverage": "Food & Beverage", dtc: "DTC",
  luxury: "Luxury", sports: "Sports", general: "General Retail",
  health: "Health", grocery: "Grocery", kids: "Kids",
  pet: "Pet", automotive: "Automotive",
};

function formatCat(c: string): string {
  return CATEGORY_LABELS[c] || c;
}

function generateComparisonPost() {
  divider("5. COMPARISON POST");

  // Blocking rate by category
  const categoryStats = new Map<string, { total: number; blocking: number }>();
  for (const s of latestScans) {
    if (!categoryStats.has(s.category)) {
      categoryStats.set(s.category, { total: 0, blocking: 0 });
    }
    const entry = categoryStats.get(s.category)!;
    entry.total++;
    if (+s.blocked_agent_count > 0) entry.blocking++;
  }

  // Sort by blocking rate descending
  const sorted = [...categoryStats.entries()]
    .filter(([_, v]) => v.total >= 10) // only categories with enough brands
    .map(([cat, v]) => ({
      category: cat,
      total: v.total,
      blocking: v.blocking,
      rate: v.blocking / v.total,
    }))
    .sort((a, b) => b.rate - a.rate);

  if (sorted.length < 2) {
    console.log("  (Not enough category data for comparison)\n");
    return;
  }

  const highest = sorted[0];
  // For the ratio comparison, find the lowest non-zero category
  const lowestNonZero = sorted.filter(c => c.rate > 0).pop();
  const lowest = sorted[sorted.length - 1];

  const highCat = formatCat(highest.category);
  const highPct = pct(highest.blocking, highest.total);

  let xPost: string;
  if (lowestNonZero && lowestNonZero.category !== highest.category) {
    const lowCat = formatCat(lowestNonZero.category);
    const lowPct = pct(lowestNonZero.blocking, lowestNonZero.total);
    const ratio = (highest.rate / lowestNonZero.rate).toFixed(1);
    xPost = `${highCat} brands are ${ratio}x more likely to block AI agents than ${lowCat} brands.\n\n${highCat}: ${highPct} blocking\n${lowCat}: ${lowPct} blocking\n\nFull category breakdown: arcreport.ai/matrix`;
  } else {
    const lowCat = formatCat(lowest.category);
    const lowPct = pct(lowest.blocking, lowest.total);
    xPost = `${highCat} brands block AI agents the most (${highPct}). ${lowCat} brands block the least (${lowPct}).\n\nFull category breakdown: arcreport.ai/matrix`;
  }

  const lowCat = formatCat(lowest.category);
  const lowPct = pct(lowest.blocking, lowest.total);

  // Build a compact table for LinkedIn
  const topCategories = sorted.slice(0, 6);
  const linkedIn = [
    `Which e-commerce categories are most likely to block AI agents?`,
    ``,
    ...topCategories.map(c =>
      `${formatCat(c.category).padEnd(16)} ${pct(c.blocking, c.total).padStart(4)} blocking  (${c.blocking}/${c.total})`
    ),
    ``,
    `${highCat} leads at ${highPct}, while ${lowCat} is lowest at ${lowPct}.`,
    ``,
    `Full category breakdown across ${totalBrands.toLocaleString()} brands: arcreport.ai/matrix`,
  ].join("\n");

  printPost("X / Twitter", xPost);
  printPost("LinkedIn", linkedIn);
}

// ─── Run ────────────────────────────────────────────────────────────

console.log("========================================");
console.log("  ARC REPORT \u2014 Social Post Generator");
console.log(`  ${totalBrands.toLocaleString()} brands | ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`);
console.log("========================================");

generateLeaderboardPost();
generateNotableChangePost();
generateStatsPost();
generateNewAdopterPost();
generateComparisonPost();

console.log("\u2500".repeat(60));
console.log("  Done. Copy the posts above and paste into X or LinkedIn.");
console.log("\u2500".repeat(60));
