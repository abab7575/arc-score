/**
 * Browser Agent — uses Puppeteer to navigate the site like a personal AI agent.
 * Takes annotated screenshots showing WHERE the agent clicks and WHAT it sees.
 */

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { type Browser, type Page } from "puppeteer";
import path from "path";
import fs from "fs";

puppeteer.use(StealthPlugin());

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface HumanAgentGap {
  what: string;       // What a human can see
  why: string;        // Why the agent can't interact with it
  recommendation: string; // How to fix it
}

export interface BrowserStep {
  stepNumber: number;
  action: string;
  description: string;
  result: "pass" | "partial" | "fail";
  narration: string;
  thought: string;
  screenshotPath?: string;
  cursorTarget?: { x: number; y: number };
  duration: number;
  details?: Record<string, unknown>;
  humanAgentGaps?: HumanAgentGap[];
}

export interface BrowserAgentResult {
  steps: BrowserStep[];
  overallResult: "pass" | "partial" | "fail";
  narrative: string;
  pagesLoaded: number;
  totalDuration: number;
  blockedByBot: boolean;
  captchaDetected: boolean;
  cookieConsentFound: boolean;
  addToCartSuccess: boolean;
  checkoutReached: boolean;
  guestCheckoutAvailable: boolean;
  /** Rendered product page HTML for data agent schema detection */
  renderedProductHtml?: string;
}

export interface BrowserAgentOptions {
  screenshotDir?: string;
  screenshotUrlPrefix?: string;
}

const DEFAULT_SCREENSHOT_DIR = path.join(process.cwd(), "public", "screenshots", "nike");
const DEFAULT_URL_PREFIX = "/screenshots/nike";

// ─── Visual Annotation Helpers ───

/**
 * Inject a visual overlay onto the page showing:
 * - Step number + action label at the top
 * - Result badge (pass/partial/fail)
 * - Optional cursor indicator at a click target
 * - Optional highlight ring around a target element
 */
async function injectOverlay(
  page: Page,
  opts: {
    step: number;
    label: string;
    result: "pass" | "partial" | "fail" | "active";
    cursorX?: number;
    cursorY?: number;
    highlightSelector?: string;
    annotation?: string; // extra text to show below cursor
  }
) {
  const resultColors = {
    pass: { bg: "#059669", text: "PASS" },
    partial: { bg: "#d97706", text: "PARTIAL" },
    fail: { bg: "#dc2626", text: "FAIL" },
    active: { bg: "#4f46e5", text: "SCANNING" },
  };
  const rc = resultColors[opts.result];

  await page.evaluate(
    (step, label, rcBg, rcText, cursorX, cursorY, highlightSel, annotation) => {
      // Remove any previous overlay
      document.querySelectorAll("[data-arc-overlay]").forEach((el) => el.remove());

      // Step banner at top
      const banner = document.createElement("div");
      banner.setAttribute("data-arc-overlay", "banner");
      Object.assign(banner.style, {
        position: "fixed",
        top: "0",
        left: "0",
        right: "0",
        height: "36px",
        background: "rgba(15, 23, 42, 0.92)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "10px",
        zIndex: "999999",
        fontFamily: "system-ui, -apple-system, sans-serif",
      });

      // Step number circle
      const stepBadge = document.createElement("span");
      Object.assign(stepBadge.style, {
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: "#4f46e5",
        color: "white",
        fontSize: "11px",
        fontWeight: "700",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
      });
      stepBadge.textContent = String(step);
      banner.appendChild(stepBadge);

      // Label
      const labelEl = document.createElement("span");
      Object.assign(labelEl.style, {
        color: "white",
        fontSize: "13px",
        fontWeight: "500",
        flex: "1",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      });
      labelEl.textContent = label;
      banner.appendChild(labelEl);

      // Result badge
      const resultBadge = document.createElement("span");
      Object.assign(resultBadge.style, {
        padding: "2px 10px",
        borderRadius: "10px",
        background: rcBg,
        color: "white",
        fontSize: "10px",
        fontWeight: "700",
        letterSpacing: "0.05em",
        flexShrink: "0",
      });
      resultBadge.textContent = rcText;
      banner.appendChild(resultBadge);

      document.body.appendChild(banner);

      // Highlight a target element with a glowing ring
      if (highlightSel) {
        try {
          const target = document.querySelector(highlightSel);
          if (target) {
            const rect = target.getBoundingClientRect();
            const ring = document.createElement("div");
            ring.setAttribute("data-arc-overlay", "ring");
            Object.assign(ring.style, {
              position: "fixed",
              left: `${rect.left - 4}px`,
              top: `${rect.top - 4}px`,
              width: `${rect.width + 8}px`,
              height: `${rect.height + 8}px`,
              border: "3px solid #4f46e5",
              borderRadius: "6px",
              boxShadow: "0 0 12px rgba(79, 70, 229, 0.5), 0 0 4px rgba(79, 70, 229, 0.3)",
              pointerEvents: "none",
              zIndex: "999998",
            });
            document.body.appendChild(ring);
          }
        } catch {
          // selector might not work
        }
      }

      // Cursor indicator at click target
      if (cursorX !== undefined && cursorY !== undefined && cursorX > 0) {
        // Outer pulse ring
        const pulse = document.createElement("div");
        pulse.setAttribute("data-arc-overlay", "pulse");
        Object.assign(pulse.style, {
          position: "fixed",
          left: `${cursorX - 20}px`,
          top: `${cursorY - 20}px`,
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          border: "2px solid rgba(239, 68, 68, 0.4)",
          background: "rgba(239, 68, 68, 0.08)",
          pointerEvents: "none",
          zIndex: "999998",
        });
        document.body.appendChild(pulse);

        // Cursor crosshair
        const cursor = document.createElement("div");
        cursor.setAttribute("data-arc-overlay", "cursor");
        Object.assign(cursor.style, {
          position: "fixed",
          left: `${cursorX - 10}px`,
          top: `${cursorY - 10}px`,
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.85)",
          border: "2px solid white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          pointerEvents: "none",
          zIndex: "999999",
        });
        document.body.appendChild(cursor);

        // Cross lines through cursor
        const crossV = document.createElement("div");
        crossV.setAttribute("data-arc-overlay", "crossV");
        Object.assign(crossV.style, {
          position: "fixed",
          left: `${cursorX - 1}px`,
          top: `${cursorY - 16}px`,
          width: "2px",
          height: "32px",
          background: "rgba(239, 68, 68, 0.5)",
          pointerEvents: "none",
          zIndex: "999997",
        });
        document.body.appendChild(crossV);

        const crossH = document.createElement("div");
        crossH.setAttribute("data-arc-overlay", "crossH");
        Object.assign(crossH.style, {
          position: "fixed",
          left: `${cursorX - 16}px`,
          top: `${cursorY - 1}px`,
          width: "32px",
          height: "2px",
          background: "rgba(239, 68, 68, 0.5)",
          pointerEvents: "none",
          zIndex: "999997",
        });
        document.body.appendChild(crossH);

        // Annotation label near cursor
        if (annotation) {
          const label = document.createElement("div");
          label.setAttribute("data-arc-overlay", "annotation");
          Object.assign(label.style, {
            position: "fixed",
            left: `${cursorX + 18}px`,
            top: `${cursorY - 10}px`,
            padding: "3px 8px",
            borderRadius: "4px",
            background: "rgba(15, 23, 42, 0.88)",
            color: "white",
            fontSize: "11px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: "500",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: "999999",
          });
          label.textContent = annotation;
          document.body.appendChild(label);
        }
      }
    },
    opts.step,
    opts.label,
    rc.bg,
    rc.text,
    opts.cursorX ?? 0,
    opts.cursorY ?? 0,
    opts.highlightSelector ?? null,
    opts.annotation ?? null
  );
}

async function removeOverlay(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll("[data-arc-overlay]").forEach((el) => el.remove());
  });
}

// ─── Screenshot Helper ───

function makeScreenshotter(dir: string, urlPrefix: string) {
  fs.mkdirSync(dir, { recursive: true });
  return async (page: Page, name: string): Promise<string> => {
    const filename = `${name}.png`;
    const filepath = path.join(dir, filename);
    await page.screenshot({ path: filepath, fullPage: false });
    // Clean up overlay after screenshot
    await removeOverlay(page);
    return `${urlPrefix}/${filename}`;
  };
}

async function measureStep(
  fn: () => Promise<Partial<BrowserStep>>,
  timeoutMs = 30000
): Promise<BrowserStep & { duration: number }> {
  const start = Date.now();
  try {
    const result = await Promise.race([
      fn(),
      new Promise<Partial<BrowserStep>>((_, reject) =>
        setTimeout(() => reject(new Error("Step timed out")), timeoutMs)
      ),
    ]);
    const duration = Date.now() - start;
    return { ...result, duration } as BrowserStep;
  } catch (e) {
    const duration = Date.now() - start;
    return {
      stepNumber: 0,
      action: "Unknown",
      description: "Step timed out or errored",
      result: "fail",
      narration: `This step failed: ${(e as Error).message}`,
      thought: "Step failed.",
      duration,
    } as BrowserStep;
  }
}

function detectCookieConsent(html: string): boolean {
  const patterns = [
    "cookie-consent", "cookie-banner", "cookieconsent", "onetrust", "OneTrust",
    "cookie-policy", "gdpr", "CookieConsent", "cookie_notice", "accept-cookies",
    "cookie-notice", "cc-banner",
  ];
  return patterns.some((p) => html.toLowerCase().includes(p.toLowerCase()));
}

function detectBotBlocking(html: string): boolean {
  const lower = html.toLowerCase();
  // Only detect true blocking: the page body is essentially JUST a challenge
  // A normal e-commerce page has nav, products, etc. alongside any challenge scripts
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

  // If body text is very short AND contains blocking indicators, it's a true block page
  const isShortBody = bodyText.length < 500;
  const blockingPhrases = [
    "access denied", "you have been blocked", "are you a robot",
    "verify you are human", "please verify", "checking your browser",
    "just a moment", "enable javascript and cookies",
  ];
  const hasBlockingPhrase = blockingPhrases.some((p) => bodyText.toLowerCase().includes(p));

  // Cloudflare/DataDome challenge pages have very little real content
  if (isShortBody && hasBlockingPhrase) return true;

  // Explicit challenge-only pages (no nav, no products, just a challenge)
  if (lower.includes("cf-browser-verification") && !lower.includes("<nav")) return true;

  return false;
}

// ─── Main Agent ───

export async function runBrowserAgent(
  url: string,
  productUrl?: string,
  options?: BrowserAgentOptions
): Promise<BrowserAgentResult> {
  const screenshotDir = options?.screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
  const screenshotUrlPrefix = options?.screenshotUrlPrefix ?? DEFAULT_URL_PREFIX;
  const takeScreenshot = makeScreenshotter(screenshotDir, screenshotUrlPrefix);
  const baseUrl = url.startsWith("http") ? url : `https://${url}`;
  const steps: BrowserStep[] = [];
  let browser: Browser | null = null;
  let overallResult: "pass" | "partial" | "fail" = "pass";
  let blockedByBot = false;
  let captchaDetected = false;
  let cookieConsentFound = false;
  let addToCartSuccess = false;
  let checkoutReached = false;
  let guestCheckoutAvailable = false;
  let renderedProductHtml: string | undefined;
  let pagesLoaded = 0;

  try {
    console.log("[Browser Agent] Launching browser...");
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

    // ── Step 1: Navigate to homepage ──
    console.log("[Browser Agent] Step 1: Navigate to homepage...");
    const step1 = await measureStep(async () => {
      try {
        const response = await page.goto(baseUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
        await delay(2000); // let page render
        pagesLoaded++;

        const html = await page.content();
        const status = response?.status() || 0;

        if (detectBotBlocking(html)) {
          blockedByBot = true;
          await injectOverlay(page, { step: 1, label: `Navigate to ${url} — BLOCKED by bot detection`, result: "fail" });
          const screenshot = await takeScreenshot(page, "01-homepage");
          return {
            stepNumber: 1,
            action: "Navigate to homepage",
            description: `Loading ${url}`,
            result: "fail" as const,
            narration: `I tried to navigate to ${url} but was blocked by bot detection. The site returned a challenge page instead of the homepage.`,
            thought: "Bot detection triggered. I'm blocked.",
            screenshotPath: screenshot,
          };
        }

        const title = await page.title();
        const resultVal = status >= 200 && status < 400 ? "pass" : "fail";
        await injectOverlay(page, { step: 1, label: `Homepage loaded — "${title}"`, result: resultVal as "pass" | "fail" });
        const screenshot = await takeScreenshot(page, "01-homepage");

        return {
          stepNumber: 1,
          action: "Navigate to homepage",
          description: `Loading ${url}`,
          result: resultVal as "pass" | "fail",
          narration: `I navigated to ${url}. The page loaded with status ${status}. Page title: "${title}". ${html.length > 100000 ? "The page is quite large (" + Math.round(html.length / 1024) + "KB of HTML)." : ""}`,
          thought: `Page loaded. Title: "${title}". Let me look around.`,
          screenshotPath: screenshot,
        };
      } catch (e) {
        return {
          stepNumber: 1,
          action: "Navigate to homepage",
          description: `Loading ${url}`,
          result: "fail" as const,
          narration: `Failed to load ${url}: ${(e as Error).message}`,
          thought: "Page failed to load.",
        };
      }
    });
    steps.push(step1);

    if (blockedByBot) {
      overallResult = "fail";
      return buildResult();
    }

    // ── Step 2: Check for cookie consent ──
    console.log("[Browser Agent] Step 2: Check cookie consent...");
    const step2 = await measureStep(async () => {
      const html = await page.content();
      cookieConsentFound = detectCookieConsent(html);

      if (cookieConsentFound) {
        // Find the button position before clicking
        const btnInfo = await page.evaluate(() => {
          const onetrust = document.getElementById("onetrust-accept-btn-handler");
          if (onetrust) {
            const rect = onetrust.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: onetrust.textContent?.trim() || "Accept" };
          }
          const byId = document.querySelector("#accept-cookies, #acceptCookies, #cookie-accept") as HTMLElement;
          if (byId) {
            const rect = byId.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: byId.textContent?.trim() || "Accept" };
          }
          const buttons = document.querySelectorAll("button");
          for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || "";
            if ((text.includes("accept") || text.includes("agree")) && btn.offsetParent !== null) {
              const rect = btn.getBoundingClientRect();
              return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: btn.textContent?.trim() || "Accept" };
            }
          }
          return null;
        });

        // Show the overlay BEFORE clicking - annotate where we're about to click
        if (btnInfo) {
          await injectOverlay(page, {
            step: 2,
            label: `Cookie consent detected — clicking "${btnInfo.text}"`,
            result: "active",
            cursorX: btnInfo.x,
            cursorY: btnInfo.y,
            annotation: `Clicking: "${btnInfo.text}"`,
          });
          const preScreenshot = await takeScreenshot(page, "02a-cookie-before");
        }

        // Now actually click
        const dismissed = await page.evaluate(() => {
          const onetrust = document.getElementById("onetrust-accept-btn-handler");
          if (onetrust) { onetrust.click(); return true; }
          const byId = document.querySelector("#accept-cookies, #acceptCookies, #cookie-accept");
          if (byId) { (byId as HTMLElement).click(); return true; }
          const buttons = document.querySelectorAll("button");
          for (const btn of buttons) {
            const text = btn.textContent?.toLowerCase() || "";
            if ((text.includes("accept") || text.includes("agree")) && btn.offsetParent !== null) {
              btn.click();
              return true;
            }
          }
          return false;
        });

        if (dismissed) await delay(1500);
        await injectOverlay(page, {
          step: 2,
          label: dismissed ? "Cookie consent dismissed" : "Cookie consent — could not dismiss",
          result: dismissed ? "pass" : "partial",
        });
        const screenshot = await takeScreenshot(page, "02-cookie-consent");

        return {
          stepNumber: 2,
          action: "Handle cookie consent",
          description: "Cookie consent banner detected",
          result: (dismissed ? "pass" : "partial") as "pass" | "partial",
          narration: dismissed
            ? "A cookie consent banner appeared. I found and clicked the accept button to dismiss it."
            : "A cookie consent banner appeared but I couldn't find a clear dismiss button. It may be blocking some interactions.",
          thought: dismissed ? "Cookie consent dismissed. Moving on." : "Cookie consent is present but I can't dismiss it easily.",
          screenshotPath: screenshot,
          cursorTarget: btnInfo ? { x: btnInfo.x, y: btnInfo.y } : undefined,
        };
      }

      await injectOverlay(page, { step: 2, label: "No cookie consent banner detected", result: "pass" });
      const screenshot = await takeScreenshot(page, "02-cookie-consent");
      return {
        stepNumber: 2,
        action: "Handle cookie consent",
        description: "No cookie consent detected",
        result: "pass" as const,
        narration: "No cookie consent banner detected on the homepage. The page is fully interactive without any overlays.",
        thought: "No cookie banner. Good, no friction.",
        screenshotPath: screenshot,
      };
    });
    steps.push(step2);

    // ── Step 3: Find product navigation ──
    console.log("[Browser Agent] Step 3: Explore navigation...");
    const step3 = await measureStep(async () => {
      const navInfo = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll("nav a, header a"));
        const mapped = links.slice(0, 20).map((a) => {
          const el = a as HTMLAnchorElement;
          const rect = el.getBoundingClientRect();
          return {
            text: a.textContent?.trim() || "",
            href: el.href || "",
            visible: el.offsetParent !== null,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          };
        });
        return mapped;
      });

      const searchInput = await page.$(
        'input[type="search"], input[name*="search" i], input[placeholder*="search" i], input[aria-label*="search" i]'
      );

      const visibleLinks = navInfo.filter((l) => l.visible && l.text.length > 0);

      // Highlight the nav area
      await injectOverlay(page, {
        step: 3,
        label: `Found ${visibleLinks.length} nav links: ${visibleLinks.slice(0, 4).map((l) => `"${l.text}"`).join(", ")}...`,
        result: visibleLinks.length > 3 ? "pass" : "partial",
        highlightSelector: "nav, header nav, [role='navigation']",
      });
      const screenshot = await takeScreenshot(page, "03-navigation");

      return {
        stepNumber: 3,
        action: "Explore navigation",
        description: "Analyzing site navigation and search",
        result: (visibleLinks.length > 3 ? "pass" : "partial") as "pass" | "partial",
        narration: `I found ${visibleLinks.length} navigation links in the header. ${searchInput ? "A search input is available." : "No search input was immediately visible."} Top nav links: ${visibleLinks.slice(0, 5).map((l) => `"${l.text}"`).join(", ")}.`,
        thought: `${visibleLinks.length} nav links found. ${searchInput ? "Search is available." : "No search found."} Let me try to find products.`,
        screenshotPath: screenshot,
        details: {
          navLinks: visibleLinks.slice(0, 10).map((l) => ({ text: l.text, href: l.href })),
          hasSearch: !!searchInput,
        },
      };
    });
    steps.push(step3);

    // ── Step 4: Navigate to a product ──
    console.log("[Browser Agent] Step 4: Find a product...");
    const step4 = await measureStep(async () => {
      let navigatedToProduct = false;
      let clickTarget: { x: number; y: number } | undefined;

      if (productUrl) {
        try {
          await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
          await delay(2000);
          pagesLoaded++;
          navigatedToProduct = true;
        } catch { /* fallback */ }
      }

      if (!navigatedToProduct) {
        // Find a product link and get its position
        const productLink = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll("a"));
          for (const link of links) {
            const href = link.href;
            if (
              href &&
              (href.includes("/product") || href.includes("/p/") || href.includes("/pd/") ||
                href.includes("/t/") || href.includes("/dp/") || href.includes("/shop/")) &&
              !href.includes("category") && !href.includes("collection") &&
              (link as HTMLElement).offsetParent !== null
            ) {
              const rect = link.getBoundingClientRect();
              return { href, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: link.textContent?.trim()?.substring(0, 60) || "" };
            }
          }
          for (const link of links) {
            const parent = link.closest("article, [class*='card'], [class*='product'], [class*='tile']");
            if (parent && link.href && link.href !== window.location.href && (link as HTMLElement).offsetParent !== null) {
              const rect = link.getBoundingClientRect();
              return { href: link.href, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: link.textContent?.trim()?.substring(0, 60) || "" };
            }
          }
          return null;
        });

        if (productLink) {
          // Show where we're about to click
          clickTarget = { x: productLink.x, y: productLink.y };
          await injectOverlay(page, {
            step: 4,
            label: `Found product link — clicking "${productLink.text || 'product'}"`,
            result: "active",
            cursorX: productLink.x,
            cursorY: productLink.y,
            annotation: `Navigating to product`,
          });
          await takeScreenshot(page, "04a-clicking-product");

          try {
            await page.goto(productLink.href, { waitUntil: "domcontentloaded", timeout: 20000 });
            await delay(2000);
            pagesLoaded++;
            navigatedToProduct = true;
          } catch { /* continue */ }
        }
      }

      const currentUrl = page.url();
      const resultVal = navigatedToProduct ? "pass" : "fail";
      await injectOverlay(page, {
        step: 4,
        label: navigatedToProduct ? `Product page: ${currentUrl.substring(0, 80)}` : "Could not find a product page",
        result: resultVal,
      });
      const screenshot = await takeScreenshot(page, "04-product-page");

      if (navigatedToProduct) {
        return {
          stepNumber: 4,
          action: "Navigate to product page",
          description: `Navigated to ${currentUrl}`,
          result: "pass" as const,
          narration: `I found and navigated to a product page at ${currentUrl}.`,
          thought: "Found a product page. Let me analyze it.",
          screenshotPath: screenshot,
          cursorTarget: clickTarget,
        };
      }

      return {
        stepNumber: 4,
        action: "Navigate to product page",
        description: "Could not find a product page link",
        result: "fail" as const,
        narration: "I couldn't find a direct link to a product page from the homepage.",
        thought: "Can't find product links. The site may be too JS-heavy.",
        screenshotPath: screenshot,
      };
    });
    steps.push(step4);

    if (step4.result === "fail") {
      overallResult = "fail";
      return buildResult();
    }

    // ── Step 5: Analyze product page ──
    console.log("[Browser Agent] Step 5: Analyze product page...");
    const step5 = await measureStep(async () => {
      const productInfo = await page.evaluate(() => {
        const title = document.querySelector("h1")?.textContent?.trim() || "";

        const priceSelectors = ['[class*="price" i]', '[data-test*="price" i]', '[itemprop="price"]', '[class*="Price"]'];
        let price = "";
        let priceRect = { x: 0, y: 0 };
        for (const sel of priceSelectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent) {
            const match = el.textContent.match(/[\$\£\€][\d,.]+/);
            if (match) {
              price = match[0];
              const rect = (el as HTMLElement).getBoundingClientRect();
              priceRect = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
              break;
            }
          }
        }

        // Find add-to-cart button + position
        const cartSelectors = [
          'button[class*="add-to-cart" i]', 'button[class*="addtocart" i]', 'button[class*="add-to-bag" i]',
          'button[data-test*="add" i]', 'button[aria-label*="add to" i]', '[class*="add-to-cart" i]', '[class*="addToCart" i]',
        ];
        let cartButton: Element | null = null;
        let cartRect = { x: 0, y: 0 };
        for (const sel of cartSelectors) {
          cartButton = document.querySelector(sel);
          if (cartButton) {
            const rect = (cartButton as HTMLElement).getBoundingClientRect();
            cartRect = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            break;
          }
        }
        if (!cartButton) {
          const allButtons = document.querySelectorAll("button");
          for (const btn of allButtons) {
            if (btn.textContent && /add to (cart|bag|basket)/i.test(btn.textContent)) {
              cartButton = btn;
              const rect = (btn as HTMLElement).getBoundingClientRect();
              cartRect = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
              break;
            }
          }
        }

        // Agent-accessible selectors
        const sizeSelectors = document.querySelectorAll('select[name*="size" i], [class*="size" i] button, [class*="variant" i] button, [data-test*="size" i]');
        const images = document.querySelectorAll('img[class*="product" i], img[class*="gallery" i], [class*="product"] img');

        // ── Gap Detection: look for visible elements a human can see but agent can't programmatically find ──
        const allVisibleImages = document.querySelectorAll("img");
        const viewportImages = Array.from(allVisibleImages).filter((img) => {
          const rect = img.getBoundingClientRect();
          return rect.width > 100 && rect.height > 100 && rect.top < 1200;
        });

        // Look for any text containing price-like patterns in viewport
        const bodyText = document.body.innerText;
        const priceMatches = bodyText.match(/[\$\£\€]\s?[\d,.]+/g) || [];

        // Look for any visible clickable elements that might be size selectors
        const allButtons = document.querySelectorAll("button, [role='button'], [role='option'], input[type='radio']");
        const potentialSizeButtons = Array.from(allButtons).filter((el) => {
          const text = el.textContent?.trim() || "";
          const isVisible = (el as HTMLElement).offsetParent !== null;
          const rect = (el as HTMLElement).getBoundingClientRect();
          return isVisible && rect.width > 20 && rect.width < 100 && (
            /^(XS|S|M|L|XL|XXL|\d{1,2}(\.\d)?|one size)$/i.test(text)
          );
        });

        // Look for carousel / gallery controls
        const galleryControls = document.querySelectorAll(
          '[class*="carousel" i], [class*="gallery" i], [class*="slider" i], [class*="swiper" i], [aria-label*="next" i], [aria-label*="previous" i]'
        );

        return {
          title,
          price,
          priceRect,
          hasCartButton: !!cartButton,
          cartButtonText: cartButton?.textContent?.trim() || "",
          cartRect,
          sizeOptions: sizeSelectors.length,
          imageCount: images.length,
          descriptionLength: document.querySelector('[class*="description" i]')?.textContent?.length || 0,
          // Gap data
          totalVisibleImages: viewportImages.length,
          visiblePriceCount: priceMatches.length,
          potentialSizeButtonCount: potentialSizeButtons.length,
          potentialSizeLabels: potentialSizeButtons.slice(0, 8).map((b) => b.textContent?.trim() || ""),
          hasGalleryControls: galleryControls.length > 0,
        };
      });

      // ── Build human-agent gap insights ──
      const gaps: HumanAgentGap[] = [];

      if (productInfo.imageCount === 0 && productInfo.totalVisibleImages > 0) {
        gaps.push({
          what: `A human can see ${productInfo.totalVisibleImages} product image${productInfo.totalVisibleImages > 1 ? "s" : ""} on this page${productInfo.hasGalleryControls ? ", including a swipeable gallery" : ""}.`,
          why: "The images don't use standard product image classes or semantic markup (like itemprop=\"image\"), so the agent can't identify them as product photos.",
          recommendation: "Add class names containing 'product' to image containers, or use Schema.org Product markup with image properties.",
        });
      }

      if (!productInfo.price && productInfo.visiblePriceCount > 0) {
        gaps.push({
          what: `A human can see ${productInfo.visiblePriceCount > 1 ? "prices" : "a price"} displayed on this page.`,
          why: "The price element doesn't use recognizable selectors like class=\"price\" or itemprop=\"price\", so the agent can't extract the value.",
          recommendation: "Use a class containing 'price' on the price element, or add Schema.org Product/Offer markup.",
        });
      }

      if (productInfo.sizeOptions === 0 && productInfo.potentialSizeButtonCount > 0) {
        gaps.push({
          what: `A human can see ${productInfo.potentialSizeButtonCount} size option${productInfo.potentialSizeButtonCount > 1 ? "s" : ""} (${productInfo.potentialSizeLabels.join(", ")}) clearly displayed on this page.`,
          why: "The size buttons don't use recognizable selectors like class=\"size\" or data-test=\"size\". They may be custom components without standard accessibility attributes.",
          recommendation: "Add class names containing 'size' or 'variant' to size selector containers, or use aria-label attributes on the buttons.",
        });
      }

      // Annotate — show price and cart button locations
      await injectOverlay(page, {
        step: 5,
        label: `"${productInfo.title}" — ${productInfo.price || "price not found"} — ${productInfo.hasCartButton ? "Cart button found" : "No cart button"}`,
        result: productInfo.title && productInfo.price ? "pass" : "partial",
        cursorX: productInfo.hasCartButton ? productInfo.cartRect.x : productInfo.priceRect.x,
        cursorY: productInfo.hasCartButton ? productInfo.cartRect.y : productInfo.priceRect.y,
        annotation: productInfo.hasCartButton ? `"${productInfo.cartButtonText}"` : (productInfo.price || "Looking for price..."),
      });
      const screenshot = await takeScreenshot(page, "05-product-details");

      return {
        stepNumber: 5,
        action: "Analyze product page",
        description: "Extracting product information",
        result: (productInfo.title && productInfo.price ? "pass" : "partial") as "pass" | "partial",
        narration: `Product page analysis: Title: "${productInfo.title}". Price: ${productInfo.price || "not found"}. ${productInfo.sizeOptions} size/variant options found. ${productInfo.imageCount} product images. ${productInfo.hasCartButton ? `Add-to-cart button found: "${productInfo.cartButtonText}".` : "No clear add-to-cart button found."}`,
        thought: `Product: "${productInfo.title}" at ${productInfo.price}. ${productInfo.hasCartButton ? "Cart button found." : "No cart button."} ${productInfo.sizeOptions} variants.`,
        screenshotPath: screenshot,
        cursorTarget: productInfo.hasCartButton ? productInfo.cartRect : undefined,
        details: productInfo,
        humanAgentGaps: gaps.length > 0 ? gaps : undefined,
      };
    });
    steps.push(step5);

    // Capture rendered product page HTML for data agent (catches JS-injected schema)
    try {
      renderedProductHtml = await page.content();
      console.log(`[Browser Agent] Captured rendered product HTML (${Math.round((renderedProductHtml?.length ?? 0) / 1024)}KB)`);
    } catch {
      console.warn("[Browser Agent] Could not capture rendered HTML");
    }

    // ── Step 6: Select variant ──
    console.log("[Browser Agent] Step 6: Select variant...");
    const step6 = await measureStep(async () => {
      let variantSelected = false;
      let clickPos: { x: number; y: number } | undefined;

      const sizeButton = await page.evaluate(() => {
        const buttons = document.querySelectorAll(
          '[class*="size" i] button, [data-test*="size" i] button, [class*="variant" i] button, [class*="swatch" i] button'
        );
        for (const btn of buttons) {
          const el = btn as HTMLElement;
          if (el.offsetParent !== null && !el.classList.toString().toLowerCase().includes("disabled") && !el.hasAttribute("disabled")) {
            const rect = el.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: el.textContent?.trim() || "" };
          }
        }
        return null;
      });

      if (sizeButton) {
        clickPos = { x: sizeButton.x, y: sizeButton.y };
        // Show where we're clicking
        await injectOverlay(page, {
          step: 6,
          label: `Selecting size/variant: "${sizeButton.text}"`,
          result: "active",
          cursorX: sizeButton.x,
          cursorY: sizeButton.y,
          annotation: `Selecting: "${sizeButton.text}"`,
        });
        await takeScreenshot(page, "06a-selecting-variant");

        try {
          await page.mouse.click(sizeButton.x, sizeButton.y);
          await delay(800);
          variantSelected = true;
        } catch { /* continue */ }
      }

      if (!variantSelected) {
        const selectEl = await page.$('select[name*="size" i]');
        if (selectEl) {
          try {
            const options = await page.evaluate((sel) => {
              const select = sel as HTMLSelectElement;
              return Array.from(select.options).map((o) => o.value);
            }, selectEl);
            if (options.length > 1) {
              await selectEl.select(options[1]);
              variantSelected = true;
            }
          } catch { /* continue */ }
        }
      }

      // ── Gap Detection for variant step ──
      const variantGaps: HumanAgentGap[] = [];
      if (!variantSelected) {
        const visibleVariantInfo = await page.evaluate(() => {
          // Look for any visible buttons that look like size/variant selectors
          const allBtns = document.querySelectorAll("button, [role='button'], [role='option'], input[type='radio'], label");
          const sizePatterns = /^(XS|S|M|L|XL|XXL|2XL|3XL|\d{1,2}(\.\d)?|one size|\d{2}[wWlL]?)$/i;
          const matches: string[] = [];
          for (const el of allBtns) {
            const text = el.textContent?.trim() || "";
            const htmlEl = el as HTMLElement;
            if (htmlEl.offsetParent !== null && sizePatterns.test(text) && htmlEl.getBoundingClientRect().width > 15) {
              matches.push(text);
            }
          }
          // Also check for a visual "Size" label
          const hasSizeLabel = !!document.body.innerText.match(/\bsize\b/i);
          // Check for color swatches
          const swatches = document.querySelectorAll('[class*="color" i] button, [class*="swatch" i], [class*="color" i] [role="radio"]');
          const visibleSwatches = Array.from(swatches).filter(el => (el as HTMLElement).offsetParent !== null);
          return { sizeLabels: matches.slice(0, 10), hasSizeLabel, colorSwatchCount: visibleSwatches.length };
        });

        if (visibleVariantInfo.sizeLabels.length > 0) {
          variantGaps.push({
            what: `A human can clearly see ${visibleVariantInfo.sizeLabels.length} size options (${visibleVariantInfo.sizeLabels.join(", ")}) on this page.`,
            why: "The size selector buttons don't use standard class names (like \"size\" or \"variant\") or accessibility roles (like role=\"radio\" or role=\"option\") that agents can discover programmatically.",
            recommendation: "Wrap size options in a container with class containing 'size' or 'variant', or add aria-label='Size' to the fieldset/group.",
          });
        } else if (visibleVariantInfo.hasSizeLabel) {
          variantGaps.push({
            what: "A human can see a \"Size\" label on this page, suggesting size options are present.",
            why: "The size options may be rendered as custom components (e.g., styled divs) instead of standard buttons, making them invisible to automated agents.",
            recommendation: "Use <button> elements for size options with descriptive class names or aria-labels.",
          });
        }

        if (visibleVariantInfo.colorSwatchCount > 0) {
          variantGaps.push({
            what: `A human can see ${visibleVariantInfo.colorSwatchCount} color swatch${visibleVariantInfo.colorSwatchCount > 1 ? "es" : ""} for selecting product colors.`,
            why: "The color swatches lack accessible labels or roles that would let an agent identify and select them.",
            recommendation: "Add aria-label attributes to color swatch buttons (e.g., aria-label='Color: Navy Blue').",
          });
        }
      }

      await injectOverlay(page, {
        step: 6,
        label: variantSelected ? "Variant selected" : "Could not find variant selector",
        result: variantSelected ? "pass" : "partial",
        cursorX: clickPos?.x,
        cursorY: clickPos?.y,
      });
      const screenshot = await takeScreenshot(page, "06-variant-selection");

      return {
        stepNumber: 6,
        action: "Select product variant",
        description: "Attempting to select a size/variant",
        result: (variantSelected ? "pass" : "partial") as "pass" | "partial",
        narration: variantSelected
          ? `I found and clicked a size/variant option${sizeButton ? ` ("${sizeButton.text}")` : ""}. The selection appeared to register.`
          : "I couldn't find accessible size/variant selection buttons.",
        thought: variantSelected ? "Variant selected. Let me try adding to cart." : "Can't select a variant.",
        screenshotPath: screenshot,
        cursorTarget: clickPos,
        humanAgentGaps: variantGaps.length > 0 ? variantGaps : undefined,
      };
    });
    steps.push(step6);

    // ── Step 7: Add to cart ──
    console.log("[Browser Agent] Step 7: Add to cart...");
    const step7 = await measureStep(async () => {
      let cartClicked = false;
      let clickPos: { x: number; y: number } | undefined;
      let buttonText = "";

      // Find button position first
      const cartBtnInfo = await page.evaluate(() => {
        const cartSelectors = [
          'button[class*="add-to-cart" i]', 'button[class*="addtocart" i]', 'button[class*="add-to-bag" i]',
          'button[data-test*="add" i]', 'button[aria-label*="add to" i]', '[class*="add-to-cart" i]', '[id*="add-to-cart" i]',
        ];
        for (const sel of cartSelectors) {
          const btn = document.querySelector(sel) as HTMLElement;
          if (btn && btn.offsetParent !== null) {
            const rect = btn.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: btn.textContent?.trim() || "", sel };
          }
        }
        // Fallback: text search
        const buttons = document.querySelectorAll("button");
        for (const btn of buttons) {
          if (btn.textContent && /add to (cart|bag|basket)/i.test(btn.textContent) && btn.offsetParent !== null) {
            const rect = btn.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: btn.textContent.trim(), sel: "text-match" };
          }
        }
        return null;
      });

      if (cartBtnInfo) {
        clickPos = { x: cartBtnInfo.x, y: cartBtnInfo.y };
        buttonText = cartBtnInfo.text;

        // Show the annotation BEFORE clicking
        await injectOverlay(page, {
          step: 7,
          label: `Adding to cart — clicking "${buttonText}"`,
          result: "active",
          cursorX: cartBtnInfo.x,
          cursorY: cartBtnInfo.y,
          annotation: `Clicking: "${buttonText}"`,
        });
        await takeScreenshot(page, "07a-clicking-cart");

        // Actually click
        const cartSelectors = [
          'button[class*="add-to-cart" i]', 'button[class*="addtocart" i]', 'button[class*="add-to-bag" i]',
          'button[data-test*="add" i]', 'button[aria-label*="add to" i]', '[class*="add-to-cart" i]', '[id*="add-to-cart" i]',
        ];
        for (const sel of cartSelectors) {
          try {
            const btn = await page.$(sel);
            if (btn) {
              await btn.click();
              cartClicked = true;
              await delay(2000);
              break;
            }
          } catch { continue; }
        }

        if (!cartClicked) {
          cartClicked = await page.evaluate(() => {
            const buttons = document.querySelectorAll("button");
            for (const btn of buttons) {
              if (btn.textContent && /add to (cart|bag|basket)/i.test(btn.textContent) && (btn as HTMLElement).offsetParent !== null) {
                btn.click();
                return true;
              }
            }
            return false;
          });
          if (cartClicked) await delay(2000);
        }
      }

      addToCartSuccess = cartClicked;
      await injectOverlay(page, {
        step: 7,
        label: cartClicked ? `Added to cart — "${buttonText}"` : "Could not find add-to-cart button",
        result: cartClicked ? "pass" : "fail",
        cursorX: clickPos?.x,
        cursorY: clickPos?.y,
      });
      const screenshot = await takeScreenshot(page, "07-add-to-cart");

      return {
        stepNumber: 7,
        action: "Add to cart",
        description: "Attempting to add product to cart",
        result: (cartClicked ? "pass" : "fail") as "pass" | "fail",
        narration: cartClicked
          ? `I clicked the add-to-cart button ("${buttonText}"). The page responded.`
          : "I couldn't find or click an add-to-cart button.",
        thought: cartClicked ? "Cart button clicked." : "Can't find add-to-cart button. This is a problem.",
        screenshotPath: screenshot,
        cursorTarget: clickPos,
      };
    });
    steps.push(step7);

    // ── Step 8: Attempt checkout ──
    console.log("[Browser Agent] Step 8: Attempt checkout...");
    const step8 = await measureStep(async () => {
      // Find checkout/cart link
      const checkoutLink = await page.evaluate(() => {
        const selectors = ['a[href*="checkout"]', 'a[href*="cart"]', 'button[class*="checkout" i]', '[class*="cart-icon"]', 'a[href*="bag"]'];
        for (const sel of selectors) {
          const el = document.querySelector(sel) as HTMLElement;
          if (el && el.offsetParent !== null) {
            const rect = el.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text: el.textContent?.trim() || "Cart/Checkout" };
          }
        }
        return null;
      });

      let navigated = false;
      if (checkoutLink) {
        await injectOverlay(page, {
          step: 8,
          label: `Proceeding to checkout — clicking "${checkoutLink.text}"`,
          result: "active",
          cursorX: checkoutLink.x,
          cursorY: checkoutLink.y,
          annotation: `Clicking: "${checkoutLink.text}"`,
        });
        await takeScreenshot(page, "08a-clicking-checkout");

        const checkoutSelectors = ['a[href*="checkout"]', 'a[href*="cart"]', 'button[class*="checkout" i]', '[class*="cart-icon"]', 'a[href*="bag"]'];
        for (const sel of checkoutSelectors) {
          try {
            const el = await page.$(sel);
            if (el) {
              await el.click();
              await delay(3000);
              navigated = true;
              break;
            }
          } catch { continue; }
        }
      }

      pagesLoaded++;
      const currentUrl = page.url();
      const html = await page.content();

      const hasGuestCheckout = /guest/i.test(html) || /continue.as.guest/i.test(html) || /checkout.without/i.test(html);
      const requiresLogin = /sign.in/i.test(html) || /log.in/i.test(html) || /create.account/i.test(html);

      checkoutReached = navigated;
      guestCheckoutAvailable = hasGuestCheckout;

      let resultVal: "pass" | "partial" | "fail" = "fail";
      let resultLabel = "";
      if (!navigated) {
        resultLabel = "Could not find checkout link";
      } else if (requiresLogin && !hasGuestCheckout) {
        resultLabel = "Checkout requires sign-in — no guest checkout";
      } else if (hasGuestCheckout) {
        resultVal = "pass";
        resultLabel = "Guest checkout available";
      } else {
        resultVal = "partial";
        resultLabel = "Reached checkout — unclear on guest checkout";
      }

      await injectOverlay(page, { step: 8, label: resultLabel, result: resultVal });
      const screenshot = await takeScreenshot(page, "08-checkout");

      if (!navigated) {
        return {
          stepNumber: 8, action: "Proceed to checkout", description: "Attempting to reach checkout",
          result: "fail" as const,
          narration: "I couldn't find a checkout or cart link to navigate to.",
          thought: "Can't find checkout. Journey ends here.",
          screenshotPath: screenshot,
        };
      }
      if (requiresLogin && !hasGuestCheckout) {
        return {
          stepNumber: 8, action: "Proceed to checkout", description: `Reached ${currentUrl}`,
          result: "fail" as const,
          narration: `I reached checkout at ${currentUrl}, but it requires signing in. No guest checkout option.`,
          thought: "Checkout requires sign-in. I'm blocked.",
          screenshotPath: screenshot,
          cursorTarget: checkoutLink ? { x: checkoutLink.x, y: checkoutLink.y } : undefined,
        };
      }
      return {
        stepNumber: 8, action: "Proceed to checkout", description: `Reached ${currentUrl}`,
        result: (hasGuestCheckout ? "pass" : "partial") as "pass" | "partial",
        narration: `I reached checkout at ${currentUrl}. ${hasGuestCheckout ? "Guest checkout is available." : "Unclear on guest checkout."}`,
        thought: hasGuestCheckout ? "Guest checkout available." : "Reached checkout, unclear on guest support.",
        screenshotPath: screenshot,
        cursorTarget: checkoutLink ? { x: checkoutLink.x, y: checkoutLink.y } : undefined,
      };
    });
    steps.push(step8);

    const failCount = steps.filter((s) => s.result === "fail").length;
    const partialCount = steps.filter((s) => s.result === "partial").length;
    if (failCount >= 2) overallResult = "fail";
    else if (failCount === 1 || partialCount >= 3) overallResult = "partial";
    else overallResult = "pass";

    function buildResult(): BrowserAgentResult {
      const totalDuration = steps.reduce((sum, s) => sum + s.duration, 0);
      const narrative = steps.map((s) => s.narration).join(" ");
      return { steps, overallResult, narrative, pagesLoaded, totalDuration, blockedByBot, captchaDetected, cookieConsentFound, addToCartSuccess, checkoutReached, guestCheckoutAvailable, renderedProductHtml };
    }

    return buildResult();
  } catch (e) {
    console.error("[Browser Agent] Fatal error:", e);
    return {
      steps, overallResult: "fail",
      narrative: `Browser Agent encountered a fatal error: ${(e as Error).message}`,
      pagesLoaded, totalDuration: steps.reduce((sum, s) => sum + s.duration, 0),
      blockedByBot, captchaDetected, cookieConsentFound, addToCartSuccess, checkoutReached, guestCheckoutAvailable, renderedProductHtml,
    };
  } finally {
    if (browser) await browser.close();
  }
}
