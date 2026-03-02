import { NextRequest, NextResponse } from "next/server";
import { getFeedSources, addFeedSource } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sources = getFeedSources();
    return NextResponse.json(sources);
  } catch (error) {
    console.error("Sources error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, url, category, sourceType } = await request.json();

    if (!name || !url || !category) {
      return NextResponse.json(
        { error: "name, url, and category are required" },
        { status: 400 }
      );
    }

    const source = addFeedSource({ name, url, category, sourceType });
    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    console.error("Add source error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
