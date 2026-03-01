/**
 * Shared news scan logic — used by both the CLI script and the admin API route.
 */

import { db, schema } from "@/lib/db/index";
import { eq, sql } from "drizzle-orm";
import { scoreRelevance } from "./relevance";

export interface ScanResult {
  totalItems: number;
  newArticles: number;
  highRelevance: number;
  newSuggestions: number;
  errors: string[];
}

export async function runNewsScan(): Promise<ScanResult> {
  const RssParser = (await import("rss-parser")).default;
  const parser = new RssParser({
    timeout: 15000,
    headers: {
      "User-Agent": "ARC-Score-Bot/1.0 (+https://arcscore.com)",
    },
  });

  // Get active feed sources
  const feeds = db
    .select()
    .from(schema.feedSources)
    .where(eq(schema.feedSources.active, true))
    .all();

  // Get existing article URLs for dedup
  const existingUrls = new Set(
    db
      .select({ url: schema.newsArticles.url })
      .from(schema.newsArticles)
      .all()
      .map((r) => r.url)
  );

  // Get existing brand names
  const existingBrandNames = new Set(
    db
      .select({ name: sql<string>`lower(name)` })
      .from(schema.brands)
      .all()
      .map((r) => r.name)
  );

  // Get existing pending suggestions
  const existingSuggestions = new Set(
    db
      .select({ name: sql<string>`lower(name)` })
      .from(schema.suggestedBrands)
      .where(eq(schema.suggestedBrands.status, "pending"))
      .all()
      .map((r) => r.name)
  );

  let totalItems = 0;
  let newArticles = 0;
  let highRelevance = 0;
  let newSuggestions = 0;
  const errors: string[] = [];

  for (const feed of feeds) {
    try {
      const rss = await parser.parseURL(feed.url);
      const items = rss.items ?? [];
      totalItems += items.length;

      for (const item of items) {
        const articleUrl = item.link;
        if (!articleUrl) continue;
        if (existingUrls.has(articleUrl)) continue;

        const fullText = [
          item.title ?? "",
          item.contentSnippet ?? item.content ?? "",
          item.summary ?? "",
        ].join(" ");

        const { score, tags, mentionedBrands } = scoreRelevance(fullText);

        const result = db
          .insert(schema.newsArticles)
          .values({
            feedSourceId: feed.id,
            title: item.title ?? "Untitled",
            url: articleUrl,
            description: (item.contentSnippet ?? item.summary ?? "").slice(0, 500),
            publishedAt: item.isoDate ?? item.pubDate ?? null,
            relevanceScore: score,
            relevanceTags: JSON.stringify(tags),
            mentionedBrands: JSON.stringify(mentionedBrands),
          })
          .onConflictDoNothing()
          .returning({ id: schema.newsArticles.id })
          .get();

        existingUrls.add(articleUrl);
        newArticles++;

        if (score >= 70) highRelevance++;

        // Suggest any mentioned brands not in our database
        if (result && mentionedBrands.length > 0) {
          for (const brandName of mentionedBrands) {
            const lowerName = brandName.toLowerCase();
            if (!existingBrandNames.has(lowerName)) {
              if (!existingSuggestions.has(lowerName)) {
                db.insert(schema.suggestedBrands)
                  .values({
                    name: brandName,
                    sourceArticleId: result.id,
                  })
                  .run();
                existingSuggestions.add(lowerName);
                newSuggestions++;
              } else {
                db.update(schema.suggestedBrands)
                  .set({
                    mentionCount: sql`${schema.suggestedBrands.mentionCount} + 1`,
                  })
                  .where(eq(schema.suggestedBrands.name, brandName))
                  .run();
              }
            }
          }
        }
      }

      // Update last fetched timestamp
      db.update(schema.feedSources)
        .set({ lastFetchedAt: new Date().toISOString() })
        .where(eq(schema.feedSources.id, feed.id))
        .run();
    } catch (err) {
      errors.push(`${feed.name}: ${(err as Error).message}`);
    }
  }

  return { totalItems, newArticles, highRelevance, newSuggestions, errors };
}
