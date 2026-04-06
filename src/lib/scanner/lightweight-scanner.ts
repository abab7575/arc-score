/**
 * Lightweight Scanner — HTTP-only, no Puppeteer, no Claude API.
 * Runs ~25 HTTP requests per brand. Designed to scan 500+ brands in minutes.
 *
 * Collects: robots.txt, UA testing, structured data, feeds,
 * platform/CDN/WAF detection, security headers, response time.
 */

import { fetchWithRetry } from "./fetch-with-retry";
import robotsParser from "robots-parser";
import type { UserAgentTestResult } from "./data-agent";

// ── Types ──────────────────────────────────────────────────────────

export interface LightweightScanResult {
  // Robots.txt
  robotsTxt: {
    status: "found" | "not_found" | "inconclusive";
    found: boolean; // true only when status === "found" (backwards compat)
    content?: string;
    blockedAgents: string[];
    allowedAgents: string[];
  };

  // Per-agent UA testing
  userAgentTests: UserAgentTestResult[];

  // Structured data
  jsonLd: { found: boolean; types: string[] };
  schemaOrg: { found: boolean; type?: string };
  openGraph: { found: boolean; tags: Record<string, string> };

  // Sitemaps & feeds
  sitemap: { found: boolean; url?: string };
  feeds: Array<{ url: string; type: string; found: boolean }>;

  // Protocol files
  ucpFile: { found: boolean };
  llmsTxt: {
    found: boolean;
    bytes: number;
    linkCount: number;
    hasH1: boolean;
    hasSummary: boolean;
  };
  agentsTxt: { found: boolean; variant: "agents.txt" | "agents-brief.txt" | null };

  // Infrastructure detection
  platform: { platform: string; confidence: string; signals: string[] };
  cdn: { cdn: string; detected: boolean };
  waf: { waf: string; detected: boolean };
  securityHeaders: { hsts: boolean; csp: boolean; xFrameOptions: boolean; permissionsPolicy: boolean };

  // Performance
  responseTime: { homepage: number; robotsTxt: number };

  // Meta
  scannedAt: string;
  scanDurationMs: number;
}

// ── Constants ──────────────────────────────────────────────────────

const AI_USER_AGENTS = [
  "GPTBot", "ChatGPT-User", "ClaudeBot", "Claude-Web",
  "PerplexityBot", "Google-Extended", "CCBot", "Amazonbot",
];

const USER_AGENT_STRINGS: { ua: string; label: string }[] = [
  { ua: "GPTBot/1.0", label: "GPTBot" },
  { ua: "ChatGPT-User/1.0", label: "ChatGPT-User" },
  { ua: "PerplexityBot/1.0", label: "PerplexityBot" },
  { ua: "ClaudeBot/1.0", label: "ClaudeBot" },
  { ua: "Google-Extended", label: "Google-Extended" },
  { ua: "Amazonbot/1.0", label: "Amazonbot" },
  { ua: "CCBot/2.0", label: "CCBot" },
  { ua: "Bingbot/2.0", label: "Bingbot" },
];

const BOT_BLOCK_PATTERNS = [
  /captcha/i, /access[\s-]?denied/i, /\bblocked\b/i,
  /challenge[\s-]?page/i, /please verify/i, /are you a (human|robot)/i,
  /bot[\s-]?detected/i, /automated[\s-]?access/i, /cf-challenge/i,
  /checking your browser/i, /just a moment/i,
  /enable javascript and cookies/i, /cloudflare/i, /datadome/i,
  /perimeterx/i, /distil/i, /incapsula/i, /imperva/i,
];

const CHROME_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

// ── Main Entry Point ───────────────────────────────────────────────

export async function runLightweightScan(
  url: string,
  productUrl?: string
): Promise<LightweightScanResult> {
  const startTime = Date.now();
  const baseUrl = url.startsWith("http") ? url : `https://${url}`;
  const targetProductUrl = productUrl || baseUrl;

  // Run independent checks in parallel
  const [
    { html: homepageHtml, responseMs: homepageMs, headers: homepageHeaders },
    robotsTxtResult,
    ucpResult,
    llmsTxtResult,
    agentsTxtResult,
    sitemapResult,
    feedResults,
  ] = await Promise.all([
    fetchHomepage(baseUrl),
    checkRobotsTxt(baseUrl),
    checkFile(`${baseUrl}/.well-known/ucp`, "UCP"),
    checkLlmsTxt(baseUrl),
    checkAgentsTxt(baseUrl),
    checkSitemap(baseUrl),
    checkFeeds(baseUrl),
  ]);

  // Parse structured data from homepage HTML
  const jsonLd = parseJsonLd(homepageHtml);
  const schemaOrg = analyzeSchemaOrg(jsonLd.objects);
  const openGraph = parseOpenGraph(homepageHtml);

  // Detect infrastructure from headers + HTML
  const platform = detectPlatform(homepageHtml, homepageHeaders, baseUrl);
  const cdn = detectCDN(homepageHeaders);
  const waf = detectWAF(homepageHeaders, homepageHtml);
  const securityHeaders = analyzeSecurityHeaders(homepageHeaders);

  // UA testing (the most request-heavy part — 16 requests)
  const userAgentTests = await testUserAgentAccess(baseUrl, targetProductUrl);

  const scanDurationMs = Date.now() - startTime;

  return {
    robotsTxt: robotsTxtResult,
    userAgentTests,
    jsonLd: { found: jsonLd.found, types: jsonLd.types },
    schemaOrg: { found: schemaOrg.found, type: schemaOrg.type },
    openGraph,
    sitemap: sitemapResult,
    feeds: feedResults,
    ucpFile: { found: ucpResult },
    llmsTxt: llmsTxtResult,
    agentsTxt: agentsTxtResult,
    platform,
    cdn,
    waf,
    securityHeaders,
    responseTime: { homepage: homepageMs, robotsTxt: 0 },
    scannedAt: new Date().toISOString(),
    scanDurationMs,
  };
}

// ── Homepage Fetch ─────────────────────────────────────────────────

async function fetchHomepage(baseUrl: string): Promise<{
  html: string;
  responseMs: number;
  headers: Record<string, string>;
}> {
  const start = Date.now();
  const res = await fetchWithRetry(
    baseUrl,
    {
      headers: {
        "User-Agent": CHROME_UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    },
    { timeoutMs: 15000, maxAttempts: 2, label: `[Lightweight] homepage ${baseUrl}` }
  );

  const responseMs = Date.now() - start;
  if (!res) return { html: "", responseMs, headers: {} };

  const headers: Record<string, string> = {};
  res.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const html = await res.text();
  return { html, responseMs, headers };
}

// ── Robots.txt ─────────────────────────────────────────────────────

async function checkRobotsTxt(baseUrl: string): Promise<LightweightScanResult["robotsTxt"]> {
  const INCONCLUSIVE: LightweightScanResult["robotsTxt"] = {
    status: "inconclusive", found: false, blockedAgents: [], allowedAgents: [],
  };
  const NOT_FOUND: LightweightScanResult["robotsTxt"] = {
    status: "not_found", found: false, blockedAgents: [], allowedAgents: [],
  };

  let res: Response | null;
  try {
    res = await fetchWithRetry(
      `${baseUrl}/robots.txt`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ARCReport-Scanner/1.0; +https://arcreport.ai)" },
        redirect: "follow",
      },
      { timeoutMs: 10000, maxAttempts: 3, label: `[Lightweight] robots.txt ${baseUrl}` }
    );
  } catch {
    // Network error / timeout after all retries → inconclusive
    return INCONCLUSIVE;
  }

  // fetchWithRetry returns null when all attempts fail (timeout/network)
  if (!res) return INCONCLUSIVE;

  // Distinguish definitive 404 from transient failures
  if (res.status === 404) return NOT_FOUND;
  if (res.status === 403 || res.status === 429 || res.status >= 500) return INCONCLUSIVE;
  if (!res.ok) return INCONCLUSIVE;

  // Got a 200 — check content type
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html")) {
    // Soft-404: site serves an HTML page for /robots.txt → treat as not found
    return NOT_FOUND;
  }

  const content = await res.text();
  if (!content.trim()) return NOT_FOUND;

  // Parse with robots-parser (spec-compliant: wildcard fallback, Allow/Disallow precedence)
  const robotsUrl = `${baseUrl}/robots.txt`;
  const robot = robotsParser(robotsUrl, content);

  const blockedAgents: string[] = [];
  const allowedAgents: string[] = [];

  for (const agent of AI_USER_AGENTS) {
    // robots-parser checks agent-specific section first, falls back to User-agent: *
    const testUrl = `${baseUrl}/`;
    if (robot.isAllowed(testUrl, agent) === false) {
      blockedAgents.push(agent);
    } else {
      allowedAgents.push(agent);
    }
  }

  return { status: "found", found: true, content, blockedAgents, allowedAgents };
}

// ── Simple File Checks (UCP) ───────────────────────────────────────

async function checkFile(url: string, label: string): Promise<boolean> {
  const res = await fetchWithRetry(
    url,
    { headers: { "User-Agent": "ARCReport-Scanner/1.0" } },
    { timeoutMs: 10000, maxAttempts: 2, label: `[Lightweight] ${label}` }
  );
  if (!res || !res.ok) return false;
  const content = await res.text();
  if (content.startsWith("<!") || content.startsWith("<html")) return false;
  return content.length > 0;
}

// ── llms.txt (presence + lightweight quality signals) ──────────────

async function checkLlmsTxt(baseUrl: string): Promise<LightweightScanResult["llmsTxt"]> {
  const empty = { found: false, bytes: 0, linkCount: 0, hasH1: false, hasSummary: false };

  const res = await fetchWithRetry(
    `${baseUrl}/llms.txt`,
    { headers: { "User-Agent": "ARCReport-Scanner/1.0" } },
    { timeoutMs: 10000, maxAttempts: 2, label: `[Lightweight] llms.txt` }
  );
  if (!res || !res.ok) return empty;

  // Reject HTML responses (sites that serve a soft-404 for unknown paths)
  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("text/html")) return empty;

  const content = await res.text();
  if (!content.length) return empty;
  const head = content.trimStart().slice(0, 16).toLowerCase();
  if (head.startsWith("<!") || head.startsWith("<html")) return empty;

  // Quality observations — per llmstxt.org: H1 title + blockquote summary + markdown links
  const hasH1 = /^#\s+\S/m.test(content);
  const hasSummary = /^>\s+\S/m.test(content);
  const linkMatches = content.match(/\[[^\]]+\]\([^)]+\)/g);
  const linkCount = linkMatches ? linkMatches.length : 0;

  return {
    found: true,
    bytes: Buffer.byteLength(content, "utf8"),
    linkCount,
    hasH1,
    hasSummary,
  };
}

// ── agents.txt / agents-brief.txt (presence) ───────────────────────

async function checkAgentsTxt(baseUrl: string): Promise<LightweightScanResult["agentsTxt"]> {
  const candidates: Array<{ path: string; variant: "agents.txt" | "agents-brief.txt" }> = [
    { path: "/agents.txt", variant: "agents.txt" },
    { path: "/agents-brief.txt", variant: "agents-brief.txt" },
    { path: "/.well-known/agents.txt", variant: "agents.txt" },
  ];

  for (const { path, variant } of candidates) {
    const res = await fetchWithRetry(
      `${baseUrl}${path}`,
      { headers: { "User-Agent": "ARCReport-Scanner/1.0" } },
      { timeoutMs: 10000, maxAttempts: 1, label: `[Lightweight] ${path}` }
    );
    if (!res || !res.ok) continue;

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("text/html")) continue;

    const content = await res.text();
    if (!content.length) continue;
    const head = content.trimStart().slice(0, 16).toLowerCase();
    if (head.startsWith("<!") || head.startsWith("<html")) continue;

    return { found: true, variant };
  }

  return { found: false, variant: null };
}

// ── Sitemap Check ──────────────────────────────────────────────────

async function checkSitemap(baseUrl: string): Promise<{ found: boolean; url?: string }> {
  const paths = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap_products.xml"];
  for (const path of paths) {
    const res = await fetchWithRetry(
      `${baseUrl}${path}`,
      { headers: { "User-Agent": CHROME_UA } },
      { timeoutMs: 10000, maxAttempts: 1, label: `[Lightweight] sitemap ${path}` }
    );
    if (res && res.ok) {
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("xml") || contentType.includes("text/plain")) {
        return { found: true, url: `${baseUrl}${path}` };
      }
      // Some sites serve sitemap as text/html but it's still XML
      const text = await res.text();
      if (text.includes("<urlset") || text.includes("<sitemapindex")) {
        return { found: true, url: `${baseUrl}${path}` };
      }
    }
  }
  return { found: false };
}

// ── Feed Discovery ─────────────────────────────────────────────────

async function checkFeeds(baseUrl: string): Promise<LightweightScanResult["feeds"]> {
  const feedPaths: { path: string; type: string }[] = [
    { path: "/products.json", type: "product-json" },
    { path: "/feed/products.xml", type: "google-shopping" },
    { path: "/feed/google-shopping.xml", type: "google-shopping" },
    { path: "/feed/facebook-catalog.xml", type: "facebook-catalog" },
    { path: "/collections/all.atom", type: "atom" },
  ];

  const results = await Promise.all(
    feedPaths.map(async ({ path, type }) => {
      const res = await fetchWithRetry(
        `${baseUrl}${path}`,
        { headers: { "User-Agent": CHROME_UA } },
        { timeoutMs: 10000, maxAttempts: 1, label: `[Lightweight] feed ${path}` }
      );
      const found = res !== null && res.ok && res.status === 200;
      return { url: `${baseUrl}${path}`, type, found };
    })
  );

  return results;
}

// ── Structured Data Parsing ────────────────────────────────────────

function parseJsonLd(html: string): { found: boolean; objects: unknown[]; types: string[] } {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const objects: unknown[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) objects.push(...parsed);
      else objects.push(parsed);
    } catch {
      // invalid JSON-LD
    }
  }

  const types = objects
    .map(o => (o as Record<string, unknown>)["@type"])
    .filter(Boolean)
    .map(t => String(t));

  return { found: objects.length > 0, objects, types };
}

function analyzeSchemaOrg(jsonLdObjects: unknown[]): { found: boolean; type?: string } {
  const productTypes = ["Product", "ProductGroup", "IndividualProduct", "ProductModel"];

  for (const obj of jsonLdObjects) {
    const item = obj as Record<string, unknown>;
    const type = item["@type"];
    if (typeof type === "string" && productTypes.includes(type)) {
      return { found: true, type };
    }
    if (Array.isArray(type) && type.some(t => productTypes.includes(t))) {
      return { found: true, type: type.find(t => productTypes.includes(t)) };
    }
    // Check @graph
    if (item["@graph"] && Array.isArray(item["@graph"])) {
      for (const graphItem of item["@graph"] as Record<string, unknown>[]) {
        const gType = graphItem["@type"];
        if (typeof gType === "string" && productTypes.includes(gType)) {
          return { found: true, type: gType };
        }
      }
    }
  }

  return { found: false };
}

function parseOpenGraph(html: string): { found: boolean; tags: Record<string, string> } {
  const tags: Record<string, string> = {};

  // property="og:..." content="..."
  const regex1 = /<meta[^>]*property=["'](og:[^"']*)["'][^>]*content=["']([^"']*)["']/gi;
  let match;
  while ((match = regex1.exec(html)) !== null) {
    tags[match[1]] = match[2];
  }

  // content="..." property="og:..."
  const regex2 = /<meta[^>]*content=["']([^"']*)["'][^>]*property=["'](og:[^"']*)["']/gi;
  while ((match = regex2.exec(html)) !== null) {
    tags[match[2]] = match[1];
  }

  return { found: Object.keys(tags).length > 0, tags };
}

// ── Platform Detection ─────────────────────────────────────────────

function detectPlatform(
  html: string,
  headers: Record<string, string>,
  _baseUrl: string
): LightweightScanResult["platform"] {
  const signals: string[] = [];
  let platform = "unknown";
  let confidence = "low";

  // Shopify signals
  if (html.includes("Shopify.theme") || html.includes("cdn.shopify.com")) {
    signals.push("Shopify JS/CDN in HTML");
    platform = "shopify";
    confidence = "high";
  } else if (headers["x-shopid"] || headers["x-shopify-stage"]) {
    signals.push("Shopify headers");
    platform = "shopify";
    confidence = "high";
  }

  // BigCommerce
  if (html.includes("BigCommerce") || html.includes("bigcommerce.com")) {
    signals.push("BigCommerce reference in HTML");
    platform = "bigcommerce";
    confidence = "high";
  }

  // Magento
  if (html.includes("Magento") || html.includes("mage-") || html.includes("magento")) {
    signals.push("Magento reference in HTML");
    platform = "magento";
    confidence = "medium";
  }

  // WooCommerce
  if (html.includes("woocommerce") || html.includes("wc-") || html.includes("wp-content")) {
    signals.push("WooCommerce/WordPress in HTML");
    platform = "woocommerce";
    confidence = "medium";
  }

  // Salesforce Commerce Cloud (Demandware)
  if (html.includes("demandware") || html.includes("dw.ac") || html.includes("sfcc")) {
    signals.push("Salesforce Commerce Cloud reference");
    platform = "salesforce";
    confidence = "high";
  }

  // x-powered-by header
  const poweredBy = headers["x-powered-by"] || "";
  if (poweredBy) {
    signals.push(`x-powered-by: ${poweredBy}`);
    if (poweredBy.toLowerCase().includes("next.js")) {
      if (platform === "unknown") { platform = "nextjs"; confidence = "medium"; }
    }
  }

  // meta generator
  const generatorMatch = html.match(/<meta[^>]*name=["']generator["'][^>]*content=["']([^"']*)["']/i);
  if (generatorMatch) {
    signals.push(`meta generator: ${generatorMatch[1]}`);
    const gen = generatorMatch[1].toLowerCase();
    if (gen.includes("shopify") && platform === "unknown") { platform = "shopify"; confidence = "high"; }
    if (gen.includes("wordpress") && platform === "unknown") { platform = "woocommerce"; confidence = "medium"; }
    if (gen.includes("magento") && platform === "unknown") { platform = "magento"; confidence = "medium"; }
  }

  if (platform === "unknown" && signals.length === 0) {
    platform = "custom";
    confidence = "low";
  }

  return { platform, confidence, signals };
}

// ── CDN Detection ──────────────────────────────────────────────────

function detectCDN(headers: Record<string, string>): LightweightScanResult["cdn"] {
  // Cloudflare
  if (headers["cf-ray"] || (headers["server"] || "").toLowerCase().includes("cloudflare")) {
    return { cdn: "cloudflare", detected: true };
  }

  // Fastly
  if (headers["x-served-by"]?.includes("cache-") || headers["x-fastly-request-id"]) {
    return { cdn: "fastly", detected: true };
  }

  // CloudFront
  if (headers["x-amz-cf-id"] || headers["x-amz-cf-pop"]) {
    return { cdn: "cloudfront", detected: true };
  }

  // Akamai
  if ((headers["server"] || "").toLowerCase().includes("akamaighost") || headers["x-akamai-transformed"]) {
    return { cdn: "akamai", detected: true };
  }

  // Vercel
  if (headers["x-vercel-id"] || (headers["server"] || "").toLowerCase().includes("vercel")) {
    return { cdn: "vercel", detected: true };
  }

  // Netlify
  if (headers["x-nf-request-id"]) {
    return { cdn: "netlify", detected: true };
  }

  return { cdn: "unknown", detected: false };
}

// ── WAF Detection ──────────────────────────────────────────────────

function detectWAF(headers: Record<string, string>, html: string): LightweightScanResult["waf"] {
  // DataDome
  if (headers["x-datadome"] || headers["x-dd-b"]) {
    return { waf: "datadome", detected: true };
  }

  // PerimeterX
  if (Object.keys(headers).some(h => h.startsWith("x-px"))) {
    return { waf: "perimeterx", detected: true };
  }

  // Cloudflare WAF (separate from CDN)
  if (headers["cf-mitigated"] || html.includes("cf-challenge")) {
    return { waf: "cloudflare", detected: true };
  }

  // Akamai Bot Manager
  if (headers["x-akamai-session-info"] || (headers["server"] || "").toLowerCase().includes("akamaighost")) {
    return { waf: "akamai", detected: true };
  }

  // Incapsula / Imperva
  if (headers["x-iinfo"] || headers["x-cdn"]?.toLowerCase().includes("incapsula")) {
    return { waf: "incapsula", detected: true };
  }

  // Sucuri
  if (headers["x-sucuri-id"]) {
    return { waf: "sucuri", detected: true };
  }

  return { waf: "none-detected", detected: false };
}

// ── Security Headers ───────────────────────────────────────────────

function analyzeSecurityHeaders(headers: Record<string, string>): LightweightScanResult["securityHeaders"] {
  return {
    hsts: !!headers["strict-transport-security"],
    csp: !!headers["content-security-policy"],
    xFrameOptions: !!headers["x-frame-options"],
    permissionsPolicy: !!headers["permissions-policy"],
  };
}

// ── User-Agent Access Testing ──────────────────────────────────────

async function testUserAgentAccess(
  baseUrl: string,
  productUrl: string
): Promise<UserAgentTestResult[]> {
  // Chrome baselines
  const [chromeHomepage, chromeProduct] = await Promise.all([
    fetchWithUserAgent(baseUrl, CHROME_UA, 0),
    fetchWithUserAgent(productUrl, CHROME_UA, 0),
  ]);

  const tests = USER_AGENT_STRINGS.flatMap(({ ua, label }) => [
    { ua, label, url: baseUrl, pageType: "homepage" as const, baseline: chromeHomepage.contentLength },
    { ua, label, url: productUrl, pageType: "product" as const, baseline: chromeProduct.contentLength },
  ]);

  const results = await Promise.all(
    tests.map(async ({ ua, label, url, pageType, baseline }) => {
      const result = await fetchWithUserAgent(url, ua, baseline);
      // Retry once on blocked/unknown to reduce false positives from transient WAF responses
      if (result.verdict === "blocked" || result.verdict === "unknown") {
        await new Promise(r => setTimeout(r, 2000));
        const retry = await fetchWithUserAgent(url, ua, baseline);
        // Only use retry result if it's more permissive (allowed/degraded)
        if (retry.verdict === "allowed" || retry.verdict === "degraded") {
          return { userAgent: label, pageType, ...retry } as UserAgentTestResult;
        }
      }
      return { userAgent: label, pageType, ...result } as UserAgentTestResult;
    })
  );

  return results;
}

async function fetchWithUserAgent(
  url: string,
  userAgent: string,
  chromeBaseline: number
): Promise<Omit<UserAgentTestResult, "userAgent" | "pageType">> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });

    const responseTimeMs = Date.now() - start;
    const body = await res.text();
    const contentLength = body.length;
    const statusCode = res.status;

    const botBlockDetected =
      (statusCode === 403 || statusCode === 429 || statusCode === 503) ||
      BOT_BLOCK_PATTERNS.some(pattern => pattern.test(body.substring(0, 5000)));

    const contentStripped =
      chromeBaseline > 0 && contentLength < chromeBaseline * 0.25;

    let verdict: UserAgentTestResult["verdict"];
    let note: string;

    if (statusCode === 403 || statusCode === 429) {
      verdict = "blocked";
      note = `HTTP ${statusCode} — site rejected this user-agent.`;
    } else if (statusCode === 503 && botBlockDetected) {
      verdict = "blocked";
      note = "HTTP 503 with bot-challenge page.";
    } else if (botBlockDetected) {
      verdict = "blocked";
      note = `HTTP ${statusCode} but bot-blocking indicators detected.`;
    } else if (contentStripped) {
      verdict = "degraded";
      note = `Content stripped (${Math.round(contentLength / 1024)}KB vs ${Math.round(chromeBaseline / 1024)}KB baseline).`;
    } else if (statusCode >= 200 && statusCode < 400) {
      verdict = "allowed";
      note = `HTTP ${statusCode} — full content served.`;
    } else {
      verdict = "unknown";
      note = `HTTP ${statusCode} — unexpected status.`;
    }

    return { statusCode, botBlockDetected, contentStripped, contentLength, responseTimeMs, verdict, note };
  } catch (e) {
    const responseTimeMs = Date.now() - start;
    const isTimeout = e instanceof DOMException && e.name === "AbortError";
    return {
      statusCode: 0,
      botBlockDetected: false,
      contentStripped: false,
      contentLength: 0,
      responseTimeMs,
      verdict: "unknown",
      note: isTimeout ? "Request timed out." : `Network error: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}
