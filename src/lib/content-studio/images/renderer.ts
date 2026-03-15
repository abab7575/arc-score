/**
 * Image Generation Pipeline — Nano Banana Pro (Google Gemini)
 *
 * Generates professional infographic images using AI image generation
 * instead of Satori JSX templates. Much higher visual quality.
 */

import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3-pro-image-preview";

const BRAND_STYLE = `
CRITICAL DESIGN REQUIREMENTS — follow these EXACTLY:
- Style: Clean, modern infographic. Premium feel. Magazine-quality layout.
- Background: Warm cream/off-white (#FFF8F0)
- Primary text: Dark navy (#0A1628)
- Accent colors: Coral red (#FF6648), Cobalt blue (#0259DD), Mustard yellow (#FBBA16), Emerald green (#059669), Violet (#7C3AED)
- Top edge: A thin 5px multi-color stripe across the full width (coral, mustard, cobalt, violet, emerald — left to right)
- Bottom bar: Navy (#0A1628) footer with "Robot Shopper" in white and "robotshopper.com" in coral
- Typography: Clean sans-serif. Headlines must be LARGE and BOLD (like 40pt+). Body text at least 16pt.
- Layout: Use the FULL canvas. No dead space. Fill the frame.
- Dimensions: Landscape 16:9 aspect ratio
- NO clip art, NO stock photo style, NO cartoons. Clean data visualization and typography only.
- Text must be crisp and fully readable — this is an infographic, not an illustration.
`;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[Image Gen] No GEMINI_API_KEY — skipping image generation");
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

export async function renderImage(
  prompt: string,
  filename: string
): Promise<{ buffer: Buffer; base64: string; filename: string }> {
  const client = getClient();
  if (!client) {
    throw new Error("GEMINI_API_KEY not configured");
  }

  const fullPrompt = `Create a professional social media infographic image.\n\n${BRAND_STYLE}\n\nCONTENT TO SHOW:\n${prompt}`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: fullPrompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: "16:9",
      },
    },
  });

  // Extract image from response
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates in response");
  }

  const parts = candidates[0].content?.parts;
  if (!parts) {
    throw new Error("No parts in response");
  }

  for (const part of parts) {
    if (part.inlineData?.data) {
      const base64 = part.inlineData.data;
      const buffer = Buffer.from(base64, "base64");
      return { buffer, base64, filename };
    }
  }

  throw new Error("No image data in response");
}

export const WIDTH = 1200;
export const HEIGHT = 675;
