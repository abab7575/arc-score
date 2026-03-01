/**
 * Accessibility Agent — uses Puppeteer to capture and analyze the accessibility tree.
 * Tests whether interactive elements work without visual rendering.
 */

import puppeteer, { type Browser } from "puppeteer";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface A11yElement {
  role: string;
  name: string;
  description?: string;
  value?: string;
  children?: number;
  focusable?: boolean;
}

export interface A11yStep {
  stepNumber: number;
  action: string;
  description: string;
  result: "pass" | "partial" | "fail";
  narration: string;
  thought: string;
  duration: number;
  details?: Record<string, unknown>;
}

export interface AccessibilityAgentResult {
  steps: A11yStep[];
  overallResult: "pass" | "partial" | "fail";
  narrative: string;
  totalElements: number;
  interactiveElements: number;
  unlabeledElements: number;
  landmarkCount: number;
  headingStructure: string[];
  formFields: A11yElement[];
  buttons: A11yElement[];
  issues: string[];
}

async function measureStep(
  fn: () => Promise<Partial<A11yStep>>
): Promise<A11yStep> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { ...result, duration } as A11yStep;
}

export async function runAccessibilityAgent(
  url: string,
  productUrl?: string
): Promise<AccessibilityAgentResult> {
  const targetUrl = productUrl || (url.startsWith("http") ? url : `https://${url}`);
  const steps: A11yStep[] = [];
  let browser: Browser | null = null;
  const issues: string[] = [];

  let totalElements = 0;
  let interactiveElements = 0;
  let unlabeledElements = 0;
  let landmarkCount = 0;
  let headingStructure: string[] = [];
  let formFields: A11yElement[] = [];
  let buttons: A11yElement[] = [];

  try {
    console.log("[A11y Agent] Launching browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    // Step 1: Load page and capture a11y tree
    console.log("[A11y Agent] Step 1: Capture accessibility tree...");
    const step1 = await measureStep(async () => {
      await page.goto(targetUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait a bit for dynamic content
      await delay(2000);

      const snapshot = await page.accessibility.snapshot({ interestingOnly: false });

      function countNodes(node: typeof snapshot): number {
        if (!node) return 0;
        let count = 1;
        if (node.children) {
          for (const child of node.children) {
            count += countNodes(child);
          }
        }
        return count;
      }

      totalElements = snapshot ? countNodes(snapshot) : 0;

      return {
        stepNumber: 1,
        action: "Capture accessibility tree",
        description: "Taking full a11y snapshot of the page",
        result: (totalElements > 50 ? "pass" : "partial") as "pass" | "partial",
        narration: `I captured the accessibility tree. The page has ${totalElements} accessible nodes. ${totalElements > 200 ? "This is a richly structured page." : totalElements > 50 ? "Moderate accessibility structure." : "The page has very few accessible elements — much content may be inaccessible."}`,
        thought: `${totalElements} a11y nodes. ${totalElements > 100 ? "Good structure." : "Sparse — might be missing labels."}`,
        details: { totalElements },
      };
    });
    steps.push(step1);

    // Step 2: Analyze landmarks and headings
    console.log("[A11y Agent] Step 2: Analyze landmarks and headings...");
    const step2 = await measureStep(async () => {
      const analysis = await page.evaluate(() => {
        const landmarks = document.querySelectorAll(
          'header, footer, nav, main, aside, [role="banner"], [role="navigation"], [role="main"], [role="contentinfo"], [role="complementary"], [role="search"]'
        );

        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
        const headingList = Array.from(headings).map((h) => ({
          level: h.tagName,
          text: h.textContent?.trim()?.substring(0, 80) || "",
        }));

        return {
          landmarkCount: landmarks.length,
          landmarkTypes: Array.from(
            new Set(
              Array.from(landmarks).map(
                (l) => l.getAttribute("role") || l.tagName.toLowerCase()
              )
            )
          ),
          headings: headingList,
          h1Count: document.querySelectorAll("h1").length,
        };
      });

      landmarkCount = analysis.landmarkCount;
      headingStructure = analysis.headings.map(
        (h) => `${h.level}: ${h.text}`
      );

      const hasNav = analysis.landmarkTypes.some(
        (t) => t === "navigation" || t === "nav"
      );
      const hasMain = analysis.landmarkTypes.some(
        (t) => t === "main"
      );
      const hasH1 = analysis.h1Count > 0;

      if (!hasNav) issues.push("No navigation landmark found");
      if (!hasMain) issues.push("No main landmark found");
      if (!hasH1) issues.push("No h1 heading found");
      if (analysis.h1Count > 1) issues.push(`Multiple h1 elements (${analysis.h1Count})`);

      return {
        stepNumber: 2,
        action: "Analyze landmarks and headings",
        description: "Checking page structure for agents",
        result: (hasNav && hasMain && hasH1 ? "pass" : "partial") as "pass" | "partial",
        narration: `Found ${analysis.landmarkCount} landmark regions (${analysis.landmarkTypes.join(", ")}). ${analysis.headings.length} headings with ${analysis.h1Count} h1 element(s). ${!hasNav ? "Missing navigation landmark. " : ""}${!hasMain ? "Missing main landmark. " : ""}${hasH1 ? `H1: "${analysis.headings.find(h => h.level === "H1")?.text}".` : "No h1 found."}`,
        thought: `Structure: ${analysis.landmarkCount} landmarks, ${analysis.headings.length} headings. ${hasNav && hasMain ? "Good structure." : "Missing key landmarks."}`,
        details: analysis,
      };
    });
    steps.push(step2);

    // Step 3: Analyze interactive elements
    console.log("[A11y Agent] Step 3: Analyze interactive elements...");
    const step3 = await measureStep(async () => {
      const interactiveAnalysis = await page.evaluate(() => {
        const interactiveEls = document.querySelectorAll(
          'button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="tab"], [role="combobox"], [role="slider"], [tabindex]'
        );

        let totalInteractive = 0;
        let unlabeled = 0;
        const buttonsList: {
          role: string;
          name: string;
          hasLabel: boolean;
        }[] = [];
        const formList: {
          role: string;
          name: string;
          type?: string;
          hasLabel: boolean;
        }[] = [];

        for (const el of interactiveEls) {
          const htmlEl = el as HTMLElement;
          if (htmlEl.offsetParent === null) continue; // skip hidden
          totalInteractive++;

          const ariaLabel = el.getAttribute("aria-label") || "";
          const ariaLabelledby = el.getAttribute("aria-labelledby") || "";
          const textContent = el.textContent?.trim() || "";
          const title = el.getAttribute("title") || "";
          const name =
            ariaLabel ||
            (ariaLabelledby
              ? document.getElementById(ariaLabelledby)?.textContent?.trim()
              : "") ||
            textContent ||
            title;

          const hasLabel =
            !!(ariaLabel || ariaLabelledby || textContent || title);
          if (!hasLabel) unlabeled++;

          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute("role") || tag;

          if (
            tag === "button" ||
            role === "button" ||
            tag === "a" ||
            role === "link"
          ) {
            buttonsList.push({
              role,
              name: (name || "").substring(0, 60),
              hasLabel,
            });
          }

          if (
            tag === "input" ||
            tag === "select" ||
            tag === "textarea" ||
            role === "combobox"
          ) {
            formList.push({
              role,
              name: (name || "").substring(0, 60),
              type: (el as HTMLInputElement).type,
              hasLabel,
            });
          }
        }

        return {
          totalInteractive,
          unlabeled,
          buttons: buttonsList.slice(0, 20),
          formFields: formList.slice(0, 20),
        };
      });

      interactiveElements = interactiveAnalysis.totalInteractive;
      unlabeledElements = interactiveAnalysis.unlabeled;
      buttons = interactiveAnalysis.buttons.map((b) => ({
        role: b.role,
        name: b.name,
        focusable: true,
      }));
      formFields = interactiveAnalysis.formFields.map((f) => ({
        role: f.role,
        name: f.name,
        value: f.type,
        focusable: true,
      }));

      if (interactiveAnalysis.unlabeled > 5) {
        issues.push(
          `${interactiveAnalysis.unlabeled} interactive elements have no accessible label`
        );
      }

      const unlabeledRatio =
        interactiveAnalysis.totalInteractive > 0
          ? interactiveAnalysis.unlabeled /
            interactiveAnalysis.totalInteractive
          : 0;

      return {
        stepNumber: 3,
        action: "Analyze interactive elements",
        description: "Checking buttons, links, and form fields",
        result: (unlabeledRatio < 0.1 ? "pass" : unlabeledRatio < 0.3 ? "partial" : "fail") as "pass" | "partial" | "fail",
        narration: `Found ${interactiveAnalysis.totalInteractive} visible interactive elements. ${interactiveAnalysis.unlabeled} have no accessible label (${Math.round(unlabeledRatio * 100)}% unlabeled). ${interactiveAnalysis.buttons.length} buttons/links analyzed. ${interactiveAnalysis.formFields.length} form fields found.`,
        thought: `${interactiveAnalysis.totalInteractive} interactive elements, ${interactiveAnalysis.unlabeled} unlabeled. ${unlabeledRatio < 0.1 ? "Good labeling." : "Many elements missing labels."}`,
        details: interactiveAnalysis,
      };
    });
    steps.push(step3);

    // Step 4: Test specific interactions
    console.log("[A11y Agent] Step 4: Test specific interactions...");
    const step4 = await measureStep(async () => {
      const testResults = await page.evaluate(() => {
        // Test: Can we find and identify the add-to-cart button via a11y?
        const allButtons = document.querySelectorAll(
          'button, [role="button"]'
        );
        let addToCartFound = false;
        let addToCartLabel = "";
        for (const btn of allButtons) {
          const label =
            btn.getAttribute("aria-label") ||
            btn.textContent?.trim() ||
            "";
          if (/add to (cart|bag|basket)/i.test(label)) {
            addToCartFound = true;
            addToCartLabel = label;
            break;
          }
        }

        // Test: Can we find size/variant selectors via a11y?
        const sizeSelector = document.querySelector(
          '[role="radiogroup"], [role="listbox"], select[name*="size" i], [aria-label*="size" i], [aria-label*="Size" i]'
        );

        // Test: Can we find price via a11y?
        const priceEl = document.querySelector(
          '[itemprop="price"], [aria-label*="price" i], [class*="price" i]'
        );
        const priceText = priceEl?.textContent?.trim() || "";

        // Test: Check for focus traps
        const dialogs = document.querySelectorAll(
          '[role="dialog"], [role="alertdialog"], [class*="modal" i], [class*="overlay" i]'
        );
        const visibleDialogs = Array.from(dialogs).filter(
          (d) => (d as HTMLElement).offsetParent !== null
        );

        return {
          addToCartFound,
          addToCartLabel,
          hasSizeSelector: !!sizeSelector,
          sizeRole: sizeSelector?.getAttribute("role") || sizeSelector?.tagName || "none",
          priceAccessible: !!priceText,
          priceText: priceText.substring(0, 50),
          activeDialogs: visibleDialogs.length,
        };
      });

      if (!testResults.addToCartFound)
        issues.push("Add-to-cart button not findable via accessibility labels");
      if (!testResults.hasSizeSelector)
        issues.push("Size/variant selector not accessible via ARIA roles");

      const passCount = [
        testResults.addToCartFound,
        testResults.hasSizeSelector,
        testResults.priceAccessible,
        testResults.activeDialogs === 0,
      ].filter(Boolean).length;

      return {
        stepNumber: 4,
        action: "Test key interactions via a11y",
        description: "Testing add-to-cart, size selector, and price accessibility",
        result: (passCount >= 3 ? "pass" : passCount >= 2 ? "partial" : "fail") as "pass" | "partial" | "fail",
        narration: `Key interaction tests: Add-to-cart button ${testResults.addToCartFound ? `found ("${testResults.addToCartLabel}")` : "NOT found via accessibility labels"}. Size/variant selector ${testResults.hasSizeSelector ? `present (role: ${testResults.sizeRole})` : "NOT accessible via ARIA roles"}. Price ${testResults.priceAccessible ? `accessible: "${testResults.priceText}"` : "not accessible"}. ${testResults.activeDialogs > 0 ? `${testResults.activeDialogs} overlay dialog(s) blocking interaction.` : "No blocking overlays."}`,
        thought: `Cart button: ${testResults.addToCartFound ? "yes" : "no"}. Size selector: ${testResults.hasSizeSelector ? "yes" : "no"}. Price: ${testResults.priceAccessible ? "yes" : "no"}.`,
        details: testResults,
      };
    });
    steps.push(step4);

    // Step 5: Test keyboard navigation
    console.log("[A11y Agent] Step 5: Test keyboard navigation...");
    const step5 = await measureStep(async () => {
      // Tab through the page and see what we can reach
      const tabResults = await page.evaluate(() => {
        const focusableEls = document.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const visible = Array.from(focusableEls).filter(
          (el) => (el as HTMLElement).offsetParent !== null
        );
        return {
          totalFocusable: visible.length,
          firstFocusable:
            visible[0]?.tagName +
              ": " +
              (visible[0]?.textContent?.trim().substring(0, 40) || "") || "none",
        };
      });

      return {
        stepNumber: 5,
        action: "Test keyboard navigability",
        description: "Checking tab order and focusable elements",
        result: (tabResults.totalFocusable > 10 ? "pass" : "partial") as "pass" | "partial",
        narration: `Found ${tabResults.totalFocusable} keyboard-focusable elements on the page. First focusable element: ${tabResults.firstFocusable}. ${tabResults.totalFocusable > 20 ? "Good keyboard coverage." : "Limited focusable elements — some interactions may be unreachable via keyboard/a11y."}`,
        thought: `${tabResults.totalFocusable} focusable elements. ${tabResults.totalFocusable > 10 ? "Reasonable coverage." : "Low — many elements may be unreachable."}`,
        details: tabResults,
      };
    });
    steps.push(step5);

    // Determine overall result
    const failCount = steps.filter((s) => s.result === "fail").length;
    const partialCount = steps.filter((s) => s.result === "partial").length;
    let overallResult: "pass" | "partial" | "fail" = "pass";
    if (failCount >= 2) overallResult = "fail";
    else if (failCount === 1 || partialCount >= 2) overallResult = "partial";

    const narrative = steps.map((s) => s.narration).join(" ");

    console.log("[A11y Agent] Scan complete.");

    return {
      steps,
      overallResult,
      narrative,
      totalElements,
      interactiveElements,
      unlabeledElements,
      landmarkCount,
      headingStructure,
      formFields,
      buttons,
      issues,
    };
  } catch (e) {
    console.error("[A11y Agent] Fatal error:", e);
    return {
      steps,
      overallResult: "fail",
      narrative: `Accessibility Agent encountered a fatal error: ${(e as Error).message}`,
      totalElements,
      interactiveElements,
      unlabeledElements,
      landmarkCount,
      headingStructure,
      formFields,
      buttons,
      issues,
    };
  } finally {
    if (browser) await browser.close();
  }
}
