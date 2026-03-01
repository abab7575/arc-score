import { NextResponse } from "next/server";
import { getBrandBySlug, getScoreHistory } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
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
