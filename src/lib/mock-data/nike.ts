import type { ScanReport } from "@/types/report";

export const nikeReport: ScanReport = {
  id: "demo-nike",
  url: "nike.com",
  scannedAt: "2026-02-24T10:30:00Z",
  overallScore: 62,
  grade: "C",
  verdict:
    "Your site has significant gaps in agent readiness. Personal AI agents fail to complete a purchase 68% of the time.",
  comparison: "You're in the bottom 30% of ecommerce sites we've scanned",
  estimatedScoreAfterFixes: 87,
  categories: [
    {
      id: "discoverability",
      name: "Discoverability",
      weight: 0.15,
      score: 55,
      grade: "C",
      summary:
        "Agents can find products but category navigation relies on hover menus they can't trigger.",
      agentsCovered: ["browser", "accessibility"],
    },
    {
      id: "product-understanding",
      name: "Product Understanding",
      weight: 0.25,
      score: 78,
      grade: "B",
      summary:
        "Strong Product schema markup. Price, images, and descriptions are well-structured.",
      agentsCovered: ["browser", "data", "accessibility"],
    },
    {
      id: "navigation-interaction",
      name: "Navigation & Interaction",
      weight: 0.2,
      score: 45,
      grade: "D",
      summary:
        "Custom JavaScript components block agent interaction. Cookie consent covers 40% of viewport.",
      agentsCovered: ["browser", "accessibility"],
    },
    {
      id: "cart-checkout",
      name: "Cart & Checkout",
      weight: 0.25,
      score: 40,
      grade: "D",
      summary:
        "Add-to-cart works, but checkout requires account creation. No guest checkout available.",
      agentsCovered: ["browser", "data", "accessibility"],
    },
    {
      id: "performance-resilience",
      name: "Performance & Resilience",
      weight: 0.1,
      score: 70,
      grade: "B",
      summary:
        "No bot blocking detected. Page loads in 3.8s. Some rate limiting on rapid navigation.",
      agentsCovered: ["browser", "data"],
    },
    {
      id: "data-standards",
      name: "Data Standards & Feeds",
      weight: 0.05,
      score: 85,
      grade: "A",
      summary:
        "Comprehensive Schema.org markup, valid JSON-LD, sitemap includes product URLs.",
      agentsCovered: ["data"],
    },
  ],
  journeys: [
    {
      agentType: "browser",
      agentName: "Browser Agent",
      agentDescription:
        "Navigates your site like a personal AI agent — clicking, scrolling, filling forms.",
      overallResult: "fail",
      narrative:
        "I was sent to find running shoes on nike.com. I landed on the homepage and immediately hit a cookie consent banner covering 40% of the screen. After dismissing it, I navigated to Running > Shoes. The category page loaded well, but filters required hover interaction I couldn't trigger. I found the Nike Alphafly 3 and clicked through. On the product page, the size selector worked — it uses accessible button elements. I added to cart successfully. But then checkout required me to sign in or create an account. Journey over — I can't create accounts for my owner.",
      steps: [
        {
          stepNumber: 1,
          action: "Navigate to homepage",
          description: "Loading nike.com homepage",
          result: "pass",
          narration:
            "I navigated to nike.com. The page loaded in 3.2 seconds. I can see the main navigation, hero banner, and featured products.",
          thought: "Page loaded. Let me find running shoes.",
          cursorTarget: { x: 50, y: 15 },
          duration: 3200,
        },
        {
          stepNumber: 2,
          action: "Dismiss cookie consent",
          description: "Cookie banner appeared covering 40% of viewport",
          result: "partial",
          narration:
            "A cookie consent overlay appeared covering 40% of the screen. I found the 'Accept All' button and clicked it, but it took 2.1 seconds of scanning to locate it within the overlay's nested DOM structure.",
          thought:
            "Cookie popup blocking the page. Looking for dismiss button...",
          cursorTarget: { x: 70, y: 75 },
          duration: 2100,
        },
        {
          stepNumber: 3,
          action: "Navigate to Running category",
          description: "Attempting to find Running Shoes via navigation menu",
          result: "partial",
          narration:
            "I tried to access the 'Running' category from the main nav. The dropdown menu requires a hover interaction I can't trigger. I used the site search instead, typing 'running shoes'. The search worked and returned relevant results.",
          thought:
            "Navigation menu needs hover... Let me try search instead.",
          cursorTarget: { x: 85, y: 15 },
          duration: 4500,
        },
        {
          stepNumber: 4,
          action: "Browse search results",
          description: "Reviewing running shoe search results",
          result: "pass",
          narration:
            "Search results loaded with 48 running shoes. Each product card shows name, price, and a thumbnail. The results page uses proper semantic HTML with accessible links.",
          thought: "Good results. I'll pick the Nike Alphafly 3.",
          cursorTarget: { x: 30, y: 45 },
          duration: 1800,
        },
        {
          stepNumber: 5,
          action: "Open product page",
          description: "Clicking through to Nike Alphafly 3 product page",
          result: "pass",
          narration:
            "I clicked on the Nike Alphafly 3. The product page loaded with full details — price ($284.99), description, multiple images, and size options. All critical product information is visible in the DOM.",
          thought:
            "Product page looks good. Price is $284.99. Need to select a size.",
          cursorTarget: { x: 50, y: 50 },
          duration: 2400,
        },
        {
          stepNumber: 6,
          action: "Select size variant",
          description: "Attempting to select size US 10",
          result: "pass",
          narration:
            "The size selector uses accessible button elements — each size is a clickable button with proper ARIA labels. I selected 'US 10' without issues. This is well-implemented.",
          thought: "Size buttons are accessible. Selecting US 10.",
          cursorTarget: { x: 45, y: 62 },
          duration: 800,
        },
        {
          stepNumber: 7,
          action: "Add to cart",
          description: "Clicking the Add to Bag button",
          result: "pass",
          narration:
            "I clicked 'Add to Bag'. The button is a standard HTML button element with clear labeling. A cart slide-out panel appeared confirming the item was added: Nike Alphafly 3, Size US 10, $284.99.",
          thought: "Added to cart. Now let me proceed to checkout.",
          cursorTarget: { x: 50, y: 78 },
          duration: 1200,
        },
        {
          stepNumber: 8,
          action: "Proceed to checkout",
          description: "Attempting to complete purchase",
          result: "fail",
          narration:
            "I clicked 'Checkout' and was redirected to a sign-in page. The checkout requires creating a Nike account or signing in. There is no guest checkout option. I cannot create accounts on behalf of my owner. Journey ends here.",
          thought:
            "Checkout requires sign-in. No guest checkout. I'm blocked.",
          cursorTarget: { x: 50, y: 50 },
          duration: 2000,
        },
      ],
    },
    {
      agentType: "data",
      agentName: "Data Agent",
      agentDescription:
        "Reads structured data, APIs, and feeds to understand your product catalog without rendering pages.",
      overallResult: "partial",
      narrative:
        "I analyzed nike.com's structured data and feeds. The site has solid Schema.org Product markup with JSON-LD — price, availability, and descriptions are well-structured. However, variant data (sizes, colors) is not included in the structured data, and there's no product API endpoint. The sitemap includes product URLs but the robots.txt blocks several AI user agents.",
      steps: [
        {
          stepNumber: 1,
          action: "Fetch and parse HTML",
          description: "Downloading raw product page HTML",
          result: "pass",
          narration:
            "I fetched the raw HTML of the Alphafly 3 product page. The page is 287KB of HTML with significant JavaScript. Core product information is present in the initial HTML, not hidden behind JS rendering.",
          thought: "Good — product data is in the initial HTML, not JS-only.",
          duration: 1100,
        },
        {
          stepNumber: 2,
          action: "Parse Schema.org markup",
          description: "Extracting JSON-LD structured data",
          result: "pass",
          narration:
            "Found valid JSON-LD Product schema with: name, description, image (5 images), brand, price ($284.99), priceCurrency (USD), availability (InStock). Schema validates against Google's Rich Results Test.",
          thought: "Strong Product schema. Missing some optional fields.",
          duration: 500,
        },
        {
          stepNumber: 3,
          action: "Check variant data in schema",
          description: "Looking for size/color variants in structured data",
          result: "fail",
          narration:
            "The Schema.org markup does not include variant data. Sizes and colors are only available via the rendered DOM — a personal agent reading only structured data would not know what sizes are available or in stock.",
          thought:
            "No variant data in schema. Agents can't know available sizes without rendering.",
          duration: 300,
        },
        {
          stepNumber: 4,
          action: "Check Open Graph tags",
          description: "Parsing og: meta tags",
          result: "partial",
          narration:
            "Open Graph tags are present: og:title, og:image, og:url, og:description. However, og:price:amount and og:price:currency are missing — agents relying on OG tags won't see the price.",
          thought: "OG tags exist but missing price information.",
          duration: 200,
        },
        {
          stepNumber: 5,
          action: "Analyze robots.txt",
          description: "Checking for AI agent blocking",
          result: "partial",
          narration:
            "robots.txt blocks GPTBot and CCBot (Common Crawl). ClaudeBot and PerplexityBot are not explicitly blocked. Google-Extended is allowed. This means some personal agents using OpenAI's infrastructure may be blocked, while Claude-based agents can access the site.",
          thought:
            "Partially blocking AI agents. GPTBot blocked, ClaudeBot allowed.",
          duration: 400,
        },
        {
          stepNumber: 6,
          action: "Check sitemap",
          description: "Parsing XML sitemap for product URLs",
          result: "pass",
          narration:
            "XML sitemap found at /sitemap.xml with 12,400+ product URLs. Products are organized by category. Last-modified dates are current. This is good — agents can discover the full catalog.",
          thought: "Comprehensive sitemap with all product URLs.",
          duration: 800,
        },
        {
          stepNumber: 7,
          action: "Probe API endpoints",
          description: "Testing for known ecommerce API patterns",
          result: "fail",
          narration:
            "No public API endpoints detected. Tested: /products.json (Shopify pattern), /wp-json/wc/ (WooCommerce pattern), /api/products. Nike uses a custom platform with no public product API. Personal agents cannot programmatically interact with the catalog.",
          thought: "No public API. Agents must use the website directly.",
          duration: 1200,
        },
      ],
    },
    {
      agentType: "accessibility",
      agentName: "Accessibility Agent",
      agentDescription:
        "Uses the accessibility tree and ARIA labels to interact with your site without visual rendering.",
      overallResult: "partial",
      narrative:
        "I analyzed nike.com through its accessibility tree. The product page has good fundamentals — size buttons are properly labeled, and the main product info is accessible. However, the navigation menu is inaccessible without hover events, the cookie consent overlay traps focus, and several filter controls have no ARIA labels. The checkout login form is accessible but blocks the agent flow.",
      steps: [
        {
          stepNumber: 1,
          action: "Capture accessibility tree",
          description: "Taking full a11y snapshot of the homepage",
          result: "pass",
          narration:
            "I captured the accessibility tree of nike.com. The page has 342 accessible elements — links, buttons, headings, and landmarks are generally well-structured. Main navigation landmark is present.",
          thought: "Good a11y tree structure. Let me check interactive elements.",
          duration: 600,
        },
        {
          stepNumber: 2,
          action: "Test navigation menu",
          description: "Attempting to navigate via accessibility tree",
          result: "fail",
          narration:
            "The main navigation menu items are visible in the a11y tree as links, but the dropdown submenus (where 'Running > Shoes' lives) are not rendered in the DOM until a hover event fires. They don't exist in the accessibility tree until triggered. I cannot reach category pages through navigation.",
          thought:
            "Dropdown menus don't exist in a11y tree until hover. Blocked.",
          duration: 1500,
        },
        {
          stepNumber: 3,
          action: "Test search functionality",
          description: "Locating and using the search input",
          result: "pass",
          narration:
            "The search input has role='search' and aria-label='Search Products'. I can focus it and type a query. Search results render with proper list semantics and each result is an accessible link.",
          thought: "Search is fully accessible. Using it to find products.",
          duration: 900,
        },
        {
          stepNumber: 4,
          action: "Test product page elements",
          description: "Checking a11y of size selector, add to cart, price",
          result: "pass",
          narration:
            "On the product page: price has aria-label='Price: $284.99'. Size options are buttons with aria-label='Select Size US 10' (and similar for each size). The 'Add to Bag' button is properly labeled. Product images have alt text. This is well done.",
          thought: "Product page a11y is strong. Size buttons are labeled.",
          duration: 700,
        },
        {
          stepNumber: 5,
          action: "Test filter controls",
          description: "Checking category page filter accessibility",
          result: "fail",
          narration:
            "On the category/search results page, filter controls (price range, color, brand) use custom JavaScript components. The price slider has no ARIA role or label. Color filter buttons are div elements with no role='button'. A personal agent navigating by accessibility tree cannot filter results.",
          thought: "Filters are inaccessible. No ARIA roles on custom controls.",
          duration: 1100,
        },
        {
          stepNumber: 6,
          action: "Test cookie consent a11y",
          description: "Checking if cookie overlay is dismissible via a11y tree",
          result: "partial",
          narration:
            "The cookie consent overlay has role='dialog' and the 'Accept All' button is accessible. However, the overlay traps focus — when it's open, keyboard and a11y navigation cannot reach the page content behind it. An agent must dismiss it first, which adds friction.",
          thought: "Cookie dialog traps focus but is dismissible. Adds delay.",
          duration: 500,
        },
      ],
    },
  ],
  findings: [
    {
      id: "f1",
      severity: "critical",
      category: "cart-checkout",
      title: "No guest checkout — agents are completely blocked",
      whatHappened:
        "After successfully adding the Nike Alphafly 3 to the cart, the checkout flow redirected to a mandatory sign-in page. There is no guest checkout option. The agent cannot create Nike accounts.",
      whyItMatters:
        "Personal AI agents cannot create accounts or manage passwords on behalf of their owners. When checkout requires sign-in, every agent-initiated purchase fails at the final step. This is the single biggest barrier to agent commerce on your site.",
      affectedAgents: [
        { name: "Browser Agent", impact: "blocked" },
        { name: "Accessibility Agent", impact: "blocked" },
        {
          name: "Data Agent (Cart API)",
          impact: "blocked",
        },
      ],
      fix: {
        summary: "Enable guest checkout for the purchase flow.",
        technicalDetail:
          "Add a guest checkout path that allows purchase with email + shipping address only, no account required. Most ecommerce platforms support this natively — Shopify has it on by default, WooCommerce via settings. For custom platforms, add a /checkout/guest route that accepts order details without authentication.",
        codeSnippet:
          '// If using a custom checkout flow:\n// Add guest checkout route\napp.post("/checkout/guest", async (req, res) => {\n  const { email, shipping, cart } = req.body;\n  // Process order without requiring auth\n  const order = await createOrder({ email, shipping, cart });\n  return res.json({ orderId: order.id });\n});',
        effortEstimate: "4-8 hours depending on platform",
      },
      priority: 1,
      effort: "medium",
      estimatedPointsGain: 12,
    },
    {
      id: "f2",
      severity: "critical",
      category: "navigation-interaction",
      title: "Navigation menu requires hover — invisible to agents",
      whatHappened:
        "The main navigation dropdown menus (Running, Basketball, Training, etc.) only render in the DOM when a user hovers over the parent menu item. Without hover, the sub-menus don't exist in the accessibility tree or DOM.",
      whyItMatters:
        "Personal agents navigate via DOM queries and the accessibility tree, not mouse hover. When dropdown content is rendered only on hover, agents cannot discover or navigate to category pages. They must rely on search as a fallback, which may not always work.",
      affectedAgents: [
        { name: "Browser Agent", impact: "degraded" },
        { name: "Accessibility Agent", impact: "blocked" },
      ],
      fix: {
        summary:
          "Render navigation menus in the DOM by default, using CSS for show/hide.",
        technicalDetail:
          'Instead of rendering menu items on hover via JavaScript, render all menu items in the DOM on page load and use CSS (visibility, opacity, max-height) to show/hide them. The menu should be keyboard-navigable and respond to both hover and focus/click events. Use aria-expanded to indicate menu state.',
        codeSnippet:
          '<!-- Instead of JS-rendered menus: -->\n<nav aria-label="Main Navigation">\n  <ul>\n    <li>\n      <button aria-expanded="false" aria-controls="running-menu">\n        Running\n      </button>\n      <!-- Always in DOM, hidden via CSS -->\n      <ul id="running-menu" class="nav-submenu">\n        <li><a href="/running/shoes">Shoes</a></li>\n        <li><a href="/running/apparel">Apparel</a></li>\n      </ul>\n    </li>\n  </ul>\n</nav>\n\n<style>\n  .nav-submenu {\n    opacity: 0;\n    visibility: hidden;\n    transition: opacity 0.2s;\n  }\n  li:hover .nav-submenu,\n  li:focus-within .nav-submenu {\n    opacity: 1;\n    visibility: visible;\n  }\n</style>',
        effortEstimate: "2-4 hours",
      },
      priority: 2,
      effort: "low",
      estimatedPointsGain: 8,
    },
    {
      id: "f3",
      severity: "high",
      category: "navigation-interaction",
      title: "Cookie consent overlay blocks 40% of viewport",
      whatHappened:
        "On first visit, a cookie consent overlay covers 40% of the screen and traps focus. The agent took 2.1 seconds to scan the overlay's nested DOM structure and locate the 'Accept All' button.",
      whyItMatters:
        "Every agent visit starts with this friction. The overlay delays the agent by 2+ seconds and the focus trap means agents navigating by accessibility tree cannot interact with anything else until the overlay is dismissed. This compounds with other issues.",
      affectedAgents: [
        { name: "Browser Agent", impact: "degraded" },
        { name: "Accessibility Agent", impact: "degraded" },
      ],
      fix: {
        summary:
          "Use a less intrusive cookie consent format or auto-accept for bot user agents.",
        technicalDetail:
          'Consider a banner format (bottom bar) instead of a modal overlay. Ensure the dismiss button has a clear, consistent ID or aria-label that agents can find quickly. For known bot user agents, consider auto-accepting cookies or serving a cookie-free experience. The current OneTrust implementation uses deeply nested shadow DOM elements that are hard to parse.',
        codeSnippet:
          '<!-- Ensure cookie consent button is easily findable -->\n<div role="dialog" aria-label="Cookie Consent">\n  <button\n    id="accept-cookies"\n    aria-label="Accept All Cookies"\n    data-testid="cookie-accept"\n  >\n    Accept All\n  </button>\n</div>',
        effortEstimate: "1-2 hours",
      },
      priority: 3,
      effort: "low",
      estimatedPointsGain: 5,
    },
    {
      id: "f4",
      severity: "high",
      category: "navigation-interaction",
      title: "Category filters are inaccessible custom components",
      whatHappened:
        "On category/search results pages, filter controls (price range slider, color swatches, size filters) are built with custom JavaScript components. The price slider has no ARIA role. Color filters are div elements without role='button'.",
      whyItMatters:
        "Agents cannot narrow down product results. On a site with thousands of products, inability to filter means agents may recommend the wrong product or give up. Accessible filters let agents quickly find exactly what their owner asked for.",
      affectedAgents: [
        { name: "Browser Agent", impact: "degraded" },
        { name: "Accessibility Agent", impact: "blocked" },
      ],
      fix: {
        summary: "Add ARIA roles and labels to all filter controls.",
        technicalDetail:
          'Add role="button" and aria-label to color swatch divs. Add role="slider", aria-valuemin, aria-valuemax, and aria-valuenow to the price range slider. Ensure all filter controls are keyboard-operable and announce their state changes.',
        codeSnippet:
          '<!-- Color filter with proper a11y -->\n<div\n  role="button"\n  aria-label="Filter by color: Black"\n  aria-pressed="false"\n  tabindex="0"\n  class="color-swatch"\n  style="background: black"\n/>\n\n<!-- Price slider with ARIA -->\n<input\n  type="range"\n  role="slider"\n  aria-label="Maximum price"\n  aria-valuemin="0"\n  aria-valuemax="500"\n  aria-valuenow="200"\n/>',
        effortEstimate: "3-4 hours",
      },
      priority: 4,
      effort: "medium",
      estimatedPointsGain: 6,
    },
    {
      id: "f5",
      severity: "high",
      category: "product-understanding",
      title: "No variant data in structured markup",
      whatHappened:
        "The Schema.org Product markup includes name, price, description, and images but does not include variant/offer data. Available sizes and colors are only present in the rendered DOM, not in JSON-LD.",
      whyItMatters:
        "Data Agents and crawlers that read structured data won't know what sizes or colors are available (or in stock). This is critical for agents that want to check availability before navigating the full page — e.g., 'Is this shoe available in size 10?'",
      affectedAgents: [
        { name: "Data Agent", impact: "blocked" },
        {
          name: "Browser Agent",
          impact: "fallback-available",
        },
      ],
      fix: {
        summary: "Add variant/offer data to JSON-LD Product schema.",
        technicalDetail:
          "Extend the existing JSON-LD Product markup to include an 'offers' array with individual Offer objects for each variant. Each offer should specify size, color, price, availability (InStock/OutOfStock), and SKU.",
        codeSnippet:
          '{\n  "@context": "https://schema.org",\n  "@type": "Product",\n  "name": "Nike Alphafly 3",\n  "offers": [\n    {\n      "@type": "Offer",\n      "name": "US 9",\n      "size": "US 9",\n      "price": "284.99",\n      "priceCurrency": "USD",\n      "availability": "https://schema.org/InStock",\n      "sku": "ALPHAFLY3-US9"\n    },\n    {\n      "@type": "Offer",\n      "name": "US 10",\n      "size": "US 10",\n      "price": "284.99",\n      "priceCurrency": "USD",\n      "availability": "https://schema.org/InStock",\n      "sku": "ALPHAFLY3-US10"\n    }\n  ]\n}',
        effortEstimate: "2-3 hours",
      },
      priority: 5,
      effort: "low",
      estimatedPointsGain: 5,
    },
    {
      id: "f6",
      severity: "medium",
      category: "product-understanding",
      title: "Open Graph tags missing price data",
      whatHappened:
        "Open Graph meta tags include og:title, og:image, og:url, and og:description. However, og:price:amount and og:price:currency are missing.",
      whyItMatters:
        "Some personal agents and AI systems parse OG tags as a quick way to understand product pages. Missing price in OG tags means an extra parsing step is needed, adding latency and potential failure points.",
      affectedAgents: [
        { name: "Data Agent", impact: "degraded" },
      ],
      fix: {
        summary: "Add price OG meta tags to product pages.",
        technicalDetail:
          "Add og:price:amount and og:price:currency meta tags to product page <head>.",
        codeSnippet:
          '<meta property="og:price:amount" content="284.99" />\n<meta property="og:price:currency" content="USD" />',
        effortEstimate: "30 minutes",
      },
      priority: 6,
      effort: "low",
      estimatedPointsGain: 2,
    },
    {
      id: "f7",
      severity: "medium",
      category: "performance-resilience",
      title: "robots.txt blocks GPTBot",
      whatHappened:
        "The robots.txt file explicitly blocks GPTBot and CCBot (Common Crawl). ClaudeBot and PerplexityBot are allowed.",
      whyItMatters:
        "Personal agents built on OpenAI infrastructure may respect robots.txt and refuse to crawl your site. This means anyone using a GPT-based personal agent won't be directed to your products. As the agent ecosystem grows, blocking major AI user agents reduces your reach.",
      affectedAgents: [
        { name: "Data Agent (GPTBot)", impact: "blocked" },
        {
          name: "Browser Agent (respects robots.txt)",
          impact: "degraded",
        },
      ],
      fix: {
        summary: "Selectively allow AI user agents in robots.txt.",
        technicalDetail:
          "Instead of blanket-blocking AI crawlers, allow them access to product pages while protecting sensitive paths (account, checkout, admin). This gives agents product data while maintaining security boundaries.",
        codeSnippet:
          '# robots.txt - Allow AI agents on product pages\nUser-agent: GPTBot\nAllow: /products/\nAllow: /categories/\nDisallow: /account/\nDisallow: /checkout/\nDisallow: /admin/\n\nUser-agent: ClaudeBot\nAllow: /products/\nAllow: /categories/\nDisallow: /account/\nDisallow: /checkout/',
        effortEstimate: "30 minutes",
      },
      priority: 7,
      effort: "low",
      estimatedPointsGain: 3,
    },
    {
      id: "f8",
      severity: "medium",
      category: "discoverability",
      title: "No breadcrumb structured data",
      whatHappened:
        "Product pages lack BreadcrumbList schema markup. The visual breadcrumb trail exists but isn't in structured data.",
      whyItMatters:
        "Breadcrumb schema helps agents understand site hierarchy and navigate between related categories. Without it, agents must infer product categorization from URLs or page content, which is less reliable.",
      affectedAgents: [
        { name: "Data Agent", impact: "degraded" },
      ],
      fix: {
        summary: "Add BreadcrumbList JSON-LD to product pages.",
        technicalDetail:
          "Add a BreadcrumbList schema that mirrors your visual breadcrumb trail.",
        codeSnippet:
          '{\n  "@context": "https://schema.org",\n  "@type": "BreadcrumbList",\n  "itemListElement": [\n    {\n      "@type": "ListItem",\n      "position": 1,\n      "name": "Running",\n      "item": "https://nike.com/running"\n    },\n    {\n      "@type": "ListItem",\n      "position": 2,\n      "name": "Shoes",\n      "item": "https://nike.com/running/shoes"\n    },\n    {\n      "@type": "ListItem",\n      "position": 3,\n      "name": "Nike Alphafly 3"\n    }\n  ]\n}',
        effortEstimate: "1 hour",
      },
      priority: 8,
      effort: "low",
      estimatedPointsGain: 2,
    },
    {
      id: "f9",
      severity: "low",
      category: "performance-resilience",
      title: "Some rate limiting on rapid page navigation",
      whatHappened:
        "When the Browser Agent navigated quickly between pages (under 500ms between requests), the third request was delayed by a 1.2-second throttle response. Normal navigation speed was unaffected.",
      whyItMatters:
        "Personal agents navigate faster than humans. Aggressive rate limiting on normal navigation speeds can slow agent journeys significantly, making your site less attractive when agents compare shopping experiences across multiple sites.",
      affectedAgents: [
        { name: "Browser Agent", impact: "degraded" },
      ],
      fix: {
        summary:
          "Adjust rate limits to accommodate faster-than-human navigation patterns.",
        technicalDetail:
          "Current rate limiting triggers at 2+ requests per second. Consider raising this to 5-10 requests per second for non-authenticated browsing. This still prevents abuse while allowing agent-speed navigation.",
        effortEstimate: "1-2 hours",
      },
      priority: 9,
      effort: "medium",
      estimatedPointsGain: 2,
    },
  ],
  actionPlan: [
    {
      findingId: "f1",
      title: "Enable guest checkout",
      severity: "critical",
      effort: "medium",
      estimatedPointsGain: 12,
      isQuickWin: false,
    },
    {
      findingId: "f2",
      title: "Fix hover-only navigation menus",
      severity: "critical",
      effort: "low",
      estimatedPointsGain: 8,
      isQuickWin: true,
    },
    {
      findingId: "f3",
      title: "Reduce cookie consent friction",
      severity: "high",
      effort: "low",
      estimatedPointsGain: 5,
      isQuickWin: true,
    },
    {
      findingId: "f4",
      title: "Add ARIA roles to filter controls",
      severity: "high",
      effort: "medium",
      estimatedPointsGain: 6,
      isQuickWin: false,
    },
    {
      findingId: "f5",
      title: "Add variant data to Schema.org markup",
      severity: "high",
      effort: "low",
      estimatedPointsGain: 5,
      isQuickWin: true,
    },
    {
      findingId: "f6",
      title: "Add OG price tags",
      severity: "medium",
      effort: "low",
      estimatedPointsGain: 2,
      isQuickWin: true,
    },
    {
      findingId: "f7",
      title: "Allow AI agents in robots.txt",
      severity: "medium",
      effort: "low",
      estimatedPointsGain: 3,
      isQuickWin: true,
    },
    {
      findingId: "f8",
      title: "Add breadcrumb structured data",
      severity: "medium",
      effort: "low",
      estimatedPointsGain: 2,
      isQuickWin: true,
    },
    {
      findingId: "f9",
      title: "Adjust rate limiting thresholds",
      severity: "low",
      effort: "medium",
      estimatedPointsGain: 2,
      isQuickWin: false,
    },
  ],
};
