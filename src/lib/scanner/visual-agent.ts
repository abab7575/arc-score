/**
 * Visual Agent — sends page screenshots to Claude's vision API and tests
 * whether a multimodal AI agent can visually parse and interact with the site.
 *
 * This models agents like Claude Computer Use and GPT-4o that navigate by
 * looking at screenshots rather than reading DOM or accessibility trees.
 */

import Anthropic from "@anthropic-ai/sdk";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import fs from "fs";
import path from "path";

puppeteer.use(StealthPlugin());

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Types ----

export interface VisualStep {
  stepNumber: number;
  action: string;
  description: string;
  result: "pass" | "partial" | "fail";
  narration: string;
  thought: string;
  screenshotPath?: string;
  duration: number;
  details?: Record<string, unknown>;
  visionResponse?: string;
}

export interface VisualAgentResult {
  steps: VisualStep[];
  overallResult: "pass" | "partial" | "fail";
  narrative: string;
  addToCartIdentified: boolean;
  priceIdentified: boolean;
  navigationClear: boolean;
  ctaDistinct: boolean;
  visualClutterScore: number; // 0-100, lower = more cluttered
  issuesFound: string[];
}

export interface VisualAgentOptions {
  screenshotDir?: string;
  screenshotUrlPrefix?: string;
}

// ---- Vision Analysis via Claude API ----

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable required for Visual Agent");
  }
  return new Anthropic({ apiKey });
}

async function analyzeScreenshot(
  client: Anthropic,
  screenshotPath: string,
  prompt: string
): Promise<string> {
  const imageData = fs.readFileSync(screenshotPath);
  const base64 = imageData.toString("base64");
  const mediaType = "image/png";

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64 },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock ? textBlock.text : "";
}

// ---- Main Agent ----

export async function runVisualAgent(
  siteUrl: string,
  productUrl?: string,
  options: VisualAgentOptions = {}
): Promise<VisualAgentResult> {
  const steps: VisualStep[] = [];
  let overallResult: "pass" | "partial" | "fail" = "pass";
  let addToCartIdentified = false;
  let priceIdentified = false;
  let navigationClear = false;
  let ctaDistinct = false;
  let visualClutterScore = 50;
  const issuesFound: string[] = [];

  const screenshotDir = options.screenshotDir || path.join(process.cwd(), "public", "screenshots", "visual-temp");
  const screenshotUrlPrefix = options.screenshotUrlPrefix || "/screenshots/visual-temp";

  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  let browser;
  let client: Anthropic;

  try {
    client = getAnthropicClient();
  } catch {
    console.warn("[Visual Agent] No API key — returning skip result");
    return {
      steps: [],
      overallResult: "partial",
      narrative: "Visual Agent skipped — ANTHROPIC_API_KEY not configured.",
      addToCartIdentified: false,
      priceIdentified: false,
      navigationClear: false,
      ctaDistinct: false,
      visualClutterScore: 50,
      issuesFound: ["ANTHROPIC_API_KEY not configured"],
    };
  }

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1440,900",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // ── Step 1: Homepage Visual Clarity ──────────────────────
    const step1Start = Date.now();
    console.log("[Visual Agent] Step 1: Analyzing homepage visual layout...");

    try {
      await page.goto(siteUrl, { waitUntil: "networkidle2", timeout: 30000 });
      await delay(2000); // Let lazy-loaded images render

      const homepageScreenshot = path.join(screenshotDir, "visual-01-homepage.png");
      await page.screenshot({ path: homepageScreenshot, fullPage: false });

      const homepageAnalysis = await analyzeScreenshot(
        client,
        homepageScreenshot,
        `You are evaluating this e-commerce homepage screenshot for AI agent navigability.

Answer these questions in a structured format:
1. NAVIGATION_CLEAR (yes/no): Is there a visible navigation menu with clear category links?
2. PRODUCT_LINKS_VISIBLE (yes/no): Can you see links or images that clearly lead to product pages?
3. SEARCH_BAR_VISIBLE (yes/no): Is there a visible search input?
4. VISUAL_CLUTTER (low/medium/high): How cluttered is the layout? Would an AI vision model easily identify interactive elements?
5. POPUPS_OVERLAYS (yes/no): Are there any popups, modals, or overlays obscuring the main content?
6. MAIN_CTA: What is the most prominent call-to-action on this page? Describe its location and text.
7. ISSUES: List any visual issues that would confuse an AI vision agent trying to navigate this page.

Be concise. One line per answer.`
      );

      navigationClear = /NAVIGATION_CLEAR.*yes/i.test(homepageAnalysis);
      const hasPopups = /POPUPS_OVERLAYS.*yes/i.test(homepageAnalysis);
      const clutterLevel = homepageAnalysis.match(/VISUAL_CLUTTER.*?(low|medium|high)/i)?.[1] || "medium";
      visualClutterScore = clutterLevel === "low" ? 85 : clutterLevel === "medium" ? 55 : 25;

      if (hasPopups) issuesFound.push("Popups or overlays obscure homepage content");
      if (!navigationClear) issuesFound.push("Navigation menu not visually clear");

      const step1Result = navigationClear && !hasPopups ? "pass" : navigationClear || !hasPopups ? "partial" : "fail";

      steps.push({
        stepNumber: 1,
        action: "Analyze homepage visual layout",
        description: "Can a vision model identify navigation, product links, and CTAs?",
        result: step1Result,
        narration: `Vision analysis of homepage: ${navigationClear ? "Navigation is clear." : "Navigation is unclear."} ${hasPopups ? "Popups detected." : "No popups."} Visual clutter: ${clutterLevel}.`,
        thought: navigationClear ? "Homepage layout is scannable by vision models." : "A vision model would struggle to parse this homepage.",
        screenshotPath: `${screenshotUrlPrefix}/visual-01-homepage.png`,
        duration: Date.now() - step1Start,
        visionResponse: homepageAnalysis,
      });
    } catch (e) {
      steps.push({
        stepNumber: 1,
        action: "Analyze homepage visual layout",
        description: "Can a vision model identify navigation, product links, and CTAs?",
        result: "fail",
        narration: `Failed to load homepage: ${(e as Error).message}`,
        thought: "Page didn't load. Vision agent can't analyze.",
        duration: Date.now() - step1Start,
      });
    }

    // ── Step 2: Product Page Visual Analysis ────────────────
    const step2Start = Date.now();
    console.log("[Visual Agent] Step 2: Analyzing product page...");

    const targetUrl = productUrl || siteUrl;
    if (productUrl && productUrl !== siteUrl) {
      try {
        await page.goto(productUrl, { waitUntil: "networkidle2", timeout: 30000 });
        await delay(2000);
      } catch {
        console.warn("[Visual Agent] Could not navigate to product URL, staying on current page.");
      }
    }

    try {
      const productScreenshot = path.join(screenshotDir, "visual-02-product.png");
      await page.screenshot({ path: productScreenshot, fullPage: false });

      const productAnalysis = await analyzeScreenshot(
        client,
        productScreenshot,
        `You are evaluating this e-commerce product page screenshot. An AI vision agent needs to identify key elements to complete a purchase.

Answer these questions:
1. PRODUCT_TITLE_VISIBLE (yes/no): Can you clearly see and read the product title?
2. PRICE_VISIBLE (yes/no): Is the price clearly displayed and readable?
3. PRICE_VALUE: What is the price shown? (write "unclear" if hard to read)
4. ADD_TO_CART_VISIBLE (yes/no): Is there a clearly visible "Add to Cart" or "Buy" button?
5. ADD_TO_CART_LOCATION: Where on the screen is the add-to-cart button? (e.g., "right side, below price")
6. ADD_TO_CART_DISTINCT (yes/no): Is the add-to-cart button visually distinct from other buttons? (different color, larger size, etc.)
7. SIZE_OPTIONS_VISIBLE (yes/no): Are product variants (size, color) visible and clearly selectable?
8. IMAGE_QUALITY (good/fair/poor): Is the product image clear and representative?
9. VISUAL_HIERARCHY: Does the page have clear visual hierarchy (title → price → options → CTA)?
10. ISSUES: List any visual issues that would prevent an AI vision agent from completing a purchase.

Be concise.`
      );

      priceIdentified = /PRICE_VISIBLE.*yes/i.test(productAnalysis);
      addToCartIdentified = /ADD_TO_CART_VISIBLE.*yes/i.test(productAnalysis);
      ctaDistinct = /ADD_TO_CART_DISTINCT.*yes/i.test(productAnalysis);
      const sizeVisible = /SIZE_OPTIONS_VISIBLE.*yes/i.test(productAnalysis);
      const goodHierarchy = /VISUAL_HIERARCHY.*clear/i.test(productAnalysis);

      if (!priceIdentified) issuesFound.push("Price not clearly visible to vision models");
      if (!addToCartIdentified) issuesFound.push("Add-to-cart button not identifiable by vision");
      if (!ctaDistinct) issuesFound.push("Add-to-cart button not visually distinct from other elements");
      if (!sizeVisible) issuesFound.push("Product variant selectors not clearly visible");

      let step2Score = 0;
      if (priceIdentified) step2Score++;
      if (addToCartIdentified) step2Score++;
      if (ctaDistinct) step2Score++;
      if (sizeVisible) step2Score++;
      if (goodHierarchy) step2Score++;

      const step2Result = step2Score >= 4 ? "pass" : step2Score >= 2 ? "partial" : "fail";

      steps.push({
        stepNumber: 2,
        action: "Analyze product page visual elements",
        description: "Can a vision model find title, price, variants, and add-to-cart?",
        result: step2Result,
        narration: `Product page vision scan: Price ${priceIdentified ? "visible" : "unclear"}. Add-to-cart ${addToCartIdentified ? "found" : "not found"}${ctaDistinct ? " and visually distinct" : ""}. Variants ${sizeVisible ? "visible" : "unclear"}.`,
        thought: addToCartIdentified && priceIdentified
          ? "Vision model can identify the key purchase elements."
          : "A vision agent would struggle to complete a purchase on this page.",
        screenshotPath: `${screenshotUrlPrefix}/visual-02-product.png`,
        duration: Date.now() - step2Start,
        visionResponse: productAnalysis,
        details: { priceIdentified, addToCartIdentified, ctaDistinct, sizeVisible, goodHierarchy },
      });
    } catch (e) {
      steps.push({
        stepNumber: 2,
        action: "Analyze product page visual elements",
        description: "Can a vision model find title, price, variants, and add-to-cart?",
        result: "fail",
        narration: `Product page analysis failed: ${(e as Error).message}`,
        thought: "Could not analyze product page visually.",
        duration: Date.now() - step2Start,
      });
    }

    // ── Step 3: CTA Identification Challenge ────────────────
    const step3Start = Date.now();
    console.log("[Visual Agent] Step 3: CTA identification challenge...");

    try {
      const ctaScreenshot = path.join(screenshotDir, "visual-03-cta.png");
      await page.screenshot({ path: ctaScreenshot, fullPage: false });

      const ctaAnalysis = await analyzeScreenshot(
        client,
        ctaScreenshot,
        `You are an AI shopping agent looking at this page. Your task is to add this product to cart.

Without reading any DOM or code, using ONLY what you can see in this screenshot:

1. CLICK_TARGET: Describe exactly where you would click to add this product to cart. Be specific (e.g., "the green button in the right column that says 'Add to Bag'").
2. CONFIDENCE (high/medium/low): How confident are you that clicking there would add the item to cart?
3. ALTERNATIVE_BUTTONS: Are there other buttons that look similar and could be confused with add-to-cart? List them.
4. REQUIRES_SELECTION (yes/no): Does it look like you need to select a size/color before you can add to cart?
5. SELECTION_METHOD: If yes, how would you select a variant? Describe the visual UI.
6. OBSTACLES: What visual obstacles would make it difficult for a vision-based AI to complete this purchase? (popups, small text, ambiguous buttons, etc.)

Think step by step like a real AI agent would.`
      );

      const confidence = ctaAnalysis.match(/CONFIDENCE.*?(high|medium|low)/i)?.[1] || "low";
      const hasAlternatives = /ALTERNATIVE_BUTTONS.*?(?:yes|there are|similar|could be confused)/i.test(ctaAnalysis);

      if (hasAlternatives) issuesFound.push("Multiple similar-looking buttons could confuse vision agents");

      const step3Result = confidence === "high" ? "pass" : confidence === "medium" ? "partial" : "fail";

      steps.push({
        stepNumber: 3,
        action: "CTA identification challenge",
        description: "Can a vision agent correctly identify the add-to-cart action?",
        result: step3Result,
        narration: `Vision agent confidence in identifying add-to-cart: ${confidence}. ${hasAlternatives ? "Alternative buttons present that could cause confusion." : "CTA is unambiguous."}`,
        thought: confidence === "high"
          ? "I can clearly see where to click. No ambiguity."
          : confidence === "medium"
            ? "I think I see the right button, but there are other options that look similar."
            : "I'm not sure which element to click to add to cart.",
        screenshotPath: `${screenshotUrlPrefix}/visual-03-cta.png`,
        duration: Date.now() - step3Start,
        visionResponse: ctaAnalysis,
        details: { confidence, hasAlternatives },
      });
    } catch (e) {
      steps.push({
        stepNumber: 3,
        action: "CTA identification challenge",
        description: "Can a vision agent correctly identify the add-to-cart action?",
        result: "fail",
        narration: `CTA analysis failed: ${(e as Error).message}`,
        thought: "Could not analyze CTAs.",
        duration: Date.now() - step3Start,
      });
    }

    // ── Step 4: Mobile Viewport Test ────────────────────────
    const step4Start = Date.now();
    console.log("[Visual Agent] Step 4: Mobile viewport analysis...");

    try {
      await page.setViewport({ width: 390, height: 844 }); // iPhone 14 Pro
      await delay(1500);

      const mobileScreenshot = path.join(screenshotDir, "visual-04-mobile.png");
      await page.screenshot({ path: mobileScreenshot, fullPage: false });

      const mobileAnalysis = await analyzeScreenshot(
        client,
        mobileScreenshot,
        `This is a mobile viewport (iPhone-sized) screenshot of an e-commerce product page.

1. ADD_TO_CART_VISIBLE (yes/no): Is the add-to-cart button visible without scrolling?
2. PRICE_VISIBLE (yes/no): Is the price visible without scrolling?
3. CONTENT_READABLE (yes/no): Is the text large enough to read?
4. LAYOUT_INTACT (yes/no): Does the layout work correctly at this size? (no overlapping elements, no horizontal scroll)
5. STICKY_CTA (yes/no): Is there a sticky/fixed add-to-cart button visible?
6. ISSUES: Any mobile-specific issues for AI vision agents?

Be concise.`
      );

      const mobileAtcVisible = /ADD_TO_CART_VISIBLE.*yes/i.test(mobileAnalysis);
      const mobilePriceVisible = /PRICE_VISIBLE.*yes/i.test(mobileAnalysis);
      const layoutIntact = /LAYOUT_INTACT.*yes/i.test(mobileAnalysis);

      if (!mobileAtcVisible) issuesFound.push("Add-to-cart not visible on mobile viewport without scrolling");
      if (!layoutIntact) issuesFound.push("Mobile layout has visual issues");

      let mobileScore = 0;
      if (mobileAtcVisible) mobileScore++;
      if (mobilePriceVisible) mobileScore++;
      if (layoutIntact) mobileScore++;

      const step4Result = mobileScore >= 3 ? "pass" : mobileScore >= 2 ? "partial" : "fail";

      steps.push({
        stepNumber: 4,
        action: "Mobile viewport visual test",
        description: "Can a vision agent navigate the site at mobile dimensions?",
        result: step4Result,
        narration: `Mobile view: Add-to-cart ${mobileAtcVisible ? "visible" : "hidden"}. Price ${mobilePriceVisible ? "visible" : "hidden"}. Layout ${layoutIntact ? "intact" : "broken"}.`,
        thought: mobileAtcVisible
          ? "Mobile layout works for vision agents."
          : "On mobile, key purchase elements are hidden or broken.",
        screenshotPath: `${screenshotUrlPrefix}/visual-04-mobile.png`,
        duration: Date.now() - step4Start,
        visionResponse: mobileAnalysis,
        details: { mobileAtcVisible, mobilePriceVisible, layoutIntact },
      });

      // Reset viewport
      await page.setViewport({ width: 1440, height: 900 });
    } catch (e) {
      steps.push({
        stepNumber: 4,
        action: "Mobile viewport visual test",
        description: "Can a vision agent navigate the site at mobile dimensions?",
        result: "fail",
        narration: `Mobile analysis failed: ${(e as Error).message}`,
        thought: "Could not test mobile viewport.",
        duration: Date.now() - step4Start,
      });
    }

    // ── Calculate overall result ────────────────────────────
    const failCount = steps.filter((s) => s.result === "fail").length;
    const partialCount = steps.filter((s) => s.result === "partial").length;
    if (failCount >= 2) overallResult = "fail";
    else if (failCount === 1 || partialCount >= 2) overallResult = "partial";
    else overallResult = "pass";

    const narrative = steps.map((s) => s.narration).join(" ");

    return {
      steps,
      overallResult,
      narrative,
      addToCartIdentified,
      priceIdentified,
      navigationClear,
      ctaDistinct,
      visualClutterScore,
      issuesFound,
    };
  } catch (e) {
    console.error("[Visual Agent] Fatal error:", e);
    return {
      steps,
      overallResult: "fail",
      narrative: `Visual Agent encountered a fatal error: ${(e as Error).message}`,
      addToCartIdentified: false,
      priceIdentified: false,
      navigationClear: false,
      ctaDistinct: false,
      visualClutterScore: 0,
      issuesFound: [(e as Error).message],
    };
  } finally {
    if (browser) await browser.close();
  }
}
