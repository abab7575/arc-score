/**
 * Daily snapshot builder for the open-data endpoints (/data/*).
 * A snapshot for date D is each brand's most recent scan with
 * scannedAt <= end of D (UTC). "latest" uses the newest scan per brand.
 * Licensed CC BY 4.0 — license metadata is embedded in every payload.
 */

import { db, schema } from "@/lib/db";
import { sql, lte, desc, eq } from "drizzle-orm";
import { SITE_URL, DATA_LICENSE, TRACKED_AGENT_IDS, SCORE_VERSION } from "@/lib/site";
import { computeArcScore } from "@/lib/scoring/arc-score";

export interface SnapshotBrand {
  slug: string;
  name: string;
  url: string;
  category: string;
  platform: string | null;
  cdn: string | null;
  waf: string | null;
  agent_status: Record<string, string>;
  blocked_agent_count: number;
  has_json_ld: boolean;
  has_schema_product: boolean;
  has_open_graph: boolean;
  has_sitemap: boolean;
  has_product_feed: boolean;
  has_llms_txt: boolean;
  has_agents_txt: boolean;
  has_ucp: boolean;
  arc_score: number;
  arc_score_components: { agent_access: number; structured_data: number; protocol_files: number; scan_stability: number };
  scanned_at: string;
}

export interface Snapshot {
  dataset: string;
  description: string;
  date: string;
  generated_at: string;
  license: { name: string; url: string; attribution: string };
  source_url: string;
  score_version: string;
  tracked_agents: string[];
  brand_count: number;
  brands: SnapshotBrand[];
}

/** Latest scan per brand, optionally as of the end of an ISO date (UTC). */
function latestScansAsOf(date?: string) {
  if (date) {
    const cutoff = `${date}T23:59:59.999Z`;
    return db
      .select()
      .from(schema.lightweightScans)
      .where(
        sql`id IN (SELECT MAX(id) FROM lightweight_scans WHERE scanned_at <= ${cutoff} GROUP BY brand_id)`,
      )
      .all();
  }
  return db
    .select()
    .from(schema.lightweightScans)
    .where(sql`id IN (SELECT MAX(id) FROM lightweight_scans GROUP BY brand_id)`)
    .all();
}

export function buildSnapshot(date?: string): Snapshot {
  const scans = latestScansAsOf(date);
  const brands = db
    .select()
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all();
  const scanByBrand = new Map(scans.map((s) => [s.brandId, s]));

  const rows: SnapshotBrand[] = [];
  for (const brand of brands) {
    const scan = scanByBrand.get(brand.id);
    if (!scan) continue;
    let agentStatus: Record<string, string> = {};
    try {
      agentStatus = JSON.parse(scan.agentStatusJson);
    } catch {
      agentStatus = {};
    }
    const score = computeArcScore(scan);
    rows.push({
      slug: brand.slug,
      name: brand.name,
      url: brand.url,
      category: brand.category,
      platform: scan.platform,
      cdn: scan.cdn,
      waf: scan.waf,
      agent_status: agentStatus,
      blocked_agent_count: scan.blockedAgentCount,
      has_json_ld: scan.hasJsonLd,
      has_schema_product: scan.hasSchemaProduct,
      has_open_graph: scan.hasOpenGraph,
      has_sitemap: scan.hasSitemap,
      has_product_feed: scan.hasProductFeed,
      has_llms_txt: scan.hasLlmsTxt,
      has_agents_txt: scan.hasAgentsTxt,
      has_ucp: scan.hasUcp,
      arc_score: score.total,
      arc_score_components: {
        agent_access: score.agentAccess,
        structured_data: score.structuredData,
        protocol_files: score.protocolFiles,
        scan_stability: score.scanStability,
      },
      scanned_at: scan.scannedAt,
    });
  }
  rows.sort((a, b) => a.slug.localeCompare(b.slug));

  const snapshotDate = date ?? new Date().toISOString().split("T")[0];
  return {
    dataset: "ARC Report — AI agent access in e-commerce",
    description:
      "Daily scan of e-commerce brands for AI agent access signals: robots.txt policy per agent, live HTTP agent tests, structured data, platform detection, and protocol files (llms.txt, agents.txt, UCP).",
    date: snapshotDate,
    generated_at: new Date().toISOString(),
    license: { ...DATA_LICENSE },
    source_url: `${SITE_URL}/data`,
    score_version: SCORE_VERSION,
    tracked_agents: [...TRACKED_AGENT_IDS],
    brand_count: rows.length,
    brands: rows,
  };
}

function csvEscape(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function snapshotToCsv(snapshot: Snapshot): string {
  const agentCols = snapshot.tracked_agents;
  const header = [
    "slug", "name", "url", "category", "platform", "cdn", "waf",
    ...agentCols.map((a) => `agent_${a}`),
    "blocked_agent_count",
    "has_json_ld", "has_schema_product", "has_open_graph", "has_sitemap",
    "has_product_feed", "has_llms_txt", "has_agents_txt", "has_ucp",
    "arc_score", "arc_score_agent_access", "arc_score_structured_data",
    "arc_score_protocol_files", "arc_score_scan_stability",
    "scanned_at",
  ];
  const lines = [
    `# ${snapshot.dataset} — ${snapshot.date}`,
    `# License: ${snapshot.license.name} (${snapshot.license.url}) — ${snapshot.license.attribution}`,
    `# Source: ${snapshot.source_url}`,
    header.join(","),
  ];
  for (const b of snapshot.brands) {
    lines.push(
      [
        b.slug, b.name, b.url, b.category, b.platform ?? "", b.cdn ?? "", b.waf ?? "",
        ...agentCols.map((a) => b.agent_status[a] ?? ""),
        b.blocked_agent_count,
        b.has_json_ld, b.has_schema_product, b.has_open_graph, b.has_sitemap,
        b.has_product_feed, b.has_llms_txt, b.has_agents_txt, b.has_ucp,
        b.arc_score,
        b.arc_score_components.agent_access,
        b.arc_score_components.structured_data,
        b.arc_score_components.protocol_files,
        b.arc_score_components.scan_stability,
        b.scanned_at,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n") + "\n";
}

/** Distinct UTC dates with scan data, newest first — the available archive. */
export function getAvailableSnapshotDates(): string[] {
  return db
    .select({ date: sql<string>`DISTINCT substr(scanned_at, 1, 10)` })
    .from(schema.lightweightScans)
    .orderBy(desc(sql`substr(scanned_at, 1, 10)`))
    .all()
    .map((r) => r.date);
}

export function getEarliestSnapshotDate(): string | null {
  const row = db
    .select({ date: sql<string>`MIN(substr(scanned_at, 1, 10))` })
    .from(schema.lightweightScans)
    .get();
  return row?.date ?? null;
}

const scanCountForDate = (date: string) =>
  db
    .select({ count: sql<number>`count(*)` })
    .from(schema.lightweightScans)
    .where(lte(schema.lightweightScans.scannedAt, `${date}T23:59:59.999Z`))
    .get()?.count ?? 0;

export function hasDataForDate(date: string): boolean {
  return scanCountForDate(date) > 0;
}
