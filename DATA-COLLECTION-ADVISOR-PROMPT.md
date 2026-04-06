# ARC Report — Data Collection & Accuracy Review

I need expert feedback on the data collection system behind ARC Report (arcreport.ai). We're about to ship paid monitoring features (watchlists + daily change alerts), and I need confidence that the data is accurate enough to charge money for. If a paying customer gets a false alert that "Nike just blocked ClaudeBot" and forwards it to their client, we're dead.

This document explains exactly how we collect data, what's working, what concerns me, and where I suspect blind spots exist. Please be technical and direct.

---

## The Founder Situation

- Solo founder, bootstrapped, limited time
- I built this with AI coding tools (Claude Code, Codex) over ~6 weeks
- The scanner runs unattended daily on Railway (Singapore region)
- I have no QA process, no test suite for scanner accuracy, no manual validation workflow
- I'm about to ship paid alerts ($99/mo) based on this data

---

## The Scanner Architecture

### What It Is
A lightweight HTTP-only scanner. No browser automation, no Puppeteer, no AI API calls in the scan loop. It makes ~25 HTTP requests per brand and runs 1,006 e-commerce brands in about 4 minutes with a 97% success rate.

### How It Runs
- **Trigger:** GitHub Actions cron at 2 AM UTC → hits a Railway endpoint
- **Execution:** Fire-and-forget — endpoint returns immediately, scan runs async in-process
- **Concurrency:** 40 brands in flight simultaneously via a worker pool (not batches)
- **Per-brand timeout:** 60 seconds (covers internal retries)
- **Heartbeat:** Updates a DB timestamp every 30 seconds so dead processes are detected within 3 minutes
- **Stale recovery:** Any "running" scan with no heartbeat for >3 min is auto-abandoned on next run

### What It Collects Per Brand

**1. robots.txt (2 attempts, 10s timeout each)**
- Fetches `{url}/robots.txt` with a custom user-agent
- Rejects HTML responses (catches WAFs serving error pages instead of robots.txt)
- Parses per-agent rules for 9 AI agents: GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, Google-Extended, CCBot, Amazonbot, Bingbot
- For each agent, checks if the agent's `User-agent:` section contains `Disallow: /`
- Returns: `found: boolean`, `blockedAgents: string[]`, `allowedAgents: string[]`

**2. Per-agent user-agent access testing (16 requests, 5s timeout each, NO retry)**
- Fetches the homepage with a Chrome user-agent to establish a content-size baseline
- Then fetches homepage with each of 8 AI agent user-agent strings
- Compares response status, body size, and content against 19 bot-block regex patterns
- Verdict per agent:
  - `blocked` — HTTP 403/429, or 503 with bot-challenge patterns, or body matches block patterns
  - `degraded` — content < 25% of Chrome baseline size
  - `allowed` — HTTP 2xx-3xx with normal content
  - `unknown` — timeout or network error

**3. Structured data (from homepage HTML)**
- JSON-LD: regex extraction of `<script type="application/ld+json">` blocks
- Schema.org Product: checks `@type` for Product/ProductGroup/etc.
- Open Graph: regex extraction of `<meta property="og:...">` tags

**4. Discovery signals**
- Sitemap: checks robots.txt `Sitemap:` directives + common paths (`/sitemap.xml`, etc.)
- Product feed: checks 5 common feed paths, validates XML content

**5. Emerging agent-readability files**
- `llms.txt`: fetches `/llms.txt`, rejects HTML soft-404s, measures bytes/link-count/H1/summary presence
- Agent declaration file: checks `/agents.txt`, `/agents-brief.txt`, `/.well-known/agents.txt` sequentially
- UCP endpoint: checks `/.well-known/ucp`

**6. Infrastructure fingerprinting**
- Platform: heuristic detection from HTML/headers (Shopify JS snippets, BigCommerce references, etc.)
- CDN: header-based (Cloudflare, Akamai, Fastly, CloudFront, Vercel)
- WAF: header + HTML pattern matching (Cloudflare, DataDome, PerimeterX, Imperva, Akamai)
- Security headers: HSTS, CSP, X-Frame-Options, Permissions-Policy presence
- Homepage response time in ms

### How Agent Status Is Derived

The final per-agent status published on brand pages combines robots.txt rules with UA test results:

| robots.txt says | UA test says | Final status | Meaning |
|---|---|---|---|
| Disallow: / | blocked (403) | **blocked** | Policy block confirmed by enforcement |
| Disallow: / | allowed (200) | **blocked** | Policy block, not yet enforced |
| No rule | blocked (403) | **restricted** | No policy block, but WAF/CDN stops the agent |
| No rule | allowed (200) | **allowed** | Open access |
| Allow: / | timeout | **allowed** | robots.txt takes precedence over timeout |
| No rule | timeout | **inconclusive** | Can't determine |

### How Changes Are Detected and Published

**Two-tier confirmation system:**

**Tier 1 — Immediate publication (no buffer):**
- robots.txt presence (found vs not found)
- Per-agent robots.txt rules (blocked/allowed/no_rule per agent)
- Rationale: these are text-file diffs — if the rule changed, it changed

**Tier 2 — Requires 2 consecutive scans to confirm:**
- UA HTTP verdict changes (allowed/blocked/degraded per agent)
- Blocked agent count (aggregate)
- CDN/WAF detection changes
- Platform detection changes
- Structured data presence (JSON-LD, Schema, OG, feeds, llms.txt, UCP)
- Rationale: these are inferences that can flicker due to timeouts, WAF behavior, or CDN caching

**Confirmation logic for Tier 2:**
1. First scan detects a change → insert "pending change" record, do NOT publish
2. Second consecutive scan shows the same change → confirm and publish to changelog
3. Second scan shows a different value → reset pending (flicker detected)
4. Second scan shows the value reverted to original → delete pending (transient noise)

**Noise filtering:**
- HTTP 429 (rate limit) responses are excluded from UA verdict comparison
- HTTP 0 / timeout responses are excluded
- "unknown" verdicts never trigger a change entry

### Post-Run Anomaly Detection (Drift Detector)

After each scan completes, a drift detector runs and flags anomalies:

| Check | Warning threshold | Critical threshold |
|---|---|---|
| Completion rate | < 95% | < 80% |
| Inconclusive/failed rate | > 10% | > 25% |
| Volume anomaly (>X% of brands changed same field) | — | > 20% |
| Flagship brand changes (51 hardcoded brands) | Any change | — |

The drift report is stored in the scan run record and visible at `/api/scan-health`. It does NOT block publication — it only flags for human review.

---

## What's Working

1. **Reliability.** The scanner runs daily, finishes in ~4 minutes, 97% success rate. Fire-and-forget architecture means no babysitting. Heartbeat detection catches dead processes within 3 minutes. Staleness alerts email me if a scan hasn't completed in 26 hours.

2. **The two-tier confirmation system.** For Tier 2 signals (UA verdicts, CDN/WAF, structured data), requiring two consecutive scans to confirm filters out most transient noise. This is the right design.

3. **Drift detection catches systemic issues.** The latest scan's drift report flagged 72 flagship brand changes, which is how I discovered the robots.txt accuracy problem (see below). The detector works as an early warning system.

4. **Structured data detection is reliable.** JSON-LD, Schema.org, Open Graph parsing is regex-based and deterministic. These signals don't flicker.

5. **Infrastructure fingerprinting is stable.** Platform/CDN/WAF detection from headers is consistent scan-to-scan. Low noise.

6. **llms.txt and agent declaration file detection is solid.** Simple presence checks with HTML soft-404 rejection. Low false-positive risk.

7. **Cost.** The entire scanning operation costs essentially nothing — ~25 HTTP requests × 1,006 brands = ~25,000 requests/day. No browser, no AI API, no headless Chrome.

---

## Where Our Concerns Are

### Concern 1: robots.txt fetch failures are published as real changes (CRITICAL)

When a robots.txt fetch fails (timeout, CDN block, DNS issue), the scanner treats it as `found: false`. This triggers a cascade:
- `robots.txt presence` changes from `true` to `false`
- All 9 per-agent rules change to `no_rule` (no content to parse)
- Because robots.txt rules are **Tier 1 (immediate publication)**, ALL of these get published to the changelog without confirmation
- Next scan, robots.txt is back → 10 MORE reverse entries

**Evidence:** The latest drift report showed 72 flagship brand changes. Best Buy, Walmart, Target, Amazon, Louis Vuitton, Allbirds all showed `robots.txt presence: true → false → true` in consecutive scans. These mega-brands did not actually change their robots.txt.

**Root cause:** The scanner cannot distinguish "file genuinely doesn't exist (HTTP 404)" from "fetch failed (timeout/CDN block)." Both collapse to `found: false`.

### Concern 2: robots.txt wildcard rules are ignored (HIGH)

The parser only checks for agent-specific `User-agent:` sections. If a site uses only `User-agent: * / Disallow: /` to block all bots, every agent is incorrectly reported as "allowed" or "no_rule."

This is a silent false negative — we miss real blocking that's happening.

### Concern 3: UA access testing is non-deterministic (MEDIUM)

Each UA test has a 5-second timeout with zero retries. WAF/CDN behavior varies per request:
- JavaScript-based challenges may or may not fire
- Rate limits may trip mid-scan
- CDN edge caching may serve different responses

This means the same brand can show as "blocked" on one scan and "allowed" on the next, depending on the CDN's mood. The Tier 2 confirmation system mitigates this but doesn't eliminate it — it just means it takes 3+ scans of consistent behavior to publish, instead of catching a real change in 2.

### Concern 4: Single scan location (MEDIUM)

All requests originate from one Railway server in Singapore. This means:
- CDN routing may serve different content than what a US-based agent would see
- IP reputation could degrade over time (same IP hitting 1,006 sites daily)
- Some brands may geo-restrict or rate-limit Singapore traffic differently

We have no visibility into whether our scans represent what agents actually experience from other regions.

### Concern 5: No ground-truth validation (MEDIUM)

We have never manually verified scan results against reality. I don't know, for any specific brand, whether our data matches what you'd see by manually visiting the site and checking robots.txt + sending curl requests as GPTBot.

---

## Where Our Blind Spots Are

### Blind Spot 1: robots.txt parsing edge cases
- Trailing comments: `Disallow: / # block all` — does our regex catch this?
- Multiple Disallow rules in one agent section — we only check for the first
- Case sensitivity in directive names (we're case-insensitive on User-Agent but unclear on Disallow)
- Crawl-delay directives — we ignore these entirely
- Sitemap directives in robots.txt — we parse these but don't validate them

### Blind Spot 2: What "degraded" means
The UA test can return a `degraded` verdict (content < 25% of Chrome baseline), but this verdict is **completely ignored in the final agent status derivation.** A degraded response could mean the site serves a lighter mobile page, an AMP version, or a WAF challenge page. We don't know which, and we don't report it.

### Blind Spot 3: Product page testing
The scanner fetches both homepage and product page with each UA string, but the **final agent status only uses the homepage result.** Product page verdicts are collected and stored in `resultJson` but not surfaced or used in the changelog. A brand that allows agents on the homepage but blocks them on product pages would appear as "allowed."

### Blind Spot 4: Temporal patterns
The scanner runs once per day at 2 AM UTC. If a brand's WAF behavior changes during business hours (e.g., tighter rate limits during peak traffic), we'd never see it. We have no visibility into intra-day variation.

### Blind Spot 5: The confirmation system's blind spot
The two-scan confirmation requires the SAME change to appear in two consecutive scans. If a brand's WAF flickers (blocked → allowed → blocked → allowed), the pending state resets each time and the change never gets confirmed. Genuinely intermittent blocking looks like "no change" in our data.

### Blind Spot 6: We don't know our false positive/negative rate
Without ground-truth validation, we can't quantify accuracy. We don't know if it's 95% accurate or 75% accurate. We're making product decisions (paid alerts) without knowing the error rate.

---

## What I Want Your Opinion On

1. **Is this data accurate enough to charge for monitoring + alerts?** Given the concerns above — especially the robots.txt cascade problem and the UA testing non-determinism — should I ship paid alerts now, or fix the accuracy issues first?

2. **What's the minimum accuracy bar for a paid data product?** BuiltWith has false positives too (tech detection is heuristic). SecurityScorecard has noise. What error rate is acceptable for a market intelligence tool?

3. **Which accuracy fixes have the highest ROI?**
   - Fix robots.txt "fetch failed" vs "not found" distinction
   - Move robots.txt presence to Tier 2 confirmation
   - Fix wildcard `User-agent: *` parsing
   - Add retry logic to UA testing
   - Manual ground-truth validation of 20-30 brands
   - Add a second scan location
   - Something else?

4. **Should the drift detector block publication instead of just warning?** Currently, flagship brand anomalies are published to the changelog with a warning in the drift report. Should they be held pending human review?

5. **How do other data products handle accuracy at this stage?** Am I over-indexing on perfection for a market that doesn't exist yet, or is this a "fix before you ship" situation?

6. **Is the single-IP-from-Singapore a real problem or a theoretical one?** Should I invest in multi-region scanning, or is it premature?

7. **What accuracy blind spots am I not seeing?** What would you check that I haven't thought of?

---

## Technical Quick Reference

| Component | Technology |
|---|---|
| Scanner | Custom TypeScript, HTTP-only (node fetch) |
| Retry logic | Exponential backoff, 2-3 attempts for most checks |
| UA testing | 8 agents × 2 pages, 5s timeout, no retry |
| Database | SQLite via Drizzle ORM on Railway volume |
| Hosting | Railway (Singapore region), Docker |
| Scheduling | GitHub Actions cron → fire-and-forget endpoint |
| Monitoring | Heartbeat (30s interval), staleness alert (6-hourly), drift detector |

| Metric | Value |
|---|---|
| Brands scanned | 1,006 |
| Scan duration | ~4 minutes |
| Success rate | 97% |
| Signals per brand | ~25 HTTP requests |
| Changelog confirmation | Tier 1 (immediate) for robots.txt, Tier 2 (2-scan) for everything else |
| Daily operating cost | Essentially $0 (HTTP requests only) |
| Known false positive evidence | 72 flagship brand false changes in latest drift report |
