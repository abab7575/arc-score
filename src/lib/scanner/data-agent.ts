/**
 * Data Agent — fetches raw HTML and parses structured data.
 * No browser needed, just HTTP requests.
 */

import { fetchWithRetry } from "./fetch-with-retry";

export interface UserAgentTestResult {
  userAgent: string;
  /** Which page was tested: "homepage" or "product" */
  pageType: "homepage" | "product";
  /** HTTP status code, or 0 for network/timeout errors */
  statusCode: number;
  /** Whether response contains bot-blocking indicators (CAPTCHA, "access denied", etc.) */
  botBlockDetected: boolean;
  /** Whether content is significantly stripped (>50% smaller than Chrome baseline) */
  contentStripped: boolean;
  /** Response body size in bytes */
  contentLength: number;
  /** Response time in milliseconds */
  responseTimeMs: number;
  /** Overall verdict for this test */
  verdict: "allowed" | "blocked" | "degraded" | "unknown";
  /** Human-readable note about what was detected */
  note: string;
}

export interface DataAgentResult {
  schemaOrg: {
    found: boolean;
    type?: string;
    fields: Record<string, boolean>;
    raw?: unknown;
  };
  jsonLd: {
    found: boolean;
    objects: unknown[];
    /** Where JSON-LD was found: "http" (raw fetch), "rendered" (browser), "both", or "none" */
    source: "http" | "rendered" | "both" | "none";
  };
  openGraph: {
    found: boolean;
    tags: Record<string, string>;
  };
  robotsTxt: {
    found: boolean;
    content?: string;
    blockedAgents: string[];
    allowedAgents: string[];
  };
  sitemap: {
    found: boolean;
    url?: string;
    productUrls: number;
  };
  apiEndpoints: {
    tested: string[];
    found: string[];
  };
  ucpFile: {
    found: boolean;
    content?: string;
  };
  llmsTxt: {
    found: boolean;
    content?: string;
  };
  acpSupport: {
    supported: boolean | "unknown";
    probes: Array<{
      path: string;
      method: string;
      status: number;
      contentType: string;
      bodyKeys?: string[];
      notes: string;
    }>;
    discoveryDoc: { found: boolean; content?: string };
  };
  commerceApis: {
    cartApiFound: boolean;
    checkoutApiFound: boolean;
    graphqlDetected: boolean;
    headlessSignals: string[];
    endpoints: string[];
  };
  userAgentTests: UserAgentTestResult[];
  meta: {
    title?: string;
    description?: string;
    htmlSize: number;
    hasProductData: boolean;
  };
}

const AI_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Amazonbot",
];

export async function runDataAgent(
  url: string,
  productUrl?: string,
  renderedHtml?: string
): Promise<DataAgentResult> {
  const baseUrl = url.startsWith("http") ? url : `https://${url}`;
  const targetProductUrl = productUrl || baseUrl;

  console.log("[Data Agent] Starting scan of", baseUrl);

  // 1. Fetch product page HTML (raw HTTP)
  console.log("[Data Agent] Fetching page HTML...");
  const rawHtml = await fetchPage(targetProductUrl);

  // Use browser-rendered HTML if available (catches JS-injected schema)
  // Fall back to raw HTTP fetch
  const html = renderedHtml && renderedHtml.length > rawHtml.length
    ? renderedHtml
    : rawHtml;
  const htmlSize = html.length;

  if (renderedHtml) {
    console.log(`[Data Agent] Using browser-rendered HTML (${Math.round(renderedHtml.length / 1024)}KB) vs raw (${Math.round(rawHtml.length / 1024)}KB)`);
  }

  // 2. Parse JSON-LD from both sources to maximize detection
  console.log("[Data Agent] Parsing JSON-LD...");
  const rawJsonLd = parseJsonLd(rawHtml);
  const renderedJsonLd = renderedHtml ? parseJsonLd(renderedHtml) : { found: false, objects: [] };

  // Determine source for transparency
  let jsonLdSource: "http" | "rendered" | "both" | "none" = "none";
  if (rawJsonLd.found && renderedJsonLd.found) jsonLdSource = "both";
  else if (rawJsonLd.found) jsonLdSource = "http";
  else if (renderedJsonLd.found) jsonLdSource = "rendered";

  // Merge: start with whichever HTML was larger, then add unique objects from the other
  const jsonLd = parseJsonLd(html);
  if (renderedHtml && rawHtml.length > 0) {
    const otherJsonLd = html === renderedHtml ? rawJsonLd : renderedJsonLd;
    for (const obj of otherJsonLd.objects) {
      const exists = jsonLd.objects.some(
        (existing) => JSON.stringify(existing) === JSON.stringify(obj)
      );
      if (!exists) jsonLd.objects.push(obj);
    }
    jsonLd.found = jsonLd.objects.length > 0;
  }

  if (jsonLdSource === "rendered") {
    console.log("[Data Agent] Schema found only in browser-rendered HTML (JS-injected)");
  }

  // 3. Parse Schema.org from JSON-LD
  const schemaOrg = analyzeSchemaOrg(jsonLd.objects);

  // 4. Parse Open Graph tags
  console.log("[Data Agent] Parsing Open Graph tags...");
  const openGraph = parseOpenGraph(html);

  // 5. Check robots.txt
  console.log("[Data Agent] Checking robots.txt...");
  const robotsTxt = await checkRobotsTxt(baseUrl);

  // 6. Check sitemap (use robots.txt Sitemap directives first)
  console.log("[Data Agent] Checking sitemap...");
  const sitemap = await checkSitemap(baseUrl, robotsTxt.content);

  // 7. Probe API endpoints
  console.log("[Data Agent] Probing API endpoints...");
  const apiEndpoints = await probeApiEndpoints(baseUrl);

  // 7b. Check ACP endpoints
  console.log("[Data Agent] Probing ACP endpoints...");
  const acpSupport = await checkAcpEndpoints(baseUrl);

  // 7c. Probe commerce APIs
  console.log("[Data Agent] Probing commerce APIs...");
  const commerceApis = await probeCommerceApis(baseUrl);

  // 7d. Check /.well-known/ucp
  console.log("[Data Agent] Checking /.well-known/ucp...");
  const ucpFile = await checkUcpFile(baseUrl);

  // 7e. Check /llms.txt
  console.log("[Data Agent] Checking /llms.txt...");
  const llmsTxt = await checkLlmsTxt(baseUrl);

  // 7f. Test per-agent user-agent access
  console.log("[Data Agent] Testing per-agent user-agent access...");
  const userAgentTests = await testUserAgentAccess(baseUrl, targetProductUrl);

  // 8. Extract meta
  const title = html.match(/<title[^>]*>(.*?)<\/title>/i)?.[1]?.trim();
  const description = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
  )?.[1];

  const hasProductData =
    schemaOrg.found || openGraph.tags["og:price:amount"] !== undefined;

  console.log("[Data Agent] Scan complete.");

  return {
    schemaOrg,
    jsonLd: { ...jsonLd, source: jsonLdSource },
    openGraph,
    robotsTxt,
    sitemap,
    apiEndpoints,
    ucpFile,
    llmsTxt,
    acpSupport,
    commerceApis,
    userAgentTests,
    meta: { title, description, htmlSize, hasProductData },
  };
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetchWithRetry(
    url,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    },
    { timeoutMs: 15000, label: `[Data Agent] fetchPage ${url}` }
  );

  if (!res) return "";

  if (res.status === 403 || res.status === 429) {
    console.warn(`[Data Agent] Blocked by WAF/bot protection (HTTP ${res.status}) for ${url}`);
  }

  return await res.text();
}

function parseJsonLd(html: string): { found: boolean; objects: unknown[] } {
  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const objects: unknown[] = [];
  let match;

  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (Array.isArray(parsed)) {
        objects.push(...parsed);
      } else {
        objects.push(parsed);
      }
    } catch {
      // invalid JSON-LD, skip
    }
  }

  return { found: objects.length > 0, objects };
}

function analyzeSchemaOrg(jsonLdObjects: unknown[]): {
  found: boolean;
  type?: string;
  fields: Record<string, boolean>;
  raw?: unknown;
} {
  const productFields = [
    "name",
    "description",
    "image",
    "price",
    "priceCurrency",
    "availability",
    "brand",
    "sku",
    "gtin",
    "gtin13",
    "gtin14",
    "mpn",
    "offers",
    "aggregateRating",
    "review",
  ];

  const productTypes = ["Product", "ProductGroup", "IndividualProduct", "ProductModel"];

  function isProductType(type: unknown): boolean {
    if (typeof type === "string") return productTypes.includes(type);
    if (Array.isArray(type)) return type.some((t) => productTypes.includes(t));
    return false;
  }

  function extractFields(item: Record<string, unknown>): Record<string, boolean> {
    const fields: Record<string, boolean> = {};
    for (const field of productFields) {
      // Check top-level, nested in offers, and nested in hasVariant
      fields[field] = Boolean(
        item[field] !== undefined ||
        (item.offers &&
          typeof item.offers === "object" &&
          (item.offers as Record<string, unknown>)[field] !== undefined) ||
        (Array.isArray(item.hasVariant) &&
          (item.hasVariant as Record<string, unknown>[]).some(
            (v) => v[field] !== undefined ||
            (v.offers && typeof v.offers === "object" && (v.offers as Record<string, unknown>)[field] !== undefined)
          ))
      );
    }
    return fields;
  }

  // Look for Product / ProductGroup schema
  for (const obj of jsonLdObjects) {
    const item = obj as Record<string, unknown>;
    if (isProductType(item["@type"])) {
      return { found: true, type: String(item["@type"]), fields: extractFields(item), raw: item };
    }

    // Check @graph
    if (item["@graph"] && Array.isArray(item["@graph"])) {
      for (const graphItem of item["@graph"] as Record<string, unknown>[]) {
        if (isProductType(graphItem["@type"])) {
          return { found: true, type: String(graphItem["@type"]), fields: extractFields(graphItem), raw: graphItem };
        }
      }
    }
  }

  // No Product found, check what types exist
  const types = jsonLdObjects.map(
    (o) => (o as Record<string, unknown>)["@type"]
  );
  return {
    found: false,
    type: types.length > 0 ? String(types[0]) : undefined,
    fields: {},
  };
}

function parseOpenGraph(html: string): {
  found: boolean;
  tags: Record<string, string>;
} {
  const regex =
    /<meta[^>]*property=["'](og:[^"']*)["'][^>]*content=["']([^"']*)["']/gi;
  const tags: Record<string, string> = {};
  let match;

  while ((match = regex.exec(html)) !== null) {
    tags[match[1]] = match[2];
  }

  // Also check reverse attribute order
  const regex2 =
    /<meta[^>]*content=["']([^"']*)["'][^>]*property=["'](og:[^"']*)["']/gi;
  while ((match = regex2.exec(html)) !== null) {
    tags[match[2]] = match[1];
  }

  return { found: Object.keys(tags).length > 0, tags };
}

async function checkRobotsTxt(
  baseUrl: string
): Promise<DataAgentResult["robotsTxt"]> {
  try {
    const res = await fetchWithRetry(
      `${baseUrl}/robots.txt`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ARCReport-Scanner/1.0; +https://arcreport.ai)",
        },
        redirect: "follow",
      },
      { timeoutMs: 10000, label: `[Data Agent] robots.txt ${baseUrl}` }
    );
    if (!res || !res.ok)
      return { found: false, blockedAgents: [], allowedAgents: [] };

    // Check if we got HTML instead of a real robots.txt (WAF/bot block)
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      return { found: false, blockedAgents: [], allowedAgents: [] };
    }

    const content = await res.text();
    const blockedAgents: string[] = [];
    const allowedAgents: string[] = [];

    for (const agent of AI_USER_AGENTS) {
      const agentSection = new RegExp(
        `User-agent:\\s*${agent}[\\s\\S]*?(?=User-agent:|$)`,
        "i"
      );
      const sectionMatch = content.match(agentSection);

      if (sectionMatch) {
        const section = sectionMatch[0];
        if (/Disallow:\s*\/\s*$/m.test(section)) {
          blockedAgents.push(agent);
        } else {
          allowedAgents.push(agent);
        }
      } else {
        // Not mentioned = allowed by default
        allowedAgents.push(agent);
      }
    }

    return { found: true, content, blockedAgents, allowedAgents };
  } catch {
    return { found: false, blockedAgents: [], allowedAgents: [] };
  }
}

async function checkSitemap(
  baseUrl: string,
  robotsTxtContent?: string
): Promise<DataAgentResult["sitemap"]> {
  // 1. Extract Sitemap directives from robots.txt (the canonical discovery method)
  const robotsSitemaps: string[] = [];
  if (robotsTxtContent) {
    const sitemapRegex = /^Sitemap:\s*(.+)$/gim;
    let sitemapMatch;
    while ((sitemapMatch = sitemapRegex.exec(robotsTxtContent)) !== null) {
      const url = sitemapMatch[1].trim();
      if (url.startsWith("http")) {
        robotsSitemaps.push(url);
      }
    }
  }

  // 2. Build URL list: robots.txt sitemaps first, then common fallback paths
  const sitemapUrls = [
    ...robotsSitemaps,
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/sitemap_index.xml`,
    `${baseUrl}/sitemap/sitemap.xml`,
  ];

  // Deduplicate
  const seen = new Set<string>();
  const uniqueUrls = sitemapUrls.filter((u) => {
    const normalized = u.toLowerCase();
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });

  for (const sitemapUrl of uniqueUrls) {
    try {
      const res = await fetchWithRetry(
        sitemapUrl,
        {
          headers: { "User-Agent": "ARCReport-Scanner/1.0" },
          redirect: "follow",
        },
        { timeoutMs: 10000, label: `[Data Agent] sitemap ${sitemapUrl}` }
      );
      if (!res || !res.ok) continue;

      const content = await res.text();
      if (!content.includes("<urlset") && !content.includes("<sitemapindex"))
        continue;

      // Count product-like URLs (only use specific product path patterns)
      const urlMatches = content.match(/<loc>[^<]*<\/loc>/g) || [];
      const productUrls = urlMatches.filter(
        (u) => /product|\/p\/|\/pd\/|\/dp\/|\/item|\/shop\//i.test(u)
      ).length;

      return {
        found: true,
        url: sitemapUrl,
        productUrls: productUrls || urlMatches.length,
      };
    } catch {
      continue;
    }
  }

  // 3. If robots.txt had Sitemap directives but we couldn't fetch any,
  //    report as NOT found — a declared-but-unfetchable sitemap isn't useful to agents
  if (robotsSitemaps.length > 0) {
    return {
      found: false,
      url: robotsSitemaps[0],
      productUrls: 0,
    };
  }

  return { found: false, productUrls: 0 };
}

async function probeApiEndpoints(
  baseUrl: string
): Promise<DataAgentResult["apiEndpoints"]> {
  const endpoints = [
    "/products.json", // Shopify
    "/wp-json/wc/v3/products", // WooCommerce
    "/api/products", // Generic
    "/api/v1/products", // Generic
    "/graphql", // GraphQL
  ];

  const tested: string[] = [];
  const found: string[] = [];

  for (const endpoint of endpoints) {
    tested.push(endpoint);
    const res = await fetchWithRetry(
      `${baseUrl}${endpoint}`,
      {
        headers: {
          "User-Agent": "ARCReport-Scanner/1.0",
          Accept: "application/json",
        },
      },
      { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] API ${endpoint}` }
    );
    if (
      res &&
      res.ok &&
      res.status !== 401 &&
      res.headers.get("content-type")?.includes("application/json")
    ) {
      found.push(endpoint);
    }
  }

  return { tested, found };
}

async function checkAcpEndpoints(
  baseUrl: string
): Promise<DataAgentResult["acpSupport"]> {
  const acpPaths = [
    "/checkout_sessions",
    "/acp/checkout_sessions",
    "/api/acp/checkout_sessions",
  ];
  const discoveryPaths = ["/.well-known/acp", "/.well-known/acp.json"];
  const probes: DataAgentResult["acpSupport"]["probes"] = [];
  let discoveryDoc: DataAgentResult["acpSupport"]["discoveryDoc"] = { found: false };

  // Check discovery documents
  for (const path of discoveryPaths) {
    const res = await fetchWithRetry(
      `${baseUrl}${path}`,
      { headers: { "User-Agent": "ARCReport-Scanner/1.0", Accept: "application/json" } },
      { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] ACP discovery ${path}` }
    );
    if (res) {
      const contentType = res.headers.get("content-type") || "";
      probes.push({
        path,
        method: "GET",
        status: res.status,
        contentType,
        notes: res.ok ? "Discovery document endpoint responded" : `Status ${res.status}`,
      });
      if (res.ok && contentType.includes("json")) {
        const text = await res.text();
        discoveryDoc = { found: true, content: text.substring(0, 2000) };
        break;
      }
    } else {
      probes.push({ path, method: "GET", status: 0, contentType: "", notes: "Connection failed" });
    }
  }

  // Probe ACP endpoint paths
  for (const path of acpPaths) {
    // OPTIONS probe
    const optRes = await fetchWithRetry(
      `${baseUrl}${path}`,
      { method: "OPTIONS", headers: { "User-Agent": "ARCReport-Scanner/1.0" } },
      { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] ACP OPTIONS ${path}` }
    );
    if (optRes) {
      const ct = optRes.headers.get("content-type") || "";
      probes.push({
        path,
        method: "OPTIONS",
        status: optRes.status,
        contentType: ct,
        notes: optRes.headers.get("allow") ? `Allow: ${optRes.headers.get("allow")}` : "No Allow header",
      });
    } else {
      probes.push({ path, method: "OPTIONS", status: 0, contentType: "", notes: "Connection failed" });
    }

    // GET probe with non-existent ID (expect 404 with JSON content-type)
    const getRes = await fetchWithRetry(
      `${baseUrl}${path}/does-not-exist`,
      { headers: { "User-Agent": "ARCReport-Scanner/1.0", Accept: "application/json" } },
      { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] ACP GET ${path}` }
    );
    if (getRes) {
      const ct = getRes.headers.get("content-type") || "";
      let bodyKeys: string[] | undefined;
      if (ct.includes("json")) {
        try {
          const body = await getRes.json();
          if (body && typeof body === "object") {
            bodyKeys = Object.keys(body).slice(0, 10);
          }
        } catch { /* not valid JSON */ }
      }
      probes.push({
        path: `${path}/does-not-exist`,
        method: "GET",
        status: getRes.status,
        contentType: ct,
        bodyKeys,
        notes: ct.includes("json") ? "JSON response on 404 — possible API endpoint" : `Status ${getRes.status}`,
      });
    } else {
      probes.push({ path: `${path}/does-not-exist`, method: "GET", status: 0, contentType: "", notes: "Connection failed" });
    }
  }

  // Determine support level
  const jsonProbes = probes.filter((p) => p.contentType.includes("json"));
  const checkoutKeys = ["id", "status", "line_items", "payment"];
  const hasCheckoutShape = probes.some(
    (p) => p.bodyKeys && checkoutKeys.some((k) => p.bodyKeys!.includes(k))
  );
  const supported = discoveryDoc.found || hasCheckoutShape
    ? true
    : jsonProbes.length >= 2
      ? "unknown"
      : false;

  return { supported, probes, discoveryDoc };
}

async function probeCommerceApis(
  baseUrl: string
): Promise<DataAgentResult["commerceApis"]> {
  const cartEndpoints = ["/api/cart", "/cart.js", "/api/v1/cart"];
  const checkoutEndpoints = ["/api/checkout", "/api/v1/checkout"];
  const foundEndpoints: string[] = [];
  let cartApiFound = false;
  let checkoutApiFound = false;
  let graphqlDetected = false;
  const headlessSignals: string[] = [];

  // Probe cart endpoints
  for (const ep of cartEndpoints) {
    const res = await fetchWithRetry(
      `${baseUrl}${ep}`,
      { headers: { "User-Agent": "ARCReport-Scanner/1.0", Accept: "application/json" } },
      { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] cart ${ep}` }
    );
    if (res?.headers.get("content-type")?.includes("json")) {
      cartApiFound = true;
      foundEndpoints.push(ep);
      if (ep === "/cart.js") headlessSignals.push("Shopify cart API (cart.js)");
    }
  }

  // Probe checkout endpoints
  for (const ep of checkoutEndpoints) {
    const res = await fetchWithRetry(
      `${baseUrl}${ep}`,
      { headers: { "User-Agent": "ARCReport-Scanner/1.0", Accept: "application/json" } },
      { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] checkout ${ep}` }
    );
    if (res) {
      const ct = res.headers.get("content-type") || "";
      // Only count as found if we get a real response, not 401 (requires auth = unusable by agents)
      if (res.ok && ct.includes("json")) {
        checkoutApiFound = true;
        foundEndpoints.push(ep);
        headlessSignals.push("Checkout API endpoint");
      }
    }
  }

  // Check GraphQL for cart mutations
  const gqlRes = await fetchWithRetry(
    `${baseUrl}/graphql`,
    {
      method: "POST",
      headers: {
        "User-Agent": "ARCReport-Scanner/1.0",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query: "{ __typename }" }),
    },
    { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] GraphQL` }
  );
  if (gqlRes) {
    const ct = gqlRes.headers.get("content-type") || "";
    if (ct.includes("json")) {
      graphqlDetected = true;
      foundEndpoints.push("/graphql");
      headlessSignals.push("GraphQL endpoint available");
    }
  }

  return {
    cartApiFound,
    checkoutApiFound,
    graphqlDetected,
    headlessSignals,
    endpoints: foundEndpoints,
  };
}

async function checkUcpFile(baseUrl: string): Promise<{ found: boolean; content?: string }> {
  const res = await fetchWithRetry(
    `${baseUrl}/.well-known/ucp`,
    { headers: { "User-Agent": "ARCReport-Scanner/1.0" } },
    { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] UCP ${baseUrl}` }
  );
  if (!res || !res.ok) return { found: false };
  const content = await res.text();
  return { found: content.length > 0, content: content.substring(0, 2000) };
}

async function checkLlmsTxt(baseUrl: string): Promise<{ found: boolean; content?: string }> {
  const res = await fetchWithRetry(
    `${baseUrl}/llms.txt`,
    { headers: { "User-Agent": "ARCReport-Scanner/1.0" } },
    { timeoutMs: 10000, maxAttempts: 2, label: `[Data Agent] llms.txt ${baseUrl}` }
  );
  if (!res || !res.ok) return { found: false };
  const content = await res.text();
  // Basic check that it looks like an llms.txt file (not an HTML 404 page)
  if (content.startsWith("<!") || content.startsWith("<html")) return { found: false };
  return { found: content.length > 0, content: content.substring(0, 2000) };
}

// ---- Per-Agent User-Agent Testing ----

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
  /captcha/i,
  /access[\s-]?denied/i,
  /\bblocked\b/i,
  /challenge[\s-]?page/i,
  /please verify/i,
  /are you a (human|robot)/i,
  /bot[\s-]?detected/i,
  /automated[\s-]?access/i,
  /cf-challenge/i,
  /ray[\s-]?id/i,
  /checking your browser/i,
  /just a moment/i,
  /enable javascript and cookies/i,
  /cloudflare/i,
  /datadome/i,
  /perimeterx/i,
  /distil/i,
  /incapsula/i,
  /imperva/i,
];

/**
 * Fetch a single URL with a given user-agent string and measure the response.
 */
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

    // Check for bot-blocking indicators in the response body
    const botBlockDetected =
      (statusCode === 403 || statusCode === 429 || statusCode === 503) ||
      BOT_BLOCK_PATTERNS.some((pattern) => pattern.test(body.substring(0, 5000)));

    // Check if content is significantly stripped compared to Chrome baseline
    // Threshold: 25% — more conservative to avoid false "degraded" verdicts on
    // sites that serve lighter pages to non-Chrome UAs (e.g. mobile-optimized, AMP)
    const contentStripped =
      chromeBaseline > 0 && contentLength < chromeBaseline * 0.25;

    // Determine verdict
    let verdict: UserAgentTestResult["verdict"];
    let note: string;

    if (statusCode === 403 || statusCode === 429) {
      verdict = "blocked";
      note = `HTTP ${statusCode} — site explicitly rejected this user-agent.`;
    } else if (statusCode === 503 && botBlockDetected) {
      verdict = "blocked";
      note = "HTTP 503 with bot-challenge page detected.";
    } else if (botBlockDetected) {
      verdict = "blocked";
      note = `HTTP ${statusCode} but response contains bot-blocking indicators (CAPTCHA, challenge page, etc.).`;
    } else if (contentStripped) {
      verdict = "degraded";
      note = `Content significantly stripped (${Math.round(contentLength / 1024)}KB vs ${Math.round(chromeBaseline / 1024)}KB Chrome baseline — ${Math.round((contentLength / chromeBaseline) * 100)}% of normal).`;
    } else if (statusCode >= 200 && statusCode < 400) {
      verdict = "allowed";
      note = `HTTP ${statusCode} — full content served (${Math.round(contentLength / 1024)}KB).`;
    } else {
      verdict = "unknown";
      note = `HTTP ${statusCode} — unexpected status code.`;
    }

    return {
      statusCode,
      botBlockDetected,
      contentStripped,
      contentLength,
      responseTimeMs,
      verdict,
      note,
    };
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
      note: isTimeout
        ? "Request timed out after 5 seconds."
        : `Network error: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

/**
 * Test how each AI agent's user-agent string is treated by the target site.
 * Makes requests to both homepage and product page for each UA string.
 * Runs all requests in parallel for speed.
 */
async function testUserAgentAccess(
  baseUrl: string,
  productUrl: string
): Promise<UserAgentTestResult[]> {
  // First, get Chrome baselines for both pages to compare content sizes
  const [chromeHomepage, chromeProduct] = await Promise.all([
    fetchWithUserAgent(
      baseUrl,
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      0
    ),
    fetchWithUserAgent(
      productUrl,
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      0
    ),
  ]);

  const chromeHomepageSize = chromeHomepage.contentLength;
  const chromeProductSize = chromeProduct.contentLength;

  console.log(
    `[Data Agent] Chrome baselines: homepage=${Math.round(chromeHomepageSize / 1024)}KB, product=${Math.round(chromeProductSize / 1024)}KB`
  );

  // Run all UA tests in parallel
  const tests = USER_AGENT_STRINGS.flatMap(({ ua, label }) => [
    { ua, label, url: baseUrl, pageType: "homepage" as const, baseline: chromeHomepageSize },
    { ua, label, url: productUrl, pageType: "product" as const, baseline: chromeProductSize },
  ]);

  const results = await Promise.all(
    tests.map(async ({ ua, label, url, pageType, baseline }) => {
      const result = await fetchWithUserAgent(url, ua, baseline);
      return {
        userAgent: label,
        pageType,
        ...result,
      } as UserAgentTestResult;
    })
  );

  // Log summary
  const blocked = results.filter((r) => r.verdict === "blocked");
  const degraded = results.filter((r) => r.verdict === "degraded");
  console.log(
    `[Data Agent] UA test results: ${results.length} tests, ${blocked.length} blocked, ${degraded.length} degraded`
  );
  if (blocked.length > 0) {
    const blockedUAs = [...new Set(blocked.map((r) => r.userAgent))];
    console.log(`[Data Agent] Blocked user-agents: ${blockedUAs.join(", ")}`);
  }

  return results;
}
