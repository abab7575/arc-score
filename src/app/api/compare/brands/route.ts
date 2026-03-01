import { NextResponse } from "next/server";
import { getAllBrandsWithLatestScores, getLatestScanForBrand, getFullScanReport } from "@/lib/db/queries";
import type { CompareBrand } from "@/components/compare/brand-compare-module";
import type { ScanReport } from "@/types/report";

function mapScanToCompareBrand(
  brand: { id: number; slug: string; name: string; url: string },
  report: ScanReport
): CompareBrand {
  // Extract category scores from the report
  const catMap = Object.fromEntries(
    report.categories.map((c) => [c.id, c.score])
  );

  // Determine friction risk from performance + bot blocking signals
  const perfScore = catMap["performance-resilience"] ?? 50;
  const frictionRisk: "Low" | "Medium" | "High" =
    perfScore >= 70 ? "Low" : perfScore >= 40 ? "Medium" : "High";

  // Determine ACP support from agentic-commerce score
  const acpScore = catMap["agentic-commerce"] ?? 0;
  const acpSupport: boolean | "unknown" =
    acpScore >= 70 ? true : acpScore >= 30 ? "unknown" : false;

  // Map ARC categories to compare module categories
  const categoryScores = {
    protocol: acpScore,
    cartCheckout: catMap["cart-checkout"] ?? 0,
    payment: Math.round(((catMap["cart-checkout"] ?? 0) + (acpScore)) / 2),
    structuredData: catMap["product-understanding"] ?? 0,
    variants: Math.round((catMap["product-understanding"] ?? 0) * 0.8),
    feedsSitemaps: catMap["data-standards"] ?? 0,
    accessibility: catMap["navigation-interaction"] ?? 0,
    friction: perfScore,
  };

  // Build evidence from findings
  const evidence = report.findings.slice(0, 3).map((f) => {
    if (f.severity === "critical" || f.severity === "high") {
      return `${f.title}.`;
    }
    return `${f.title}.`;
  });

  // Add positive evidence from data journey
  const dataJourney = report.journeys.find((j) => j.agentType === "data");
  if (dataJourney) {
    const passSteps = dataJourney.steps.filter((s) => s.result === "pass");
    if (passSteps.length > 0 && evidence.length < 5) {
      evidence.push(
        `${passSteps.length} data checks passed: ${passSteps
          .slice(0, 2)
          .map((s) => s.action.toLowerCase())
          .join(", ")}.`
      );
    }
  }

  if (evidence.length === 0) {
    evidence.push("No scan evidence available yet.");
  }

  return {
    id: brand.slug,
    name: brand.name,
    overallScores: {
      agentCapability: report.overallScore,
      discoverability: catMap["discoverability"] ?? 0,
      frictionRisk,
      acpSupport,
    },
    categoryScores,
    evidenceSummary: evidence.slice(0, 5),
  };
}

export async function GET() {
  const allBrands = getAllBrandsWithLatestScores();

  const compareBrands: CompareBrand[] = [];

  for (const brand of allBrands) {
    if (brand.latestScore === null) continue;

    const latestScan = getLatestScanForBrand(brand.id);
    if (!latestScan) continue;

    const report = getFullScanReport(latestScan.id);
    if (!report) continue;

    compareBrands.push(mapScanToCompareBrand(brand, report));
  }

  return NextResponse.json({ brands: compareBrands });
}
