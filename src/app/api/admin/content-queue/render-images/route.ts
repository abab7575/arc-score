import { NextResponse } from "next/server";
import { generatePendingImages } from "@/lib/content-studio/images/generate-images";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/content-queue/render-images
 * Generates images for all content queue items that have a template but no image.
 */
export async function POST() {
  try {
    const result = await generatePendingImages();

    return NextResponse.json({
      ...result,
      message: `Generated ${result.generated} images (${result.failed} failed, ${result.skipped} skipped)`,
    });
  } catch (error) {
    console.error("Error generating images:", error);
    return NextResponse.json({ error: "Image generation failed" }, { status: 500 });
  }
}
