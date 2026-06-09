/**
 * Server-side data assembly for the public compare tool (/compare).
 */

import { getLatestLightweightScan } from "@/lib/db/queries";
import { resolveBrand } from "@/lib/mcp/tools";
import { computeArcScore, arcScoreLabel, type ArcScore } from "@/lib/scoring/arc-score";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export const MAX_COMPARE = 5;
export const MIN_COMPARE = 2;

export const POPULAR_COMPARISONS: Array<{ label: string; slugs: string[] }> = [
  { label: "Sportswear giants", slugs: ["nike", "adidas", "uniqlo"] },
  { label: "Mass retail", slugs: ["amazon", "walmart", "target"] },
  { label: "Fast fashion", slugs: ["zara", "shein", "asos"] },
  { label: "Beauty", slugs: ["sephora", "ulta"] },
];

export interface CompareBrand {
  slug: string;
  name: string;
  url: string;
  category: string;
  platform: string | null;
  waf: string | null;
  agentStatus: Record<string, string>;
  signals: {
    jsonLd: boolean;
    schemaProduct: boolean;
    openGraph: boolean;
    sitemap: boolean;
    productFeed: boolean;
    llmsTxt: boolean;
    agentsTxt: boolean;
    ucp: boolean;
  };
  score: ArcScore;
  scoreLabel: string;
  scoreColor: string;
  scannedAt: string;
}

export interface CompareData {
  brands: CompareBrand[];
  notFound: string[];
  lastUpdated: string | null;
}

export function buildCompareData(inputs: string[]): CompareData {
  const brands: CompareBrand[] = [];
  const notFound: string[] = [];
  const seen = new Set<string>();

  for (const input of inputs.slice(0, MAX_COMPARE)) {
    const { brand } = resolveBrand(input);
    if (!brand || seen.has(brand.slug)) {
      if (!brand) notFound.push(input);
      continue;
    }
    seen.add(brand.slug);
    const scan = getLatestLightweightScan(brand.id);
    if (!scan) {
      notFound.push(input);
      continue;
    }
    let agentStatus: Record<string, string> = {};
    try {
      agentStatus = JSON.parse(scan.agentStatusJson);
    } catch {
      agentStatus = {};
    }
    const score = computeArcScore(scan);
    const meta = arcScoreLabel(score.total);
    brands.push({
      slug: brand.slug,
      name: brand.name,
      url: brand.url,
      category: brand.category,
      platform: scan.platform,
      waf: scan.waf,
      agentStatus,
      signals: {
        jsonLd: scan.hasJsonLd,
        schemaProduct: scan.hasSchemaProduct,
        openGraph: scan.hasOpenGraph,
        sitemap: scan.hasSitemap,
        productFeed: scan.hasProductFeed,
        llmsTxt: scan.hasLlmsTxt,
        agentsTxt: scan.hasAgentsTxt,
        ucp: scan.hasUcp,
      },
      score,
      scoreLabel: meta.label,
      scoreColor: meta.color,
      scannedAt: scan.scannedAt,
    });
  }

  const lastUpdated = brands.reduce<string | null>(
    (m, b) => (!m || b.scannedAt > m ? b.scannedAt : m),
    null,
  );
  return { brands, notFound, lastUpdated };
}

/** Lightweight brand list for the client-side picker. */
export function getBrandOptions(): Array<{ slug: string; name: string }> {
  return db
    .select({ slug: schema.brands.slug, name: schema.brands.name })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all()
    .sort((a, b) => a.name.localeCompare(b.name));
}
