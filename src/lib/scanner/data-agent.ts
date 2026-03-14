/**
 * Data Agent — fetches raw HTML and parses structured data.
 * No browser needed, just HTTP requests.
 */

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
  const jsonLd = parseJsonLd(html);

  // If rendered HTML has more JSON-LD, merge objects from raw HTML too
  if (renderedHtml && rawHtml.length > 0) {
    const rawJsonLd = parseJsonLd(rawHtml);
    for (const obj of rawJsonLd.objects) {
      const exists = jsonLd.objects.some(
        (existing) => JSON.stringify(existing) === JSON.stringify(obj)
      );
      if (!exists) jsonLd.objects.push(obj);
    }
    jsonLd.found = jsonLd.objects.length > 0;
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
    jsonLd,
    openGraph,
    robotsTxt,
    sitemap,
    apiEndpoints,
    ucpFile,
    llmsTxt,
    acpSupport,
    commerceApis,
    meta: { title, description, htmlSize, hasProductData },
  };
}

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 403 || res.status === 429) {
      console.warn(`[Data Agent] Blocked by WAF/bot protection (HTTP ${res.status}) for ${url}`);
    }

    return await res.text();
  } catch (e) {
    console.error("[Data Agent] Failed to fetch page:", e);
    return "";
  }
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
    const res = await fetch(`${baseUrl}/robots.txt`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ARC-Score-Scanner/1.0; +https://arcscore.ai)",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok)
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
      const res = await fetch(sitemapUrl, {
        headers: { "User-Agent": "ARC-Score-Scanner/1.0" },
        redirect: "follow",
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

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
  //    still report as found (the declaration exists, we just couldn't access it)
  if (robotsSitemaps.length > 0) {
    return {
      found: true,
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
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
          "User-Agent": "ARC-Score-Scanner/1.0",
          Accept: "application/json",
        },
      });
      if (
        res.ok &&
        res.headers.get("content-type")?.includes("application/json")
      ) {
        found.push(endpoint);
      }
    } catch {
      continue;
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
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        headers: { "User-Agent": "ARC-Score-Scanner/1.0", Accept: "application/json" },
      });
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
    } catch {
      probes.push({ path, method: "GET", status: 0, contentType: "", notes: "Connection failed" });
    }
  }

  // Probe ACP endpoint paths
  for (const path of acpPaths) {
    // OPTIONS probe
    try {
      const optRes = await fetch(`${baseUrl}${path}`, {
        method: "OPTIONS",
        headers: { "User-Agent": "ARC-Score-Scanner/1.0" },
      });
      const ct = optRes.headers.get("content-type") || "";
      probes.push({
        path,
        method: "OPTIONS",
        status: optRes.status,
        contentType: ct,
        notes: optRes.headers.get("allow") ? `Allow: ${optRes.headers.get("allow")}` : "No Allow header",
      });
    } catch {
      probes.push({ path, method: "OPTIONS", status: 0, contentType: "", notes: "Connection failed" });
    }

    // GET probe with non-existent ID (expect 404 with JSON content-type)
    try {
      const getRes = await fetch(`${baseUrl}${path}/does-not-exist`, {
        headers: { "User-Agent": "ARC-Score-Scanner/1.0", Accept: "application/json" },
      });
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
    } catch {
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
    try {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { "User-Agent": "ARC-Score-Scanner/1.0", Accept: "application/json" },
      });
      if (res.headers.get("content-type")?.includes("json")) {
        cartApiFound = true;
        foundEndpoints.push(ep);
        if (ep === "/cart.js") headlessSignals.push("Shopify cart API (cart.js)");
      }
    } catch { /* skip */ }
  }

  // Probe checkout endpoints
  for (const ep of checkoutEndpoints) {
    try {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { "User-Agent": "ARC-Score-Scanner/1.0", Accept: "application/json" },
      });
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("json") || (res.status === 401 && ct.includes("json"))) {
        checkoutApiFound = true;
        foundEndpoints.push(ep);
        headlessSignals.push("Checkout API endpoint");
      }
    } catch { /* skip */ }
  }

  // Check GraphQL for cart mutations
  try {
    const res = await fetch(`${baseUrl}/graphql`, {
      method: "POST",
      headers: {
        "User-Agent": "ARC-Score-Scanner/1.0",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: "{ __typename }",
      }),
    });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("json")) {
      graphqlDetected = true;
      foundEndpoints.push("/graphql");
      headlessSignals.push("GraphQL endpoint available");
    }
  } catch { /* skip */ }

  return {
    cartApiFound,
    checkoutApiFound,
    graphqlDetected,
    headlessSignals,
    endpoints: foundEndpoints,
  };
}

async function checkUcpFile(baseUrl: string): Promise<{ found: boolean; content?: string }> {
  try {
    const res = await fetch(`${baseUrl}/.well-known/ucp`, {
      headers: { "User-Agent": "ARC-Score-Scanner/1.0" },
    });
    if (!res.ok) return { found: false };
    const content = await res.text();
    return { found: content.length > 0, content: content.substring(0, 2000) };
  } catch {
    return { found: false };
  }
}

async function checkLlmsTxt(baseUrl: string): Promise<{ found: boolean; content?: string }> {
  try {
    const res = await fetch(`${baseUrl}/llms.txt`, {
      headers: { "User-Agent": "ARC-Score-Scanner/1.0" },
    });
    if (!res.ok) return { found: false };
    const content = await res.text();
    // Basic check that it looks like an llms.txt file (not an HTML 404 page)
    if (content.startsWith("<!") || content.startsWith("<html")) return { found: false };
    return { found: content.length > 0, content: content.substring(0, 2000) };
  } catch {
    return { found: false };
  }
}
