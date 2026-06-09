# PLAN — arcreport.ai → public reference dataset for agent access in commerce

Stack reality: Next.js 16 App Router + better-sqlite3 (Drizzle) on a Railway
Docker deploy (`railway.toml`, `Dockerfile`, `scripts/entrypoint.sh`). DB lives
at `data/arc-score.db` (1,015 brands, 1,006 scanned, 6,241 changelog entries).
Daily lightweight scan triggered at 02:00 UTC by
`.github/workflows/daily-lightweight-scan.yml` → `/api/cron/lightweight-scan`.
There is no Vercel; `vercel.json` does not exist.

Canonical host decision: **https://www.arcreport.ai** (apex 301s to www).

## PHASE A — Critical fixes

### A1. Apex domain access
Finding: `arcreport.ai` (apex) does NOT route to the app at all. DNS A records
point to a registrar URL-forwarding service (AWS Global Accelerator IPs
3.33.251.168 / 15.197.225.128) whose redirect target is misconfigured — it
returns `301 Location: https://www.arcreport.aiconfirm/` (malformed, unfollowable)
and 404s for any path. `www.arcreport.ai` CNAMEs to Railway and works.
- Code fix (this repo): host-canonicalization in `src/middleware.ts` — any
  request reaching the app on `arcreport.ai` 301s to `https://www.arcreport.ai{path}`.
  This makes the app correct the moment DNS is fixed.
- robots.txt: consolidate to a single source `public/robots.txt` (delete
  `src/app/robots.ts` which currently conflicts) explicitly allowing GPTBot,
  ChatGPT-User, ClaudeBot, Claude-Web, anthropic-ai, PerplexityBot,
  Google-Extended, Amazonbot, CCBot, Bingbot, Googlebot. Sitemap URL → www.
- **Out-of-repo action (documented, cannot be done from code): in the DNS
  provider, delete the broken URL-forward for the apex and either (a) point the
  apex at Railway and add `arcreport.ai` as a custom domain (Railway will then
  serve our middleware 301), or (b) fix the forwarder target to
  `https://www.arcreport.ai/` with path preservation.** Noted again in SUMMARY.md.
- Files: `src/middleware.ts`, `public/robots.txt`, delete `src/app/robots.ts`,
  `src/app/sitemap.ts` (base URL), `src/lib/constants.ts` (SITE_URL).

### A2. Server-render core data pages
- `src/app/page.tsx` — client comp fetching `/api/matrix` + `/api/homepage-stats`
  → convert to async RSC querying `getMatrixData()` directly; filtering moves to
  a client child (`src/components/index/brand-table.tsx`) receiving
  server-fetched rows as props. `export const revalidate = 3600`.
- `src/app/matrix/page.tsx` — client comp fetching `/api/matrix` → RSC wrapper +
  client `matrix-explorer.tsx` taking data as props (filters/sort stay client).
- `src/app/changelog/page.tsx` — client comp fetching `/api/changelog` → RSC
  (its tooltips are pure CSS hover, no hooks needed).
- `src/app/leaderboard/page.tsx` — already RSC (`force-dynamic`) → switch to
  `revalidate = 3600`.
- `src/app/landscape/page.tsx` — already SSR'd (client comp renders static
  editorial content in initial HTML; no data fetching). No conversion needed.

### A3. Constants consistency
- Bug: `src/app/pricing/layout.tsx` meta says "Pro at $100/mo"; leaderboard,
  weekly, docs say $149/mo. Fix to $149 everywhere via constant.
- New `src/lib/site.ts`: SITE_URL, SITE_NAME, TRACKED_AGENTS (the 9), agent
  count, BRAND_COUNT_DISPLAY ("1,000+"), PRO_PRICE_MONTHLY=149, plan features,
  contact email. Replace hardcoded instances across pages/components.
- Live counts come from DB helpers (`getIndexStats()` in queries) — C4.

### A4. Programmatic brand pages
- `src/app/brand/[slug]/page.tsx`: add `generateStaticParams()` (all active
  slugs), `revalidate = 3600`, unique title/description incl. blocked/allowed
  counts, JSON-LD (Organization + Dataset/WebPage), per-brand OG image via
  existing `/api/og` with brand params, link to /methodology.
- `src/app/sitemap.ts`: add new routes (/data, /docs, /docs/mcp, /methodology,
  /reliability, /insights, /about, /pro, /weekly/[date]); base → www.

## PHASE B — Open data & agent-native access

### B1. Data downloads
- `src/lib/data-export.ts`: build snapshot (per-brand latest scan as of a date)
  → JSON + CSV serializers.
- Routes: `src/app/data/latest.json/route.ts`, `latest.csv/route.ts`,
  `[file]/route.ts` (matches `YYYY-MM-DD.json|csv`, computed from scan history).
- `src/app/data/page.tsx`: index page listing endpoints + archive dates +
  CC BY 4.0 license & attribution text (license stated in JSON payload too).

### B2. Public API docs
- Rewrite `src/app/docs/page.tsx`: document /api/matrix, /api/changelog,
  /api/brands, /api/brands/[slug], /api/scan-health, /data/*; curl examples;
  rate limits. Drop Pro-endpoint section (Stripe layer was stripped).
- Add `rateLimit()` to unprotected read APIs (`/api/brands*`, homepage-stats).

### B3. llms.txt + markdown variants
- Rewrite `public/llms.txt` (data endpoints, MCP, key pages, license).
- Markdown variants via `next.config.ts` rewrite `/:path*.md` →
  `/api/md/:path*` + handler `src/app/api/md/[[...path]]/route.ts` serving
  text/markdown for: matrix, leaderboard, insights, changelog, methodology,
  brand/[slug]. (Chosen over UA content-negotiation — stable URLs beat
  cloaking-style negotiation for citability; noted as the "closest sensible
  alternative" of the two options offered.)

### B4. MCP server (flagship)
- Streamable HTTP (stateless JSON-RPC over POST) at `src/app/api/mcp/route.ts`.
  Hand-rolled minimal MCP protocol layer (initialize, tools/list, tools/call,
  resources/list, resources/read) — avoids SDK/Node-stream adaptation issues in
  route handlers; stateless mode is exactly what Claude custom connectors need.
- Tools in `src/lib/mcp/tools.ts`: get_brand_status, search_brands,
  get_recent_changes, get_agent_stats, compare_brands (max 10). All responses
  carry `source_url` + `last_updated`. Unknown domains → nearest-match
  suggestions (substring/levenshtein over slugs/domains).
- Resources: methodology doc + latest insights summary.
- `src/app/docs/mcp/page.tsx`: setup for Claude.ai connectors, Claude Desktop,
  Claude Code + 3 example prompts.
- Tests: vitest (`npm t`), `tests/mcp.test.ts` calling the route handler
  in-process per tool.

## PHASE C — Trust & citability

### C1. /methodology — new `src/app/methodology/page.tsx`; remove the
`/methodology → /docs` redirect in `next.config.ts`. Content from
`lightweight-scanner.ts` (9 agents, ~25 HTTP requests), `changelog-engine.ts`
(two-tier confirmation), scan timing (02:00 UTC), limitations; Score v1.0
formula + versioning policy (D1). Linked from footer + brand pages.
### C2. /reliability — success rates from `scan_runs` (completed/failed/skipped),
two-scan false-positive handling, corrections log (scaffolded from a
`corrections` array, empty-state honest), dispute via
mailto:hello@arcreport.ai?subject=[DATA DISPUTE] {domain}.
### C3. /insights — RSC, `revalidate = 3600`; per-agent blocking %, most-blocked
agent, most-open category, platform breakdown, WoW change counts; anchor per
stat + client copy-citation button ("stat — ARC Report, {date},
arcreport.ai/insights#anchor").
### C4. Zero decorative claims — `getIndexStats()` helper (brand count, agent
count, last scan time) used by homepage hero, footer (live last-scanned), docs,
data pages.

## PHASE D — Product excellence

### D1. ARC Score v1.0 — `src/lib/scoring/arc-score.ts`, pure function over a
lightweight scan row + recent history:
- Agent access breadth 50pts: per 9 agents — allowed/no_rule=1, inconclusive=0.5,
  restricted=0.25, blocked=0 → fraction × 50.
- Structured data 25pts: JSON-LD 7, Schema Product 7, Open Graph 4, sitemap 4,
  product feed 3.
- Protocol files 15pts: llms.txt 9 (quality-weighted: presence 6 + links 3),
  agents.txt 3, UCP 3.
- Scan stability 10pts: share of conclusive agent verdicts in latest scan (5) +
  scan consistency over trailing 7 scans (5).
Documented on /methodology as "Score v1.0" with versioning policy. Component
breakdown surfaced beside every score (brand page, matrix, leaderboard, badge,
OG, API, MCP).
### D2. Matrix redesign — server-rendered heatmap + ARC Score column, dense
cells, category grouping, sticky headers, "Export as image" (client canvas
renderer baking "ARC Report — arcreport.ai — {date}" attribution).
### D3. Badges — `src/app/badge/[slug]/route.ts` serving SVG at
/badge/{slug}.svg (score + access status + last-scan date); embed snippet shown
on each brand page.

## PHASE E — Positioning & distribution

### E1. Copy reposition — homepage hero → public-resource tone; CTAs "Browse the
index / Download the data / Query via MCP". `/pricing` content moves to quiet
`/pro` (+ 301 from /pricing); navbar/footer: Data, Methodology, Insights, Docs,
About replace Pricing. New `src/app/about/page.tsx` (currently redirects to
/docs): independent, daily, verified, who/why.
### E2. Feeds & digest — `src/app/changelog.xml/route.ts` (RSS 2.0) +
`changelog.atom/route.ts`; weekly digest `src/app/weekly/[date]/page.tsx`
(ISO-Monday-keyed, server-rendered prose from week's changes, own OG image),
`/weekly` becomes archive index + latest. RSS feed for weekly digests at
`/weekly.xml`.

## Deviations / impossibilities log
- A1: apex DNS cannot be repointed from this repo — middleware redirect +
  robots.txt shipped; DNS action documented above and in SUMMARY.md.
- B3: chose stable `.md` URLs (rewrite-based) over UA-sniffing content
  negotiation (cloaking risk, cache-hostile); both were offered in the brief.
- B4: MCP protocol layer hand-rolled (stateless Streamable HTTP) rather than
  `@modelcontextprotocol/sdk` server transport, which expects Node http
  req/res streams not available in App Router handlers. Wire-compatible for
  initialize/tools/resources; integration-tested.
- D1 weights adjusted to integers that fit available signals (documented).
- Final verification step 1 (apex 200s) can only pass for www until the DNS
  action lands; apex correctness is verified at the middleware level instead.
