import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { BrandTable } from "@/components/index/brand-table";
import { buildMatrixPayload, getChangelogWithBrands, getIndexStats } from "@/lib/index-data";
import { ScanInput } from "@/components/scan/scan-input";
import { SITE_URL } from "@/lib/site";

// Server-rendered with hourly revalidation (data changes once per daily scan).
export const dynamic = "force-dynamic";

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

function formatFieldLabel(field: string): string {
  if (field.startsWith("agent_access_")) return field.replace("agent_access_", "") + " access";
  if (field.startsWith("agent_ua_")) return field.replace("agent_ua_", "") + " HTTP access";
  if (field.endsWith(" robots.txt")) return field;
  return field;
}

export default function HomePage() {
  const { brands } = buildMatrixPayload();
  const stats = getIndexStats();
  const recentChanges = getChangelogWithBrands(10);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ARC Report",
    url: SITE_URL,
    description: `ARC Report is the public reference dataset for AI agent access in e-commerce: ${stats.brandCount.toLocaleString()} brands scanned daily.`,
  };

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "ARC Report — AI agent access in e-commerce",
    description: `Daily scan of ${stats.brandCount.toLocaleString()} e-commerce brands for AI agent access signals: robots.txt policies, live HTTP agent tests, structured data, platform detection, llms.txt.`,
    url: SITE_URL,
    license: "https://creativecommons.org/licenses/by/4.0/",
    isAccessibleForFree: true,
    creator: { "@type": "Organization", name: "ARC Report", url: SITE_URL },
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: `${SITE_URL}/data/latest.json`,
      },
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: `${SITE_URL}/data/latest.csv`,
      },
    ],
    ...(stats.lastScan ? { dateModified: stats.lastScan } : {}),
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }}
      />
      <Navbar />

      {/* Hero — mission control */}
      <section style={{ backgroundColor: "#0A1628" }} className="relative border-b border-white/10 overflow-hidden">
        {/* CRT scan lines + retro grid */}
        <div className="scan-lines" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(132,175,251,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(132,175,251,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18 z-[2]">
          {/* Mission patch line */}
          <div className="flex items-center gap-3 mb-7">
            <span className="spec-label text-[#FF6648] text-[10px] px-2.5 py-1 border border-[#FF6648]/40" style={{ backgroundColor: "#FF664818" }}>
              ARC // PUBLIC RECORD
            </span>
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
              <span className="spec-label text-white/40 text-[9px]">
                DAILY SCAN · {stats.agentsTracked} AGENTS · OPEN DATA CC BY 4.0
              </span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.05] max-w-3xl">
            The public record of{" "}
            <span className="relative inline-block text-[#FBBA16]">
              AI agent access
              <span className="absolute left-0 -bottom-1 w-full h-[3px] bg-[#FF6648]" />
            </span>{" "}
            in commerce.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
            ARC Report scans {stats.brandCount.toLocaleString()} e-commerce brands every day —
            robots.txt policies, live agent HTTP tests, structured data, platforms — and publishes
            the results as an open dataset. Free to browse, download, and query.
          </p>

          {/* Instrument readouts */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
            {[
              { value: stats.brandCount.toLocaleString(), label: "BRANDS MONITORED", color: "#FF6648" },
              { value: relativeTime(stats.lastScan), label: "LAST SCAN", color: "#FBBA16" },
              { value: stats.changesThisWeek.toLocaleString(), label: "CHANGES THIS WEEK", color: "#84AFFB" },
              { value: String(stats.agentsTracked), label: "AGENTS TRACKED", color: "#059669" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative border border-white/15 bg-white/[0.04] px-4 py-3"
              >
                <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: stat.color }} />
                <div className="text-xl sm:text-2xl font-black text-white font-mono tabular-nums leading-tight">
                  {stat.value}
                </div>
                <div className="mt-1.5 spec-label text-white/45 text-[9px]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Instant scan — console input */}
          <div className="mt-8 max-w-xl">
            <div className="spec-label text-white/40 text-[9px] mb-2">RUN YOUR OWN SCAN — FREE, NO SIGNUP</div>
            <ScanInput />
          </div>

          {/* CTAs with offset-shadow blocks */}
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <a
              href="#brand-index"
              className="relative inline-block text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-6 py-3 transition-all hover:translate-y-[-2px] group"
            >
              Browse the index →
              <span className="absolute inset-0 bg-[#0259DD] -z-10 translate-x-[3px] translate-y-[3px] group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-transform" />
            </a>
            <Link
              href="/data"
              className="text-sm font-semibold text-white/70 hover:text-[#FBBA16] transition-colors underline underline-offset-4"
            >
              Download the data
            </Link>
            <Link
              href="/docs/mcp"
              className="text-sm font-semibold text-white/70 hover:text-[#FBBA16] transition-colors underline underline-offset-4"
            >
              Query via MCP
            </Link>
          </div>
        </div>

        {/* Cassette color strip — bottom edge */}
        <div className="relative z-[2] flex h-[6px]">
          <div className="flex-1 bg-[#FF6648]" />
          <div className="flex-1 bg-[#FBBA16]" />
          <div className="flex-1 bg-[#0259DD]" />
          <div className="flex-1 bg-[#84AFFB]" />
          <div className="flex-1 bg-[#FFE1D7]" />
          <div className="flex-1 bg-[#059669]" />
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Brand index — full list server-rendered; filtering is client enhancement */}
        <div id="brand-index" className="scroll-mt-16">
          <BrandTable brands={brands} />
        </div>

        {/* Live Changes feed */}
        <div className="mt-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Recent changes
            </h2>
            <Link href="/changelog" className="text-xs font-semibold text-[#0259DD] hover:text-[#FF6648] transition-colors">
              View all →
            </Link>
          </div>

          {recentChanges.length > 0 ? (
            <div className="border border-gray-200 bg-white divide-y divide-gray-100">
              {recentChanges.map(entry => (
                <Link
                  key={entry.id}
                  href={`/brand/${entry.brandSlug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="font-medium text-foreground">{entry.brandName}</span>
                    <span className="text-muted-foreground ml-2">
                      {formatFieldLabel(entry.field)}:{" "}
                    </span>
                    <span className="font-mono text-xs bg-red-50 text-red-700 px-1 py-0.5">
                      {entry.oldValue ?? "none"}
                    </span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="font-mono text-xs bg-green-50 text-green-700 px-1 py-0.5">
                      {entry.newValue ?? "none"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-4 flex-shrink-0">
                    {relativeTime(entry.detectedAt)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 bg-white px-4 py-8 text-center text-sm text-muted-foreground">
              No recent changes.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
