/**
 * AI Agent Profiles & Per-Agent Compatibility Scoring
 *
 * Each real-world AI shopping agent gets a weighted "lens" applied to
 * the same 7 Robot Shopper categories. Feed/API agents care about structured
 * data; browser-automation agents care about navigation and checkout UX.
 */

import type { CategoryId, CategoryScore } from "@/types/report";

// ---- Types ----

export type AIAgentId =
  | "chatgpt-shopping"
  | "google-ai-mode"
  | "perplexity-shopping"
  | "microsoft-copilot"
  | "klarna-ai"
  | "chatgpt-operator"
  | "amazon-buyforme"
  | "perplexity-comet"
  | "claude-computer-use"
  | "openclaw";

export type AIAgentType = "feed" | "browser";

export type AdoptionLevel = "Mainstream" | "Early Mainstream" | "Early Adopter" | "Experimental";

export interface AIAgentProfile {
  id: AIAgentId;
  name: string;
  company: string;
  logo: string;
  type: AIAgentType;
  description: string;
  howItWorks: string;
  whatItNeeds: string;
  adoptionLevel: AdoptionLevel;
  weights: Record<CategoryId, number>;
  url: string;
  protocol?: string;
}

// ---- Agent Profiles ----

export const AI_AGENT_PROFILES: AIAgentProfile[] = [
  // ---- Feed/API-First Agents ----
  {
    id: "chatgpt-shopping",
    name: "ChatGPT Shopping",
    company: "OpenAI",
    logo: "chatgpt",
    type: "feed",
    description: "ChatGPT's built-in shopping experience surfaces products directly in conversation. It reads product feeds, structured data, and can initiate checkout sessions via the Agentic Commerce Protocol (ACP).",
    howItWorks: "Reads product feeds and structured data (Schema.org, JSON-LD). Uses ACP with Stripe for programmatic checkout sessions — no browser needed.",
    whatItNeeds: "Rich product schema markup, ACP endpoints, clean Open Graph tags, and a robots.txt that allows GPTBot.",
    adoptionLevel: "Mainstream",
    weights: {
      "discoverability": 0.20,
      "product-understanding": 0.20,
      "navigation-interaction": 0.00,
      "cart-checkout": 0.10,
      "performance-resilience": 0.10,
      "data-standards": 0.20,
      "agentic-commerce": 0.20,
    },
    url: "https://openai.com/index/chatgpt-shopping/",
    protocol: "ACP (Agentic Commerce Protocol)",
  },
  {
    id: "google-ai-mode",
    name: "Google AI Mode",
    company: "Google",
    logo: "google",
    type: "feed",
    description: "Google's AI-powered search experience that synthesizes product information from across the web, providing shopping recommendations directly in search results.",
    howItWorks: "Leverages Google's existing product index, Shopping Graph, and merchant feeds. Reads structured data and product listings to generate AI-powered shopping responses.",
    whatItNeeds: "Google Merchant Center feeds, Schema.org Product markup, strong SEO fundamentals, and compliance with Google's crawling policies.",
    adoptionLevel: "Early Mainstream",
    weights: {
      "discoverability": 0.20,
      "product-understanding": 0.20,
      "navigation-interaction": 0.00,
      "cart-checkout": 0.10,
      "performance-resilience": 0.10,
      "data-standards": 0.20,
      "agentic-commerce": 0.20,
    },
    url: "https://blog.google/products/search/ai-mode-search/",
    protocol: "UCP (Universal Checkout Protocol)",
  },
  {
    id: "perplexity-shopping",
    name: "Perplexity Shopping",
    company: "Perplexity",
    logo: "perplexity",
    type: "feed",
    description: "Perplexity's Buy with Pro feature lets users discover and evaluate products directly within search results, with one-click checkout for Pro subscribers. Emphasizes product data accuracy and comparison.",
    howItWorks: "Crawls product pages for structured data, compares across retailers, and presents curated results. Supports one-click checkout for Pro subscribers.",
    whatItNeeds: "Accurate product schema with pricing and availability, clean sitemaps, and permission for PerplexityBot in robots.txt.",
    adoptionLevel: "Early Adopter",
    weights: {
      "discoverability": 0.20,
      "product-understanding": 0.25,
      "navigation-interaction": 0.00,
      "cart-checkout": 0.10,
      "performance-resilience": 0.10,
      "data-standards": 0.25,
      "agentic-commerce": 0.10,
    },
    url: "https://www.perplexity.ai/hub/blog/perplexity-shopping",
    protocol: undefined,
  },
  {
    id: "microsoft-copilot",
    name: "Microsoft Copilot",
    company: "Microsoft",
    logo: "microsoft",
    type: "feed",
    description: "Microsoft's AI assistant integrates shopping recommendations into Bing search and the Copilot interface, leveraging Microsoft's shopping graph and Bing product index.",
    howItWorks: "Uses Bing's product index and Microsoft Shopping graph. Reads structured data from pages and merchant feeds to surface product recommendations in conversation.",
    whatItNeeds: "Bing Webmaster compliance, Schema.org markup, Open Graph tags, and clean structured data that Bingbot can crawl.",
    adoptionLevel: "Early Mainstream",
    weights: {
      "discoverability": 0.20,
      "product-understanding": 0.15,
      "navigation-interaction": 0.00,
      "cart-checkout": 0.15,
      "performance-resilience": 0.10,
      "data-standards": 0.20,
      "agentic-commerce": 0.20,
    },
    url: "https://copilot.microsoft.com",
    protocol: undefined,
  },
  {
    id: "klarna-ai",
    name: "Klarna AI",
    company: "Klarna",
    logo: "klarna",
    type: "feed",
    description: "Klarna's AI shopping assistant helps users find products across Klarna's merchant network, with deep integration into payment and price comparison features.",
    howItWorks: "Leverages Klarna's merchant product feeds and the Klarna App Protocol (APP). Focuses heavily on pricing accuracy, availability, and comparison shopping.",
    whatItNeeds: "Product feeds with accurate pricing and stock data, Klarna merchant integration, and rich product schema for comparison features.",
    adoptionLevel: "Early Mainstream",
    weights: {
      "discoverability": 0.15,
      "product-understanding": 0.25,
      "navigation-interaction": 0.00,
      "cart-checkout": 0.10,
      "performance-resilience": 0.10,
      "data-standards": 0.30,
      "agentic-commerce": 0.10,
    },
    url: "https://www.klarna.com/international/press/klarna-launches-ai-shopping-assistant/",
    protocol: "Klarna APP",
  },

  // ---- Browser-Automation Agents ----
  {
    id: "chatgpt-operator",
    name: "ChatGPT Operator",
    company: "OpenAI",
    logo: "chatgpt",
    type: "browser",
    description: "OpenAI's browser-automation agent that can navigate websites, fill forms, and attempt multi-step tasks on behalf of users — including e-commerce shopping flows.",
    howItWorks: "Launches a real browser session and visually navigates the site like a human. Clicks buttons, fills forms, handles popups, and attempts the full checkout flow. Requires clear UI and accessible interactive elements.",
    whatItNeeds: "Clean, navigable UI with labeled buttons. No aggressive bot detection, working guest checkout, and minimal CAPTCHA interference.",
    adoptionLevel: "Early Adopter",
    weights: {
      "discoverability": 0.10,
      "product-understanding": 0.10,
      "navigation-interaction": 0.25,
      "cart-checkout": 0.30,
      "performance-resilience": 0.20,
      "data-standards": 0.05,
      "agentic-commerce": 0.00,
    },
    url: "https://openai.com/index/introducing-operator/",
    protocol: undefined,
  },
  {
    id: "amazon-buyforme",
    name: "Amazon Buy For Me",
    company: "Amazon",
    logo: "amazon",
    type: "browser",
    description: "Amazon's agent that can browse and shop for products on third-party retailer websites on behalf of the user, extending Amazon's shopping experience beyond its own marketplace.",
    howItWorks: "Uses browser automation to navigate external retailer sites. Fills in shipping and payment details, handles variant selection, and attempts to complete checkout on non-Amazon sites.",
    whatItNeeds: "Standard e-commerce UI patterns, guest checkout support, clearly labeled form fields, and no bot-blocking on the checkout flow.",
    adoptionLevel: "Early Adopter",
    weights: {
      "discoverability": 0.10,
      "product-understanding": 0.15,
      "navigation-interaction": 0.20,
      "cart-checkout": 0.30,
      "performance-resilience": 0.20,
      "data-standards": 0.05,
      "agentic-commerce": 0.00,
    },
    url: "https://www.aboutamazon.com/news/retail/amazon-buy-for-me-ai-shopping",
    protocol: undefined,
  },
  {
    id: "perplexity-comet",
    name: "Perplexity Comet",
    company: "Perplexity",
    logo: "perplexity",
    type: "browser",
    description: "Perplexity's browser agent (code-named Comet) that performs web tasks autonomously, including navigating e-commerce sites to research and shop for products.",
    howItWorks: "Automates a browser to navigate sites, interact with UI elements, compare products, and attempt the checkout flow. Combines Perplexity's search intelligence with browser automation.",
    whatItNeeds: "Accessible navigation, labeled interactive elements, working add-to-cart and checkout flows, and no aggressive bot detection.",
    adoptionLevel: "Experimental",
    weights: {
      "discoverability": 0.10,
      "product-understanding": 0.15,
      "navigation-interaction": 0.25,
      "cart-checkout": 0.25,
      "performance-resilience": 0.20,
      "data-standards": 0.05,
      "agentic-commerce": 0.00,
    },
    url: "https://www.perplexity.ai",
    protocol: undefined,
  },
  {
    id: "claude-computer-use",
    name: "Claude Computer Use",
    company: "Anthropic",
    logo: "claude",
    type: "browser",
    description: "Anthropic's computer use capability allows Claude to control a computer's mouse and keyboard to interact with websites, including completing e-commerce transactions.",
    howItWorks: "Takes screenshots and uses visual understanding to navigate. Moves cursor, clicks elements, and types into forms. Relies heavily on visual clarity, performance, and accessible UI patterns.",
    whatItNeeds: "Fast page loads, visually clear buttons and labels, no CAPTCHA, stable DOM, and standard checkout flows that work with keyboard/mouse automation.",
    adoptionLevel: "Experimental",
    weights: {
      "discoverability": 0.05,
      "product-understanding": 0.10,
      "navigation-interaction": 0.25,
      "cart-checkout": 0.30,
      "performance-resilience": 0.25,
      "data-standards": 0.05,
      "agentic-commerce": 0.00,
    },
    url: "https://docs.anthropic.com/en/docs/agents-and-tools/computer-use",
    protocol: undefined,
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    company: "OpenClaw",
    logo: "openclaw",
    type: "browser",
    description: "An open-source AI shopping agent that uses browser automation to find, compare, and shop for products across any e-commerce site.",
    howItWorks: "Open-source browser automation agent that navigates sites, interacts with product pages, and attempts the full shopping flow. Community-driven and extensible.",
    whatItNeeds: "Standard web patterns, labeled elements, working cart/checkout, no bot blocking. Benefits from the same optimizations as other browser agents.",
    adoptionLevel: "Experimental",
    weights: {
      "discoverability": 0.10,
      "product-understanding": 0.10,
      "navigation-interaction": 0.25,
      "cart-checkout": 0.30,
      "performance-resilience": 0.20,
      "data-standards": 0.05,
      "agentic-commerce": 0.00,
    },
    url: "https://www.openclaw.com",
    protocol: undefined,
  },
];

// ---- Scoring Functions ----

/**
 * Compute a single agent's compatibility score as a weighted dot product
 * of category scores and the agent's weight profile.
 */
export function computeAgentScore(
  categoryScores: CategoryScore[],
  agentId: AIAgentId
): number {
  const profile = AI_AGENT_PROFILES.find((p) => p.id === agentId);
  if (!profile) return 0;

  const scoreMap = new Map(categoryScores.map((c) => [c.id, c.score]));
  let weighted = 0;

  for (const [catId, weight] of Object.entries(profile.weights) as [CategoryId, number][]) {
    const catScore = scoreMap.get(catId) ?? 0;
    weighted += catScore * weight;
  }

  return Math.round(weighted);
}

/**
 * Compute compatibility scores for all 10 agents at once.
 */
export function computeAllAgentScores(
  categoryScores: CategoryScore[]
): Record<AIAgentId, number> {
  const result = {} as Record<AIAgentId, number>;
  for (const profile of AI_AGENT_PROFILES) {
    result[profile.id] = computeAgentScore(categoryScores, profile.id);
  }
  return result;
}

// ---- Helpers ----

export function getAgentProfile(id: AIAgentId): AIAgentProfile | undefined {
  return AI_AGENT_PROFILES.find((p) => p.id === id);
}

export function getFeedAgents(): AIAgentProfile[] {
  return AI_AGENT_PROFILES.filter((p) => p.type === "feed");
}

export function getBrowserAgents(): AIAgentProfile[] {
  return AI_AGENT_PROFILES.filter((p) => p.type === "browser");
}
