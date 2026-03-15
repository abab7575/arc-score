/**
 * Satori Image Renderer — JSX → SVG → PNG
 * Free, local, instant, unlimited. No API needed.
 */

import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import type { ReactElement } from "react";

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

const WIDTH = 1200;
const HEIGHT = 675;

export async function renderSatoriImage(
  element: ReactElement
): Promise<{ buffer: Buffer; base64: string }> {
  const fonts = loadFonts();

  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: "Inter", data: fonts.interRegular, weight: 400, style: "normal" as const },
      { name: "Inter", data: fonts.interBold, weight: 700, style: "normal" as const },
      { name: "Inter", data: fonts.interBlack, weight: 900, style: "normal" as const },
      { name: "JetBrains Mono", data: fonts.jetBrainsBold, weight: 700, style: "normal" as const },
    ],
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });
  const pngData = resvg.render();
  const buffer = Buffer.from(pngData.asPng());
  const base64 = buffer.toString("base64");

  return { buffer, base64 };
}

export { WIDTH, HEIGHT };
