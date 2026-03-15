/**
 * Educational Topics — Static array of explainer topics for content generation.
 * Rotated through by the intelligence engine.
 */

export interface EducationalTopic {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  accentColor?: string;
}

export const EDUCATIONAL_TOPICS: EducationalTopic[] = [
  // ── Categories ──────────────────────────────────────────────────
  {
    id: "cat-discoverability",
    title: "What is Discoverability?",
    subtitle: "Can AI agents find your products from the homepage? This category measures how easy it is for agents to navigate, search, and find product listings.",
    bullets: [
      "Internal search functionality that works with structured queries",
      "Clear navigation paths from homepage to product pages",
      "Sitemap coverage so crawlers can index every product",
      "Category pages with filterable, structured product grids",
      "Robots.txt that allows AI agent crawlers (GPTBot, PerplexityBot, etc.)",
    ],
  },
  {
    id: "cat-product-understanding",
    title: "What is Product Understanding?",
    subtitle: "Can AI agents read and interpret product details — price, size, color, availability? This is the foundation of AI-powered shopping.",
    bullets: [
      "Schema.org Product markup with price, availability, and variants",
      "Clean, structured product titles and descriptions",
      "Image alt text that describes the product accurately",
      "Variant data (size, color) in machine-readable format",
      "Review and rating data in structured markup",
    ],
  },
  {
    id: "cat-navigation-interaction",
    title: "What is Navigation & Interaction?",
    subtitle: "Can AI agents click buttons, use filters, select options, and move between pages? Browser-automation agents depend heavily on this.",
    bullets: [
      "Buttons and links with accessible labels (not just icons)",
      "Working filter and sort controls on listing pages",
      "Variant selectors (size/color pickers) that update page state",
      "Stable DOM elements that don't shift or break under automation",
      "Standard HTML form patterns — no custom-rendered dropdowns that block agents",
    ],
  },
  {
    id: "cat-cart-checkout",
    title: "What is Cart & Checkout?",
    subtitle: "Can AI agents add items to cart and complete a purchase? The hardest and most valuable step in the agent shopping journey.",
    bullets: [
      "Clear 'Add to Cart' buttons that work without JavaScript race conditions",
      "Guest checkout support — no forced account creation",
      "Standard form fields for shipping and payment",
      "No aggressive CAPTCHA or bot detection on checkout flows",
      "Confirmation pages that verify the order completed",
    ],
  },
  {
    id: "cat-performance-resilience",
    title: "What is Performance & Resilience?",
    subtitle: "Does the site load fast and stay stable when AI agents interact with it? Slow or unstable sites cause agents to fail or timeout.",
    bullets: [
      "Sub-3-second page load times for key flows",
      "No layout shifts that break element positioning",
      "Server-side rendering for critical product data",
      "Rate limiting that's generous enough for agent traffic patterns",
      "Error handling that doesn't leave agents stuck on blank pages",
    ],
  },
  {
    id: "cat-data-standards",
    title: "What are Data Standards & Feeds?",
    subtitle: "Does the site provide machine-readable product data? Feed-based agents can't see the page — they need structured data to understand your catalog.",
    bullets: [
      "JSON-LD Schema.org markup on every product page",
      "XML sitemap with product URLs and lastmod dates",
      "Open Graph meta tags for rich previews",
      "Google Merchant Center feed compatibility",
      "Clean, consistent URL structures for products and categories",
    ],
  },
  {
    id: "cat-agentic-commerce",
    title: "What is Agentic Commerce?",
    subtitle: "Does the site support programmatic checkout APIs? This is the future — letting AI agents buy without browser automation.",
    bullets: [
      "Agentic Commerce Protocol (ACP) endpoints for checkout",
      "Universal Checkout Protocol (UCP) support for Google AI Mode",
      "API-based cart and order creation",
      "Machine-readable product availability and pricing APIs",
      "This category will grow as protocols mature in 2025-2026",
    ],
  },

  // ── Agent Types ─────────────────────────────────────────────────
  {
    id: "agent-feed-vs-browser",
    title: "Feed Agents vs Browser Agents",
    subtitle: "The two fundamental approaches to AI shopping. Feed agents read data, browser agents navigate sites. Your readiness depends on which type visits you.",
    bullets: [
      "Feed agents (ChatGPT Shopping, Google AI Mode) read structured data and product feeds",
      "Browser agents (Operator, Buy For Me) visually navigate and click through your site",
      "Feed agents need great schema markup and data standards",
      "Browser agents need clean UI, accessible elements, and no bot detection",
      "Most brands need to optimize for both — the best score across all 10 agents",
    ],
  },
  {
    id: "agent-acp-protocol",
    title: "What is the Agentic Commerce Protocol?",
    subtitle: "ACP is an open protocol that lets AI agents initiate purchases without browser automation. Created by Stripe, adopted by ChatGPT Shopping.",
    bullets: [
      "Standardized API for agents to create checkout sessions",
      "Eliminates the need for browser automation on checkout",
      "Currently supported by ChatGPT Shopping + Stripe merchants",
      "Merchants opt-in to allow specific AI agents to transact",
      "Early but growing — expect rapid adoption through 2025-2026",
    ],
  },
  {
    id: "agent-operator-guide",
    title: "How Does ChatGPT Operator Work?",
    subtitle: "OpenAI's browser agent launches a real browser and navigates sites like a human. It's the most advanced consumer shopping agent on the market.",
    bullets: [
      "Opens a full Chromium browser and navigates visually",
      "Clicks buttons, fills forms, selects variants, handles popups",
      "Requires clear button labels and standard checkout patterns",
      "Blocked by aggressive bot detection and CAPTCHAs",
      "Optimizing for Operator = optimizing for all browser agents",
    ],
  },

  // ── Methodology ─────────────────────────────────────────────────
  {
    id: "method-how-scoring-works",
    title: "How Robot Shopper Scoring Works",
    subtitle: "We test every brand across 7 categories using automated agents, then weight the scores based on each AI agent's unique priorities.",
    bullets: [
      "Automated scanning with Puppeteer + structured data parsing",
      "7 categories scored 0-100 with weighted overall score",
      "10 AI agent profiles with unique category weight lenses",
      "Grades from A (Agent-Ready, 85+) to F (Not Ready, below 30)",
      "Weekly re-scans to track improvements and regressions",
    ],
  },
  {
    id: "method-grade-scale",
    title: "Understanding Robot Shopper Grades",
    subtitle: "From A to F — here's what each grade means for your brand's AI agent readiness and what it takes to level up.",
    bullets: [
      "Grade A (85-100): Agent-Ready — AI agents can shop your site effectively",
      "Grade B (70-84): Mostly Ready — minor gaps to close",
      "Grade C (50-69): Needs Work — significant optimization required",
      "Grade D (30-49): Poor — major barriers for AI agents",
      "Grade F (0-29): Not Ready — fundamental issues blocking agent access",
    ],
  },

  // ── Industry Context ────────────────────────────────────────────
  {
    id: "industry-ai-shopping-landscape",
    title: "The AI Shopping Agent Landscape",
    subtitle: "10 major AI agents are reshaping how consumers find and buy products online. Here's the competitive landscape.",
    bullets: [
      "5 feed-based agents: ChatGPT Shopping, Google AI Mode, Perplexity, Copilot, Klarna AI",
      "5 browser agents: Operator, Buy For Me, Comet, Claude Computer Use, OpenClaw",
      "Feed agents dominate discovery — browser agents dominate conversion",
      "The market is consolidating around ACP and UCP protocols",
      "Brands scoring 70+ are already seeing agent-driven traffic",
    ],
  },
  {
    id: "industry-why-care",
    title: "Why Should Brands Care About AI Agents?",
    subtitle: "AI agents are the next channel. Brands that aren't ready will lose traffic, sales, and market share to competitors who are.",
    bullets: [
      "AI agents already influence billions in e-commerce GMV",
      "ChatGPT Shopping has 200M+ weekly active users who shop",
      "Google AI Mode is replacing traditional search results with agent answers",
      "Browser agents can complete purchases — not just recommend products",
      "The brands optimizing now will own the agent-first channel",
    ],
  },
  {
    id: "industry-quick-wins",
    title: "5 Quick Wins for AI Agent Readiness",
    subtitle: "These high-impact, low-effort changes can boost your Robot Shopper score within a week.",
    bullets: [
      "Add JSON-LD Product schema to every product page",
      "Update robots.txt to allow GPTBot, PerplexityBot, and ClaudeBot",
      "Enable guest checkout — forced login blocks every browser agent",
      "Add aria-labels to your Add to Cart and checkout buttons",
      "Submit your XML sitemap with product URLs to Google Search Console",
    ],
  },
  {
    id: "industry-robots-txt",
    title: "Robots.txt for AI Agents",
    subtitle: "Your robots.txt file is the front door for AI agents. Block them, and you're invisible. Here's what to allow.",
    bullets: [
      "GPTBot — powers ChatGPT Shopping and Operator",
      "Google-Extended — controls AI Mode's access to your content",
      "PerplexityBot — powers Perplexity Shopping and Comet",
      "ClaudeBot — powers Claude's research and computer use",
      "Blocking these bots = opting out of the AI shopping economy",
    ],
  },
];
