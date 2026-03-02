/**
 * Shared news scan logic — used by both the CLI script and the admin API route.
 * Handles RSS, blog, newsletter, podcast, YouTube, and Reddit source types.
 */

import { db, schema } from "@/lib/db/index";
import { eq, sql } from "drizzle-orm";
import { scoreRelevance } from "./relevance";
import { processArticleForDiscoveries } from "@/lib/content/brand-discovery";
import { fetchRedditPosts } from "@/lib/content/reddit";
import { runEnrichment } from "@/lib/content/enrich";

export interface ScanResult {
  totalItems: number;
  newArticles: number;
  highRelevance: number;
  enriched?: number;
  newSuggestions: number;
  errors: string[];
}

interface ParsedItem {
  title: string;
  url: string;
  description: string;
  publishedAt: string | null;
  sourceType: string;
  thumbnailUrl?: string;
  contentMeta?: Record<string, unknown>;
}

/**
 * Fetch items from a Reddit JSON feed and normalize to ParsedItem format.
 */
async function fetchRedditItems(feedUrl: string): Promise<ParsedItem[]> {
  const posts = await fetchRedditPosts(feedUrl);
  return posts.map((post) => ({
    title: post.title,
    url: post.permalink,
    description: post.selftext.slice(0, 500),
    publishedAt: new Date(post.created_utc * 1000).toISOString(),
    sourceType: "reddit",
    contentMeta: {
      author: post.author,
      score: post.score,
      numComments: post.num_comments,
      subreddit: post.subreddit,
    },
  }));
}

/**
 * Fetch items from an RSS/Atom feed (for RSS, blog, newsletter, podcast, youtube).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchRssItems(
  feedUrl: string,
  sourceType: string,
  parser: any
): Promise<ParsedItem[]> {
  const rss = await parser.parseURL(feedUrl);
  return (rss.items ?? [])
    .filter((item: any) => item.link)
    .map((item: any) => {
      const meta: Record<string, unknown> = {};

      // Extract YouTube-specific metadata
      if (sourceType === "youtube") {
        const mediaGroup = (item as Record<string, unknown>)["media:group"] as Record<string, unknown> | undefined;
        if (mediaGroup) {
          const mediaThumbnail = mediaGroup["media:thumbnail"] as Record<string, string> | undefined;
          if (mediaThumbnail) {
            meta.thumbnailUrl = mediaThumbnail.url || (mediaThumbnail as any).$?.url;
          }
        }
      }

      // Extract podcast-specific metadata
      if (sourceType === "podcast") {
        const duration = (item as Record<string, unknown>)["itunes:duration"] as string | undefined;
        if (duration) meta.duration = duration;
        const author = (item as Record<string, unknown>)["itunes:author"] as string | undefined;
        if (author) meta.author = author;
      }

      return {
        title: item.title ?? "Untitled",
        url: item.link!,
        description: (item.contentSnippet ?? item.summary ?? "").slice(0, 500),
        publishedAt: item.isoDate ?? item.pubDate ?? null,
        sourceType,
        thumbnailUrl: (meta.thumbnailUrl as string) || undefined,
        contentMeta: Object.keys(meta).length > 0 ? meta : undefined,
      };
    });
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
      const feedSourceType = feed.sourceType || "rss";

      // Fetch items based on source type
      let items: ParsedItem[];
      if (feedSourceType === "reddit") {
        items = await fetchRedditItems(feed.url);
      } else {
        items = await fetchRssItems(feed.url, feedSourceType, parser);
      }

      totalItems += items.length;

      for (const item of items) {
        if (existingUrls.has(item.url)) continue;

        const fullText = [item.title, item.description].join(" ");
        const { score, tags, mentionedBrands } = scoreRelevance(fullText);

        const result = db
          .insert(schema.newsArticles)
          .values({
            feedSourceId: feed.id,
            title: item.title,
            url: item.url,
            description: item.description,
            publishedAt: item.publishedAt,
            sourceType: item.sourceType,
            relevanceScore: score,
            relevanceTags: JSON.stringify(tags),
            mentionedBrands: JSON.stringify(mentionedBrands),
            thumbnailUrl: item.thumbnailUrl || null,
            contentMeta: item.contentMeta ? JSON.stringify(item.contentMeta) : "{}",
          })
          .onConflictDoNothing()
          .returning({ id: schema.newsArticles.id })
          .get();

        existingUrls.add(item.url);
        newArticles++;

        if (score >= 70) highRelevance++;

        // Suggest any mentioned brands not in our database (legacy suggestedBrands)
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

        // Feed the brand discovery pipeline (enhanced extraction + heuristics)
        if (result) {
          try {
            processArticleForDiscoveries(result.id, fullText, mentionedBrands);
          } catch {
            // Non-blocking — don't fail the scan for discovery errors
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

  // Phase B: Enrichment — fetch transcripts for YouTube and podcast items
  let enriched = 0;
  try {
    const enrichResult = await runEnrichment(20);
    enriched = enrichResult.enriched;
  } catch {
    // Non-blocking — enrichment failures don't fail the scan
  }

  return { totalItems, newArticles, highRelevance, newSuggestions, enriched, errors };
}
