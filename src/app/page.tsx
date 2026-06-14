import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { BrandTable } from "@/components/index/brand-table";
import { buildMatrixPayload, getChangelogWithBrands, getIndexStats } from "@/lib/index-data";
import { ScanInput } from "@/components/scan/scan-input";
import { SITE_URL } from "@/lib/site";
import type { Metadata } from "next";
import {
  ArrowRight,
  BriefcaseBusiness,
  FileCheck2,
  KeyRound,
  Radar,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";

// Server-rendered with hourly revalidation (data changes once per daily scan).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ARC Report — AI Commerce Monitoring for Ecommerce Agencies",
  description:
    "Turn AI-commerce readiness into a recurring agency service. Monitor client storefronts, uncover billable fixes, generate co-branded reports, and query every portfolio through MCP.",
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "ARC Report — Lead Clients into Agentic Commerce",
    description:
      "Monitor every client storefront for AI-shopping readiness. Find billable work, catch regressions, and generate client-ready reports automatically.",
    url: SITE_URL,
    images: [{
      url: `${SITE_URL}/api/og?title=Lead+Your+Clients+into+Agentic+Commerce&subtitle=Portfolio+monitoring%2C+evidence%2C+and+implementation+guidance`,
      width: 1200,
      height: 630,
    }],
  },
};

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

  // The readiness gap — the actual product story. "Allowed in robots.txt" is a
  // near-constant; "actually reachable by an agent" is where brands fail.
  const scanned = brands.filter((b) => b.scanned);
  const wafGapCount = scanned.filter((b) => {
    const vals = Object.values(b.agentStatus ?? {});
    return !vals.some((v) => v === "blocked") && vals.some((v) => v === "restricted");
  }).length;
  const readyCount = scanned.filter((b) => (b.arcScore ?? 0) >= 65).length;
  const readyPct = scanned.length ? Math.round((readyCount / scanned.length) * 100) : 0;

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar />

      {/* Hero — agency product */}
      <section style={{ backgroundColor: "#0A1628" }} className="relative border-b border-white/10 overflow-hidden">
        <div className="scan-lines" />
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(132,175,251,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(132,175,251,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute right-[-4rem] top-[-6rem] h-72 w-72 rounded-full border border-[#84AFFB]/20" />
        <div className="absolute right-[-1rem] top-[-3rem] h-52 w-52 rounded-full border border-[#FBBA16]/20" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 z-[2]">
          <div className="grid lg:grid-cols-[1.35fr_.65fr] gap-10 lg:gap-12 items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-7">
                <span className="spec-label text-[#FF6648] text-[10px] px-2.5 py-1 border border-[#FF6648]/40 bg-[#FF6648]/10">
                  ARC // FOR ECOMMERCE AGENCIES
                </span>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                  <span className="spec-label text-white/40 text-[9px]">
                    POWERED BY {stats.brandCount.toLocaleString()} DAILY STORE SCANS
                  </span>
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-[-0.04em] leading-[0.98] max-w-3xl">
                Lead your clients into the{" "}
                <span className="relative inline-block text-[#FBBA16]">
                  agentic commerce era.
                  <span className="absolute left-0 -bottom-1 w-full h-[4px] bg-[#FF6648]" />
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-xl text-white/70 max-w-2xl leading-relaxed">
                ARC monitors every storefront your ecommerce agency manages, detects the issues
                blocking AI shopping systems, and turns them into{" "}
                <strong className="text-white">client-ready reports and implementation work.</strong>
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link
                  href="/agency/login"
                  className="relative inline-flex items-center gap-2 text-sm font-black text-white bg-[#FF6648] hover:bg-[#e85a3f] px-6 py-3.5 transition-all hover:-translate-y-0.5 group"
                >
                  Open your agency workspace <ArrowRight className="w-4 h-4" />
                  <span className="absolute inset-0 bg-[#0259DD] -z-10 translate-x-[4px] translate-y-[4px] group-hover:translate-x-[5px] group-hover:translate-y-[5px] transition-transform" />
                </Link>
                <a href="#agency-system" className="text-sm font-semibold text-white/70 hover:text-[#FBBA16] underline underline-offset-4">
                  See how agencies use ARC
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 spec-label text-[9px] text-white/45">
                <span className="retro-check retro-check-on text-[#059669]">50 STORES</span>
                <span className="retro-check retro-check-on text-[#059669]">DAILY MONITORING</span>
                <span className="retro-check retro-check-on text-[#059669]">PRIVATE MCP</span>
                <span className="retro-check retro-check-on text-[#059669]">$149 / MONTH</span>
              </div>
            </div>

            <div className="relative border border-white/20 bg-[#07101F]/80 p-5 shadow-[10px_10px_0_#0259DD]">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="spec-label text-[#84AFFB]">PORTFOLIO OVERVIEW</div>
                  <div className="text-sm font-bold text-white mt-1">Priority client issues</div>
                </div>
                <Radar className="w-6 h-6 text-[#FF6648]" />
              </div>
              <div className="mt-4 space-y-3">
                {[
                  ["CLIENT 014", "Product schema missing", "HIGH", "#FF6648"],
                  ["CLIENT 027", "3 agents restricted", "NEW", "#FBBA16"],
                  ["CLIENT 031", "Feed regression", "FIX", "#84AFFB"],
                ].map(([client, issue, status, color]) => (
                  <div key={client} className="grid grid-cols-[72px_1fr_auto] items-center gap-3 border border-white/10 bg-white/[0.04] p-3">
                    <span className="spec-label text-white/35 text-[8px]">{client}</span>
                    <span className="text-xs font-semibold text-white">{issue}</span>
                    <span className="spec-label text-[8px]" style={{ color }}>{status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[
                  [stats.brandCount.toLocaleString(), "REFERENCE STORES"],
                  [`${readyPct}%`, "READY"],
                  [wafGapCount.toLocaleString(), "WAF GAPS"],
                ].map(([value, label]) => (
                  <div key={label} className="border-t-2 border-[#FBBA16] bg-white/[0.04] p-3">
                    <div className="font-mono text-xl font-black text-white">{value}</div>
                    <div className="spec-label text-[7px] text-white/35 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between spec-label text-[8px] text-white/35">
                <span>SCAN CYCLE {relativeTime(stats.lastScan)}</span>
                <span className="text-[#059669]">● MONITORING ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-[2] flex h-[6px]">
          <div className="flex-1 bg-[#FF6648]" />
          <div className="flex-1 bg-[#FBBA16]" />
          <div className="flex-1 bg-[#0259DD]" />
          <div className="flex-1 bg-[#84AFFB]" />
          <div className="flex-1 bg-[#FFE1D7]" />
          <div className="flex-1 bg-[#059669]" />
        </div>
      </section>

      <main>
        <section id="agency-system" className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid lg:grid-cols-[.7fr_1.3fr] gap-8 lg:gap-12">
            <div>
              <div className="spec-label text-[#FF6648]">THE AGENCY OFFER</div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
                A new recurring service, without new manual work.
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                ARC gives your agency a packaged AI-commerce monitoring service. Add your portfolio once;
                the system scans, prioritizes, reports, and keeps watch.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  icon: ScanSearch,
                  code: "01 / DETECT",
                  title: "Find client work",
                  text: "Surface concrete access, schema, feed, WAF, protocol, and checkout problems across every store.",
                  color: "#FF6648",
                },
                {
                  icon: FileCheck2,
                  code: "02 / PACKAGE",
                  title: "Send the evidence",
                  text: "Generate co-branded reports with prioritized findings and implementation-ready fixes.",
                  color: "#FBBA16",
                },
                {
                  icon: ShieldCheck,
                  code: "03 / MONITOR",
                  title: "Protect retainers",
                  text: "Catch regressions after releases and show clients what changed before they notice.",
                  color: "#0259DD",
                },
                {
                  icon: BriefcaseBusiness,
                  code: "04 / CONVERT",
                  title: "Create billable projects",
                  text: "Turn detected problems into scoped technical work your team is already equipped to deliver.",
                  color: "#059669",
                },
              ].map(({ icon: Icon, code, title, text, color }) => (
                <article key={code} className="relative border-2 border-[#0A1628] bg-white p-5 shadow-[4px_4px_0_#0A1628]">
                  <div className="absolute top-0 left-0 h-1 w-full" style={{ backgroundColor: color }} />
                  <div className="flex items-center justify-between">
                    <span className="spec-label text-muted-foreground">{code}</span>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className="text-lg font-black mt-5">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FFE1D7] border-y-2 border-[#0A1628]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
              <div>
                <div className="spec-label text-[#0259DD]">AUTOMATED AGENCY WORKFLOW</div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-3 max-w-2xl">
                  From portfolio scan to paid implementation.
                </h2>
              </div>
              <div className="font-mono text-xs border border-[#0A1628] bg-[#FBBA16] px-3 py-2">
                HUMAN OPS REQUIRED: MINIMAL
              </div>
            </div>
            <div className="grid md:grid-cols-3 border-2 border-[#0A1628] bg-white">
              {[
                ["A", "Connect portfolio", "Add client and prospect storefronts. ARC establishes the baseline automatically."],
                ["B", "Receive opportunity queue", "Daily scans rank the stores and issues most likely to justify client work."],
                ["C", "Deliver and verify", "Share the report, implement the fix, and use ARC to prove the result held."],
              ].map(([step, title, text], index) => (
                <div key={step} className={`p-6 ${index < 2 ? "md:border-r-2 border-[#0A1628]" : ""}`}>
                  <div className="w-10 h-10 bg-[#0A1628] text-white font-mono font-black flex items-center justify-center">{step}</div>
                  <h3 className="text-lg font-black mt-5">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-[#0259DD] text-white p-7 sm:p-9 relative overflow-hidden">
              <div className="retro-grid" />
              <div className="relative z-[2]">
                <KeyRound className="w-8 h-8 text-[#FBBA16]" />
                <div className="spec-label text-[#84AFFB] mt-6">PRIVATE MCP / LLM READY</div>
                <h2 className="text-3xl font-black mt-2">Ask your portfolio questions directly in an LLM.</h2>
                <p className="mt-4 text-white/75 leading-relaxed">
                  Connect Claude, ChatGPT, or another MCP client to query portfolio health,
                  recent regressions, site reports, and exact remediation prompts.
                </p>
                <Link href="/agency/login" className="inline-flex items-center gap-2 mt-6 text-sm font-black text-[#0A1628] bg-[#FBBA16] px-5 py-3">
                  Create workspace key <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="border-2 border-[#0A1628] bg-white p-7 sm:p-9">
              <Sparkles className="w-8 h-8 text-[#FF6648]" />
              <div className="spec-label text-[#FF6648] mt-6">ONE SIMPLE PLAN</div>
              <div className="flex items-end gap-2 mt-2">
                <span className="text-5xl font-black">$149</span>
                <span className="text-muted-foreground mb-2">/ month</span>
              </div>
              <p className="mt-3 text-muted-foreground">Up to 50 client or prospect stores. Start with a 14-day trial.</p>
              <ul className="mt-6 space-y-3 text-sm">
                {["Daily portfolio monitoring", "Co-branded client reports", "Implementation-ready fix prompts", "Weekly opportunity digest", "Private MCP access", "On-demand full browser journeys"].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="w-3 h-3 bg-[#059669] shadow-[2px_2px_0_#0A1628]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/agency/login" className="inline-flex items-center gap-2 mt-7 text-sm font-black text-white bg-[#FF6648] px-5 py-3 shadow-[4px_4px_0_#0A1628]">
                Start agency trial <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y-2 border-[#0A1628] bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid lg:grid-cols-[1fr_1fr] gap-8 items-center">
              <div>
                <div className="flex items-center gap-3">
                  <Waypoints className="w-6 h-6 text-[#0259DD]" />
                  <span className="spec-label text-[#0259DD]">THE PROOF LAYER</span>
                </div>
                <h2 className="text-3xl font-black mt-3">Built on a live commerce dataset.</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">
                  The paid agency workspace sits on top of ARC&apos;s public reference dataset:
                  {` ${stats.brandCount.toLocaleString()}`} stores scanned against {stats.agentsTracked} agent identities.
                  Every client finding can link back to independent evidence.
                </p>
                <div className="mt-5 flex flex-wrap gap-4 text-sm font-bold">
                  <Link href="/data" className="text-[#0259DD] hover:underline">Open data →</Link>
                  <Link href="/docs/mcp" className="text-[#0259DD] hover:underline">Public MCP →</Link>
                  <Link href="/methodology" className="text-[#0259DD] hover:underline">Methodology →</Link>
                </div>
              </div>
              <div>
                <div className="spec-label text-muted-foreground mb-2">RUN A PUBLIC STORE SCAN — FREE</div>
                <ScanInput />
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    [stats.brandCount.toLocaleString(), "STORES"],
                    [`${readyPct}%`, "READY"],
                    [relativeTime(stats.lastScan), "LAST SCAN"],
                  ].map(([value, label]) => (
                    <div key={label} className="border bg-[#FFF8F0] p-3">
                      <div className="font-mono font-black">{value}</div>
                      <div className="spec-label text-[7px] text-muted-foreground mt-1">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <div className="spec-label text-[#FF6648]">PUBLIC REFERENCE INDEX</div>
              <h2 className="text-2xl sm:text-3xl font-black mt-2">Explore the underlying data.</h2>
            </div>
            <a href="#brand-index" className="text-sm font-bold text-[#0259DD]">Jump to all stores ↓</a>
          </div>
          <div id="brand-index" className="scroll-mt-16">
          <BrandTable brands={brands} />
          </div>

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
        </section>
      </main>

      <Footer />
    </div>
  );
}
