/**
 * Changelog Engine — Two-tier change confirmation system.
 *
 * Tier 1 (Immediate): robots.txt rule changes per agent.
 *   These are text-file diffs — if the rule changed, it changed.
 *
 * Tier 2 (Requires Confirmation): UA HTTP access verdicts, blocked agent count,
 *   CDN/WAF detection, structured data presence.
 *   These are inferences that can flicker due to timeouts, WAF, or CDN caching.
 *   A change must appear in two consecutive scans to be published.
 *
 * Never Published: Timeouts, rate limits (429), scan errors.
 *   These are scanner problems, not brand policy changes.
 */

import {
  insertChangelogEntry,
  getPendingChange,
  insertPendingChange,
  updatePendingChange,
  confirmAndDeletePendingChange,
  clearStalePendingChanges,
} from "@/lib/db/queries";

// ── Types ────────────────────────────────────────────────────────────

interface LightweightScanRow {
  brandId: number;
  robotsTxtFound: boolean;
  blockedAgentCount: number;
  allowedAgentCount: number;
  platform: string | null;
  cdn: string | null;
  waf: string | null;
  hasJsonLd: boolean;
  hasSchemaProduct: boolean;
  hasOpenGraph: boolean;
  hasSitemap: boolean;
  hasProductFeed: boolean;
  hasLlmsTxt: boolean;
  hasUcp: boolean;
  homepageResponseMs: number | null;
  resultJson: string;
  agentStatusJson: string;
  scannedAt: string;
}

// Fields that are robots.txt rule changes — published immediately
const ROBOTS_TXT_AGENT_FIELDS = new Set([
  "GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-Web",
  "PerplexityBot", "Google-Extended", "CCBot", "Amazonbot",
  "Bingbot",
]);

// Statuses that indicate scanner problems, not brand changes
const NOISE_VERDICTS = new Set(["unknown"]);

// ── Core Engine ─────────────────────────────────────────────────────

/**
 * Process changelog for a brand after a successful scan.
 *
 * Compares current scan row to previous scan row and applies the
 * three-tier confirmation rules.
 *
 * @returns Number of confirmed changelog entries created.
 */
export function processChangelog(
  brandId: number,
  currentScan: LightweightScanRow,
  previousScan: LightweightScanRow,
): number {
  let confirmedCount = 0;

  // ── 1. Robots.txt rule changes (immediate publication) ───────────

  confirmedCount += processRobotsTxtChanges(brandId, currentScan, previousScan);

  // ── 2. UA HTTP verdict changes (requires confirmation) ───────────

  confirmedCount += processUaVerdictChanges(brandId, currentScan, previousScan);

  // ── 3. Scalar field changes (requires confirmation) ──────────────

  confirmedCount += processScalarChanges(brandId, currentScan, previousScan);

  return confirmedCount;
}

// ── Robots.txt Rule Changes (Tier 1: Immediate) ────────────────────

function processRobotsTxtChanges(
  brandId: number,
  current: LightweightScanRow,
  previous: LightweightScanRow,
): number {
  let count = 0;

  // Parse the result JSON to get robots.txt blocked/allowed lists
  let currentRobots: { blockedAgents: string[]; allowedAgents: string[] };
  let previousRobots: { blockedAgents: string[]; allowedAgents: string[] };

  try {
    const currentResult = JSON.parse(current.resultJson);
    const previousResult = JSON.parse(previous.resultJson);
    currentRobots = currentResult.robotsTxt ?? { blockedAgents: [], allowedAgents: [] };
    previousRobots = previousResult.robotsTxt ?? { blockedAgents: [], allowedAgents: [] };
  } catch {
    // Can't parse result JSON, skip robots.txt comparison
    return 0;
  }

  // Build per-agent robots.txt status: blocked, allowed, or no_rule
  const currentRobotsStatus = buildRobotsStatus(currentRobots);
  const previousRobotsStatus = buildRobotsStatus(previousRobots);

  for (const agent of ROBOTS_TXT_AGENT_FIELDS) {
    const currentStatus = currentRobotsStatus[agent] ?? "no_rule";
    const previousStatus = previousRobotsStatus[agent] ?? "no_rule";

    if (currentStatus !== previousStatus) {
      const field = `${agent} robots.txt`;
      insertChangelogEntry(brandId, field, previousStatus, currentStatus);

      // Clean up any pending change for this field since we're publishing immediately
      clearStalePendingChanges(brandId, field);

      count++;
    }
  }

  // Also track robots.txt found/not-found as immediate
  if (current.robotsTxtFound !== previous.robotsTxtFound) {
    insertChangelogEntry(
      brandId,
      "robots.txt presence",
      String(previous.robotsTxtFound),
      String(current.robotsTxtFound),
    );
    count++;
  }

  return count;
}

function buildRobotsStatus(
  robots: { blockedAgents: string[]; allowedAgents: string[] },
): Record<string, string> {
  const status: Record<string, string> = {};
  for (const agent of robots.blockedAgents) {
    status[agent] = "blocked";
  }
  for (const agent of robots.allowedAgents) {
    status[agent] = "allowed";
  }
  return status;
}

// ── UA HTTP Verdict Changes (Tier 2: Requires Confirmation) ────────

function processUaVerdictChanges(
  brandId: number,
  current: LightweightScanRow,
  previous: LightweightScanRow,
): number {
  let count = 0;

  let currentUaResults: Array<{ userAgent: string; verdict: string; statusCode?: number }>;
  let previousUaResults: Array<{ userAgent: string; verdict: string; statusCode?: number }>;

  try {
    const currentResult = JSON.parse(current.resultJson);
    const previousResult = JSON.parse(previous.resultJson);
    currentUaResults = currentResult.userAgentTests ?? [];
    previousUaResults = previousResult.userAgentTests ?? [];
  } catch {
    return 0;
  }

  // Build per-agent verdict maps (use homepage tests as primary)
  const currentVerdicts = buildUaVerdictMap(currentUaResults);
  const previousVerdicts = buildUaVerdictMap(previousUaResults);

  const allAgents = new Set([...Object.keys(currentVerdicts), ...Object.keys(previousVerdicts)]);

  for (const agent of allAgents) {
    const currentVerdict = currentVerdicts[agent] ?? "unknown";
    const previousVerdict = previousVerdicts[agent] ?? "unknown";

    // Skip if no change
    if (currentVerdict === previousVerdict) continue;

    // Skip noise: if current verdict is unknown (timeout/error), ignore
    if (NOISE_VERDICTS.has(currentVerdict)) continue;

    // Skip noise: if previous was unknown and current is real, this is just
    // recovery from an error — not a real change. Only track transitions
    // between real verdicts.
    if (NOISE_VERDICTS.has(previousVerdict)) continue;

    const field = `agent_ua_${agent}`;
    count += handleConfirmationField(brandId, field, previousVerdict, currentVerdict);
  }

  return count;
}

function buildUaVerdictMap(
  tests: Array<{ userAgent: string; verdict: string; statusCode?: number }>,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const test of tests) {
    // Skip 429 (rate limit) — this is scanner noise, not brand policy
    if (test.statusCode === 429) continue;

    // Skip statusCode 0 (network timeout) — scanner problem
    if (test.statusCode === 0) continue;

    // Use first test per agent (usually homepage)
    if (!map[test.userAgent]) {
      map[test.userAgent] = test.verdict;
    }
  }
  return map;
}

// ── Scalar Field Changes (Tier 2: Requires Confirmation) ───────────

function processScalarChanges(
  brandId: number,
  current: LightweightScanRow,
  previous: LightweightScanRow,
): number {
  let count = 0;

  const comparisons: Array<{ field: string; oldVal: string | null; newVal: string | null }> = [];

  if (String(current.blockedAgentCount) !== String(previous.blockedAgentCount)) {
    comparisons.push({
      field: "blocked_agent_count",
      oldVal: String(previous.blockedAgentCount),
      newVal: String(current.blockedAgentCount),
    });
  }

  if (current.cdn !== previous.cdn) {
    comparisons.push({ field: "cdn", oldVal: previous.cdn, newVal: current.cdn });
  }

  if (current.waf !== previous.waf) {
    comparisons.push({ field: "waf", oldVal: previous.waf, newVal: current.waf });
  }

  if (current.platform !== previous.platform) {
    comparisons.push({ field: "platform", oldVal: previous.platform, newVal: current.platform });
  }

  // Structured data fields
  if (String(current.hasJsonLd) !== String(previous.hasJsonLd)) {
    comparisons.push({ field: "json_ld", oldVal: String(previous.hasJsonLd), newVal: String(current.hasJsonLd) });
  }
  if (String(current.hasSchemaProduct) !== String(previous.hasSchemaProduct)) {
    comparisons.push({ field: "schema_product", oldVal: String(previous.hasSchemaProduct), newVal: String(current.hasSchemaProduct) });
  }
  if (String(current.hasOpenGraph) !== String(previous.hasOpenGraph)) {
    comparisons.push({ field: "open_graph", oldVal: String(previous.hasOpenGraph), newVal: String(current.hasOpenGraph) });
  }
  if (String(current.hasProductFeed) !== String(previous.hasProductFeed)) {
    comparisons.push({ field: "product_feed", oldVal: String(previous.hasProductFeed), newVal: String(current.hasProductFeed) });
  }
  if (String(current.hasLlmsTxt) !== String(previous.hasLlmsTxt)) {
    comparisons.push({ field: "llms_txt", oldVal: String(previous.hasLlmsTxt), newVal: String(current.hasLlmsTxt) });
  }
  if (String(current.hasUcp) !== String(previous.hasUcp)) {
    comparisons.push({ field: "ucp", oldVal: String(previous.hasUcp), newVal: String(current.hasUcp) });
  }
  if (String(current.hasSitemap) !== String(previous.hasSitemap)) {
    comparisons.push({ field: "sitemap", oldVal: String(previous.hasSitemap), newVal: String(current.hasSitemap) });
  }

  for (const { field, oldVal, newVal } of comparisons) {
    count += handleConfirmationField(brandId, field, oldVal, newVal);
  }

  return count;
}

// ── Shared Confirmation Logic ──────────────────────────────────────

/**
 * Handle a field that requires two-scan confirmation.
 *
 * - No pending change exists: insert one, return 0.
 * - Pending change exists with same new value: confirm it, return 1.
 * - Pending change exists with different new value: update it (reset), return 0.
 * - Current matches old (change reverted): delete pending change, return 0.
 */
function handleConfirmationField(
  brandId: number,
  field: string,
  oldValue: string | null,
  newValue: string | null,
): number {
  const existing = getPendingChange(brandId, field);

  if (!existing) {
    // First time seeing this change — hold it for confirmation
    insertPendingChange(brandId, field, oldValue, newValue, "requires_confirmation");
    return 0;
  }

  if (existing.newValue === newValue) {
    // Same change seen twice in a row — confirmed!
    insertChangelogEntry(brandId, field, existing.oldValue, newValue);
    confirmAndDeletePendingChange(existing.id);
    return 1;
  }

  // Different new value — the signal is inconsistent. Reset the pending change.
  updatePendingChange(existing.id, newValue);
  return 0;
}

/**
 * Clean up pending changes for a brand where the current scan matches
 * the previous scan (i.e., the change reverted before being confirmed).
 *
 * Called automatically when processChangelog detects no diff for a field
 * that has a pending change. We handle this by checking: if there are
 * pending changes for this brand but no diff was detected for that field,
 * it means the value reverted — delete the pending change.
 */
export function cleanupRevertedPendingChanges(
  brandId: number,
  currentScan: LightweightScanRow,
  previousScan: LightweightScanRow,
): void {
  // For each confirmation-requiring field, if current === previous,
  // clear any pending change (the value reverted before confirmation)
  const fieldChecks: Array<{ field: string; same: boolean }> = [
    { field: "blocked_agent_count", same: String(currentScan.blockedAgentCount) === String(previousScan.blockedAgentCount) },
    { field: "cdn", same: currentScan.cdn === previousScan.cdn },
    { field: "waf", same: currentScan.waf === previousScan.waf },
    { field: "platform", same: currentScan.platform === previousScan.platform },
    { field: "json_ld", same: String(currentScan.hasJsonLd) === String(previousScan.hasJsonLd) },
    { field: "schema_product", same: String(currentScan.hasSchemaProduct) === String(previousScan.hasSchemaProduct) },
    { field: "open_graph", same: String(currentScan.hasOpenGraph) === String(previousScan.hasOpenGraph) },
    { field: "product_feed", same: String(currentScan.hasProductFeed) === String(previousScan.hasProductFeed) },
    { field: "llms_txt", same: String(currentScan.hasLlmsTxt) === String(previousScan.hasLlmsTxt) },
    { field: "ucp", same: String(currentScan.hasUcp) === String(previousScan.hasUcp) },
    { field: "sitemap", same: String(currentScan.hasSitemap) === String(previousScan.hasSitemap) },
  ];

  for (const { field, same } of fieldChecks) {
    if (same) {
      // Value is the same as previous — any pending change was a flicker
      const pending = getPendingChange(brandId, field);
      if (pending) {
        confirmAndDeletePendingChange(pending.id);
      }
    }
  }

  // Same for UA verdict fields — parse and compare
  try {
    const currentResult = JSON.parse(currentScan.resultJson);
    const previousResult = JSON.parse(previousScan.resultJson);
    const currentVerdicts = buildUaVerdictMap(currentResult.userAgentTests ?? []);
    const previousVerdicts = buildUaVerdictMap(previousResult.userAgentTests ?? []);

    const allAgents = new Set([...Object.keys(currentVerdicts), ...Object.keys(previousVerdicts)]);
    for (const agent of allAgents) {
      if ((currentVerdicts[agent] ?? "unknown") === (previousVerdicts[agent] ?? "unknown")) {
        const field = `agent_ua_${agent}`;
        const pending = getPendingChange(brandId, field);
        if (pending) {
          confirmAndDeletePendingChange(pending.id);
        }
      }
    }
  } catch {
    // ignore parse errors
  }
}
