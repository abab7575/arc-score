import { NextRequest, NextResponse } from "next/server";
import { getBrandBySlug, getLatestScanForBrand, getFullScanReport, getScoreHistory } from "@/lib/db/queries";
import { verifyCustomerSession, getCustomerById, CUSTOMER_COOKIE_NAME } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  // Determine if the user has a Pro subscription
  let isPro = false;
  const token = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  if (token) {
    const customerId = await verifyCustomerSession(token);
    if (customerId) {
      const customer = getCustomerById(customerId);
      if (customer && customer.plan === "pro") {
        isPro = true;
      }
    }
  }

  const latestScan = getLatestScanForBrand(brand.id);
  const report = latestScan ? getFullScanReport(latestScan.id) : null;
  const history = getScoreHistory(brand.id, 30);

  // Strip gated fields for non-Pro users
  let gatedReport = null;
  if (report) {
    if (isPro) {
      gatedReport = report;
    } else {
      // Free users get basic report info but not detailed findings/action plan/journeys
      const { findings, actionPlan, journeys, estimatedScoreAfterFixes, ...basicReport } = report;
      gatedReport = basicReport;
    }
  }

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
    report: gatedReport,
    history,
    isPro,
  });
}
