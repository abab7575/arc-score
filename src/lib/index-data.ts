/**
 * Server-side data assembly shared by server components and the public API.
 * Everything here reads straight from SQLite — no fetch hops — so pages can
 * render full data into the initial HTML.
 */

import { db, schema } from "@/lib/db";
import { sql, gte, desc } from "drizzle-orm";
import { getMatrixData, getRecentChangelog } from "@/lib/db/queries";
import { TRACKED_AGENT_COUNT } from "@/lib/site";

export interface MatrixBrandRow {
  id: number;
  slug: string;
  name: string;
  url: string;
  category: string;
  scanned: boolean;
  agentStatus?: Record<string, string>;
  platform?: string | null;
  cdn?: string | null;
  waf?: string | null;
  blockedAgentCount?: number;
  hasJsonLd?: boolean;
  hasSchemaProduct?: boolean;
  hasOpenGraph?: boolean;
  hasSitemap?: boolean;
  hasProductFeed?: boolean;
  hasLlmsTxt?: boolean;
  hasAgentsTxt?: boolean;
  hasUcp?: boolean;
  scannedAt?: string;
}

export interface MatrixStats {
  totalBrands: number;
  scannedBrands: number;
  brandsBlocking: number;
  brandsFullyOpen: number;
  avgBlockedAgents: number;
  percentFullyOpen: number;
}

export function buildMatrixPayload(): { stats: MatrixStats; brands: MatrixBrandRow[] } {
  const data = getMatrixData();

  const totalBrands = data.length;
  const scannedBrands = data.filter((d) => d.scan !== null);
  const brandsBlocking = scannedBrands.filter((d) => d.scan && d.scan.blockedAgentCount > 0).length;
  const brandsFullyOpen = scannedBrands.filter((d) => d.scan && d.scan.blockedAgentCount === 0).length;
  const avgBlockedAgents = scannedBrands.length > 0
    ? Math.round(scannedBrands.reduce((s, d) => s + (d.scan?.blockedAgentCount ?? 0), 0) / scannedBrands.length * 10) / 10
    : 0;

  return {
    stats: {
      totalBrands,
      scannedBrands: scannedBrands.length,
      brandsBlocking,
      brandsFullyOpen,
      avgBlockedAgents,
      percentFullyOpen: scannedBrands.length > 0
        ? Math.round((brandsFullyOpen / scannedBrands.length) * 100)
        : 0,
    },
    brands: data.map(({ brand, scan }) => ({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      url: brand.url,
      category: brand.category,
      scanned: scan !== null,
      ...(scan
        ? {
            agentStatus: safeParse(scan.agentStatusJson),
            platform: scan.platform,
            cdn: scan.cdn,
            waf: scan.waf,
            blockedAgentCount: scan.blockedAgentCount,
            hasJsonLd: scan.hasJsonLd,
            hasSchemaProduct: scan.hasSchemaProduct,
            hasOpenGraph: scan.hasOpenGraph,
            hasSitemap: scan.hasSitemap,
            hasProductFeed: scan.hasProductFeed,
            hasLlmsTxt: scan.hasLlmsTxt,
            hasAgentsTxt: scan.hasAgentsTxt,
            hasUcp: scan.hasUcp,
            scannedAt: scan.scannedAt,
          }
        : {}),
    })),
  };
}

function safeParse(json: string): Record<string, string> {
  try {
    return JSON.parse(json);
  } catch {
    return {};
  }
}

export interface ChangelogEntryWithBrand {
  id: number;
  brandId: number;
  brandSlug: string;
  brandName: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
}

export function getChangelogWithBrands(limit: number = 200): ChangelogEntryWithBrand[] {
  const entries = getRecentChangelog(limit);
  const brands = db
    .select({ id: schema.brands.id, slug: schema.brands.slug, name: schema.brands.name })
    .from(schema.brands)
    .all();
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  return entries.map((entry) => ({
    ...entry,
    brandSlug: brandMap.get(entry.brandId)?.slug ?? "unknown",
    brandName: brandMap.get(entry.brandId)?.name ?? "Unknown",
  }));
}

export interface IndexStats {
  brandCount: number;
  scannedBrandCount: number;
  lastScan: string | null;
  changesThisWeek: number;
  agentsTracked: number;
}

/** Live index-level counts — the only legitimate source for counts in copy (C4). */
export function getIndexStats(): IndexStats {
  const brandCount = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.brands)
    .get()?.count ?? 0;

  const scannedBrandCount = db
    .select({ count: sql<number>`count(DISTINCT brand_id)` })
    .from(schema.lightweightScans)
    .get()?.count ?? 0;

  const lastScan = db
    .select({ scannedAt: schema.lightweightScans.scannedAt })
    .from(schema.lightweightScans)
    .orderBy(desc(schema.lightweightScans.scannedAt))
    .limit(1)
    .get()?.scannedAt ?? null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const changesThisWeek = db
    .select({ count: sql<number>`count(*)` })
    .from(schema.changelogEntries)
    .where(gte(schema.changelogEntries.detectedAt, sevenDaysAgo))
    .get()?.count ?? 0;

  return {
    brandCount,
    scannedBrandCount,
    lastScan,
    changesThisWeek,
    agentsTracked: TRACKED_AGENT_COUNT,
  };
}
