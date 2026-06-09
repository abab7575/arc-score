import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { Metadata } from "next";
import { SITE_URL, DATA_LICENSE, BRAND_COUNT_DISPLAY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Public API Docs — ARC Report",
  description:
    "Free public JSON API for AI agent access signals across 1,000+ e-commerce brands. No auth for reads, per-IP rate limits, CC BY 4.0 data.",
};

const BASE = SITE_URL;

function Endpoint({
  method,
  path,
  summary,
  curl,
  response,
}: {
  method: string;
  path: string;
  summary: string;
  curl: string;
  response: string;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#059669]">
          {method}
        </span>
        <code className="text-sm font-mono text-foreground">{path}</code>
      </div>
      <p className="text-sm text-muted-foreground mb-3">{summary}</p>

      <div className="mb-3">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
          curl
        </div>
        <pre className="bg-[#0A1628] text-[#FFF8F0] text-xs font-mono p-3 overflow-x-auto">
          <code>{curl}</code>
        </pre>
      </div>

      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
          response (abbreviated)
        </div>
        <pre className="bg-[#F5F0E8] text-[#0A1628] text-xs font-mono p-3 overflow-x-auto border border-gray-200">
          <code>{response}</code>
        </pre>
      </div>
    </section>
  );
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="spec-label text-muted-foreground mb-2">DEVELOPER DOCS</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Public API
          </h1>
          <p className="text-base text-muted-foreground">
            JSON endpoints for agent access signals across{" "}
            <span className="font-mono text-foreground">{BRAND_COUNT_DISPLAY}</span> e-commerce
            brands, refreshed by a daily scan. <strong className="text-foreground">No auth required for reads.</strong>{" "}
            Per-IP rate limit: 30–60 requests/minute per endpoint (HTTP 429 when exceeded).
            Data is licensed {DATA_LICENSE.name} — see <Link href="/data" className="text-[#0259DD] hover:underline">/data</Link> for
            bulk downloads and attribution requirements.
          </p>
        </div>

        <div className="border-l-2 border-[#FF6648] pl-4 mb-10 text-sm">
          <p className="text-foreground font-semibold mb-1">Base URL</p>
          <code className="font-mono text-muted-foreground">{BASE}</code>
        </div>

        <Endpoint
          method="GET"
          path="/api/matrix"
          summary="Full signal index: every brand's latest scan with per-agent access status, platform, CDN/WAF, and structured-data signals."
          curl={`curl ${BASE}/api/matrix`}
          response={`{
  "stats": {
    "totalBrands": 1015,
    "scannedBrands": 1006,
    "brandsBlocking": 36,
    "brandsFullyOpen": 970,
    "avgBlockedAgents": 0.1,
    "percentFullyOpen": 96
  },
  "brands": [
    {
      "slug": "nike",
      "name": "Nike",
      "url": "https://www.nike.com",
      "category": "fashion",
      "agentStatus": { "GPTBot": "restricted", "Claude-Web": "allowed", ... },
      "platform": "custom",
      "cdn": "akamai",
      "waf": "akamai",
      "hasJsonLd": true,
      "scannedAt": "2026-04-03T12:30:49.402Z"
    }
  ]
}`}
        />

        <Endpoint
          method="GET"
          path="/api/changelog?limit=50"
          summary="Confirmed signal changes detected across brands, newest first. limit: 1–500 (default 50)."
          curl={`curl "${BASE}/api/changelog?limit=5"`}
          response={`{
  "entries": [
    {
      "id": 1585,
      "brandId": 693,
      "field": "robots.txt presence",
      "oldValue": "true",
      "newValue": "false",
      "detectedAt": "2026-03-30T11:31:05.684Z",
      "brandSlug": "h-e-b",
      "brandName": "H-E-B"
    }
  ]
}`}
        />

        <Endpoint
          method="GET"
          path="/data/latest.json"
          summary="Bulk download: the full daily snapshot with license metadata and ARC Score component breakdowns. Also available as /data/latest.csv and dated /data/YYYY-MM-DD.json archives."
          curl={`curl ${BASE}/data/latest.json`}
          response={`{
  "dataset": "ARC Report — AI agent access in e-commerce",
  "date": "2026-06-09",
  "license": { "name": "CC BY 4.0", ... },
  "score_version": "1.0",
  "tracked_agents": ["GPTBot", "ChatGPT-User", ...],
  "brand_count": 1006,
  "brands": [
    {
      "slug": "allbirds",
      "agent_status": { "GPTBot": "no_rule", ... },
      "arc_score": 78,
      "arc_score_components": { "agent_access": 50, "structured_data": 22, ... },
      "scanned_at": "2026-04-03T11:58:01.102Z"
    }
  ]
}`}
        />

        <Endpoint
          method="GET"
          path="/api/scan-health"
          summary="Operational status of the daily scan pipeline: latest run details, data freshness, drift alerts."
          curl={`curl ${BASE}/api/scan-health`}
          response={`{
  "overallStatus": "green",
  "latestRun": {
    "status": "completed",
    "totalBrands": 1006,
    "completed": 1004,
    "failed": 2,
    "changesDetected": 127
  },
  "dataFreshness": { "freshBrands": 1004, "totalBrands": 1006, "percentage": 99 }
}`}
        />

        <section className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Agent Status Values
          </h2>
          <dl className="text-sm space-y-2">
            <div className="flex gap-3">
              <dt className="font-mono text-[#059669] font-bold w-28 shrink-0">allowed</dt>
              <dd className="text-muted-foreground">robots.txt explicitly permits the agent AND the site serves the agent a normal response.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-mono text-[#DC2626] font-bold w-28 shrink-0">blocked</dt>
              <dd className="text-muted-foreground">robots.txt explicitly disallows the agent (policy block).</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-mono text-[#D97706] font-bold w-28 shrink-0">restricted</dt>
              <dd className="text-muted-foreground">robots.txt allows the agent, but the WAF / CDN blocks or degrades the response (infrastructure block).</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-mono text-[#6B7280] font-bold w-28 shrink-0">no_rule</dt>
              <dd className="text-muted-foreground">robots.txt has no explicit rule for this agent (allowed by web convention).</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-mono text-[#9CA3AF] font-bold w-28 shrink-0">inconclusive</dt>
              <dd className="text-muted-foreground">the scan couldn&apos;t determine the status (timeout, network error). Never published as a change.</dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground mt-4">
            How these verdicts are produced — including the two-scan confirmation rule — is documented
            on <Link href="/methodology" className="text-[#0259DD] hover:underline">/methodology</Link>.
          </p>
        </section>

        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            MCP Server
          </h2>
          <p className="text-sm text-muted-foreground">
            Prefer tools over endpoints? The same data is exposed as an MCP server at{" "}
            <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5">{BASE}/api/mcp</code>{" "}
            (Streamable HTTP, no auth). Setup guides for Claude.ai, Claude Desktop, and Claude Code:{" "}
            <Link href="/docs/mcp" className="text-[#0259DD] hover:underline">/docs/mcp</Link>.
          </p>
        </section>

        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Need more?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Higher rate limits, full multi-year history, or custom exports:{" "}
            <Link href="/pro" className="text-[#0259DD] hover:underline">see Pro</Link> or email{" "}
            <a href="mailto:hello@arcreport.ai" className="text-[#0259DD] hover:underline">
              hello@arcreport.ai
            </a>.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
