import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { BrandTable } from "@/components/index/brand-table";
import { buildMatrixPayload, getChangelogWithBrands, getIndexStats } from "@/lib/index-data";
import { SITE_URL } from "@/lib/site";

// Server-rendered with hourly revalidation (data changes once per daily scan).
export const revalidate = 3600;

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? "" : "s"} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;
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

      {/* Hero */}
      <section style={{ backgroundColor: "#0A1628" }} className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.05] max-w-3xl">
            The public record of AI agent access in commerce.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
            ARC Report scans {stats.brandCount.toLocaleString()} e-commerce brands every day —
            robots.txt policies, live agent HTTP tests, structured data, platforms — and publishes
            the results as an open dataset. Free to browse, download, and query.
          </p>

          {/* Proof row */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-3xl">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {stats.brandCount.toLocaleString()}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Brands monitored
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {relativeTime(stats.lastScan)}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Last scan
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {stats.changesThisWeek.toLocaleString()}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Changes this week
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {stats.agentsTracked}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Agents tracked
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <a
              href="#brand-index"
              className="inline-block text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-6 py-3 transition-colors"
            >
              Browse the index →
            </a>
            <Link
              href="/data"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors underline underline-offset-4"
            >
              Download the data
            </Link>
            <Link
              href="/docs/mcp"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors underline underline-offset-4"
            >
              Query via MCP
            </Link>
          </div>
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
