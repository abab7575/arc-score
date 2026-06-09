/**
 * Fix-prompt generator (F3): one well-crafted Claude Code prompt template
 * per failed check, parameterised with the brand's actual findings.
 * The output is meant to be pasted into Claude Code from the merchant's
 * own site repository.
 */

import { TRACKED_AGENTS } from "@/lib/site";

export interface FixPromptInput {
  domain: string; // e.g. nike.com
  agentStatus: Record<string, string>;
  signals: {
    jsonLd: boolean;
    schemaProduct: boolean;
    openGraph: boolean;
    sitemap: boolean;
    productFeed: boolean;
    llmsTxt: boolean;
    agentsTxt: boolean;
  };
  platform?: string | null;
  waf?: string | null;
}

export interface FixPrompt {
  id: string;
  title: string;
  prompt: string;
}

const agentLine = (id: string) => {
  const a = TRACKED_AGENTS.find((x) => x.id === id);
  return a ? `${id} (${a.company} — ${a.product})` : id;
};

function platformNote(platform?: string | null): string {
  if (!platform || platform === "unknown" || platform === "custom") return "";
  return ` The site runs on ${platform}, so prefer that platform's idiomatic way of serving these files/markup (theme templates, app settings, or metafields) over hand-rolled middleware where it exists.`;
}

export function buildFixPrompts(input: FixPromptInput): FixPrompt[] {
  const prompts: FixPrompt[] = [];
  const { domain, agentStatus, signals } = input;

  const policyBlocked = Object.entries(agentStatus)
    .filter(([, s]) => s === "blocked")
    .map(([a]) => a);
  const wafRestricted = Object.entries(agentStatus)
    .filter(([, s]) => s === "restricted")
    .map(([a]) => a);

  if (policyBlocked.length > 0) {
    prompts.push({
      id: "robots-blocked",
      title: `robots.txt blocks ${policyBlocked.length} AI agent${policyBlocked.length === 1 ? "" : "s"}`,
      prompt: `My e-commerce site is ${domain}. Our robots.txt currently disallows these AI agents, which prevents AI assistants from reading, recommending, or buying our products:

${policyBlocked.map((a) => `- ${agentLine(a)}`).join("\n")}

Find where robots.txt is generated or stored in this repository (static file in public/, a robots route/handler, or platform config).${platformNote(input.platform)} Then:

1. Add an explicit "Allow: /" rule for each agent above (keep any existing Disallow rules for genuinely private paths like /cart, /checkout, /account).
2. Do NOT loosen rules for any user-agent we haven't listed, and preserve the existing sitemap reference.
3. Show me a diff of the change and list each agent whose effective access changes from blocked to allowed.
4. If robots.txt is managed by the e-commerce platform rather than this repo, tell me exactly where in the platform's admin to change it instead.

Context: this was flagged by ARC Report (arcreport.ai/brand) — verify after deploy by fetching https://${domain}/robots.txt and checking the rules for each agent listed above.`,
    });
  }

  if (wafRestricted.length > 0) {
    prompts.push({
      id: "waf-restricted",
      title: `WAF/CDN blocks ${wafRestricted.length} agent${wafRestricted.length === 1 ? "" : "s"} despite robots.txt allowing them`,
      prompt: `My e-commerce site is ${domain}. Our robots.txt does not block these AI agents, but live HTTP tests show our WAF/CDN${input.waf && input.waf !== "none-detected" ? ` (detected: ${input.waf})` : ""} returns 403s or challenge pages to them:

${wafRestricted.map((a) => `- ${agentLine(a)}`).join("\n")}

This means our stated policy (allow) and our enforcement (block) disagree, and AI assistants silently fail on our store. In this repository and our infrastructure config:

1. Search for bot-management or firewall configuration (Cloudflare rules in code/terraform, vercel.json, middleware that filters user-agents, security headers config).
2. Where we control it in code, add allowlist entries for the user-agents above — scoped to product, category, and content pages only; keep protections on /cart, /checkout, /account, and admin routes.
3. Show me the diff, and flag any rule you find that blanket-blocks "bot-like" traffic.
4. If the blocking happens in a dashboard we don't keep in code (e.g. Cloudflare Super Bot Fight Mode, DataDome, PerimeterX), tell me the exact product setting to change and what to set it to.

After deploy, verify with: curl -A "GPTBot/1.0" -I https://${domain}/ (expect 200, not 403).`,
    });
  }

  if (!signals.schemaProduct || !signals.jsonLd) {
    prompts.push({
      id: "structured-data",
      title: signals.jsonLd ? "No Schema.org Product markup" : "No JSON-LD structured data",
      prompt: `My e-commerce site is ${domain}. A scan found ${
        signals.jsonLd
          ? "JSON-LD on the site but no Schema.org Product markup"
          : "no JSON-LD structured data at all"
      }, so AI shopping agents can't reliably read our product names, prices, availability, or images.${platformNote(input.platform)}

In this repository:

1. Find the product page template/component and add a JSON-LD <script type="application/ld+json"> block with Schema.org Product markup: name, description, image, sku, brand, and an Offer with price, priceCurrency, availability (use schema.org/InStock | OutOfStock), and url. Populate every field from our real product data — no placeholders.
2. Add an Organization JSON-LD block to the base layout (name, url, logo) if missing.
3. If we have category/listing pages, add ItemList markup referencing the product URLs.
4. Show me one fully rendered example of the JSON-LD for a real product, then validate the shape against Google's Rich Results requirements for Product and fix any warnings you can detect statically.

Verify after deploy with https://search.google.com/test/rich-results on a product URL.`,
    });
  }

  if (!signals.openGraph) {
    prompts.push({
      id: "open-graph",
      title: "No Open Graph tags",
      prompt: `My e-commerce site is ${domain}. A scan found no Open Graph meta tags, so link previews and many AI agents see untitled, imageless pages.${platformNote(input.platform)}

In this repository:

1. Add og:title, og:description, og:image, og:url, and og:type to the base layout's <head>, with sensible site-wide defaults.
2. On product pages, override them per product: og:type "product", the product image as og:image (absolute URL, ≥1200×630 where available), and the live price in og:description.
3. Add twitter:card "summary_large_image" alongside.
4. Show me the diff and one rendered <head> for a real product page.`,
    });
  }

  if (!signals.sitemap) {
    prompts.push({
      id: "sitemap",
      title: "No sitemap.xml",
      prompt: `My e-commerce site is ${domain}. A scan could not find a sitemap.xml, so crawlers and AI agents have no reliable way to discover our product pages.${platformNote(input.platform)}

In this repository:

1. Generate a sitemap.xml covering the homepage, category pages, and every product page, with <lastmod> from each product's updated-at where available.
2. If the catalog is large, split into a sitemap index with child sitemaps of ≤50,000 URLs.
3. Reference the sitemap from robots.txt ("Sitemap: https://${domain}/sitemap.xml").
4. Make it regenerate automatically (build step or on-demand route) rather than a one-off static file, and show me the diff.`,
    });
  }

  if (!signals.llmsTxt) {
    prompts.push({
      id: "llms-txt",
      title: "No llms.txt",
      prompt: `My e-commerce site is ${domain}. We don't publish an llms.txt file yet — the emerging convention (llmstxt.org) that gives language models a concise, curated guide to a site.

In this repository:

1. Create /llms.txt (served at https://${domain}/llms.txt as text/plain or text/markdown) following the llms.txt format:
   - H1 with our brand name,
   - a one-paragraph blockquote summary of what we sell and who we serve,
   - sections linking to our most useful pages for an AI agent: bestsellers/category pages, shipping & returns policy, size guides, FAQ/support, and store locator if any.
2. Write the summary from this repository's real content (README, about page, homepage copy) — keep it factual, no marketing superlatives.
3. Keep it under ~200 lines, every link absolute.
4. Show me the full file content and where you wired it to be served.

Verify after deploy: curl https://${domain}/llms.txt`,
    });
  }

  if (!signals.productFeed) {
    prompts.push({
      id: "product-feed",
      title: "No machine-readable product feed",
      prompt: `My e-commerce site is ${domain}. A scan found no machine-readable product feed, which feed-based AI shopping agents (ChatGPT Shopping, Klarna, Google AI Mode) rely on.${platformNote(input.platform)}

In this repository:

1. Determine where product data lives (database models, CMS, platform API) and add a product feed endpoint — Google Merchant–compatible XML (RSS 2.0 with the g: namespace) at /feeds/products.xml, or JSON if that's more idiomatic here.
2. Include per item: id, title, description, link, image_link, price with currency, availability, brand, and gtin/mpn when we have them.
3. Paginate or stream if the catalog is large; cache for ~1 hour.
4. Link the feed from robots.txt or a <link rel="alternate"> in the layout, show me the diff, and print the first two feed items rendered from real data.`,
    });
  }

  return prompts;
}
