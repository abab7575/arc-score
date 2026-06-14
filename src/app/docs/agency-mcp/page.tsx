import Link from "next/link";
import type { Metadata } from "next";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Agency MCP — Private Portfolio Intelligence | ARC Report",
  description:
    "Connect an authenticated Arc for Agencies workspace to Claude Code or another MCP client and query private portfolio health, site reports, regressions, and remediation guidance.",
};

const MCP_URL = `${SITE_URL}/api/agency/mcp`;

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-[#0A1628] text-[#FFF8F0] text-xs font-mono p-4 overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}

export default function AgencyMcpDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="spec-label text-[#0259DD] mb-2">AUTHENTICATED AGENCY MCP</div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
          Use private portfolio intelligence inside an LLM
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          Every paid or trialing agency workspace can create a revocable API key. The key grants
          read-only access to that workspace only; it never exposes another agency&apos;s portfolio.
        </p>

        <section className="mt-8 border-2 bg-white p-5">
          <div className="text-sm font-bold">Server URL</div>
          <code className="block mt-2 text-sm break-all">{MCP_URL}</code>
          <div className="text-sm font-bold mt-5">Authentication</div>
          <code className="block mt-2 text-sm break-all">Authorization: Bearer arc_...</code>
          <p className="mt-4 text-xs text-muted-foreground">
            Create and revoke keys under <strong>Agency workspace → Settings &amp; MCP</strong>.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black mb-3">Available tools</h2>
          <div className="border bg-white divide-y text-sm">
            {[
              ["get_portfolio_health", "Portfolio score, open issues, stale scans, and priority sites."],
              ["list_portfolio_sites", "Monitored client and prospect stores with current findings."],
              ["get_site_report", "Detailed evidence and implementation-ready fixes for one store."],
              ["get_recent_regressions", "Confirmed portfolio changes from the last 1–30 days."],
            ].map(([name, description]) => (
              <div key={name} className="p-4">
                <code className="font-bold text-[#0259DD]">{name}</code>
                <p className="text-muted-foreground mt-1">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black mb-3">Claude Code</h2>
          <Code>{`claude mcp add --transport http arc-agency ${MCP_URL} \\
  --header "Authorization: Bearer YOUR_ARC_KEY"`}</Code>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black mb-3">Other MCP clients</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Configure a Streamable HTTP server using the URL above and add the Authorization header.
            The client must support custom HTTP headers.
          </p>
          <Code>{`{
  "type": "http",
  "url": "${MCP_URL}",
  "headers": {
    "Authorization": "Bearer YOUR_ARC_KEY"
  }
}`}</Code>
          <div className="mt-4 border border-[#FBBA16] bg-amber-50 p-4 text-sm">
            Claude.ai custom connectors that require OAuth are not yet supported by the private
            API-key flow. Use Claude Code or another client that supports static Bearer headers.
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-black mb-3">Protocol check</h2>
          <Code>{`curl -X POST ${MCP_URL} \\
  -H "Authorization: Bearer YOUR_ARC_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'`}</Code>
        </section>

        <section className="mt-10 pt-6 border-t text-sm text-muted-foreground">
          Looking for the open brand index instead? Use the{" "}
          <Link href="/docs/mcp" className="text-[#0259DD] hover:underline">public dataset MCP</Link>,
          which requires no account or API key.
        </section>
      </main>
      <Footer />
    </div>
  );
}
