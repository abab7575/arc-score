import { NextResponse } from "next/server";
import { getBrandBySlug, getLatestScanForBrand, getFullScanReport, getScoreHistory } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
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
