/**
 * ARC Score Scanner — runs all three agents against a site and generates a real report.
 *
 * Usage: npx tsx scripts/scan.ts <url> [product-url]
 * Example: npx tsx scripts/scan.ts nike.com https://www.nike.com/t/alphafly-3-road-racing-shoes-...
 */

import { runDataAgent, type DataAgentResult } from "../src/lib/scanner/data-agent";
import { runBrowserAgent, type BrowserAgentResult } from "../src/lib/scanner/browser-agent";
import {
  runAccessibilityAgent,
  type AccessibilityAgentResult,
} from "../src/lib/scanner/accessibility-agent";
import type { ScanReport, CategoryScore, AgentJourney, Finding, ActionItem } from "../src/types/report";
import fs from "fs";
import path from "path";

const url = process.argv[2] || "nike.com";
const productUrl = process.argv[3];

console.log(`\n=== ARC Score Scanner ===`);
console.log(`Target: ${url}`);
if (productUrl) console.log(`Product: ${productUrl}`);
console.log(`========================\n`);

async function main() {
  // Run all three agents
  console.log("Starting Data Agent...\n");
  const dataResult = await runDataAgent(url, productUrl);

  console.log("\nStarting Browser Agent...\n");
  const browserResult = await runBrowserAgent(url, productUrl);

  console.log("\nStarting Accessibility Agent...\n");
  const a11yResult = await runAccessibilityAgent(url, productUrl);

  // Calculate scores
  console.log("\n=== Calculating ARC Score ===\n");
  const report = buildReport(url, dataResult, browserResult, a11yResult);

  // Save report
  const outputPath = path.join(process.cwd(), "src", "lib", "mock-data", "real-nike.ts");
  const tsContent = `import type { ScanReport } from "@/types/report";\n\nexport const realNikeReport: ScanReport = ${JSON.stringify(report, null, 2)};\n`;
  fs.writeFileSync(outputPath, tsContent);
  console.log(`Report saved to: ${outputPath}`);

  // Also save raw JSON for debugging
  const jsonPath = path.join(process.cwd(), "scan-results.json");
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        url,
        scannedAt: new Date().toISOString(),
        report,
        raw: { dataResult, browserResult, a11yResult },
      },
      null,
      2
    )
  );
  console.log(`Raw results saved to: ${jsonPath}`);

  console.log(`\n=== ARC Score: ${report.overallScore}/100 (Grade ${report.grade}) ===\n`);
  console.log(`Verdict: ${report.verdict}\n`);
  console.log("Category Breakdown:");
  for (const cat of report.categories) {
    console.log(`  ${cat.name}: ${cat.score}/100 (${cat.grade}) - ${cat.summary}`);
  }
  console.log(`\nFindings: ${report.findings.length} issues found`);
  for (const f of report.findings) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.title}`);
  }
}

function buildReport(
  siteUrl: string,
  data: DataAgentResult,
  browser: BrowserAgentResult,
  a11y: AccessibilityAgentResult
): ScanReport {
  // Score each category
  const discoverability = scoreDiscoverability(browser, a11y);
  const productUnderstanding = scoreProductUnderstanding(data, browser);
  const navigationInteraction = scoreNavigation(browser, a11y);
  const cartCheckout = scoreCartCheckout(browser, data);
  const performanceResilience = scorePerformance(browser, data);
  const dataStandards = scoreDataStandards(data);

  const categories: CategoryScore[] = [
    discoverability,
    productUnderstanding,
    navigationInteraction,
    cartCheckout,
    performanceResilience,
    dataStandards,
  ];

  // Weighted overall score
  const overallScore = Math.round(
    categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  );

  const grade = getGrade(overallScore);

  // Build journeys from real results
  const journeys = buildJourneys(siteUrl, browser, data, a11y);

  // Build findings
  const findings = buildFindings(data, browser, a11y);

  // Build action plan
  const actionPlan = buildActionPlan(findings);

  // Estimate score after fixes
  const topFixes = findings.slice(0, 5);
  const estimatedGain = topFixes.reduce((sum, f) => sum + f.estimatedPointsGain, 0);
  const estimatedScoreAfterFixes = Math.min(100, overallScore + estimatedGain);

  const verdict = buildVerdict(overallScore, grade, browser);
  const comparison = overallScore >= 85
    ? "You're in the top 10% of ecommerce sites we've scanned"
    : overallScore >= 70
      ? "You're in the top 25% of ecommerce sites we've scanned"
      : overallScore >= 50
        ? "You're in the middle of the pack compared to similar sites"
        : overallScore >= 30
          ? "You're in the bottom 30% of ecommerce sites we've scanned"
          : "You're in the bottom 10% of ecommerce sites we've scanned";

  return {
    id: "real-nike",
    url: siteUrl,
    scannedAt: new Date().toISOString(),
    overallScore,
    grade,
    verdict,
    comparison,
    categories,
    journeys,
    findings,
    actionPlan,
    estimatedScoreAfterFixes,
  };
}

function getGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

function buildVerdict(
  score: number,
  grade: string,
  browser: BrowserAgentResult
): string {
  if (browser.blockedByBot) {
    return `Your site actively blocks automated agents. Personal AI agents cannot interact with your store at all.`;
  }
  if (score >= 85) {
    return `Your site is highly ready for personal AI agents. Agents can successfully discover, evaluate, and ${browser.addToCartSuccess ? "purchase" : "interact with"} products with minimal friction.`;
  }
  if (score >= 70) {
    return `Your site is mostly ready for personal AI agents. Minor friction points may cause some agent drop-offs, but the core shopping flow works.`;
  }
  if (score >= 50) {
    return `Your site has significant gaps in agent readiness. Personal AI agents struggle with key interactions and ${!browser.addToCartSuccess ? "cannot complete purchases" : "face friction during the buying flow"}.`;
  }
  return `Your site has major barriers for personal AI agents. ${!browser.addToCartSuccess ? "Agents cannot add products to cart or complete purchases." : "Critical parts of the shopping flow are broken for agents."}`;
}

// ---- Category Scoring ----

function scoreDiscoverability(browser: BrowserAgentResult, a11y: AccessibilityAgentResult): CategoryScore {
  let score = 0;

  // Homepage loads (20 pts)
  const homepageStep = browser.steps.find(s => s.action.includes("homepage"));
  if (homepageStep?.result === "pass") score += 20;
  else if (homepageStep?.result === "partial") score += 10;

  // Navigation works (25 pts)
  const navStep = browser.steps.find(s => s.action.includes("navigation") || s.action.includes("Explore"));
  if (navStep?.result === "pass") score += 25;
  else if (navStep?.result === "partial") score += 12;

  // Product findable (25 pts)
  const productStep = browser.steps.find(s => s.action.includes("product page") || s.action.includes("Find a product"));
  if (productStep?.result === "pass") score += 25;
  else if (productStep?.result === "partial") score += 12;

  // A11y landmarks (15 pts)
  if (a11y.landmarkCount >= 3) score += 15;
  else if (a11y.landmarkCount >= 1) score += 8;

  // Heading structure (15 pts)
  if (a11y.headingStructure.length >= 3) score += 15;
  else if (a11y.headingStructure.length >= 1) score += 8;

  const grade = getGrade(score);
  return {
    id: "discoverability",
    name: "Discoverability",
    weight: 0.15,
    score,
    grade,
    summary: score >= 70
      ? "Agents can find products from the homepage with reasonable navigation."
      : score >= 40
        ? "Agents can reach the site but navigation has friction points."
        : "Agents struggle to find products on the site.",
    agentsCovered: ["browser", "accessibility"],
  };
}

function scoreProductUnderstanding(data: DataAgentResult, browser: BrowserAgentResult): CategoryScore {
  let score = 0;

  // Schema.org Product (25 pts)
  if (data.schemaOrg.found && data.schemaOrg.type === "Product") {
    score += 25;
  } else if (data.jsonLd.found) {
    score += 10;
  }

  // Price extractable (20 pts)
  const hasPrice = data.schemaOrg.fields?.price || data.schemaOrg.fields?.offers;
  if (hasPrice) score += 20;
  else {
    const productStep = browser.steps.find(s => s.action.includes("Analyze") || s.action.includes("product"));
    if (productStep?.details && (productStep.details as Record<string, unknown>).price) score += 10;
  }

  // Variant data (15 pts)
  if (data.schemaOrg.fields?.offers) score += 15;
  else {
    const productStep = browser.steps.find(s => s.action.includes("Analyze") || s.action.includes("product"));
    if (productStep?.details && ((productStep.details as Record<string, unknown>).sizeOptions as number) > 0) score += 8;
  }

  // Description (15 pts)
  if (data.schemaOrg.fields?.description) score += 15;
  else if (data.meta.description) score += 8;

  // Reviews/ratings (10 pts)
  if (data.schemaOrg.fields?.aggregateRating) score += 10;

  // Identifiers (15 pts)
  if (data.schemaOrg.fields?.sku || data.schemaOrg.fields?.gtin || data.schemaOrg.fields?.gtin13) score += 15;

  const grade = getGrade(score);
  return {
    id: "product-understanding",
    name: "Product Understanding",
    weight: 0.25,
    score,
    grade,
    summary: score >= 70
      ? "Strong structured product data. Agents can parse key product information."
      : score >= 40
        ? "Some product data is available but gaps exist in structured markup."
        : "Product data is poorly structured for agent consumption.",
    agentsCovered: ["browser", "data", "accessibility"],
  };
}

function scoreNavigation(browser: BrowserAgentResult, a11y: AccessibilityAgentResult): CategoryScore {
  let score = 0;

  // Cookie consent handleable (15 pts)
  if (!browser.cookieConsentFound) score += 15;
  else {
    const cookieStep = browser.steps.find(s => s.action.includes("cookie"));
    if (cookieStep?.result === "pass") score += 15;
    else if (cookieStep?.result === "partial") score += 8;
  }

  // Variant selection (25 pts)
  const variantStep = browser.steps.find(s => s.action.includes("variant"));
  if (variantStep?.result === "pass") score += 25;
  else if (variantStep?.result === "partial") score += 12;

  // A11y interactive elements labeled (20 pts)
  const unlabeledRatio = a11y.interactiveElements > 0
    ? a11y.unlabeledElements / a11y.interactiveElements
    : 1;
  if (unlabeledRatio < 0.05) score += 20;
  else if (unlabeledRatio < 0.15) score += 15;
  else if (unlabeledRatio < 0.3) score += 8;

  // Keyboard navigable (20 pts)
  const kbStep = a11y.steps.find(s => s.action.includes("keyboard"));
  if (kbStep?.result === "pass") score += 20;
  else if (kbStep?.result === "partial") score += 10;

  // No blocking overlays (20 pts)
  const interactionStep = a11y.steps.find(s => s.action.includes("interaction") || s.action.includes("key interaction"));
  if (interactionStep?.result === "pass") score += 20;
  else if (interactionStep?.result === "partial") score += 10;

  const grade = getGrade(score);
  return {
    id: "navigation-interaction",
    name: "Navigation & Interaction",
    weight: 0.2,
    score,
    grade,
    summary: score >= 70
      ? "Most interactive elements are accessible to agents."
      : score >= 40
        ? "Some interactions work but agents face friction with custom components."
        : "Agents cannot reliably interact with the site's interactive elements.",
    agentsCovered: ["browser", "accessibility"],
  };
}

function scoreCartCheckout(browser: BrowserAgentResult, data: DataAgentResult): CategoryScore {
  let score = 0;

  // Add to cart works (35 pts)
  if (browser.addToCartSuccess) score += 35;

  // Checkout reachable (25 pts)
  if (browser.checkoutReached) score += 25;

  // Guest checkout (25 pts)
  if (browser.guestCheckoutAvailable) score += 25;
  else if (browser.checkoutReached) score += 5; // partial credit

  // Cart API (15 pts)
  if (data.apiEndpoints.found.length > 0) score += 15;

  const grade = getGrade(score);
  return {
    id: "cart-checkout",
    name: "Cart & Checkout",
    weight: 0.25,
    score,
    grade,
    summary: browser.addToCartSuccess
      ? browser.guestCheckoutAvailable
        ? "Agents can add to cart and checkout without an account."
        : browser.checkoutReached
          ? "Add-to-cart works but checkout requires account creation."
          : "Add-to-cart works but checkout couldn't be reached."
      : "Agents cannot add products to cart.",
    agentsCovered: ["browser", "data", "accessibility"],
  };
}

function scorePerformance(browser: BrowserAgentResult, data: DataAgentResult): CategoryScore {
  let score = 0;

  // Not blocked by bot detection (35 pts)
  if (!browser.blockedByBot) score += 35;

  // No CAPTCHA (25 pts)
  if (!browser.captchaDetected) score += 25;

  // Page loads (20 pts)
  const homepageStep = browser.steps.find(s => s.action.includes("homepage"));
  if (homepageStep) {
    if (homepageStep.duration < 5000) score += 20;
    else if (homepageStep.duration < 10000) score += 10;
  }

  // Core data in HTML (20 pts)
  if (data.meta.htmlSize > 1000) score += 20;
  else if (data.meta.htmlSize > 0) score += 10;

  const grade = getGrade(score);
  return {
    id: "performance-resilience",
    name: "Performance & Resilience",
    weight: 0.1,
    score,
    grade,
    summary: browser.blockedByBot
      ? "The site blocks automated agents with bot detection."
      : score >= 70
        ? "No bot blocking detected. Pages load within acceptable time."
        : "Some performance or resilience issues for agent access.",
    agentsCovered: ["browser", "data"],
  };
}

function scoreDataStandards(data: DataAgentResult): CategoryScore {
  let score = 0;

  // robots.txt allows agents (20 pts)
  if (data.robotsTxt.found) {
    if (data.robotsTxt.blockedAgents.length === 0) score += 20;
    else if (data.robotsTxt.blockedAgents.length <= 2) score += 10;
  }

  // Sitemap with products (20 pts)
  if (data.sitemap.found) score += 20;

  // Open Graph tags (15 pts)
  if (data.openGraph.found) {
    score += 10;
    if (data.openGraph.tags["og:price:amount"]) score += 5;
  }

  // JSON-LD (25 pts)
  if (data.jsonLd.found) score += 25;

  // API endpoints (20 pts)
  if (data.apiEndpoints.found.length > 0) score += 20;

  const grade = getGrade(score);
  return {
    id: "data-standards",
    name: "Data Standards & Feeds",
    weight: 0.05,
    score,
    grade,
    summary: score >= 70
      ? "Good structured data exposure via standards and feeds."
      : score >= 40
        ? "Some structured data present but gaps in coverage."
        : "Limited structured data for agent consumption.",
    agentsCovered: ["data"],
  };
}

// ---- Journey Builder ----

function buildJourneys(
  siteUrl: string,
  browser: BrowserAgentResult,
  data: DataAgentResult,
  a11y: AccessibilityAgentResult
): AgentJourney[] {
  return [
    {
      agentType: "browser",
      agentName: "Browser Agent",
      agentDescription:
        "Navigates your site like a personal AI agent — clicking links, filling forms, interacting with the DOM.",
      overallResult: browser.overallResult,
      narrative: browser.narrative,
      steps: browser.steps.map((s) => ({
        stepNumber: s.stepNumber,
        action: s.action,
        description: s.description,
        result: s.result,
        narration: s.narration,
        thought: s.thought,
        screenshotUrl: s.screenshotPath,
        cursorTarget: s.cursorTarget,
        duration: s.duration,
      })),
    },
    {
      agentType: "data",
      agentName: "Data Agent",
      agentDescription:
        "Reads structured data, APIs, and feeds to understand your product catalog without rendering pages.",
      overallResult: data.schemaOrg.found && data.sitemap.found ? "pass" : data.jsonLd.found ? "partial" : "fail",
      narrative: buildDataNarrative(data),
      steps: buildDataSteps(data),
    },
    {
      agentType: "accessibility",
      agentName: "Accessibility Agent",
      agentDescription:
        "Uses the accessibility tree and ARIA labels to interact with your site without visual rendering.",
      overallResult: a11y.overallResult,
      narrative: a11y.narrative,
      steps: a11y.steps.map((s) => ({
        stepNumber: s.stepNumber,
        action: s.action,
        description: s.description,
        result: s.result,
        narration: s.narration,
        thought: s.thought,
        duration: s.duration,
      })),
    },
  ];
}

function buildDataNarrative(data: DataAgentResult): string {
  const parts: string[] = [];
  parts.push(
    `I analyzed the structured data on the site. ${data.meta.title ? `Page title: "${data.meta.title}".` : ""} The raw HTML is ${Math.round(data.meta.htmlSize / 1024)}KB.`
  );
  if (data.schemaOrg.found) {
    const fields = Object.entries(data.schemaOrg.fields)
      .filter(([, v]) => v)
      .map(([k]) => k);
    parts.push(
      `Found Schema.org ${data.schemaOrg.type} markup with fields: ${fields.join(", ")}.`
    );
  } else {
    parts.push("No Schema.org Product markup found.");
  }
  if (data.openGraph.found) {
    parts.push(
      `Open Graph tags present: ${Object.keys(data.openGraph.tags).join(", ")}.`
    );
  }
  if (data.robotsTxt.found) {
    if (data.robotsTxt.blockedAgents.length > 0) {
      parts.push(
        `robots.txt blocks: ${data.robotsTxt.blockedAgents.join(", ")}.`
      );
    } else {
      parts.push("robots.txt allows all major AI user agents.");
    }
  }
  if (data.sitemap.found) {
    parts.push(`Sitemap found with ~${data.sitemap.productUrls} URLs.`);
  }
  if (data.apiEndpoints.found.length > 0) {
    parts.push(`API endpoints found: ${data.apiEndpoints.found.join(", ")}.`);
  }
  return parts.join(" ");
}

function buildDataSteps(data: DataAgentResult) {
  const steps = [];
  let stepNum = 1;

  steps.push({
    stepNumber: stepNum++,
    action: "Fetch and parse HTML",
    description: "Downloading raw page HTML",
    result: (data.meta.htmlSize > 0 ? "pass" : "fail") as "pass" | "fail",
    narration: `Fetched the page HTML (${Math.round(data.meta.htmlSize / 1024)}KB). ${data.meta.title ? `Page title: "${data.meta.title}".` : "No title found."}`,
    thought: data.meta.htmlSize > 0 ? "Page fetched. Parsing structured data." : "Failed to fetch page.",
    duration: 500,
  });

  steps.push({
    stepNumber: stepNum++,
    action: "Parse Schema.org markup",
    description: "Extracting JSON-LD structured data",
    result: (data.schemaOrg.found ? "pass" : "fail") as "pass" | "fail",
    narration: data.schemaOrg.found
      ? `Found ${data.schemaOrg.type} schema with ${Object.values(data.schemaOrg.fields).filter(Boolean).length} fields populated.`
      : `No Schema.org Product markup found. ${data.jsonLd.found ? `Found ${data.jsonLd.objects.length} JSON-LD object(s) but none are Product type.` : "No JSON-LD at all."}`,
    thought: data.schemaOrg.found ? "Good structured data." : "No Product schema. This is a gap.",
    duration: 300,
  });

  steps.push({
    stepNumber: stepNum++,
    action: "Check Open Graph tags",
    description: "Parsing og: meta tags",
    result: (data.openGraph.found ? (data.openGraph.tags["og:price:amount"] ? "pass" : "partial") : "fail") as "pass" | "partial" | "fail",
    narration: data.openGraph.found
      ? `OG tags found: ${Object.keys(data.openGraph.tags).join(", ")}. ${data.openGraph.tags["og:price:amount"] ? "Price included." : "Price NOT included in OG tags."}`
      : "No Open Graph tags found.",
    thought: data.openGraph.found ? "OG tags present." : "No OG tags.",
    duration: 200,
  });

  steps.push({
    stepNumber: stepNum++,
    action: "Check robots.txt",
    description: "Analyzing AI agent access permissions",
    result: (data.robotsTxt.found
      ? data.robotsTxt.blockedAgents.length === 0
        ? "pass"
        : "partial"
      : "fail") as "pass" | "partial" | "fail",
    narration: data.robotsTxt.found
      ? data.robotsTxt.blockedAgents.length > 0
        ? `robots.txt blocks these AI agents: ${data.robotsTxt.blockedAgents.join(", ")}. Allowed: ${data.robotsTxt.allowedAgents.join(", ")}.`
        : "robots.txt allows all major AI user agents."
      : "No robots.txt found or couldn't access it.",
    thought: data.robotsTxt.blockedAgents.length > 0 ? "Some agents blocked." : "All agents allowed.",
    duration: 400,
  });

  steps.push({
    stepNumber: stepNum++,
    action: "Check sitemap",
    description: "Looking for product URLs in sitemap",
    result: (data.sitemap.found ? "pass" : "fail") as "pass" | "fail",
    narration: data.sitemap.found
      ? `Sitemap found at ${data.sitemap.url} with ~${data.sitemap.productUrls} URLs.`
      : "No sitemap found at standard locations.",
    thought: data.sitemap.found ? "Sitemap present. Good for crawling." : "No sitemap. Agents must discover URLs by crawling.",
    duration: 600,
  });

  steps.push({
    stepNumber: stepNum++,
    action: "Probe API endpoints",
    description: "Testing for known ecommerce API patterns",
    result: (data.apiEndpoints.found.length > 0 ? "pass" : "fail") as "pass" | "fail",
    narration: data.apiEndpoints.found.length > 0
      ? `API endpoints found: ${data.apiEndpoints.found.join(", ")}. Agents can access product data programmatically.`
      : `No public API endpoints detected. Tested: ${data.apiEndpoints.tested.join(", ")}.`,
    thought: data.apiEndpoints.found.length > 0 ? "API available." : "No API. Agents must scrape HTML.",
    duration: 1000,
  });

  return steps;
}

// ---- Findings Builder ----

function buildFindings(
  data: DataAgentResult,
  browser: BrowserAgentResult,
  a11y: AccessibilityAgentResult
): Finding[] {
  const findings: Finding[] = [];
  let priority = 1;

  // Bot blocking
  if (browser.blockedByBot) {
    findings.push({
      id: `f${priority}`,
      severity: "critical",
      category: "performance-resilience",
      title: "Site blocks automated agents with bot detection",
      whatHappened: "The Browser Agent was blocked by bot detection on the first page load. The site returned a challenge page instead of content.",
      whyItMatters: "If your site blocks automated agents, personal AI agents sent by consumers cannot interact with your store at all. Every agent-initiated visit fails immediately.",
      affectedAgents: [
        { name: "Browser Agent", impact: "blocked" },
        { name: "Accessibility Agent", impact: "blocked" },
      ],
      fix: {
        summary: "Whitelist known AI agent user agents or implement more nuanced bot detection.",
        technicalDetail: "Consider allowing requests from known AI user agents (GPTBot, ClaudeBot, PerplexityBot) while maintaining protection against scrapers. Use rate limiting instead of blanket blocking for these agents.",
        effortEstimate: "2-4 hours",
      },
      priority: priority++,
      effort: "medium",
      estimatedPointsGain: 25,
    });
  }

  // No guest checkout
  if (browser.checkoutReached && !browser.guestCheckoutAvailable) {
    findings.push({
      id: `f${priority}`,
      severity: "critical",
      category: "cart-checkout",
      title: "No guest checkout — agents cannot complete purchases",
      whatHappened: "The checkout flow requires signing in or creating an account. No guest checkout option is available.",
      whyItMatters: "Personal AI agents cannot create accounts on behalf of their owners. When checkout requires sign-in, every agent-initiated purchase attempt fails at the final step.",
      affectedAgents: [
        { name: "Browser Agent", impact: "blocked" },
        { name: "Accessibility Agent", impact: "blocked" },
      ],
      fix: {
        summary: "Enable guest checkout for the purchase flow.",
        technicalDetail: "Add a guest checkout path that allows purchase with email + shipping address only. Most platforms support this natively — Shopify on by default, WooCommerce via settings.",
        codeSnippet: '// Guest checkout route\napp.post("/checkout/guest", async (req, res) => {\n  const { email, shipping, cart } = req.body;\n  const order = await createOrder({ email, shipping, cart });\n  return res.json({ orderId: order.id });\n});',
        effortEstimate: "4-8 hours depending on platform",
      },
      priority: priority++,
      effort: "medium",
      estimatedPointsGain: 15,
    });
  }

  // Add to cart fails
  if (!browser.addToCartSuccess) {
    findings.push({
      id: `f${priority}`,
      severity: "critical",
      category: "cart-checkout",
      title: "Add-to-cart button not accessible to agents",
      whatHappened: "The Browser Agent could not find or click the add-to-cart button. The button may use non-standard implementation.",
      whyItMatters: "If agents can't add products to cart, they can't complete any purchase. This is the most fundamental interaction for agent commerce.",
      affectedAgents: [
        { name: "Browser Agent", impact: "blocked" },
        { name: "Accessibility Agent", impact: "blocked" },
      ],
      fix: {
        summary: "Ensure the add-to-cart button is a standard <button> element with clear labeling.",
        technicalDetail: 'Use a native <button> element with aria-label="Add to Cart" or clear text content. Avoid hiding the button behind required interactions without accessible alternatives.',
        codeSnippet: '<button\n  type="button"\n  aria-label="Add to Cart"\n  data-testid="add-to-cart"\n  class="add-to-cart-btn"\n>\n  Add to Cart\n</button>',
        effortEstimate: "1-2 hours",
      },
      priority: priority++,
      effort: "low",
      estimatedPointsGain: 15,
    });
  }

  // Cookie consent
  if (browser.cookieConsentFound) {
    const cookieStep = browser.steps.find(s => s.action.includes("cookie"));
    if (cookieStep?.result !== "pass") {
      findings.push({
        id: `f${priority}`,
        severity: "high",
        category: "navigation-interaction",
        title: "Cookie consent banner blocks agent interaction",
        whatHappened: "A cookie consent overlay appeared and couldn't be easily dismissed programmatically.",
        whyItMatters: "Cookie consent overlays block the entire page until dismissed. Agents that can't find the dismiss button are stuck.",
        affectedAgents: [
          { name: "Browser Agent", impact: "degraded" },
          { name: "Accessibility Agent", impact: "degraded" },
        ],
        fix: {
          summary: 'Ensure the cookie dismiss button has a clear, consistent ID or aria-label.',
          technicalDetail: 'Use id="accept-cookies" or aria-label="Accept All Cookies" on the dismiss button. This lets agents find it quickly.',
          codeSnippet: '<button\n  id="accept-cookies"\n  aria-label="Accept All Cookies"\n  data-testid="cookie-accept"\n>\n  Accept All\n</button>',
          effortEstimate: "30 minutes",
        },
        priority: priority++,
        effort: "low",
        estimatedPointsGain: 5,
      });
    }
  }

  // No Schema.org Product
  if (!data.schemaOrg.found) {
    findings.push({
      id: `f${priority}`,
      severity: "high",
      category: "product-understanding",
      title: "No Schema.org Product markup found",
      whatHappened: "The page does not contain Schema.org Product structured data in JSON-LD format.",
      whyItMatters: "Without Product schema, data agents cannot programmatically understand product details (price, availability, variants). They must parse raw HTML, which is fragile and error-prone.",
      affectedAgents: [
        { name: "Data Agent", impact: "blocked" },
      ],
      fix: {
        summary: "Add JSON-LD Product schema to product pages.",
        technicalDetail: "Add a <script type=\"application/ld+json\"> block with Schema.org Product data including name, price, availability, description, image, and offers.",
        codeSnippet: '<script type="application/ld+json">\n{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Product Name",\n  "description": "...",\n  "image": "https://...",\n  "offers": {\n    "@type": "Offer",\n    "price": "99.99",\n    "priceCurrency": "USD",\n    "availability": "https://schema.org/InStock"\n  }\n}\n</script>',
        effortEstimate: "2-3 hours",
      },
      priority: priority++,
      effort: "low",
      estimatedPointsGain: 10,
    });
  }

  // Unlabeled elements
  if (a11y.unlabeledElements > 5) {
    findings.push({
      id: `f${priority}`,
      severity: "medium",
      category: "navigation-interaction",
      title: `${a11y.unlabeledElements} interactive elements lack accessible labels`,
      whatHappened: `The Accessibility Agent found ${a11y.unlabeledElements} interactive elements (buttons, links, inputs) without aria-label or text content.`,
      whyItMatters: "Agents navigating via the accessibility tree can't identify or interact with unlabeled elements. They appear as unnamed buttons or links.",
      affectedAgents: [
        { name: "Accessibility Agent", impact: "degraded" },
        { name: "Browser Agent", impact: "degraded" },
      ],
      fix: {
        summary: "Add aria-label attributes to all interactive elements.",
        technicalDetail: "Audit all buttons, links, and form inputs. Any element without visible text content needs an aria-label describing its purpose.",
        effortEstimate: "2-4 hours",
      },
      priority: priority++,
      effort: "medium",
      estimatedPointsGain: 5,
    });
  }

  // Blocked AI agents in robots.txt
  if (data.robotsTxt.blockedAgents.length > 0) {
    findings.push({
      id: `f${priority}`,
      severity: "medium",
      category: "data-standards",
      title: `robots.txt blocks ${data.robotsTxt.blockedAgents.length} AI agent(s)`,
      whatHappened: `The robots.txt file blocks these AI user agents: ${data.robotsTxt.blockedAgents.join(", ")}.`,
      whyItMatters: "Personal agents built on these platforms will respect robots.txt and refuse to crawl your site. This reduces your visibility to a growing segment of agent-mediated shoppers.",
      affectedAgents: data.robotsTxt.blockedAgents.map(a => ({
        name: `Agents using ${a}`,
        impact: "blocked" as const,
      })),
      fix: {
        summary: "Selectively allow AI agents on product pages while protecting sensitive paths.",
        technicalDetail: "Update robots.txt to allow AI agents on product and category pages. Block admin, checkout, and account paths.",
        codeSnippet: data.robotsTxt.blockedAgents.map(a =>
          `User-agent: ${a}\nAllow: /products/\nAllow: /categories/\nDisallow: /account/\nDisallow: /admin/`
        ).join("\n\n"),
        effortEstimate: "15 minutes",
      },
      priority: priority++,
      effort: "low",
      estimatedPointsGain: 3,
    });
  }

  // No sitemap
  if (!data.sitemap.found) {
    findings.push({
      id: `f${priority}`,
      severity: "medium",
      category: "data-standards",
      title: "No XML sitemap found",
      whatHappened: "No sitemap was found at standard locations (/sitemap.xml, /sitemap_index.xml).",
      whyItMatters: "Without a sitemap, agents must discover products by crawling the site, which is slower and less reliable.",
      affectedAgents: [
        { name: "Data Agent", impact: "degraded" },
      ],
      fix: {
        summary: "Generate and publish an XML sitemap with product URLs.",
        technicalDetail: "Create a sitemap.xml that lists all product URLs with last-modified dates.",
        effortEstimate: "1-2 hours",
      },
      priority: priority++,
      effort: "low",
      estimatedPointsGain: 3,
    });
  }

  // No OG price
  if (data.openGraph.found && !data.openGraph.tags["og:price:amount"]) {
    findings.push({
      id: `f${priority}`,
      severity: "low",
      category: "product-understanding",
      title: "Open Graph tags missing price data",
      whatHappened: "OG tags exist but og:price:amount and og:price:currency are missing.",
      whyItMatters: "Some agents use OG tags as a quick way to parse product info. Missing price adds an extra parsing step.",
      affectedAgents: [
        { name: "Data Agent", impact: "degraded" },
      ],
      fix: {
        summary: "Add og:price:amount and og:price:currency meta tags.",
        technicalDetail: "Add to the <head> of product pages.",
        codeSnippet: '<meta property="og:price:amount" content="99.99" />\n<meta property="og:price:currency" content="USD" />',
        effortEstimate: "15 minutes",
      },
      priority: priority++,
      effort: "low",
      estimatedPointsGain: 2,
    });
  }

  return findings;
}

function buildActionPlan(findings: Finding[]): ActionItem[] {
  return findings.map((f) => ({
    findingId: f.id,
    title: f.title,
    severity: f.severity,
    effort: f.effort,
    estimatedPointsGain: f.estimatedPointsGain,
    isQuickWin: f.effort === "low" && f.estimatedPointsGain >= 5,
  }));
}

main().catch(console.error);
