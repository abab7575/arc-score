import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs — ARC Report",
  description:
    "Public JSON API for agent access signals across 1,000+ e-commerce brands. No auth, no keys. Use from curl, scripts, or your agent.",
};

const BASE = "https://www.arcreport.ai";

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
            <span className="font-mono text-foreground">1,000+</span> e-commerce
            brands. No auth required for public read endpoints. Pro subscribers
            get higher limits and export access. Use
            it from curl, your scripts, your agents.
          </p>
        </div>

        <div className="border-l-2 border-[#FF6648] pl-4 mb-10 text-sm">
          <p className="text-foreground font-semibold mb-1">Base URL</p>
          <code className="font-mono text-muted-foreground">{BASE}</code>
        </div>

        <Endpoint
          method="GET"
          path="/api/matrix"
          summary="Full signal index: every brand's latest scan with agent-access status, platform, CDN/WAF, and structured-data signals."
          curl={`curl ${BASE}/api/matrix`}
          response={`{
  "stats": {
    "totalBrands": 1006,
    "scannedBrands": 1006,
    "brandsBlocking": 36,
    "brandsFullyOpen": 970,
    "avgBlockedAgents": 0.1,
    "percentFullyOpen": 96
  },
  "brands": [
    {
      "id": 1,
      "slug": "nike",
      "name": "Nike",
      "url": "https://www.nike.com",
      "category": "fashion",
      "agentStatus": {
        "GPTBot": "restricted",
        "ChatGPT-User": "restricted",
        "ClaudeBot": "restricted",
        "Claude-Web": "allowed",
        ...
      },
      "platform": "custom",
      "cdn": "akamai",
      "waf": "akamai",
      ...
    }
  ]
}`}
        />

        <Endpoint
          method="GET"
          path="/api/changelog"
          summary="Recent signal changes detected across brands. Free tier returns recent entries. Pro subscribers get full 90-day history."
          curl={`curl ${BASE}/api/changelog`}
          response={`{
  "isPro": false,
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
          path="/api/scan-health"
          summary="Operational status of the daily scan pipeline. Includes latest run details, data freshness, and drift alerts."
          curl={`curl ${BASE}/api/scan-health`}
          response={`{
  "overallStatus": "green",
  "latestRun": {
    "id": 3,
    "status": "completed",
    "totalBrands": 1006,
    "completed": 1004,
    "failed": 2,
    "changesDetected": 127,
    "startedAt": "2026-04-04T22:33:53.707Z",
    "completedAt": "2026-04-04T22:41:12.019Z"
  },
  "dataFreshness": {
    "freshBrands": 1004,
    "totalBrands": 1006,
    "percentage": 99
  }
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
              <dd className="text-muted-foreground">robots.txt allows the agent, but the WAF / CDN blocks or degrades the response (infra block).</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-mono text-[#6B7280] font-bold w-28 shrink-0">no_rule</dt>
              <dd className="text-muted-foreground">robots.txt has no explicit rule for this agent. Default varies by site.</dd>
            </div>
            <div className="flex gap-3">
              <dt className="font-mono text-[#9CA3AF] font-bold w-28 shrink-0">inconclusive</dt>
              <dd className="text-muted-foreground">the scan couldn&apos;t determine the status (timeout, network error).</dd>
            </div>
          </dl>
        </section>

        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Pro Endpoints
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            These require authentication (session cookie from login).
          </p>
          <div className="space-y-4 text-sm">
            <div className="border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#059669] bg-emerald-50 px-2 py-0.5">GET</span>
                <code className="font-mono text-foreground">/api/export?type=matrix&format=csv</code>
              </div>
              <p className="text-muted-foreground">Export the full brand matrix or changelog as CSV or JSON. Params: <code className="font-mono">type</code> (matrix, changelog), <code className="font-mono">format</code> (csv, json).</p>
            </div>
            <div className="border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-[#059669] bg-emerald-50 px-2 py-0.5">GET</span>
                <span className="text-xs font-mono font-bold text-[#0259DD] bg-blue-50 px-2 py-0.5">POST</span>
                <span className="text-xs font-mono font-bold text-[#DC2626] bg-red-50 px-2 py-0.5">DELETE</span>
                <code className="font-mono text-foreground">/api/watchlist</code>
              </div>
              <p className="text-muted-foreground">Manage your brand watchlist. GET returns watched brands, POST adds a brand, DELETE removes one. Body: <code className="font-mono">{`{ brandId }`}</code>.</p>
            </div>
          </div>
        </section>

        <section className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Need more?
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Pro ($149/mo) includes full history, daily alerts, watchlists, and data exports.{" "}
            <a href="/pricing" className="text-[#0259DD] hover:underline">See pricing</a> or email{" "}
            <a href="mailto:hello@arcreport.ai" className="text-[#0259DD] hover:underline">
              hello@arcreport.ai
            </a>{" "}
            for custom integrations.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
