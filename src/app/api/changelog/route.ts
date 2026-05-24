import { NextRequest, NextResponse } from "next/server";
import { getRecentChangelog } from "@/lib/db/queries";
import { db, schema } from "@/lib/db/index";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 30, 60000);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const url = new URL(request.url);
  const limitParam = url.searchParams.get("limit");
  const requested = limitParam ? parseInt(limitParam, 10) : 50;
  const limit = Math.min(Math.max(requested, 1), 500);

  const entries = getRecentChangelog(limit);

  const brands = db
    .select({ id: schema.brands.id, slug: schema.brands.slug, name: schema.brands.name })
    .from(schema.brands)
    .all();
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  return NextResponse.json({
    entries: entries.map((entry) => ({
      ...entry,
      brandSlug: brandMap.get(entry.brandId)?.slug ?? "unknown",
      brandName: brandMap.get(entry.brandId)?.name ?? "Unknown",
    })),
  });
}
