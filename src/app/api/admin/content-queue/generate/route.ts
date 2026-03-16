import { NextResponse } from "next/server";
import { discoverStories } from "@/lib/content-studio/intelligence";
import { generateContent } from "@/lib/content-studio/generators";
import { insertContentQueueItem } from "@/lib/db/admin-queries";
import { generatePendingImages } from "@/lib/content-studio/images/generate-images";
import { EDUCATIONAL_TOPICS } from "@/lib/content-studio/educational-topics";
import type { Platform, ContentType } from "@/lib/content-studio/templates";
import type { StoryCandidate } from "@/lib/content-studio/intelligence";

export const dynamic = "force-dynamic";

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

export async function POST() {
  try {
    const stories = discoverStories();

    if (stories.length === 0) {
      return NextResponse.json({
        generated: 0,
        message: "No stories discovered",
      });
    }

    let generated = 0;

    for (const story of stories) {
      const platforms = story.platforms.filter(
        (p): p is "x" | "linkedin" => p !== "newsletter"
      );

      for (const platform of platforms) {
        const body = generateTextForStory(story, platform);

        // Skip image generation in inline mode (too slow for API response)
        insertContentQueueItem({
          contentType: story.contentType,
          platform,
          title: story.title,
          body,
          imageTemplate: story.imageTemplate,
          status: "draft",
          metadata: JSON.stringify(story.templateData),
          priorityScore: story.priority,
          generatedBy: "manual",
        });

        generated++;
      }
    }

    // Generate images synchronously — don't fire-and-forget, it's fast with Satori
    let imgResult = { generated: 0, failed: 0, skipped: 0, remaining: 0 };
    try {
      imgResult = await generatePendingImages({ limit: 10 });
    } catch (err) {
      console.error("[Content Gen] Image rendering error:", err);
    }

    return NextResponse.json({
      generated,
      stories: stories.length,
      images: imgResult,
      message: `Generated ${generated} queue items from ${stories.length} stories. ${imgResult.generated} images rendered${imgResult.failed > 0 ? `, ${imgResult.failed} failed` : ""}.`,
    });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
