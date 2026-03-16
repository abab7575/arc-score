import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/index";
import { isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/content-queue/render-images
 * Generates images for all content queue items that have a template but no image.
 * Pass ?regenerate=true to clear existing images and re-render all.
 */
export async function POST(request: NextRequest) {
  try {
    const regenerate = request.nextUrl.searchParams.get("regenerate") === "true";
    const limit = parseInt(request.nextUrl.searchParams.get("limit") ?? "10");

    // Clear existing image data if regenerating
    if (regenerate) {
      const cleared = db.update(schema.contentQueue)
        .set({ imageData: null, imageUrl: null })
        .where(isNotNull(schema.contentQueue.imageData))
        .run();
      console.log(`[Render Images] Cleared ${cleared.changes} existing images for regeneration`);
    }

    const { generatePendingImages } = await import(
      "@/lib/content-studio/images/generate-images"
    );
    const result = await generatePendingImages({ limit });

    return NextResponse.json({
      ...result,
      regenerated: regenerate,
      message: `Generated ${result.generated} images (${result.failed} failed, ${result.remaining} remaining)${regenerate ? " [regenerated]" : ""}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Error generating images:", message, stack);
    return NextResponse.json(
      { error: "Image generation failed", detail: message },
      { status: 500 }
    );
  }
}
