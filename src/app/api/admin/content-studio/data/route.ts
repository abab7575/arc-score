import { NextResponse } from "next/server";
import { getAllBrandsWithLatestScores } from "@/lib/db/queries";
import { getNewsArticles } from "@/lib/db/admin-queries";
import { AI_AGENT_PROFILES } from "@/lib/ai-agents";
import { CATEGORY_CONFIG } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const brands = getAllBrandsWithLatestScores();
    const brandOptions = brands
      .filter((b) => b.latestScore !== null)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((b) => ({ slug: b.slug, name: b.name, score: b.latestScore }));

    const categories = Object.entries(CATEGORY_CONFIG).map(([id, cfg]) => ({
      id,
      name: cfg.name,
    }));

    const agents = AI_AGENT_PROFILES.map((a) => ({
      id: a.id,
      name: a.name,
      company: a.company,
      type: a.type,
    }));

    let articles: { id: number; title: string; sourceName: string; publishedAt: string | null }[] = [];
    try {
      const raw = getNewsArticles({ limit: 50 });
      articles = raw.map((a) => ({
        id: a.id,
        title: a.title,
        sourceName: a.sourceName,
        publishedAt: a.publishedAt,
      }));
    } catch {
      // news table may not exist
    }

    return NextResponse.json({ brands: brandOptions, categories, agents, articles });
  } catch (error) {
    console.error("Content studio data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
