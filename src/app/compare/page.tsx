import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CompareControls } from "@/components/compare/compare-controls";
import { CompareExportButton } from "@/components/compare/compare-export";
import {
  buildCompareData,
  getBrandOptions,
  POPULAR_COMPARISONS,
  MAX_COMPARE,
} from "@/lib/compare-data";
import { SITE_URL, TRACKED_AGENT_IDS } from "@/lib/site";
import type { Metadata } from "next";

const DEFAULT_SLUGS = POPULAR_COMPARISONS[0].slugs;

function parseBrandsParam(brands?: string): string[] {
  if (!brands) return [];
  return [...new Set(brands.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean))].slice(0, MAX_COMPARE);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ brands?: string }>;
}): Promise<Metadata> {
  const { brands: param } = await searchParams;
  const slugs = parseBrandsParam(param);
  const { brands } = buildCompareData(slugs.length >= 2 ? slugs : DEFAULT_SLUGS);
  const names = brands.map((b) => b.name);
  const vs = names.join(" vs ");
  const scores = brands.map((b) => `${b.name} ${b.score.total}`).join(" · ");

  const title = names.length >= 2
    ? `${vs} — AI Agent Access Compared | ARC Report`
    : "Compare Brands — AI Agent Access | ARC Report";
  const description = names.length >= 2
    ? `Side-by-side AI agent access: ARC Scores (${scores}), score components, and the per-agent matrix for ${TRACKED_AGENT_IDS.length} agents. Updated daily.`
    : "Compare 2–5 e-commerce brands side by side: ARC Scores, score components, and per-agent AI access. Free, updated daily.";
  const canonical = slugs.length >= 2
    ? `${SITE_URL}/compare?brands=${slugs.join(",")}`
    : `${SITE_URL}/compare`;
  const og = `${SITE_URL}/api/og?title=${encodeURIComponent(names.length >= 2 ? vs : "Compare brands")}&subtitle=${encodeURIComponent(
    names.length >= 2 ? `ARC Scores: ${scores}` : "AI agent access, side by side",
  )}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: [{ url: og, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

function statusCell(status: string | undefined): { label: string; cls: string } {
  switch (status) {
    case "allowed":
      return { label: "allowed", cls: "bg-emerald-50 text-[#059669]" };
    case "no_rule":
      return { label: "no rule", cls: "bg-blue-50 text-[#0259DD]" };
    case "blocked":
      return { label: "blocked", cls: "bg-red-50 text-[#DC2626]" };
    case "restricted":
      return { label: "restricted", cls: "bg-amber-50 text-[#D97706]" };
    default:
      return { label: "unknown", cls: "bg-gray-50 text-muted-foreground" };
  }
}

const SIGNAL_ROWS: Array<{ key: keyof ReturnType<typeof buildCompareData>["brands"][number]["signals"]; label: string }> = [
  { key: "jsonLd", label: "JSON-LD" },
  { key: "schemaProduct", label: "Schema.org Product" },
  { key: "openGraph", label: "Open Graph" },
  { key: "sitemap", label: "Sitemap" },
  { key: "productFeed", label: "Product feed" },
  { key: "llmsTxt", label: "llms.txt" },
  { key: "agentsTxt", label: "agents.txt" },
  { key: "ucp", label: "UCP" },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ brands?: string }>;
}) {
  const { brands: param } = await searchParams;
  const requested = parseBrandsParam(param);
  const isDefault = requested.length < 2;
  const slugs = isDefault ? DEFAULT_SLUGS : requested;
  const { brands, notFound, lastUpdated } = buildCompareData(slugs);
  const options = getBrandOptions();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8">
          <div className="spec-label text-muted-foreground mb-2">COMPARE · UPDATED DAILY</div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-3">
            {brands.length >= 2 ? brands.map((b) => b.name).join(" vs ") : "Compare brands"}
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            Side-by-side ARC Scores, component breakdowns, and per-agent access for up to{" "}
            {MAX_COMPARE} brands. The URL is the share link.
          </p>
        </div>

        <div className="mb-8">
          <CompareControls current={brands.map((b) => b.slug)} options={options} max={MAX_COMPARE} />
          {notFound.length > 0 && (
            <p className="text-xs text-[#D97706] mt-2">
              Not in the index yet: {notFound.join(", ")} — try the{" "}
              <Link href={`/scan?domain=${encodeURIComponent(notFound[0])}`} className="text-[#0259DD] hover:underline">instant scan</Link>.
            </p>
          )}
        </div>

        {brands.length >= 2 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-mono">
                Last scanned {lastUpdated?.split("T")[0]}
              </span>
              <CompareExportButton
                agentIds={[...TRACKED_AGENT_IDS]}
                brands={brands.map((b) => ({
                  name: b.name,
                  scoreTotal: b.score.total,
                  scoreColor: b.scoreColor,
                  components: [
                    { label: "Agent access", value: b.score.agentAccess, max: 50 },
                    { label: "Structured data", value: b.score.structuredData, max: 25 },
                    { label: "Protocol files", value: b.score.protocolFiles, max: 15 },
                    { label: "Stability", value: b.score.scanStability, max: 10 },
                  ],
                  agentStatus: b.agentStatus,
                }))}
              />
            </div>

            <div className="border-2 border-gray-200 bg-white overflow-x-auto mb-10">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-semibold w-44"></th>
                    {brands.map((b) => (
                      <th key={b.slug} className="text-left px-4 py-3">
                        <Link href={`/brand/${b.slug}`} className="font-black text-foreground hover:text-[#0259DD]">
                          {b.name}
                        </Link>
                        <div className="text-[10px] text-muted-foreground font-normal mt-0.5">{b.category}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-3 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      ARC Score v1.0
                    </td>
                    {brands.map((b) => (
                      <td key={b.slug} className="px-4 py-3">
                        <span className="text-3xl font-black font-mono" style={{ color: b.scoreColor }}>
                          {b.score.total}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">/100 · {b.scoreLabel}</span>
                      </td>
                    ))}
                  </tr>
                  {[
                    { label: "Agent access", get: (b: typeof brands[number]) => b.score.agentAccess, max: 50 },
                    { label: "Structured data", get: (b: typeof brands[number]) => b.score.structuredData, max: 25 },
                    { label: "Protocol files", get: (b: typeof brands[number]) => b.score.protocolFiles, max: 15 },
                    { label: "Scan stability", get: (b: typeof brands[number]) => b.score.scanStability, max: 10 },
                  ].map((row) => (
                    <tr key={row.label} className="border-b border-gray-100">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{row.label} <span className="font-mono">/{row.max}</span></td>
                      {brands.map((b) => (
                        <td key={b.slug} className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground w-9">{row.get(b)}</span>
                            <div className="flex-1 max-w-24 h-1.5 bg-gray-100">
                              <div className="h-full bg-[#0259DD]" style={{ width: `${(row.get(b) / row.max) * 100}%` }} />
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <td className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground" colSpan={brands.length + 1}>
                      Per-agent access
                    </td>
                  </tr>
                  {TRACKED_AGENT_IDS.map((agent) => (
                    <tr key={agent} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-mono text-xs">{agent}</td>
                      {brands.map((b) => {
                        const c = statusCell(b.agentStatus[agent]);
                        return (
                          <td key={b.slug} className="px-4 py-2">
                            <span className={`font-mono text-[11px] font-semibold px-1.5 py-0.5 ${c.cls}`}>{c.label}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <td className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground" colSpan={brands.length + 1}>
                      Data signals
                    </td>
                  </tr>
                  {SIGNAL_ROWS.map((row) => (
                    <tr key={row.key} className="border-b border-gray-100">
                      <td className="px-4 py-2 text-xs text-muted-foreground">{row.label}</td>
                      {brands.map((b) => (
                        <td key={b.slug} className="px-4 py-2 font-mono text-xs font-semibold">
                          {b.signals[row.key] ? <span className="text-[#059669]">yes</span> : <span className="text-[#DC2626]">no</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="px-4 py-2 text-xs text-muted-foreground">Platform / WAF</td>
                    {brands.map((b) => (
                      <td key={b.slug} className="px-4 py-2 font-mono text-xs">
                        {b.platform ?? "—"} / {b.waf && b.waf !== "none-detected" ? b.waf : "none"}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
            Popular comparisons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {POPULAR_COMPARISONS.map((p) => (
              <Link
                key={p.label}
                href={`/compare?brands=${p.slugs.join(",")}`}
                className="border border-gray-200 bg-white px-4 py-3 hover:border-[#0259DD] transition-colors"
              >
                <span className="text-sm font-bold text-foreground">{p.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5 font-mono">
                  {p.slugs.join(" vs ")}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <p className="text-xs text-muted-foreground mt-10">
          Scores are ARC Score v1.0 (<Link href="/methodology#score" className="text-[#0259DD] hover:underline">formula</Link>),
          recomputed from each daily scan. Data CC BY 4.0 (<Link href="/data" className="text-[#0259DD] hover:underline">download</Link>).
        </p>
      </main>
      <Footer />
    </div>
  );
}
