/**
 * Image Generation Pipeline
 *
 * satori: JSX → SVG
 * @resvg/resvg-js: SVG → PNG
 *
 * Saves PNGs to public/content-images/{date}/
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import type { ReactElement } from "react";

// ── Font Loading ──────────────────────────────────────────────────

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

let fontsLoaded = false;
let fontData: {
  interRegular: ArrayBuffer;
  interBold: ArrayBuffer;
  interBlack: ArrayBuffer;
  jetBrainsBold: ArrayBuffer;
} | null = null;

function loadFonts() {
  if (fontsLoaded && fontData) return fontData;

  fontData = {
    interRegular: fs.readFileSync(path.join(FONTS_DIR, "Inter-Regular.ttf")).buffer as ArrayBuffer,
    interBold: fs.readFileSync(path.join(FONTS_DIR, "Inter-Bold.ttf")).buffer as ArrayBuffer,
    interBlack: fs.readFileSync(path.join(FONTS_DIR, "Inter-Black.ttf")).buffer as ArrayBuffer,
    jetBrainsBold: fs.readFileSync(path.join(FONTS_DIR, "JetBrainsMono-Bold.ttf")).buffer as ArrayBuffer,
  };
  fontsLoaded = true;
  return fontData;
}

// ── Core Render Pipeline ──────────────────────────────────────────

const WIDTH = 1200;
const HEIGHT = 675;

export async function renderImage(
  element: ReactElement,
  filename: string
): Promise<string> {
  const fonts = loadFonts();

  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Inter", data: fonts.interRegular, weight: 400, style: "normal" },
      { name: "Inter", data: fonts.interBold, weight: 700, style: "normal" },
      { name: "Inter", data: fonts.interBlack, weight: 900, style: "normal" },
      { name: "JetBrains Mono", data: fonts.jetBrainsBold, weight: 700, style: "normal" },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  // Save to public/content-images/{date}/
  const dateDir = new Date().toISOString().split("T")[0];
  const outputDir = path.join(process.cwd(), "public", "content-images", dateDir);
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, pngBuffer);

  // Return the public URL path
  return `/content-images/${dateDir}/${filename}`;
}

export { WIDTH, HEIGHT };
