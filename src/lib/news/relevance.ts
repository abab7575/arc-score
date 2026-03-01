/**
 * Keyword-based relevance scoring for agentic commerce news articles.
 */

const KEYWORD_SCORES: [RegExp, number, string][] = [
  // High relevance — direct agentic commerce terms
  [/\bagentic commerce\b/i, 15, "agentic commerce"],
  [/\bagentic shopping\b/i, 15, "agentic shopping"],
  [/\bai shopping agent\b/i, 12, "ai shopping agent"],
  [/\bai agent.{0,10}shopping\b/i, 10, "ai agent shopping"],
  [/\bai agent.{0,10}e-?commerce\b/i, 10, "ai agent ecommerce"],
  [/\bautonomous.{0,10}shopping\b/i, 10, "autonomous shopping"],
  [/\bautonomous.{0,10}purchase\b/i, 10, "autonomous purchase"],
  [/\bagent.{0,10}checkout\b/i, 12, "agent checkout"],
  [/\bagent.{0,10}purchase\b/i, 10, "agent purchase"],
  [/\bcomputer use\b/i, 8, "computer use"],
  [/\boperator\b/i, 5, "operator"],
  [/\bbuy.?for.?me\b/i, 8, "buy for me"],
  [/\bshopping copilot\b/i, 10, "shopping copilot"],
  [/\bai concierge\b/i, 8, "ai concierge"],
  [/\bpersonal shopper.{0,5}ai\b/i, 10, "personal shopper ai"],
  [/\bai.{0,5}personal shopper\b/i, 10, "personal shopper ai"],

  // AI infrastructure — MCP, tool use, function calling
  [/\bmodel context protocol\b/i, 10, "model context protocol"],
  [/\bMCP\b(?!\s+(server|board|chip))/, 8, "MCP"],
  [/\btool.?use\b/i, 6, "tool use"],
  [/\bfunction.?calling\b/i, 6, "function calling"],
  [/\bai wallet\b/i, 8, "ai wallet"],
  [/\bai.{0,5}payment\b/i, 8, "ai payment"],

  // Medium relevance — AI + commerce intersection
  [/\bai agent\b/i, 5, "ai agent"],
  [/\bai assistant.{0,10}(shop|buy|purchase)\b/i, 8, "ai assistant shopping"],
  [/\bchatgpt.{0,10}shop/i, 7, "chatgpt shopping"],
  [/\bperplexity.{0,10}shop/i, 7, "perplexity shopping"],
  [/\bklarna.{0,10}ai\b/i, 7, "klarna ai"],
  [/\bstructured data\b/i, 4, "structured data"],
  [/\bschema\.org\b/i, 4, "schema.org"],
  [/\bproduct feed\b/i, 5, "product feed"],
  [/\bgoogle merchant\b/i, 5, "google merchant"],
  [/\bshopify.{0,10}ai\b/i, 5, "shopify ai"],
  [/\bconversational.{0,10}commerce\b/i, 7, "conversational commerce"],
  [/\bheadless commerce\b/i, 4, "headless commerce"],

  // Commerce infrastructure
  [/\bproduct discovery\b/i, 5, "product discovery"],
  [/\bcheckout optimization\b/i, 6, "checkout optimization"],
  [/\bdynamic pricing\b/i, 4, "dynamic pricing"],
  [/\bpersonalization engine\b/i, 5, "personalization engine"],
  [/\bmarketplace API\b/i, 5, "marketplace API"],
  [/\bOpenAPI\b/, 4, "OpenAPI"],
  [/\bcommerce API\b/i, 5, "commerce API"],
  [/\bsocial commerce\b/i, 5, "social commerce"],
  [/\bvoice commerce\b/i, 6, "voice commerce"],
  [/\blive shopping\b/i, 5, "live shopping"],
  [/\bcomposable commerce\b/i, 5, "composable commerce"],
  [/\bunified commerce\b/i, 4, "unified commerce"],
  [/\bproduct.{0,5}graph\b/i, 5, "product graph"],
  [/\bcatalog.{0,5}API\b/i, 4, "catalog API"],

  // Lower relevance — general AI/commerce
  [/\be-?commerce\b/i, 2, "ecommerce"],
  [/\bonline shopping\b/i, 2, "online shopping"],
  [/\bartificial intelligence\b/i, 2, "artificial intelligence"],
  [/\bmachine learning\b/i, 1, "machine learning"],
  [/\bllm\b/i, 3, "llm"],
  [/\blarge language model\b/i, 3, "large language model"],
  [/\bchatbot\b/i, 2, "chatbot"],
  [/\bapi.{0,5}first\b/i, 3, "api-first"],
  [/\brobot\.?txt\b/i, 3, "robots.txt"],
  [/\bweb scraping\b/i, 3, "web scraping"],
  [/\bbot detection\b/i, 4, "bot detection"],
  [/\bcaptcha\b/i, 3, "captcha"],
  [/\bRAG\b/, 3, "RAG"],
  [/\bretrieval.{0,5}augmented\b/i, 3, "RAG"],
  [/\bmultimodal\b/i, 3, "multimodal"],
  [/\bembedding/i, 2, "embeddings"],
  [/\bfine.?tun/i, 2, "fine-tuning"],
];

export interface RelevanceResult {
  score: number; // 0-100
  tags: string[];
  mentionedBrands: string[];
}

export function scoreRelevance(text: string): RelevanceResult {
  let rawScore = 0;
  const tags: string[] = [];

  for (const [pattern, points, tag] of KEYWORD_SCORES) {
    if (pattern.test(text)) {
      rawScore += points;
      tags.push(tag);
    }
  }

  // Normalize to 0-100 (cap at 100)
  const score = Math.min(100, rawScore);

  // Extract brand mentions
  const mentionedBrands = extractBrandMentions(text);

  return { score, tags, mentionedBrands };
}

// Well-known e-commerce brands to detect
const KNOWN_BRAND_PATTERNS: [RegExp, string][] = [
  // ── E-commerce Platforms ───────────────────────────────────────────
  [/\bShopify\b/, "Shopify"],
  [/\bStripe\b/, "Stripe"],
  [/\bBigCommerce\b/, "BigCommerce"],
  [/\bWooCommerce\b/, "WooCommerce"],
  [/\bSquarespace\b/, "Squarespace"],
  [/\bWix\b/, "Wix"],

  // ── Marketplaces ───────────────────────────────────────────────────
  [/\bAmazon\b/, "Amazon"],
  [/\bWalmart\b/, "Walmart"],
  [/\bTarget\b(?!\s+(audience|market|user|demographic|group|segment))/i, "Target"],
  [/\beBay\b/, "eBay"],
  [/\bEtsy\b/, "Etsy"],
  [/\bInstacart\b/, "Instacart"],
  [/\bDoorDash\b/, "DoorDash"],
  [/\bUber Eats\b/, "Uber Eats"],
  [/\bBest Buy\b/, "Best Buy"],
  [/\bCostco\b/, "Costco"],
  [/\bKroger\b/, "Kroger"],

  // ── International Marketplaces ─────────────────────────────────────
  [/\bTemu\b/, "Temu"],
  [/\bMercado Libre\b/, "Mercado Libre"],
  [/\bFlipkart\b/, "Flipkart"],
  [/\bZalando\b/, "Zalando"],
  [/\bRakuten\b/, "Rakuten"],
  [/\bAlibaba\b/, "Alibaba"],
  [/\bJD\.com\b/, "JD.com"],
  [/\bCoupang\b/, "Coupang"],

  // ── Fashion ────────────────────────────────────────────────────────
  [/\bNike\b/, "Nike"],
  [/\bAdidas\b/, "Adidas"],
  [/\bZara\b/, "Zara"],
  [/\bH&M\b/, "H&M"],
  [/\bASOS\b/, "ASOS"],
  [/\bLululemon\b/, "Lululemon"],
  [/\bNordstrom\b/, "Nordstrom"],
  [/\bSHEIN\b/, "SHEIN"],
  [/\bGap\b(?!\s+(between|in|analysis|year|of))/i, "Gap"],
  [/\bJ\.?\s*Crew\b/, "J.Crew"],
  [/\bMacy'?s\b/, "Macy's"],
  [/\bNeiman Marcus\b/, "Neiman Marcus"],
  [/\bUniqlo\b/, "Uniqlo"],
  [/\bAnthropologie\b/, "Anthropologie"],
  [/\bUrban Outfitters\b/, "Urban Outfitters"],
  [/\bFree People\b/, "Free People"],
  [/\bAbercrombie\b/, "Abercrombie & Fitch"],

  // ── DTC Brands ─────────────────────────────────────────────────────
  [/\bGlossier\b/, "Glossier"],
  [/\bWarby Parker\b/, "Warby Parker"],
  [/\bAllbirds\b/, "Allbirds"],
  [/\bCasper\b/, "Casper"],
  [/\bEverlane\b/, "Everlane"],
  [/\bHOKA\b/, "HOKA"],
  [/\bSKIMS\b/, "SKIMS"],
  [/\bGymshark\b/, "Gymshark"],
  [/\bBrookinen\b/, "Brooklinen"],
  [/\bAway\b(?!\s+(from|game|team|match))/i, "Away"],
  [/\bRitual\b(?!\s+(sacrifice|dance|practice|ceremony))/i, "Ritual"],
  [/\bOuai\b/, "Ouai"],
  [/\bBombas\b/, "Bombas"],
  [/\bRothy'?s\b/, "Rothy's"],
  [/\bOn Running\b/, "On Running"],
  [/\bVuori\b/, "Vuori"],

  // ── Beauty & Personal Care ─────────────────────────────────────────
  [/\bSephora\b/, "Sephora"],
  [/\bUlta\b/, "Ulta"],
  [/\bFenty\b/, "Fenty"],
  [/\bThe Ordinary\b/, "The Ordinary"],
  [/\bDrunk Elephant\b/, "Drunk Elephant"],
  [/\bRare Beauty\b/, "Rare Beauty"],
  [/\bCharlotte Tilbury\b/, "Charlotte Tilbury"],
  [/\bKiehl'?s\b/, "Kiehl's"],

  // ── Electronics ────────────────────────────────────────────────────
  [/\bApple\b(?!\s+(pie|cider|sauce|tree|juice|orchard))/i, "Apple"],
  [/\bSamsung\b/, "Samsung"],
  [/\bDell\b/, "Dell"],
  [/\bSony\b/, "Sony"],
  [/\bBose\b/, "Bose"],
  [/\bLenovo\b/, "Lenovo"],
  [/\bHP\b(?!\s+(Lovecraft))/, "HP"],

  // ── Home & Furniture ───────────────────────────────────────────────
  [/\bIKEA\b/, "IKEA"],
  [/\bWayfair\b/, "Wayfair"],
  [/\bWest Elm\b/, "West Elm"],
  [/\bPottery Barn\b/, "Pottery Barn"],
  [/\bHome Depot\b/, "Home Depot"],
  [/\bLowe'?s\b/, "Lowe's"],
  [/\bCrate & Barrel\b/, "Crate & Barrel"],
  [/\bCB2\b/, "CB2"],
  [/\bArticle\b(?!\s+(about|on|in|the|by|from|says|states|argues))/i, "Article"],
  [/\bBurrow\b/, "Burrow"],

  // ── Luxury ─────────────────────────────────────────────────────────
  [/\bGucci\b/, "Gucci"],
  [/\bLouis Vuitton\b/, "Louis Vuitton"],
  [/\bRalph Lauren\b/, "Ralph Lauren"],
  [/\bHermes\b/, "Hermes"],
  [/\bBurberry\b/, "Burberry"],
  [/\bChanel\b/, "Chanel"],
  [/\bPrada\b/, "Prada"],
  [/\bFarfetch\b/, "Farfetch"],
  [/\bNet-a-Porter\b/, "Net-a-Porter"],
  [/\bMytheresa\b/, "Mytheresa"],
  [/\bSSENSE\b/, "SSENSE"],

  // ── Sports & Outdoor ───────────────────────────────────────────────
  [/\bREI\b/, "REI"],
  [/\bPatagonia\b/, "Patagonia"],
  [/\bArc'teryx\b/, "Arc'teryx"],
  [/\bThe North Face\b/, "The North Face"],
  [/\bColumbia\b(?!\s+(university|pictures|records|river|district))/i, "Columbia Sportswear"],
  [/\bYeti\b/, "Yeti"],
  [/\bDick'?s Sporting\b/, "Dick's Sporting Goods"],

  // ── Grocery & Food ─────────────────────────────────────────────────
  [/\bWhole Foods\b/, "Whole Foods"],
  [/\bTrader Joe'?s\b/, "Trader Joe's"],
  [/\bThrive Market\b/, "Thrive Market"],
  [/\bGopuff\b/, "Gopuff"],

  // ── Resale & Secondhand ────────────────────────────────────────────
  [/\bPoshmark\b/, "Poshmark"],
  [/\bDepop\b/, "Depop"],
  [/\bStockX\b/, "StockX"],
  [/\bGOAT\b/, "GOAT"],
  [/\bThredUp\b/, "ThredUp"],
  [/\bThe RealReal\b/, "The RealReal"],
  [/\bVestiaire Collective\b/, "Vestiaire Collective"],

  // ── Payments & Fintech ─────────────────────────────────────────────
  [/\bKlarna\b/, "Klarna"],
  [/\bAfterpay\b/, "Afterpay"],
  [/\bAffirm\b/, "Affirm"],
  [/\bShop Pay\b/, "Shop Pay"],
  [/\bPayPal\b/, "PayPal"],
  [/\bSquare\b(?!\s+(foot|feet|meter|mile|root|dance))/i, "Square"],
  [/\bAdyen\b/, "Adyen"],
];

function extractBrandMentions(text: string): string[] {
  const found = new Set<string>();

  for (const [pattern, name] of KNOWN_BRAND_PATTERNS) {
    if (pattern.test(text)) {
      found.add(name);
    }
  }

  return Array.from(found);
}
