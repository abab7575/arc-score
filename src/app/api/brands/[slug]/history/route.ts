import { NextRequest, NextResponse } from "next/server";
import { getBrandBySlug, getScoreHistory } from "@/lib/db/queries";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const rl = rateLimit(ip, 60, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again in a minute." }, { status: 429 });
  }

  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") ?? "30");

  const brand = getBrandBySlug(slug);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const history = getScoreHistory(brand.id, days);
  return NextResponse.json({ history });
}
