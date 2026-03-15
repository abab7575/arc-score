/**
 * Generates images for content queue items using Nano Banana Pro.
 * Builds rich text prompts from metadata and sends to Google's image API.
 */

import { db, schema } from "@/lib/db/index";
import { eq, isNull } from "drizzle-orm";
import { renderImage } from "./renderer";

// ── Prompt Builders ──────────────────────────────────────────

function buildMoverPrompt(metadata: Record<string, unknown>): string {
  const brand = metadata.brandName as string || "Unknown Brand";
  const delta = metadata.delta as number || 0;
  const scoreAfter = metadata.scoreAfter as number || metadata.currentScore as number || 0;
  const scoreBefore = metadata.scoreBefore as number || metadata.previousScore as number || 0;
  const isUp = delta > 0;
  const absDelta = Math.abs(delta);
  const topChanges = metadata.topChanges as Array<{ category: string; delta: number }> || [];

  return `
INFOGRAPHIC: AI Shopping Bot Score Alert

MAIN HEADLINE (very large, bold, navy text):
"${brand}: ${isUp ? "Up" : "Down"} ${absDelta} Points This Week"

SUBHEADLINE (coral red text, medium size):
"We send 5 AI shopping bots to top e-commerce sites every day. Here's what changed."

THE STORY (show as a visual journey with 3 numbered steps):

Step 1 — "We sent 5 AI bots"
We sent a browser bot, data parser, accessibility crawler, vision AI, and feed checker to shop on ${brand}.

Step 2 — "${isUp ? "What improved" : "Where they failed"}"
${topChanges.length > 0
  ? topChanges.map(c => `${c.category}: ${c.delta > 0 ? "+" : ""}${c.delta} points`).join("\n")
  : isUp
    ? "Checkout flow improved. Product data now readable. Navigation accessible."
    : "Bots blocked at checkout. Product data unreadable. Navigation broken."
}

Step 3 — "Current Score"
Show a big circle with the number ${scoreAfter || "7"} out of 100.
${scoreBefore > 0 ? `Was: ${scoreBefore}/100` : ""}
Status: ${scoreAfter >= 70 ? "Agent-Ready" : scoreAfter >= 50 ? "Needs Work" : "Not Ready"}

Use ${isUp ? "green" : "coral red"} as the accent color for the delta and step 2.

IMPORTANT: The three steps should be shown as three distinct cards or panels in a row, each with a numbered badge (1, 2, 3). Fill the full width of the image.
`;
}

function buildScorecardPrompt(metadata: Record<string, unknown>): string {
  const brand = metadata.brandName as string || "Unknown Brand";
  const score = metadata.overallScore as number || metadata.score as number || 0;
  const categories = metadata.categories as Array<{ name: string; score: number }> || [];
  const delta = metadata.delta as number;

  const sorted = [...categories].sort((a, b) => a.score - b.score);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];

  return `
INFOGRAPHIC: AI Agent Readiness Report

MAIN HEADLINE (very large, bold, navy text):
"We Sent 5 AI Shopping Bots to ${brand}"

SUBHEADLINE (medium, gray text):
"${score >= 70 ? "Most of them could browse, find products, and reach checkout." : score >= 50 ? "Some of them got stuck along the way." : "Most of them couldn't complete the shopping journey."}"

LEFT SIDE — Big score display:
- Large number: ${score} out of 100
- Grade: ${score >= 85 ? "A — Agent-Ready" : score >= 70 ? "B — Mostly Ready" : score >= 50 ? "C — Needs Work" : score >= 30 ? "D — Poor" : "F — Not Ready"}
${delta ? `- Change: ${delta > 0 ? "+" : ""}${delta} since last scan` : ""}
${best ? `- Best area: ${best.name} (${best.score}/100)` : ""}
${worst ? `- Biggest gap: ${worst.name} (${worst.score}/100)` : ""}

RIGHT SIDE — Category breakdown (show as horizontal bars):
${categories.map(c => `${c.name}: ${c.score}/100`).join("\n")}

Use color-coded bars: green for 85+, blue for 70+, amber for 50+, red for below 50.

IMPORTANT: Fill the full image. Use a two-column layout. Score hero on the left, category bars on the right.
`;
}

function buildLeaderboardPrompt(metadata: Record<string, unknown>): string {
  const title = metadata.title as string || "AI Agent Readiness Rankings";
  const brands = metadata.brands as Array<{ name: string; score: number; grade: string }> || [];
  const totalTracked = metadata.totalTracked as number || metadata.totalBrands as number;

  return `
INFOGRAPHIC: AI Agent Readiness Rankings

MAIN HEADLINE (very large, bold, navy text):
"${title}"

SUBHEADLINE (medium, gray):
"Ranked by how well AI shopping bots can browse, add to cart, and checkout"
${totalTracked ? `\n"${totalTracked} sites tracked"` : ""}

RANKINGS (show as a numbered leaderboard with horizontal score bars):
${brands.slice(0, 8).map((b, i) => `${i + 1}. ${b.name} — ${b.score}/100 (Grade ${b.grade})`).join("\n")}

Highlight #1 with a coral accent border. Use color-coded score bars: green for 85+, blue for 70+, amber for 50+, red for below 50. The #1 entry should be visually larger/bolder than the rest.

IMPORTANT: Fill the full image. Each ranking entry should be a row with rank number, brand name, score bar, and score number.
`;
}

function buildEducationalPrompt(metadata: Record<string, unknown>): string {
  const title = metadata.title as string || "AI Shopping Agents";
  const subtitle = metadata.subtitle as string || "";
  const bullets = metadata.bullets as string[] || [];

  return `
INFOGRAPHIC: AI Shopping Agents 101

MAIN HEADLINE (very large, bold, navy text):
"${title}"

${subtitle ? `SUBHEADLINE (medium, gray):\n"${subtitle}"` : ""}

KEY POINTS (show as numbered items with colored badges, two-column layout — headline left, bullets right):
${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

Add a small context line: "10 AI shopping agents are live today — from ChatGPT to Amazon Buy For Me. Each one interacts with your site differently."

IMPORTANT: Use numbered circle badges for each point. Fill the full image. Make it educational and visually engaging.
`;
}

function buildNewsPrompt(metadata: Record<string, unknown>): string {
  const headline = metadata.articleTitle as string || metadata.headline as string || "AI Commerce News";
  const source = metadata.articleSource as string || metadata.source as string || "";
  const commentary = metadata.commentary as string || "";

  return `
INFOGRAPHIC: AI Commerce News

TAG LINE (small, mustard yellow): "AI COMMERCE NEWS${source ? ` • VIA ${source.toUpperCase()}` : ""}"

MAIN HEADLINE (very large, bold, navy text):
"${headline}"

COMMENTARY SECTION (in a card with coral left border):
Label: "WHAT THIS MEANS FOR E-COMMERCE"
"${commentary || "AI agents are becoming the new shoppers. Is your site ready?"}"

IMPORTANT: Fill the full image. The headline should dominate. The commentary card should be prominent and readable.
`;
}

function buildPromptForTemplate(template: string, metadata: Record<string, unknown>): string | null {
  switch (template) {
    case "mover-alert":
      return buildMoverPrompt(metadata);
    case "scorecard":
      return buildScorecardPrompt(metadata);
    case "leaderboard":
      return buildLeaderboardPrompt(metadata);
    case "educational":
      return buildEducationalPrompt(metadata);
    case "news-react":
      return buildNewsPrompt(metadata);
    default:
      console.warn(`[Image Gen] Unknown template: ${template}`);
      return null;
  }
}

// ── Generation ──────────────────────────────────────────

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

  const prompt = buildPromptForTemplate(item.imageTemplate, metadata);
  if (!prompt) return null;

  try {
    const filename = `content-${item.id}-${item.imageTemplate}.png`;
    const { base64 } = await renderImage(prompt, filename);

    const imageUrl = `/api/admin/content-images/${item.id}`;
    db.update(schema.contentQueue)
      .set({ imageUrl, imageData: base64 })
      .where(eq(schema.contentQueue.id, item.id))
      .run();

    console.log(`[Image Gen] Generated ${imageUrl} for item ${item.id} (${Math.round(base64.length / 1024)}KB)`);
    return imageUrl;
  } catch (err) {
    console.error(`[Image Gen] Failed for item ${item.id}:`, err);
    return null;
  }
}

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
    .where(isNull(schema.contentQueue.imageData))
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

    // Rate limit: small delay between requests
    await new Promise((r) => setTimeout(r, 2000));
  }

  return { generated, failed, skipped };
}
