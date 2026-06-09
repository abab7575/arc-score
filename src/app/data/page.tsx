import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { getAvailableSnapshotDates } from "@/lib/data-export";
import { getIndexStats } from "@/lib/index-data";
import { DATA_LICENSE, SITE_URL, TRACKED_AGENT_COUNT } from "@/lib/site";
import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Open Data Downloads — ARC Report",
  description:
    "Free daily snapshots of AI agent access across 1,000+ e-commerce brands. JSON and CSV at stable URLs, dated archive, licensed CC BY 4.0.",
};

export default function DataPage() {
  const stats = getIndexStats();
  const dates = getAvailableSnapshotDates();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <div className="spec-label text-muted-foreground mb-2">OPEN DATA</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            Download the dataset
          </h1>
          <p className="text-base text-muted-foreground">
            One snapshot per day covering {stats.scannedBrandCount.toLocaleString()} brands ×{" "}
            {TRACKED_AGENT_COUNT} AI agents: per-agent access status, platform, structured-data
            signals, protocol files, and ARC Score with component breakdown.
            {stats.lastScan && (
              <> Last scan: <span className="font-mono">{stats.lastScan.replace("T", " ").slice(0, 16)} UTC</span>.</>
            )}
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Stable URLs (always the newest scan)
          </h2>
          <div className="space-y-3">
            {[
              { href: "/data/latest.json", label: "latest.json", desc: "Full snapshot as JSON — metadata, license, per-brand records." },
              { href: "/data/latest.csv", label: "latest.csv", desc: "Flat CSV — one row per brand, one column per agent." },
            ].map((d) => (
              <div key={d.href} className="border border-gray-200 bg-white px-4 py-3 flex items-baseline justify-between gap-4">
                <div>
                  <a href={d.href} className="font-mono text-sm font-bold text-[#0259DD] hover:underline">
                    {SITE_URL.replace(/^https?:\/\//, "")}{d.href}
                  </a>
                  <p className="text-xs text-muted-foreground mt-1">{d.desc}</p>
                </div>
                <a href={d.href} className="text-xs font-bold text-white bg-[#0259DD] hover:bg-[#024bb5] px-3 py-1.5 shrink-0 transition-colors">
                  Download
                </a>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Dated archive
          </h2>
          <p className="text-sm text-muted-foreground mb-3">
            <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5">/data/YYYY-MM-DD.json</code>{" "}
            or <code className="font-mono text-xs bg-gray-100 px-1.5 py-0.5">.csv</code> returns each
            brand&apos;s most recent scan as of that UTC date. {dates.length} days available.
          </p>
          <div className="border border-gray-200 bg-white px-4 py-3 max-h-64 overflow-y-auto">
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-sm font-mono">
              {dates.map((d) => (
                <li key={d}>
                  <a href={`/data/${d}.json`} className="text-[#0259DD] hover:underline">{d}.json</a>
                  {" · "}
                  <a href={`/data/${d}.csv`} className="text-[#0259DD] hover:underline">csv</a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Other ways to query
          </h2>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>• <Link href="/docs" className="text-[#0259DD] hover:underline">Public JSON API</Link> — no auth, per-IP rate limits.</li>
            <li>• <Link href="/docs/mcp" className="text-[#0259DD] hover:underline">MCP server</Link> — query the index from Claude or any MCP client.</li>
            <li>• <a href="/matrix.md" className="text-[#0259DD] hover:underline">Markdown variants</a> — append <code className="font-mono text-xs bg-gray-100 px-1 py-0.5">.md</code> to key pages.</li>
          </ul>
        </section>

        <section className="border-2 border-[#0259DD]/20 bg-blue-50/40 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">
            License: {DATA_LICENSE.name}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The ARC Report dataset is licensed under{" "}
            <a href={DATA_LICENSE.url} className="text-[#0259DD] hover:underline" rel="license">
              Creative Commons Attribution 4.0
            </a>
            . You may copy, redistribute, and adapt it for any purpose, including commercially,
            provided you give attribution. Suggested attribution:
          </p>
          <pre className="mt-3 bg-white border border-gray-200 text-xs font-mono p-3 overflow-x-auto">{DATA_LICENSE.attribution}</pre>
          <p className="text-xs text-muted-foreground mt-2">
            When citing a specific statistic, link the page it appears on (e.g.{" "}
            <Link href="/insights" className="text-[#0259DD] hover:underline">/insights</Link>) and include the snapshot date.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
