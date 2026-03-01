import { NextResponse } from "next/server";
import { getAllBrandsWithLatestScores } from "@/lib/db/queries";
import type { BrandSummary } from "@/types/report";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const sort = searchParams.get("sort") ?? "score";
  const limit = parseInt(searchParams.get("limit") ?? "200");

  let brands = getAllBrandsWithLatestScores();

  // Map to BrandSummary
  let summaries: BrandSummary[] = brands.map((b) => ({
    id: b.id,
    slug: b.slug,
    name: b.name,
    category: b.category,
    latestScore: b.latestScore,
    latestGrade: b.latestGrade,
    previousScore: b.previousScore,
    delta:
      b.latestScore !== null && b.previousScore !== null
        ? b.latestScore - b.previousScore
        : null,
    scannedAt: b.scannedAt,
    categoryScores: b.categoryScores,
    scoreHistory: b.scoreHistory,
  }));

  // Filter by category
  if (category) {
    summaries = summaries.filter((b) => b.category === category);
  }

  // Sort
  switch (sort) {
    case "score":
      summaries.sort((a, b) => (b.latestScore ?? -1) - (a.latestScore ?? -1));
      break;
    case "delta":
      summaries.sort((a, b) => (b.delta ?? 0) - (a.delta ?? 0));
      break;
    case "alpha":
      summaries.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  // Limit
  summaries = summaries.slice(0, limit);

  return NextResponse.json({ brands: summaries });
}
