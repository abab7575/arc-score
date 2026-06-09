/**
 * MCP tool implementations over the ARC Report dataset.
 * Pure functions (input → JSON-serializable result) so they can be
 * integration-tested without the HTTP layer. Every result includes
 * source_url and last_updated for citability.
 */

import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getLatestLightweightScan } from "@/lib/db/queries";
import { buildMatrixPayload, getChangelogWithBrands } from "@/lib/index-data";
import { computeInsights } from "@/lib/insights";
import { computeArcScore, arcScoreLabel } from "@/lib/scoring/arc-score";
import { SITE_URL, TRACKED_AGENT_IDS, SCORE_VERSION } from "@/lib/site";

export class ToolInputError extends Error {}

// ── Brand resolution ─────────────────────────────────────────────────

function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

function brandHost(url: string): string {
  return normalizeDomain(url);
}

interface BrandRow {
  id: number;
  slug: string;
  name: string;
  url: string;
  category: string;
}

function allBrands(): BrandRow[] {
  return db
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
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[n];
}

export function resolveBrand(domain: string): { brand: BrandRow | null; suggestions: string[] } {
  if (!domain || typeof domain !== "string") {
    throw new ToolInputError("domain is required (e.g. \"nike.com\" or \"nike\").");
  }
  const q = normalizeDomain(domain);
  const slugQ = q.replace(/\.[a-z.]+$/, ""); // nike.com -> nike
  const brands = allBrands();

  const exact =
    brands.find((b) => brandHost(b.url) === q) ??
    brands.find((b) => b.slug === q || b.slug === slugQ) ??
    brands.find((b) => b.name.toLowerCase() === q || b.name.toLowerCase() === slugQ);
  if (exact) return { brand: exact, suggestions: [] };

  const contains = brands.filter(
    (b) =>
      b.slug.includes(slugQ) ||
      b.name.toLowerCase().includes(slugQ) ||
      brandHost(b.url).includes(q),
  );
  if (contains.length === 1) return { brand: contains[0], suggestions: [] };

  const ranked = (contains.length > 1 ? contains : brands)
    .map((b) => ({ b, d: levenshtein(slugQ, b.slug) }))
    .sort((x, y) => x.d - y.d)
    .slice(0, 5)
    .map(({ b }) => `${b.slug} (${brandHost(b.url)})`);
  return { brand: null, suggestions: ranked };
}

// ── Shared formatting ────────────────────────────────────────────────

function scoreFor(scan: NonNullable<ReturnType<typeof getLatestLightweightScan>>) {
  const score = computeArcScore(scan);
  return {
    arc_score: score.total,
    arc_score_version: SCORE_VERSION,
    arc_score_label: arcScoreLabel(score.total).label,
    arc_score_components: {
      agent_access: { points: score.agentAccess, max: 50 },
      structured_data: { points: score.structuredData, max: 25 },
      protocol_files: { points: score.protocolFiles, max: 15 },
      scan_stability: { points: score.scanStability, max: 10 },
    },
  };
}

function parseStatus(json: string): Record<string, string> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

// ── Tools ────────────────────────────────────────────────────────────

export function getBrandStatus(args: { domain?: string }) {
  const { brand, suggestions } = resolveBrand(args.domain ?? "");
  if (!brand) {
    return {
      found: false,
      message: `No tracked brand matches "${args.domain}".`,
      did_you_mean: suggestions,
      source_url: `${SITE_URL}/`,
      last_updated: null,
    };
  }
  const scan = getLatestLightweightScan(brand.id);
  if (!scan) {
    return {
      found: true,
      brand: { slug: brand.slug, name: brand.name, url: brand.url, category: brand.category },
      message: "Brand is tracked but has no scan data yet.",
      source_url: `${SITE_URL}/brand/${brand.slug}`,
      last_updated: null,
    };
  }
  const status = parseStatus(scan.agentStatusJson);
  return {
    found: true,
    brand: { slug: brand.slug, name: brand.name, url: brand.url, category: brand.category },
    agent_access: Object.fromEntries(
      TRACKED_AGENT_IDS.map((a) => [a, status[a] ?? "inconclusive"]),
    ),
    platform: scan.platform,
    cdn: scan.cdn,
    waf: scan.waf,
    structured_data: {
      json_ld: scan.hasJsonLd,
      schema_product: scan.hasSchemaProduct,
      open_graph: scan.hasOpenGraph,
      sitemap: scan.hasSitemap,
      product_feed: scan.hasProductFeed,
    },
    llms_txt: {
      present: scan.hasLlmsTxt,
      bytes: scan.llmsTxtBytes,
      link_count: scan.llmsTxtLinkCount,
    },
    agents_txt: scan.hasAgentsTxt,
    ucp: scan.hasUcp,
    ...scoreFor(scan),
    last_scanned: scan.scannedAt,
    source_url: `${SITE_URL}/brand/${brand.slug}`,
    last_updated: scan.scannedAt,
  };
}

export function searchBrands(args: {
  query?: string;
  category?: string;
  platform?: string;
  blocking_agent?: string;
  allowing_agent?: string;
  limit?: number;
  offset?: number;
}) {
  for (const key of ["blocking_agent", "allowing_agent"] as const) {
    const v = args[key];
    if (v && !TRACKED_AGENT_IDS.includes(v)) {
      throw new ToolInputError(
        `${key} must be one of: ${TRACKED_AGENT_IDS.join(", ")} (got "${v}")`,
      );
    }
  }
  const limit = Math.min(Math.max(args.limit ?? 25, 1), 100);
  const offset = Math.max(args.offset ?? 0, 0);

  const { brands } = buildMatrixPayload();
  let rows = brands.filter((b) => b.scanned);

  if (args.query) {
    const q = args.query.toLowerCase();
    rows = rows.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.includes(q) ||
        b.url.toLowerCase().includes(q),
    );
  }
  if (args.category) {
    const c = args.category.toLowerCase();
    rows = rows.filter((b) => b.category.toLowerCase() === c);
  }
  if (args.platform) {
    const p = args.platform.toLowerCase();
    rows = rows.filter((b) => (b.platform ?? "").toLowerCase() === p);
  }
  if (args.blocking_agent) {
    rows = rows.filter((b) => {
      const s = b.agentStatus?.[args.blocking_agent!];
      return s === "blocked" || s === "restricted";
    });
  }
  if (args.allowing_agent) {
    rows = rows.filter((b) => {
      const s = b.agentStatus?.[args.allowing_agent!];
      return s === "allowed" || s === "no_rule";
    });
  }

  const total = rows.length;
  const lastScan = rows.reduce<string | null>(
    (m, b) => (!m || (b.scannedAt ?? "") > m ? (b.scannedAt ?? m) : m),
    null,
  );
  const page = rows.slice(offset, offset + limit).map((b) => ({
    slug: b.slug,
    name: b.name,
    url: b.url,
    category: b.category,
    platform: b.platform,
    blocked_agent_count: b.blockedAgentCount,
    agent_access: b.agentStatus,
    arc_score: computeArcScore({
      agentStatusJson: JSON.stringify(b.agentStatus ?? {}),
      hasJsonLd: !!b.hasJsonLd,
      hasSchemaProduct: !!b.hasSchemaProduct,
      hasOpenGraph: !!b.hasOpenGraph,
      hasSitemap: !!b.hasSitemap,
      hasProductFeed: !!b.hasProductFeed,
      hasLlmsTxt: !!b.hasLlmsTxt,
      hasAgentsTxt: !!b.hasAgentsTxt,
      hasUcp: !!b.hasUcp,
    }).total,
    brand_url: `${SITE_URL}/brand/${b.slug}`,
    last_scanned: b.scannedAt,
  }));

  return {
    total,
    offset,
    limit,
    returned: page.length,
    brands: page,
    source_url: `${SITE_URL}/matrix`,
    last_updated: lastScan,
  };
}

export function getRecentChanges(args: { days?: number; category?: string }) {
  const days = Math.min(Math.max(Math.round(args.days ?? 7), 1), 90);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  let entries = getChangelogWithBrands(500).filter((e) => e.detectedAt >= cutoff);

  if (args.category) {
    const c = args.category.toLowerCase();
    const slugs = new Set(
      allBrands()
        .filter((b) => b.category.toLowerCase() === c)
        .map((b) => b.slug),
    );
    entries = entries.filter((e) => slugs.has(e.brandSlug));
  }

  return {
    days,
    category: args.category ?? null,
    total: entries.length,
    changes: entries.map((e) => ({
      brand: e.brandName,
      brand_slug: e.brandSlug,
      field: e.field,
      before: e.oldValue,
      after: e.newValue,
      detected_at: e.detectedAt,
      brand_url: `${SITE_URL}/brand/${e.brandSlug}`,
    })),
    note: "Only confirmed changes are listed: robots.txt diffs publish immediately; inferred signals require two consecutive scans.",
    source_url: `${SITE_URL}/changelog`,
    last_updated: entries[0]?.detectedAt ?? null,
  };
}

export function getAgentStats(args: { agent?: string }) {
  if (args.agent && !TRACKED_AGENT_IDS.includes(args.agent)) {
    throw new ToolInputError(
      `agent must be one of: ${TRACKED_AGENT_IDS.join(", ")} (got "${args.agent}")`,
    );
  }
  const insights = computeInsights();
  const agents = args.agent
    ? insights.agentStats.filter((a) => a.agent === args.agent)
    : insights.agentStats;

  // Per-category blocking rate for the selected agent(s)
  const { brands } = buildMatrixPayload();
  const byCategory = new Map<string, { total: number; blocking: number }>();
  for (const b of brands) {
    if (!b.scanned) continue;
    const cat = byCategory.get(b.category) ?? { total: 0, blocking: 0 };
    cat.total += 1;
    const targets = args.agent ? [args.agent] : TRACKED_AGENT_IDS;
    const blocksAny = targets.some((a) => {
      const s = b.agentStatus?.[a];
      return s === "blocked" || s === "restricted";
    });
    if (blocksAny) cat.blocking += 1;
    byCategory.set(b.category, cat);
  }

  // Week-over-week: agent-access changelog entries mentioning the agent(s)
  const now = Date.now();
  const weekAgo = new Date(now - 7 * 86400_000).toISOString();
  const twoWeeksAgo = new Date(now - 14 * 86400_000).toISOString();
  const entries = getChangelogWithBrands(2000);
  const matchesAgent = (field: string) =>
    args.agent ? field.includes(args.agent) : TRACKED_AGENT_IDS.some((a) => field.includes(a));
  const thisWeek = entries.filter((e) => e.detectedAt >= weekAgo && matchesAgent(e.field)).length;
  const prevWeek = entries.filter(
    (e) => e.detectedAt >= twoWeeksAgo && e.detectedAt < weekAgo && matchesAgent(e.field),
  ).length;

  return {
    scanned_brands: insights.scannedBrands,
    agents: agents.map((a) => ({
      agent: a.agent,
      company: a.company,
      policy_blocked_count: a.blockedCount,
      waf_restricted_count: a.restrictedCount,
      percent_of_index_blocking: a.blockedPercent,
    })),
    most_blocked_agent: insights.mostBlockedAgent?.agent ?? null,
    by_category: [...byCategory.entries()]
      .map(([category, c]) => ({
        category,
        brands: c.total,
        blocking_count: c.blocking,
        blocking_percent: c.total > 0 ? Math.round((c.blocking / c.total) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.brands - a.brands),
    week_over_week: {
      agent_access_changes_this_week: thisWeek,
      agent_access_changes_previous_week: prevWeek,
      delta: thisWeek - prevWeek,
    },
    source_url: `${SITE_URL}/insights`,
    last_updated: insights.lastScanAt,
  };
}

export function compareBrands(args: { domains?: string[] }) {
  if (!Array.isArray(args.domains) || args.domains.length === 0) {
    throw new ToolInputError("domains must be a non-empty array of brand domains or slugs.");
  }
  if (args.domains.length > 10) {
    throw new ToolInputError(`compare_brands accepts at most 10 domains (got ${args.domains.length}).`);
  }

  const resolved = args.domains.map((d) => ({ input: d, ...resolveBrand(d) }));
  const notFound = resolved.filter((r) => !r.brand);
  const found = resolved.filter((r) => r.brand);

  const columns = found.map((r) => {
    const brand = r.brand!;
    const scan = getLatestLightweightScan(brand.id);
    if (!scan) {
      return { slug: brand.slug, name: brand.name, no_scan_data: true };
    }
    const status = parseStatus(scan.agentStatusJson);
    return {
      slug: brand.slug,
      name: brand.name,
      category: brand.category,
      platform: scan.platform,
      waf: scan.waf,
      agent_access: Object.fromEntries(
        TRACKED_AGENT_IDS.map((a) => [a, status[a] ?? "inconclusive"]),
      ),
      structured_data_signals: [
        scan.hasJsonLd && "json_ld",
        scan.hasSchemaProduct && "schema_product",
        scan.hasOpenGraph && "open_graph",
        scan.hasSitemap && "sitemap",
        scan.hasProductFeed && "product_feed",
      ].filter(Boolean),
      llms_txt: scan.hasLlmsTxt,
      ...scoreFor(scan),
      last_scanned: scan.scannedAt,
      brand_url: `${SITE_URL}/brand/${brand.slug}`,
    };
  });

  const lastUpdated = columns.reduce<string | null>((m, c) => {
    const t = "last_scanned" in c ? (c.last_scanned as string) : null;
    return !m || (t ?? "") > m ? (t ?? m) : m;
  }, null);

  return {
    compared: columns,
    not_found: notFound.map((r) => ({ input: r.input, did_you_mean: r.suggestions })),
    agents: TRACKED_AGENT_IDS,
    source_url: `${SITE_URL}/matrix`,
    last_updated: lastUpdated,
  };
}
