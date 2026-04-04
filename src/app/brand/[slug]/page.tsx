import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { getBrandBySlug, getLatestLightweightScan, getChangelogForBrand } from "@/lib/db/queries";
import type { Metadata } from "next";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };

  return {
    title: `${brand.name} — Agent Signals | ARC Report`,
    description: `Latest agent-access signals, infrastructure, and structured data for ${brand.name}. Updated daily.`,
  };
}

const AGENT_ORDER = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Amazonbot",
  "Bingbot",
];

function statusStyle(status: string): { label: string; color: string } {
  switch (status) {
    case "allowed":
      return { label: "allowed", color: "#059669" };
    case "blocked":
      return { label: "blocked", color: "#DC2626" };
    case "restricted":
      return { label: "restricted", color: "#D97706" };
    case "no_rule":
      return { label: "no rule", color: "#6B7280" };
    case "inconclusive":
      return { label: "inconclusive", color: "#9CA3AF" };
    default:
      return { label: status, color: "#9CA3AF" };
  }
}

function Signal({ label, present, detail }: { label: string; present: boolean; detail?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <span className="text-sm text-foreground">{label}</span>
      <div className="flex items-center gap-2">
        {detail && <span className="text-xs font-mono text-muted-foreground">{detail}</span>}
        <span
          className="text-xs font-mono font-bold uppercase tracking-wider"
          style={{ color: present ? "#059669" : "#9CA3AF" }}
        >
          {present ? "detected" : "not detected"}
        </span>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <span className="text-sm text-foreground">{label}</span>
      <span className="text-xs font-mono text-muted-foreground">{value || "unknown"}</span>
    </div>
  );
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const scan = getLatestLightweightScan(brand.id);
  const changelog = getChangelogForBrand(brand.id, 10);

  let agentStatus: Record<string, string> = {};
  if (scan?.agentStatusJson) {
    try {
      agentStatus = JSON.parse(scan.agentStatusJson) as Record<string, string>;
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="spec-label text-muted-foreground">BRAND</span>
            <span className="spec-label text-muted-foreground">/</span>
            <span className="spec-label text-muted-foreground uppercase">{brand.category || "—"}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mb-2">
            {brand.name}
          </h1>
          <a
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono text-[#0259DD] hover:underline"
          >
            {brand.url}
          </a>
          {scan && (
            <p className="text-xs font-mono text-muted-foreground mt-3">
              last scanned: {new Date(scan.scannedAt).toISOString().split(".")[0]}Z
            </p>
          )}
        </div>

        {!scan ? (
          <div className="border-2 border-gray-200 p-8 text-center">
            <p className="text-sm text-muted-foreground">No scan data yet for this brand.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Agent Access */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
                Agent Access
              </h2>
              <div className="border-2 border-gray-200">
                <table className="w-full">
                  <tbody>
                    {AGENT_ORDER.map((agent) => {
                      const status = agentStatus[agent] ?? "inconclusive";
                      const s = statusStyle(status);
                      return (
                        <tr key={agent} className="border-b border-gray-200 last:border-b-0">
                          <td className="px-4 py-2 text-sm font-mono text-foreground">{agent}</td>
                          <td className="px-4 py-2 text-right">
                            <span
                              className="text-xs font-mono font-bold uppercase tracking-wider"
                              style={{ color: s.color }}
                            >
                              {s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Infrastructure */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
                Infrastructure
              </h2>
              <div className="border-2 border-gray-200 px-4">
                <Field label="Platform" value={scan.platform} />
                <Field label="CDN" value={scan.cdn} />
                <Field label="WAF" value={scan.waf} />
                <Field
                  label="Homepage response"
                  value={scan.homepageResponseMs ? `${scan.homepageResponseMs}ms` : null}
                />
              </div>
            </section>

            {/* Signals */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
                Signals
              </h2>
              <div className="border-2 border-gray-200 px-4">
                <Signal label="robots.txt" present={scan.robotsTxtFound} />
                <Signal label="JSON-LD" present={scan.hasJsonLd} />
                <Signal label="Schema.org Product" present={scan.hasSchemaProduct} />
                <Signal label="Open Graph" present={scan.hasOpenGraph} />
                <Signal label="Sitemap" present={scan.hasSitemap} />
                <Signal label="Product feed" present={scan.hasProductFeed} />
                <Signal
                  label="llms.txt"
                  present={scan.hasLlmsTxt}
                  detail={
                    scan.hasLlmsTxt && scan.llmsTxtBytes
                      ? `${scan.llmsTxtBytes}B / ${scan.llmsTxtLinkCount ?? 0} links`
                      : undefined
                  }
                />
                <Signal
                  label="Agent declaration file"
                  present={scan.hasAgentsTxt}
                  detail={scan.hasAgentsTxt ? scan.agentsTxtVariant ?? undefined : undefined}
                />
                <Signal label="UCP endpoint" present={scan.hasUcp} />
              </div>
            </section>

            {/* Recent Changes */}
            {changelog.length > 0 && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3">
                  Recent Changes
                </h2>
                <div className="border-2 border-gray-200">
                  {changelog.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-4 py-3 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <div className="flex-1">
                          <span className="text-sm text-foreground font-medium">{entry.field}</span>
                          <span className="text-xs font-mono text-muted-foreground ml-2">
                            {entry.oldValue ?? "null"} → {entry.newValue ?? "null"}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-muted-foreground shrink-0">
                          {new Date(entry.detectedAt).toISOString().split("T")[0]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="pt-4">
              <Link
                href="/changelog"
                className="text-sm text-[#0259DD] hover:underline font-mono"
              >
                ← back to changelog
              </Link>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
