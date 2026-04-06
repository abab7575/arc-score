# ARC Score — Next Steps

Last updated: 2026-03-02

---

## 1. Domain

- [ ] Purchase domain (check availability of `get-arc.io` or similar)
- [ ] Point DNS to Railway production deployment
- [ ] Update any hardcoded URLs (Stripe webhook endpoint, OAuth callbacks, etc.)

## 2. Scanning Audit

- [ ] Inventory which brands/sites have been scanned and when
- [ ] Verify scan results are up to date and stored correctly in the database
- [ ] Confirm the scanning pipeline runs cleanly end-to-end for a fresh site

## 3. UX/UI Overhaul

- [ ] Full design pass across all public pages (Index, Compare, Agents, Landscape, About, Pricing)
- [ ] Review brand detail pages (free vs gated sections)
- [ ] Mobile responsiveness check
- [ ] Consistency with the design system (cream, cobalt, coral, mustard, navy, violet)

## 4. Agent Deep Dive

- [ ] Review all 10 agent profiles in `src/lib/ai-agents.ts`
- [ ] Confirm each agent's scoring weights and lens make sense
- [ ] Make sure the descriptions and categories are clear to a non-technical customer

## 5. Full Customer POV Experience

- [ ] Walk through the entire flow as a brand-new visitor (no account)
- [ ] Sign up, then purchase the Monitor plan ($79/mo) — verify what's unlocked
- [ ] Purchase the Team plan ($249/mo) — verify what's unlocked
- [ ] Test the "claim a brand" flow after subscribing
- [ ] Confirm gating logic: ScoreHero + ScoreBreakdown = free; AgentCompatibility + Findings + ActionPlan = paid
- [ ] Test Stripe billing portal (upgrade, downgrade, cancel)
- [ ] May need a test/coupon code or Stripe test mode to avoid real charges

## 6. Claude Code Full Review

- [ ] **Security audit** — check for injection, auth bypass, exposed secrets, improper access control
- [ ] **Logic review** — verify scoring math, subscription gating, webhook handling, session management
- [ ] **Value prop consistency** — make sure messaging across pages doesn't contradict itself
- [ ] **Blind spot analysis** — identify missing edge cases, error states, or unhandled scenarios
- [ ] **Copy review** — ensure the product story is coherent from landing page through to paid experience

## 7. Repo Hygiene + Deploy Safety

- [ ] Audit the current dirty worktree and classify changes into: real code, generated assets, local-only data
- [ ] Define repo hygiene rules for screenshots, scan logs, database files, and generated outputs
- [ ] Tighten `.gitignore` so generated/local artifacts stop polluting the repo
- [ ] Establish a safe small-change deploy workflow that isolates one UI change without dragging unrelated work
- [ ] Confirm Railway/GitHub deployment path and fix local auth so future deploys do not require manual scrambling
