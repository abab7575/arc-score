/**
 * Single source of truth for site-wide constants.
 * Counts that can drift (brand totals, last scan time) must come from the DB
 * via getIndexStats() in @/lib/db/queries — never hardcode them in copy.
 */

export const SITE_NAME = "ARC Report";

/** Canonical origin. The apex (arcreport.ai) 301s here — see src/middleware.ts. */
export const SITE_URL = process.env.BASE_URL || "https://www.arcreport.ai";

export const APEX_HOST = "arcreport.ai";
export const CANONICAL_HOST = "www.arcreport.ai";

export const CONTACT_EMAIL = "hello@arcreport.ai";

/** The 9 AI agents tracked in every scan (robots.txt + live HTTP tests). */
export const TRACKED_AGENTS = [
  { id: "GPTBot", company: "OpenAI", product: "ChatGPT training" },
  { id: "ChatGPT-User", company: "OpenAI", product: "ChatGPT live browsing" },
  { id: "ClaudeBot", company: "Anthropic", product: "Claude training" },
  { id: "Claude-Web", company: "Anthropic", product: "Claude live browsing" },
  { id: "PerplexityBot", company: "Perplexity", product: "Perplexity / Comet" },
  { id: "Google-Extended", company: "Google", product: "AI Mode / Gemini" },
  { id: "Amazonbot", company: "Amazon", product: "Buy For Me" },
  { id: "Bingbot", company: "Microsoft", product: "Copilot / Bing" },
  { id: "CCBot", company: "Common Crawl", product: "Open training data" },
] as const;

export const TRACKED_AGENT_IDS: string[] = TRACKED_AGENTS.map((a) => a.id);
export const TRACKED_AGENT_COUNT = TRACKED_AGENTS.length;

/** Display-only approximation for static copy (metadata, prose). */
export const BRAND_COUNT_DISPLAY = "1,000+";

/** ARC Score version — bump only with a /methodology changelog entry. */
export const SCORE_VERSION = "1.0";

/** Pro tier (kept functional but quiet at /pro). */
export const PRO_PRICE_MONTHLY = 149;
export const PRO_FEATURES = [
  "Watchlists for the brands you track",
  "Daily alert emails when a watched brand changes",
  "Full multi-year history (free pages show 90 days)",
  "CSV + JSON export of full history",
] as const;

export const FREE_FEATURES = [
  "Every brand, every signal, scanned daily",
  "Full agent access matrix, compare tool, and instant scans",
  "Per-brand ARC Score with component breakdown",
  "90 days of change history on every brand page",
  "Public read API, MCP server, RSS, and CC BY 4.0 downloads",
] as const;

export const DATA_LICENSE = {
  name: "CC BY 4.0",
  url: "https://creativecommons.org/licenses/by/4.0/",
  attribution: `Data: ARC Report (${CANONICAL_HOST}), licensed CC BY 4.0`,
} as const;
