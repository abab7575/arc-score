/**
 * Daily Content Generation Script
 *
 * 1. Run intelligence engine → get ranked story candidates
 * 2. For each story, for each platform:
 *    - Generate post text via existing templates
 *    - Generate branded infographic image
 *    - Insert into content_queue table
 * 3. Log summary
 *
 * Usage: npx tsx scripts/content-generate.ts
 */

import { discoverStories, type StoryCandidate } from "@/lib/content-studio/intelligence";
import { generateContent } from "@/lib/content-studio/generators";
import { insertContentQueueItem } from "@/lib/db/admin-queries";
import { renderImage } from "@/lib/content-studio/images/renderer";
import { EDUCATIONAL_TOPICS } from "@/lib/content-studio/educational-topics";
import type { Platform, ContentType } from "@/lib/content-studio/templates";

// Image template imports
import React from "react";
import { ScorecardImage } from "@/lib/content-studio/images/templates/scorecard";
import { LeaderboardImage } from "@/lib/content-studio/images/templates/leaderboard";
import { MoverAlertImage } from "@/lib/content-studio/images/templates/mover-alert";
import { EducationalImage } from "@/lib/content-studio/images/templates/educational";
import { NewsReactImage } from "@/lib/content-studio/images/templates/news-react";

// ── Image Rendering by Template ────────────────────────────────────

async function renderStoryImage(
  story: StoryCandidate,
  platform: string,
  index: number
): Promise<{ base64: string; filename: string } | undefined> {
  const filename = `${story.id}-${platform}-${index}.png`;
  const data = story.templateData;

  try {
    switch (story.imageTemplate) {
      case "scorecard":
        return await renderImage(
          React.createElement(ScorecardImage, {
            data: {
              brandName: data.brandName as string,
              score: data.overallScore as number,
              grade: data.grade as string,
              categories: data.categories as Array<{ name: string; score: number; grade: string }>,
              delta: (data.delta as number | null) ?? undefined,
            },
          }),
          filename
        );

      case "leaderboard":
        return await renderImage(
          React.createElement(LeaderboardImage, {
            data: {
              title: story.title,
              brands: data.brands as Array<{ name: string; score: number; grade: string }>,
              totalTracked: data.totalBrands as number,
            },
          }),
          filename
        );

      case "mover-alert":
        return await renderImage(
          React.createElement(MoverAlertImage, {
            data: {
              brandName: data.brandName as string,
              scoreBefore: data.previousScore as number,
              scoreAfter: data.currentScore as number,
              delta: data.delta as number,
              grade: data.grade as string,
            },
          }),
          filename
        );

      case "educational": {
        return await renderImage(
          React.createElement(EducationalImage, {
            data: {
              title: data.title as string,
              subtitle: data.subtitle as string,
              bullets: data.bullets as string[],
              accentColor: data.accentColor as string | undefined,
            },
          }),
          filename
        );
      }

      case "news-react":
        return await renderImage(
          React.createElement(NewsReactImage, {
            data: {
              headline: data.articleTitle as string,
              source: data.articleSource as string,
            },
          }),
          filename
        );

      default:
        return undefined;
    }
  } catch (error) {
    console.error(`  Image generation failed for ${story.id}:`, error);
    return undefined;
  }
}

// ── Generate Text Content ──────────────────────────────────────────

function generateTextForStory(story: StoryCandidate, platform: Platform): string {
  const data = story.templateData;

  // Educational content uses a custom template (not in generators.ts)
  if (story.contentType === "educational") {
    const topic = EDUCATIONAL_TOPICS.find((t) => t.id === data.topicId);
    if (!topic) return story.title;

    if (platform === "x") {
      const bullets = topic.bullets.slice(0, 3).map((b) => `• ${b}`).join("\n");
      const text = `${topic.title}\n\n${bullets}\n\nrobotshopper.com`;
      return text.length > 280 ? text.slice(0, 279) + "…" : text;
    }

    const bullets = topic.bullets.map((b) => `• ${b}`).join("\n");
    return `${topic.title}\n\n${topic.subtitle}\n\n${bullets}\n\nLearn more at robotshopper.com\n\n#AICommerce #Ecommerce #RobotShopper`;
  }

  // All other content types use the existing generator
  const result = generateContent({
    contentType: story.contentType as ContentType,
    platform,
    categoryId: data.categoryId as string | undefined,
    brandSlug: data.brandSlug as string | undefined,
    agentId: data.agentId as string | undefined,
    direction: data.direction as "up" | "down" | "both" | undefined,
    count: (data.brands as unknown[])?.length || 5,
    articleIds: data.articleIds as number[] | undefined,
    commentary: data.commentary as string | undefined,
  });

  return result.content;
}

// ── Main ──────────────────────────────────────────────────────────

async function main() {
  console.log("\n=== Content Generation ===\n");
  console.log(`Date: ${new Date().toISOString()}\n`);

  // 1. Discover stories
  const stories = discoverStories();
  console.log(`Discovered ${stories.length} story candidates:\n`);

  for (const s of stories) {
    console.log(`  [${s.priority}] ${s.contentType}: ${s.title}`);
  }
  console.log();

  if (stories.length === 0) {
    console.log("No stories to generate. Exiting.\n");
    return;
  }

  // 2. Generate content for each story × platform
  let generated = 0;

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const platforms = story.platforms.filter((p): p is "x" | "linkedin" => p !== "newsletter");

    for (const platform of platforms) {
      console.log(`Generating: [${platform}] ${story.title}...`);

      // Generate text
      const body = generateTextForStory(story, platform);

      // Generate image
      const imageResult = await renderStoryImage(story, platform, i);
      if (imageResult) {
        console.log(`  Image: ${imageResult.filename} (${Math.round(imageResult.base64.length / 1024)}KB)`);
      }

      // Insert into queue
      insertContentQueueItem({
        contentType: story.contentType,
        platform,
        title: story.title,
        body,
        imageUrl: imageResult ? `/api/admin/content-images/${Date.now()}` : undefined,
        imageTemplate: story.imageTemplate,
        status: "draft",
        metadata: JSON.stringify(story.templateData),
        priorityScore: story.priority,
        generatedBy: "cron",
      });

      generated++;
    }
  }

  console.log(`\nGenerated ${generated} queue items.`);
  console.log("Done.\n");
}

main().catch((err) => {
  console.error("Content generation failed:", err);
  process.exit(1);
});
