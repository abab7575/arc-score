import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { getIndexStats } from "@/lib/index-data";
import { TRACKED_AGENTS, TRACKED_AGENT_COUNT, SCORE_VERSION, CONTACT_EMAIL } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Methodology — How ARC Report Scans Work | ARC Report",
  description:
    "Exactly how ARC Report measures AI agent access: the 9 tracked agents, robots.txt parsing, live HTTP tests, the two-scan confirmation rule, scan timing, the ARC Score v1.0 formula, and known limitations.",
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-xl font-black text-foreground tracking-tight mt-12 mb-4 scroll-mt-20">
      <a href={`#${id}`} className="hover:text-[#0259DD]">{children}</a>
    </h2>
  );
}

export default function MethodologyPage() {
  const stats = getIndexStats();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-4">
          <div className="spec-label text-muted-foreground mb-2">METHODOLOGY</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            How the scans work
          </h1>
          <p className="text-base text-muted-foreground">
            ARC Report runs one scan per brand per day at 02:00 UTC across{" "}
            {stats.brandCount.toLocaleString()} tracked brands — an HTTP-only scanner making
            roughly 25 requests per brand. No browser automation, no scraping of page content
            beyond the homepage and one product page. Everything published is reproducible
            from the requests described below.
            {stats.lastScan && (
              <> Last completed scan: <span className="font-mono text-foreground">{stats.lastScan.replace("T", " ").slice(0, 16)} UTC</span>.</>
            )}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Machine-readable version: <a href="/methodology.md" className="text-[#0259DD] hover:underline font-mono">/methodology.md</a>
          </p>
        </div>

        <H2 id="agents">The {TRACKED_AGENT_COUNT} tracked agents</H2>
        <div className="border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-semibold">User-Agent</th>
                <th className="text-left px-4 py-2.5 font-semibold">Company</th>
                <th className="text-left px-4 py-2.5 font-semibold">Used by</th>
              </tr>
            </thead>
            <tbody>
              {TRACKED_AGENTS.map((a) => (
                <tr key={a.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{a.id}</td>
                  <td className="px-4 py-2">{a.company}</td>
                  <td className="px-4 py-2 text-muted-foreground">{a.product}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <H2 id="robots">1. robots.txt parsing</H2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We fetch <code className="font-mono text-xs bg-gray-100 px-1 py-0.5">/robots.txt</code> and
          parse it with a standards-compliant parser, recording the effective rule for each of the{" "}
          {TRACKED_AGENT_COUNT} agents: explicitly <strong className="text-[#059669]">allowed</strong>,
          explicitly <strong className="text-[#DC2626]">blocked</strong> (Disallow), or{" "}
          <strong className="text-[#0259DD]">no_rule</strong> (no mention — allowed by web convention).
          robots.txt is a policy declaration, so these verdicts are high-confidence text diffs.
        </p>

        <H2 id="http">2. Live HTTP access tests</H2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          Policy and enforcement differ, so we also send real requests with each agent&apos;s
          User-Agent string against the homepage and one product page, comparing each response
          to a Chrome-baseline request:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>HTTP 403/406/429 or a bot-challenge page → the agent is <strong className="text-[#D97706]">restricted</strong> (WAF/CDN enforcement, not robots.txt policy).</li>
          <li>Response body under 25% of the Chrome baseline → treated as degraded/challenged → <strong className="text-[#D97706]">restricted</strong>.</li>
          <li>Timeouts and network errors → <strong>inconclusive</strong>. Inconclusive results are never published as changes.</li>
        </ul>

        <H2 id="signals">3. Structured data, protocol files, infrastructure</H2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li><strong className="text-foreground">Structured data</strong> — JSON-LD blocks, Schema.org Product markup, Open Graph tags, sitemap.xml, and product feeds, detected from server-rendered HTML.</li>
          <li><strong className="text-foreground">Protocol files</strong> — <code className="font-mono text-xs">llms.txt</code> (recording size and link count), <code className="font-mono text-xs">agents.txt</code> variants, and UCP endpoints.</li>
          <li><strong className="text-foreground">Infrastructure</strong> — e-commerce platform, CDN, and WAF fingerprinting from headers, cookies, and markup signatures.</li>
        </ul>

        <H2 id="confirmation">The two-scan confirmation rule</H2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Published changes follow a two-tier confirmation system.{" "}
          <strong className="text-foreground">Tier 1 (immediate):</strong> robots.txt rule changes —
          these are text-file diffs; if the rule changed, it changed.{" "}
          <strong className="text-foreground">Tier 2 (requires confirmation):</strong> HTTP access
          verdicts, blocked-agent counts, CDN/WAF detection, and structured-data presence are
          inferences that can flicker with timeouts, WAF moods, or CDN caches — a Tier 2 change
          must appear in <em>two consecutive daily scans</em> before it is published to the
          changelog. Scanner failures (timeouts, HTTP 429) are never published as brand changes.
        </p>

        <H2 id="score">ARC Score v{SCORE_VERSION}</H2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-3">
          A 0–100 score summarizing how accessible a brand is to AI agents, computed from the
          latest scan. The component breakdown is always shown alongside the number.
        </p>
        <div className="border border-gray-200 bg-white overflow-x-auto mb-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="text-left px-4 py-2.5 font-semibold">Component</th>
                <th className="text-left px-4 py-2.5 font-semibold">Points</th>
                <th className="text-left px-4 py-2.5 font-semibold">Computation</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2 font-semibold text-foreground">Agent access breadth</td>
                <td className="px-4 py-2 font-mono">50</td>
                <td className="px-4 py-2">Mean per-agent access over the {TRACKED_AGENT_COUNT} agents: allowed / no_rule = 1.0, inconclusive = 0.5, restricted = 0.25, blocked = 0 — × 50.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2 font-semibold text-foreground">Structured data quality</td>
                <td className="px-4 py-2 font-mono">25</td>
                <td className="px-4 py-2">JSON-LD 7 · Schema.org Product 7 · Open Graph 4 · sitemap 4 · product feed 3.</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="px-4 py-2 font-semibold text-foreground">Protocol files</td>
                <td className="px-4 py-2 font-mono">15</td>
                <td className="px-4 py-2">llms.txt present 6 (+3 if it contains links) · agents.txt 3 · UCP 3.</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-semibold text-foreground">Scan stability</td>
                <td className="px-4 py-2 font-mono">10</td>
                <td className="px-4 py-2">Share of the {TRACKED_AGENT_COUNT} per-agent checks returning a conclusive verdict in the latest scan — × 10. Measures confidence, not access.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Versioning policy:</strong> the formula above is
          frozen as Score v{SCORE_VERSION}. Any change to weights or inputs ships as a new
          version with a changelog entry on this page, and the score version is included in all
          data downloads (<code className="font-mono text-xs">score_version</code>) and MCP
          responses so historical comparisons stay meaningful.
        </p>

        <H2 id="limitations">Known limitations</H2>
        <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
          <li>robots.txt declares policy; enforcement can differ. We measure both and label them separately (blocked vs restricted) — neither alone is the full story.</li>
          <li>Structured-data detection reads server-rendered HTML; markup injected by JavaScript can be missed (we mark these signals as lower-confidence in the changelog).</li>
          <li>WAF behaviour varies by region, time, and request fingerprint. The two-scan rule reduces flicker but cannot eliminate it; see <Link href="/reliability" className="text-[#0259DD] hover:underline">/reliability</Link>.</li>
          <li>UA-string tests approximate agent traffic; they don&apos;t execute JavaScript or replicate full agent behaviour.</li>
          <li>One scan per day means sub-daily changes can be missed or appear as a single combined change.</li>
        </ul>

        <H2 id="disputes">Corrections & disputes</H2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Think a data point is wrong? See the{" "}
          <Link href="/reliability" className="text-[#0259DD] hover:underline">reliability page</Link>{" "}
          for the dispute process, or email{" "}
          <a href={`mailto:${CONTACT_EMAIL}?subject=%5BDATA%20DISPUTE%5D%20your-domain.com`} className="text-[#0259DD] hover:underline">{CONTACT_EMAIL}</a>{" "}
          with subject <code className="font-mono text-xs bg-gray-100 px-1 py-0.5">[DATA DISPUTE] your-domain.com</code>.
        </p>
      </main>
      <Footer />
    </div>
  );
}
