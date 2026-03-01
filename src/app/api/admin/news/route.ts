import { NextRequest, NextResponse } from "next/server";
import { getNewsArticles } from "@/lib/db/admin-queries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;

    const articles = getNewsArticles({
      unreadOnly: sp.get("unread") === "true",
      flaggedOnly: sp.get("flagged") === "true",
      minRelevance: sp.get("minRelevance") ? parseInt(sp.get("minRelevance")!) : undefined,
      search: sp.get("search") ?? undefined,
      sourceId: sp.get("sourceId") ? parseInt(sp.get("sourceId")!) : undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!) : undefined,
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error("News error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
