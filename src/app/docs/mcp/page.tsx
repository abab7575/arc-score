import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Public Dataset MCP — Query the ARC Index | ARC Report",
  description:
    "Connect the ARC Report MCP server to Claude.ai, Claude Desktop, or Claude Code and query AI agent access for 1,000+ e-commerce brands in natural language. No auth required.",
};

const MCP_URL = `${SITE_URL}/api/mcp`;

function Code({ children }: { children: string }) {
  return (
    <pre className="bg-[#0A1628] text-[#FFF8F0] text-xs font-mono p-3 overflow-x-auto mb-3">
      <code>{children}</code>
    </pre>
  );
}

export default function McpDocsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="spec-label text-muted-foreground mb-2">PUBLIC DATASET MCP</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Query the public index from your LLM
          </h1>
          <p className="text-base text-muted-foreground">
            ARC Report ships a remote{" "}
            <a href="https://modelcontextprotocol.io" className="text-[#0259DD] hover:underline">
              Model Context Protocol
            </a>{" "}
            server over Streamable HTTP. No API key, no account — per-IP rate limits only
            (60 requests/minute). Every response includes a <code className="font-mono text-xs bg-gray-100 px-1 py-0.5">source_url</code> and{" "}
            <code className="font-mono text-xs bg-gray-100 px-1 py-0.5">last_updated</code> timestamp for citation.
          </p>
          <div className="border-l-2 border-[#FF6648] pl-4 mt-5 text-sm">
            <p className="text-foreground font-semibold mb-1">Public server URL</p>
            <code className="font-mono text-muted-foreground">{MCP_URL}</code>
          </div>
          <div className="mt-5 border border-[#FBBA16] bg-amber-50 px-4 py-3 text-sm">
            <strong>This server contains public index data only.</strong>{" "}
            Agency portfolio health, private reports, regressions, and fix prompts use the authenticated{" "}
            <Link href="/docs/agency-mcp" className="text-[#0259DD] hover:underline">Agency MCP</Link>.
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">Tools</h2>
          <div className="border border-gray-200 bg-white divide-y divide-gray-100 text-sm">
            {[
              ["get_brand_status(domain)", "Per-agent access for all 9 tracked agents, platform, structured data quality, llms.txt, ARC Score, last scanned."],
              ["search_brands(query?, category?, platform?, blocking_agent?, allowing_agent?)", "Filtered, paginated search over the full index."],
              ["get_recent_changes(days=7, category?)", "Confirmed changelog entries with before/after values."],
              ["get_agent_stats(agent?)", "% of the index blocking each agent, by category, with week-over-week deltas."],
              ["compare_brands(domains[])", "Side-by-side matrix for up to 10 brands."],
            ].map(([sig, desc]) => (
              <div key={sig} className="px-4 py-3">
                <code className="font-mono text-xs font-bold text-[#0259DD]">{sig}</code>
                <p className="text-muted-foreground mt-1">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Resources: <code className="font-mono">arc://methodology</code> (scan design + score formula) and{" "}
            <code className="font-mono">arc://insights/latest</code> (headline stats from the latest scan).
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Claude.ai (custom connector)
          </h2>
          <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal pl-5">
            <li>Open <span className="font-semibold text-foreground">Settings → Connectors → Add custom connector</span>.</li>
            <li>Name it <span className="font-mono text-xs">ARC Report</span> and paste the server URL above.</li>
            <li>Leave authentication empty (none required) and save.</li>
            <li>Enable the connector in any chat via the search-and-tools menu.</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Claude Desktop
          </h2>
          <p className="text-sm text-muted-foreground mb-2">
            Settings → Developer → Edit Config, then add to <code className="font-mono text-xs">claude_desktop_config.json</code>:
          </p>
          <Code>{`{
  "mcpServers": {
    "arc-report": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "${MCP_URL}"]
    }
  }
}`}</Code>
          <p className="text-xs text-muted-foreground">
            (Desktop launches local servers; <code className="font-mono">mcp-remote</code> bridges to the remote URL. On
            paid plans you can instead add it as a custom connector like Claude.ai above.)
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Claude Code
          </h2>
          <Code>{`claude mcp add --transport http arc-report ${MCP_URL}`}</Code>
          <p className="text-xs text-muted-foreground">
            Then ask Claude Code anything about the dataset — it will call the tools directly.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Three prompts to try
          </h2>
          <div className="space-y-3 text-sm">
            {[
              "Which fashion brands block ClaudeBot but allow GPTBot? Compare the top 5 side by side.",
              "What changed in AI agent access across e-commerce in the last 14 days? Summarize the biggest blocks and opens.",
              "Compare nike.com, adidas.com, and zara.com: who is most open to AI shopping agents, and what's driving the ARC Score difference?",
            ].map((p) => (
              <div key={p} className="border border-gray-200 bg-white px-4 py-3 font-mono text-xs text-foreground">
                {p}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Raw protocol (curl)
          </h2>
          <Code>{`curl -X POST ${MCP_URL} \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"get_brand_status","arguments":{"domain":"nike.com"}}}'`}</Code>
        </section>

        <section className="pt-6 border-t border-gray-200 text-sm text-muted-foreground">
          Data is licensed CC BY 4.0 — attribution required (see <Link href="/data" className="text-[#0259DD] hover:underline">/data</Link>).
          Prefer plain HTTP? Use the <Link href="/docs" className="text-[#0259DD] hover:underline">JSON API</Link> or{" "}
          <a href="/matrix.md" className="text-[#0259DD] hover:underline">markdown variants</a>.
        </section>
      </main>
      <Footer />
    </div>
  );
}
