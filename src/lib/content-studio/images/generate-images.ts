/**
 * Generates images for content queue items using Satori (local, free, instant).
 * Builds JSX from metadata → renders to SVG → converts to PNG → stores as base64.
 */

import React from "react";
import { db, schema } from "@/lib/db/index";
import { eq, isNull, desc } from "drizzle-orm";
import { renderSatoriImage } from "./satori-renderer";
import { MoverAlertImage, type MoverAlertData } from "./templates/mover-alert";
import { ScorecardImage, type ScorecardData } from "./templates/scorecard";
import { LeaderboardImage, type LeaderboardData } from "./templates/leaderboard";
import { EducationalImage, type EducationalData } from "./templates/educational";
import { NewsReactImage, type NewsReactData } from "./templates/news-react";

// ── Element Builders ──────────────────────────────────────────

function buildElement(template: string, metadata: Record<string, unknown>): React.ReactElement | null {
  switch (template) {
    case "mover-alert":
      return React.createElement(MoverAlertImage, { data: metadata as unknown as MoverAlertData });
    case "scorecard":
      return React.createElement(ScorecardImage, { data: metadata as unknown as ScorecardData });
    case "leaderboard":
      return React.createElement(LeaderboardImage, { data: metadata as unknown as LeaderboardData });
    case "educational":
      return React.createElement(EducationalImage, { data: metadata as unknown as EducationalData });
    case "news-react":
      return React.createElement(NewsReactImage, { data: metadata as unknown as NewsReactData });
    default:
      console.warn(`[Image Gen] Unknown template: ${template}`);
      return null;
  }
}

// ── Generation ──────────────────────────────────────────

export async function generateImageForItem(item: {
  id: number;
  imageTemplate: string | null;
  metadata: string | null;
  title: string;
}): Promise<string | null> {
  if (!item.imageTemplate) return null;

  let metadata: Record<string, unknown> = {};
  if (item.metadata) {
    try {
      metadata = JSON.parse(item.metadata);
    } catch (err) {
      console.error(`[Image Gen] Invalid metadata JSON for item ${item.id} "${item.title}":`, err);
      return null;
    }
  }

  const element = buildElement(item.imageTemplate, metadata);
  if (!element) {
    console.error(`[Image Gen] No element built for item ${item.id} — template "${item.imageTemplate}" unknown or metadata shape wrong`);
    return null;
  }

  try {
    const { base64 } = await renderSatoriImage(element);
    const imageUrl = `/api/admin/content-images/${item.id}`;

    db.update(schema.contentQueue)
      .set({ imageUrl, imageData: base64 })
      .where(eq(schema.contentQueue.id, item.id))
      .run();

    console.log(`[Image Gen] OK: item ${item.id} "${item.title}" → ${Math.round(base64.length / 1024)}KB`);
    return imageUrl;
  } catch (err) {
    console.error(`[Image Gen] Satori/Resvg render failed for item ${item.id} "${item.title}" (template: ${item.imageTemplate}):`, err);
    return null;
  }
}

export async function generatePendingImages(options?: { limit?: number }): Promise<{
  generated: number;
  failed: number;
  skipped: number;
  remaining: number;
}> {
  const batchLimit = options?.limit ?? 10;

  // Clear stale imageUrls that point to nothing
  const cleared = db.update(schema.contentQueue)
    .set({ imageUrl: null })
    .where(isNull(schema.contentQueue.imageData))
    .run();
  if (cleared.changes > 0) {
    console.log(`[Image Gen] Cleared ${cleared.changes} stale image URLs`);
  }

  // Process highest-priority items first so the best content gets images soonest
  const allPending = db
    .select({
      id: schema.contentQueue.id,
      imageTemplate: schema.contentQueue.imageTemplate,
      metadata: schema.contentQueue.metadata,
      title: schema.contentQueue.title,
      priorityScore: schema.contentQueue.priorityScore,
    })
    .from(schema.contentQueue)
    .where(isNull(schema.contentQueue.imageData))
    .orderBy(desc(schema.contentQueue.priorityScore))
    .all()
    .filter((item: { imageTemplate: string | null }) => item.imageTemplate !== null);

  const pending = allPending.slice(0, batchLimit);
  const remaining = allPending.length - pending.length;

  console.log(`[Image Gen] Processing ${pending.length} of ${allPending.length} items (Satori — free, local)`);

  let generated = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of pending) {
    const result = await generateImageForItem(item);
    if (result) {
      generated++;
    } else if (item.imageTemplate) {
      failed++;
    } else {
      skipped++;
    }
  }

  return { generated, failed, skipped, remaining };
}
