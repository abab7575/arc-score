/**
 * Centralized RSS feed source definitions for the ARC Score intel system.
 * Import this in seed scripts and anywhere feed lists are needed.
 */

export interface FeedSourceDef {
  name: string;
  url: string;
  category: string;
}

export const FEED_SOURCES: FeedSourceDef[] = [
  // ── AI Labs ────────────────────────────────────────────────────────
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", category: "ai-lab" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", category: "ai-lab" },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/rss.xml", category: "ai-lab" },
  { name: "Meta AI Blog", url: "https://ai.meta.com/blog/rss/", category: "ai-lab" },
  { name: "Microsoft AI Blog", url: "https://blogs.microsoft.com/ai/feed/", category: "ai-lab" },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/rss.xml", category: "ai-lab" },
  { name: "Cohere Blog", url: "https://cohere.com/blog/rss.xml", category: "ai-lab" },
  { name: "Mistral AI Blog", url: "https://mistral.ai/feed/", category: "ai-lab" },

  // ── E-commerce Platforms ───────────────────────────────────────────
  { name: "Shopify Engineering", url: "https://shopify.engineering/blog/feed", category: "ecommerce" },
  { name: "Stripe Blog", url: "https://stripe.com/blog/feed.rss", category: "ecommerce" },
  { name: "BigCommerce Blog", url: "https://www.bigcommerce.com/blog/feed/", category: "ecommerce" },
  { name: "WooCommerce Blog", url: "https://developer.woocommerce.com/feed/", category: "ecommerce" },
  { name: "Adobe Commerce Blog", url: "https://business.adobe.com/blog/rss.xml", category: "ecommerce" },
  { name: "Klaviyo Blog", url: "https://www.klaviyo.com/blog/feed", category: "ecommerce" },
  { name: "Bold Commerce Blog", url: "https://boldcommerce.com/blog/rss.xml", category: "ecommerce" },
  { name: "Salsify Blog", url: "https://www.salsify.com/blog/rss.xml", category: "ecommerce" },

  // ── Retail & Commerce News ─────────────────────────────────────────
  { name: "Retail Dive", url: "https://www.retaildive.com/feeds/news/", category: "retail-news" },
  { name: "Digital Commerce 360", url: "https://www.digitalcommerce360.com/feed/", category: "retail-news" },
  { name: "Modern Retail", url: "https://www.modernretail.co/feed/", category: "retail-news" },
  { name: "Retail Brew", url: "https://www.retailbrew.com/feed", category: "retail-news" },
  { name: "Chain Store Age", url: "https://chainstoreage.com/feed", category: "retail-news" },
  { name: "NRF Blog", url: "https://nrf.com/blog/feed", category: "retail-news" },
  { name: "Practical Ecommerce", url: "https://www.practicalecommerce.com/feed", category: "retail-news" },
  { name: "eMarketer", url: "https://www.insiderintelligence.com/rss/", category: "retail-news" },

  // ── AI Agent-Specific ──────────────────────────────────────────────
  { name: "LangChain Blog", url: "https://blog.langchain.dev/rss/", category: "ai-agent" },
  { name: "AutoGPT Blog", url: "https://news.agpt.co/feed/", category: "ai-agent" },
  { name: "Adept AI Blog", url: "https://www.adept.ai/blog/rss.xml", category: "ai-agent" },
  { name: "MultiOn Blog", url: "https://www.multion.ai/blog/rss.xml", category: "ai-agent" },
  { name: "Perplexity Blog", url: "https://www.perplexity.ai/hub/blog/rss.xml", category: "ai-agent" },
  { name: "Fixie AI Blog", url: "https://blog.fixie.ai/feed", category: "ai-agent" },
  { name: "AI Agent Newsletter", url: "https://www.aiagent.email/feed", category: "ai-agent" },
  { name: "The Rundown AI", url: "https://www.therundown.ai/feed", category: "ai-agent" },

  // ── Tech News ──────────────────────────────────────────────────────
  { name: "TechCrunch AI", url: "https://techcrunch.com/category/artificial-intelligence/feed/", category: "tech-news" },
  { name: "The Verge AI", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "tech-news" },
  { name: "Ars Technica AI", url: "https://feeds.arstechnica.com/arstechnica/technology-lab", category: "tech-news" },
  { name: "Wired AI", url: "https://www.wired.com/feed/tag/ai/latest/rss", category: "tech-news" },
  { name: "VentureBeat AI", url: "https://venturebeat.com/category/ai/feed/", category: "tech-news" },
  { name: "MIT Technology Review AI", url: "https://www.technologyreview.com/topic/artificial-intelligence/feed", category: "tech-news" },
  { name: "The Information", url: "https://www.theinformation.com/feed", category: "tech-news" },

  // ── Shopping & Consumer ────────────────────────────────────────────
  { name: "Product Hunt", url: "https://www.producthunt.com/feed", category: "shopping-consumer" },
  { name: "Glossy", url: "https://www.glossy.co/feed/", category: "shopping-consumer" },
  { name: "Mashable", url: "https://mashable.com/feeds/rss/all", category: "shopping-consumer" },
  { name: "CNET", url: "https://www.cnet.com/rss/news/", category: "shopping-consumer" },
  { name: "IndieHackers", url: "https://www.indiehackers.com/feed.xml", category: "shopping-consumer" },

  // ── DTC / Brand Industry ───────────────────────────────────────────
  { name: "2PM", url: "https://2pml.com/feed/", category: "dtc-brand" },
  { name: "Lean Luxe", url: "https://leanluxe.com/feed/", category: "dtc-brand" },
  { name: "DTC Newsletter", url: "https://www.directtoconsumer.co/feed", category: "dtc-brand" },
  { name: "Shopify Partners Blog", url: "https://www.shopify.com/partners/blog/feed", category: "dtc-brand" },

  // ── Industry Analysis ──────────────────────────────────────────────
  { name: "a16z", url: "https://a16z.com/feed/", category: "industry-analysis" },
  { name: "Benedict Evans", url: "https://www.ben-evans.com/feed", category: "industry-analysis" },
  { name: "Stratechery", url: "https://stratechery.com/feed/", category: "industry-analysis" },
  { name: "CB Insights", url: "https://www.cbinsights.com/research/feed/", category: "industry-analysis" },
];
