import { NextRequest, NextResponse } from "next/server";
import { getMatrixData } from "@/lib/db/queries";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 30, 60000);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const data = getMatrixData();

  // Compute aggregate stats
  const totalBrands = data.length;
  const scannedBrands = data.filter(d => d.scan !== null);
  const brandsBlocking = scannedBrands.filter(d => d.scan && d.scan.blockedAgentCount > 0).length;
  const brandsFullyOpen = scannedBrands.filter(d => d.scan && d.scan.blockedAgentCount === 0).length;
  const avgBlockedAgents = scannedBrands.length > 0
    ? Math.round(scannedBrands.reduce((s, d) => s + (d.scan?.blockedAgentCount ?? 0), 0) / scannedBrands.length * 10) / 10
    : 0;

  return NextResponse.json({
    stats: {
      totalBrands,
      scannedBrands: scannedBrands.length,
      brandsBlocking,
      brandsFullyOpen,
      avgBlockedAgents,
      percentFullyOpen: scannedBrands.length > 0
        ? Math.round(brandsFullyOpen / scannedBrands.length * 100)
        : 0,
    },
    brands: data.map(({ brand, scan }) => ({
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      url: brand.url,
      category: brand.category,
      scanned: scan !== null,
      ...(scan ? {
        agentStatus: JSON.parse(scan.agentStatusJson),
        platform: scan.platform,
        cdn: scan.cdn,
        waf: scan.waf,
        blockedAgentCount: scan.blockedAgentCount,
        hasJsonLd: scan.hasJsonLd,
        hasSchemaProduct: scan.hasSchemaProduct,
        hasOpenGraph: scan.hasOpenGraph,
        hasProductFeed: scan.hasProductFeed,
        hasLlmsTxt: scan.hasLlmsTxt,
        hasUcp: scan.hasUcp,
        scannedAt: scan.scannedAt,
      } : {}),
    })),
  });
}
