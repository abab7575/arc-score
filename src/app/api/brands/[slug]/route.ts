import { NextRequest, NextResponse } from "next/server";
import { getBrandBySlug, getLatestScanForBrand, getFullScanReport, getScoreHistory } from "@/lib/db/queries";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(ip, 60, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const latestScan = getLatestScanForBrand(brand.id);
  const report = latestScan ? getFullScanReport(latestScan.id) : null;
  const history = getScoreHistory(brand.id, 30);

  return NextResponse.json({
    brand: {
      id: brand.id,
      slug: brand.slug,
      name: brand.name,
      url: brand.url,
      category: brand.category,
    },
    latestScore: latestScan?.overallScore ?? null,
    latestGrade: latestScan?.grade ?? null,
    scannedAt: latestScan?.scannedAt ?? null,
    report,
    history,
  });
}
