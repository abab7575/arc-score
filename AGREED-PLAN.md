# ARC Report — Agreed Plan (Consolidated Feedback + Execution)

**Updated:** 2026-04-06
**Status:** Pre-revenue. Scanner live, product live, zero paying customers.
**Repo:** /Users/andybryn/projects/arc-score
**Stack:** Next.js 16 + Tailwind 4 + SQLite/Drizzle + Railway (Singapore) + GitHub Actions
**Deploy:** `git push origin main` → Railway auto-deploys from main branch (Docker build)

> **FOR A NEW CLAUDE SESSION:** This file is the complete execution brief. Read it top to bottom, then execute the plan in the IMPLEMENTATION APPENDIX at the end. The plan was agreed upon after 6 independent advisor reviews (3 on business model, 3 on data accuracy). Do not re-debate the strategy — execute it.

---

## PART 1: BUSINESS MODEL & VALUE PROPOSITION

### Three advisors reviewed. Here's what they said.

---

### Round 1 Feedback Summary

**Advisor #1 (strategic/structured):**
- BuiltWith framing "directionally correct but strategically incomplete"
- Position as "Market Intelligence & Drift Detection," not just a directory
- Target agencies first ($199/mo), then agent-infra companies, then DTC as long-tail
- Pricing: $49 Monitor / $199 Agency
- Gate history + alerts, not brand pages
- Priority: watchlists + alerts, pricing rewrite, outbound to 10 agent-infra companies
- Add "Claim this Brand" CTA on every brand page as lead-gen engine
- Stop targeting VCs/analysts. Commit to direction for 30 days.

**Advisor #2 (the "data monopolist" one):**
- "Three pivots in three weeks is Product Procrastination"
- Be "The Credit Score for Agentic Commerce" — move from "here is data" to "here is your standing"
- Agencies first, agent-infra second, analysts third
- Pricing: $99 Pro / $299 Agency — says $49 is "no man's land" for B2B
- Gate the changelog (history = primary value), comparisons (cross-market queries), and alerts
- Build a "Weekly Leaderboard" (Top 10 AI-Ready / Top 10 AI-Resistant) as distribution bait
- Bridge signals to outcomes: "Nike blocking GPTBot = invisible to 84M ChatGPT shoppers"
- SEO play: target "[Brand Name] AI bot access" keywords on 1,006 pages
- "State of AI Shopping 2026" report = more MRR impact than 10 API endpoints
- "You have the data. Now make people feel stupid for not having it."

**Advisor #3 (the most measured/pragmatic):**
- BuiltWith framing is correct. Stop pivoting. Ship this model.
- Agencies + mid-market DTC first. Agent-infra companies will drag you into enterprise — avoid for now.
- Pricing: $49 Monitor / $199 Team — says $49 is the impulse-buy sweet spot
- Medium upgrade wall: gate workflows (watchlists, alerts, exports), NOT the public index
- Priority: (1) watchlists + alerts, (2) pricing rewrite, (3) newsletter signup everywhere. Do ONLY these three.
- Free tier is your superpower — do not dilute it
- Add "claim your brand" flow
- Stop: pivoting every week, enterprise anything, assuming distribution happens magically
- "The data moat is real. The only thing missing is people seeing it."

---

### Where all three agree (the signal)

| Point | Consensus |
|---|---|
| BuiltWith model is correct | Lock it in |
| Stop pivoting, commit 30 days | Do it |
| Agencies are buyer #1 | Target them |
| Watchlists + alerts is the #1 feature | Ship this week |
| Distribution is the real bottleneck | Spend more time on this than code |
| Keep free tier generous (SEO engine) | Don't gate brand pages |
| Gate workflows, not lookups | Watchlists/alerts/history/exports behind paywall |

### Where they disagree (the decisions)

| Point | Decision | Reasoning |
|---|---|---|
| **Price** (#1: $49/$199, #2: $99/$299, #3: $49/$199) | **$99 Pro / $299 Agency** | Old $100-149 felt weak because FEATURES were weak, not the price. With watchlists + alerts, $99 is a different value prop. Agencies buying BuiltWith at $295-995 won't flinch at $299. Start high — easier to drop than raise. |
| **Agent-infra companies** (#1: target, #2: target, #3: avoid) | **Defer.** Put "Contact for API/Enterprise" on pricing page. Don't spend cycles on outbound. | Can't do enterprise sales solo. If they come to you, great. |
| **Newsletter** (#1: defer, #2: silent, #3: ship signup now) | **Ship the signup, not the infrastructure.** Add email capture everywhere. Manual weekly send via Resend in 15 min. | /weekly page already exists as content source. |
| **Leaderboard** (#2: build it as distribution bait) | **Build it.** | Pure LinkedIn/X bait. Tag brands. People love/hate being on lists. Drives "claim your brand" flow. |

---

### Agreed Business Execution Plan

**Pricing tiers:**
- **Free:** Full public index, brand pages, matrix, 5 changelog entries, basic weekly digest, rate-limited public API
- **Pro ($99/mo):** Watchlists (up to 10 brands), daily change alerts (email), full changelog history (90+ days), CSV/JSON exports, personal API key (10k req/day)
- **Agency ($299/mo):** 50 watchlists, Slack/webhook alerts, team seats (5), higher API limits (100k/day), competitor tracking groups, category diffs

**Upgrade wall:**
- Free changelog shows last 3 entries, rest blurred → "Upgrade for full history"
- "Track this brand" button on every brand page → Pro-gated
- "Save this view as watchlist" in matrix → Pro-gated
- Brand claiming flow → email capture → nurture to paid

**Distribution hooks:**
- Weekly leaderboard page (Top 10 AI-Ready / AI-Resistant brands) — social bait
- "Claim this Brand" CTA on all 1,006 brand pages — lead-gen
- Email capture on homepage, /weekly, brand pages
- SEO: optimize brand pages for "[Brand Name] AI bot access" / "[Brand Name] robots.txt ChatGPT"
- One "State of Agentic Commerce Q2 2026" blog post from index data

**Stop doing:**
- Pivoting the model
- Considering "all free + API only"
- Targeting VCs/analysts as primary buyers
- Enterprise/custom anything
- Building features before distribution

---

## PART 2: DATA COLLECTION & ACCURACY

### Three advisors reviewed the scanner architecture. Here's what they said.

---

### Round 2 Feedback Summary

**Advisor #1 (the "Red Line" one):**
- Do NOT ship paid alerts with current robots.txt logic
- Distinguish Hard 404 from Soft Failure (timeout/5xx/WAF) — only "Robots.txt Removed" on definitive 404
- Use `robots-parser` NPM library instead of custom regex for wildcard handling
- Singapore IP is HIGH priority — use US-based proxy/Lambda for UA tests
- Move robots.txt to Tier 2
- Treat "degraded" verdict as "restricted" (WAF challenge detection)
- Ground-truth 20 brands weekly as "Golden Dataset"
- Product page gap: PDP blocking matters more to shopping agents than homepage
- Auto-kill alert emails if drift detector flags >5% brands
- 99.9% accuracy required for alerts
- "Fix the Cascade and the Wildcard, and you'll have the confidence to charge $99/mo with a straight face"

**Advisor #2 (most detailed/technical):**
- Do NOT ship yet — fix first
- Static lookups: 80-85% accuracy OK. Change alerts: <3-5% false positive required
- Fix #1 (critical): robots.txt fetch status — inspect HTTP status, carry forward previous known state on non-404 failures (4-6 hours)
- Fix #2 (critical): Wildcard User-agent: * parsing — implement correct spec precedence (2-3 hours)
- Fix #3 (high): UA testing retries — one retry on unknown/blocked (2 hours)
- Fix #4: Manual ground-truth on 30 flagships (1-2 hours)
- Drift detector should BLOCK publication for 51 flagship brands, not just warn
- Singapore IP is theoretical — defer 3-6 months
- UA string variance: match exact strings from OpenAI/Anthropic/Perplexity docs
- WAF-specific robots.txt behavior: log status/body for robots.txt failures
- Ship after fixes, not before
- "The scanner is already one of the cleanest solo-founder data pipelines I've seen. Two targeted fixes make it chargeable."

**Advisor #3 (comprehensive strategic + technical):**
- Do NOT ship yet — <1% error rate needed for critical signals
- Fix robots.txt fetch vs 404 distinction with retries + exponential backoff
- Move robots.txt presence AND rules to Tier 2 (unlike #2)
- Fix wildcard parsing
- Ground-truth 20-30 brands
- Ship watchlists AFTER accuracy fixes
- WAF challenge detection on 200 OK responses (blind spot)
- HTTP redirect chain handling
- Content negotiation headers (Accept-Language, Accept-Encoding)
- Historical data integrity — clean up false entries from cascade bug
- "For a market intelligence tool focused on Drift Detection, the minimum accuracy bar is high confidence in reported changes"

---

### Where all three agree (the signal)

| Point | Consensus |
|---|---|
| Do NOT ship alerts before fixing robots.txt cascade | **Fix first** |
| Fix robots.txt fetch-fail vs genuine-404 distinction | **#1 priority** |
| Fix wildcard `User-agent: *` parsing | **#2 priority** |
| Manual ground-truth validation (20-30 brands) | **Do it** |
| Scanner architecture is fundamentally sound | **Don't rebuild** |
| Watchlists + alerts ship AFTER accuracy fixes | **Sequence matters** |

### Where they disagree (the decisions)

| Point | Decision | Reasoning |
|---|---|---|
| **Singapore IP** (#1: fix now, #2: defer, #3: defer) | **Defer.** 97% success rate = not a real problem yet. Revisit when success rate drops or specific brands consistently fail. | Don't burn 4+ hours on proxy infra before product has paying customers. |
| **Accuracy bar** (#1: 99.9%, #2: <3-5%, #3: <1%) | **Target <3% false positive on changelog entries that become alerts.** <1% on robots.txt specifically. | 99.9% is aspirational. The fixes below get us to <3% realistically. |
| **Move robots.txt to Tier 2** (#1: yes, #2: unnecessary after fetch fix, #3: yes) | **Do it anyway.** Belt + suspenders. Costs 5 minutes. | Even after fixing fetch handling, a genuine Tier 2 buffer prevents edge-case noise. |
| **robots-parser library vs custom** (#1: use library, #2: mentions, #3: silent) | **Use a library.** Custom regex is how we got the wildcard bug. | Battle-tested parser handles comments, whitespace, multiple Disallow lines, Allow/Disallow precedence. |
| **Treat "degraded" as "restricted"** (#1: yes, #2: silent, #3: blind spot) | **Do it.** Degraded on a working site = WAF challenge page. | Simple change, eliminates a false-negative class. |
| **Product page verdicts** (#1: important, #2: later, #3: blind spot) | **Defer to post-launch.** Not blocking for paid alerts. | Nice differentiator once alerts ship. Not urgent. |
| **Drift detector should block flagships** (#1: auto-kill >5%, #2: block flagships, #3: block + email) | **Block flagship changelog entries pending review. Auto-email on trigger.** | Protects reputation without manual QA bottleneck on all 1,006 brands. |

---

### Agreed Technical Execution Plan

**Days 1-2: The two critical fixes**

1. **robots.txt fetch-fail handling**
   - After fetch, inspect HTTP status code BEFORE parsing
   - `200 + text/plain` → parse normally, `found: true`
   - `404` → genuine absence, `found: false`, rules empty
   - `403 / 429 / 5xx / timeout / network error` → treat as INCONCLUSIVE. Do NOT set `found: false`. Carry forward the previous scan's known state for this brand.
   - Add one retry with exponential backoff (2s, 5s) on transient failures before giving up
   - This single change eliminates the 72-flagship cascade

2. **Wildcard `User-agent: *` parsing**
   - Replace custom regex with `robots-parser` NPM library (or implement correct spec precedence)
   - For each of the 9 AI agents: check agent-specific section first → fall back to `User-agent: *` → default allow
   - Handle edge cases: trailing comments (`Disallow: / # block`), blank Disallow (= allow), multiple rules, Allow/Disallow precedence

3. **Move robots.txt presence to Tier 2 confirmation**
   - A presence change (found → not found or vice versa) must appear in two consecutive scans before publishing
   - 5-minute change, prevents cascade even if fetch handling misses an edge case

4. **Treat "degraded" as "restricted" in status derivation**
   - If UA test returns `degraded` (content < 25% Chrome baseline) AND robots.txt has no explicit block → mark as `restricted`
   - A stripped response from a working site is almost always a WAF challenge page

**Day 3: Validation**

5. **Manual ground-truth: top 30 flagship brands**
   - Manually curl each brand's robots.txt
   - Send requests with exact 9 agent UA strings + Chrome baseline
   - Compare results to DB
   - Document discrepancies, fix any remaining parser issues
   - This gives us the error-rate number we currently lack

6. **Run a clean scan cycle**
   - Verify drift report shows near-zero flagship changes
   - Confirm cascade is eliminated

**Day 4: Safety rails**

7. **Drift detector blocks flagship changelog entries**
   - If any of the 51 hardcoded flagship brands have a Tier 1 change, hold the entry as "pending" and email founder immediately
   - Founder reviews in <5 min (you already know these brands)
   - For the other 955 brands, keep current publish behavior

8. **Circuit breaker on alert emails**
   - If >5% of brands change the same field in one run, hold ALL alerts for that field
   - Auto-email founder with the anomaly details
   - Prevents mass false-alert emails if a systemic scanner issue slips through

9. **Clean up historical false entries**
   - Remove or flag the cascade-generated changelog entries from the runs that had the 72 flagship false changes
   - These pollute the changelog and will confuse paying customers looking at history

**Days 5-6: Ship the paid product**

10. **Watchlists + daily change alerts** (the retention loop all advisors agree on)
11. **Pricing page rewrite:** $99 Pro / $299 Agency, workflow-focused copy
12. **In-product upgrade CTAs:** brand pages, changelog, matrix

**Day 7: Distribution**

13. **Email capture:** homepage, /weekly, brand pages ("Get the weekly digest")
14. **"Claim this Brand"** button on every brand page
15. **First social post** with real data (leaderboard or notable brand movement)

---

## SUMMARY: THE SEQUENCE

```
DAYS 1-2:  Fix robots.txt (fetch handling + wildcard parsing + Tier 2 + degraded)
DAY 3:     Validate — ground-truth 30 brands, clean scan, verify drift report
DAY 4:     Safety rails — flagship blocking, circuit breaker, historical cleanup
DAYS 5-6:  Ship watchlists + alerts + pricing + upgrade CTAs
DAY 7:     Distribution — email capture, brand claiming, first social post
DAY 8+:    Weekly leaderboard, "State of Agentic Commerce" report, outbound to agencies
```

**Commit to this plan for 30 days. If no agency or DTC ops person pays by day 30, reassess.**

---

## WHAT TO STOP IMMEDIATELY

- Pivoting the business model
- Considering "all free + API only"
- Building features before accuracy fixes
- Targeting VCs/analysts/enterprise
- Assuming distribution happens because the data is cool
- Shipping alerts while the robots.txt cascade bug exists
- Worrying about multi-region scanning before having paying customers

---

## IMPLEMENTATION APPENDIX (For Claude Code Execution)

### What Has Already Been Done (Do Not Redo)

14 commits were shipped in a previous session (April 4-5, 2026):

```
8173944 Brand page: add hover explainers across the bold modules
3b8cad9 Brand page lower half: bold 1970s NASA × Tokyo retro rebuild
2536f04 Bump per-brand timeout back to 60s, concurrency to 40
bbc46b6 Purge score-era language from remaining public pages
9dc3501 Add /weekly — recurring intelligence surface
cbf7054 Add heartbeat-based stale-run detection
1ac0457 Make scan fire-and-forget, switch to concurrency pool
c31dd76 Add public API docs page and nav entry
64f9493 Delete legacy score-era pages and add 301 redirects
7174722 Align public copy to signal-first positioning and correct Pro price
053b4b4 Add 6-hourly scan staleness check
0f8f916 Add llms.txt quality signals and agent declaration file detection
baee9d4 Replace resident worker with one-shot scan execution
```

**Already done — do NOT redo:**
- Scanner architecture: one-shot fire-and-forget (no resident worker, no queue, no lock)
- Concurrency pool (40 workers, 60s per-brand timeout)
- Heartbeat-based stale detection (3 min threshold)
- 6-hourly staleness check workflow
- llms.txt quality signals + agent declaration file detection
- Brand page redesign (bold NASA retro: offset shadows, data-num typography, colored columns, terminal chrome)
- Public copy purged of score-era language
- Legacy pages deleted (/compare, /submit, /agents, /report, /instant-check, /methodology)
- 301 redirects for all deleted routes
- /weekly intelligence surface
- /docs public API page
- Navbar updated: Index · Matrix · Landscape · Changelog · Weekly · Docs · Pricing
- Homepage hero rewritten for signal-first positioning
- Price display updated to $100 (but will change to $99 in this sprint)

### Project Structure (Key Files)

**Scanner pipeline:**
```
src/lib/scanner/lightweight-scanner.ts   # Main HTTP scanner (~700 lines)
  → checkRobotsTxt()                    # THE FILE TO FIX: robots.txt fetching + parsing
  → testUserAgentAccess()               # UA testing (8 agents × 2 pages)
  → checkLlmsTxt()                      # llms.txt presence + quality
  → checkAgentsTxt()                    # Agent declaration file detection
  → runLightweightScan()                # Orchestrates all checks per brand

src/lib/scanner/run-scan.ts             # One-shot scan runner
  → runScanOnce()                       # Creates run, iterates brands, writes changelog
  → abandonStaleRuns()                  # Heartbeat-based stale detection

src/lib/scanner/changelog-engine.ts     # Two-tier change confirmation
  → processChangelog()                  # Entry point: compares current vs previous scan
  → processRobotsTxtChanges()           # Tier 1: immediate publication (THE PROBLEM)
  → processUaVerdictChanges()           # Tier 2: requires confirmation
  → processScalarChanges()              # Tier 2: requires confirmation

src/lib/scanner/drift-detector.ts       # Post-run anomaly detection
  → runDriftChecks()                    # Completion rate, volume anomaly, flagship checks

src/lib/scanner/fetch-with-retry.ts     # HTTP fetch with exponential backoff
```

**Database:**
```
src/lib/db/schema.ts                    # Drizzle schema (brands, lightweightScans, changelogEntries, pendingChanges, scanRuns, etc.)
src/lib/db/index.ts                     # DB connection + auto-migrations
src/lib/db/queries.ts                   # All DB queries (insertLightweightScan, getLatestLightweightScan, changelog queries, weekly queries, etc.)
  → insertLightweightScan()             # Writes scan row + derives agent status (THE FILE TO FIX: degraded handling)
```

**Product pages:**
```
src/app/brand/[slug]/page.tsx           # Brand readout page (bold design, ~920 lines)
src/app/pricing/page.tsx                # Pricing page (currently Free + $100 Pro)
src/app/changelog/page.tsx              # Public changelog
src/app/weekly/page.tsx                 # Weekly intelligence digest
src/app/docs/page.tsx                   # Public API docs
src/app/page.tsx                        # Homepage (index table)
src/app/matrix/page.tsx                 # Signal matrix
src/components/shared/navbar.tsx        # Nav: Index · Matrix · Landscape · Changelog · Weekly · Docs · Pricing
src/lib/stripe.ts                       # Stripe config (plans, prices)
```

**Cron / operations:**
```
.github/workflows/daily-lightweight-scan.yml    # Daily scan trigger (2 AM UTC)
.github/workflows/scan-staleness-check.yml      # 6-hourly freshness check
src/app/api/cron/lightweight-scan/route.ts      # Fire-and-forget scan endpoint
src/app/api/scan-health/route.ts                # Public health endpoint (uses getScanHealth from scan-worker.ts)
```

### The Bugs to Fix (Exact Code Locations)

**Bug 1: robots.txt fetch failure = "not found" (CRITICAL)**

File: `src/lib/scanner/lightweight-scanner.ts`, function `checkRobotsTxt()`

Current behavior: Any failed fetch (timeout, 403, 5xx, network error) returns `{ found: false, blockedAgents: [], allowedAgents: [] }`. This causes:
1. `robotsTxtFound` flips to `false` in the DB
2. All 9 per-agent rules become `no_rule`
3. Changelog engine publishes these as Tier 1 immediate changes
4. 10 false changelog entries per brand per incident

Fix: Inspect HTTP status code after fetch.
- `200 + text content` → parse normally
- `404` → genuinely not found, `found: false`
- `403 / 429 / 5xx / timeout / network error` → INCONCLUSIVE. Return a new status indicating "scan failed" so the caller can carry forward the previous scan's state instead of flipping to false.
- Add one retry with backoff (2s, 5s) specifically for robots.txt on transient failures.

The caller in `run-scan.ts` → `processOne()` needs to handle this: if robots.txt was inconclusive, use the previous scan's `robotsTxtFound` and `agentStatusJson` values for the robots-derived fields.

**Bug 2: Wildcard `User-agent: *` not parsed (CRITICAL)**

File: `src/lib/scanner/lightweight-scanner.ts`, function `checkRobotsTxt()`

Current behavior: Only checks for exact agent-name sections (`User-agent: GPTBot`, etc.). If a site only has `User-agent: * / Disallow: /`, all agents are reported as "allowed" or "no_rule."

Fix: Use the `robots-parser` NPM package (or similar) for spec-compliant parsing. It handles:
- Wildcard fallback (`User-agent: *`)
- Allow/Disallow precedence (longest match wins)
- Comments stripping
- Multiple rules per section
- Case insensitivity

For each of the 9 agents: check specific section first → fall back to wildcard → default allow.

**Bug 3: robots.txt presence is Tier 1 (should be Tier 2)**

File: `src/lib/scanner/changelog-engine.ts`, function `processRobotsTxtChanges()`

Current behavior: `robotsTxtFound` change is published immediately without confirmation.

Fix: Move the `robotsTxtFound` comparison to `processScalarChanges()` (Tier 2) or add it to the pending-change confirmation flow. A presence change must appear in 2 consecutive scans before publishing.

**Bug 4: "degraded" verdict ignored in status derivation**

File: `src/lib/db/queries.ts`, function `insertLightweightScan()` (around line 329-346 in the agent status enrichment logic)

Current behavior: If UA test returns `degraded`, the verdict is ignored — robots.txt status stands.

Fix: Treat `degraded` the same as `blocked` in the overlay logic. If verdict = `degraded` AND robots.txt has no explicit block → mark as `restricted` (WAF challenge page, not policy).

### New Features to Build

**Watchlists + Alerts (the core paid feature):**
- New DB table: `watchlists` (id, customerId, brandId, createdAt)
- New page: `/account/watchlist` — shows watched brands + recent changes
- "Track this brand" button on `/brand/[slug]` → Pro-gated (must be logged in with Pro plan)
- Daily alert cron: new GitHub Action that runs after the scan, queries watchlists × today's changelog, sends personalized emails via Resend for any matches
- New API route: `/api/cron/watchlist-alerts` (auth with CRON_SECRET)

**Pricing page rewrite:**
- Change from Free + Pro ($100) to Free + Pro ($99) + Agency ($299)
- Update `src/lib/stripe.ts` price config
- Rewrite pricing page copy to emphasize workflows (watchlists, alerts, exports) not depth (history)
- User will need to create new Stripe products/prices for $99 and $299

**Upgrade CTAs in-product:**
- Brand page: "Track this brand's agent changes →" button (Pro-gated)
- Changelog: after 3rd entry, show blurred entries + "Upgrade for full history"
- Matrix: "Save this view as watchlist" (Pro-gated)
- /weekly: email capture CTA at bottom

**Brand claiming:**
- "Claim this brand" button on every `/brand/[slug]` page
- Simple flow: enter email → verify → link to brand → get alerts
- Doubles as lead-gen (captures decision-maker emails)

**Leaderboard page:**
- New page `/leaderboard` — "Top 10 AI-Ready" and "Top 10 AI-Resistant" brands
- Ranked by a composite of: agent access openness + machine-readable signal count
- Shareable, designed for social media distribution
- Tag brands, drive "claim your brand" flow

### Design Constraints (Preserve These)

- **Theme:** 1970s NASA × Tokyo retro-futurism
- **Brand colors:** cream #FFF8F0, cobalt #0259DD, coral #FF6648, mustard #FBBA16, navy #0A1628, violet #7C3AED, forest #00492C
- **Fonts:** Inter (sans) + JetBrains Mono (data-num, spec-label)
- **Signature move:** Offset shadows (`translate(4px, 4px)` with colored block behind elements, 2px #0A1628 borders)
- **Dark sections** MUST use inline `style={{ backgroundColor: "#0A1628" }}` — Tailwind CSS classes fail for dark backgrounds
- **Brand page bottom half:** keep the bold design (agent reach array with colored discs, machine-readable stack with colored columns, instrument panel gauges, terminal-chrome transmission log, oversized field notes numerals)
- **Typography classes:** `spec-label` for monospace uppercase labels, `data-num` for tabular numbers
- **Card styles on brand page:** 2px #0A1628 borders + offset shadows, NOT the softer `card-elevated` / `card-soft` styles used elsewhere

### Environment Notes

- Railway auto-deploys from `main` branch. Push = deploy in ~3-5 min.
- `CRON_SECRET` is set in both Railway env vars and GitHub repo secrets.
- `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` are in Railway env vars. User will need to create new Stripe price IDs for $99 and $299 tiers.
- `RESEND_API_KEY` may or may not be set in Railway — check before building email alerts. If not set, tell the user to set it via `! railway variables set RESEND_API_KEY=xxx`.
- GitHub repo: `abab7575/arc-score` (push to main bypasses PR requirement).
- SQLite DB is on a Railway volume. Schema changes need auto-migration in `src/lib/db/index.ts` (pattern: `try { sqlite.exec('ALTER TABLE ...'); } catch { /* exists */ }`).
- The daily scan runs via GitHub Actions at 2 AM UTC → POST to `/api/cron/lightweight-scan` → fire-and-forget async execution.

### Execution Order (Critical — Follow This Sequence)

```
PHASE 1: ACCURACY FIXES (before any business features)
  1. Fix robots.txt fetch handling (distinguish 404 from failures)
  2. Install + integrate robots-parser for wildcard support
  3. Move robots.txt presence to Tier 2 confirmation
  4. Treat "degraded" UA verdict as "restricted"
  5. Add UA test retry (1 retry on blocked/unknown)
  6. Update drift detector to block flagship changelog entries
  7. Add circuit breaker (>5% same-field changes → hold alerts)
  8. Deploy + run clean scan + verify drift report is calm
  9. Manual ground-truth: curl top 30 brands, compare to DB
  10. Clean up historical false changelog entries from cascade bug

PHASE 2: PAID PRODUCT
  11. Watchlists DB table + CRUD
  12. /account/watchlist dashboard page
  13. "Track this brand" button on brand pages (Pro-gated)
  14. Daily alert cron (GH Action → /api/cron/watchlist-alerts → Resend)
  15. Pricing page rewrite ($99 Pro / $299 Agency)
  16. Update stripe.ts with new plan config
  17. In-product upgrade CTAs (brand page, changelog, matrix)
  18. CSV/JSON export endpoints (Pro-gated)

PHASE 3: DISTRIBUTION
  19. Email capture on homepage, /weekly, brand pages
  20. "Claim this brand" button on brand pages
  21. Leaderboard page (/leaderboard)
  22. SEO optimization on brand page metadata ("[Brand] AI bot access")
  23. First social post (leaderboard or notable brand movement)
```

**Do NOT skip to Phase 2 before Phase 1 is verified.** Shipping alerts on bad data is worse than having no paid product.
