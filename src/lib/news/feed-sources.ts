/**
 * Centralized feed source definitions for the Robot Shopper intel system.
 * Import this in seed scripts and anywhere feed lists are needed.
 */

export type SourceType = "rss" | "blog" | "newsletter" | "youtube" | "podcast" | "reddit" | "twitter";

export interface FeedSourceDef {
  name: string;
  url: string;
  category: string;
  sourceType?: SourceType;
}

export const FEED_SOURCES: FeedSourceDef[] = [
  // ── AI Labs ────────────────────────────────────────────────────────
  { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", category: "ai-lab", sourceType: "blog" },
  { name: "Google AI Blog", url: "https://blog.google/technology/ai/rss/", category: "ai-lab", sourceType: "blog" },
  { name: "Anthropic Blog", url: "https://www.anthropic.com/rss.xml", category: "ai-lab", sourceType: "blog" },
  { name: "Meta AI Blog", url: "https://ai.meta.com/blog/rss/", category: "ai-lab", sourceType: "blog" },
  { name: "Microsoft AI Blog", url: "https://blogs.microsoft.com/ai/feed/", category: "ai-lab", sourceType: "blog" },
  { name: "Google DeepMind Blog", url: "https://deepmind.google/blog/rss.xml", category: "ai-lab", sourceType: "blog" },
  { name: "Cohere Blog", url: "https://cohere.com/blog/rss.xml", category: "ai-lab", sourceType: "blog" },
  { name: "Mistral AI Blog", url: "https://mistral.ai/feed/", category: "ai-lab", sourceType: "blog" },

  // ── E-commerce Platforms ───────────────────────────────────────────
  { name: "Shopify Engineering", url: "https://shopify.engineering/blog/feed", category: "ecommerce", sourceType: "blog" },
  { name: "Stripe Blog", url: "https://stripe.com/blog/feed.rss", category: "ecommerce", sourceType: "blog" },
  { name: "BigCommerce Blog", url: "https://www.bigcommerce.com/blog/feed/", category: "ecommerce", sourceType: "blog" },
  { name: "WooCommerce Blog", url: "https://developer.woocommerce.com/feed/", category: "ecommerce", sourceType: "blog" },
  { name: "Adobe Commerce Blog", url: "https://business.adobe.com/blog/rss.xml", category: "ecommerce", sourceType: "blog" },
  { name: "Klaviyo Blog", url: "https://www.klaviyo.com/blog/feed", category: "ecommerce", sourceType: "blog" },
  { name: "Bold Commerce Blog", url: "https://boldcommerce.com/blog/rss.xml", category: "ecommerce", sourceType: "blog" },
  { name: "Salsify Blog", url: "https://www.salsify.com/blog/rss.xml", category: "ecommerce", sourceType: "blog" },

  // ── Company Blogs (new) ───────────────────────────────────────────
  { name: "Amazon Science", url: "https://www.amazon.science/index.rss", category: "ecommerce", sourceType: "blog" },
  { name: "PayPal Engineering", url: "https://medium.com/feed/paypal-tech", category: "ecommerce", sourceType: "blog" },
  { name: "Perplexity Blog", url: "https://www.perplexity.ai/hub/blog/rss.xml", category: "ai-lab", sourceType: "blog" },
  { name: "commercetools Blog", url: "https://commercetools.com/blog/rss.xml", category: "ecommerce", sourceType: "blog" },
  { name: "Mastercard Newsroom", url: "https://www.mastercard.com/news/rss/", category: "ecommerce", sourceType: "blog" },

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
  { name: "LangChain Blog", url: "https://blog.langchain.dev/rss/", category: "ai-agent", sourceType: "blog" },
  { name: "AutoGPT Blog", url: "https://news.agpt.co/feed/", category: "ai-agent", sourceType: "blog" },
  { name: "Adept AI Blog", url: "https://www.adept.ai/blog/rss.xml", category: "ai-agent", sourceType: "blog" },
  { name: "MultiOn Blog", url: "https://www.multion.ai/blog/rss.xml", category: "ai-agent", sourceType: "blog" },
  { name: "Fixie AI Blog", url: "https://blog.fixie.ai/feed", category: "ai-agent", sourceType: "blog" },
  { name: "AI Agent Newsletter", url: "https://www.aiagent.email/feed", category: "ai-agent", sourceType: "newsletter" },
  { name: "The Rundown AI", url: "https://www.therundown.ai/feed", category: "ai-agent", sourceType: "newsletter" },

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
  { name: "Shopify Partners Blog", url: "https://www.shopify.com/partners/blog/feed", category: "dtc-brand", sourceType: "blog" },

  // ── Industry Analysis ──────────────────────────────────────────────
  { name: "a16z", url: "https://a16z.com/feed/", category: "industry-analysis", sourceType: "blog" },
  { name: "Benedict Evans", url: "https://www.ben-evans.com/feed", category: "industry-analysis", sourceType: "blog" },
  { name: "Stratechery", url: "https://stratechery.com/feed/", category: "industry-analysis", sourceType: "blog" },
  { name: "CB Insights", url: "https://www.cbinsights.com/research/feed/", category: "industry-analysis" },

  // ── Newsletters ────────────────────────────────────────────────────
  { name: "FourWeekMBA", url: "https://fourweekmba.com/feed/", category: "industry-analysis", sourceType: "newsletter" },
  { name: "The AI Breakdown", url: "https://www.theaibreakdown.com/feed", category: "ai-agent", sourceType: "newsletter" },

  // ── Podcasts (RSS feeds — show notes and descriptions) ─────────────
  { name: "Jason & Scot Show", url: "https://feeds.simplecast.com/bVXYq3OE", category: "retail-news", sourceType: "podcast" },
  { name: "Latent Space Podcast", url: "https://api.substack.com/feed/podcast/1084089.rss", category: "ai-agent", sourceType: "podcast" },
  { name: "Future Commerce", url: "https://feeds.simplecast.com/yEjb8TV3", category: "ecommerce", sourceType: "podcast" },
  { name: "All-In Podcast", url: "https://feeds.megaphone.fm/all-in-with-chamath-jason-sacks-and-friedberg", category: "industry-analysis", sourceType: "podcast" },
  { name: "20VC with Harry Stebbings", url: "https://feeds.megaphone.fm/20vc", category: "industry-analysis", sourceType: "podcast" },
  { name: "No Priors", url: "https://feeds.transistor.fm/no-priors-ai-machine-learning-technology-and", category: "ai-agent", sourceType: "podcast" },
  { name: "The Cognitive Revolution", url: "https://feeds.buzzsprout.com/2124832.rss", category: "ai-agent", sourceType: "podcast" },
  { name: "Pivot", url: "https://feeds.megaphone.fm/pivot", category: "tech-news", sourceType: "podcast" },
  { name: "Retail Gets Real", url: "https://feeds.simplecast.com/OVMTIfQk", category: "retail-news", sourceType: "podcast" },
  { name: "Shopify Masters", url: "https://feeds.shopify.com/shopify-masters", category: "ecommerce", sourceType: "podcast" },
  { name: "Greg Isenberg Startup Ideas", url: "https://feeds.megaphone.fm/startup-ideas-podcast", category: "industry-analysis", sourceType: "podcast" },
  { name: "Founders Podcast", url: "https://feeds.transistor.fm/founders", category: "industry-analysis", sourceType: "podcast" },
  { name: "Acquired", url: "https://feeds.pacific-content.com/acquired", category: "industry-analysis", sourceType: "podcast" },
  { name: "Lex Fridman Podcast", url: "https://lexfridman.com/feed/podcast/", category: "tech-news", sourceType: "podcast" },
  { name: "a16z Podcast", url: "https://feeds.simplecast.com/JGE3yC0V", category: "industry-analysis", sourceType: "podcast" },

  // ── YouTube (channel RSS feeds) ────────────────────────────────────
  { name: "Lightcone / YC", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCcefcZRL2oaA_uBNeo5UOWg", category: "industry-analysis", sourceType: "youtube" },
  { name: "a16z YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCE-E2bGiakLsBgl_mLEhSug", category: "industry-analysis", sourceType: "youtube" },
  { name: "Latent Space YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCWjBpFRzYt4vB3zIleLCrLA", category: "ai-agent", sourceType: "youtube" },
  { name: "Dwarkesh Patel", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCXnKE4mGqOXiKLFoTbGRJwA", category: "tech-news", sourceType: "youtube" },
  { name: "Shopify YouTube", url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCcefcZRL2oaA_uBNeo5UOWg", category: "ecommerce", sourceType: "youtube" },

  // ── Reddit (subreddit JSON feeds) ──────────────────────────────────
  { name: "r/AI_Agents", url: "https://www.reddit.com/r/AI_Agents/new.json?limit=25", category: "ai-agent", sourceType: "reddit" },
  { name: "r/shopifyDev", url: "https://www.reddit.com/r/shopifyDev/new.json?limit=25", category: "ecommerce", sourceType: "reddit" },
  { name: "r/ecommerce", url: "https://www.reddit.com/r/ecommerce/new.json?limit=25", category: "ecommerce", sourceType: "reddit" },
  { name: "r/Entrepreneur", url: "https://www.reddit.com/r/Entrepreneur/new.json?limit=25", category: "dtc-brand", sourceType: "reddit" },
];
