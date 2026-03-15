/**
 * Generates images for content queue items that have a template but no image.
 * Stores PNG as base64 in the database so images survive Railway deploys.
 */

import React from "react";
import { db, schema } from "@/lib/db/index";
import { eq, isNull } from "drizzle-orm";
import { renderImage } from "./renderer";
import { LeaderboardImage, type LeaderboardData } from "./templates/leaderboard";
import { ScorecardImage, type ScorecardData } from "./templates/scorecard";
import { MoverAlertImage, type MoverAlertData } from "./templates/mover-alert";
import { NewsReactImage, type NewsReactData } from "./templates/news-react";
import { EducationalImage, type EducationalData } from "./templates/educational";

function buildImageElement(
  template: string,
  metadata: Record<string, unknown>
): React.ReactElement | null {
  switch (template) {
    case "leaderboard":
      return React.createElement(LeaderboardImage, {
        data: metadata as unknown as LeaderboardData,
      });
    case "scorecard":
      return React.createElement(ScorecardImage, {
        data: metadata as unknown as ScorecardData,
      });
    case "mover-alert":
      return React.createElement(MoverAlertImage, {
        data: metadata as unknown as MoverAlertData,
      });
    case "news-react":
      return React.createElement(NewsReactImage, {
        data: metadata as unknown as NewsReactData,
      });
    case "educational":
      return React.createElement(EducationalImage, {
        data: metadata as unknown as EducationalData,
      });
    default:
      console.warn(`[Image Gen] Unknown template: ${template}`);
      return null;
  }
}

/**
 * Generate an image for a single content queue item.
 * Stores the PNG as base64 in the imageData column.
 */
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
    } catch {
      console.warn(`[Image Gen] Invalid metadata JSON for item ${item.id}`);
    }
  }

  const element = buildImageElement(item.imageTemplate, metadata);
  if (!element) return null;

  try {
    const filename = `content-${item.id}-${item.imageTemplate}.png`;
    const { base64 } = await renderImage(element, filename);

    // Store base64 in DB and set imageUrl to the serving endpoint
    const imageUrl = `/api/admin/content-images/${item.id}`;
    db.update(schema.contentQueue)
      .set({ imageUrl, imageData: base64 })
      .where(eq(schema.contentQueue.id, item.id))
      .run();

    console.log(`[Image Gen] Generated image for item ${item.id} (${Math.round(base64.length / 1024)}KB)`);
    return imageUrl;
  } catch (err) {
    console.error(`[Image Gen] Failed for item ${item.id}:`, err);
    return null;
  }
}

/**
 * Generate images for ALL content queue items that have a template but no image.
 */
export async function generatePendingImages(): Promise<{
  generated: number;
  failed: number;
  skipped: number;
}> {
  const pending = db
    .select({
      id: schema.contentQueue.id,
      imageTemplate: schema.contentQueue.imageTemplate,
      metadata: schema.contentQueue.metadata,
      title: schema.contentQueue.title,
    })
    .from(schema.contentQueue)
    .where(isNull(schema.contentQueue.imageData))
    .all()
    .filter((item: { imageTemplate: string | null }) => item.imageTemplate !== null);

  console.log(`[Image Gen] Found ${pending.length} items needing images`);

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

  return { generated, failed, skipped };
}
