import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/content-queue/render-images
 * Generates images for all content queue items that have a template but no image.
 */
export async function POST() {
  try {
    const { generatePendingImages } = await import(
      "@/lib/content-studio/images/generate-images"
    );
    const result = await generatePendingImages();

    return NextResponse.json({
      ...result,
      message: `Generated ${result.generated} images (${result.failed} failed, ${result.skipped} skipped)`,
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
