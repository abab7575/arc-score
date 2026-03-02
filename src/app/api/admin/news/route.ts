import { NextRequest, NextResponse } from "next/server";
import { getNewsArticles } from "@/lib/db/admin-queries";
import { db, schema } from "@/lib/db/index";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { title, url, description, sourceType } = await request.json();

    if (!title || !url) {
      return NextResponse.json({ error: "title and url are required" }, { status: 400 });
    }

    const result = db
      .insert(schema.newsArticles)
      .values({
        title,
        url,
        description: description || null,
        sourceType: sourceType || "rss",
        relevanceScore: 0,
        relevanceTags: "[]",
        mentionedBrands: "[]",
      })
      .onConflictDoNothing()
      .returning()
      .get();

    if (!result) {
      return NextResponse.json({ error: "Article already exists" }, { status: 409 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Add content item error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
