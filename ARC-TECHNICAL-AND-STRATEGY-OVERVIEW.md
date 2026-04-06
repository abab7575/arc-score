# ARC Report — Complete Technical & Strategy Overview

## How We Collect, Evaluate, and Score Every Piece of Data

**March 22, 2026 — For External Review**

---

## Table of Contents

1. [What ARC Report Is](#1-what-arc-report-is)
2. [Architecture Overview](#2-architecture-overview)
3. [Agent 1: Data Agent — HTTP Intelligence](#3-agent-1-data-agent)
4. [Agent 2: Browser Agent — Puppeteer Navigation](#4-agent-2-browser-agent)
5. [Agent 3: Accessibility Agent — ARIA & Keyboard Testing](#5-agent-3-accessibility-agent)
6. [Agent 4: Visual Agent — Claude Vision Analysis](#6-agent-4-visual-agent)
7. [Agent 5: Feed Agent — Product Feed Discovery](#7-agent-5-feed-agent)
8. [Scoring Engine — How Points Become Scores](#8-scoring-engine)
9. [AI Agent Profiles — Per-Agent Compatibility Scoring](#9-ai-agent-profiles)
10. [Scan Orchestration — How It All Fits Together](#10-scan-orchestration)
11. [Reliability — Retry Logic & Error Handling](#11-reliability)
12. [Known Limitations & Accuracy Gaps](#12-known-limitations)
13. [Recent Accuracy Fixes](#13-recent-accuracy-fixes)
14. [Validation Strategy](#14-validation-strategy)
15. [Strategic Direction](#15-strategic-direction)
16. [Infrastructure & Scale](#16-infrastructure--scale)

---

## 1. What ARC Report Is

ARC Report (arcreport.ai) is a monitoring tool for e-commerce brands that measures how well their sites support AI shopping agents — ChatGPT Operator, Perplexity Comet, Amazon Buy For Me, Google AI Mode, Klarna AI, and others.

We send 5 autonomous agents to scan each e-commerce site. These agents test the full shopping journey: can an AI agent find products, understand pricing, add to cart, and check out? The results are scored across 7 categories, weighted into an overall 0-100 score, and projected across 10 specific AI shopping agent profiles.

**What's real:** The 5 scanner agents actually visit the site, click buttons, parse data, take screenshots, and test access. This is not a questionnaire or self-assessment.

**What's projected:** The 10 AI shopping agent compatibility scores are weighted projections based on the scanner data, not actual tests using those agents. The only real per-agent differentiation comes from user-agent access testing (does the site block GPTBot vs. ClaudeBot?).

**Current scale:** 276 brands in the database, 73 fully scanned, daily scan cadence.

---

## 2. Architecture Overview

### Scan Pipeline

```
Scan Orchestrator
  │
  ├── 1. Browser Agent (Puppeteer + Stealth)
  │     8-step journey: homepage → cookie consent → navigation →
  │     product page → analyze product → select variant →
  │     add to cart → attempt checkout
  │     Output: screenshots, rendered HTML, interaction results
  │
  ├── 2. Data Agent (HTTP fetch + regex)
  │     Receives rendered HTML from Browser Agent
  │     Parses: robots.txt, JSON-LD, Schema.org, Open Graph
  │     Probes: API endpoints, ACP, UCP, commerce APIs
  │     Tests: 8 user-agent strings × 2 pages = 16 access tests
  │
  ├── 3. Accessibility Agent (Puppeteer a11y tree)
  │     Landmarks, headings, ARIA labels, keyboard focusability
  │
  ├── 4. Visual Agent (Claude Vision API) — weekly, optional
  │     Screenshots → Claude Sonnet → visual clarity assessment
  │
  └── 5. Feed Agent (HTTP fetch + XML/JSON parsing) — weekly, optional
        Google Merchant, Shopify JSON, RSS/Atom, Facebook catalog
```

### Data Flow

```
Browser Agent → rendered HTML → Data Agent → schema source tracking
All 5 agents → raw results → Scoring Engine → 7 category scores
Category scores → AI Agent Profiles → 10 per-agent compatibility scores
Everything → Report JSON → Database → Brand report page
```

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 16 |
| Database | SQLite (better-sqlite3) via Drizzle ORM |
| Browser automation | Puppeteer 24.37.5 + puppeteer-extra-plugin-stealth |
| Vision AI | Anthropic Claude Sonnet (claude-sonnet-4-20250514) |
| Hosting | Railway (Singapore) |
| Container | Docker, Node 20 slim + Chromium |

---

## 3. Agent 1: Data Agent

**File:** `src/lib/scanner/data-agent.ts` (~900 lines)
**Purpose:** Fetch raw HTML, parse structured data, test per-agent access — all without rendering JavaScript.

### 3.1 Product Page HTML Fetch

| Detail | Value |
|--------|-------|
| URL | Product URL if provided, else base URL |
| User-Agent | Chrome 131 (full desktop string) |
| Accept | `text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8` |
| Timeout | 15 seconds |
| Retry | 3 attempts, exponential backoff (1s, 2s, 4s) |
| Output | Raw HTML string |

**Schema source tracking:** The Data Agent receives optional `renderedHtml` from the Browser Agent (post-JavaScript execution). It parses JSON-LD from both raw HTTP and rendered HTML independently, then reports the source:
- `"http"` — schema found only in raw HTML
- `"rendered"` — schema found only after JavaScript execution
- `"both"` — found in both
- `"none"` — not found anywhere

This was added to address the false positive where JS-rendered schema (common on React/Next.js sites) was reported as "missing."

### 3.2 robots.txt Analysis

| Detail | Value |
|--------|-------|
| URL | `{baseUrl}/robots.txt` |
| User-Agent | `ARCReport-Scanner/1.0` |
| Timeout | 10 seconds |
| Content-Type check | If response is HTML → treat as not found (WAF serving HTML instead of robots.txt) |

**8 AI user-agents tested against robots.txt rules:**

| User-Agent | Associated With |
|------------|----------------|
| GPTBot | OpenAI (ChatGPT Shopping, Operator) |
| ChatGPT-User | OpenAI (ChatGPT Shopping) |
| ClaudeBot | Anthropic (Claude Computer Use) |
| Claude-Web | Anthropic |
| PerplexityBot | Perplexity (Shopping, Comet) |
| Google-Extended | Google (AI Mode) |
| CCBot | Common Crawl (Klarna AI, OpenClaw) |
| Amazonbot | Amazon (Buy For Me) |

**Detection method:** Regex extracts per-agent `User-agent:` sections from robots.txt. If the section contains `Disallow: /` (blocks entire site), the agent is marked as blocked. If the agent isn't mentioned at all, it's marked as allowed (default-open).

**Known limitation:** This does NOT check wildcard `User-agent: *` rules. If a site blocks all bots via `User-agent: * / Disallow: /` but doesn't mention GPTBot specifically, GPTBot is incorrectly reported as "allowed." This is a known false negative.

### 3.3 Sitemap Discovery

**Lookup order:**
1. Parse `Sitemap:` directives from robots.txt
2. Fall back to common paths: `/sitemap.xml`, `/sitemap_index.xml`, `/sitemap/sitemap.xml`

**Validation:** Response must contain `<urlset` or `<sitemapindex` (XML markers). Product URLs are counted by matching against the pattern `/product|/p/|/pd/|/dp/|/item|/shop/`.

**Recent fix:** If robots.txt declares a sitemap URL but we can't actually fetch or parse it, we now report `found: false` instead of `found: true`. A declared-but-unfetchable sitemap is useless to agents.

### 3.4 JSON-LD / Schema.org Parsing

**Extraction method:** Regex: `/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi`

Each match is parsed as JSON. Arrays are flattened. Invalid JSON is silently skipped.

**Product schema detection** looks for `@type` matching: `Product`, `ProductGroup`, `IndividualProduct`, `ProductModel`. Also checks inside `@graph` arrays for nested Product types.

**15 product fields checked** (presence only, not value accuracy):
`name, description, image, price, priceCurrency, availability, brand, sku, gtin, gtin13, gtin14, mpn, offers, aggregateRating, review`

Fields are checked at three levels: top-level, inside `offers`, and inside `hasVariant[].offers`.

**Known limitation:** We check field *presence*, not *accuracy*. A schema with `price: "0.00"` or a stale cached price still counts as "price found."

### 3.5 Open Graph Parsing

Two regex patterns to handle both attribute orderings:
- `<meta property="og:..." content="...">`
- `<meta content="..." property="og:...">`

Output is a key-value map of all `og:` tags found.

### 3.6 API Endpoint Probing

**Endpoints tested:**

| Path | Platform | What It Indicates |
|------|----------|-------------------|
| `/products.json` | Shopify | Public product catalog API |
| `/wp-json/wc/v3/products` | WooCommerce | Product API |
| `/api/products` | Generic | REST product API |
| `/api/v1/products` | Generic | Versioned product API |
| `/graphql` | Any | GraphQL endpoint |

**Success criteria:** HTTP 2xx, Content-Type includes `application/json`, status is NOT 401.

**Recent fix:** Endpoints returning 401 (requires authentication) were previously counted as "found." They're now excluded — an API that requires auth is unusable by AI agents.

### 3.7 ACP (Agentic Commerce Protocol) Probing

**Discovery endpoints:** `/.well-known/acp`, `/.well-known/acp.json`

**Checkout endpoint paths:** `/checkout_sessions`, `/acp/checkout_sessions`, `/api/acp/checkout_sessions`

**Probes performed:**
1. GET on discovery paths — looking for JSON response
2. OPTIONS on each ACP path — checking `Allow` header
3. GET with non-existent ID (`/path/does-not-exist`) — expecting JSON 404

**Support classification:**
- **True:** Discovery document found OR response body has checkout-shape keys (`id, status, line_items, payment`)
- **Unknown:** 2+ probes returned JSON but no definitive structure
- **False:** <2 JSON probes

### 3.8 Commerce API Probing

**Cart endpoints tested:** `/api/cart`, `/cart.js`, `/api/v1/cart`
**Checkout endpoints tested:** `/api/checkout`, `/api/v1/checkout`
**GraphQL test:** POST to `/graphql` with `{"query": "{ __typename }"}`

**Recent fix:** Checkout endpoints returning 401 with JSON content-type were previously counted as "found." Now requires `res.ok` (2xx status).

**Detection signals:**
- `/cart.js` found → "Shopify cart API" signal
- Any JSON cart endpoint → `cartApiFound = true`
- GraphQL JSON response → `graphqlDetected = true`

### 3.9 Other File Checks

| File | URL | Validation |
|------|-----|-----------|
| UCP | `/.well-known/ucp` | Must return non-empty body |
| llms.txt | `/llms.txt` | Must not start with `<!` or `<html` (rejects HTML 404 pages) |

### 3.10 Per-Agent User-Agent Access Testing

This is the **only place where per-agent differentiation is based on real testing**, not projections.

**8 user-agent strings tested on 2 pages (homepage + product) = 16 tests total:**

| UA String | Label |
|-----------|-------|
| `GPTBot/1.0` | GPTBot |
| `ChatGPT-User/1.0` | ChatGPT-User |
| `PerplexityBot/1.0` | PerplexityBot |
| `ClaudeBot/1.0` | ClaudeBot |
| `Google-Extended` | Google-Extended |
| `Amazonbot/1.0` | Amazonbot |
| `CCBot/2.0` | CCBot |
| `Bingbot/2.0` | Bingbot |

**Process:**
1. Fetch homepage and product page with Chrome UA to establish content-size baselines
2. For each of 8 UA strings, fetch both pages
3. Compare response status, body size, and content against bot-block patterns

**Verdict logic per request:**

| Condition | Verdict |
|-----------|---------|
| HTTP 403 or 429 | `blocked` |
| HTTP 503 + bot-block patterns in body | `blocked` |
| Any status + bot-block patterns in body | `blocked` |
| Content < 25% of Chrome baseline | `degraded` |
| HTTP 200-399 with normal content | `allowed` |
| Timeout or network error | `unknown` |

**19 bot-block patterns checked** (regex against first 5KB of response body):
```
captcha, access denied, blocked, challenge page, please verify,
are you a human/robot, bot detected, automated access, cf-challenge,
ray id, checking your browser, just a moment, enable javascript and cookies,
cloudflare, datadome, perimeterx, distil, incapsula, imperva
```

**Recent fix:** Content-stripped threshold changed from 50% to 25%. The old threshold produced false "degraded" verdicts on sites that legitimately serve lighter pages to non-Chrome user agents (e.g., mobile-optimized or AMP variants).

**Timeout:** 5 seconds per request (these are lightweight checks, not full page loads).

---

## 4. Agent 2: Browser Agent

**File:** `src/lib/scanner/browser-agent.ts` (~1,350 lines)
**Purpose:** Navigate the site using Puppeteer like a real AI shopping agent would — clicking, scrolling, adding to cart, attempting checkout.

### Configuration

| Setting | Value |
|---------|-------|
| Viewport | 1440 × 900 |
| User-Agent | Chrome 120 (full desktop string) |
| Stealth | puppeteer-extra-plugin-stealth enabled |
| Chrome flags | `--no-sandbox, --disable-setuid-sandbox, --disable-dev-shm-usage, --disable-blink-features=AutomationControlled` |

### Step 1: Navigate to Homepage

| Detail | Value |
|--------|-------|
| Wait condition | `domcontentloaded` |
| Timeout | 30 seconds |
| Post-load delay | 2 seconds (for lazy-loaded content) |
| Bot detection | Checks rendered HTML for blocking patterns |

**Bot detection logic:**
1. Extract body text (strip HTML tags)
2. If body text < 500 characters AND contains blocking phrases ("access denied", "you have been blocked", "are you a robot", "verify you are human", "checking your browser", "just a moment") AND page has no `<nav>` or product elements → `blockedByBot = true`
3. Cloudflare-specific: `cf-browser-verification` class present without `<nav>` → blocked

**If blocked:** Scan stops immediately. All subsequent steps skipped. Overall result = `fail`.

**Screenshot:** Annotated with step number, action label, and pass/fail badge overlay.

### Step 2: Handle Cookie Consent

**Detection patterns** (class/ID substring match in HTML):
`cookie-consent, cookie-banner, cookieconsent, onetrust, OneTrust, cookie-policy, gdpr, CookieConsent, cookie_notice, accept-cookies, cookie-notice, cc-banner`

**Dismiss logic (in order):**
1. `#onetrust-accept-btn-handler` (OneTrust)
2. `#accept-cookies`, `#acceptCookies`, `#cookie-accept`
3. Any `button` element whose text contains "accept" or "agree"

**Post-click delay:** 2 seconds (wait for DOM to update)

**Verdict:**
- `pass`: No consent banner found, OR banner found and dismissed
- `partial`: Banner found but couldn't find/click dismiss button
- `fail`: Banner blocks interaction and can't be dismissed

### Step 3: Explore Navigation

**Query:** `nav a, header a` — all links inside nav and header elements

**Data collected per link:**
- Text content
- href
- Visibility (offsetParent !== null)
- Position (bounding box center coordinates)

**Verdict:** `pass` if >3 visible navigation links found, else `partial`

### Step 4: Navigate to Product Page

**Priority order:**
1. Use provided `productUrl` if available
2. Search for product link in page:
   - Links with href matching `/product|/p/|/pd/|/t/|/dp/|/shop/`
   - Exclude category/collection links
   - Prefer links inside `article`, `[class*='card']`, `[class*='product']`, `[class*='tile']`

**Wait condition:** `domcontentloaded` + 2 seconds
**Timeout:** 30 seconds

**On success:** Records `renderedProductHtml` (full page HTML after JavaScript execution) for passing to the Data Agent.

### Step 5: Analyze Product Page

**Price detection selectors** (tried in order):
```css
[class*="price" i]
[data-test*="price" i]
[itemprop="price"]
[class*="Price"]
```
Price value extracted via regex: `/[\$\£\€][\d,.]+/`

**Add-to-cart button detection selectors** (tried in order):
```css
button[class*="add-to-cart" i]
button[class*="addtocart" i]
button[class*="add-to-bag" i]
button[data-test*="add" i]
button[aria-label*="add to" i]
[class*="add-to-cart" i]
[class*="addToCart" i]
```
Fallback: Scan all `button` elements for text matching `/add to (cart|bag|basket)/i`

**Human-Agent Gap detection:**
Compares what's visually present on the page vs. what the agent could programmatically find:
- Total visible images vs. images found via selectors
- Visible price text vs. extracted price
- Potential size buttons vs. found size selectors
- Each gap generates a recommendation (e.g., "Add class containing 'product' to image containers")

**Data collected:** title, price, hasCartButton, cartButtonText, sizeOptions count, imageCount, descriptionLength, visible images count, visible price count, potential size buttons, gallery controls

### Step 6: Select Variant (Size/Color)

**Selectors for variant buttons** (tried in order):
```css
[class*="size" i] button
[data-test*="size" i] button
[class*="variant" i] button
[class*="swatch" i] button
```
Filter: Only visible (`offsetParent !== null`) and not disabled.

**Alternative:** `select[name*="size" i]` dropdown element.

**Action:** Click first available non-disabled variant button. If dropdown, select second option.

**Verdict:**
- `pass`: Variant selected successfully
- `partial`: Variant UI found but couldn't interact
- `fail`: No variant selector found (may still succeed at add-to-cart if no variants required)

### Step 7: Add to Cart (Critical Step)

**Button finding:** Same selectors as Step 5.

**Click method:** Puppeteer `.click()` or fallback to `element.click()` via evaluate.

**Post-click delay:** 2 seconds.

**Cart verification — 3 independent checks (any one = verified):**

**Check 1: Cart Count Badge**
Selectors tested:
```css
[class*="cart-count" i], [class*="cart-badge" i], [class*="cart-quantity" i]
[class*="cartCount" i], [class*="CartCount" i], [class*="bag-count" i]
[data-test*="cart-count" i], [data-testid*="cart-count" i]
[class*="mini-cart"] [class*="count" i]
[class*="header-cart"] [class*="count" i]
[aria-label*="cart" i] [class*="badge" i]
[class*="cart-icon" i] span
```
**Success:** Found element with numeric text content > 0

**Check 2: Confirmation Signal**
Selectors tested:
```css
[class*="toast" i], [class*="notification" i], [class*="snackbar" i]
[class*="added-to-cart" i], [class*="addedToCart" i]
[class*="cart-confirmation" i]
[class*="mini-cart" i][class*="open" i]
[class*="cart-drawer" i], [class*="cart-modal" i]
[role="dialog"][class*="cart" i], [role="alert"]
```
**Success:** Visible element whose text matches `/added|cart|bag|basket/i`

**Check 3: Cart Page Verification**
1. Navigate to `/cart` or find cart link on page
2. Check for empty cart signals: `"cart is empty"`, `"bag is empty"`, `"basket is empty"`, `"no items"`
3. Check for item indicators:
   ```css
   [class*="cart-item" i], [class*="line-item" i]
   table[class*="cart" i] tbody tr
   ```
4. **Success:** Item indicators present AND no empty signals

**Verdict:**
- `pass` (addToCartSuccess=true, cartVerified=true): Button clicked AND one of three checks confirmed
- `partial` (addToCartSuccess=false, clickedButUnverified=true): Button clicked, no error thrown, but none of three checks confirmed
- `fail`: Button not found or click failed

**Known limitation:** "Partial" may be a silent failure — the button was clicked but the backend transaction may have failed. The agent has no way to verify without API-level cart state access.

### Step 8: Attempt Checkout

**Checkout link selectors:**
```css
a[href*="checkout"]
a[href*="cart"]
button[class*="checkout" i]
[class*="cart-icon"]
a[href*="bag"]
```

**Guest checkout detection:** Page text matches `/guest/i` or `/continue.as.guest/i` or `/checkout.without/i`

**Login requirement detection:** Page text matches `/sign.in/i` or `/log.in/i` or `/create.account/i`

**Verdict:**
- `pass` + `guestCheckoutAvailable=true`: Reached checkout, guest option detected
- `partial`: Reached checkout, unclear on guest
- `fail`: Couldn't find checkout link, OR requires login with no guest option

### Overall Browser Agent Output

```
blockedByBot: boolean
captchaDetected: boolean          (currently always false — not implemented)
cookieConsentFound: boolean
addToCartSuccess: boolean         (true only if clicked AND verified)
cartVerified: boolean
cartVerificationMethod: "badge" | "confirmation" | "cart-page" | null
checkoutReached: boolean
guestCheckoutAvailable: boolean
renderedProductHtml: string       (passed to Data Agent)
steps: 8 steps with screenshots
humanAgentGaps: array of {what, why, recommendation}
```

---

## 5. Agent 3: Accessibility Agent

**File:** `src/lib/scanner/accessibility-agent.ts` (~451 lines)
**Purpose:** Test whether AI agents can interact with the site via the accessibility tree and ARIA labels — without visual rendering.

### Configuration
- Viewport: 1440 × 900
- Wait: `domcontentloaded` + 2 seconds

### Step 1: Capture Accessibility Tree
- Uses Puppeteer's `page.accessibility.snapshot({interestingOnly: false})`
- Recursively counts all nodes in the tree
- **Verdict:** `pass` if >50 nodes, else `partial`

### Step 2: Analyze Landmarks & Headings

**Landmarks checked (HTML elements + ARIA roles):**
```
header, footer, nav, main, aside
[role="banner"], [role="navigation"], [role="main"]
[role="contentinfo"], [role="complementary"], [role="search"]
```

**Headings checked:** `h1` through `h6`

**Issues flagged:**
- No navigation landmark
- No main landmark
- No h1 heading
- Multiple h1 headings

**Verdict:** `pass` if has nav + main + exactly 1 h1. `partial` if missing 1-2. `fail` if missing 3+.

### Step 3: Analyze Interactive Elements

**Elements queried:**
```css
button, a, input, select, textarea,
[role="button"], [role="checkbox"], [role="radio"],
[role="tab"], [role="combobox"], [role="slider"], [tabindex]
```

**Visibility filter:** `offsetParent !== null`

**Label check** (element must have at least one):
- `aria-label` attribute
- `aria-labelledby` → resolved to referenced element's text
- Direct text content
- `title` attribute

**Unlabeled ratio thresholds:**
| Ratio | Verdict |
|-------|---------|
| < 10% unlabeled | `pass` (+20 nav points) |
| 10-15% | `pass` (+15 nav points) |
| 15-30% | `partial` (+8 nav points) |
| > 30% | `fail` (+0 nav points) |

### Step 4: Test Key Interactions

**Add-to-cart search:** Buttons matching `/add to (cart|bag|basket)/i`

**Size selector search:**
```css
[role="radiogroup"], [role="listbox"],
select[name*="size" i], [aria-label*="size" i]
```

**Price element search:**
```css
[itemprop="price"], [aria-label*="price" i], [class*="price" i]
```

**Focus trap detection:** Count visible dialogs (`[role="dialog"]`, `[role="alertdialog"]`, `[class*="modal" i]`, `[class*="overlay" i]`)

**Verdict:** `pass` if 3+ of {add-to-cart, size-selector, price, no overlays} found. `partial` if 2. `fail` if <2.

### Step 5: Test Keyboard Navigation

**Focusable elements queried:**
```css
a[href], button, input, select, textarea,
[tabindex]:not([tabindex="-1"])
```
Visibility filter applied.

**Verdict:** `pass` if >10 focusable elements, else `partial`

### Output
```
interactiveElements: number
unlabeledElements: number
landmarkCount: number
headingStructure: ["H1: Title", "H2: Section", ...]
issues: ["Missing nav landmark", ...]
```

---

## 6. Agent 4: Visual Agent (Weekly/Optional)

**File:** `src/lib/scanner/visual-agent.ts` (~463 lines)
**Purpose:** Send page screenshots to Claude Vision API to evaluate visual clarity for multimodal AI agents.

### Configuration
- **Model:** `claude-sonnet-4-20250514`
- **Max tokens per call:** 1024
- **Requires:** `ANTHROPIC_API_KEY` environment variable
- **If API key missing:** Returns `partial` with skip note (no error)

### Step 1: Homepage Visual Clarity

**Screenshot:** Desktop viewport (1440 × 900), full page

**Prompt sent to Claude:**
```
Answer in structured format:
1. NAVIGATION_CLEAR (yes/no): Is there a visible navigation menu with clear category links?
2. PRODUCT_LINKS_VISIBLE (yes/no): Can you see links or images that clearly lead to product pages?
3. SEARCH_BAR_VISIBLE (yes/no): Is there a visible search input?
4. VISUAL_CLUTTER (low/medium/high): How cluttered is the layout?
5. POPUPS_OVERLAYS (yes/no): Are there any popups, modals, or overlays obscuring the main content?
6. MAIN_CTA: What is the most prominent call-to-action on this page?
7. ISSUES: List any visual issues that would confuse an AI vision agent.
```

**Parsing:** Regex extraction of structured answers. Clutter mapped to score: `low=85, medium=55, high=25`

### Step 2: Product Page Analysis

**Prompt sent to Claude:**
```
1. PRODUCT_TITLE_VISIBLE (yes/no)
2. PRICE_VISIBLE (yes/no)
3. PRICE_VALUE: What is the price shown?
4. ADD_TO_CART_VISIBLE (yes/no)
5. ADD_TO_CART_LOCATION: Where on the screen?
6. ADD_TO_CART_DISTINCT (yes/no): Visually distinct from other buttons?
7. SIZE_OPTIONS_VISIBLE (yes/no)
8. IMAGE_QUALITY (good/fair/poor)
9. VISUAL_HIERARCHY: Clear title → price → options → CTA?
10. ISSUES: Anything preventing an AI vision agent from purchasing?
```

### Step 3: CTA Identification Challenge

**Prompt sent to Claude:**
```
You are an AI shopping agent. Your task is to add this product to cart.
Using ONLY what you can see:
1. CLICK_TARGET: Where would you click to add to cart?
2. CONFIDENCE (high/medium/low)
3. ALTERNATIVE_BUTTONS: Are there similar-looking buttons?
4. REQUIRES_SELECTION (yes/no): Need to select size/color first?
5. SELECTION_METHOD: How would you select a variant?
6. OBSTACLES: What visual obstacles exist?
```

### Step 4: Mobile Viewport Test

**Viewport change:** 390 × 844 (iPhone 14 Pro)

**Prompt sent to Claude:**
```
1. ADD_TO_CART_VISIBLE (yes/no): Visible without scrolling?
2. PRICE_VISIBLE (yes/no): Visible without scrolling?
3. CONTENT_READABLE (yes/no): Text large enough?
4. LAYOUT_INTACT (yes/no): Layout works at this size?
5. STICKY_CTA (yes/no): Sticky add-to-cart button?
6. ISSUES: Mobile-specific issues for AI agents?
```

### Output
```
navigationClear: boolean
priceIdentified: boolean
addToCartIdentified: boolean
ctaDistinct: boolean
visualClutterScore: number (0-100)
steps: 4 steps with screenshots
```

**Cost:** ~$0.50 per brand scan (4 API calls × ~$0.12 each). Run weekly, not daily.

---

## 7. Agent 5: Feed Agent (Weekly/Optional)

**File:** `src/lib/scanner/feed-agent.ts` (~532 lines)
**Purpose:** Test whether AI shopping platforms that rely on product feeds can discover and consume the site's catalog.

### Step 1: Auto-Discover Feed Links in HTML

Fetch homepage HTML, parse for:
- `<link type="application/rss+xml|application/atom+xml|application/xml">` tags
- Facebook catalog meta: `property="product:catalog"` with `content` URL

### Step 2: Probe Google Merchant Feed Paths

**9 paths tested** (with 200ms polite delay between probes):
```
/feed/google-merchant.xml
/feeds/google-shopping.xml
/product-feed.xml
/google-shopping-feed.xml
/feeds/products.xml
/feed.xml
/products.atom
/collections/all.atom
/feeds/catalog.xml
```

**Success criteria:** HTTP 2xx + Content-Type includes `xml`/`rss` OR body contains `<rss`/`<feed`/`<channel` + body >200 bytes + item count >0.

**XML product parsing** (regex-based, samples first 10 items):
- Fields extracted: title, price (with currency), availability, image_link, link, gtin, brand, condition
- Missing fields tracked per feed

### Step 3: Check Shopify Products JSON

**3 paths tested:**
```
/products.json
/products.json?limit=10
/collections/all/products.json
```

**Parsing:** Standard Shopify JSON format. Extracts title, price (from `variants[0]`), availability, image URL, product handle.

### Step 4: Check RSS/Atom Feeds

**7 paths tested:**
```
/feed, /rss, /feed/rss, /blog/feed, /atom.xml, /rss.xml, /index.xml
```

**Product vs. blog differentiation:** Regex test for `/price|product|offer|sku|gtin|availability/i`. Feeds without product keywords are tagged as "RSS Blog Feed."

### Step 5: Feed Quality Scoring

| Points | Condition |
|--------|-----------|
| +20 | At least one feed exists |
| +25 | Google Merchant feed found |
| +20 | Shopify feed found |
| +15 | Meta/Facebook catalog found |
| +10 | RSS feed found |
| +10 | Feed with zero missing fields |
| +5 | Feed with 1-2 missing fields |

**Score:** `Math.min(100, totalPoints)`
**Verdict:** `pass` (≥60), `partial` (30-59), `fail` (<30)

### Output
```
hasGoogleMerchantFeed: boolean
hasShopifyFeed: boolean
hasMetaCatalog: boolean
hasRssFeed: boolean
totalProductsInFeeds: number
feedQualityScore: number (0-100)
feedsDiscovered: array of {url, type, valid, productCount, sampleProducts, missingFields}
priceConsistency: "untested"  // TODO: cross-check feed prices vs page prices
```

---

## 8. Scoring Engine

**File:** `src/lib/scanner/scoring-engine.ts` (~994 lines)
**Purpose:** Convert raw agent results into 7 category scores, weighted into an overall 0-100 score.

### Overall Score Formula

```
overallScore = round(
  (discoverability.score × 0.15) +
  (productUnderstanding.score × 0.20) +
  (navigationInteraction.score × 0.20) +
  (cartCheckout.score × 0.25) +
  (performanceResilience.score × 0.05) +
  (dataStandards.score × 0.05) +
  (agenticCommerce.score × 0.10)
)
```

### Grade Thresholds

| Grade | Score Range |
|-------|------------|
| A | 85-100 |
| B | 70-84 |
| C | 50-69 |
| D | 30-49 |
| F | 0-29 |

### Category 1: Discoverability (weight: 0.15)

| Points | Source | Condition |
|--------|-------|-----------|
| +20 | Browser Agent | Homepage loads successfully (pass) |
| +10 | Browser Agent | Homepage loads partially |
| +25 | Browser Agent | Navigation links found (pass) |
| +12 | Browser Agent | Navigation links found (partial) |
| +25 | Browser Agent | Product page found (pass) |
| +12 | Browser Agent | Product page found (partial) |
| +15 | Accessibility Agent | 3+ landmarks found |
| +8 | Accessibility Agent | 1-2 landmarks found |
| +15 | Accessibility Agent | 3+ headings found |
| +8 | Accessibility Agent | 1-2 headings found |
| +5 | Visual Agent (optional) | Navigation visually clear |

**Max possible:** 105 → capped at 100

### Category 2: Product Understanding (weight: 0.20)

| Points | Source | Condition |
|--------|-------|-----------|
| +25 | Data Agent | Schema.org Product type found |
| +10 | Data Agent | JSON-LD found (fallback, no Product type) |
| +20 | Data Agent | Price in schema (price or offers field) |
| +10 | Browser Agent | Price found visually (fallback) |
| +15 | Data Agent | Offers field present |
| +8 | Browser Agent | Size options found (fallback) |
| +15 | Data Agent | Description in schema |
| +8 | Data Agent | Meta description (fallback) |
| +10 | Data Agent | Aggregate rating present |
| +15 | Data Agent | SKU, GTIN, or GTIN13 present |
| +3 | Visual Agent (optional) | Price visually identified |
| +5 | Feed Agent (optional) | Products found in feeds |

**Max possible:** 104 → capped at 100

### Category 3: Navigation & Interaction (weight: 0.20)

| Points | Source | Condition |
|--------|-------|-----------|
| +15 | Browser Agent | No cookie consent found, OR consent dismissed |
| +8 | Browser Agent | Cookie consent found, partially handled |
| +25 | Browser Agent | Variant selected (pass) |
| +12 | Browser Agent | Variant selection partial |
| +20 | Accessibility Agent | <5% unlabeled interactive elements |
| +15 | Accessibility Agent | 5-15% unlabeled |
| +8 | Accessibility Agent | 15-30% unlabeled |
| +20 | Accessibility Agent | Keyboard navigation pass |
| +10 | Accessibility Agent | Keyboard navigation partial |
| +20 | Accessibility Agent | Key interactions pass |
| +10 | Accessibility Agent | Key interactions partial |
| +5 | Visual Agent (optional) | Visual clutter score ≥70 |

**Max possible:** 125 → capped at 100

### Category 4: Cart & Checkout (weight: 0.25) — HIGHEST WEIGHT

| Points | Source | Condition |
|--------|-------|-----------|
| +35 | Browser Agent | Add-to-cart success AND cart verified |
| +25 | Browser Agent | Add-to-cart success but cart NOT verified |
| +10 | Browser Agent | Button clicked but fully unverified |
| +25 | Browser Agent | Checkout page reached |
| +25 | Browser Agent | Guest checkout available |
| +5 | Browser Agent | Checkout reached but no guest option |
| +15 | Data Agent | API endpoints found (JSON response on product/cart/GraphQL paths) |
| +5 | Visual Agent (optional) | CTA identified AND visually distinct |
| +2 | Visual Agent (optional) | CTA identified only |

**Max possible:** 105 → capped at 100

**Recent fix:** Cart scoring now distinguishes three tiers:
- **Verified** (35 pts): Button clicked AND one of three verification checks passed
- **Unverified success** (25 pts): Button clicked, no error, but verification couldn't confirm
- **Clicked but unverified** (10 pts): Button clicked but no verification at all — low confidence

Previously, verified and unverified both received 35 points.

### Category 5: Performance & Resilience (weight: 0.05)

| Points | Source | Condition |
|--------|-------|-----------|
| +35 | Browser Agent | Not blocked by bot detection |
| +25 | Browser Agent | No CAPTCHA detected |
| +20 | Browser Agent | Homepage load < 5 seconds |
| +10 | Browser Agent | Homepage load < 10 seconds |
| +20 | Data Agent | HTML size > 1,000 bytes |
| +10 | Data Agent | HTML size > 0 bytes |
| -15 | Data Agent | >50% of UA tests blocked |
| -8 | Data Agent | >25% of UA tests blocked |
| -3 | Data Agent | >0% of UA tests blocked |

### Category 6: Data Standards & Feeds (weight: 0.05)

| Points | Source | Condition |
|--------|-------|-----------|
| +20 | Data Agent | robots.txt found, no agents blocked |
| +10 | Data Agent | robots.txt found, ≤2 agents blocked |
| +20 | Data Agent | Sitemap found and fetchable |
| +10 | Data Agent | Open Graph tags present |
| +5 | Data Agent | `og:price:amount` present |
| +25 | Data Agent | JSON-LD found |
| +20 | Data Agent | API endpoints found |
| +10 | Feed Agent (optional) | Google Merchant feed found |
| +5 | Feed Agent (optional) | Shopify feed found |
| +5 | Feed Agent (optional) | Feed with no missing fields |

### Category 7: Agentic Commerce (weight: 0.10)

**Layer A — ACP Protocol (0-40 pts):**

| Points | Condition |
|--------|-----------|
| +40 | ACP explicitly supported (discovery doc or checkout-shape response) |
| +15 | ACP support unknown (some JSON responses but inconclusive) |
| +0-20 | Partial: up to 10 per JSON probe response |

**Layer B — Commerce API (0-35 pts):**

| Points | Condition |
|--------|-----------|
| +15 | Cart API found (cart.js, /api/cart, etc.) |
| +15 | Checkout API found (/api/checkout) |
| +5 | GraphQL endpoint detected |

**Layer C — Commerce Data (0-25 pts):**

| Points | Condition |
|--------|-----------|
| +5 | UCP file with commerce keywords |
| +5 | llms.txt with commerce keywords |
| +10 | JSON-LD Product/Offer with availability + price |
| +5 | Sitemap URL contains "product" |
| +5 | Feed quality score ≥50 |

### Verdict Generation

| Condition | Verdict Text |
|-----------|-------------|
| Bot blocked | "Your site actively blocks automated agents. Personal AI agents cannot interact." |
| Score ≥ 85 | "Highly ready. Agents can discover, evaluate, and purchase products." |
| Score ≥ 70 | "Mostly ready. Minor friction, core shopping flow works." |
| Score ≥ 50 | "Significant gaps. Agents struggle with key interactions." |
| Score < 50 | "Major barriers. Agents cannot complete purchases." |

### Findings Generation

Each scan generates prioritized findings with:
- **Severity:** critical, high, medium, low
- **Category:** Mapped to one of 7 scoring categories
- **Fix:** Summary + technical detail + effort estimate
- **Estimated points gain:** How many score points fixing this would add

**Critical finding triggers:**
- Bot blocking detected
- No guest checkout (checkout reached but login required)
- Add-to-cart button not found

**High finding triggers:**
- Clicked add-to-cart but unverified
- Cookie consent blocking interaction
- No Schema.org Product markup
- No commerce APIs found
- No product feeds found
- UA string blocked for specific agents
- Visual agent can't identify add-to-cart button

---

## 9. AI Agent Profiles

**File:** `src/lib/ai-agents.ts` (~397 lines)
**Purpose:** Project how 10 real-world AI shopping agents would score, based on weighted category scores and user-agent access testing.

### The 10 Agents

#### Feed-Based Agents (rely on structured data + APIs)

| Agent | Company | Key Weights | UA Strings |
|-------|---------|-------------|------------|
| ChatGPT Shopping | OpenAI | 0.20 discoverability, 0.20 product, 0.20 data-standards, 0.20 agentic | GPTBot, ChatGPT-User |
| Google AI Mode | Google | 0.20 discoverability, 0.20 product, 0.20 data-standards, 0.20 agentic | Google-Extended |
| Perplexity Shopping | Perplexity | 0.25 product, 0.25 data-standards, 0.15 agentic | PerplexityBot |
| Microsoft Copilot | Microsoft | 0.20 data-standards, 0.20 agentic, 0.15 cart | Bingbot |
| Klarna AI | Klarna | 0.30 data-standards, 0.25 product | CCBot |

#### Browser-Based Agents (navigate and click like humans)

| Agent | Company | Key Weights | UA Strings |
|-------|---------|-------------|------------|
| ChatGPT Operator | OpenAI | 0.30 cart, 0.25 navigation, 0.20 performance | GPTBot |
| Amazon Buy For Me | Amazon | 0.30 cart, 0.20 navigation, 0.20 performance | Amazonbot |
| Perplexity Comet | Perplexity | 0.25 cart, 0.25 navigation, 0.20 performance | PerplexityBot |
| Claude Computer Use | Anthropic | 0.30 cart, 0.25 performance, 0.20 navigation | ClaudeBot |
| OpenClaw | OpenClaw | 0.30 cart, 0.25 navigation, 0.20 performance | CCBot |

### Per-Agent Score Formula

```
agentScore = Σ(categoryScore × agentWeight[category]) + uaPenalty
           = max(0, result)
```

### UA Penalty Logic

For each agent, check its associated UA strings against the Data Agent's UA test results:

| Condition | Penalty |
|-----------|---------|
| Both homepage AND product page blocked for this agent's UA | -15 |
| One page blocked | -10 |
| Both pages degraded | -7 |
| One page degraded | -4 |
| All pages allowed | 0 |

**This is the only real per-agent differentiation.** If Nike blocks GPTBot but allows PerplexityBot, ChatGPT Shopping loses 10-15 points while Perplexity Shopping is unaffected. Everything else is a weighted projection of the same 7 category scores.

### What This Means

The 10 agent scores are **useful directional indicators**, not **ground-truth measurements**. They tell brands "if this agent primarily cares about cart checkout vs. structured data, here's how you'd score." But they don't simulate actual agent behavior, multi-step reasoning, or agent-specific failure modes.

---

## 10. Scan Orchestration

**File:** `src/lib/scanner/scan-orchestrator.ts` (~134 lines)

### Execution Order (Sequential)

1. **Browser Agent** runs first → produces rendered HTML and navigation results
2. **Data Agent** receives `renderedProductHtml` from Browser Agent → catches JS-injected schema
3. **Accessibility Agent** runs independently
4. **Visual Agent** runs if `skipVisual` is false (weekly only, API cost management)
5. **Feed Agent** runs if `skipFeed` is false (weekly only)
6. **Scoring Engine** takes all 5 results → produces category scores, findings, action plan
7. **Per-agent scoring** projects 10 AI agent compatibility scores
8. **Database insert** saves full report JSON + scan metadata

### Re-Scan Guard

```
wasScannedToday(brandId) → checks latest scan date against today
If scanned today → skip (unless --force flag)
```

### Daily vs. Weekly Scans

| Agents | Cadence | Reason |
|--------|---------|--------|
| Browser + Data + Accessibility | Daily | Core metrics, low cost |
| Visual Agent | Weekly | Claude Vision API cost (~$0.50/brand) |
| Feed Agent | Weekly | Feed endpoints rarely change |

---

## 11. Reliability

**File:** `src/lib/scanner/fetch-with-retry.ts` (~108 lines)

### Retry Configuration

| Setting | Default | Notes |
|---------|---------|-------|
| Max attempts | 3 | Configurable per call |
| Base delay | 1,000ms | Doubles each retry |
| Backoff | Exponential | 1s → 2s → 4s |
| Timeout | 15,000ms | Configurable per call |

### What Gets Retried

| Condition | Retried? | Reason |
|-----------|----------|--------|
| Network error | Yes | Transient |
| Timeout | Yes | Transient |
| HTTP 429 | Yes | "Try again later" — respects `Retry-After` header |
| HTTP 5xx | Yes | Server error, likely transient |
| HTTP 403 | No | Likely a real access denial |
| HTTP 404 | No | Resource genuinely not found |
| HTTP 401 | No | Requires authentication |

### Agent-Specific Retry Settings

| Agent | Calls Using Retry | Timeout | Max Attempts |
|-------|-------------------|---------|-------------|
| Data Agent — page fetch | `fetchPage()` | 15s | 3 |
| Data Agent — robots.txt | `checkRobotsTxt()` | 10s | 3 |
| Data Agent — sitemaps | Loop per URL | 10s | 3 |
| Data Agent — API probes | Per endpoint | 10s | 2 |
| Data Agent — ACP probes | Per path | 10s | 2 |
| Data Agent — commerce APIs | Per endpoint | 10s | 2 |
| Data Agent — UCP/llms.txt | Single call | 10s | 2 |
| Feed Agent — all fetches | `fetchFeed()` | 8-15s | 2 |
| Browser Agent | N/A | Uses Puppeteer timeouts | N/A |

Browser Agent does NOT use the retry utility. Puppeteer page navigation has its own timeout handling (30s). If `page.goto()` fails, the step is marked as failed and the scan continues to the next step. This is a known limitation — a transient network issue during navigation = failed step.

---

## 12. Known Limitations & Accuracy Gaps

### False Positives (Reports Failure When Site Is Fine)

| Issue | Cause | Severity | Status |
|-------|-------|----------|--------|
| JS-rendered schema marked "missing" | Data Agent raw HTTP fetch can't see client-side JSON-LD | High | **Partially mitigated** — schema source tracking added, Browser Agent passes rendered HTML |
| "Bot blocked" on slow responses | Content size < 25% of Chrome baseline triggers "degraded" | Medium | **Fixed** — threshold reduced from 50% to 25% |
| Add-to-cart "not found" on late-loading buttons | 2-second wait may not be enough for third-party widgets | Medium | Open |
| robots.txt wildcard rules misinterpreted | `User-agent: * / Disallow: /product-api` not checked for each agent | Medium | Open |

### False Negatives (Reports Success When Site Has Issues)

| Issue | Cause | Severity | Status |
|-------|-------|----------|--------|
| Silent cart failure | Button clicked without error, but backend transaction failed silently | High | **Partially mitigated** — cart scoring now reduces points for unverified clicks |
| Guest checkout with email verification | Agent sees form, awards points, but completing requires email click | Medium | Open |
| APIs returning 401 counted as "found" | Any JSON response was accepted regardless of status | Medium | **Fixed** — 401 responses now excluded |
| Stale schema prices | Schema has `price` field (passes) but value is cached/wrong | Low | Open |
| Invisible behavioral WAF | Modern WAFs silently rate-limit after N requests | Low | Open — fundamentally hard to detect |

### Structural Limitations

| Limitation | Impact | Notes |
|------------|--------|-------|
| CAPTCHA not handled | Sites with CAPTCHA = scan failure | `captchaDetected` flag exists but is never set to true |
| No login support | Can't test authenticated checkout flows | By design — AI agents also can't create accounts |
| Single browser session | No retry on Puppeteer page load failure | Retry utility only covers HTTP fetch, not browser navigation |
| Sequential agent execution | One slow agent blocks all subsequent agents | No parallel execution within a single brand scan |
| No real agent simulation | 10 agent scores are weighted projections | Only UA testing provides real per-agent data |
| Price accuracy unchecked | Schema `price` field checked for presence, not correctness | Feed Agent has `priceConsistency: "untested"` TODO |
| Screenshot storage growth | `cleanupOldScreenshots()` exists but is never called | Currently 535MB, growing without cleanup |

---

## 13. Recent Accuracy Fixes

These fixes were implemented on March 22, 2026:

| Fix | File | Before | After |
|-----|------|--------|-------|
| API 401 false positive | data-agent.ts | 401 + JSON content-type = "found" | 401 responses excluded from "found" |
| Checkout API 401 | data-agent.ts | `res.status === 401 && ct.includes("json")` counted | Only `res.ok` counts |
| Content-stripped threshold | data-agent.ts | < 50% of Chrome baseline = "degraded" | < 25% = "degraded" |
| Unfetchable sitemap | data-agent.ts | Declared but unfetchable = `found: true` | Now `found: false` |
| Cart score tiers | scoring-engine.ts | Verified and unverified both +35 | Verified +35, unverified +25, clicked-only +10 |
| Schema source tracking | data-agent.ts | No visibility into where schema came from | `source: "http" \| "rendered" \| "both" \| "none"` |
| Retry logic | fetch-with-retry.ts (new) | No retries — single timeout = failure | 3 attempts with exponential backoff |

---

## 14. Validation Strategy

### Current State
- **No real-world validation** has been performed against actual AI agent purchases
- **No human QA sampling** has been done
- `scripts/validate-scanner.ts` exists but only performs HTTP-level checks (robots.txt, schema presence, sitemap)
- Beta disclaimer banner has been added to all pages

### Planned Validation Program

1. **Select 10 brands** across categories (Shopify, custom, enterprise)
2. **Record ARC's prediction** for each: will an AI agent succeed at adding to cart? Checking out?
3. **Test with real agents** (ChatGPT Operator, Perplexity) — actually attempt purchases
4. **Compare predictions vs. actual results** — log in `validation_results` database table
5. **Calculate accuracy** — track match/mismatch rate, identify systematic biases
6. **Fix false positive/negative patterns** revealed by validation data

### Database Schema for Validation

```sql
validation_results (
  brand_id     → brands.id
  scan_id      → scans.id
  arc_score    INTEGER
  arc_prediction  TEXT ("success" | "partial" | "fail")
  actual_agent    TEXT ("chatgpt-operator", "perplexity-comet", etc.)
  actual_result   TEXT ("success" | "fail")
  failure_point   TEXT (where it broke: "checkout-email-verification", "cart-empty", etc.)
  match          TEXT ("match" | "mismatch")
  notes          TEXT
  tested_at      TEXT (timestamp)
)
```

---

## 15. Strategic Direction

### Current Positioning
ARC Report is an e-commerce monitoring tool that scores brands on AI agent readiness. Revenue comes from SaaS subscriptions (Monitor $99/mo, Team $299/mo).

### Core Strategy: Education-First, Accuracy-First
- Lead with verifiable, honest data
- Be transparent about confidence levels (robots.txt = high confidence, structured data = lower confidence)
- Build trust before revenue — the person who educates the market owns the market
- Validate scoring accuracy before scaling

### Market Context
- AI shopping traffic growing 4,700% YoY
- AI traffic converts 31% higher than non-branded organic
- 65% of brands doing nothing to prepare
- McKinsey projects $1-5 trillion in agentic commerce by 2030
- No dominant player in this space yet

### Competitive Edge
- Only tool that sends real agents to test the full transaction path
- 10 AI agent profiles with per-agent scoring
- Self-serve $79-$299/mo — serves the 95% of brands enterprise tools won't touch
- 276 brands already indexed

---

## 16. Infrastructure & Scale

| Metric | Current Value |
|--------|--------------|
| Brands in database | 276 |
| Brands fully scanned | 73 |
| Total scans | 291 |
| Database size | 12MB (SQLite) |
| Screenshot storage | 535MB |
| Time per full scan | ~2.5 minutes/brand |
| Daily scan time (73 brands) | ~3 hours sequential |
| Monthly infrastructure cost | ~$30 (Railway) |
| Monthly API cost | ~$50 (Anthropic Vision) |
| Scan concurrency | 3 (Docker Compose setting) |
| Database | SQLite (single-writer limit) |

### Scaling Bottlenecks
1. SQLite single-writer lock — concurrent scans queue writes
2. Puppeteer memory — ~300MB per browser instance
3. Railway 1GB RAM default — concurrency=3 risks OOM
4. No screenshot cleanup cron — storage grows indefinitely
5. Sequential agent execution within each brand scan

---

*ARC Report — arcreport.ai — March 2026*
*"The person who educates the market owns the market."*
