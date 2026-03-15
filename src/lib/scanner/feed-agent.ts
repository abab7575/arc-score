/**
 * Feed Agent — tests whether AI shopping agents that rely on product feeds
 * (Google Merchant Center, Facebook Catalog, RSS) can discover and understand
 * the site's product catalog.
 *
 * Unlike the Data Agent (which checks for structured data IN the HTML), the
 * Feed Agent tests external feed endpoints that shopping platforms consume:
 * - Google Merchant Center feed (XML/RSS)
 * - Facebook/Meta product catalog
 * - Shopify product feed
 * - RSS product feeds
 * - Product feed auto-discovery via link tags
 */

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---- Types ----

export interface FeedStep {
  stepNumber: number;
  action: string;
  description: string;
  result: "pass" | "partial" | "fail";
  narration: string;
  thought: string;
  duration: number;
  details?: Record<string, unknown>;
}

export interface ProductFeedEntry {
  title?: string;
  price?: string;
  currency?: string;
  availability?: string;
  imageUrl?: string;
  link?: string;
  gtin?: string;
  brand?: string;
  condition?: string;
}

export interface FeedInfo {
  url: string;
  type: string;
  valid: boolean;
  productCount: number;
  sampleProducts: ProductFeedEntry[];
  missingFields: string[];
}

export interface FeedAgentResult {
  steps: FeedStep[];
  overallResult: "pass" | "partial" | "fail";
  narrative: string;
  feedsDiscovered: FeedInfo[];
  totalProductsInFeeds: number;
  hasGoogleMerchantFeed: boolean;
  hasMetaCatalog: boolean;
  hasShopifyFeed: boolean;
  hasRssFeed: boolean;
  priceConsistency: "consistent" | "inconsistent" | "untested";
  feedQualityScore: number; // 0-100
  issuesFound: string[];
}

// ---- Helpers ----

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RobotShopper-Bot/1.0; +https://robotshopper.com)",
        Accept: "application/xml, application/rss+xml, text/xml, application/json, */*",
      },
      redirect: "follow",
    });
    return response;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.origin;
  } catch {
    return url;
  }
}

function parseGoogleMerchantXml(xml: string): { products: ProductFeedEntry[]; missingFields: string[] } {
  const products: ProductFeedEntry[] = [];
  const missingFields = new Set<string>();

  // Extract items from Google Merchant / RSS feed format
  const items = xml.match(/<item>[\s\S]*?<\/item>|<entry>[\s\S]*?<\/entry>/gi) || [];

  for (const item of items.slice(0, 10)) { // Sample first 10
    const product: ProductFeedEntry = {};

    const titleMatch = item.match(/<(?:g:)?title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?title>/i);
    if (titleMatch) product.title = titleMatch[1].trim();
    else missingFields.add("title");

    const priceMatch = item.match(/<(?:g:)?price[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?price>/i);
    if (priceMatch) {
      const priceStr = priceMatch[1].trim();
      const currencyMatch = priceStr.match(/([A-Z]{3})/);
      product.price = priceStr.replace(/[A-Z]{3}\s*/g, "").trim();
      product.currency = currencyMatch?.[1];
    } else missingFields.add("price");

    const availMatch = item.match(/<(?:g:)?availability[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?availability>/i);
    if (availMatch) product.availability = availMatch[1].trim();
    else missingFields.add("availability");

    const imgMatch = item.match(/<(?:g:)?image_link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?image_link>/i)
      || item.match(/<(?:g:)?image[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?image>/i);
    if (imgMatch) product.imageUrl = imgMatch[1].trim();
    else missingFields.add("image");

    const linkMatch = item.match(/<(?:g:)?link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?link>/i);
    if (linkMatch) product.link = linkMatch[1].trim();

    const gtinMatch = item.match(/<(?:g:)?gtin[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?gtin>/i);
    if (gtinMatch) product.gtin = gtinMatch[1].trim();

    const brandMatch = item.match(/<(?:g:)?brand[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?brand>/i);
    if (brandMatch) product.brand = brandMatch[1].trim();

    const condMatch = item.match(/<(?:g:)?condition[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/(?:g:)?condition>/i);
    if (condMatch) product.condition = condMatch[1].trim();

    products.push(product);
  }

  // Count total items
  const totalItems = items.length || (xml.match(/<item/gi)?.length || 0);

  return { products, missingFields: Array.from(missingFields) };
}

function parseShopifyProductsJson(json: unknown): ProductFeedEntry[] {
  const products: ProductFeedEntry[] = [];
  const data = json as { products?: Array<Record<string, unknown>> };

  if (!data.products || !Array.isArray(data.products)) return products;

  for (const p of data.products.slice(0, 10)) {
    const variants = (p.variants as Array<Record<string, unknown>>) || [];
    const firstVariant = variants[0] || {};
    const images = (p.images as Array<Record<string, unknown>>) || [];

    products.push({
      title: p.title as string,
      price: firstVariant.price as string,
      currency: "USD", // Shopify doesn't include currency in products.json
      availability: (firstVariant.available as boolean) ? "in stock" : "out of stock",
      imageUrl: images[0]?.src as string,
      link: p.handle ? `/products/${p.handle}` : undefined,
    });
  }

  return products;
}

// ---- Main Agent ----

export async function runFeedAgent(
  siteUrl: string,
  productUrl?: string
): Promise<FeedAgentResult> {
  const steps: FeedStep[] = [];
  const feedsDiscovered: FeedInfo[] = [];
  const issuesFound: string[] = [];
  let hasGoogleMerchantFeed = false;
  let hasMetaCatalog = false;
  let hasShopifyFeed = false;
  let hasRssFeed = false;
  let totalProductsInFeeds = 0;
  let feedQualityScore = 0;

  const domain = extractDomain(siteUrl);
  let stepNum = 1;

  // ── Step 1: Auto-discover feeds via HTML link tags ────────
  const step1Start = Date.now();
  console.log("[Feed Agent] Step 1: Discovering feed links in HTML...");

  try {
    const response = await fetchWithTimeout(`${domain}/`, 15000);
    if (response && response.ok) {
      const html = await response.text();

      // Look for <link> tags pointing to feeds
      const feedLinks = html.match(/<link[^>]*type=["'](application\/rss\+xml|application\/atom\+xml|application\/xml)["'][^>]*>/gi) || [];
      const discoveredUrls: string[] = [];

      for (const link of feedLinks) {
        const hrefMatch = link.match(/href=["']([^"']+)["']/i);
        if (hrefMatch) {
          const feedUrl = hrefMatch[1].startsWith("http") ? hrefMatch[1] : `${domain}${hrefMatch[1]}`;
          discoveredUrls.push(feedUrl);
        }
      }

      // Check for meta tags (Facebook catalog)
      const metaProductFeed = html.match(/property=["']product:catalog["'][^>]*content=["']([^"']+)["']/i);
      if (metaProductFeed) {
        discoveredUrls.push(metaProductFeed[1]);
        hasMetaCatalog = true;
      }

      steps.push({
        stepNumber: stepNum++,
        action: "Discover feed links in HTML",
        description: "Scanning page HTML for RSS, Atom, and product feed link tags",
        result: discoveredUrls.length > 0 ? "pass" : "partial",
        narration: discoveredUrls.length > 0
          ? `Found ${discoveredUrls.length} feed link(s) in HTML: ${discoveredUrls.join(", ")}`
          : "No feed links found in HTML link tags.",
        thought: discoveredUrls.length > 0
          ? "Feed URLs discovered via HTML. Will probe each one."
          : "No feed auto-discovery. Will try common feed paths.",
        duration: Date.now() - step1Start,
        details: { discoveredUrls },
      });
    } else {
      steps.push({
        stepNumber: stepNum++,
        action: "Discover feed links in HTML",
        description: "Scanning page HTML for RSS, Atom, and product feed link tags",
        result: "fail",
        narration: "Could not fetch homepage HTML to discover feed links.",
        thought: "Homepage fetch failed. Trying known feed paths directly.",
        duration: Date.now() - step1Start,
      });
    }
  } catch {
    steps.push({
      stepNumber: stepNum++,
      action: "Discover feed links in HTML",
      description: "Scanning page HTML for RSS, Atom, and product feed link tags",
      result: "fail",
      narration: "Error fetching homepage for feed discovery.",
      thought: "Will try known feed paths.",
      duration: Date.now() - step1Start,
    });
  }

  // ── Step 2: Probe Google Merchant / Product Feed URLs ─────
  const step2Start = Date.now();
  console.log("[Feed Agent] Step 2: Probing Google Merchant feed paths...");

  const merchantPaths = [
    "/feed/google-merchant.xml",
    "/feeds/google-shopping.xml",
    "/product-feed.xml",
    "/google-shopping-feed.xml",
    "/feeds/products.xml",
    "/feed.xml",
    "/products.atom",
    "/collections/all.atom",
    "/feeds/catalog.xml",
  ];

  let merchantFeedFound = false;

  for (const feedPath of merchantPaths) {
    const feedUrl = `${domain}${feedPath}`;
    const response = await fetchWithTimeout(feedUrl, 8000);

    if (response && response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const body = await response.text();

      if (body.length > 200 && (contentType.includes("xml") || contentType.includes("rss") || body.includes("<rss") || body.includes("<feed") || body.includes("<channel"))) {
        const { products, missingFields } = parseGoogleMerchantXml(body);
        const itemCount = (body.match(/<item/gi) || []).length || products.length;

        if (itemCount > 0) {
          merchantFeedFound = true;
          hasGoogleMerchantFeed = true;
          totalProductsInFeeds += itemCount;

          feedsDiscovered.push({
            url: feedUrl,
            type: "Google Merchant / RSS",
            valid: true,
            productCount: itemCount,
            sampleProducts: products,
            missingFields,
          });

          if (missingFields.length > 0) {
            issuesFound.push(`Merchant feed at ${feedPath} missing fields: ${missingFields.join(", ")}`);
          }
          break; // Found one, stop probing
        }
      }
    }
    await delay(200); // Polite delay between probes
  }

  steps.push({
    stepNumber: stepNum++,
    action: "Probe Google Merchant feed",
    description: "Testing common feed paths for Google Shopping XML feeds",
    result: merchantFeedFound ? "pass" : "fail",
    narration: merchantFeedFound
      ? `Google Merchant feed found with ${totalProductsInFeeds} products.`
      : `No Google Merchant feed found. Tested ${merchantPaths.length} common paths.`,
    thought: merchantFeedFound
      ? "Product feed available for shopping platforms."
      : "No product feed. Shopping agents relying on feeds won't discover these products.",
    duration: Date.now() - step2Start,
    details: { pathsTested: merchantPaths.length, found: merchantFeedFound },
  });

  // ── Step 3: Shopify Products JSON ─────────────────────────
  const step3Start = Date.now();
  console.log("[Feed Agent] Step 3: Checking Shopify product endpoints...");

  const shopifyPaths = [
    "/products.json",
    "/products.json?limit=10",
    "/collections/all/products.json",
  ];

  let shopifyFound = false;

  for (const shopifyPath of shopifyPaths) {
    const url = `${domain}${shopifyPath}`;
    const response = await fetchWithTimeout(url, 8000);

    if (response && response.ok) {
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        try {
          const json = await response.json();
          const products = parseShopifyProductsJson(json);
          const totalProducts = (json as { products?: unknown[] }).products?.length || products.length;

          if (products.length > 0) {
            shopifyFound = true;
            hasShopifyFeed = true;
            totalProductsInFeeds += totalProducts;

            const missingFields: string[] = [];
            const sample = products[0];
            if (!sample.price) missingFields.push("price");
            if (!sample.imageUrl) missingFields.push("image");
            if (!sample.availability) missingFields.push("availability");

            feedsDiscovered.push({
              url,
              type: "Shopify Products JSON",
              valid: true,
              productCount: totalProducts,
              sampleProducts: products,
              missingFields,
            });

            break;
          }
        } catch {
          // Invalid JSON
        }
      }
    }
    await delay(200);
  }

  steps.push({
    stepNumber: stepNum++,
    action: "Check Shopify product feed",
    description: "Testing for Shopify's /products.json API endpoint",
    result: shopifyFound ? "pass" : "fail",
    narration: shopifyFound
      ? `Shopify product feed found with ${totalProductsInFeeds} products accessible.`
      : "No Shopify product feed detected.",
    thought: shopifyFound
      ? "Shopify feed available. Agents can access full product catalog programmatically."
      : "Not a Shopify site, or products.json is restricted.",
    duration: Date.now() - step3Start,
    details: { shopifyFound },
  });

  // ── Step 4: RSS/Atom feed with product data ───────────────
  const step4Start = Date.now();
  console.log("[Feed Agent] Step 4: Checking RSS/Atom feeds...");

  const rssPaths = [
    "/feed",
    "/rss",
    "/feed/rss",
    "/blog/feed",
    "/atom.xml",
    "/rss.xml",
    "/index.xml",
  ];

  let rssFound = false;

  for (const rssPath of rssPaths) {
    const url = `${domain}${rssPath}`;
    const response = await fetchWithTimeout(url, 8000);

    if (response && response.ok) {
      const body = await response.text();
      if (body.includes("<rss") || body.includes("<feed") || body.includes("<channel")) {
        // Check if it contains product-like data (not just blog posts)
        const hasProductContent = /price|product|offer|sku|gtin|availability/i.test(body);
        const itemCount = (body.match(/<item/gi) || body.match(/<entry/gi) || []).length;

        if (itemCount > 0) {
          rssFound = true;
          hasRssFeed = true;

          feedsDiscovered.push({
            url,
            type: hasProductContent ? "RSS Product Feed" : "RSS Blog Feed",
            valid: true,
            productCount: itemCount,
            sampleProducts: [],
            missingFields: hasProductContent ? [] : ["product-specific fields (price, availability)"],
          });

          if (!hasProductContent) {
            issuesFound.push("RSS feed found but contains blog content, not product data");
          }
          break;
        }
      }
    }
    await delay(200);
  }

  steps.push({
    stepNumber: stepNum++,
    action: "Check RSS/Atom feeds",
    description: "Testing for RSS or Atom feeds with product content",
    result: rssFound ? (hasRssFeed ? "pass" : "partial") : "fail",
    narration: rssFound
      ? `RSS feed found. ${hasRssFeed ? "Contains product-relevant content." : "Blog feed only — no product data."}`
      : "No RSS or Atom feeds detected.",
    thought: rssFound
      ? "RSS feed available for content discovery."
      : "No RSS feeds. Agents can't subscribe to product updates.",
    duration: Date.now() - step4Start,
    details: { rssFound, hasProductContent: hasRssFeed },
  });

  // ── Step 5: Feed quality assessment ───────────────────────
  const step5Start = Date.now();
  console.log("[Feed Agent] Step 5: Assessing overall feed quality...");

  // Calculate feed quality score
  let qualityPoints = 0;
  if (feedsDiscovered.length > 0) qualityPoints += 20; // At least one feed exists
  if (hasGoogleMerchantFeed) qualityPoints += 25;       // Best for shopping platforms
  if (hasShopifyFeed) qualityPoints += 20;               // Good API access
  if (hasMetaCatalog) qualityPoints += 15;               // Meta/Facebook coverage
  if (hasRssFeed) qualityPoints += 10;                   // Basic feed support

  // Quality of feed content
  for (const feed of feedsDiscovered) {
    if (feed.missingFields.length === 0) qualityPoints += 10;
    else if (feed.missingFields.length <= 2) qualityPoints += 5;
  }

  feedQualityScore = Math.min(100, qualityPoints);

  const step5Result = feedQualityScore >= 60 ? "pass" : feedQualityScore >= 30 ? "partial" : "fail";

  if (feedsDiscovered.length === 0) {
    issuesFound.push("No product feeds found — AI shopping platforms cannot discover products via feeds");
  }

  steps.push({
    stepNumber: stepNum++,
    action: "Assess feed quality",
    description: "Evaluating completeness and quality of discovered product feeds",
    result: step5Result,
    narration: `Feed quality score: ${feedQualityScore}/100. ${feedsDiscovered.length} feed(s) discovered with ${totalProductsInFeeds} total products. ${issuesFound.length > 0 ? `Issues: ${issuesFound.join("; ")}` : "No critical issues."}`,
    thought: feedQualityScore >= 60
      ? "Product feeds are in good shape for AI shopping platforms."
      : feedQualityScore >= 30
        ? "Some feeds exist but coverage is incomplete."
        : "Feed presence is weak. Products are largely invisible to feed-based AI shopping agents.",
    duration: Date.now() - step5Start,
    details: {
      feedQualityScore,
      feedCount: feedsDiscovered.length,
      totalProducts: totalProductsInFeeds,
      hasGoogleMerchantFeed,
      hasShopifyFeed,
      hasMetaCatalog,
      hasRssFeed,
    },
  });

  // ── Calculate overall result ──────────────────────────────
  const failCount = steps.filter((s) => s.result === "fail").length;
  const passCount = steps.filter((s) => s.result === "pass").length;
  const overallResult: "pass" | "partial" | "fail" =
    passCount >= 3 ? "pass" : failCount >= 4 ? "fail" : "partial";

  const narrative = steps.map((s) => s.narration).join(" ");

  return {
    steps,
    overallResult,
    narrative,
    feedsDiscovered,
    totalProductsInFeeds,
    hasGoogleMerchantFeed,
    hasMetaCatalog,
    hasShopifyFeed,
    hasRssFeed,
    priceConsistency: "untested", // TODO: cross-check feed prices vs page prices
    feedQualityScore,
    issuesFound,
  };
}
