import { NextRequest, NextResponse } from "next/server";
import { getDiscoveries } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

    const discoveries = getDiscoveries({ status, search, limit, offset });
    return NextResponse.json(discoveries);
  } catch (error) {
    console.error("Brand pipeline error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
