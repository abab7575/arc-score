import { NextRequest, NextResponse } from "next/server";
import { getMatrixData, getLightweightScanHistory } from "@/lib/db/queries";
import { verifyCustomerSession, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

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

  if (!customer || customer.plan !== "pro") {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";
  const type = request.nextUrl.searchParams.get("type") ?? "matrix";

  if (type === "matrix") {
    const data = getMatrixData();

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

  return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
}
