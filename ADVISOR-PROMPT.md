# ARC Report — Advisor Briefing

I need a second opinion on product direction and business model for ARC Report. This prompt gives you full context. Please read everything before responding — the details matter.

---

## What ARC Report Is

ARC Report (arcreport.ai) is a daily-updated intelligence platform that tracks how 1,006 e-commerce brands are configured for AI shopping agents.

Every day, an automated scanner checks each brand's:
- **robots.txt rules** for 9 AI agents (GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, CCBot, Amazonbot, Bingbot)
- **Live user-agent access testing** — sends HTTP requests as each agent and measures whether the site allows, blocks, degrades, or ignores them
- **Structured data signals** — JSON-LD, Schema.org Product, Open Graph, sitemaps, product feeds
- **Emerging agent-readability files** — llms.txt (per llmstxt.org), agent declaration files (/agents.txt, /agents-brief.txt), UCP endpoints
- **Infrastructure fingerprinting** — platform (Shopify, Salesforce, custom, etc.), CDN, WAF, response times

Changes between scans are detected, confirmed (two-scan buffer for noisy signals), and published as a changelog. The scanner runs ~1,006 brands in about 4 minutes with a 97% success rate. It is HTTP-only — no browser automation, no Puppeteer, no AI API calls in the scan loop. Cheap to operate.

The result is a structured, daily-updated dataset of how every major e-commerce brand is positioned for the AI agent era.

---

## What the Product Looks Like Today

**Live at arcreport.ai:**

- **/** — Homepage with full brand index table (searchable, filterable by category/platform)
- **/matrix** — Expanded signal matrix: agent access status, platform, CDN/WAF, structured data
- **/changelog** — Daily changes detected across all brands
- **/weekly** — Weekly intelligence digest: top movers, new llms.txt adopters, newly restricted agents, infrastructure shifts
- **/brand/[slug]** — Per-brand readout page (1,006 of these): verdict summary, agent reach array, machine-readable signal stack, peer position vs category, change log, and field context notes
- **/docs** — Public API documentation (3 endpoints, no auth required for read)
- **/pricing** — Currently Free + Pro ($100/mo, but see below)

The design leans into a "1970s NASA mission control meets Tokyo retro-futurism" aesthetic. Bold offset shadows, monospace spec labels, colored instrument panels. Distinctive, not generic.

---

## The Journey So Far (and the Pricing Back-and-Forth)

### Phase 1: Robot Shopper (Feb–March 2026)
Started as a diagnostic tool for e-commerce brands. Five scanning agents (browser, data, accessibility, visual, feed) would test the full shopping journey on a site and produce a 0–100 score across 7 categories, projected onto 10 AI agent compatibility profiles.

Pricing was **$79/mo Monitor, $149/mo Pro, $249/mo Team**. The pitch was "we send robot shoppers to your store, they try to buy, you see what breaks."

Problem: the heavy Puppeteer-based scanning was slow, expensive, brittle, and hard to maintain as a solo founder. The scoring felt editorial/subjective, which created legal exposure. And the target buyer (DTC brand head of e-commerce) had to already understand agentic commerce — most didn't.

### Phase 2: ARC Report — Signal Intelligence (late March 2026)
Pivoted to a signal-first model. Stripped the scoring entirely. Replaced the heavy scanner with a lightweight HTTP-only scanner. No scores, no grades, no action plans. Instead: publish the raw observed signals (robots.txt rules, agent access, structured data, platform detection) and let the data speak.

Pricing simplified to **Free + Pro at $149/mo**, then dropped to **$100/mo**.

The idea was: free public index for distribution, Pro for historical data + full changelog + exports + API + email alerts. Revenue from SaaS subscriptions.

Problem: the free tier is very generous (full current snapshot of all 1,006 brands), and Pro mostly offers "more of the same" (history, exports, alerts). The upgrade trigger is weak. Nobody has converted to Pro yet — though the product was barely live for a week before we started iterating on this question.

### Phase 3: Considered "All Free + API" Model
One advisor suggested making everything free and monetizing via tiered API access (developer tier $99/mo, team $499/mo, enterprise $2–5k/mo). The analogy was to a pure data-product company.

This was directionally interesting but premature — it would require abandoning the SaaS infrastructure already built (accounts, Stripe, plan gating, brand claiming flow) and finding an entirely new audience (developers/agent builders) that we haven't validated.

### Phase 4: Current Thinking — "BuiltWith of Agentic Commerce"
The current direction I'm exploring is modeled on BuiltWith/Wappalyzer:

- **Free**: public index, brand pages, market intelligence, basic weekly digest, rate-limited API
- **Paid (Monitor ~$49/mo)**: watchlists, daily change alerts for watched brands, full changelog history, CSV/JSON exports, personal API key
- **Paid (Team/Agency ~$199/mo)**: multiple watchlists, category diffs, competitor tracking groups, Slack/webhook alerts, team seats, higher API limits
- **Later**: enterprise data licensing, custom feeds

The idea is: **free lookup = distribution. Paid = market intelligence workflow.** You don't pay for more depth on one brand — you pay to query, monitor, and operationalize the whole market.

BuiltWith does ~$10M ARR with 5–7 people on this model. Wappalyzer converges on the same shape. The question is whether this model works for a narrower, newer category like agentic commerce.

---

## My Situation

- **Solo founder.** I build everything myself with AI coding tools (Claude Code, Codex). No team.
- **Bootstrapped.** No investors, no runway beyond what I can sustain personally.
- **Time is my #1 constraint.** I cannot do consulting calls, enterprise sales cycles, custom implementations, or heavy manual processes. Whatever the business model is, it has to be self-serve or close to it.
- **Technical capability is not the bottleneck.** I can ship product fast. The bottleneck is distribution and figuring out who actually pays.
- **Operating costs are trivial.** ~$1,300/mo at $30k MRR (Railway hosting, Stripe fees, Anthropic API). 96%+ margins.
- **Revenue to date: essentially zero.** The product has been live for ~2 weeks in its current form. No paying customers yet, but also no real distribution effort yet.

---

## The Market Context

- AI shopping traffic to retail sites grew **4,700% YoY** (Adobe)
- **84M shopping queries/week** on ChatGPT alone (Stackline)
- AI traffic converts **31% higher** than non-branded organic (Search Engine Land)
- McKinsey projects **$1–5 trillion** in AI-mediated global commerce by 2030
- **Most brands are doing nothing to prepare.** In our index, 96% of brands are fully open to all AI agents — which sounds good but actually means they haven't thought about agent access policy at all
- The competitive landscape is early: a handful of startups (Aido Lighthouse, AgentReadyHQ, UCP.tools), none with meaningful traction
- BuiltWith itself is adding AI-facing features (MCP, llms.txt detection), so they see the category too — but they're horizontal, not commerce-specific

---

## What I Have That's Hard to Replicate

1. **1,006 brands scanned daily** with 97% success rate. Lightweight, cheap to operate.
2. **A confirmed, structured changelog** — two-scan confirmation, drift detection, noise filtering. Not just "did the page change" but "did the signal actually move."
3. **Emerging-signal coverage** that competitors don't have: llms.txt quality heuristics, agent declaration file detection (multiple path variants), UCP endpoint probing.
4. **A distinctive, well-designed product** that looks credible. Brand pages are bold, not generic.
5. **Infrastructure that works**: daily cron, fire-and-forget scan, heartbeat-based stale detection, staleness alerting. The scanner is boring and reliable — it runs itself.
6. **SEO surface area**: 1,006 indexable brand pages + matrix + changelog + weekly + docs.

---

## What I Need Your Opinion On

### 1. Is "BuiltWith of agentic commerce" the right framing?
Does this model (free lookup, paid market intelligence/monitoring) fit a category this early and this narrow? BuiltWith works because "what technology does this site use" is a broad, horizontal question with millions of possible queries. "How is this site configured for AI agents" is narrower. Is the query volume there?

### 2. Who actually pays first?
The back-and-forth has surfaced several possible first customers:
- **DTC brands** wanting to monitor their own agent readiness ($5M–$50M revenue, head of e-commerce)
- **E-commerce agencies** wanting to audit and benchmark clients
- **Agent infrastructure companies** (Rye, Firmly, Stripe ACP team) wanting data to route their agents
- **Analysts/VCs** tracking the agentic commerce space
- **Platform companies** (Shopify, BigCommerce) wanting ecosystem intelligence

Who should I target first given that I'm solo, bootstrapped, and can't do enterprise sales?

### 3. Is $49/mo the right starting price?
Or should it be lower ($29) to reduce friction, or higher ($99) to signal seriousness? The unit economics work at any of these — the question is conversion probability vs. perceived value.

### 4. What should the upgrade wall feel like?
Currently there's no friction in the free experience. How aggressively should I gate? Options range from:
- Subtle ("5 changelog entries free, upgrade for full history")
- Medium ("watchlists and alerts are Pro-only")
- Aggressive ("brand page shows 3 agents free, upgrade for full 9")

### 5. What's the most important thing to build in the next 7 days?
Given limited time, where does the highest leverage lie:
- Watchlists + alerts (retention loop)
- Pricing page rewrite + upgrade moments (conversion infrastructure)
- Weekly email newsletter (distribution)
- Outbound to 20 agent-infra companies (demand testing)
- Something else entirely

### 6. Am I overthinking the business model and underthinking distribution?
Serious question. I've pivoted the product direction three times in three weeks. Maybe the product is good enough and the real problem is that nobody knows it exists.

### 7. What am I missing?
Blind spots, unstated assumptions, things I'm too close to see. Be direct.

---

## How I'd Like You to Respond

- Be specific, not generic. Reference the actual product, not abstract startup advice.
- Tell me what to stop doing, not just what to start.
- If the BuiltWith framing is wrong, tell me what's better.
- If you think the category is too early to monetize, say so — and tell me what to do instead.
- Prioritize ruthlessly. I have limited hours per week. Every recommendation competes with every other one.
- Be direct. I've had enough diplomatic feedback. Tell me what you actually think.
