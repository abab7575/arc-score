/**
 * Content enrichment pipeline — fetches transcripts and full content
 * for YouTube and podcast items after initial RSS ingest.
 */

import { db, schema } from "@/lib/db/index";
import { eq, and, sql, isNull } from "drizzle-orm";
import { fetchYouTubeTranscript, getYouTubeThumbnail } from "./youtube";
import { extractPodcastContent } from "./podcast";

interface EnrichResult {
  itemId: number;
  sourceType: string;
  enriched: boolean;
  wordCount: number;
  error?: string;
}

/**
 * Enrich a single content item with full content (transcript, show notes, etc.).
 */
export async function enrichItem(itemId: number): Promise<EnrichResult> {
  const item = db
    .select()
    .from(schema.newsArticles)
    .where(eq(schema.newsArticles.id, itemId))
    .get();

  if (!item) {
    return { itemId, sourceType: "unknown", enriched: false, wordCount: 0, error: "Item not found" };
  }

  const sourceType = item.sourceType || "rss";

  // Skip if already enriched
  if (item.fullContent) {
    return { itemId, sourceType, enriched: false, wordCount: 0, error: "Already enriched" };
  }

  try {
    if (sourceType === "youtube") {
      return await enrichYouTube(item);
    }

    if (sourceType === "podcast") {
      return enrichPodcast(item);
    }

    return { itemId, sourceType, enriched: false, wordCount: 0, error: "Source type not enrichable" };
  } catch (err) {
    return { itemId, sourceType, enriched: false, wordCount: 0, error: (err as Error).message };
  }
}

async function enrichYouTube(item: typeof schema.newsArticles.$inferSelect): Promise<EnrichResult> {
  const { transcript, wordCount, needsSummary } = await fetchYouTubeTranscript(item.url);

  // Also get thumbnail if missing
  const thumbnailUrl = item.thumbnailUrl || getYouTubeThumbnail(item.url);

  const updates: Record<string, unknown> = {};
  if (transcript) updates.fullContent = transcript;
  if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

  if (needsSummary) {
    const meta = JSON.parse(item.contentMeta || "{}");
    meta.needsSummary = true;
    meta.wordCount = wordCount;
    updates.contentMeta = JSON.stringify(meta);
  }

  if (Object.keys(updates).length > 0) {
    db.update(schema.newsArticles)
      .set(updates)
      .where(eq(schema.newsArticles.id, item.id))
      .run();
  }

  return {
    itemId: item.id,
    sourceType: "youtube",
    enriched: !!transcript,
    wordCount,
  };
}

function enrichPodcast(item: typeof schema.newsArticles.$inferSelect): EnrichResult {
  // For podcasts, the show notes may already be in the description.
  // We try to extract richer content from the full RSS item fields
  // which were stored during scan. Since we only have description
  // at this point, we store it as fullContent if it's substantial.
  const description = item.description || "";

  if (description.length > 200) {
    db.update(schema.newsArticles)
      .set({ fullContent: description })
      .where(eq(schema.newsArticles.id, item.id))
      .run();

    const wordCount = description.split(/\s+/).length;
    return {
      itemId: item.id,
      sourceType: "podcast",
      enriched: true,
      wordCount,
    };
  }

  return {
    itemId: item.id,
    sourceType: "podcast",
    enriched: false,
    wordCount: 0,
  };
}

/**
 * Run enrichment on all unenriched YouTube and podcast items.
 * Called as Phase B after the main RSS scan.
 */
export async function runEnrichment(limit = 20): Promise<{
  processed: number;
  enriched: number;
  errors: number;
}> {
  // Get unenriched YouTube and podcast items
  const items = db
    .select()
    .from(schema.newsArticles)
    .where(
      and(
        sql`${schema.newsArticles.sourceType} IN ('youtube', 'podcast')`,
        isNull(schema.newsArticles.fullContent)
      )
    )
    .limit(limit)
    .all();

  let enriched = 0;
  let errors = 0;

  for (const item of items) {
    const result = await enrichItem(item.id);
    if (result.enriched) enriched++;
    if (result.error && result.error !== "Already enriched" && result.error !== "Source type not enrichable") {
      errors++;
    }
  }

  return { processed: items.length, enriched, errors };
}
