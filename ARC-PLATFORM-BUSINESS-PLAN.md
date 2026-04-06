# ARC Report — The Infrastructure Layer for Agentic Commerce

## A Business Plan for Becoming the Protocol, Index, and Certification Authority for AI Agent-to-Commerce Interactions

**March 2026**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem](#2-the-problem)
3. [The Vision: Three Layers](#3-the-vision-three-layers)
4. [Layer 1: The Standard](#4-layer-1-the-standard)
5. [Layer 2: The Index](#5-layer-2-the-index)
6. [Layer 3: The Dashboard & Certification](#6-layer-3-the-dashboard--certification)
7. [The Flywheel: How This Becomes Self-Reinforcing](#7-the-flywheel-how-this-becomes-self-reinforcing)
8. [Market Context](#8-market-context)
9. [Competitive Positioning](#9-competitive-positioning)
10. [Business Model & Revenue](#10-business-model--revenue)
11. [Technical Architecture](#11-technical-architecture)
12. [Go-to-Market Sequence](#12-go-to-market-sequence)
13. [Current State: What Exists Today](#13-current-state-what-exists-today)
14. [Risks & Mitigations](#14-risks--mitigations)
15. [Milestones & Timeline](#15-milestones--timeline)

---

## 1. Executive Summary

ARC Report is positioning to become the infrastructure layer that connects AI shopping agents with e-commerce sites.

Today, when an AI agent like ChatGPT Operator tries to buy a product from an e-commerce site, both sides are blind. The agent doesn't know if it will be blocked, whether there's guest checkout, or if there's a cart API it could use instead of clicking buttons. The site doesn't know agents are trying to buy from it, that it's accidentally blocking them, or what it should do to be ready.

There is no shared language between AI agents and e-commerce sites. No way for a site to declare "here's what agents can do here" and no way for an agent to check before it tries.

ARC solves this by building three layers:

1. **The Standard** — An open, machine-readable specification (`agent-commerce.json`) that allows any e-commerce site to declare its agent capabilities and any AI agent to read them. Think robots.txt, but for commerce.

2. **The Index** — A comprehensive, continuously-updated database of every major e-commerce site's agentic readiness, exposed via a free public API that agent companies can query before attempting purchases.

3. **The Dashboard & Certification** — A paid product for e-commerce brands to monitor, optimize, and certify their agent readiness. The business model.

The standard is free and open. The index API is free. The dashboard is paid. This structure ensures maximum adoption of the standard while monetizing the value it creates for brands.

The analogy is robots.txt: nobody owns robots.txt, but Google defined it, indexed it, and built the world's most valuable business on top of the ecosystem it enabled. ARC aims to do the same for the commerce layer of the agentic web.

---

## 2. The Problem

### 2.1 The Agent Side: Flying Blind

AI shopping agents are proliferating rapidly. ChatGPT Operator, Amazon Buy For Me, Perplexity Comet, Google AI Mode, Klarna AI, Claude Computer Use, and Microsoft Copilot Shopping all attempt to navigate e-commerce sites and complete purchases on behalf of consumers.

Each of these agents faces the same fundamental problem: **they don't know what they're walking into.**

When ChatGPT Operator is asked to buy running shoes from nike.com, it has no way to know in advance:

- Will Nike's WAF (Web Application Firewall) block the Operator's browser?
- Does Nike's robots.txt block GPTBot?
- Is there guest checkout, or will the agent hit a login wall it can't pass?
- Is there a cart API (Shopify cart.js, GraphQL mutations, Stripe ACP) the agent could call directly instead of clicking buttons?
- Where is the add-to-cart button? Is it behind a variant selector? Behind a cookie consent modal?
- Is structured product data available (Schema.org, JSON-LD, Open Graph), or does the agent need to visually parse the page?
- What's the checkout flow? Single-page? Multi-step? Email verification required?

Right now, every agent answers these questions by trial and error — brute-forcing its way through the site and hoping for the best. This leads to high failure rates, poor user experience, and wasted compute.

Agent companies have no centralized source of truth about which sites their agents can actually transact on.

### 2.2 The Site Side: Equally Blind

E-commerce brands face the mirror image of this problem. They have no visibility into:

- Whether AI agents are currently trying to buy from their site
- Whether their robots.txt is accidentally blocking agents they want to allow
- Whether their cookie consent popup is preventing agents from ever seeing a product page
- Whether their checkout flow is compatible with automated purchasing
- What structured data agents expect and whether they're providing it
- Which of the 6+ emerging protocols (ACP, UCP, AP2, A2A, MCP, Visa TAP) they should support
- How they compare to competitors in agent readiness

Most brands don't even know this is a category they should be thinking about. The 65% of brands doing nothing to prepare aren't negligent — they simply have no tools or standards to engage with.

### 2.3 The Missing Layer

The web already has standard ways for sites to communicate with automated systems:

- **robots.txt** tells crawlers what they can access
- **sitemap.xml** tells search engines what content exists
- **Schema.org markup** tells search engines what the content means
- **SSL certificates** tell browsers the connection is secure
- **Content-Security-Policy headers** tell browsers what scripts can run

There is no equivalent for commerce capabilities. No standard way for a site to say:

- "AI agents can browse freely, add to cart via our API, and check out as guests"
- "We support Stripe ACP — here's the endpoint"
- "GPTBot is allowed but ClaudeBot is blocked"
- "Guest checkout is available but requires email verification"

This missing layer is the opportunity.

### 2.4 Why This Can't Be Solved by Either Side Alone

**Agent companies can't solve this** because each agent company only has data about its own interactions. OpenAI knows which sites ChatGPT Operator fails on, but they don't share this data with Perplexity, and neither shares with Amazon. There's no incentive for any single agent company to build a comprehensive, shared capability index.

**E-commerce platforms can't solve this** because they only control their own merchants. Shopify can build "Agentic Storefronts" for Shopify sites, but they have no leverage over sites built on Salesforce Commerce, SAP, WooCommerce, Magento, or custom stacks. And even Shopify's solution only works with agents that integrate Shopify's specific protocol.

**The solution requires a neutral third party** that has relationships with both sides, doesn't compete with either, and has an incentive to maximize interoperability rather than lock-in.

---

## 3. The Vision: Three Layers

ARC Report becomes three distinct but interconnected products, built in sequence:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   LAYER 3: Dashboard & Certification (PAID)                │
│   Brand monitoring, optimization, certification badge       │
│   Revenue model: SaaS subscriptions                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   LAYER 2: The Index (FREE API)                            │
│   Real-time capability database for 1,000+ brands          │
│   Agent companies query before purchase attempts            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   LAYER 1: The Standard (OPEN)                             │
│   agent-commerce.json specification                         │
│   Any site can publish. Any agent can read.                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Each layer depends on the one below it. The standard enables the index. The index creates demand for the dashboard. The dashboard funds the operation.

---

## 4. Layer 1: The Standard

### 4.1 What It Is

A machine-readable JSON file that any e-commerce site can publish at a well-known URL:

```
https://example.com/.well-known/agent-commerce.json
```

This file declares the site's capabilities, policies, and integration points for AI shopping agents. It's the site's way of saying: "Here's what agents can do here, and here's how."

### 4.2 Why It Needs to Exist

Today, AI agents discover site capabilities through trial and error:

1. Try to load the page → did it work, or was I blocked?
2. Try to find the product → is there structured data, or do I need to visually parse?
3. Try to add to cart → is there a button? An API? Did it work?
4. Try to check out → is there guest checkout? Login wall? Email verification?

This is wasteful. Every failed attempt costs compute, time, and user experience. A declarative file lets agents skip the trial-and-error and go directly to the optimal path.

The precedent is clear: robots.txt eliminated the chaos of unregulated crawling by giving sites a way to declare their crawling policies. `agent-commerce.json` does the same for commerce interactions.

### 4.3 Specification (v0.1 Draft)

```json
{
  "$schema": "https://arcreport.ai/schemas/agent-commerce/v0.1.json",
  "version": "0.1",
  "lastUpdated": "2026-03-22T00:00:00Z",

  "identity": {
    "name": "Example Store",
    "url": "https://example.com",
    "platform": "shopify",
    "category": "apparel"
  },

  "access": {
    "policy": "open",
    "allowedAgents": ["*"],
    "blockedAgents": [],
    "robotsTxtUrl": "https://example.com/robots.txt",
    "notes": "All AI agents welcome. Rate limit: 60 requests/minute."
  },

  "capabilities": {
    "browse": true,
    "search": true,
    "addToCart": true,
    "checkout": true,
    "guestCheckout": true,
    "accountRequired": false,
    "emailVerification": false,
    "returns": false,
    "orderTracking": false,
    "wishlist": false
  },

  "checkout": {
    "type": "guest",
    "flow": "single-page",
    "methods": ["credit-card", "paypal", "apple-pay", "google-pay"],
    "currenciesSupported": ["USD", "EUR", "GBP"],
    "taxCalculation": "at-checkout",
    "shippingEstimate": "at-checkout",
    "notes": "Guest checkout available. No account creation required."
  },

  "protocols": {
    "acp": {
      "supported": true,
      "endpoint": "https://example.com/acp/checkout_sessions",
      "version": "1.0"
    },
    "ucp": {
      "supported": false
    },
    "shopifyStorefrontApi": {
      "supported": true,
      "endpoint": "https://example.myshopify.com/api/2024-01/graphql.json"
    },
    "cartApi": {
      "supported": true,
      "endpoint": "https://example.com/cart.js",
      "type": "shopify"
    },
    "graphql": {
      "supported": true,
      "endpoint": "https://example.com/graphql"
    }
  },

  "data": {
    "structuredData": {
      "schemaOrg": true,
      "jsonLd": true,
      "openGraph": true,
      "microdata": false
    },
    "feeds": {
      "googleMerchant": "https://example.com/feeds/google-shopping.xml",
      "shopifyProducts": "https://example.com/products.json",
      "facebookCatalog": null,
      "rss": null
    },
    "sitemap": "https://example.com/sitemap.xml",
    "productCount": 1247,
    "llmsTxt": "https://example.com/llms.txt"
  },

  "contact": {
    "agentSupport": "agent-support@example.com",
    "documentation": "https://example.com/docs/ai-agents"
  },

  "verification": {
    "arcCertified": true,
    "certificationDate": "2026-03-15",
    "certificationLevel": "verified",
    "reportUrl": "https://arcreport.ai/brand/example-store"
  }
}
```

### 4.4 Design Principles

**Simple to publish.** A site should be able to create a valid `agent-commerce.json` in under 5 minutes. The minimum viable file is:

```json
{
  "version": "0.1",
  "capabilities": {
    "browse": true,
    "addToCart": true,
    "checkout": true,
    "guestCheckout": true
  }
}
```

Everything else is optional. This mirrors the design philosophy of robots.txt — a two-line file is valid and useful.

**Machine-readable, human-understandable.** JSON was chosen over XML or YAML because it's the native data format for AI agents and APIs. But the field names are self-documenting — a human reading the file should understand it without documentation.

**Declarative, not prescriptive.** The file declares what IS, not what SHOULD BE. It's the site's self-assessment of its own capabilities. ARC's index may disagree (based on actual testing), and that tension is a feature — it incentivizes sites to keep their declaration accurate.

**Extensible.** The `$schema` versioning allows new fields to be added without breaking existing parsers. Agent companies can ignore fields they don't understand.

**Open.** The specification is published under a permissive license. Any agent, any site, any tool can implement it. ARC stewards the spec but does not own it. The value to ARC comes not from controlling the standard but from being the most trusted implementation of it.

### 4.5 How Sites Publish It

ARC provides tooling to generate the file:

1. **Auto-generation from scan data.** ARC already scans 276 brands. For each brand, ARC can generate a draft `agent-commerce.json` based on what the scanner found — robots.txt policies, detected APIs, checkout flow, structured data presence. The brand reviews and publishes it.

2. **Shopify app / WordPress plugin.** One-click installation that reads the site's configuration and generates the file automatically. Updates when the site changes.

3. **Manual creation.** A web form at arcreport.ai where brands answer 10 questions and get a downloadable JSON file.

4. **CLI tool.** `npx arc-commerce-init` scans a URL and generates the file.

### 4.6 How Agents Consume It

Agent companies integrate a simple check into their purchase flow:

```
1. User asks agent to buy from example.com
2. Agent fetches example.com/.well-known/agent-commerce.json
3. If file exists:
   - Check access.policy — am I allowed?
   - Check capabilities — can I checkout? Guest checkout?
   - Check protocols — is there an API I should use instead of browser automation?
   - Proceed with the optimal path
4. If file doesn't exist:
   - Fall back to ARC Index API (see Layer 2)
   - Or fall back to trial-and-error (current behavior)
```

The file acts as a shortcut. Instead of brute-forcing every interaction, agents read the file and make informed decisions in milliseconds.

### 4.7 Adoption Strategy

robots.txt succeeded not because someone mandated it, but because Google respected it. If Google ignores your robots.txt, you have a problem. That created universal adoption without any enforcement mechanism.

`agent-commerce.json` follows the same playbook:

1. ARC publishes the spec and generates draft files for 276 brands
2. ARC reaches out to 3-5 agent companies (OpenAI, Perplexity, Anthropic, Microsoft, Klarna) with a pitch: "We've created a standard that tells your agents what sites can do before they try. Here's the spec. Here are 276 pre-populated files. Want to try reading them?"
3. If even ONE major agent company starts checking for `agent-commerce.json`, every e-commerce site has an incentive to publish one — because the agents their customers use are making decisions based on it.
4. The standard grows from adoption, not mandate.

### 4.8 Relationship to Existing Protocols

`agent-commerce.json` does NOT compete with ACP, UCP, or other commerce protocols. It **complements** them by serving as a discovery layer:

- **ACP** (OpenAI + Stripe) defines how checkout happens. `agent-commerce.json` tells agents that ACP is available and where the endpoint is.
- **UCP** (Google + Shopify + Walmart) defines commerce operations. `agent-commerce.json` tells agents that UCP is supported.
- **robots.txt** defines crawling policies. `agent-commerce.json` extends this to commerce-specific capabilities.

The analogy: robots.txt doesn't define how crawling works (that's HTTP). It declares what's allowed. `agent-commerce.json` doesn't define how commerce works (that's ACP/UCP). It declares what's available.

---

## 5. Layer 2: The Index

### 5.1 What It Is

A continuously-updated database of agentic commerce capabilities for every major e-commerce site, exposed via a free, public REST API.

The index answers the question: **"What can AI agents do on this site right now?"**

### 5.2 Why It Needs to Exist

The standard (Layer 1) is declarative — it's what sites say about themselves. The index is empirical — it's what ARC has actually tested and verified.

Not all sites will publish `agent-commerce.json`, especially early on. But agent companies still need to know which sites their agents can work with. The index fills the gap by providing tested, verified capability data for sites that haven't published a declaration.

Even for sites that HAVE published a declaration, the index provides an independent verification layer. If a site claims guest checkout is available but ARC's scanner found that checkout requires email verification, the index flags the discrepancy.

### 5.3 What the Index Contains

For each of the 1,000+ brands in ARC's database:

```json
{
  "brand": "nike",
  "url": "https://nike.com",
  "lastScanned": "2026-03-22T02:00:00Z",
  "overallReadiness": 67,

  "access": {
    "gptbot": "blocked",
    "chatgpt-user": "allowed",
    "claudebot": "blocked",
    "perplexitybot": "allowed",
    "google-extended": "allowed",
    "amazonbot": "allowed"
  },

  "capabilities": {
    "browse": { "status": "pass", "confidence": "high" },
    "structuredData": { "status": "pass", "confidence": "high", "source": "both" },
    "addToCart": { "status": "partial", "confidence": "medium", "note": "Button clicked but cart not verified" },
    "guestCheckout": { "status": "pass", "confidence": "high" },
    "feeds": { "status": "fail", "confidence": "high", "note": "No product feeds detected" }
  },

  "protocols": {
    "acp": false,
    "ucp": false,
    "shopifyApi": false,
    "cartApi": false,
    "graphql": true
  },

  "declaration": {
    "hasAgentCommerceJson": false,
    "discrepancies": []
  },

  "certification": {
    "certified": false,
    "level": null
  }
}
```

### 5.4 The API

The API is free, unauthenticated for basic lookups, and rate-limited to prevent abuse:

```
GET https://api.arcreport.ai/v1/brands/{slug}
GET https://api.arcreport.ai/v1/brands/{slug}/access
GET https://api.arcreport.ai/v1/brands/{slug}/capabilities
GET https://api.arcreport.ai/v1/lookup?url=https://nike.com
GET https://api.arcreport.ai/v1/search?capability=guest-checkout&category=apparel
```

**Free tier:** 1,000 requests/day, basic capability data.
**Agent tier:** Unlimited requests, real-time data, webhook notifications when site capabilities change. Free for verified agent companies.
**Commercial tier:** Bulk access, historical data, custom integrations. Paid.

### 5.5 Why the API Is Free

The index API is free for the same reason Google Search is free: the value isn't in the query, it's in the ecosystem the queries create.

Every time an agent queries the ARC API, three things happen:

1. ARC learns which sites agents are trying to buy from (demand signal)
2. ARC can prioritize scanning those sites (better data)
3. The site's ARC profile becomes more important to the brand (monetization opportunity)

If ARC charged agents for API access, adoption would be slow and data would be thin. If the API is free, every agent in the world has an incentive to check it, and the data flywheel spins faster.

### 5.6 Data Quality and Freshness

The index is only valuable if the data is accurate and current. ARC maintains data quality through:

- **Daily scans** of all active brands (robots.txt, UA access, API endpoints)
- **Weekly deep scans** (browser agent, visual agent, feed agent)
- **Real-time updates** when a site publishes or updates its `agent-commerce.json`
- **Confidence levels** on every data point (high, medium, low) based on verification method
- **Discrepancy flags** when scan results disagree with a site's self-declaration
- **Validation program** (see Section 13) where ARC validates scanner predictions against real agent purchases

### 5.7 What ARC Learns from API Traffic

The API isn't just a data service — it's a sensor. By observing which brands agents query most, ARC gains insight into:

- Which e-commerce sites are most targeted by AI agents (demand ranking)
- Which agent capabilities are most frequently checked (feature prioritization)
- Which failures are most common across the ecosystem (industry intelligence)
- Emerging trends in agent-commerce interaction patterns

This data becomes the foundation for ARC's industry reports, brand benchmarks, and the comprehensive guide to agentic commerce — all of which reinforce ARC's authority as the definitive source on this topic.

---

## 6. Layer 3: The Dashboard & Certification

### 6.1 What It Is

A SaaS product for e-commerce brands to monitor, optimize, and certify their agentic commerce readiness. This is where ARC makes money.

### 6.2 Dashboard Features

**For all brands (free tier):**
- Public ARC readiness score and report page
- Basic capability summary (what agents can/can't do)
- High-level comparison to category average

**For paying brands (Monitor tier — $99/mo):**
- Detailed scan results with per-agent breakdowns (10 AI agent compatibility scores)
- Historical trend charts (is readiness improving or declining?)
- Actionable fix recommendations prioritized by impact
- Real-time alerts when scan results change (Slack, email)
- Agent traffic insights: which agents are querying your ARC profile
- `agent-commerce.json` generator and validator
- Weekly scan cadence with visual and feed agents

**For teams and agencies (Team tier — $299/mo):**
- Everything in Monitor
- Multi-brand management (scan and compare up to 20 brands)
- Competitive benchmarking (compare against specific competitors)
- API access for custom integrations
- White-label reports (PDF export for board presentations)
- Priority support

**For enterprises (Enterprise tier — $2,000+/mo):**
- Everything in Team
- Unlimited brands
- Custom scanning cadence
- Dedicated account manager
- Custom agent testing (test with specific product URLs)
- SLA guarantees
- SSO and team management

### 6.3 Certification Program

Certification is the "HTTPS padlock" for agentic commerce. It's a verifiable signal that a brand has been tested and meets a defined standard of agent readiness.

**Certification Levels:**

| Level | Requirement | What It Means | Badge |
|-------|-------------|---------------|-------|
| **Verified** | ARC score >= 50, no critical failures, `agent-commerce.json` published | "This site has been tested. Basic agent interactions work." | Silver badge |
| **Certified** | ARC score >= 70, guest checkout works, no agent UA blocks, at least one protocol supported (ACP/UCP/API) | "AI agents can reliably browse and buy from this site." | Gold badge |
| **Certified+** | ARC score >= 85, validated against real agent purchases, full protocol support, complete structured data | "This site is optimized for agentic commerce." | Platinum badge |

**Certification Process:**
1. Brand signs up for Monitor tier (or higher)
2. ARC runs a full scan (all 5 agents + 10 AI agent profiles)
3. If the brand meets certification requirements, ARC issues the certificate
4. Brand receives an embeddable badge (HTML snippet) and a certificate URL
5. Re-certification is automatic — ARC re-scans regularly. If the site drops below thresholds, certification is paused and the brand is notified.

**The Badge:**
A small, embeddable badge similar to SSL seals or Trustpilot ratings:

```
┌──────────────────────────┐
│  ✓ ARC Certified         │
│  Agent Ready             │
│  arcreport.ai/verified   │
└──────────────────────────┘
```

The badge links to the brand's public ARC report page, which shows the detailed breakdown.

**Why Brands Want Certification:**

1. **Trust signal for consumers.** As AI shopping becomes mainstream, consumers will care whether the site they're being sent to by their AI agent actually works with that agent. The ARC badge provides that assurance.

2. **Competitive differentiation.** In a world where 65% of brands aren't ready for AI agents, being certified is a meaningful advantage.

3. **Agent discovery.** If agent companies check for ARC certification (via the standard or the API), certified brands get preferential treatment — agents are more likely to route purchases to sites they know will work.

4. **PR and marketing value.** "We're ARC Certified for AI agent commerce" is a press-worthy statement in 2026.

### 6.4 Certification Revenue Model

Certification is included in all paid tiers (Monitor, Team, Enterprise). It's not a separate charge. This is intentional: the goal is to maximize the number of certified sites, which makes the certification more valuable, which makes more brands want it.

The revenue comes from the monitoring and optimization tools, not the badge itself.

---

## 7. The Flywheel: How This Becomes Self-Reinforcing

The three layers create a flywheel that becomes harder to replicate the longer it runs:

```
                    ┌─────────────────────┐
                    │  ARC publishes the   │
                    │  agent-commerce.json │
                    │  standard            │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Agent companies     │
                    │  start checking the  │
                    │  standard + ARC API  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Brands realize      │
                    │  agents are making   │
                    │  decisions based on  │
                    │  ARC data            │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Brands publish      │
                    │  agent-commerce.json │
                    │  + sign up for ARC   │
                    │  Dashboard           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  More data → better  │
                    │  index → more agents │
                    │  use ARC → more      │
                    │  brands care         │
                    └──────────┬──────────┘
                               │
                               └──────► (cycle repeats)
```

**The critical insight:** At no point does either side need to be "sold" on ARC. Agent companies use the free API because it makes their agents work better. Brands publish the standard because agents are checking it. Each side pulls the other in.

This is the NVIDIA/CUDA dynamic. NVIDIA didn't convince enterprises to buy GPUs. They convinced researchers to use CUDA (free), which created demand for GPUs (paid). ARC doesn't need to convince brands to pay for dashboards. It needs to get agents to use the API (free), which creates demand for dashboards (paid).

**Why the flywheel is defensible:**

1. **Network effects.** The more brands in the index, the more useful it is to agents. The more agents querying the index, the more brands care about their profile. A competitor starting from zero can't replicate the network.

2. **Data moat.** Every scan, every API query, every certification adds to ARC's understanding of the agentic commerce landscape. Over time, ARC's data becomes the most comprehensive, most current, and most trusted source.

3. **Standard lock-in.** If `agent-commerce.json` becomes widely adopted, switching costs are high — not for any individual site (the file is simple), but for the ecosystem. Agents are built to read the ARC standard. Sites are publishing in the ARC format. A competitor would need to convince both sides to adopt a different format simultaneously.

4. **Authority compounding.** ARC's guide, reports, and certification become the reference points for the industry. Authority compounds: the more people cite ARC as the source, the harder it is for a newcomer to be taken seriously.

---

## 8. Market Context

### 8.1 Market Size and Timing

| Metric | Data Point | Source |
|--------|-----------|--------|
| ChatGPT shopping queries | 84M/week from US consumers | Stackline |
| AI traffic conversion advantage | 31% higher than non-branded organic | Search Engine Land |
| AI's current share of total traffic | ~1% (growing 4,700% YoY) | Search Engine Land |
| Cyber Week 2025 orders involving AI | 1 in 5 (~$70B GMV) | Digital Commerce 360 |
| Projected agentic commerce by 2030 | $1-5 trillion globally | McKinsey |
| Consumers who've used GenAI to shop | 61% | Capital One Shopping |
| Brands doing nothing to prepare | 65% | Industry surveys |

The market is at an inflection point. AI shopping is growing exponentially but is still <1% of total traffic. The infrastructure layer needs to be built NOW — before the market consolidates around whoever defines the standard.

### 8.2 The Protocol Landscape

Six major protocols are competing/complementing each other:

| Protocol | Backers | Purpose |
|----------|---------|---------|
| **ACP** (Agentic Commerce Protocol) | OpenAI + Stripe | Product discovery + checkout |
| **UCP** (Universal Commerce Protocol) | Shopify + Google + Walmart + Target + Visa + Mastercard | REST/JSON-RPC commerce operations |
| **AP2** (Agent Payments Protocol) | Google | Agent payment flows |
| **A2A** (Agent-to-Agent) | Google | Agent-to-agent communication |
| **MCP** (Model Context Protocol) | Anthropic | Connecting AI models to tools/data |
| **Visa TAP** | Visa | Payment tokenization for agents |

This fragmentation is ARC's opportunity. No single protocol will win. Sites need to support multiple protocols. Agents need to know which protocols each site supports. `agent-commerce.json` is the discovery layer that sits above all of them.

### 8.3 Why Now

Three converging factors make this the right time:

1. **Agent companies are scaling commerce features.** ChatGPT Shopping, Google AI Mode, Perplexity Shopping, and Amazon Buy For Me all launched or expanded in the past 6 months. They need better site intelligence.

2. **Brands are starting to pay attention.** HBR's March 2026 cover story was "Preparing Your Brand for Agentic AI." Shopify launched Agentic Storefronts. The conversation has moved from "is this real?" to "what do we do?"

3. **No standard exists yet.** The window to define the standard is open. Once a major player defines it (Google, Shopify, or a coalition), the opportunity closes. First-mover advantage is real in standards.

---

## 9. Competitive Positioning

### 9.1 Direct Competitors

| Competitor | What They Do | Why ARC Wins |
|-----------|-------------|--------------|
| Aido Lighthouse | 110+ check readiness score | Report only — no standard, no API, no agent integration |
| Agentic Storefront (ForkPoint) | 70-point audit, consulting | Services business, not a platform. Lead-gen tool for agency |
| UCP.tools | UCP protocol checker | Narrowly focused on one protocol. Doesn't cover broader readiness |
| WordLift AI Audit | Machine readability score | SEO tool with AI features bolted on. Not commerce-specific |

**None of these are building infrastructure.** They're building reports. A report tells you what's wrong. Infrastructure makes things work.

### 9.2 Adjacent Players

| Company | Risk to ARC | ARC's Response |
|---------|------------|----------------|
| DataFeedWatch, GoDataFeed, Channable | Could add readiness scoring | They optimize feeds. ARC tests the full transaction. Different layer. |
| Salsify, Syndigo, Profitero | Enterprise platforms could add this | $50K+/yr, sales-led, 6-month onboard. ARC serves the 95% they'll never touch. |
| Screaming Frog, Sitebulb, Lumar | SEO crawlers could add agent checks | Crawl tools, not monitoring products. No agent intelligence or protocol support. |

### 9.3 Infrastructure Players (Not Competitors — Potential Partners)

| Company | What They Do | Relationship to ARC |
|---------|-------------|---------------------|
| Stripe | ACP protocol, payment infrastructure | ARC's standard references ACP endpoints. Stripe benefits from more sites being ACP-ready. |
| Shopify | UCP, Agentic Storefronts | ARC can generate `agent-commerce.json` for Shopify sites automatically. Shopify benefits from ARC certification driving trust. |
| Rye | Universal agentic checkout | Rye could use ARC's API to pre-screen sites. |
| Firmly.ai | Powers Perplexity's checkout | Same as Rye. |

### 9.4 ARC's Unique Position

ARC is the only player that:

1. Sends real agents to test the full transaction path (browser, data, accessibility, visual, feed)
2. Tests against 10 specific AI agent profiles with agent-specific scoring
3. Proposes an open standard for site-to-agent communication
4. Provides a free API for agent companies to query
5. Is neutral — doesn't compete with agent companies or e-commerce platforms
6. Occupies the $79-$299/mo self-serve price point that enterprise tools ignore

---

## 10. Business Model & Revenue

### 10.1 Revenue Streams

| Stream | Price | Target | Revenue Timing |
|--------|-------|--------|----------------|
| **Monitor** | $99/mo | $10M-$50M DTC brands | Now |
| **Team** | $299/mo | Multi-brand operators, agencies | Now |
| **Enterprise** | $2,000+/mo | $100M+ brands | 6-12 months |
| **Certification Badge** | Included in paid tiers | All paid customers | Now |
| **Data Licensing** | Custom pricing | Industry analysts, market researchers | 12+ months |
| **Agent API (Commercial)** | Usage-based | High-volume API consumers | 12+ months |

### 10.2 Path to $30K MRR

| Tier | Price | Customers Needed | MRR |
|------|-------|-----------------|-----|
| Monitor | $99/mo | 120 | $11,880 |
| Team | $299/mo | 40 | $11,960 |
| Enterprise | $2,000/mo | 3 | $6,000 |
| **Total** | | **163** | **$29,840** |

### 10.3 Unit Economics

| Metric | Value | Notes |
|--------|-------|-------|
| Infrastructure cost per brand | ~$2/mo | Railway + API costs for daily scans |
| Anthropic API cost per brand | ~$0.50/scan | Visual agent (weekly) |
| Gross margin | ~90%+ | SaaS with minimal marginal cost |
| Stripe processing | 2.9% + $0.30 | ~$920/mo at $30K MRR |
| Target take-home | $15-20K/mo | At $30K MRR |

### 10.4 How the Platform Model Changes Revenue

The platform model (standard + index + dashboard) changes the revenue trajectory in two ways:

1. **Increases the ceiling.** A scoring tool has a natural limit — you're selling reports. A platform has network effects and compounds. Data licensing, enterprise API access, and certification programs create revenue streams that don't exist for a pure SaaS tool.

2. **Creates defensibility.** A competitor can build a better report. A competitor can't easily replicate a network of agent companies querying your API and thousands of sites publishing your standard.

---

## 11. Technical Architecture

### 11.1 Current Stack

| Component | Technology | Status |
|-----------|-----------|--------|
| Framework | Next.js 16 | Live |
| Database | SQLite (better-sqlite3) via Drizzle ORM | Live |
| Browser Automation | Puppeteer + Stealth Plugin | Live |
| Vision AI | Anthropic Claude Sonnet | Live |
| Hosting | Railway (Singapore region) | Live |
| Containerization | Docker (Node 20 + Chromium) | Live |

### 11.2 Scanner Architecture (5 Agents)

```
Scan Orchestrator
  ├── Browser Agent (Puppeteer)
  │     └── 8-step journey: homepage → product → cart → checkout
  │     └── Screenshots at each step
  │     └── Rendered HTML passed to Data Agent
  │
  ├── Data Agent (HTTP fetch)
  │     └── robots.txt, JSON-LD, Schema.org, Open Graph
  │     └── API endpoint probing (cart, checkout, GraphQL, ACP, UCP)
  │     └── Per-agent UA testing (8 user-agent strings × 2 pages)
  │     └── Schema source tracking (http / rendered / both / none)
  │
  ├── Accessibility Agent (Puppeteer a11y tree)
  │     └── Landmarks, headings, ARIA labels, keyboard focus
  │
  ├── Visual Agent (Claude Vision API)
  │     └── Homepage clarity, product page analysis, CTA identification
  │     └── Mobile viewport test
  │
  └── Feed Agent (HTTP fetch + XML/JSON parsing)
        └── Google Merchant, Shopify JSON, RSS/Atom, Facebook catalog
        └── Feed quality scoring (0-100)
```

### 11.3 Scoring Engine

7 categories, weighted average:

| Category | Weight | What It Measures |
|----------|--------|-----------------|
| Discoverability | 15% | Can agents find products from the homepage? |
| Product Understanding | 20% | Is product data structured and complete? |
| Navigation & Interaction | 20% | Can agents interact with UI elements? |
| Cart & Checkout | 25% | Can agents complete a purchase? |
| Performance & Resilience | 5% | Is the site fast and not blocking bots? |
| Data Standards & Feeds | 5% | Are feeds and structured data available? |
| Agentic Commerce | 10% | Are commerce protocols (ACP, UCP) supported? |

10 AI agent profiles apply different weights to these categories to produce per-agent compatibility scores.

### 11.4 Platform Additions Required

| Component | Purpose | Effort |
|-----------|---------|--------|
| Public REST API | Expose index data for agent companies | Medium — API routes on existing Next.js app |
| `agent-commerce.json` validator | Validate and score published declarations | Small — JSON schema validation |
| `agent-commerce.json` generator | Auto-generate from scan data | Small — template from existing data |
| Certification engine | Evaluate brands against certification criteria | Small — threshold checks on existing scores |
| Badge embed system | Generate embeddable HTML/SVG badges | Small |
| Webhook system | Notify agent companies of capability changes | Medium |
| PostgreSQL migration | Replace SQLite for concurrent API access | Medium — required before scaling API |
| API key management | Rate limiting, usage tracking for API consumers | Medium |

### 11.5 Infrastructure Scaling Path

| Phase | Scale | Infrastructure |
|-------|-------|---------------|
| Current | 276 brands, no API traffic | SQLite, Railway, $30/mo |
| Phase 1 | 1,000 brands, <1K API requests/day | SQLite → PostgreSQL, Railway, $50/mo |
| Phase 2 | 5,000 brands, 10K API requests/day | PostgreSQL, Redis cache, Railway Pro, $200/mo |
| Phase 3 | 10,000+ brands, 100K+ API requests/day | Managed PostgreSQL, CDN for API, dedicated compute, $500-1,000/mo |

The infrastructure costs remain low relative to revenue at every stage.

---

## 12. Go-to-Market Sequence

### Phase 1: Foundation (Now — Month 2)

**Objective:** Get the data right and publish the standard.

1. **Validate scoring accuracy.** Manually test 10 brands against real AI agent purchases (ChatGPT Operator, Perplexity). Track predictions vs. actual results in the `validation_results` database table. Fix false positives and false negatives identified in the technical audit.

2. **Publish the beta disclaimer.** Already implemented — mustard yellow banner on all pages. Sets expectations honestly while ARC validates.

3. **Draft and publish the `agent-commerce.json` spec.** Post v0.1 on arcreport.ai/standard. Write an explanatory blog post. Generate draft files for all 276 brands in the database.

4. **Add retry logic and schema source tracking to scanner.** Already implemented — improves data accuracy.

5. **Build the public API.** Basic REST endpoints exposing brand readiness data from the existing database. No auth required for basic lookups. Launch at api.arcreport.ai.

### Phase 2: Agent Outreach (Month 2 — Month 4)

**Objective:** Get at least one agent company to query the ARC API.

6. **Cold outreach to agent companies.** Target developer relations teams at OpenAI (Operator), Perplexity (Comet/Shopping), Anthropic (Computer Use), Microsoft (Copilot Shopping), and Klarna. Pitch: "We have readiness data on 276 e-commerce brands and a proposed standard for site-agent communication. Free API. Want early access?"

7. **Publish the comprehensive guide.** The guide to agentic commerce (already at /guide) becomes the definitive educational resource. Link to the standard. Position ARC as the authority.

8. **Content strategy.** Weekly data-driven posts on LinkedIn and X: "This week we scanned 50 Shopify brands. 73% block GPTBot. Here's the data." Build authority through transparency.

9. **Expand the index to 1,000 brands.** Prioritize brands that agent companies are likely to target — top DTC brands, major retailers, Shopify Plus merchants.

### Phase 3: Brand Acquisition (Month 4 — Month 8)

**Objective:** Convert brand awareness into paying customers.

10. **Outreach to brands.** "AI agents are checking your ARC profile before trying to buy from your site. Here's what they see. Want to improve it?" The free report is the top of funnel. The dashboard is the conversion.

11. **Launch certification.** Verified and Certified levels. Generate badges. First 50 certified brands get free certification for 6 months (builds the certified network).

12. **Agency partnerships.** E-commerce agencies (Charle, Presta, and others building "agentic readiness audits") become resellers and implementation partners. They use ARC's data to diagnose; they charge for the fix.

13. **Shopify app.** One-click `agent-commerce.json` generation for Shopify stores. App Store distribution for brand awareness.

### Phase 4: Platform (Month 8+)

**Objective:** Transition from tool to infrastructure.

14. **Data licensing.** Sell aggregate data to industry analysts, market researchers, consulting firms.

15. **Enterprise tier.** Direct sales to $100M+ brands with custom integrations, SLAs, and dedicated support.

16. **Standard governance.** As adoption grows, formalize the `agent-commerce.json` standard with input from agent companies, e-commerce platforms, and brands. Consider submitting to a standards body.

17. **International expansion.** Expand the index to EU, UK, and APAC e-commerce brands.

---

## 13. Current State: What Exists Today

### 13.1 What's Built

| Component | Status | Notes |
|-----------|--------|-------|
| 5-agent scanner (Browser, Data, Accessibility, Visual, Feed) | Live | Puppeteer, Claude Vision, HTTP probing |
| 10 AI agent scoring profiles | Live | Weighted scoring with UA penalty |
| 7-category scoring engine | Live | 0-100 with A-F grades |
| 276 brands in database | Live | 73 fully scanned |
| Brand report pages | Live | Per-brand detail with journey visualization |
| AI Agent Access Matrix | Live | 276 brands × 12 AI agents |
| Comprehensive guide to agentic commerce | Live | 5 chapters |
| Homepage with instant checker | Live | robots.txt + lightweight structured data |
| Admin dashboard | Live | Content queue, outreach, news monitoring |
| Stripe payments (Monitor/Team tiers) | Live | Subscription billing |
| Retry logic (scanner) | Implemented | Shared utility with exponential backoff |
| Schema source tracking | Implemented | http / rendered / both / none |
| Beta disclaimer banner | Implemented | Mustard yellow, all pages |
| Validation results table | Implemented | DB schema ready for prediction tracking |

### 13.2 What's Not Built Yet

| Component | Priority | Effort |
|-----------|----------|--------|
| `agent-commerce.json` spec document | High | 1 week |
| Public REST API | High | 2 weeks |
| `agent-commerce.json` generator from scan data | High | 1 week |
| Certification engine and badge system | Medium | 2 weeks |
| Agent company outreach materials | Medium | 1 week |
| PostgreSQL migration | Medium | 1-2 weeks |
| Shopify app | Low | 3-4 weeks |
| Data licensing infrastructure | Low | Future |

### 13.3 Known Technical Risks

From the technical audit conducted March 21, 2026:

| Risk | Severity | Mitigation |
|------|----------|------------|
| Silent cart failures (button clicked, cart empty) | High | Improve cart verification; add API-level cart checks |
| JS-rendered schema missed without browser context | High | Schema source tracking implemented; log when source = "rendered" |
| WAF false positives (slow response = "blocked") | Medium | Retry logic implemented; refine content-size thresholds |
| APIs returning 401 marked as "found" | Medium | Check status code — 401 should not count as "found" |
| SQLite single-writer limit under concurrent API load | Medium | PostgreSQL migration before API launch |
| Screenshot storage growing without cleanup | Low | Call cleanupOldScreenshots() in daily cron |
| No validation against real agent purchases | High | Validation program beginning now |

---

## 14. Risks & Mitigations

### 14.1 Strategic Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **A major player defines the standard first.** Google, Shopify, or OpenAI publishes their own agent-commerce standard before ARC gains adoption. | Medium | Critical | Move fast. Publish v0.1 within 2 weeks. First-mover advantage in standards is real. Also: design ARC's standard to be compatible with, not competitive to, existing protocols. |
| **Agent companies don't adopt the API.** No agent company integrates ARC data into their purchase flow. | Medium | High | The API is free. The data is useful. Even if agents don't formally integrate, they can use it internally for QA. Start with dev relations, not partnerships. |
| **Brands don't see value.** "AI agents aren't buying enough from my site yet to justify paying for this." | High (near-term) | Medium | Lead with education, not sales. The guide and the free report build awareness. Revenue follows awareness. |
| **Scoring accuracy undermines trust.** False positives or negatives in ARC's scores damage credibility. | Medium | Critical | Validation program. Beta disclaimer. Confidence levels on all data. Transparency about what's tested and what's projected. |
| **A competitor with distribution adds this.** DataFeedWatch (10,000+ merchants) or Salsify adds agent readiness scoring. | Medium | High | They'd be adding a feature. ARC is building a platform. Features can be copied. Networks can't. The standard + index + API is the moat. |

### 14.2 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bot detection evolves faster than ARC's scanner | High | Medium | Stealth plugin + rendered HTML. Accept that some sites will block scanning. Report "unable to scan" rather than false data. |
| Sites game their `agent-commerce.json` (declare capabilities they don't have) | Medium | Medium | Index provides independent verification. Discrepancies are flagged publicly. |
| API abuse or scraping | Medium | Low | Rate limiting, API keys for heavy usage, CDN caching |
| SQLite can't handle concurrent API requests | High | Medium | PostgreSQL migration planned before API launch |

### 14.3 Market Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Agentic commerce adoption is slower than projected | Medium | High | ARC provides value even with current AI traffic levels. Brands still benefit from structured data and feed optimization regardless of agent traffic volume. |
| Protocol fragmentation prevents standardization | Medium | Medium | `agent-commerce.json` is a discovery layer, not a protocol. It works regardless of which protocols win. |
| Regulatory intervention in AI shopping | Low | Medium | ARC's standard promotes transparency, which aligns with regulatory goals. |

---

## 15. Milestones & Timeline

### Month 1 (April 2026)

- [ ] Complete 10 manual validation tests (real agent purchases vs. ARC predictions)
- [ ] Fix top 3 false positive/negative issues identified in technical audit
- [ ] Publish `agent-commerce.json` v0.1 specification at arcreport.ai/standard
- [ ] Generate draft `agent-commerce.json` for top 50 brands
- [ ] Build public API v1 (brand lookup, capabilities, access data)
- [ ] Expand index to 500 brands

### Month 2 (May 2026)

- [ ] Launch public API at api.arcreport.ai
- [ ] Send cold outreach to 5 agent companies (OpenAI, Perplexity, Anthropic, Microsoft, Klarna)
- [ ] Publish v0.1 spec blog post + explanatory guide
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Begin weekly data-driven content on LinkedIn/X
- [ ] First 10 brands claim their ARC profiles

### Month 3-4 (June-July 2026)

- [ ] At least 1 agent company actively using ARC API
- [ ] At least 5 brands publishing `agent-commerce.json`
- [ ] Launch certification program (Verified + Certified levels)
- [ ] Certify first 20 brands
- [ ] Reach 1,000 brands in index
- [ ] First paying customers on Monitor tier

### Month 5-8 (August-November 2026)

- [ ] 50+ certified brands
- [ ] 3+ agent companies using ARC API
- [ ] Agency partnership program launched
- [ ] Shopify app submitted to App Store
- [ ] $10K MRR milestone
- [ ] Industry report: "State of Agentic Commerce Readiness 2026"

### Month 9-12 (December 2026 - March 2027)

- [ ] 200+ certified brands
- [ ] `agent-commerce.json` adoption reaching critical mass
- [ ] Enterprise tier launched
- [ ] $30K MRR milestone
- [ ] Standard governance formalized
- [ ] Data licensing revenue begins

---

## Appendix A: Comparable Platform Plays

| Company | Started As | Became | How |
|---------|-----------|--------|-----|
| **NVIDIA** | GPU manufacturer | AI infrastructure platform | Built CUDA (free software layer), which made their hardware the only rational choice. Network effects locked in the ecosystem. |
| **Cloudflare** | CDN/DDoS protection | Internet infrastructure platform | Started with a free tier to maximize adoption. Built on top: Workers, R2, Zero Trust. The network IS the product. |
| **Let's Encrypt** | Free SSL certificates | Internet trust infrastructure | Made HTTPS free and automatic. Removed the friction. Now secures 300M+ websites. |
| **Google (Search)** | Search engine | Advertising platform | Indexed the web for free. Monetized attention. Search is free; the ecosystem is the business. |
| **Stripe** | Payment processing | Commerce infrastructure | Started with a simple API. Extended to billing, fraud, issuing, identity, commerce protocols (ACP). |

ARC's play follows the same pattern: give away the standard and the index (the infrastructure). Monetize the tools and services that sit on top.

---

## Appendix B: Why "Open Standard" Is the Right Strategy

The instinct is to keep the standard proprietary — to own the spec and charge for access. This is the wrong strategy for three reasons:

1. **Proprietary standards don't get adopted.** If ARC owns the standard, agent companies will resist it (they don't want to depend on a startup). If the standard is open, they have no reason not to adopt it — it's free, it's useful, and they don't owe ARC anything.

2. **The standard's value to ARC comes from adoption, not ownership.** A proprietary standard with 10 adopters is worthless. An open standard with 10,000 adopters is a platform. ARC's competitive advantage comes from being the best implementation of the standard (the index, the tooling, the certification), not from controlling the standard itself.

3. **Open standards attract contributors.** Agent companies, e-commerce platforms, and tool vendors will propose extensions to the standard that make it more useful. This is free R&D. A proprietary standard only gets ARC's ideas.

The model is RSS: nobody owns RSS. But the companies that built the best tools around RSS (Feedly, podcast platforms, news aggregators) built real businesses. ARC builds the best tools around `agent-commerce.json`.

---

*ARC Report — arcreport.ai*
*"The person who educates the market owns the market."*
