import type { ScanReport } from "@/types/report";

export const realNikeReport: ScanReport = {
  "id": "real-nike",
  "url": "nike.com",
  "scannedAt": "2026-02-24T15:50:30.924Z",
  "overallScore": 29,
  "grade": "F",
  "verdict": "Your site actively blocks automated agents. Personal AI agents cannot interact with your store at all.",
  "comparison": "You're in the bottom 10% of ecommerce sites we've scanned",
  "categories": [
    {
      "id": "discoverability",
      "name": "Discoverability",
      "weight": 0.15,
      "score": 30,
      "grade": "D",
      "summary": "Agents struggle to find products on the site.",
      "agentsCovered": [
        "browser",
        "accessibility"
      ]
    },
    {
      "id": "product-understanding",
      "name": "Product Understanding",
      "weight": 0.25,
      "score": 18,
      "grade": "F",
      "summary": "Product data is poorly structured for agent consumption.",
      "agentsCovered": [
        "browser",
        "data",
        "accessibility"
      ]
    },
    {
      "id": "navigation-interaction",
      "name": "Navigation & Interaction",
      "weight": 0.2,
      "score": 55,
      "grade": "C",
      "summary": "Some interactions work but agents face friction with custom components.",
      "agentsCovered": [
        "browser",
        "accessibility"
      ]
    },
    {
      "id": "cart-checkout",
      "name": "Cart & Checkout",
      "weight": 0.25,
      "score": 0,
      "grade": "F",
      "summary": "Agents cannot add products to cart.",
      "agentsCovered": [
        "browser",
        "data",
        "accessibility"
      ]
    },
    {
      "id": "performance-resilience",
      "name": "Performance & Resilience",
      "weight": 0.1,
      "score": 65,
      "grade": "C",
      "summary": "The site blocks automated agents with bot detection.",
      "agentsCovered": [
        "browser",
        "data"
      ]
    },
    {
      "id": "data-standards",
      "name": "Data Standards & Feeds",
      "weight": 0.05,
      "score": 55,
      "grade": "C",
      "summary": "Some structured data present but gaps in coverage.",
      "agentsCovered": [
        "data"
      ]
    }
  ],
  "journeys": [
    {
      "agentType": "browser",
      "agentName": "Browser Agent",
      "agentDescription": "Navigates your site like a personal AI agent — clicking links, filling forms, interacting with the DOM.",
      "overallResult": "fail",
      "narrative": "I tried to navigate to nike.com but was blocked by bot detection. The site returned a challenge page instead of the homepage.",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Navigate to homepage",
          "description": "Loading nike.com",
          "result": "fail",
          "narration": "I tried to navigate to nike.com but was blocked by bot detection. The site returned a challenge page instead of the homepage.",
          "thought": "Bot detection triggered. I'm blocked.",
          "screenshotUrl": "/screenshots/nike/01-homepage.png",
          "duration": 2636
        }
      ]
    },
    {
      "agentType": "data",
      "agentName": "Data Agent",
      "agentDescription": "Reads structured data, APIs, and feeds to understand your product catalog without rendering pages.",
      "overallResult": "partial",
      "narrative": "I analyzed the structured data on the site. Page title: \"Nike. Just Do It. Nike IE\". The raw HTML is 703KB. No Schema.org Product markup found. Open Graph tags present: og:description, og:image, og:locale, og:site_name, og:title, og:type, og:url. robots.txt allows all major AI user agents.",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Fetch and parse HTML",
          "description": "Downloading raw page HTML",
          "result": "pass",
          "narration": "Fetched the page HTML (703KB). Page title: \"Nike. Just Do It. Nike IE\".",
          "thought": "Page fetched. Parsing structured data.",
          "duration": 500
        },
        {
          "stepNumber": 2,
          "action": "Parse Schema.org markup",
          "description": "Extracting JSON-LD structured data",
          "result": "fail",
          "narration": "No Schema.org Product markup found. Found 1 JSON-LD object(s) but none are Product type.",
          "thought": "No Product schema. This is a gap.",
          "duration": 300
        },
        {
          "stepNumber": 3,
          "action": "Check Open Graph tags",
          "description": "Parsing og: meta tags",
          "result": "partial",
          "narration": "OG tags found: og:description, og:image, og:locale, og:site_name, og:title, og:type, og:url. Price NOT included in OG tags.",
          "thought": "OG tags present.",
          "duration": 200
        },
        {
          "stepNumber": 4,
          "action": "Check robots.txt",
          "description": "Analyzing AI agent access permissions",
          "result": "pass",
          "narration": "robots.txt allows all major AI user agents.",
          "thought": "All agents allowed.",
          "duration": 400
        },
        {
          "stepNumber": 5,
          "action": "Check sitemap",
          "description": "Looking for product URLs in sitemap",
          "result": "fail",
          "narration": "No sitemap found at standard locations.",
          "thought": "No sitemap. Agents must discover URLs by crawling.",
          "duration": 600
        },
        {
          "stepNumber": 6,
          "action": "Probe API endpoints",
          "description": "Testing for known ecommerce API patterns",
          "result": "fail",
          "narration": "No public API endpoints detected. Tested: /products.json, /wp-json/wc/v3/products, /api/products, /api/v1/products, /graphql.",
          "thought": "No API. Agents must scrape HTML.",
          "duration": 1000
        }
      ]
    },
    {
      "agentType": "accessibility",
      "agentName": "Accessibility Agent",
      "agentDescription": "Uses the accessibility tree and ARIA labels to interact with your site without visual rendering.",
      "overallResult": "partial",
      "narrative": "I captured the accessibility tree. The page has 1279 accessible nodes. This is a richly structured page. Found 8 landmark regions (header, nav, main, contentinfo). 116 headings with 2 h1 element(s). H1: \"\". Found 355 visible interactive elements. 14 have no accessible label (4% unlabeled). 20 buttons/links analyzed. 9 form fields found. Key interaction tests: Add-to-cart button NOT found via accessibility labels. Size/variant selector NOT accessible via ARIA roles. Price not accessible. 8 overlay dialog(s) blocking interaction. Found 341 keyboard-focusable elements on the page. First focusable element: A: Privacy & Cookie Policy. Good keyboard coverage.",
      "steps": [
        {
          "stepNumber": 1,
          "action": "Capture accessibility tree",
          "description": "Taking full a11y snapshot of the page",
          "result": "pass",
          "narration": "I captured the accessibility tree. The page has 1279 accessible nodes. This is a richly structured page.",
          "thought": "1279 a11y nodes. Good structure.",
          "duration": 4033
        },
        {
          "stepNumber": 2,
          "action": "Analyze landmarks and headings",
          "description": "Checking page structure for agents",
          "result": "pass",
          "narration": "Found 8 landmark regions (header, nav, main, contentinfo). 116 headings with 2 h1 element(s). H1: \"\".",
          "thought": "Structure: 8 landmarks, 116 headings. Good structure.",
          "duration": 3
        },
        {
          "stepNumber": 3,
          "action": "Analyze interactive elements",
          "description": "Checking buttons, links, and form fields",
          "result": "pass",
          "narration": "Found 355 visible interactive elements. 14 have no accessible label (4% unlabeled). 20 buttons/links analyzed. 9 form fields found.",
          "thought": "355 interactive elements, 14 unlabeled. Good labeling.",
          "duration": 9
        },
        {
          "stepNumber": 4,
          "action": "Test key interactions via a11y",
          "description": "Testing add-to-cart, size selector, and price accessibility",
          "result": "fail",
          "narration": "Key interaction tests: Add-to-cart button NOT found via accessibility labels. Size/variant selector NOT accessible via ARIA roles. Price not accessible. 8 overlay dialog(s) blocking interaction.",
          "thought": "Cart button: no. Size selector: no. Price: no.",
          "duration": 2
        },
        {
          "stepNumber": 5,
          "action": "Test keyboard navigability",
          "description": "Checking tab order and focusable elements",
          "result": "pass",
          "narration": "Found 341 keyboard-focusable elements on the page. First focusable element: A: Privacy & Cookie Policy. Good keyboard coverage.",
          "thought": "341 focusable elements. Reasonable coverage.",
          "duration": 2
        }
      ]
    }
  ],
  "findings": [
    {
      "id": "f1",
      "severity": "critical",
      "category": "performance-resilience",
      "title": "Site blocks automated agents with bot detection",
      "whatHappened": "The Browser Agent was blocked by bot detection on the first page load. The site returned a challenge page instead of content.",
      "whyItMatters": "If your site blocks automated agents, personal AI agents sent by consumers cannot interact with your store at all. Every agent-initiated visit fails immediately.",
      "affectedAgents": [
        {
          "name": "Browser Agent",
          "impact": "blocked"
        },
        {
          "name": "Accessibility Agent",
          "impact": "blocked"
        }
      ],
      "fix": {
        "summary": "Whitelist known AI agent user agents or implement more nuanced bot detection.",
        "technicalDetail": "Consider allowing requests from known AI user agents (GPTBot, ClaudeBot, PerplexityBot) while maintaining protection against scrapers. Use rate limiting instead of blanket blocking for these agents.",
        "effortEstimate": "2-4 hours"
      },
      "priority": 1,
      "effort": "medium",
      "estimatedPointsGain": 25
    },
    {
      "id": "f2",
      "severity": "critical",
      "category": "cart-checkout",
      "title": "Add-to-cart button not accessible to agents",
      "whatHappened": "The Browser Agent could not find or click the add-to-cart button. The button may use non-standard implementation.",
      "whyItMatters": "If agents can't add products to cart, they can't complete any purchase. This is the most fundamental interaction for agent commerce.",
      "affectedAgents": [
        {
          "name": "Browser Agent",
          "impact": "blocked"
        },
        {
          "name": "Accessibility Agent",
          "impact": "blocked"
        }
      ],
      "fix": {
        "summary": "Ensure the add-to-cart button is a standard <button> element with clear labeling.",
        "technicalDetail": "Use a native <button> element with aria-label=\"Add to Cart\" or clear text content. Avoid hiding the button behind required interactions without accessible alternatives.",
        "codeSnippet": "<button\n  type=\"button\"\n  aria-label=\"Add to Cart\"\n  data-testid=\"add-to-cart\"\n  class=\"add-to-cart-btn\"\n>\n  Add to Cart\n</button>",
        "effortEstimate": "1-2 hours"
      },
      "priority": 2,
      "effort": "low",
      "estimatedPointsGain": 15
    },
    {
      "id": "f3",
      "severity": "high",
      "category": "product-understanding",
      "title": "No Schema.org Product markup found",
      "whatHappened": "The page does not contain Schema.org Product structured data in JSON-LD format.",
      "whyItMatters": "Without Product schema, data agents cannot programmatically understand product details (price, availability, variants). They must parse raw HTML, which is fragile and error-prone.",
      "affectedAgents": [
        {
          "name": "Data Agent",
          "impact": "blocked"
        }
      ],
      "fix": {
        "summary": "Add JSON-LD Product schema to product pages.",
        "technicalDetail": "Add a <script type=\"application/ld+json\"> block with Schema.org Product data including name, price, availability, description, image, and offers.",
        "codeSnippet": "<script type=\"application/ld+json\">\n{\n  \"@context\": \"https://schema.org\",\n  \"@type\": \"Product\",\n  \"name\": \"Product Name\",\n  \"description\": \"...\",\n  \"image\": \"https://...\",\n  \"offers\": {\n    \"@type\": \"Offer\",\n    \"price\": \"99.99\",\n    \"priceCurrency\": \"USD\",\n    \"availability\": \"https://schema.org/InStock\"\n  }\n}\n</script>",
        "effortEstimate": "2-3 hours"
      },
      "priority": 3,
      "effort": "low",
      "estimatedPointsGain": 10
    },
    {
      "id": "f4",
      "severity": "medium",
      "category": "navigation-interaction",
      "title": "14 interactive elements lack accessible labels",
      "whatHappened": "The Accessibility Agent found 14 interactive elements (buttons, links, inputs) without aria-label or text content.",
      "whyItMatters": "Agents navigating via the accessibility tree can't identify or interact with unlabeled elements. They appear as unnamed buttons or links.",
      "affectedAgents": [
        {
          "name": "Accessibility Agent",
          "impact": "degraded"
        },
        {
          "name": "Browser Agent",
          "impact": "degraded"
        }
      ],
      "fix": {
        "summary": "Add aria-label attributes to all interactive elements.",
        "technicalDetail": "Audit all buttons, links, and form inputs. Any element without visible text content needs an aria-label describing its purpose.",
        "effortEstimate": "2-4 hours"
      },
      "priority": 4,
      "effort": "medium",
      "estimatedPointsGain": 5
    },
    {
      "id": "f5",
      "severity": "medium",
      "category": "data-standards",
      "title": "No XML sitemap found",
      "whatHappened": "No sitemap was found at standard locations (/sitemap.xml, /sitemap_index.xml).",
      "whyItMatters": "Without a sitemap, agents must discover products by crawling the site, which is slower and less reliable.",
      "affectedAgents": [
        {
          "name": "Data Agent",
          "impact": "degraded"
        }
      ],
      "fix": {
        "summary": "Generate and publish an XML sitemap with product URLs.",
        "technicalDetail": "Create a sitemap.xml that lists all product URLs with last-modified dates.",
        "effortEstimate": "1-2 hours"
      },
      "priority": 5,
      "effort": "low",
      "estimatedPointsGain": 3
    },
    {
      "id": "f6",
      "severity": "low",
      "category": "product-understanding",
      "title": "Open Graph tags missing price data",
      "whatHappened": "OG tags exist but og:price:amount and og:price:currency are missing.",
      "whyItMatters": "Some agents use OG tags as a quick way to parse product info. Missing price adds an extra parsing step.",
      "affectedAgents": [
        {
          "name": "Data Agent",
          "impact": "degraded"
        }
      ],
      "fix": {
        "summary": "Add og:price:amount and og:price:currency meta tags.",
        "technicalDetail": "Add to the <head> of product pages.",
        "codeSnippet": "<meta property=\"og:price:amount\" content=\"99.99\" />\n<meta property=\"og:price:currency\" content=\"USD\" />",
        "effortEstimate": "15 minutes"
      },
      "priority": 6,
      "effort": "low",
      "estimatedPointsGain": 2
    }
  ],
  "actionPlan": [
    {
      "findingId": "f1",
      "title": "Site blocks automated agents with bot detection",
      "severity": "critical",
      "effort": "medium",
      "estimatedPointsGain": 25,
      "isQuickWin": false
    },
    {
      "findingId": "f2",
      "title": "Add-to-cart button not accessible to agents",
      "severity": "critical",
      "effort": "low",
      "estimatedPointsGain": 15,
      "isQuickWin": true
    },
    {
      "findingId": "f3",
      "title": "No Schema.org Product markup found",
      "severity": "high",
      "effort": "low",
      "estimatedPointsGain": 10,
      "isQuickWin": true
    },
    {
      "findingId": "f4",
      "title": "14 interactive elements lack accessible labels",
      "severity": "medium",
      "effort": "medium",
      "estimatedPointsGain": 5,
      "isQuickWin": false
    },
    {
      "findingId": "f5",
      "title": "No XML sitemap found",
      "severity": "medium",
      "effort": "low",
      "estimatedPointsGain": 3,
      "isQuickWin": false
    },
    {
      "findingId": "f6",
      "title": "Open Graph tags missing price data",
      "severity": "low",
      "effort": "low",
      "estimatedPointsGain": 2,
      "isQuickWin": false
    }
  ],
  "estimatedScoreAfterFixes": 87
};
