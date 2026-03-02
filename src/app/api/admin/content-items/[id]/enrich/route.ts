import { NextRequest, NextResponse } from "next/server";
import { enrichItem } from "@/lib/content/enrich";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await enrichItem(parseInt(id));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Enrich error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
