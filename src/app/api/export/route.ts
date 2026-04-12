import { NextRequest, NextResponse } from "next/server";
import { getMatrixData, getRecentChangelog } from "@/lib/db/queries";
import {
  verifyCustomerSession,
  CUSTOMER_COOKIE_NAME,
} from "@/lib/customer-auth";
import { db, schema } from "@/lib/db/index";
import { eq, gte } from "drizzle-orm";

interface FilterParams {
  platforms: string[];
  cdns: string[];
  blockedAgent: string | null;
  allowedAgent: string | null;
  changedDays: number | null;
  requireJsonLd: boolean;
  requireOpenGraph: boolean;
  requireProductFeed: boolean;
  requireLlmsTxt: boolean;
}

function parseFilters(sp: URLSearchParams): FilterParams {
  const csv = (k: string): string[] => {
    const v = sp.get(k);
    if (!v) return [];
    return v.split(",").map(s => s.trim()).filter(Boolean);
  };
  const num = (k: string): number | null => {
    const v = sp.get(k);
    if (!v) return null;
    const n = parseInt(v, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const bool = (k: string): boolean => sp.get(k) === "true";

  return {
    platforms: csv("platform"),
    cdns: csv("cdn"),
    blockedAgent: sp.get("blockedAgent"),
    allowedAgent: sp.get("allowedAgent"),
    changedDays: num("changedDays"),
    requireJsonLd: bool("hasJsonLd"),
    requireOpenGraph: bool("hasOpenGraph"),
    requireProductFeed: bool("hasProductFeed"),
    requireLlmsTxt: bool("hasLlmsTxt"),
  };
}

function brandsWithRecentChanges(days: number): Set<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const rows = db
    .select({ brandId: schema.changelogEntries.brandId })
    .from(schema.changelogEntries)
    .where(gte(schema.changelogEntries.detectedAt, cutoff))
    .all();
  return new Set(rows.map(r => r.brandId));
}

export async function GET(request: NextRequest) {
  // Pro-only endpoint
  const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const customerId = await verifyCustomerSession(token);
  if (!customerId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const customer = db
    .select()
    .from(schema.customers)
    .where(eq(schema.customers.id, customerId))
    .get();

  if (!customer || customer.plan === "free") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const type = request.nextUrl.searchParams.get("type") ?? "matrix";
  const filters = parseFilters(request.nextUrl.searchParams);

  if (type === "matrix") {
    const allData = getMatrixData();
    const recentChangeSet = filters.changedDays
      ? brandsWithRecentChanges(filters.changedDays)
      : null;

    const data = allData.filter(({ brand, scan }) => {
      if (filters.platforms.length > 0) {
        if (!scan?.platform || !filters.platforms.includes(scan.platform)) return false;
      }
      if (filters.cdns.length > 0) {
        if (!scan?.cdn || !filters.cdns.includes(scan.cdn)) return false;
      }
      if (filters.blockedAgent || filters.allowedAgent) {
        if (!scan) return false;
        try {
          const status = JSON.parse(scan.agentStatusJson) as Record<string, string>;
          if (filters.blockedAgent) {
            const s = status[filters.blockedAgent];
            if (s !== "blocked" && s !== "restricted") return false;
          }
          if (filters.allowedAgent) {
            const s = status[filters.allowedAgent];
            if (s !== "allowed" && s !== "no_rule") return false;
          }
        } catch {
          return false;
        }
      }
      if (filters.requireJsonLd && !scan?.hasJsonLd) return false;
      if (filters.requireOpenGraph && !scan?.hasOpenGraph) return false;
      if (filters.requireProductFeed && !scan?.hasProductFeed) return false;
      if (filters.requireLlmsTxt && !scan?.hasLlmsTxt) return false;
      if (recentChangeSet && !recentChangeSet.has(brand.id)) return false;
      return true;
    });

    if (format === "csv") {
      const headers = ["name", "slug", "url", "category", "platform", "cdn", "waf", "blocked_agents", "has_json_ld", "has_schema_product", "has_open_graph", "has_product_feed", "has_llms_txt", "has_ucp", "scanned_at"];
      const rows = data.map(({ brand, scan }) => [
        brand.name,
        brand.slug,
        brand.url,
        brand.category,
        scan?.platform ?? "",
        scan?.cdn ?? "",
        scan?.waf ?? "",
        scan?.blockedAgentCount ?? "",
        scan?.hasJsonLd ? "true" : "false",
        scan?.hasSchemaProduct ? "true" : "false",
        scan?.hasOpenGraph ? "true" : "false",
        scan?.hasProductFeed ? "true" : "false",
        scan?.hasLlmsTxt ? "true" : "false",
        scan?.hasUcp ? "true" : "false",
        scan?.scannedAt ?? "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

      const csv = [headers.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="arc-matrix-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    // JSON format
    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      brandCount: data.length,
      data: data.map(({ brand, scan }) => ({
        ...brand,
        scan: scan ? {
          platform: scan.platform,
          cdn: scan.cdn,
          waf: scan.waf,
          blockedAgentCount: scan.blockedAgentCount,
          allowedAgentCount: scan.allowedAgentCount,
          agentStatus: JSON.parse(scan.agentStatusJson),
          hasJsonLd: scan.hasJsonLd,
          hasSchemaProduct: scan.hasSchemaProduct,
          hasOpenGraph: scan.hasOpenGraph,
          hasProductFeed: scan.hasProductFeed,
          hasLlmsTxt: scan.hasLlmsTxt,
          hasUcp: scan.hasUcp,
          scannedAt: scan.scannedAt,
        } : null,
      })),
    });
  }

  if (type === "changelog") {
    const entries = getRecentChangelog(500);
    const brands = db.select({ id: schema.brands.id, name: schema.brands.name, slug: schema.brands.slug })
      .from(schema.brands).all();
    const brandMap = new Map(brands.map(b => [b.id, b]));

    if (format === "csv") {
      const headers = ["date", "brand_name", "brand_slug", "field", "old_value", "new_value"];
      const rows = entries.map(e => {
        const brand = brandMap.get(e.brandId);
        return [
          e.detectedAt,
          brand?.name ?? "",
          brand?.slug ?? "",
          e.field,
          e.oldValue ?? "",
          e.newValue ?? "",
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
      });

      const csv = [headers.join(","), ...rows].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="arc-changelog-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      exportedAt: new Date().toISOString(),
      entryCount: entries.length,
      data: entries.map(e => {
        const brand = brandMap.get(e.brandId);
        return {
          ...e,
          brandName: brand?.name,
          brandSlug: brand?.slug,
        };
      }),
    });
  }

  return NextResponse.json({ error: "Invalid export type. Use 'matrix' or 'changelog'." }, { status: 400 });
}
