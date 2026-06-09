# SUMMARY — arcreport.ai reference-dataset upgrade (2026-06-09)

## Addendum — four product features (same day, second batch)

- **F1 — Instant free scan.** "Scan any site" input on the homepage hero and a
  dedicated `/scan` page (server-rendered, in sitemap). `POST /api/scan`:
  domains already in the index resolve instantly to their brand page at no
  rate-limit cost; unknown domains run the standard lightweight pipeline live
  (same `deriveAgentStatus` logic as the daily scan, extracted for reuse),
  render in the brand-readout format (ARC Score + components, per-agent table,
  infra, signals), and are queued in `submissions` for daily-index inclusion.
  5 on-demand scans/IP/day with a friendly 429. No signup, no email gate.
  Verified end-to-end: known brand → redirect payload; example.com → live scan
  (score 60), queued row in DB, remaining-scan countdown.
- **F2 — Public compare tool at `/compare`.** Server-rendered side-by-side for
  2–5 brands: ARC Scores with component bars, per-agent matrix, data signals,
  platform/WAF. `?brands=a,b,c` is the share URL and drives the server render;
  the picker is a client enhancement that just navigates. Unique OG image and
  canonical per comparison; default render is Nike vs Adidas vs Uniqlo plus a
  popular-comparisons grid for SEO. "Export as image" bakes ARC attribution +
  date into a canvas PNG. Removed the legacy `/compare→/matrix` redirect;
  added to navbar + sitemap.
- **F3 — Fix-prompt generator.** `src/lib/fix-prompts.ts` has one crafted
  Claude Code prompt template per failed check (robots.txt policy blocks, WAF
  restrictions, JSON-LD/Product schema, Open Graph, sitemap, llms.txt, product
  feed), parameterised with the brand's actual findings — specific blocked
  agents with company context, detected platform for idiomatic fixes, detected
  WAF vendor, and post-deploy verification commands. Rendered on every brand
  readout (brand pages + instant-scan results) as expandable entries with
  "Copy Claude Code prompt" buttons and the "run this in Claude Code from your
  site's repository" note.
- **F4 — Free 90-day history.** Brand pages now show a date-grouped timeline
  of all confirmed changes in the last 90 days (was a 3-entry list), with an
  honest "stable posture" empty state. Plan boundaries updated in
  `site.ts`/`/pro`: free = 90-day history, instant scans, compare, full index;
  Pro = watchlists, daily alert emails, full multi-year history, CSV/JSON
  export of full history.
- **Verification:** all new pages server-rendered and in sitemap.xml
  (1,033 URLs); mobile checked at 375px with headless-browser screenshots
  (/compare, /scan, /brand/nike — zero horizontal overflow, tables scroll in
  containers); 35/35 tests passing; production build clean (1,058 pages).
- **Follow-ups:** the on-demand scan rate limiter is in-memory (resets on
  deploy — acceptable for a free tier, but move to SQLite if abused); queued
  instant-scan domains land in `submissions` with category "instant-scan" and
  still need the existing admin approve-to-brands flow (or a small cron) to
  auto-promote them into the daily index.

All five phases shipped, in order, one commit per task (see `git log
15a72a9..`). Build: clean (1,056 static pages). Tests: 35 passing
(`npm test`). Everything below is live in `main`.

## Phase A — Critical fixes

- **A1 — Apex access.** Root cause found: `arcreport.ai` (apex) never reaches
  the app — its DNS A records point to a registrar URL-forwarder whose target
  is misconfigured (it 301s to the malformed `https://www.arcreport.aiconfirm/`
  and 404s all paths). In-repo fix shipped: middleware now 301s any apex
  request to `https://www.arcreport.ai{path}` on every route, and
  `public/robots.txt` (now the single source; the conflicting `app/robots.ts`
  was removed) explicitly allows GPTBot, ChatGPT-User, ClaudeBot, Claude-Web,
  anthropic-ai, PerplexityBot, Google-Extended, Amazonbot, CCBot, Bingbot,
  and Googlebot, with the sitemap pointed at www.
  **⚠ Required out-of-repo action:** in the DNS/registrar panel, remove the
  broken URL-forward and either point the apex at Railway (adding
  `arcreport.ai` as a custom domain) or fix the forward target to
  `https://www.arcreport.ai/` with path preservation. Until then the apex
  serves the registrar's broken redirect, not ours.
- **A2 — Server rendering.** Homepage, /matrix, and /changelog converted from
  client-side fetching to server components (hourly ISR); /leaderboard moved
  from force-dynamic to ISR. The full 1,006-brand dataset is in the initial
  HTML (verified: 1,006 brand links in /matrix HTML as Googlebot/GPTBot/
  ClaudeBot). Filtering/sorting stayed as client enhancement (BrandTable,
  MatrixExplorer).
- **A3 — Constants.** `src/lib/site.ts` is the single source for canonical
  host, the 9 tracked agents, Pro price (the `$100/mo` meta-description bug is
  fixed to $149), plan features, and the data license. A stale euro-priced
  tier grid on /landscape was removed.
- **A4 — Brand pages.** All 1,015 brand pages statically generated with unique
  titles/descriptions (including live blocked/allowed counts), canonical URLs,
  per-brand OG images, WebPage+Dataset JSON-LD, and methodology links.
  sitemap.xml covers every brand page (stamped with last scan date) and all
  core routes — 1,031 URLs.

## Phase B — Open data & agent-native access

- **B1 — Downloads.** `/data/latest.json`, `/data/latest.csv`, dated archive
  `/data/YYYY-MM-DD.{json,csv}` (computed from scan history), and a `/data`
  index page. License (CC BY 4.0) and required attribution embedded in every
  payload and stated on the page.
- **B2 — API docs.** `/docs` rewritten around the real read API (matrix,
  changelog, scan-health, bulk data) with curl examples; stale Pro/watchlist
  endpoints removed. Per-IP rate limits added to the five read endpoints that
  lacked them.
- **B3 — llms.txt + markdown.** `public/llms.txt` rewritten per the
  convention. Markdown variants at `/matrix.md`, `/leaderboard.md`,
  `/changelog.md`, `/insights.md`, `/methodology.md`, `/brand/<slug>.md`
  (rewrites → `/api/md/*`), each ending with source URL, last-updated, and
  license. *Deviation:* chose stable `.md` URLs over UA content-negotiation —
  negotiation is cloaking-adjacent and cache-hostile; the brief allowed either.
- **B4 — MCP server (flagship).** Stateless Streamable-HTTP JSON-RPC server at
  `/api/mcp`; tools `get_brand_status`, `search_brands`, `get_recent_changes`,
  `get_agent_stats`, `compare_brands` (max 10, nearest-match suggestions for
  unknown domains); resources `arc://methodology` and `arc://insights/latest`;
  every response carries `source_url` + `last_updated`; no auth, 60 req/min/IP.
  `/docs/mcp` covers Claude.ai connectors, Claude Desktop, Claude Code, plus
  three example prompts. 28 integration tests. *Deviation:* the protocol layer
  is hand-rolled (wire-compatible) because the official SDK's HTTP transport
  expects Node req/res streams that App Router handlers don't provide.

## Phase C — Trust & citability

- **C1** `/methodology`: 9 agents, robots.txt parsing, live HTTP tests
  (403/challenge/content-stripping thresholds), two-scan confirmation rule,
  02:00 UTC timing, Score v1.0 formula + versioning policy, limitations.
  Linked from the footer and every brand page; old `/methodology→/docs`
  redirect removed.
- **C2** `/reliability`: live conclusive-verdict rate and inconclusive-brand
  count; per-run completion rates render when `scan_runs` rows exist (the
  production DB has them; the local dev DB doesn't, so the page states that
  honestly); permanent corrections log (scaffolded, empty-state honest);
  dispute process via structured mailto `[DATA DISPUTE] domain` with a
  2-business-day re-scan commitment.
- **C3** `/insights`: server-computed headline stats (per-agent blocking %,
  most-blocked agent, most-open category, platform breakdown, WoW change
  counts), each with a stable anchor and a copy-citation button emitting
  `stat — ARC Report, date, arcreport.ai/insights#anchor`.
- **C4**: footer on every page now shows live brand count, agent count, and
  last-scan UTC timestamp from the DB; hero stats, /data, /docs counts are all
  live-rendered.

## Phase D — Product excellence

- **D1 — ARC Score v1.0 (flagship).** `src/lib/scoring/arc-score.ts`:
  agent access breadth 50 (allowed/no_rule=1, inconclusive=0.5,
  restricted=0.25, blocked=0) + structured data 25 (JSON-LD 7, Product 7,
  OG 4, sitemap 4, feed 3) + protocol files 15 (llms.txt 6+3, agents.txt 3,
  UCP 3) + scan stability 10 (conclusive-verdict share). Documented on
  /methodology with a versioning policy; `score_version` travels with all
  data. Surfaced with component breakdown on brand pages, homepage table,
  matrix, leaderboard (replaced the old ad-hoc composite), badges, OG images,
  bulk data, and MCP. *Deviation:* "scan stability" uses the latest scan's
  conclusive-verdict share rather than a trailing-history metric, so the score
  is a pure function of one scan row — deterministic and identical across
  every surface; noted as a candidate refinement for v1.1.
- **D2 — Matrix.** Server-rendered heatmap with a color-coded ARC Score
  column (default sort), and an "Export as image" button — client canvas
  render of the current filtered view with ARC attribution + date baked in
  (caps at 60 rows with an explicit "+N more" line).
- **D3 — Badges.** `/badge/<slug>.svg` (score, access label, scan date;
  hourly revalidate) with HTML/Markdown embed snippets on every brand page.

## Phase E — Positioning & distribution

- **E1.** Hero: "The public record of AI agent access in commerce" with
  Browse-the-index / Download-the-data / Query-via-MCP CTAs. Navbar: Index,
  Matrix, Insights, Changes, Data, API. Pricing moved to a quiet `/pro`
  (301 from /pricing, kept functional, framed as funding the dataset).
  `/about` is now a real page (independent / daily / verified / who builds it).
- **E2.** `/changelog.xml` (RSS), `/changelog.atom` (Atom), `/weekly.xml`
  (digest RSS), autodiscovery in the layout. `/weekly/[date]` digest pages:
  ISO-Monday keys, statically generated for the full archive, auto-generated
  prose (biggest blocks, biggest opens, llms.txt adopters, platform shifts,
  top movers), own OG image, prev/next nav; `/weekly` hosts the archive.

## Final verification

1. **Apex/www UA curls** — middleware verified locally (apex Host → 301
   `https://www.arcreport.ai{path}` for /, /matrix, /robots.txt,
   /data/latest.json); homepage HTML contains all 1,025 brand links for
   Googlebot, GPTBot, and ClaudeBot UAs. Live www verification pending the
   Railway deploy of this push; live apex remains blocked by the DNS issue
   above (deliberately out of repo reach).
2. **Sitemap** — 1,031 URLs; all new routes present and server-rendered.
3. **Tests + build** — 35/35 passing; production build clean.
4. **MCP end-to-end** — all three /docs/mcp example prompts executed against
   the running server via JSON-RPC (fashion ClaudeBot-blockers comparison,
   14-day change summary, nike/adidas/zara comparison with index context).
5. This file.

## Deferred / follow-ups (recommended order)

1. **Fix apex DNS** (the one thing code can't do — see A1 above).
2. Set `BASE_URL=https://www.arcreport.ai` on Railway explicitly (defaults are
   correct now, but explicit beats implicit).
3. Production scans are healthy (verified live: run #75 completed
   2026-06-09, 949/1015 brands, status yellow on drift alerts) — but 66
   failures/run is worth a look; /reliability now surfaces this publicly.
   The local dev DB is a stale 2026-04-04 snapshot; consider refreshing it
   so dev/build data matches production more closely.
4. ARC Score v1.1: move scan-stability to a trailing 7-scan window and
   consider llms.txt quality weighting (hasH1/hasSummary are already scanned).
5. Wire the corrections log to a DB table once the first correction happens
   (currently a reviewed-in-code array, which is fine at current volume).
6. Add `/data/latest.json` ETag/If-None-Match for polite agent polling.
7. The legacy deep-scan API (`/api/brands*`, Puppeteer-era scores) is still
   served but undocumented; decide whether to fold those scores into brand
   pages or retire the endpoints.
