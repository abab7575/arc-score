import { NextRequest, NextResponse } from "next/server";
import { getContentQueue, getContentQueueStats } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const items = getContentQueue({
      status: sp.get("status") || undefined,
      platform: sp.get("platform") || undefined,
      contentType: sp.get("contentType") || undefined,
      sortBy: (sp.get("sortBy") as "priority" | "newest") || "priority",
      limit: sp.has("limit") ? parseInt(sp.get("limit")!) : 50,
      offset: sp.has("offset") ? parseInt(sp.get("offset")!) : 0,
    });

    const stats = getContentQueueStats();

    return NextResponse.json({ items, stats });
  } catch (error) {
    console.error("Error fetching content queue:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
