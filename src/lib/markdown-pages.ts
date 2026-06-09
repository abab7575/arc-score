/**
 * Markdown variants of key data pages (B3). Served at /<page>.md and
 * /brand/<slug>.md via the rewrite in next.config.ts -> /api/md/*.
 * Every document ends with source URL, last-updated, and license lines so
 * agents can cite cleanly.
 */

import { buildMatrixPayload, getChangelogWithBrands, getIndexStats } from "@/lib/index-data";
import { computeInsights } from "@/lib/insights";
import { getBrandBySlug, getLatestLightweightScan, getChangelogForBrand } from "@/lib/db/queries";
import { computeArcScore } from "@/lib/scoring/arc-score";
import { SITE_URL, TRACKED_AGENT_IDS, TRACKED_AGENT_COUNT, DATA_LICENSE, SCORE_VERSION } from "@/lib/site";

function footer(sourcePath: string, lastUpdated: string | null): string {
  return [
    "",
    "---",
    "",
    `Source: ${SITE_URL}${sourcePath}`,
    `Last updated: ${lastUpdated ?? "unknown"}`,
    `License: ${DATA_LICENSE.name} (${DATA_LICENSE.url}) — ${DATA_LICENSE.attribution}`,
    "",
  ].join("\n");
}

export function matrixMarkdown(): string {
  const { stats, brands } = buildMatrixPayload();
  const scanned = brands.filter((b) => b.scanned);
  const lines: string[] = [
    "# ARC Report — Agent Access Matrix",
    "",
    `Daily robots.txt + live-HTTP scan of ${stats.scannedBrands.toLocaleString()} e-commerce brands × ${TRACKED_AGENT_COUNT} AI agents.`,
    "",
    `- Brands fully open to AI agents: ${stats.brandsFullyOpen} (${stats.percentFullyOpen}%)`,
    `- Brands blocking ≥1 agent: ${stats.brandsBlocking}`,
    `- Average agents blocked per brand: ${stats.avgBlockedAgents}`,
    "",
    "Status legend: allowed / no_rule (open) · blocked (robots.txt policy) · restricted (WAF/CDN) · inconclusive.",
    "",
    `| Brand | Category | ARC Score | ${TRACKED_AGENT_IDS.join(" | ")} |`,
    `|---|---|---|${TRACKED_AGENT_IDS.map(() => "---").join("|")}|`,
  ];
  for (const b of scanned) {
    const score = computeArcScore({
      agentStatusJson: JSON.stringify(b.agentStatus ?? {}),
      hasJsonLd: !!b.hasJsonLd,
      hasSchemaProduct: !!b.hasSchemaProduct,
      hasOpenGraph: !!b.hasOpenGraph,
      hasSitemap: !!b.hasSitemap,
      hasProductFeed: !!b.hasProductFeed,
      hasLlmsTxt: !!b.hasLlmsTxt,
      hasAgentsTxt: !!b.hasAgentsTxt,
      hasUcp: !!b.hasUcp,
    });
    const cells = TRACKED_AGENT_IDS.map((a) => b.agentStatus?.[a] ?? "—");
    lines.push(`| [${b.name}](${SITE_URL}/brand/${b.slug}) | ${b.category} | ${score.total} | ${cells.join(" | ")} |`);
  }
  const lastScan = scanned.reduce<string | null>((m, b) => (!m || (b.scannedAt ?? "") > m ? b.scannedAt ?? m : m), null);
  return lines.join("\n") + footer("/matrix", lastScan);
}

export function leaderboardMarkdown(): string {
  const { brands } = buildMatrixPayload();
  const scored = brands
    .filter((b) => b.scanned)
    .map((b) => ({
      ...b,
      score: computeArcScore({
        agentStatusJson: JSON.stringify(b.agentStatus ?? {}),
        hasJsonLd: !!b.hasJsonLd,
        hasSchemaProduct: !!b.hasSchemaProduct,
        hasOpenGraph: !!b.hasOpenGraph,
        hasSitemap: !!b.hasSitemap,
        hasProductFeed: !!b.hasProductFeed,
        hasLlmsTxt: !!b.hasLlmsTxt,
        hasAgentsTxt: !!b.hasAgentsTxt,
        hasUcp: !!b.hasUcp,
      }).total,
    }))
    .sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 25);
  const bottom = scored.slice(-25).reverse();
  const lines = [
    "# ARC Report — AI-Ready Leaderboard",
    "",
    `Ranked by ARC Score v${SCORE_VERSION} (0–100): agent access breadth 50, structured data 25, protocol files 15, scan stability 10. Formula: ${SITE_URL}/methodology`,
    "",
    "## Top 25 — most open to AI agents",
    "",
    "| # | Brand | Category | ARC Score |",
    "|---|---|---|---|",
    ...top.map((b, i) => `| ${i + 1} | [${b.name}](${SITE_URL}/brand/${b.slug}) | ${b.category} | ${b.score} |`),
    "",
    "## Bottom 25 — most restricted",
    "",
    "| # | Brand | Category | ARC Score |",
    "|---|---|---|---|",
    ...bottom.map((b, i) => `| ${i + 1} | [${b.name}](${SITE_URL}/brand/${b.slug}) | ${b.category} | ${b.score} |`),
  ];
  const lastScan = scored.reduce<string | null>((m, b) => (!m || (b.scannedAt ?? "") > m ? b.scannedAt ?? m : m), null);
  return lines.join("\n") + footer("/leaderboard", lastScan);
}

export function changelogMarkdown(): string {
  const entries = getChangelogWithBrands(200);
  const lines = [
    "# ARC Report — Changelog",
    "",
    "Confirmed AI-agent-access changes across the index, newest first. Inference-based signals require two consecutive scans before publishing.",
    "",
    "| Detected (UTC) | Brand | Field | Old | New |",
    "|---|---|---|---|---|",
    ...entries.map((e) =>
      `| ${e.detectedAt.slice(0, 16).replace("T", " ")} | [${e.brandName}](${SITE_URL}/brand/${e.brandSlug}) | ${e.field} | ${e.oldValue ?? "—"} | ${e.newValue ?? "—"} |`,
    ),
  ];
  return lines.join("\n") + footer("/changelog", entries[0]?.detectedAt ?? null);
}

export function insightsMarkdown(): string {
  const ins = computeInsights();
  const lines = [
    "# ARC Report — Insights",
    "",
    `Headline statistics computed from the latest scan of ${ins.scannedBrands.toLocaleString()} e-commerce brands.`,
    "",
    `- Fully open to all tracked AI agents: ${ins.fullyOpenCount} brands (${ins.fullyOpenPercent}%)`,
    `- Blocking or restricting at least one agent: ${ins.blockingAnyCount} brands`,
    `- Most-blocked agent: ${ins.mostBlockedAgent ? `${ins.mostBlockedAgent.agent} (${ins.mostBlockedAgent.blockedPercent}% of brands)` : "n/a"}`,
    `- Most-open category: ${ins.mostOpenCategory ? `${ins.mostOpenCategory.category} (${ins.mostOpenCategory.fullyOpenPercent}% fully open)` : "n/a"}`,
    `- llms.txt adoption: ${ins.llmsTxtCount} brands (${ins.llmsTxtPercent}%)`,
    `- Confirmed changes: ${ins.changesThisWeek} this week vs ${ins.changesPreviousWeek} the week before`,
    "",
    "## Blocking rate per agent",
    "",
    "| Agent | Company | Policy blocks | WAF restricted | % of brands blocking |",
    "|---|---|---|---|---|",
    ...ins.agentStats.map((a) => `| ${a.agent} | ${a.company} | ${a.blockedCount} | ${a.restrictedCount} | ${a.blockedPercent}% |`),
    "",
    "## Category openness",
    "",
    "| Category | Brands | Fully open | % fully open |",
    "|---|---|---|---|",
    ...ins.categoryStats.map((c) => `| ${c.category} | ${c.brandCount} | ${c.fullyOpenCount} | ${c.fullyOpenPercent}% |`),
    "",
    "## Platform breakdown",
    "",
    "| Platform | Brands | % |",
    "|---|---|---|",
    ...ins.platformStats.map((p) => `| ${p.platform} | ${p.brandCount} | ${p.percent}% |`),
  ];
  return lines.join("\n") + footer("/insights", ins.lastScanAt);
}

export function brandMarkdown(slug: string): string | null {
  const brand = getBrandBySlug(slug);
  if (!brand) return null;
  const scan = getLatestLightweightScan(brand.id);
  if (!scan) {
    return [
      `# ${brand.name} — AI Agent Access`,
      "",
      `No scan data yet for ${brand.url}.`,
    ].join("\n") + footer(`/brand/${brand.slug}`, null);
  }
  let status: Record<string, string> = {};
  try {
    status = JSON.parse(scan.agentStatusJson);
  } catch {
    status = {};
  }
  const score = computeArcScore(scan);
  const changes = getChangelogForBrand(brand.id, 10);
  const lines = [
    `# ${brand.name} — AI Agent Access`,
    "",
    `- Site: ${brand.url}`,
    `- Category: ${brand.category}`,
    `- Platform: ${scan.platform ?? "unknown"} · CDN: ${scan.cdn ?? "unknown"} · WAF: ${scan.waf ?? "none-detected"}`,
    `- ARC Score v${SCORE_VERSION}: **${score.total}/100** (agent access ${score.agentAccess}/50, structured data ${score.structuredData}/25, protocol files ${score.protocolFiles}/15, scan stability ${score.scanStability}/10)`,
    `- Last scanned: ${scan.scannedAt}`,
    "",
    "## Per-agent access",
    "",
    "| Agent | Status |",
    "|---|---|",
    ...TRACKED_AGENT_IDS.map((a) => `| ${a} | ${status[a] ?? "inconclusive"} |`),
    "",
    "## Data signals",
    "",
    `- JSON-LD: ${scan.hasJsonLd ? "yes" : "no"}`,
    `- Schema.org Product: ${scan.hasSchemaProduct ? "yes" : "no"}`,
    `- Open Graph: ${scan.hasOpenGraph ? "yes" : "no"}`,
    `- Sitemap: ${scan.hasSitemap ? "yes" : "no"}`,
    `- Product feed: ${scan.hasProductFeed ? "yes" : "no"}`,
    `- llms.txt: ${scan.hasLlmsTxt ? "yes" : "no"}`,
    `- agents.txt: ${scan.hasAgentsTxt ? "yes" : "no"}`,
    `- UCP: ${scan.hasUcp ? "yes" : "no"}`,
  ];
  if (changes.length > 0) {
    lines.push("", "## Recent changes", "");
    for (const c of changes) {
      lines.push(`- ${c.detectedAt.slice(0, 10)}: ${c.field} — ${c.oldValue ?? "—"} → ${c.newValue ?? "—"}`);
    }
  }
  return lines.join("\n") + footer(`/brand/${brand.slug}`, scan.scannedAt);
}

export function methodologyMarkdown(): string {
  const stats = getIndexStats();
  // Mirrors /methodology (C1). Keep the two in sync.
  const lines = [
    "# ARC Report — Methodology",
    "",
    `ARC Report scans ${stats.brandCount.toLocaleString()} e-commerce brands daily (02:00 UTC) with an HTTP-only scanner (~25 requests per brand, no browser automation).`,
    "",
    "## What is tested",
    "",
    `1. robots.txt parsing — explicit Allow/Disallow rules for ${TRACKED_AGENT_COUNT} agents: ${TRACKED_AGENT_IDS.join(", ")}.`,
    "2. Live HTTP access tests — requests with each agent's User-Agent string against the homepage and a product page; detects WAF blocks (403s, challenge pages) and content stripping (<25% of a Chrome baseline).",
    "3. Structured data — JSON-LD, Schema.org Product, Open Graph, sitemap.xml, product feeds.",
    "4. Protocol files — llms.txt (size, link count), agents.txt variants, UCP endpoints.",
    "5. Infrastructure — e-commerce platform, CDN, and WAF fingerprinting.",
    "",
    "## Two-scan confirmation rule",
    "",
    "robots.txt rule changes publish immediately (text-file diffs). Inference-based signals (HTTP verdicts, CDN/WAF, structured data) must appear in two consecutive scans before publishing. Timeouts and rate-limit responses are never published as changes.",
    "",
    `## ARC Score v${SCORE_VERSION}`,
    "",
    "0–100 = agent access breadth (50) + structured data quality (25) + protocol files (15) + scan stability (10).",
    "- Agent access: mean over agents of allowed/no_rule=1, inconclusive=0.5, restricted=0.25, blocked=0, × 50.",
    "- Structured data: JSON-LD 7, Schema.org Product 7, Open Graph 4, sitemap 4, product feed 3.",
    "- Protocol files: llms.txt 6 (+3 if it contains links), agents.txt 3, UCP 3.",
    "- Scan stability: share of conclusive per-agent verdicts × 10.",
    "Score changes only with a versioned methodology update.",
    "",
    "## Known limitations",
    "",
    "- robots.txt is a policy declaration; enforcement may differ (we test both, and label them separately).",
    "- Structured-data detection reads server HTML; JS-rendered markup can be missed.",
    "- WAF behaviour can vary by region and time; the two-scan rule reduces, but cannot eliminate, flicker.",
    "- UA-string tests approximate agent traffic; they do not replicate full agent behaviour (no JS execution).",
  ];
  return lines.join("\n") + footer("/methodology", stats.lastScan);
}
