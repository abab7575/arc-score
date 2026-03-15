/**
 * Generates images for content queue items that have a template but no image.
 * Called after content generation or as a standalone batch process.
 */

import React from "react";
import { db, schema } from "@/lib/db/index";
import { eq, and, isNull } from "drizzle-orm";

// Use eval'd require to prevent Turbopack from statically analyzing native module imports
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const dynamicRequire = new Function("mod", "return require(mod)") as (mod: string) => unknown;

function loadRenderer(): { renderImage: (element: React.ReactElement, filename: string) => Promise<string> } {
  return dynamicRequire("./renderer") as { renderImage: (element: React.ReactElement, filename: string) => Promise<string> };
}

function loadTemplates() {
  return {
    leaderboard: dynamicRequire("./templates/leaderboard") as typeof import("./templates/leaderboard"),
    scorecard: dynamicRequire("./templates/scorecard") as typeof import("./templates/scorecard"),
    moverAlert: dynamicRequire("./templates/mover-alert") as typeof import("./templates/mover-alert"),
    newsReact: dynamicRequire("./templates/news-react") as typeof import("./templates/news-react"),
    educational: dynamicRequire("./templates/educational") as typeof import("./templates/educational"),
  };
}

type LeaderboardData = import("./templates/leaderboard").LeaderboardData;
type ScorecardData = import("./templates/scorecard").ScorecardData;
type MoverAlertData = import("./templates/mover-alert").MoverAlertData;
type NewsReactData = import("./templates/news-react").NewsReactData;
type EducationalData = import("./templates/educational").EducationalData;

function buildImageElement(
  template: string,
  metadata: Record<string, unknown>
): React.ReactElement | null {
  const templates = loadTemplates();
  switch (template) {
    case "leaderboard":
      return React.createElement(templates.leaderboard.LeaderboardImage, {
        data: metadata as unknown as LeaderboardData,
      });
    case "scorecard":
      return React.createElement(templates.scorecard.ScorecardImage, {
        data: metadata as unknown as ScorecardData,
      });
    case "mover-alert":
      return React.createElement(templates.moverAlert.MoverAlertImage, {
        data: metadata as unknown as MoverAlertData,
      });
    case "news-react":
      return React.createElement(templates.newsReact.NewsReactImage, {
        data: metadata as unknown as NewsReactData,
      });
    case "educational":
      return React.createElement(templates.educational.EducationalImage, {
        data: metadata as unknown as EducationalData,
      });
    default:
      console.warn(`[Image Gen] Unknown template: ${template}`);
      return null;
  }
}

/**
 * Generate an image for a single content queue item.
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
    const { renderImage } = loadRenderer();
    const filename = `content-${item.id}-${item.imageTemplate}.png`;
    const imageUrl = await renderImage(element, filename);

    // Update the database
    db.update(schema.contentQueue)
      .set({ imageUrl })
      .where(eq(schema.contentQueue.id, item.id))
      .run();

    console.log(`[Image Gen] Generated ${imageUrl} for item ${item.id}`);
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
    .where(
      and(
        isNull(schema.contentQueue.imageUrl),
        // Only items with a template set
      )
    )
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
