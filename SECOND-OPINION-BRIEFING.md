# ARC Report — Second-Opinion Briefing

**Prepared:** 2026-04-04
**Prepared for:** External reviewer
**Project:** arcreport.ai
**Founder:** Solo operator, time-constrained
**Status:** Live, monetizing, recently pivoted, scheduler currently broken

---

## 0. What I Need From You

I want a second opinion on three things, in order of importance:

1. **Is the current product shape defensible, and is $30-50k MRR in 6 months realistic from it?** I just pivoted. I'm not sure I pivoted in the right direction.
2. **Where is my architecture fragile enough that I will keep losing time to it?** I'm solo, I can't keep fixing the scraper. It needs to run unattended for weeks.
3. **What am I missing?** Blind spots, unstated assumptions, things I'm too close to see.

**Hard constraints on solutions:**
- Solo operator, time is the #1 constraint. I can't keep dealing with things breaking.
- SaaS model only. No consulting calls, no demos, no sales-led motion. Self-serve signup, stripe checkout, done.
- Must *educate*, *induce FOMO*, and appeal to three buyers simultaneously: **commercial** (e-commerce ops/growth), **technical** (engineers, platform teams), **AI/agent** (people building agents who need this data).
- Must be a no-brainer at the price point.

---

## 1. TL;DR

ARC Report (arcreport.ai) tracks how 1,006 e-commerce brands are configured for AI shopping agents. Daily HTTP scans check each brand's robots.txt, user-agent blocking, platform, CDN/WAF, and structured data, then publish a changelog of what changed. Free tier shows the full latest snapshot. Pro tier ($100/mo) unlocks historical data, full changelog, exports, and alerts.

**Where we are:**
- Live on Railway at arcreport.ai
- 1,006 brands in index
- Daily lightweight scan pipeline built (HTTP-only, ~5-10 min per run)
- Pivoted 1 week ago from a "score + grade" product (Robot Shopper) to a "signals + changelog" product (ARC Report)
- Stripe checkout working, Pro tier live
- Content distribution infrastructure from old product (content engine, infographics, newsfeed) largely unused since pivot

**What's broken right now:**
- The daily scan has been failing since 2026-03-31 (5 days). Root cause: a scan run got stuck in "running" state, and every subsequent daily cron is being rejected. The in-process worker is dead on production. See §7.

**What this doc is for:**
A complete technical + business overview so you can push back on my thinking and surface blind spots. I will skip nothing — including the parts that aren't flattering.

---

## 2. Product History — Two Pivots in Three Weeks

### 2.1 Version 1: Robot Shopper (pre-March 22)
**Pitch:** "We send 5 AI shopping agents to your store. They try to buy. You see what breaks."

A diagnostic tool for e-commerce brands. Full Puppeteer-based scanner with 5 agents:
- Browser Agent (navigates + clicks + adds to cart)
- Data Agent (HTTP fetches, parses schema)
- Accessibility Agent (ARIA + keyboard)
- Visual Agent (Claude Vision screenshots)
- Feed Agent (product feeds)

Scored each brand 0-100 across 7 categories, projected onto 10 AI agent profiles (ChatGPT Operator, Perplexity Comet, Amazon Buy For Me, etc.), generated an action plan.

Pricing: $79/mo Monitor, $149/mo Pro, $249/mo Team.

### 2.2 Version 2: ARC Report — The Infrastructure Layer (March 22)
**Pitch:** "The robots.txt for commerce. An open standard, a free index, a paid dashboard."

Rebrand + reframe. Same underlying product but with a bigger vision:
1. **The Standard** — publish a spec (`agent-commerce.json`) sites can host at `/.well-known/`
2. **The Index** — public capability database of 1,000+ brands, free API
3. **The Dashboard** — paid SaaS (the monetization)

Domain bought (arcreport.ai), brand changed, brand list grew from 276 → 1,006.

### 2.3 Version 3: Signals + Changelog (March 28 — current)
**Pitch:** "Competitive intelligence on agentic commerce. Daily changes across 1,000+ brands."

Stripped the scoring entirely. No more grades, no more 0-100 scores. Replaced with:
- Raw signal data (robots.txt, per-agent access, platform detection, CDN/WAF, structured data presence)
- Daily changelog ("H-E-B robots.txt changed from detected to not detected")
- Historical snapshots

Replaced the heavy Puppeteer scanner with a **lightweight HTTP-only scanner** that runs 1,006 brands in ~5-10 minutes instead of hours.

**Pricing collapsed to:** Free + Pro ($100/mo flat).

**Why the pivot:** The scoring product was editorial (grade a brand, tell them they're failing). The new product is descriptive (publish what we observe). This is lower legal risk, faster to scan, more defensible as "data" vs. "opinion," and opens up new buyer personas (agent builders, platform companies, analysts) beyond just DTC brands.

### 2.4 What the pivot cost
- **~80% of the old product is now dead code** — the 5-agent Puppeteer scanner, scoring engine, 10 agent profiles, action plan generator, category breakdowns, brand-level reports, content engine generating score-based infographics, methodology page, agents explainer page, etc. All still in the repo. Old Puppeteer weekly scan still scheduled.
- **The "oh shit, I'm failing" hook is gone.** A score of 23/100 is visceral. "Your robots.txt has no explicit rule for ClaudeBot" is not.
- **Brand pages haven't been rewritten yet** (`/brand/[slug]` still shows the old score-centric view)
- **Content distribution pipeline is orphaned.** Content Engine, infographic generator, newsfeed, outreach workflow — all built to push score-based content, all silent since the pivot.

---

## 3. Current Product State

### 3.1 Pages (public, post-pivot)

| Route | Purpose | State |
|-------|---------|-------|
| `/` | Homepage — brand index table with agent status | Rewritten, live |
| `/matrix` | Expanded matrix: robots.txt, UA, platform, CDN/WAF, structured data | Rewritten, live |
| `/landscape` | Category/platform rollups | Still score-oriented (needs rewrite) |
| `/changelog` | Daily changes across brands | Live, **showing stale data (broken scraper)** |
| `/brand/[slug]` | Per-brand signal sheet | **Still shows OLD score-centric view** |
| `/pricing` | Free + Pro $100/mo | Live |
| `/guide`, `/methodology`, `/agents`, `/compare`, `/about` | Legacy pages | Still live (SEO), inconsistent with new positioning |
| `/submit`, `/instant-check`, `/report/[id]` | Legacy from Robot Shopper | Should likely be removed |
| `/admin/*` | 12 admin pages: content-studio, newsfeed, outreach, intel, brands, pipeline, scan-health, etc. | Built for old product, partially stale |

### 3.2 Data Pipeline (post-pivot)

**The lightweight scanner** (`src/lib/scanner/lightweight-scanner.ts`):
- HTTP-only, no browser
- For each brand, fetches:
  - `/robots.txt` → parses per-agent rules
  - Homepage + product page with 8 different user-agent strings (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, etc.) → blocked/allowed/degraded
  - Structured data signals (JSON-LD, Schema.org Product, Open Graph, sitemap, product feed, llms.txt, UCP)
  - Platform detection (Shopify, WooCommerce, Magento, etc.)
  - CDN / WAF detection (Cloudflare, Akamai, Imperva, etc.)

**Database:** SQLite via Drizzle ORM, on Railway volume.
- `lightweightScans` — one row per brand per scan
- `changelogEntries` — diffs between consecutive scans
- Also: `brands`, `scanRuns`, `scanJobs`, `systemState`, `customers`, etc.

**Scan flow:**
1. GitHub Actions cron (2 AM UTC daily) → POSTs to `/api/cron/lightweight-scan` on Railway
2. Endpoint calls `enqueueLightweightScan()` → creates a `scanRun` + queues one `scanJob` per brand
3. An in-process worker (inside the Next.js server) polls the queue every 1s, processes jobs serially with 60s timeout each
4. For each job: run scan, insert row, compute changelog diffs vs. previous scan, write confirmed changes
5. When queue drains, run drift checks (anomaly detection), mark run complete

### 3.3 Current data shape (what we actually have today)

Live API returns:
```
totalBrands: 1006
scannedBrands: 1006
brandsBlocking: 36 (brands blocking at least one agent)
brandsFullyOpen: 970
avgBlockedAgents: 0.1
percentFullyOpen: 96
```

**This is a problem.** 96% of brands don't block anything. The average brand blocks 0.1 agents. The "data" we publish is mostly "nobody cares, everyone's open." There's no FOMO because there's nothing to be afraid of. The most recent changelog is 500 entries of "no_rule → allowed" transitions at H-E-B — technically true, narratively uninteresting.

---

## 4. What is Broken Right Now (Immediate)

The daily scraper has been silently broken for 5 days. I only noticed because the changelog page showed 2026-03-30 as the most recent entry.

### 4.1 The specific failure chain

1. On 2026-03-30, scan run #2 started. Got through 927/1006 brands. Then the Railway container died (deploy, OOM, platform maintenance — unclear).
2. The in-process worker died with the process. The run stayed marked `running` with 77 jobs still `queued`.
3. On 2026-03-31, GitHub Actions fired the daily cron → POST `/api/cron/lightweight-scan` → `enqueueLightweightScan()` → saw run #2 still `running` → returned **409 Conflict**: `"Scan run #2 is already in progress (75 jobs remaining)"`.
4. Same thing happened 2026-04-01, 04-02, 04-03, 04-04. Five consecutive daily cron failures.
5. Production `/api/scan-health` confirms: `workerActive: false`. The worker never came back after the first crash.

**Why the worker never came back:** `startScanWorker()` is called exactly once from `src/instrumentation.ts` on Next.js server boot. It calls `acquireLock()` which checks a SQLite-backed lock. If the lock looks fresh (< 2 min since last heartbeat), it silently gives up. **There is no retry loop.** One failed acquisition = worker is dead forever for that process lifetime.

**Why it silently blocks the cron:** `enqueueLightweightScan()` sees the stuck "running" run and throws 409 instead of detecting "this run has no heartbeat for 5 days, it's dead, abandon it and start fresh."

### 4.2 The deeper pattern

This is the second time the scan worker has broken production. Git history shows:
- Commit `324312c`: "Disable scan worker auto-start to fix production crash"
- Commit `c18d7dc`: "Fix scan worker production startup: delay 10s, ensure tables, non-fatal"
- Commit `6683f63`: "Add scan job queue, serial worker, and health dashboard"

The architecture has been patched twice and is about to need a third patch. The design assumes a long-lived server process. Railway containers are not long-lived. Every deploy, every OOM, every platform restart kills the worker. The code has **defenses against two workers** (lock) but **no defenses against zero workers** (no retry, no watchdog, no external health check that triggers restart).

### 4.3 Everything else that is silently broken or fragile

Poking at the admin surface area reveals a lot of scheduled jobs that rely on the same pattern:

- `daily-lightweight-scan.yml` (the broken one)
- `daily-scan.yml` (old Puppeteer scan, still scheduled, probably also broken)
- `weekly-full-scan.yml` (old Puppeteer weekly scan)
- `brand-discovery.yml` (LLM-driven brand expansion)
- `news-scan.yml` (competitive news ingestion)
- `content-generate.yml` (auto-generates social posts and infographics)

All of these post to `/api/cron/*` endpoints. None of them have health monitoring. None of them page anyone when they fail. I have no idea how many of these are currently broken.

**There is no alerting anywhere in the system.** The admin scan-health dashboard shows `workerActive: false` but it's a passive page — nobody's watching it.

---

## 5. The Business Model & Revenue Goal

### 5.1 Current pricing
- **Free:** Full brand index, latest scan data, matrix view, brand profiles, 5 most-recent changelog entries
- **Pro ($100/mo):** 90+ days historical, full changelog across all brands, CSV/JSON export, comparisons, API access, email alerts

### 5.2 Target: $30-50k MRR in 6 months

At $100/mo Pro:
- $30k MRR = **300 paying customers**
- $50k MRR = **500 paying customers**

At 2% free-to-paid conversion (standard PLG assumption, maybe optimistic for a data product): need 15k–25k free users actively using the index.

### 5.3 Why this might work
- Category is greenfield. Competitors are early-stage or adjacent.
- 96% gross margins at scale (~$1,285/mo operating cost at $30k MRR)
- Breakeven is literally 4 customers
- Flat pricing, no sales calls, no lock-in, no implementation — all differentiators against enterprise tooling
- Data product with daily cadence → natural content/newsletter distribution loop
- Three simultaneous buyer personas (commercial, technical, AI) = wider funnel

### 5.4 Why this might not work
- **Who actually pays $100/mo for robots.txt tracking?** My original ICP was DTC brands, but a $20M DTC brand does not care about 90 days of historical robots.txt data. They care about "am I fixing this?" The new product answers "what does everyone else look like?"
- **Real Pro ICP is probably different:** agent companies, payment infra, platform companies, analysts, VCs. These buyers have bigger budgets ($100 is trivial) but smaller TAM and I'm not reaching them with current GTM.
- **Free tier may be too generous.** If you can see the full latest snapshot of every brand for free, what's the upgrade trigger? "90 days of history" is weak unless the data moves enough to matter.
- **Data novelty may not compound.** Robots.txt rules don't change often. If the changelog is mostly boring, there's no reason to come back daily.
- **Content distribution is cold.** Old Content Engine was built around "brand X scored 23/100" — visceral, shareable. New content is "brand X platform changed from unknown to Shopify" — not shareable.

### 5.5 The buyer personas I need to serve (founder stated)
1. **Commercial** (e-commerce ops, growth, digital shelf) → wants: "is my competitor doing something I'm not?" "is my category changing?" "am I exposed?"
2. **Technical** (engineers, platform teams, devrel) → wants: "which agents work on Shopify vs Salesforce Commerce?" "what's the CDN distribution look like?"
3. **AI/agent builders** (people shipping shopping agents) → wants: "which sites will my agent actually work on?" "who's blocking me?"

**These three personas need different framings of the same data.** One product, three narrative wrappers. Currently the site speaks to #1 loosely, ignores #2 and #3 almost entirely.

---

## 6. GTM & Distribution Strategy (stated goals)

The founder's stated GTM requirements (no wiggle room):
- **SaaS only.** No demos, no calls, no consulting.
- **Educate** — most buyers don't know they should care yet. The category doesn't exist in their head.
- **Induce FOMO** — "your competitors are moving, you're not"
- **No-brainer offer** — clear value, low friction, obvious upgrade path.

Channels the old GTM doc proposed (pre-pivot, may or may not still apply):
1. Content + SEO (state of agentic commerce, how-to guides, brand spotlights)
2. LinkedIn organic (daily posts, data insights, infographics)
3. Strategic partnerships (Shopify Plus partners, agencies, newsletters, conferences)
4. Product-led growth (free scores → shareable → competitive pressure → upgrade)
5. Outbound (personalized emails to brands with poor data)

### Problems with this GTM under the new product:
- **PLG loop assumed the score was shareable.** Scores are shareable ("we got a 42/100 😬"). Signal snapshots are not ("our robots.txt has no explicit rule for ClaudeBot" — who shares this?).
- **SEO landing pages assumed each brand had a score to rank for.** Brand pages still need to be rewritten.
- **Outbound angle ("your site scores 23/100") is dead** with the pivot. New angle would be "we noticed your robots.txt changed" — lower urgency.
- **LinkedIn content calendar was built around score drama** ("Nike vs Adidas: who's more AI-ready"). New content is data commentary, which is lower-engagement unless the data has narrative.

### What might actually work
- **Changelog as newsletter.** Daily/weekly email: "here's what moved in agentic commerce." Audience = all three personas. Free lead magnet.
- **Category reports.** "State of agentic commerce in beauty" = PDF download = email capture = drip to Pro.
- **X/Twitter micro-content.** "Today [Brand] started blocking ClaudeBot." Low-effort, high-velocity posts.
- **API-as-content.** "We have public data for 1,006 brands" → target agent builders and researchers with API examples and free tier.
- **Embedded distribution.** Free widget/badge ("powered by ARC Report") that brands can put on their site → passive distribution.
- **Partnership with agent infrastructure companies** (Rye, Firmly, Stripe ACP team) to surface ARC data inside their dev tools.

---

## 7. Technical Architecture Details

### 7.1 Stack
- Next.js 16 (App Router)
- Tailwind CSS 4
- SQLite + Drizzle ORM (file on Railway volume)
- better-sqlite3
- Puppeteer + stealth (old heavy scanner, still deployed)
- Anthropic SDK (Claude Vision — old visual agent, still deployed)
- Stripe (live, working)
- Resend (email, wired but not actively sending)
- Docker on Railway (Singapore region)
- GitHub Actions for scheduled jobs

### 7.2 Key files (post-pivot)
```
src/lib/scanner/lightweight-scanner.ts   # HTTP-only scanner
src/lib/scanner/scan-worker.ts           # In-process worker (broken)
src/lib/scanner/changelog-engine.ts      # Diff + two-tier confirmation
src/lib/scanner/drift-detector.ts        # Anomaly detection
src/lib/db/schema.ts                     # Drizzle tables
src/lib/db/queries.ts                    # All DB access
src/instrumentation.ts                   # Starts worker on boot (once)
scripts/daily-lightweight-scan.ts        # Standalone CLI version
src/app/api/cron/lightweight-scan/route.ts  # Cron trigger endpoint
```

### 7.3 Legacy code still deployed
Heavy Puppeteer pipeline, visual agent, scoring engine, 10 AI agent profiles, compatibility projector, report generator, compare page, instant-check, most of the content studio, infographic renderer, agent-replay, newsfeed ingestion. All still in the repo, some still scheduled, much of it probably broken.

### 7.4 Architectural fragility (beyond the current failure)

**In-process worker on ephemeral containers.** The scan worker runs inside the Next.js server process via `setInterval`. Railway containers restart on deploy/OOM/platform events. Worker dies → no self-heal → scans stop. Lock mechanism only protects against double-workers, not zero-workers.

**No watchdog / alerting.** Nothing notifies me when the worker dies, a cron fails, a scan errors, or a deploy breaks something. I find out days later by visual inspection. This is the biggest operational risk for a solo operator.

**Multiple scheduled jobs, zero observability.** 7 GitHub Actions workflows, multiple Railway endpoints, one admin dashboard that tells you status only if you look at it.

**Single SQLite file on a single Railway volume.** No backup, no replication. If the volume fails, all scan history is gone.

**Scan correctness is untested.** The two-tier confirmation logic (immediate vs. requires-2-scans) has no tests. Drift detector has no tests. A silent bug could publish wrong data for weeks and I'd never know.

**Deploy story is "push to main, hope it deploys."** No staging environment, no smoke tests post-deploy, no rollback plan.

---

## 8. Legacy & Dead Weight (Areas I Haven't Addressed)

The pivot left a lot of infrastructure behind. This is probably confusing the codebase and slowing down changes.

### 8.1 Code/pages that should probably be killed or rewritten
- `src/app/brand/[slug]/page.tsx` — still the old score-centric brand report page
- `src/app/compare/*` — compared brands by score, broken without scores
- `src/app/instant-check/*`, `src/app/submit/*` — old submission flow, no longer fits
- `src/app/agents/*` — explained the 10 AI agent profiles that no longer exist
- `src/app/guide/*`, `src/app/methodology/*` — score methodology
- `src/app/landscape/*` — category rollups of scores
- Old scanner: `src/lib/scanner/browser-agent.ts`, `visual-agent.ts`, `accessibility-agent.ts`, `feed-agent.ts`, `data-agent.ts`, `scan-orchestrator.ts`, scoring engine
- Content studio: built entirely around generating score-based infographics. Most templates don't work without scores.
- Newsfeed, outreach, brand-pipeline, intel — admin tooling that assumed the old workflow

### 8.2 Features that were built but never shipped / barely used
- Agent Replay (scroll-driven visualization of how an agent navigates a site)
- PDF export
- Email capture + drip sequences
- Threshold alerts
- Brand claiming flow (customer signs up and claims their brand)
- Sitemap.xml generation (built, possibly not live)
- Price consistency checking (Feed Agent)

### 8.3 Decisions I've been avoiding
- **Do I delete the old scoring code entirely or keep it for a future "certification" feature?** It's ~15-20k LOC.
- **Do I kill the legacy pages (/guide, /methodology, /agents) or rewrite them?** They have SEO juice and backlinks.
- **Do I keep the Content Engine?** It's powerful but built for a dead narrative.
- **Do I keep the newsfeed and outreach workflow?** Built for old product but could be repurposed.

---

## 9. The ICP Tension (Biggest Strategic Question)

The old product had a clear ICP: DTC brands, $5-50M revenue, Head of E-commerce, pays $79-149/mo to fix their site.

The new product's natural ICP is different:
- **Agent builders** (OpenAI, Perplexity, Amazon, Anthropic, startups) — want "where can my agent transact?"
- **Platform/infrastructure companies** (Stripe, Shopify, Rye, Firmly, BigCommerce) — want "what's happening in our ecosystem?"
- **Analysts/VCs/researchers** — want "how is the category moving?"
- **Competitive intelligence users at brands** — want "what are my competitors doing?"

**The pivot changed the customer, but the pricing and GTM weren't adjusted.**

- $100/mo is too low for enterprise buyers (Stripe/Shopify would pay $2-10k/mo for this data)
- $100/mo is probably too expensive for individual analysts/researchers
- $100/mo is probably fine for competitive intel at brands, but that persona has to be reached through outbound or LinkedIn — and I can't do outbound because no consulting calls.

**Strategic options:**
1. Go cheap ($15-30/mo) to maximize volume and content distribution, accept that enterprise buyers who want the data will find me eventually
2. Go expensive ($500-2000/mo) to match enterprise buyer expectations, do sales-led or high-touch content to reach them
3. Split tiers: $29/mo "Reader" (individual/analyst), $299/mo "Team" (brand comp intel), $1500/mo "API/Enterprise" (platforms/agent builders)
4. Stay at $100/mo, hope all three personas fit

My gut says option 3 but it may be premature complexity when nothing has proven to convert yet.

---

## 10. Blind Spots I Want You to Hit

Things I think are underexplored and I want a second opinion on:

### 10.1 Is the data even interesting?
96% of brands are fully open. Average brand blocks 0.1 agents. The changelog is mostly no-op transitions. **If the data is boring, the product is boring.** Do I need to:
- Add more signals (response times, checkout flow signals, cart API detection) to make data richer?
- Shift from "daily snapshot" to "meaningful change detection" (don't publish when nothing moves)?
- Add qualitative layer (editorial commentary on data) — contradicts "pure data" positioning?
- Accept the data is what it is and monetize edge cases (the 4% who do block)?

### 10.2 Is the category real, or is this ahead of demand?
- Agentic commerce is real (84M/wk ChatGPT shopping queries, $70B Cyber Week GMV with AI involvement, $1-5T McKinsey forecast to 2030).
- But **demand for tracking / intelligence about it** is unproven. Do brands actually care about their robots.txt posture? Will they care in 6 months?
- Competitor tracker data (Aido, ForkPoint, AgentReadyHQ, UCP.tools, AIO Ready) suggests nobody's gotten traction yet. Is this because the category is too early, or because the products aren't good enough, or both?

### 10.3 Is the free tier correctly calibrated?
- If free shows full latest snapshot, what creates the upgrade urgency?
- Should historical data move to free (to pull more traffic for SEO) and Pro gate only on actions (exports, alerts, API)?
- Should brand profiles be gated more aggressively?
- Should the default changelog view be teased more (e.g., 1 free entry per day instead of 5)?

### 10.4 Is the scanner architecture right for the business?
Given the founder's time constraint + solo operation:
- In-process worker: fragile, broken twice.
- Alternative A: external cron service (GitHub Actions) runs the scan **synchronously** via the endpoint or SSH. No worker, no queue, no lock. 5-10 min scan fits in a 15-min action budget.
- Alternative B: move to a proper queue (Railway has Postgres add-on, could use it as a queue)
- Alternative C: serverless functions (Vercel crons) with per-brand timeout

Which has the lowest ops burden for a solo founder?

### 10.5 Is the positioning reaching all three buyer personas?
Currently the site speaks to "competitive intelligence buyers" softly. It doesn't speak to:
- **Engineers** (no technical docs, no API examples on site, no dev-focused content, no "how to check your own site" tools)
- **Agent builders** (no mention of why agent companies would use this data, no integration examples, no free API key flow)

Should the site have three distinct surfaces (one per persona) or one narrative that threads through?

### 10.6 Legal / data rights
- Publishing "Brand X blocks ClaudeBot" is factually verifiable. Low risk.
- Publishing "Brand X has a weak agentic posture" is editorial. Higher risk.
- Publishing a score was higher risk still.
- **But the new positioning removes legal risk in exchange for narrative interest.** Am I trading too much downside protection for too little upside?

### 10.7 Time math
Solo founder. Limited hours/week. Currently spending a non-trivial fraction of those hours debugging infrastructure.
- If scanner keeps breaking 1-2x/month, that's days of lost time.
- If I rebuild the scheduler properly, that's days of upfront work.
- **What's the right architectural investment vs. "just hack it and watch it manually"?**

### 10.8 Distribution / content muscle
I have zero content output currently. The old Content Engine can auto-generate daily infographics but it's wired to dead data. Options:
- Rebuild Content Engine for new signal narratives (time investment)
- Manual LinkedIn/X posting (time investment, doesn't scale)
- Ghost-newsletter: auto-generated daily/weekly email from changelog (probably the right thing)
- Accept I have no content strategy until the product is solid

### 10.9 Pricing psychology
$100/mo flat. But:
- The free tier is loud (everything that's latest)
- The Pro tier is quiet ("history + exports + alerts")
- No upgrade storytelling on the site
- No "upgrade wall" moments in the UX
- No urgency / FOMO in-product

How do I insert FOMO into a data product without being manipulative?

### 10.10 Moat
- Data isn't proprietary — any competitor can scan the same brands
- Spec (agent-commerce.json) has zero adoption
- Brand list is easy to replicate
- **What's the moat?** Speed of distribution? Brand trust? Data coverage? Narrative ownership?

---

## 11. The Founder's Situation (Context for Recommendations)

- Solo operator, limited hours/week
- Has pivoted twice in 3 weeks, may be near the edge of pivot-fatigue
- Technically capable, ships fast, but can't run a team and can't do sales calls
- Has the code infrastructure of a much bigger product (12 admin pages, 5-agent scanner, content engine, newsfeed, outreach) built for a now-dead positioning
- Needs the scraper to "just work" for weeks at a time without attention
- Wants a real SaaS business ($30-50k MRR in 6 months) not a lifestyle project, but also wants to protect time
- Stated explicitly: **"my time is limited and I can't keep dealing with the scraper breaking like it just did"**

**Read between the lines:** the founder is worried they've built a house of cards. The daily scraper breaking silently for 5 days is the symptom. The question underneath it is "is my product + architecture + strategy actually viable for a solo operator, or am I carrying too much complexity?"

---

## 12. Specific Questions for the Reviewer

1. **Should I keep the pivot to signals/changelog, or go back to scoring?** The score was the hook. The signals are the data. Are they reconcilable?

2. **Is the three-persona targeting (commercial + technical + AI) realistic at my scale, or should I pick one?**

3. **At $100/mo flat, am I undercharging the real buyer and overcharging the casual one?** Would splitting tiers help or just add complexity?

4. **Is the Railway + in-process-worker architecture the right choice for a solo operator?** Or should I move to a simpler synchronous cron (GitHub Actions runs the scan itself, no worker)?

5. **How much legacy code should I delete right now?** Deleting reduces cognitive load but takes time. Keeping it makes iteration slower but preserves optionality.

6. **Is "daily changelog" actually interesting enough to drive a product, or do I need to add commentary / editorial / insights layer on top?**

7. **What's the highest-leverage 2-week sprint right now** — rebuild the scraper robustly, ship the new brand page, fix GTM/content, or something else entirely?

8. **What would a second pair of eyes notice about this project that I've stopped seeing?**

---

## 13. Appendix — Quick Facts

| Fact | Value |
|------|-------|
| Domain | arcreport.ai |
| Hosting | Railway (Singapore) |
| Stack | Next.js 16, Tailwind 4, SQLite + Drizzle, Puppeteer (legacy), Stripe |
| Brands tracked | 1,006 |
| Brands blocking ≥1 agent | 36 (3.6%) |
| Avg blocked agents per brand | 0.1 |
| Scan cadence (new) | Daily, HTTP-only, ~5-10 min |
| Scan cadence (old) | Weekly, Puppeteer, full journey |
| Pricing | Free + Pro $100/mo |
| Scan worker status (prod) | **DOWN since 2026-03-31** |
| Last successful scan | 2026-03-30 |
| Revenue | Not disclosed in this doc, but Stripe is live |
| MRR target | $30k (6 months), $50k (stretch) |
| Customers needed at $100/mo | 300-500 |
| Founder bandwidth | Solo, time-constrained |
| Sales model | Self-serve SaaS only, no calls |

---

**End of briefing. Please push back hard on any of this.**
