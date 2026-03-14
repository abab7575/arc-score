/**
 * Scoring Engine — extracted from scripts/scan.ts.
 * Pure functions that take agent results and produce scores, findings, and reports.
 */

import type {
  ScanReport,
  CategoryScore,
  AgentJourney,
  Finding,
  ActionItem,
  Grade,
} from "@/types/report";
import type { DataAgentResult } from "./data-agent";
import type { BrowserAgentResult } from "./browser-agent";
import type { AccessibilityAgentResult } from "./accessibility-agent";
import type { VisualAgentResult } from "./visual-agent";
import type { FeedAgentResult } from "./feed-agent";
import { computeAllAgentScores } from "@/lib/ai-agents";

export function getGrade(score: number): Grade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

export function buildReport(
  id: string,
  siteUrl: string,
  data: DataAgentResult,
  browser: BrowserAgentResult,
  a11y: AccessibilityAgentResult,
  visual?: VisualAgentResult,
  feed?: FeedAgentResult
): ScanReport {
  const categories: CategoryScore[] = [
    scoreDiscoverability(browser, a11y, visual),
    scoreProductUnderstanding(data, browser, visual, feed),
    scoreNavigation(browser, a11y, visual),
    scoreCartCheckout(browser, data, visual),
    scorePerformance(browser, data),
    scoreDataStandards(data, feed),
    scoreAgenticCommerce(data, feed),
  ];

  const overallScore = Math.round(
    categories.reduce((sum, cat) => sum + cat.score * cat.weight, 0)
  );
  const grade = getGrade(overallScore);
  const journeys = buildJourneys(siteUrl, browser, data, a11y, visual, feed);
  const findings = buildFindings(data, browser, a11y, visual, feed);
  const actionPlan = buildActionPlan(findings);

  const topFixes = findings.slice(0, 5);
  const estimatedGain = topFixes.reduce((sum, f) => sum + f.estimatedPointsGain, 0);
  const estimatedScoreAfterFixes = Math.min(100, overallScore + estimatedGain);

  const aiAgentScores = computeAllAgentScores(categories);

  const verdict = buildVerdict(overallScore, grade, browser);
  const comparison =
    overallScore >= 85
      ? "You're in the top 10% of ecommerce sites we've scanned"
      : overallScore >= 70
        ? "You're in the top 25% of ecommerce sites we've scanned"
        : overallScore >= 50
          ? "You're in the middle of the pack compared to similar sites"
          : overallScore >= 30
            ? "You're in the bottom 30% of ecommerce sites we've scanned"
            : "You're in the bottom 10% of ecommerce sites we've scanned";

  return {
    id,
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
    aiAgentScores,
  };
}

function buildVerdict(score: number, grade: string, browser: BrowserAgentResult): string {
  if (browser.blockedByBot) {
    return "Your site actively blocks automated agents. Personal AI agents cannot interact with your store at all.";
  }
  if (score >= 85) {
    return `Your site is highly ready for personal AI agents. Agents can successfully discover, evaluate, and ${browser.addToCartSuccess ? "purchase" : "interact with"} products with minimal friction.`;
  }
  if (score >= 70) {
    return "Your site is mostly ready for personal AI agents. Minor friction points may cause some agent drop-offs, but the core shopping flow works.";
  }
  if (score >= 50) {
    return `Your site has significant gaps in agent readiness. Personal AI agents struggle with key interactions and ${!browser.addToCartSuccess ? "cannot complete purchases" : "face friction during the buying flow"}.`;
  }
  return `Your site has major barriers for personal AI agents. ${!browser.addToCartSuccess ? "Agents cannot add products to cart or complete purchases." : "Critical parts of the shopping flow are broken for agents."}`;
}

// ---- Category Scoring ----

function scoreDiscoverability(browser: BrowserAgentResult, a11y: AccessibilityAgentResult, visual?: VisualAgentResult): CategoryScore {
  let score = 0;
  const homepageStep = browser.steps.find((s) => s.action.includes("homepage"));
  if (homepageStep?.result === "pass") score += 20;
  else if (homepageStep?.result === "partial") score += 10;

  const navStep = browser.steps.find((s) => s.action.includes("navigation") || s.action.includes("Explore"));
  if (navStep?.result === "pass") score += 25;
  else if (navStep?.result === "partial") score += 12;

  const productStep = browser.steps.find((s) => s.action.includes("product page") || s.action.includes("Find a product"));
  if (productStep?.result === "pass") score += 25;
  else if (productStep?.result === "partial") score += 12;

  if (a11y.landmarkCount >= 3) score += 15;
  else if (a11y.landmarkCount >= 1) score += 8;

  if (a11y.headingStructure.length >= 3) score += 15;
  else if (a11y.headingStructure.length >= 1) score += 8;

  // Visual agent bonus: if navigation is visually clear, boost score
  if (visual && visual.navigationClear) {
    score = Math.min(100, score + 5);
  }

  const grade = getGrade(score);
  return {
    id: "discoverability",
    name: "Discoverability",
    weight: 0.15,
    score,
    grade,
    summary:
      score >= 70
        ? "Agents can find products from the homepage with reasonable navigation."
        : score >= 40
          ? "Agents can reach the site but navigation has friction points."
          : "Agents struggle to find products on the site.",
    agentsCovered: ["browser", "accessibility"],
  };
}

function scoreProductUnderstanding(data: DataAgentResult, browser: BrowserAgentResult, visual?: VisualAgentResult, feed?: FeedAgentResult): CategoryScore {
  let score = 0;
  const productSchemaTypes = ["Product", "ProductGroup", "IndividualProduct", "ProductModel"];
  if (data.schemaOrg.found && productSchemaTypes.includes(data.schemaOrg.type ?? "")) score += 25;
  else if (data.jsonLd.found) score += 10;

  const hasPrice = data.schemaOrg.fields?.price || data.schemaOrg.fields?.offers;
  if (hasPrice) score += 20;
  else {
    const productStep = browser.steps.find((s) => s.action.includes("Analyze") || s.action.includes("product"));
    if (productStep?.details && (productStep.details as Record<string, unknown>).price) score += 10;
  }

  if (data.schemaOrg.fields?.offers) score += 15;
  else {
    const productStep = browser.steps.find((s) => s.action.includes("Analyze") || s.action.includes("product"));
    if (productStep?.details && ((productStep.details as Record<string, unknown>).sizeOptions as number) > 0) score += 8;
  }

  if (data.schemaOrg.fields?.description) score += 15;
  else if (data.meta.description) score += 8;

  if (data.schemaOrg.fields?.aggregateRating) score += 10;
  if (data.schemaOrg.fields?.sku || data.schemaOrg.fields?.gtin || data.schemaOrg.fields?.gtin13) score += 15;

  // Visual agent: can a vision model read the price?
  if (visual?.priceIdentified) score = Math.min(100, score + 3);

  // Feed agent: product data available in feeds
  if (feed && feed.totalProductsInFeeds > 0) score = Math.min(100, score + 5);

  const grade = getGrade(score);
  return {
    id: "product-understanding",
    name: "Product Understanding",
    weight: 0.2,
    score,
    grade,
    summary:
      score >= 70
        ? "Strong structured product data. Agents can parse key product information."
        : score >= 40
          ? "Some product data is available but gaps exist in structured markup."
          : "Product data is poorly structured for agent consumption.",
    agentsCovered: ["browser", "data", "accessibility"],
  };
}

function scoreNavigation(browser: BrowserAgentResult, a11y: AccessibilityAgentResult, visual?: VisualAgentResult): CategoryScore {
  let score = 0;
  if (!browser.cookieConsentFound) score += 15;
  else {
    const cookieStep = browser.steps.find((s) => s.action.includes("cookie"));
    if (cookieStep?.result === "pass") score += 15;
    else if (cookieStep?.result === "partial") score += 8;
  }

  const variantStep = browser.steps.find((s) => s.action.includes("variant"));
  if (variantStep?.result === "pass") score += 25;
  else if (variantStep?.result === "partial") score += 12;

  const unlabeledRatio = a11y.interactiveElements > 0 ? a11y.unlabeledElements / a11y.interactiveElements : 1;
  if (unlabeledRatio < 0.05) score += 20;
  else if (unlabeledRatio < 0.15) score += 15;
  else if (unlabeledRatio < 0.3) score += 8;

  const kbStep = a11y.steps.find((s) => s.action.includes("keyboard"));
  if (kbStep?.result === "pass") score += 20;
  else if (kbStep?.result === "partial") score += 10;

  const interactionStep = a11y.steps.find((s) => s.action.includes("interaction") || s.action.includes("key interaction"));
  if (interactionStep?.result === "pass") score += 20;
  else if (interactionStep?.result === "partial") score += 10;

  // Visual agent: low clutter = easier to navigate visually
  if (visual && visual.visualClutterScore >= 70) score = Math.min(100, score + 5);

  const grade = getGrade(score);
  return {
    id: "navigation-interaction",
    name: "Navigation & Interaction",
    weight: 0.2,
    score,
    grade,
    summary:
      score >= 70
        ? "Most interactive elements are accessible to agents."
        : score >= 40
          ? "Some interactions work but agents face friction with custom components."
          : "Agents cannot reliably interact with the site's interactive elements.",
    agentsCovered: ["browser", "accessibility"],
  };
}

function scoreCartCheckout(browser: BrowserAgentResult, data: DataAgentResult, visual?: VisualAgentResult): CategoryScore {
  let score = 0;
  if (browser.addToCartSuccess) score += 35;
  if (browser.checkoutReached) score += 25;
  if (browser.guestCheckoutAvailable) score += 25;
  else if (browser.checkoutReached) score += 5;
  if (data.apiEndpoints.found.length > 0) score += 15;

  // Visual agent: CTA clearly identifiable and distinct
  if (visual?.addToCartIdentified && visual?.ctaDistinct) score = Math.min(100, score + 5);
  else if (visual?.addToCartIdentified) score = Math.min(100, score + 2);

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
  if (!browser.blockedByBot) score += 35;
  if (!browser.captchaDetected) score += 25;

  const homepageStep = browser.steps.find((s) => s.action.includes("homepage"));
  if (homepageStep) {
    if (homepageStep.duration < 5000) score += 20;
    else if (homepageStep.duration < 10000) score += 10;
  }

  if (data.meta.htmlSize > 1000) score += 20;
  else if (data.meta.htmlSize > 0) score += 10;

  const grade = getGrade(score);
  return {
    id: "performance-resilience",
    name: "Performance & Resilience",
    weight: 0.05,
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

function scoreDataStandards(data: DataAgentResult, feed?: FeedAgentResult): CategoryScore {
  let score = 0;
  if (data.robotsTxt.found) {
    if (data.robotsTxt.blockedAgents.length === 0) score += 20;
    else if (data.robotsTxt.blockedAgents.length <= 2) score += 10;
  }

  if (data.sitemap.found) score += 20;
  if (data.openGraph.found) {
    score += 10;
    if (data.openGraph.tags["og:price:amount"]) score += 5;
  }
  if (data.jsonLd.found) score += 25;
  if (data.apiEndpoints.found.length > 0) score += 20;

  // Feed agent: product feeds available
  if (feed) {
    if (feed.hasGoogleMerchantFeed) score = Math.min(100, score + 10);
    if (feed.hasShopifyFeed) score = Math.min(100, score + 5);
    if (feed.feedsDiscovered.length > 0 && feed.feedsDiscovered.some(f => f.missingFields.length === 0))
      score = Math.min(100, score + 5);
  }

  const grade = getGrade(score);
  return {
    id: "data-standards",
    name: "Data Standards & Feeds",
    weight: 0.05,
    score,
    grade,
    summary:
      score >= 70
        ? "Good structured data exposure via standards and feeds."
        : score >= 40
          ? "Some structured data present but gaps in coverage."
          : "Limited structured data for agent consumption.",
    agentsCovered: ["data"],
  };
}

function scoreAgenticCommerce(data: DataAgentResult, feed?: FeedAgentResult): CategoryScore {
  let score = 0;

  // Layer A — ACP Protocol (0-40 pts)
  if (data.acpSupport.supported === true) score += 40;
  else if (data.acpSupport.supported === "unknown") score += 15;
  else {
    // Partial credit for JSON responses on ACP probes
    const jsonProbes = data.acpSupport.probes.filter((p) => p.contentType.includes("json"));
    score += Math.min(20, jsonProbes.length * 10);
  }

  // Layer B — Commerce API (0-35 pts)
  if (data.commerceApis.cartApiFound) score += 15;
  if (data.commerceApis.checkoutApiFound) score += 15;
  if (data.commerceApis.graphqlDetected) score += 5;

  // Layer C — Commerce Data Readiness (0-25 pts)
  const commerceKeywords = /commerce|ordering|purchase|checkout|buy|cart/i;
  if (data.ucpFile.found && data.ucpFile.content && commerceKeywords.test(data.ucpFile.content)) score += 5;
  if (data.llmsTxt.found && data.llmsTxt.content && commerceKeywords.test(data.llmsTxt.content)) score += 5;

  // JSON-LD with Offer/Product having availability and price
  const commerceSchemaTypes = ["Product", "ProductGroup", "IndividualProduct", "ProductModel", "Offer"];
  const hasCommerceJsonLd = data.jsonLd.objects.some((obj) => {
    const item = obj as Record<string, unknown>;
    const itemType = item["@type"];
    const typeMatch = typeof itemType === "string" ? commerceSchemaTypes.includes(itemType) : false;
    if (!typeMatch) return false;
    const offers = item.offers as Record<string, unknown> | undefined;
    // Check top-level, in offers, or in hasVariant
    const hasVariants = Array.isArray(item.hasVariant) && (item.hasVariant as Record<string, unknown>[]).some(
      (v) => {
        const vOffers = v.offers as Record<string, unknown> | undefined;
        return vOffers?.price || vOffers?.availability;
      }
    );
    return offers?.availability || offers?.price || item.availability || item.price || hasVariants;
  });
  if (hasCommerceJsonLd) score += 10;

  // Product feed in sitemap
  if (data.sitemap.found && data.sitemap.url && /product/i.test(data.sitemap.url)) score += 5;

  // Feed agent: feeds enable programmatic product access
  if (feed && feed.feedQualityScore >= 50) score += 5;

  score = Math.min(100, score);
  const grade = getGrade(score);
  return {
    id: "agentic-commerce",
    name: "Agentic Commerce",
    weight: 0.1,
    score,
    grade,
    summary:
      score >= 70
        ? "Strong support for programmatic agent commerce. ACP or equivalent APIs detected."
        : score >= 40
          ? "Some commerce API capabilities detected but no full agentic checkout flow."
          : "No programmatic commerce endpoints detected. Agents must rely on browser automation.",
    agentsCovered: ["data"],
  };
}

// ---- Journey Builder ----

function buildJourneys(
  siteUrl: string,
  browser: BrowserAgentResult,
  data: DataAgentResult,
  a11y: AccessibilityAgentResult,
  visual?: VisualAgentResult,
  feed?: FeedAgentResult
): AgentJourney[] {
  const journeys: AgentJourney[] = [
    {
      agentType: "browser",
      agentName: "Browser Agent",
      agentDescription: "Navigates your site like a personal AI agent — clicking links, filling forms, interacting with the DOM.",
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
        humanAgentGaps: s.humanAgentGaps,
      })),
    },
    {
      agentType: "data",
      agentName: "Data Agent",
      agentDescription: "Reads structured data, APIs, and feeds to understand your product catalog without rendering pages.",
      overallResult: data.schemaOrg.found && data.sitemap.found ? "pass" : data.jsonLd.found ? "partial" : "fail",
      narrative: buildDataNarrative(data),
      steps: buildDataSteps(data),
    },
    {
      agentType: "accessibility",
      agentName: "Accessibility Agent",
      agentDescription: "Uses the accessibility tree and ARIA labels to interact with your site without visual rendering.",
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

  // Visual Agent journey (if available)
  if (visual && visual.steps.length > 0) {
    journeys.push({
      agentType: "browser", // Uses browser type since it's visual/browser-based
      agentName: "Visual Agent",
      agentDescription: "Takes screenshots and uses AI vision to identify buttons, prices, and CTAs — testing what multimodal agents like Claude Computer Use actually see.",
      overallResult: visual.overallResult,
      narrative: visual.narrative,
      steps: visual.steps.map((s) => ({
        stepNumber: s.stepNumber,
        action: s.action,
        description: s.description,
        result: s.result,
        narration: s.narration,
        thought: s.thought,
        screenshotUrl: s.screenshotPath,
        duration: s.duration,
      })),
    });
  }

  // Feed Agent journey (if available)
  if (feed && feed.steps.length > 0) {
    journeys.push({
      agentType: "data", // Uses data type since it's feed/API-based
      agentName: "Feed Agent",
      agentDescription: "Tests whether product feeds (Google Merchant, Shopify, RSS) exist and contain complete product data for AI shopping platforms.",
      overallResult: feed.overallResult,
      narrative: feed.narrative,
      steps: feed.steps.map((s) => ({
        stepNumber: s.stepNumber,
        action: s.action,
        description: s.description,
        result: s.result,
        narration: s.narration,
        thought: s.thought,
        duration: s.duration,
      })),
    });
  }

  return journeys;
}

function buildDataNarrative(data: DataAgentResult): string {
  const parts: string[] = [];
  parts.push(`I analyzed the structured data on the site. ${data.meta.title ? `Page title: "${data.meta.title}".` : ""} The raw HTML is ${Math.round(data.meta.htmlSize / 1024)}KB.`);
  if (data.schemaOrg.found) {
    const fields = Object.entries(data.schemaOrg.fields).filter(([, v]) => v).map(([k]) => k);
    parts.push(`Found Schema.org ${data.schemaOrg.type} markup with fields: ${fields.join(", ")}.`);
  } else {
    parts.push("No Schema.org Product markup found.");
  }
  if (data.openGraph.found) parts.push(`Open Graph tags present: ${Object.keys(data.openGraph.tags).join(", ")}.`);
  if (data.robotsTxt.found) {
    if (data.robotsTxt.blockedAgents.length > 0) parts.push(`robots.txt blocks: ${data.robotsTxt.blockedAgents.join(", ")}.`);
    else parts.push("robots.txt allows all major AI user agents.");
  }
  if (data.sitemap.found) parts.push(`Sitemap found with ~${data.sitemap.productUrls} URLs.`);
  if (data.apiEndpoints.found.length > 0) parts.push(`API endpoints found: ${data.apiEndpoints.found.join(", ")}.`);
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
    result: (data.robotsTxt.found ? (data.robotsTxt.blockedAgents.length === 0 ? "pass" : "partial") : "fail") as "pass" | "partial" | "fail",
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

  // ACP probe step
  const acpJsonProbes = data.acpSupport.probes.filter((p) => p.contentType.includes("json"));
  steps.push({
    stepNumber: stepNum++,
    action: "Probe ACP endpoints",
    description: "Testing for Agentic Commerce Protocol (ACP) support",
    result: (data.acpSupport.supported === true ? "pass" : data.acpSupport.supported === "unknown" ? "partial" : "fail") as "pass" | "partial" | "fail",
    narration: data.acpSupport.supported === true
      ? `ACP support detected! ${data.acpSupport.discoveryDoc.found ? "Discovery document found at .well-known/acp." : "Checkout session endpoints respond with JSON."}`
      : data.acpSupport.supported === "unknown"
        ? `Possible ACP support — ${acpJsonProbes.length} probe(s) returned JSON responses, but no definitive checkout session structure found.`
        : `No ACP endpoints detected. Probed ${data.acpSupport.probes.length} paths with no JSON API responses.`,
    thought: data.acpSupport.supported === true
      ? "ACP protocol supported. Agents can use programmatic checkout."
      : "No ACP. Agents must use browser-based checkout.",
    duration: 1500,
  });

  // Commerce API probe step
  steps.push({
    stepNumber: stepNum++,
    action: "Probe commerce APIs",
    description: "Testing for cart, checkout, and GraphQL commerce endpoints",
    result: (data.commerceApis.cartApiFound || data.commerceApis.checkoutApiFound ? "pass" : data.commerceApis.graphqlDetected ? "partial" : "fail") as "pass" | "partial" | "fail",
    narration: data.commerceApis.endpoints.length > 0
      ? `Commerce API endpoints found: ${data.commerceApis.endpoints.join(", ")}. ${data.commerceApis.headlessSignals.length > 0 ? `Signals: ${data.commerceApis.headlessSignals.join(", ")}.` : ""}`
      : "No programmatic cart or checkout APIs detected.",
    thought: data.commerceApis.cartApiFound
      ? "Cart API available for programmatic commerce."
      : "No commerce APIs. Agents cannot programmatically manage cart.",
    duration: 1200,
  });

  return steps;
}

// ---- Findings Builder ----

function buildFindings(
  data: DataAgentResult,
  browser: BrowserAgentResult,
  a11y: AccessibilityAgentResult,
  visual?: VisualAgentResult,
  feed?: FeedAgentResult
): Finding[] {
  const findings: Finding[] = [];
  let priority = 1;

  if (browser.blockedByBot) {
    findings.push({
      id: `f${priority}`, severity: "critical", category: "performance-resilience",
      title: "Site blocks automated agents with bot detection",
      whatHappened: "The Browser Agent was blocked by bot detection on the first page load.",
      whyItMatters: "If your site blocks automated agents, personal AI agents sent by consumers cannot interact with your store at all.",
      affectedAgents: [{ name: "Browser Agent", impact: "blocked" }, { name: "Accessibility Agent", impact: "blocked" }],
      fix: { summary: "Whitelist known AI agent user agents or implement more nuanced bot detection.", technicalDetail: "Consider allowing requests from known AI user agents (GPTBot, ClaudeBot, PerplexityBot) while maintaining protection against scrapers.", effortEstimate: "2-4 hours" },
      priority: priority++, effort: "medium", estimatedPointsGain: 25,
    });
  }

  if (browser.checkoutReached && !browser.guestCheckoutAvailable) {
    findings.push({
      id: `f${priority}`, severity: "critical", category: "cart-checkout",
      title: "No guest checkout — agents cannot complete purchases",
      whatHappened: "The checkout flow requires signing in or creating an account.",
      whyItMatters: "Personal AI agents cannot create accounts on behalf of their owners.",
      affectedAgents: [{ name: "Browser Agent", impact: "blocked" }, { name: "Accessibility Agent", impact: "blocked" }],
      fix: { summary: "Enable guest checkout.", technicalDetail: "Add a guest checkout path that allows purchase with email + shipping address only.", effortEstimate: "4-8 hours" },
      priority: priority++, effort: "medium", estimatedPointsGain: 15,
    });
  }

  if (!browser.addToCartSuccess) {
    findings.push({
      id: `f${priority}`, severity: "critical", category: "cart-checkout",
      title: "Add-to-cart button not accessible to agents",
      whatHappened: "The Browser Agent could not find or click the add-to-cart button.",
      whyItMatters: "If agents can't add products to cart, they can't complete any purchase.",
      affectedAgents: [{ name: "Browser Agent", impact: "blocked" }, { name: "Accessibility Agent", impact: "blocked" }],
      fix: { summary: 'Ensure the add-to-cart button is a standard <button> element with clear labeling.', technicalDetail: 'Use a native <button> element with aria-label="Add to Cart".', effortEstimate: "1-2 hours" },
      priority: priority++, effort: "low", estimatedPointsGain: 15,
    });
  }

  if (browser.cookieConsentFound) {
    const cookieStep = browser.steps.find((s) => s.action.includes("cookie"));
    if (cookieStep?.result !== "pass") {
      findings.push({
        id: `f${priority}`, severity: "high", category: "navigation-interaction",
        title: "Cookie consent banner blocks agent interaction",
        whatHappened: "A cookie consent overlay appeared and couldn't be easily dismissed.",
        whyItMatters: "Cookie consent overlays block the entire page until dismissed.",
        affectedAgents: [{ name: "Browser Agent", impact: "degraded" }, { name: "Accessibility Agent", impact: "degraded" }],
        fix: { summary: 'Ensure the cookie dismiss button has a clear, consistent ID or aria-label.', technicalDetail: 'Use id="accept-cookies" or aria-label="Accept All Cookies".', effortEstimate: "30 minutes" },
        priority: priority++, effort: "low", estimatedPointsGain: 5,
      });
    }
  }

  if (!data.schemaOrg.found) {
    findings.push({
      id: `f${priority}`, severity: "high", category: "product-understanding",
      title: "No Schema.org Product markup found",
      whatHappened: "The page does not contain Schema.org Product structured data.",
      whyItMatters: "Without Product schema, data agents cannot programmatically understand product details.",
      affectedAgents: [{ name: "Data Agent", impact: "blocked" }],
      fix: { summary: "Add JSON-LD Product schema to product pages.", technicalDetail: 'Add a <script type="application/ld+json"> block with Schema.org Product data.', effortEstimate: "2-3 hours" },
      priority: priority++, effort: "low", estimatedPointsGain: 10,
    });
  }

  if (a11y.unlabeledElements > 5) {
    findings.push({
      id: `f${priority}`, severity: "medium", category: "navigation-interaction",
      title: `${a11y.unlabeledElements} interactive elements lack accessible labels`,
      whatHappened: `The Accessibility Agent found ${a11y.unlabeledElements} interactive elements without aria-label or text content.`,
      whyItMatters: "Agents navigating via the accessibility tree can't identify or interact with unlabeled elements.",
      affectedAgents: [{ name: "Accessibility Agent", impact: "degraded" }, { name: "Browser Agent", impact: "degraded" }],
      fix: { summary: "Add aria-label attributes to all interactive elements.", technicalDetail: "Audit all buttons, links, and form inputs.", effortEstimate: "2-4 hours" },
      priority: priority++, effort: "medium", estimatedPointsGain: 5,
    });
  }

  if (data.robotsTxt.blockedAgents.length > 0) {
    findings.push({
      id: `f${priority}`, severity: "medium", category: "data-standards",
      title: `robots.txt blocks ${data.robotsTxt.blockedAgents.length} AI agent(s)`,
      whatHappened: `The robots.txt file blocks: ${data.robotsTxt.blockedAgents.join(", ")}.`,
      whyItMatters: "Personal agents built on these platforms will refuse to crawl your site.",
      affectedAgents: data.robotsTxt.blockedAgents.map((a) => ({ name: `Agents using ${a}`, impact: "blocked" as const })),
      fix: { summary: "Selectively allow AI agents on product pages.", technicalDetail: "Update robots.txt to allow AI agents on product and category pages.", effortEstimate: "15 minutes" },
      priority: priority++, effort: "low", estimatedPointsGain: 3,
    });
  }

  if (!data.sitemap.found) {
    findings.push({
      id: `f${priority}`, severity: "medium", category: "data-standards",
      title: "No XML sitemap found",
      whatHappened: "No sitemap was found at standard locations.",
      whyItMatters: "Without a sitemap, agents must discover products by crawling.",
      affectedAgents: [{ name: "Data Agent", impact: "degraded" }],
      fix: { summary: "Generate and publish an XML sitemap.", technicalDetail: "Create a sitemap.xml that lists all product URLs.", effortEstimate: "1-2 hours" },
      priority: priority++, effort: "low", estimatedPointsGain: 3,
    });
  }

  if (data.openGraph.found && !data.openGraph.tags["og:price:amount"]) {
    findings.push({
      id: `f${priority}`, severity: "low", category: "product-understanding",
      title: "Open Graph tags missing price data",
      whatHappened: "OG tags exist but og:price:amount and og:price:currency are missing.",
      whyItMatters: "Some agents use OG tags as a quick way to parse product info.",
      affectedAgents: [{ name: "Data Agent", impact: "degraded" }],
      fix: { summary: "Add og:price:amount and og:price:currency meta tags.", technicalDetail: "Add to the <head> of product pages.", effortEstimate: "15 minutes" },
      priority: priority++, effort: "low", estimatedPointsGain: 2,
    });
  }

  // ACP / Agentic Commerce findings
  if (data.acpSupport.supported === false) {
    findings.push({
      id: `f${priority}`, severity: "medium", category: "agentic-commerce",
      title: "No ACP endpoints detected",
      whatHappened: "No Agentic Commerce Protocol (ACP) endpoints were found at standard paths (/.well-known/acp, /checkout_sessions, /acp/checkout_sessions).",
      whyItMatters: "ACP enables AI agents to programmatically create checkout sessions without browser automation, providing a faster and more reliable commerce experience.",
      affectedAgents: [{ name: "Data Agent", impact: "degraded" }],
      fix: { summary: "Implement ACP endpoints for programmatic checkout.", technicalDetail: "Expose HTTPS/JSON endpoints at /.well-known/acp for discovery and /checkout_sessions for session management. See the ACP specification (Stripe + OpenAI) for details.", effortEstimate: "1-2 weeks" },
      priority: priority++, effort: "high", estimatedPointsGain: 4,
    });
  }

  if (!data.commerceApis.cartApiFound && !data.commerceApis.checkoutApiFound) {
    findings.push({
      id: `f${priority}`, severity: "high", category: "agentic-commerce",
      title: "No programmatic cart/checkout API",
      whatHappened: "No cart or checkout API endpoints were found. Agents cannot manage cart or checkout programmatically.",
      whyItMatters: "Without a cart/checkout API, agents must use slower and less reliable browser automation to complete purchases.",
      affectedAgents: [{ name: "Data Agent", impact: "blocked" }, { name: "Browser Agent", impact: "degraded" }],
      fix: { summary: "Expose a cart and checkout API for programmatic access.", technicalDetail: "Implement REST or GraphQL endpoints for cart management (/api/cart) and checkout initiation (/api/checkout). Shopify sites can leverage the existing cart.js and Storefront API.", effortEstimate: "1-2 weeks" },
      priority: priority++, effort: "high", estimatedPointsGain: 6,
    });
  }

  const hasAvailabilityPricing = data.jsonLd.objects.some((obj) => {
    const item = obj as Record<string, unknown>;
    const offers = item.offers as Record<string, unknown> | undefined;
    if (offers?.availability && offers?.price) return true;
    // Check hasVariant (ProductGroup pattern)
    if (Array.isArray(item.hasVariant)) {
      return (item.hasVariant as Record<string, unknown>[]).some((v) => {
        const vOffers = v.offers as Record<string, unknown> | undefined;
        return vOffers?.availability && vOffers?.price;
      });
    }
    return false;
  });
  if (!hasAvailabilityPricing && data.schemaOrg.found) {
    findings.push({
      id: `f${priority}`, severity: "medium", category: "agentic-commerce",
      title: "Product data lacks availability/pricing for agent commerce",
      whatHappened: "Product structured data does not include both availability and price in offers, which agents need to make purchase decisions.",
      whyItMatters: "Agents need to know if a product is in stock and how much it costs before initiating a checkout flow.",
      affectedAgents: [{ name: "Data Agent", impact: "degraded" }],
      fix: { summary: "Add availability and price fields to Product schema offers.", technicalDetail: "In your JSON-LD Product markup, ensure offers includes schema.org/availability (e.g., InStock) and price with priceCurrency.", effortEstimate: "1-2 hours" },
      priority: priority++, effort: "low", estimatedPointsGain: 3,
    });
  }

  // ── Visual Agent findings ──
  if (visual) {
    if (!visual.addToCartIdentified) {
      findings.push({
        id: `f${priority}`, severity: "high", category: "cart-checkout",
        title: "Add-to-cart button not identifiable by vision AI",
        whatHappened: "The Visual Agent (using AI vision) could not clearly identify the add-to-cart button from a screenshot of the product page.",
        whyItMatters: "Multimodal AI agents like Claude Computer Use navigate by looking at screenshots. If they can't visually identify the purchase button, they can't buy.",
        affectedAgents: [{ name: "Visual Agent", impact: "blocked" }],
        fix: { summary: "Make the add-to-cart button visually prominent — use a contrasting color, larger size, and clear label text.", technicalDetail: "Ensure the CTA button has high contrast ratio (4.5:1+), is larger than surrounding buttons, and uses unambiguous text like 'Add to Cart' or 'Buy Now'.", effortEstimate: "1-2 hours" },
        priority: priority++, effort: "low", estimatedPointsGain: 5,
      });
    }
    if (!visual.ctaDistinct && visual.addToCartIdentified) {
      findings.push({
        id: `f${priority}`, severity: "medium", category: "navigation-interaction",
        title: "Add-to-cart button visually similar to other buttons",
        whatHappened: "The add-to-cart button exists but looks similar to other buttons on the page, creating ambiguity for vision-based AI agents.",
        whyItMatters: "When multiple buttons look alike, vision agents may click the wrong one — adding to wishlist instead of cart, for example.",
        affectedAgents: [{ name: "Visual Agent", impact: "degraded" }],
        fix: { summary: "Differentiate the primary CTA from secondary actions using color, size, or visual weight.", technicalDetail: "Use a distinct fill color for the primary CTA and outline/ghost styles for secondary actions.", effortEstimate: "30 minutes" },
        priority: priority++, effort: "low", estimatedPointsGain: 3,
      });
    }
    if (visual.visualClutterScore < 40) {
      findings.push({
        id: `f${priority}`, severity: "medium", category: "navigation-interaction",
        title: "High visual clutter confuses AI vision agents",
        whatHappened: "The page layout has high visual density, making it difficult for AI vision models to parse interactive elements.",
        whyItMatters: "Vision-based agents process screenshots like humans do — cluttered layouts slow them down and increase misclick rates.",
        affectedAgents: [{ name: "Visual Agent", impact: "degraded" }],
        fix: { summary: "Simplify the product page layout — reduce competing elements, increase whitespace around CTAs.", technicalDetail: "Remove promotional banners, reduce sidebar content, and ensure the primary product area has clear visual hierarchy.", effortEstimate: "2-4 hours" },
        priority: priority++, effort: "medium", estimatedPointsGain: 3,
      });
    }
  }

  // ── Feed Agent findings ──
  if (feed) {
    if (!feed.hasGoogleMerchantFeed && !feed.hasShopifyFeed) {
      findings.push({
        id: `f${priority}`, severity: "high", category: "data-standards",
        title: "No product feeds for AI shopping platforms",
        whatHappened: "No Google Merchant, Shopify, or product RSS feed was found at standard paths.",
        whyItMatters: "AI shopping agents like ChatGPT Shopping and Google AI Mode discover products through feeds, not by browsing. Without a feed, your products are invisible to feed-based agents.",
        affectedAgents: [{ name: "Feed Agent", impact: "blocked" }],
        fix: { summary: "Publish a Google Merchant Center product feed or expose /products.json.", technicalDetail: "Create an XML feed following Google's product data specification at a standard path like /feed/google-merchant.xml. For Shopify stores, ensure /products.json is publicly accessible.", effortEstimate: "4-8 hours" },
        priority: priority++, effort: "medium", estimatedPointsGain: 5,
      });
    }
    for (const feedInfo of feed.feedsDiscovered) {
      if (feedInfo.missingFields.length > 0) {
        findings.push({
          id: `f${priority}`, severity: "medium", category: "data-standards",
          title: `Product feed missing fields: ${feedInfo.missingFields.join(", ")}`,
          whatHappened: `The ${feedInfo.type} feed at ${feedInfo.url} is missing required fields: ${feedInfo.missingFields.join(", ")}.`,
          whyItMatters: "Incomplete product data in feeds means AI shopping agents can't display accurate prices, availability, or images to users.",
          affectedAgents: [{ name: "Feed Agent", impact: "degraded" }],
          fix: { summary: `Add missing fields (${feedInfo.missingFields.join(", ")}) to your product feed.`, technicalDetail: "Update your feed generation to include all required Google Merchant Center fields: title, price, availability, image_link, and link.", effortEstimate: "1-2 hours" },
          priority: priority++, effort: "low", estimatedPointsGain: 3,
        });
        break; // Only report once
      }
    }
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
