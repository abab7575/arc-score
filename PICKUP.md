# ARC Score — Pickup Notes (March 14, 2026)

## What Was Built Tonight

### Content Engine (Phase 1)
The Content Studio is now an intelligent content engine. It discovers stories from your data, generates branded infographic PNGs, and queues everything for you to browse, approve, and post.

**How to use it:**
1. Go to `/admin/content-studio` → **Feed tab** (new default)
2. Click **"Generate Fresh"** — discovers 5-8 stories from your data
3. Browse cards, **Approve**, **Copy Text**, **Download Image**
4. **Create tab** = the old manual generation tool (still works)

**What it auto-discovers:**
- Big score movers (brands that gained/lost 5+ points)
- Category leaderboards (rotates through 7 categories)
- Agent readiness rankings (rotates through 10 agents)
- Educational explainer topics (17 topics on categories, agents, protocols)
- Trending news reactions (from your newsfeed, relevance 65+)

**Image generation:** Branded 1200x675 PNGs — navy background, coral stripe, JetBrains Mono data, ARC SCORE watermark. Five templates: scorecard, leaderboard, mover-alert, educational, news-react.

**Cron endpoint:** `GET /api/cron/content-generate` — can be triggered by a scheduler to auto-generate daily.

### Homepage Hero Redesign
Replaced the single Glossier preview card with two stacked contrast cards:
- **Red (Abercrombie, 18/F)** — "AGENTS BLOCKED — NOT READY" + "CHECKOUT: FAILED"
- **Green (Glossier, 87/A)** — "AGENT-READY — SALES FLOWING" + "CHECKOUT: WORKS"

Creates the instant "oh shit" or "I'm good" visceral reaction.

### VIEW FULL REPORT
Now clickable — links to `/brand/glossier`.

---

## Current State (All Systems)

| Area | Status |
|------|--------|
| Payments (Stripe) | Working — end-to-end flow functional |
| Scanning (5 agents) | All built, running on Railway |
| Brand data | 100 brands scanned (was 69, bulk scan happened) |
| Homepage messaging | Shipped — dual contrast cards + problem/solution/urgency/proof |
| Methodology page | Live at `/methodology` |
| Content Engine | Live — Feed tab, Generate Fresh, image generation |
| Agent Replay | Built — scroll-driven journey visualization on brand pages |
| Cron jobs | Daily scan (2 AM UTC) + Weekly full (Sunday 3 AM UTC) |
| Admin access | Full access to all brand pages when logged in at /admin/login |

---

## Must Do Before Real Payments

- [ ] Set `STRIPE_WEBHOOK_SECRET` in Railway (Stripe Dashboard → Developers → Webhooks → signing secret)
- [ ] Change `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `CUSTOMER_SESSION_SECRET` to strong random values in Railway
- [ ] Verify `CRON_SECRET` is set in both Railway and GitHub repo secrets
- [ ] Test full customer flow on live site: sign up → pay → claim brand → view report

---

## Product Gaps (Priority Order)

### High Priority
- [ ] Custom domain (currently `arc-score-production.up.railway.app`)
- [ ] Email capture on homepage ("get notified when we scan your brand")
- [ ] Content Engine cron — wire up daily auto-generation (add to GitHub Action or Railway cron)
- [ ] Confirm all brands have scores (was 276 targets, 100 scanned so far)

### Medium Priority
- [ ] PDF export of brand reports (good gated feature for Monitor/Team plans)
- [ ] Blog/content hub for SEO (could auto-publish from Content Engine queue)
- [ ] Threshold alerts ("notify me if my score drops below X")

### Nice to Have
- [ ] Price consistency check in Feed Agent (compare feed prices to page prices)
- [ ] Vision Agent accuracy benchmarking
- [ ] Content Engine: add image generation to "Generate Fresh" button (currently skips images for speed — only the cron script generates images)

---

## Homepage Above-the-Fold — Enhancement Ideas

The hero now shows the dual contrast cards. Next iterations to consider:

1. **Live search that previews scores** — as you type a brand name, show their score inline before they even hit search (creates the "oh shit" moment with THEIR brand, not a sample)
2. **Animated score counter** — the failing card's score could animate down from 100 to 18, the passing card up from 0 to 87 (makes the contrast more dramatic)
3. **"Which one is you?"** label between the two cards — directly challenge the visitor
4. **Agent failure filmstrip** — tiny screenshots showing an agent getting stuck on the failing brand's checkout (the Agent Replay tech exists, could be adapted for a mini version)
5. **Social proof line** — "276 brands scored this week" or "Updated daily" to build credibility
6. **Competitor comparison hook** — "See how you compare to competitors in your category" with category dropdown

---

## Architecture Quick Reference

| System | Key Files |
|--------|-----------|
| Content Engine | `src/lib/content-studio/intelligence.ts`, `generators.ts`, `templates.ts` |
| Image Generation | `src/lib/content-studio/images/renderer.ts`, `images/templates/*.tsx` |
| Content Queue DB | `src/lib/db/schema.ts` (contentQueue table), `admin-queries.ts` |
| Content APIs | `src/app/api/admin/content-queue/`, `api/cron/content-generate/` |
| Content UI | `src/components/admin/content-feed.tsx`, `content-queue-card.tsx` |
| Homepage Hero | `src/components/index/index-hero.tsx` |
| Scanner | `src/lib/scanner/scan-orchestrator.ts`, agents in `src/lib/scanner/agents/` |
| Brand Pages | `src/app/brand/[slug]/page.tsx` |
| Stripe | `src/lib/stripe.ts`, `src/app/api/stripe/` |
