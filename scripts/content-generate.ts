/**
 * Daily Content Generation Script
 *
 * 1. Run intelligence engine → get ranked story candidates
 * 2. For each story, for each platform:
 *    - Generate post text via existing templates
 *    - Insert into content_queue table (images generated separately via admin UI)
 * 3. Log summary
 *
 * Usage: npx tsx scripts/content-generate.ts
 */

import { discoverStories, type StoryCandidate } from "@/lib/content-studio/intelligence";
import { generateContent } from "@/lib/content-studio/generators";
import { insertContentQueueItem } from "@/lib/db/admin-queries";
import { EDUCATIONAL_TOPICS } from "@/lib/content-studio/educational-topics";
import type { Platform, ContentType } from "@/lib/content-studio/templates";

// ── Generate Text Content ──────────────────────────────────────────

function generateTextForStory(story: StoryCandidate, platform: Platform): string {
  const data = story.templateData;

  if (story.contentType === "educational") {
    const topic = EDUCATIONAL_TOPICS.find((t) => t.id === data.topicId);
    if (!topic) return story.title;

    if (platform === "x") {
      const bullets = topic.bullets.slice(0, 3).map((b) => `• ${b}`).join("\n");
      const text = `${topic.title}\n\n${bullets}\n\narcreport.ai`;
      return text.length > 280 ? text.slice(0, 279) + "…" : text;
    }

    const bullets = topic.bullets.map((b) => `• ${b}`).join("\n");
    return `${topic.title}\n\n${topic.subtitle}\n\n${bullets}\n\nLearn more at arcreport.ai\n\n#AICommerce #Ecommerce #ARCReport`;
  }

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

  let generated = 0;

  for (const story of stories) {
    const platforms = story.platforms.filter((p): p is "x" | "linkedin" => p !== "newsletter");

    for (const platform of platforms) {
      console.log(`Generating: [${platform}] ${story.title}...`);

      const body = generateTextForStory(story, platform);

      // Insert into queue — images generated later via admin UI "Regenerate Images"
      insertContentQueueItem({
        contentType: story.contentType,
        platform,
        title: story.title,
        body,
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
  console.log("Images will be generated when you click 'Regenerate Images' in the admin UI.");
  console.log("Done.\n");
}

main().catch(console.error);
