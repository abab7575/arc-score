# ARC Report — Competitive Intelligence Analysis

**Date:** March 29, 2026
**Scope:** Full market map of the space ARC Report is entering
**Method:** Primary-source web research across 6 competitor categories

---

## MARKET MAP

```
                        WHO BLOCKS AI AGENTS? (ARC's question)
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │                               │                               │
INFRASTRUCTURE                  INTELLIGENCE                    OPTIMIZATION
(Tools brands use               (Who monitors                   (Help brands get
to manage access)               the landscape)                  found by AI)
    │                               │                               │
┌───┴────────────┐          ┌───────┴───────┐              ┌───────┴───────────┐
│ Cloudflare     │          │ ███████████   │              │ Profound ($1B)    │
│ DataDome       │          │ ARC REPORT    │              │ Scrunch/AXP       │
│ HUMAN          │          │ (ALONE HERE)  │              │ Evertune          │
│ Akamai         │          │ ███████████   │              │ Goodie AI         │
│ Kasada         │          │               │              │ Adobe LLM Opt.    │
│ Vercel BotMgmt │          │ Adjacent:     │              │ AthenaHQ          │
└────────────────┘          │ Known Agents  │              │ Semrush AI Viz    │
                            │ (per-site)    │              │ Otterly.ai        │
                            │ Originality   │              │ Peec AI           │
                            │ (one-off)     │              │ Conductor         │
                            │ AgentReady    │              │ Ahrefs Brand Radar│
                            │ (scanner)     │              └───────────────────┘
                            └───────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              ECOM INTEL      AGENTIC COMMERCE   AGENCIES/MEDIA
              │               │                  │
              │ BuiltWith     │ OpenAI/ChatGPT   │ PwC, Deloitte, BCG
              │ SimilarWeb    │ Google/UCP        │ 1Digital Agency
              │ Store Leads   │ Amazon/Rufus      │ Retailgentic
              │ PipeCandy     │ Perplexity        │ Modern Retail
              │ Marketplace   │ Shopify Agentic   │ EMARKETER
              │   Pulse       │ Daydream, Phia    │ BuzzStream
              │ Trendos       │ Rye, Browser Use  │ Aleyda Solis
              │ Visualping    │ Operator, Claude  │ Jason & Scot Show
              └───────────────┴───────────────────┘
```

**The critical insight:** Nobody occupies the center box — a public, daily-updated intelligence index of AI agent access policies across ecommerce brands. ARC Report is alone there. Adjacent players exist on all sides, but they answer different questions.

---

## COMPETITOR TABLE: TOP 15 MOST RELEVANT PLAYERS

| # | Company | Category | What They Do | Target | Pricing | Threat Level | Relationship to ARC |
|---|---------|----------|-------------|--------|---------|-------------|-------------------|
| 1 | **Known Agents** (fka Dark Visitors) | Direct | Per-site AI bot analytics, robots.txt management, LLM referral tracking, Shopping Observability (early access) | Website operators | Free–$299/mo | **HIGH** | Closest competitor. Per-site (not cross-brand), but has data infrastructure to build an index if they choose. |
| 2 | **Cloudflare AI Crawl Control** | Infrastructure | Per-site AI crawler monitoring, allow/block rules, Pay Per Crawl (beta). Free for all plans. | Cloudflare customers (millions) | Free | **LOW** | Infrastructure layer ARC monitors. Creates the policies ARC tracks. Not competitive — different layer. |
| 3 | **Semrush AI Visibility** | Adjacent SEO | "Blocked from AI Search" panel checks if YOUR site blocks AI crawlers. Part of $99/mo add-on. | SEO professionals | $99/mo add-on | **MEDIUM** | Normalizes the idea but only checks your own site. Validates category for ARC's cross-brand index. |
| 4 | **Profound** | Adjacent GEO | Enterprise AI visibility + Agent Analytics (first-party bot crawl data). $1B valuation, $155M raised. | Enterprise ($2K+/mo) | $99–$5K+/mo | **LOW** | Different market (enterprise AEO). Agent Analytics is closest product overlap but first-party only. Validation signal. |
| 5 | **Trendos** | Ecom Intel | Ecommerce competitive intelligence with "Agent Readiness Score" covering schema, accessibility, AI protocols. | Ecommerce brands | Custom | **MEDIUM** | Closest conceptual framing. They score readiness; ARC monitors access policies. Different data, same narrative. Watch closely. |
| 6 | **Botify + DataDome** | Infrastructure | End-to-end agentic commerce: Botify (Agentic Feeds/product data for AI) + DataDome (Agent Trust Management). Announced March 2026. | Enterprise retail | $50K+/yr each | **LOW** | Strongest market validation. Enterprise tools for managing agent access — ARC monitors the results from outside. |
| 7 | **AgentReady** | Direct | Free AI readiness scanner. 0-100 score across 8 factors including "Bot Access" (20% weight). | Website owners, SEOs | Free–$249/mo | **MEDIUM** | Bot Access scoring overlaps. On-demand scanner, not a published index. Could eat free-tier demand. |
| 8 | **Originality.ai** | Adjacent | Dashboard tracking AI bot blocking rates across top 1,000 sites. Published data studies. | Content creators, SEOs | Free (part of AI detection platform) | **LOW** | Periodic studies, not daily scanning. No ecommerce focus. Validation, not competition. |
| 9 | **Scrunch AI / AXP** | Adjacent GEO | AI visibility + Agent Experience Platform (serves optimized content to AI bots at CDN level). | Brands, agencies | $250–custom/mo | **LOW** | Complementary opposite. They optimize what agents see after access; ARC monitors whether access exists. |
| 10 | **Azoma** | Adjacent GEO | Enterprise AI visibility for ecommerce. Monitors AI shopping agent recommendations. Clients: L'Oreal, Unilever, P&G. | Enterprise CPG/ecom | Custom | **MEDIUM** | Most direct enterprise competitor on AI + ecommerce positioning. Output-side (recommendations) vs. ARC's input-side (access). |
| 11 | **BuiltWith** | Ecom Intel | Technology profiling of websites. 100K+ technologies tracked. $14M ARR, solo operator. | Sales, agencies, VCs | $295–$995/mo | **LOW** | Tells you a site uses Cloudflare; ARC tells you if Cloudflare blocks GPTBot. Business model analog. |
| 12 | **Store Leads** | Ecom Intel | Database of 13M+ ecommerce stores with 40+ attributes. Technology change tracking. | SaaS sales, agencies | $75–$950/mo | **LOW** | Strongest complementary data fit. ARC's agent-access signals enrich their store database. Partnership candidate. |
| 13 | **Marketplace Pulse** | Ecom Intel | Authoritative ecommerce marketplace intelligence. Cited by WSJ, NYT, Bloomberg. Acquired by Threecolts (2024). | Journalists, analysts, brands | Subscriptions | **NONE** | Business model inspiration. Small team → authoritative data source → media citations → acquisition. |
| 14 | **OpenAI / ChatGPT Shopping** | Agentic Commerce | Largest AI shopping platform. 50M daily shopping queries. ACP protocol with Stripe. Operator browser agent. | Consumers | N/A | **NONE** (Validation) | The agent whose access ARC monitors. Their growth = ARC's TAM growth. |
| 15 | **Perplexity / Comet** | Agentic Commerce | AI search with direct purchasing. Amazon won injunction blocking Comet (March 2026). | Consumers | Pro subscription | **NONE** (Validation) | Amazon v. Perplexity lawsuit gives robots.txt data legal weight. ARC's data could be cited in legal proceedings. |

---

## KEY PATTERNS

### Pattern 1: Everyone Looks Inward, Nobody Looks Outward

Every tool in the market helps a brand understand **its own** AI agent traffic:
- Known Agents: "See which bots visit YOUR site"
- Cloudflare: "Control AI crawlers on YOUR site"
- Profound: "Track how AI mentions YOUR brand"
- Semrush: "Check if YOUR site blocks AI crawlers"

**Nobody publishes what is happening across the market.** ARC Report is the only product that answers: "What are 500+ ecommerce brands doing about AI agents, and what changed today?"

### Pattern 2: The Access Question Comes Before the Visibility Question

The GEO/AEO market (Profound at $1B valuation, 30+ players) assumes AI agents can reach the site. ARC answers whether they actually can. This is the foundational question — upstream of all optimization.

**The pitch:** "Before you spend $3,000/month optimizing your AI visibility, check if you're even letting AI agents in."

### Pattern 3: The Block vs. Embrace Divide Is THE Story

Amazon blocks all external AI agents. Walmart embeds its agent inside ChatGPT and Google. This is the most consequential strategic split in ecommerce since Amazon vs. DTC. ARC is the scoreboard.

Key data points:
- Amazon: Blocks ChatGPT-User, OAI-SearchBot, plus crawlers from Google, Meta, Huawei. Sued Perplexity (won injunction March 2026). Removed 600M products from ChatGPT.
- Walmart: ChatGPT now drives 20%+ of referral traffic. Sparky embedded in ChatGPT and Gemini.
- Shopify: Auto-enrolled US merchants in Agentic Storefronts (Jan 2026).
- Amazon's subsidiaries (Zappos, Shopbop, Woot): Do NOT block agents — Amazon is experimenting through smaller properties.

### Pattern 4: Two Competing Commerce Protocols Are Live

| Protocol | Developer | Partners | Fee |
|----------|-----------|----------|-----|
| **ACP** (Agentic Commerce Protocol) | OpenAI + Stripe | Etsy, Shopify (1M merchants), Glossier, SKIMS | 4% transaction |
| **UCP** (Universal Commerce Protocol) | Google + Shopify | Walmart, Target, Best Buy, Macy's, Wayfair, Visa, Mastercard | None disclosed |

Amazon supports neither. Protocol adoption is a new signal ARC should track.

### Pattern 5: The Market Is Enormous and Growing Exponentially

| Metric | Figure | Source |
|--------|--------|--------|
| AI traffic to retail (Black Friday 2025 YoY) | **+805%** | Adobe |
| AI traffic to retail (July 2025 YoY) | **+4,700%** | Adobe |
| Global agentic commerce by 2030 | **$3–5 trillion** | McKinsey |
| US agentic commerce by 2030 | **$1 trillion** | McKinsey |
| AI-platform retail spending 2026 | **$20.9B** (4x 2025) | EMARKETER |
| ChatGPT daily shopping queries | **~50 million** | OpenAI |
| AI crawl-to-visit ratio on retail sites | **198:1** | Cloudflare |
| Sites blocking GPTBot | **5.6M+** | IEEE Spectrum |

### Pattern 6: robots.txt Now Has Legal Weight

Amazon v. Perplexity (March 10, 2026): Federal court issued a preliminary injunction under the Computer Fraud and Abuse Act, citing robots.txt violations as evidence of unauthorized access. This means ARC's daily changelog of robots.txt policy changes is not just competitive intelligence — it's a **legal record**.

### Pattern 7: Agencies and Consultancies Are Selling "Readiness" Without Data

PwC, Deloitte, BCG, and dozens of ecommerce agencies now have "agentic commerce readiness" practices. They're selling strategy without a systematic data layer for what brands are actually doing. ARC fills that gap.

---

## STRATEGIC OPPORTUNITIES FOR ARC

### Where ARC Is Differentiated Today

1. **Public cross-brand index** — Nobody else publishes comparative AI agent access data across ecommerce brands.
2. **Daily scanning cadence** — Closest alternatives are monthly reports (WebSearchAPI) or one-off studies (Originality.ai, BuzzStream).
3. **HTTP access testing per user-agent** — Distinguishing policy blocks from WAF restrictions from explicit allows. Academic papers validate this matters but no product does it.
4. **Ecommerce vertical focus** — Everyone else is horizontal (all websites) or publisher-focused.
5. **Evidence-backed changelog** — Daily diff of what changed, with proof. Nobody offers this.

### Where ARC Is Currently Weak vs. Incumbents

1. **Brand awareness** — Known Agents / Dark Visitors has years of developer mindshare. Profound has $155M in funding. ARC has neither.
2. **Coverage breadth** — 500 brands is defensible for launch but thin for authority. BuiltWith profiles millions. Store Leads tracks 13M stores.
3. **No API** — Bot management companies, SEO platforms, and AI companies all integrate via API. ARC needs one to be partnership-ready and acquisition-attractive.
4. **No protocol tracking** — ACP and UCP adoption are the hottest signals in ecommerce. ARC doesn't track them yet.
5. **No media citations** — Marketplace Pulse became authoritative by being cited in WSJ, NYT, Bloomberg. ARC has no media presence yet.
6. **Solo operator risk** — BuiltWith proves this can work ($14M ARR, 1 person). But acquirers and partners may hesitate without team signal.

### What Category Should ARC Claim?

**"Agentic Commerce Intelligence"**

Not AI readiness (too generic). Not robots.txt monitoring (too narrow). Not GEO/AEO (that's the optimization side). ARC is the **intelligence layer for agentic commerce** — the independent monitor that documents which brands are accessible to AI agents, which are blocking them, and what changed today.

Position: "The Bloomberg Terminal for AI agent access in ecommerce."

### What Is the Most Defensible Wedge for First Customers?

**The daily changelog.**

Agencies, consultants, and operators can check the matrix once. But the changelog — "Nike changed its GPTBot policy from 'allowed' to 'blocked' yesterday" — is what creates daily habit, shareability, and retention. It's the thing that can't be replicated by a one-off scanner, and it's the thing that makes the Pro tier worth €149/month.

First customers (in priority order):
1. **Ecommerce agencies** with agentic commerce practices (1Digital, Blue Wheel, Creatuity, ALM Corp)
2. **SEO consultants** advising brands on AI readiness (Aleyda Solis's audience, Passionfruit's clients)
3. **AI/ecommerce operators** building on agentic commerce protocols
4. **Sophisticated brands** monitoring competitor policies (especially those deploying ACP/UCP)

---

## WHITESPACE MAP

| Gap | Who Should Fill It | ARC Opportunity |
|-----|--------------------|-----------------|
| Public cross-brand AI access index for ecommerce | **Nobody does this** | ARC's core product. Own it. |
| Daily changelog of AI agent policy changes | **Nobody does this** | ARC's main retention driver. |
| ACP/UCP protocol adoption tracking | **Nobody tracks this** | Add to scanner. Immediate differentiation. |
| Compliance monitoring (which bots ignore robots.txt) | Cloudflare has partial data | ARC could detect and flag non-compliant crawlers. Legal value. |
| AI readiness benchmarking for ecommerce | AgentReady (shallow), Trendos (nascent) | ARC's depth (HTTP testing, WAF detection) is superior. |
| Ecommerce-specific AI bot traffic analysis | WebSearchAPI (aggregate), Cloudflare (per-site) | ARC has the brand-level view. |

---

## RISKS

### Risk 1: Known Agents Pivots to Cross-Brand Intelligence (HIGH)
Known Agents has the agent database, analytics infrastructure, and brand recognition to build an outward-facing index. Their "Shopping Observability" feature shows they're thinking about ecommerce. If they launch a "which brands block what" dashboard, they have a head start on data and distribution.

**Mitigation:** Move fast on ecommerce depth. Known Agents is horizontal (all websites, all bots). ARC's ecommerce vertical specialization, HTTP access testing, and WAF detection are harder to replicate.

### Risk 2: Cloudflare Publishes Aggregate Data (MEDIUM)
Cloudflare sees 20% of all web traffic. They already publish blog posts with aggregate AI crawler stats. If they launched a public dashboard of "which ecommerce brands block AI agents," they'd have better data than anyone.

**Mitigation:** Cloudflare won't publish per-brand data — it would expose customer configurations. ARC's value is the brand-level specificity, not aggregate stats.

### Risk 3: The Market Doesn't Pay for This (MEDIUM)
The data is interesting but the willingness-to-pay may be thin. At €149/month, ARC needs ~67 paying customers for $10K MRR. If agencies and consultants see this as "nice to have" rather than mission-critical, conversion will be slow.

**Mitigation:** Tie the changelog to client deliverables. Agencies that bill clients for "agentic readiness audits" can justify €149/month easily if ARC data powers those audits.

### Risk 4: AI Companies Buy the Data Directly (LOW-MEDIUM)
OpenAI, Anthropic, and Perplexity all know which sites block their crawlers — they have the server logs. They could publish this data themselves.

**Mitigation:** AI companies won't publish which sites block them — it's a bad PR move. And they can't see each other's blocking data. ARC's cross-crawler view (GPTBot AND ClaudeBot AND PerplexityBot) is unique.

### Risk 5: Category Becomes Commoditized (LONG-TERM)
If agentic commerce intelligence becomes a standard feature in every SEO tool, the standalone value erodes.

**Mitigation:** Accumulate time-series data. Build the dataset moat. BuiltWith has 15 years of technology data no one else can replicate. ARC's daily changelog becomes harder to replicate with every day that passes.

---

## FEATURES: COPY / DON'T COPY

### Copy

| Feature | From | Why |
|---------|------|-----|
| **Monthly aggregate "State of" report** | Marketplace Pulse, WebSearchAPI | Drives media citations and SEO. "X% of top 500 ecommerce brands now block GPTBot" is headline-ready. |
| **Free instant checker tool** | AgentReady, HubSpot AEO Grader, Pixelmojo | Acquisition funnel. Let anyone check one site free → upsell to the full index + changelog. |
| **Embeddable badges/widgets** | BuiltWith technology badges | Brands could display "ARC Verified: Open to AI Agents" badge. Drives backlinks and awareness. |
| **API for data integration** | Store Leads, PipeCandy, BuiltWith | Required for partnerships, enrichment deals, and acquisition attractiveness. |
| **Protocol adoption tracking** | Nobody does this yet | Track ACP, UCP, llms.txt, .well-known/ucp across all brands. First-mover advantage. |
| **Slack/email alerts for changes** | Visualping, Known Agents | "Nike changed its GPTBot policy" delivered to Slack. Retention driver. |

### Don't Copy

| Feature | From | Why Not |
|---------|------|---------|
| Per-site bot analytics dashboard | Known Agents, Cloudflare | Different product. ARC is outward-facing intelligence, not inward-facing analytics. |
| AI visibility optimization | Profound, Scrunch AXP | Different category. ARC monitors access, not visibility. Stay focused. |
| Content optimization / AI writing | Goodie AI, Conductor | Scope creep. ARC is a data product, not an optimization tool. |
| Composite scores / letter grades | AgentReady (0-100), Goodie AI | ARC already dropped scores for good reasons. Signal data > opinions. |
| Enterprise pricing ($2K+/month) | Profound, Evertune, Adobe | ARC's strength is accessibility. €149/month is a feature, not a weakness. |

---

## CONTENT & DISTRIBUTION TACTICS WORKING FOR OTHERS

### What's Working

1. **Data-driven original research** (BuzzStream, Cloudflare, WebSearchAPI)
   - BuzzStream's "Which News Sites Block AI Crawlers?" got massive pickup. ARC should publish the ecommerce version.
   - Target: "X% of Top 500 Ecommerce Brands Block GPTBot — Here's the Full Data"

2. **Being the cited source** (Marketplace Pulse, Cloudflare Radar)
   - Marketplace Pulse built its entire brand by being the data source journalists cited. Every Modern Retail, Digital Commerce 360, and EMARKETER article about AI agent blocking should cite ARC.
   - Tactic: Proactively pitch data to journalists covering the beat.

3. **Newsletter / Substack** (Retailgentic, 2PM)
   - Scot Wingo's Retailgentic is the #1 focused voice on agentic commerce. A weekly ARC changelog digest would serve a similar function for the access-policy angle.

4. **Free tools as acquisition funnels** (HubSpot AEO Grader, AgentReady, Growtika)
   - HubSpot gives away a free AEO audit to capture leads. ARC's instant checker serves the same purpose.

5. **Conference presence** (Shoptalk, NRF)
   - Shoptalk 2026's Day 1 was entirely about agentic commerce. ARC data would be a compelling talk: "We scanned 500 brands daily for 6 months — here's what happened."

### Specific Outreach Targets (Prioritized)

| Priority | Target | Why | Action |
|----------|--------|-----|--------|
| 1 | **Modern Retail** | Already writes about Amazon blocking AI crawlers. ARC's data is a natural source. | Pitch data story: "We monitor 500+ ecommerce brands' AI agent policies daily — here's the data." |
| 2 | **Scot Wingo / Retailgentic** | Most focused voice on agentic commerce. Weekly newsletter reaches the exact audience. | Cold email with data insight from ARC's changelog. |
| 3 | **Sarah Marzano / EMARKETER** | Principal analyst covering agentic commerce in retail. | Analyst briefing with ARC data. |
| 4 | **Jason & Scot Show podcast** | Most respected ecommerce podcast. Episode 327 was about agentic commerce. | Pitch guest appearance with ARC data. |
| 5 | **Blue Wheel Media / 1Digital Agency** | Already advising clients on AI crawler access. Would use and promote ARC. | Direct outreach with free Pro access. |
| 6 | **Aleyda Solis** | Influential SEO consultant. Published on UCP + ecommerce. | Data collaboration or guest post. |
| 7 | **BuzzStream** | Published the publisher version of ARC's study. Natural co-marketing partner. | Joint research piece: publishers vs. ecommerce brands. |
| 8 | **Search Engine Journal** | Published the "ACO Technical Guide." Large SEO audience. | Contributed data piece on ecommerce AI access. |

---

## ACQUISITION ANALYSIS

### Most Probable Acquirer Categories (Ranked)

**1. Bot Management / WAF Companies (HIGHEST PROBABILITY)**
- **Who:** Cloudflare, HUMAN Security, DataDome, Akamai
- **Why:** ARC monitors the other side of their equation. They help sites block bots; ARC tracks which sites block which bots. Competitive intelligence gold for their sales teams.
- **Precedent:** Akamai bought Noname Security ($450M). HUMAN merged with PerimeterX. All are active acquirers.
- **What ARC needs to show:** API-accessible dataset, 1,000+ brands, daily changelog, cross-crawler coverage.

**2. SEO / Digital Intelligence Platforms (HIGH PROBABILITY)**
- **Who:** Similarweb (most active acquirer), Conductor, BrightEdge, Adobe/Semrush
- **Why:** Adobe bought Semrush for $1.9B explicitly for GEO. ARC's "is this brand discoverable by AI agents?" data is the new search visibility metric.
- **Precedent:** Similarweb acquired The Search Monitor (2025), Admetricks and 42matters (2024). Conductor acquired Searchmetrics. BrightEdge acquired Oncrawl.
- **What ARC needs to show:** Integration-ready data, category authority, media citations.

**3. AI Companies (MEDIUM-HIGH, Strategic)**
- **Who:** OpenAI (13 acquisitions, accelerating), Perplexity (6 acquisitions), Google
- **Why:** They need to know who blocks their crawlers, prioritize merchant partners for commerce protocols, and understand the access landscape.
- **Precedent:** OpenAI acquired io ($6.5B), Windsurf ($3B), Statsig ($1.1B). Active acquirer.
- **What ARC needs to show:** Comprehensive crawler-by-crawler blocking data, ecommerce coverage.

**4. Ecommerce Platforms (MEDIUM)**
- **Who:** Shopify (19 acquisitions), Rithum/ChannelAdvisor
- **Why:** Merchants need to know what competitors are doing about AI agents. Embedded benchmarking.
- **Precedent:** Shopify acquired Vantage Discovery (AI commerce search). Threecolts acquired Marketplace Pulse.

### Valuation Benchmarks

| Stage | Revenue | Expected Multiple | Expected Range |
|-------|---------|-------------------|----------------|
| Pre-revenue / early | <$500K ARR | Acqui-hire + data premium | $1–5M |
| Tuck-in | $500K–$2M ARR | 3–6x ARR | $2–10M |
| Strategic sweet spot | $2M–$10M ARR | 4–8x ARR | $8–60M |
| Growth stage | $10M+ ARR | 5–10x+ ARR | $50M+ |

**Key valuation drivers:** NRR >100% adds 1–2x to multiple. Proprietary time-series data is the moat. BuiltWith proves $14M ARR at 85–90% margins as a solo operation is achievable.

### Implications for Near-Term Product Choices

To maximize acquisition value regardless of category:
1. **Grow brand count to 1,000–2,000.** Coverage breadth is the single biggest data asset differentiator.
2. **Accumulate time-series data.** Every day of changelog makes the dataset harder to replicate.
3. **Build an API.** Required for integration into any acquirer's platform.
4. **Get cited in media and analyst reports.** Brand authority converts a dataset into a category.
5. **Maintain BuiltWith-level efficiency.** 85%+ margins on lean operations.

---

## TOP 10 ACTIONS — PRIORITIZED

### Scoring: Speed (days to implement) × Customer Impact × Strategic Value

---

### 1. Publish "State of AI Agent Access in Ecommerce" Report
**Timeline:** Next 7 days
**Speed:** HIGH — ARC already has the data from 500 brands
**Customer Impact:** HIGH — Becomes the press release that gets ARC cited
**Strategic Value:** CRITICAL — This is how Marketplace Pulse built its brand

Write a 2,000-word report with charts: "We scanned 500+ ecommerce brands daily. Here's what we found about AI agent blocking." Include headline stats:
- % blocking GPTBot, ClaudeBot, PerplexityBot
- % where WAF interferes vs. explicit policy block
- Platform breakdown (Shopify vs. custom vs. others)
- Who changed policies recently (changelog highlights)

Publish on arcreport.ai/research. Pitch to Modern Retail, Digital Commerce 360, Retailgentic, Search Engine Journal.

---

### 2. Add ACP/UCP Protocol Detection to Scanner
**Timeline:** Next 14 days
**Speed:** MEDIUM — HTTP check for /.well-known/ucp endpoint + ACP manifest
**Customer Impact:** HIGH — This is the hottest signal in ecommerce right now
**Strategic Value:** HIGH — First mover. Nobody else tracks protocol adoption at scale.

Check every brand for:
- `/.well-known/ucp` (Google Universal Commerce Protocol)
- ACP manifest / Stripe commerce integration signals
- `llms.txt` file presence
- `ai.txt` or `agents.txt` presence

This data immediately differentiates ARC from every other player.

---

### 3. Build a Free Instant Checker
**Timeline:** Next 14 days
**Speed:** MEDIUM — Lightweight version of existing scanner for single URLs
**Customer Impact:** HIGH — Acquisition funnel for the index and Pro tier
**Strategic Value:** HIGH — 5+ free checkers already exist (AgentReady, HubSpot, Pixelmojo), proving demand

Let anyone enter a URL and get: robots.txt AI agent policies, HTTP access test results, platform/CDN/WAF detection, structured data presence, protocol support. Show partial results → "See how you compare to 500+ brands" → CTA for full index and Pro.

---

### 4. Pitch Data to 3–5 Journalists and Analysts
**Timeline:** Next 14 days (after #1 is published)
**Speed:** HIGH — Just email
**Customer Impact:** MEDIUM — Indirect (builds brand for future customers)
**Strategic Value:** CRITICAL — Media citations are the compound interest of data businesses

Priority contacts:
1. Modern Retail reporter covering AI + ecommerce (they broke the Amazon blocking stories)
2. Scot Wingo (Retailgentic) — weekly agentic commerce newsletter
3. Sarah Marzano (EMARKETER) — principal analyst on agentic commerce
4. Digital Commerce 360 — trade pub, loves quantitative ecommerce data
5. BuzzStream — did the publisher version, natural co-marketing

---

### 5. Build Slack/Email Alerts for Changelog Changes
**Timeline:** Next 30 days
**Speed:** MEDIUM
**Customer Impact:** HIGH — This is the retention mechanic. "Nike changed its GPTBot policy" delivered to your Slack.
**Strategic Value:** HIGH — Transforms ARC from a dashboard you check into a service that pushes value daily.

Pro tier feature. Daily digest or real-time alerts. Configurable by brand watchlist or by signal type.

---

### 6. Ship an API (v1, read-only)
**Timeline:** Next 30 days
**Speed:** MEDIUM — JSON API over existing data
**Customer Impact:** MEDIUM — Enables agencies and tools to integrate ARC data
**Strategic Value:** CRITICAL — Required for partnerships (Store Leads, PipeCandy), enrichment deals, and acquisition-readiness

Endpoints:
- `GET /brands` — list all brands with latest status
- `GET /brands/:slug` — full signal data for one brand
- `GET /changelog` — recent changes
- `GET /matrix` — full matrix data

---

### 7. Expand to 1,000 Brands
**Timeline:** Next 60 days
**Speed:** MEDIUM — Need to source and validate URLs, run through scanner
**Customer Impact:** HIGH — Doubles coverage. Enables "we monitor 1,000+ brands" positioning.
**Strategic Value:** HIGH — Coverage breadth is the core data asset. Every brand added makes the dataset harder to replicate.

Prioritize: Top Shopify stores, DTC brands, marketplace sellers, European brands (Zalando, ASOS, Farfetch, etc.), luxury (LVMH brands, Kering brands).

---

### 8. Outreach to 5 Ecommerce Agencies for Early Pro Adoption
**Timeline:** Next 30 days
**Speed:** HIGH — Cold email with free trial
**Customer Impact:** HIGH — Agencies are the fastest path to revenue. One agency = multiple brand clients.
**Strategic Value:** HIGH — Agency adoption creates distribution leverage.

Targets:
1. **1Digital Agency** — Has a dedicated agentic commerce practice
2. **Blue Wheel Media** — Already writing about Cloudflare AI bot blocking for ecommerce clients
3. **Creatuity** — Adobe Commerce specialist, published merchant readiness guide
4. **ALM Corp** — Coined "Agentic Commerce Optimization"
5. **Passionfruit** — Stanford/CMU SEO agency, published GPTBot blocking guide

Offer: 90-day free Pro access → case study → paid conversion.

---

### 9. Add Compliance Detection (Which Bots Ignore robots.txt)
**Timeline:** Next 90 days
**Speed:** LOW — Requires comparing declared policy vs. actual HTTP behavior
**Customer Impact:** MEDIUM — Niche but extremely high-value for legal/compliance buyers
**Strategic Value:** HIGH — After Amazon v. Perplexity, robots.txt compliance has legal weight. ARC could be an evidence source.

ARC already tests both robots.txt (policy) and actual HTTP access (behavior). The gap between them = compliance data. Academic papers validate that many crawlers selectively respect robots.txt.

---

### 10. Position for Shoptalk Fall 2026 / NRF 2027
**Timeline:** Next 90–180 days
**Speed:** LOW — Requires data, report, and pitch
**Customer Impact:** LOW near-term, HIGH long-term
**Strategic Value:** HIGH — Shoptalk 2026 Day 1 was entirely agentic commerce. ARC data is a compelling talk.

Goal: Submit a speaking proposal for Shoptalk Fall 2026 or NRF Big Show 2027. Pitch: "We scanned 1,000 ecommerce brands daily for 6 months. Here's how the industry is responding to AI agents."

---

## TIMELINE SUMMARY

### Next 30 Days
- [ ] Publish "State of AI Agent Access" research report (#1)
- [ ] Add ACP/UCP protocol detection (#2)
- [ ] Build free instant checker (#3)
- [ ] Pitch data to 3–5 journalists (#4)
- [ ] Outreach to 5 agencies (#8)

### Next 90 Days
- [ ] Ship Slack/email alerts (#5)
- [ ] Ship API v1 (#6)
- [ ] Expand to 1,000 brands (#7)
- [ ] Add compliance detection (#9)
- [ ] Publish second research report (monthly cadence)

### Next 12 Months
- [ ] Expand to 2,000+ brands
- [ ] Monthly "State of" reports (establish as industry standard)
- [ ] Conference speaking (Shoptalk, NRF) (#10)
- [ ] Data partnerships (Store Leads, PipeCandy, or similar)
- [ ] Achieve 50+ Pro subscribers (€7,450/month)
- [ ] Accumulate 12 months of daily changelog data (irreplicable asset)
- [ ] Get cited in 3+ analyst/media reports
- [ ] Evaluate acquisition interest vs. continued independence

---

## KEY SOURCES

### Direct Competitors
- [Known Agents (fka Dark Visitors)](https://knownagents.com/) — [Pricing](https://knownagents.com/pricing)
- [Originality.ai AI Bot Blocking](https://originality.ai/ai-bot-blocking)
- [AgentReady Scanner](https://agentready.site/)
- [RobotScrape](https://robotscrape.com/) (SSL expired, likely unmaintained)
- [WebSearchAPI Monthly AI Crawler Report](https://websearchapi.ai/blog/monthly-ai-crawler-report)

### Adjacent GEO/AEO Players
- [Profound](https://www.tryprofound.com/) — $1B valuation, $155M raised — [Pricing](https://www.tryprofound.com/pricing)
- [Scrunch AI / AXP](https://scrunch.com/) — [Pricing](https://scrunch.com/pricing/)
- [Evertune](https://www.evertune.ai/) — $19M raised, starts $3K/mo
- [Goodie AI](https://higoodie.com/) — [Pricing](https://higoodie.com/pricing) ($295+/mo)
- [AthenaHQ](https://www.athenahq.ai/) — $295/mo ($95 annual)
- [Otterly.ai](https://otterly.ai/) — 20K+ users, starts $29/mo
- [Peec AI](https://peec.ai/) — EUR 85–425/mo
- [Knowatoa](https://knowatoa.com/) — $59–199/mo
- [OpenLens](https://tryopenlens.com/) — Free (launched March 2026)
- [Adobe LLM Optimizer](https://business.adobe.com/products/llm-optimizer.html) — ~$115K/yr minimum
- [Azoma](https://www.azoma.ai/) — Enterprise, L'Oreal/Unilever/P&G clients
- [Semrush AI Visibility](https://www.semrush.com/ai-seo/overview/) — $99/mo add-on
- [Ahrefs Brand Radar](https://ahrefs.com/brand-radar) — $199–699/mo per AI index
- [Conductor AI Bot Crawling](https://www.conductor.com/platform/features/ai-search-performance/ai-bot-crawling-analysis/)
- [BrightEdge](https://www.brightedge.com/) — Enterprise, $5K–10K+/mo
- [Moz AI Visibility](https://moz.com/) — Beta, included in Moz Pro

### Ecommerce Intelligence
- [BuiltWith](https://builtwith.com/) — $14M ARR, solo operator — [Plans](https://builtwith.com/plans)
- [SimilarWeb](https://www.similarweb.com/) — NYSE: SMWB, $282M revenue
- [Store Leads](https://storeleads.app/) — 13M+ stores, $75–950/mo
- [PipeCandy](https://pipecandy.com/) — 5.4M companies, from $199/mo
- [Trendos](https://www.trendos.io/) — Agent Readiness Score — [Features](https://www.trendos.io/features)
- [Marketplace Pulse](https://www.marketplacepulse.com/) — Acquired by Threecolts (2024)
- [Digital Commerce 360](https://www.digitalcommerce360.com/) — Top 500 databases

### Website Change Monitoring
- [Visualping](https://visualping.io/) — 80% of Fortune 500, free–$250/mo
- [Hexowatch](https://hexowatch.com/) — 13 monitoring types
- [ChangeTower](https://changetower.com/) — $9–118/mo
- [Distill.io](https://distill.io/) — Free–$80+/mo

### Infrastructure / Bot Management
- [Cloudflare AI Crawl Control](https://developers.cloudflare.com/ai-crawl-control/) — Free for all plans
- [Cloudflare Pay Per Crawl](https://blog.cloudflare.com/introducing-pay-per-crawl/) — Private beta
- [DataDome](https://datadome.co/) — $36M revenue, $81M raised
- [DataDome + Botify Partnership](https://datadome.co/press/datadome-and-botify-partner-to-give-businesses-full-control-over-agentic-commerce/) — March 2026
- [HUMAN Security](https://www.humansecurity.com/) — $100M+ ARR
- [Akamai Bot Manager](https://www.akamai.com/products/bot-manager)
- [Kasada](https://kasada.io/) — $20M raised Feb 2026
- [Botify Agentic Feeds](https://ppc.land/botifys-agentic-feeds-targets-the-product-data-gap-in-ai-driven-commerce/)

### Agentic Commerce Players
- [OpenAI Agentic Commerce Protocol (ACP)](https://openai.com/index/buy-it-in-chatgpt/)
- [Google Universal Commerce Protocol (UCP)](https://developers.google.com/merchant/ucp)
- [Amazon vs. Perplexity Injunction](https://www.cnbc.com/2026/03/10/amazon-wins-court-order-to-block-perplexitys-ai-shopping-agent.html)
- [Shopify Agentic Storefronts](https://www.shopify.com/news/winter-26-edition-agentic-storefronts)
- [Walmart Sparky in ChatGPT](https://corporate.walmart.com/news/2025/06/06/walmart-the-future-of-shopping-is-agentic-meet-sparky)
- [Daydream](https://daydream.ing/) — $50M seed, fashion AI shopping
- [Phia](https://phia.com/) — $35M raised, AI price comparison
- [Rye](https://rye.com/) — Universal checkout for AI agents, a16z-backed
- [FERMAT Commerce](https://fermatcommerce.com/) — $45M Series B
- [Browser Use](https://browseruse.com/) — $17M raised, open-source agent framework
- [OpenAI Operator](https://openai.com/index/introducing-operator/)
- [Anthropic Claude Computer Use](https://www.cnbc.com/2026/03/24/anthropic-claude-ai-agent-use-computer-finish-tasks.html)
- [Rye Agentic Commerce Landscape Map](https://rye.com/blog/agentic-commerce-startups)
- [CB Insights Agentic Commerce Market Map](https://www.cbinsights.com/research/report/agentic-commerce-market-map/)

### Agencies & Consultancies
- [PwC Agentic Commerce Practice](https://www.pwc.com/us/en/services/consulting/front-office/agentic-commerce.html)
- [Deloitte Agentic Commerce Guide](https://www.deloitte.com/us/en/Industries/consumer/articles/agentic-commerce-ai-shopping-agents-guide.html)
- [BCG — Consumers Trust AI to Buy Better](https://www.bcg.com/publications/2026/consumers-trust-ai-to-buy-better-brands-must-adapt)
- [McKinsey — The Agentic Commerce Opportunity](https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-agentic-commerce-opportunity-how-ai-agents-are-ushering-in-a-new-era-for-consumers-and-merchants)
- [1Digital Agency — Agentic Commerce](https://www.1digitalagency.com/agentic-commerce/)
- [Blue Wheel — Cloudflare AI Bot Block](https://www.bluewheelmedia.com/blog/cloudflares-ai-bot-block)
- [Creatuity — Merchant Readiness Guide](https://www.creatuity.com/insights/agentic-ai-commerce-adobe-commerce-readiness/)
- [ALM Corp — ACO Guide](https://almcorp.com/blog/agentic-commerce-optimization/)
- [Aleyda Solis — UCP + Ecommerce SEO](https://www.aleydasolis.com/en/search-engine-optimization/ugc-agentic-commerce-seo/)
- [Passionfruit — GPTBot Guide](https://www.getpassionfruit.com/blog/what-is-gptbot-and-should-you-block-it)

### Media & Newsletters
- [Retailgentic (Scot Wingo)](https://www.retailgentic.com/) — #1 agentic commerce newsletter
- [Modern Retail — Amazon Blocks AI Crawlers](https://www.modernretail.co/technology/amazon-expands-its-fight-to-keep-ai-bots-off-its-e-commerce-site/)
- [Modern Retail — ChatGPT 20% of Walmart Traffic](https://www.modernretail.co/technology/chatgpt-is-now-20-of-walmarts-referral-traffic-while-amazon-wards-off-ai-shopping-agents/)
- [EMARKETER — Agentic Shopping 2026](https://www.emarketer.com/content/how-agentic-ai-will-reshape-shopping-2026)
- [Digital Commerce 360 — Agentic Commerce](https://www.digitalcommerce360.com/2025/03/20/agentic-commerce-ecommerce-trends/)
- [2PM Newsletter](https://2pml.com/)
- [Future Commerce](https://www.futurecommerce.com/)
- [Jason & Scot Show — Episode 327: Agentic Commerce](https://retailgeek.com/jason-scot-show-episode-327-agentic/)
- [BuzzStream — Publisher AI Blocking Study](https://www.buzzstream.com/blog/publishers-block-ai-study/)
- [HBR — How Brands Can Adapt When AI Agents Do the Shopping](https://hbr.org/2026/02/how-brands-can-adapt-when-ai-agents-do-the-shopping)
- [Search Engine Journal — ACO Technical Guide](https://www.searchenginejournal.com/agentic-commerce-optimization-a-technical-guide-to-prepare-for-googles-ucp/566969/)

### Research & Data
- [Cloudflare — AI Crawler Traffic by Industry](https://blog.cloudflare.com/ai-crawler-traffic-by-purpose-and-industry/) (198:1 crawl-to-visit ratio on retail)
- [Cloudflare — Googlebot to GPTBot](https://blog.cloudflare.com/from-googlebot-to-gptbot-whos-crawling-your-site-in-2025/)
- [UC San Diego / UChicago — "Somesite I Used To Crawl"](https://arxiv.org/html/2411.15091v1)
- ["Scrapers Selectively Respect robots.txt"](https://arxiv.org/html/2505.21733v1)
- [IEEE Spectrum — Websites Halt AI Crawlers](https://spectrum.ieee.org/web-crawling)
- [ai.robots.txt GitHub (3.8K stars)](https://github.com/ai-robots-txt/ai.robots.txt)
- [agentmarkup.dev](https://agentmarkup.dev/) — Open-source AI readiness toolkit
- [MetaRouter — Agentic Commerce Trends](https://www.metarouter.io/post/agentic-commerce-trends-statistics)
- [Bain Capital Ventures — Agentic Era of Commerce](https://baincapitalventures.com/insight/openai-s-operator-signals-the-agentic-era-of-commerce-is-here/)
- [PayPal — Making Sense of the AI Shopping Protocol Moment](https://newsroom.paypal-corp.com/2026-01-22-Making-Sense-of-the-AI-Shopping-Protocol-Moment)

### Acquisition Precedents
- [Adobe acquires Semrush — $1.9B](https://www.cnbc.com/2025/11/19/adobe-ai-semrush-stock-deal.html)
- [ChannelAdvisor acquired by CommerceHub — $635M](https://www.retailtouchpoints.com/features/mergers-and-acquisitions/commercehub-to-buy-channeladvisor-in-635-million-deal)
- [Akamai acquires Noname Security — $450M](https://www.ir.akamai.com/news-releases/news-release-details/akamai-announces-intent-acquire-api-security-company-noname)
- [Morningstar acquires PitchBook — $225M](https://pitchbook.com/media/press-releases/morningstar-to-acquire-pitchbook-data)
- [Threecolts acquires Marketplace Pulse](https://www.marketplacepulse.com/articles/threecolts-acquires-marketplace-pulse)
- [BuiltWith — $14M ARR, 1 employee](https://www.colinkeeley.com/blog/the-story-of-builtwith-1-employee-14m-arr)
- [SaaS Valuation Multiples 2026 ($1–5M ARR)](https://www.breakwaterma.com/blog/saas-valuation-multiples-2026-1m-5m-arr)
