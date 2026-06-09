import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  getBrandBySlug,
  getLatestLightweightScan,
  getChangelogForBrand,
} from "@/lib/db/queries";
import type { Metadata } from "next";
import { TRACKED_AGENT_IDS, TRACKED_AGENT_COUNT, SITE_URL } from "@/lib/site";
import { db, schema } from "@/lib/db";
import { computeArcScore, arcScoreLabel } from "@/lib/scoring/arc-score";
import { eq } from "drizzle-orm";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

type AgentStatus = "allowed" | "blocked" | "restricted" | "no_rule" | "inconclusive";

const AGENT_ORDER = TRACKED_AGENT_IDS;

// Statically generate every brand page; revalidate hourly (one daily scan).
export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return db
    .select({ slug: schema.brands.slug })
    .from(schema.brands)
    .where(eq(schema.brands.active, true))
    .all()
    .map((b) => ({ slug: b.slug }));
}

function summarizeAccess(scan: { agentStatusJson: string } | undefined): {
  blocked: number;
  open: number;
} {
  if (!scan) return { blocked: 0, open: 0 };
  try {
    const status = JSON.parse(scan.agentStatusJson) as Record<string, string>;
    const values = Object.values(status);
    const blocked = values.filter((v) => v === "blocked" || v === "restricted").length;
    return { blocked, open: values.length - blocked };
  } catch {
    return { blocked: 0, open: 0 };
  }
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };

  const scan = getLatestLightweightScan(brand.id);
  const { blocked, open } = summarizeAccess(scan);
  const scannedNote = scan
    ? ` As of ${scan.scannedAt.split("T")[0]}, ${brand.name} ${
        blocked === 0
          ? `allows all ${TRACKED_AGENT_COUNT} tracked AI agents`
          : `blocks or restricts ${blocked} of ${TRACKED_AGENT_COUNT} tracked AI agents`
      }${scan.platform && scan.platform !== "unknown" ? ` and runs on ${scan.platform}` : ""}.`
    : "";

  const title = `${brand.name} — AI Agent Access Report | ARC Report`;
  const description = `${brand.name}'s AI agent access, scanned daily: robots.txt policy per agent, live HTTP tests, platform, structured data, llms.txt.${scannedNote}`;
  const ogScore = scan ? computeArcScore(scan).total : null;
  const ogImage = `${SITE_URL}/api/og?title=${encodeURIComponent(`${brand.name} — agent access`)}&subtitle=${encodeURIComponent(
    scan
      ? `${open}/${TRACKED_AGENT_COUNT} agents allowed · scanned ${scan.scannedAt.split("T")[0]}`
      : "Daily AI agent access scan",
  )}${ogScore !== null ? `&score=${ogScore}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/brand/${brand.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/brand/${brand.slug}`,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function deriveVerdict(statuses: Array<{ status: AgentStatus }>): {
  label: string;
  color: string;
  bg: string;
} {
  const total = statuses.length;
  const openCount = statuses.filter(
    s => s.status === "allowed" || s.status === "no_rule",
  ).length;
  const blockedCount = statuses.filter(
    s => s.status === "blocked" || s.status === "restricted",
  ).length;

  if (blockedCount === 0) {
    return { label: "Open to AI agents", color: "text-[#059669]", bg: "bg-emerald-50 border-emerald-200" };
  }
  if (openCount === 0 || blockedCount > total * 0.6) {
    return { label: "Closed to AI agents", color: "text-[#FF6648]", bg: "bg-red-50 border-red-200" };
  }
  return { label: "Partially open", color: "text-[#FBBA16]", bg: "bg-amber-50 border-amber-200" };
}

function statusLabel(status: AgentStatus): { label: string; color: string } {
  switch (status) {
    case "allowed":
      return { label: "Allowed", color: "text-[#059669]" };
    case "no_rule":
      return { label: "Allowed", color: "text-[#059669]" };
    case "blocked":
      return { label: "Blocked", color: "text-[#FF6648]" };
    case "restricted":
      return { label: "Blocked", color: "text-[#FF6648]" };
    case "inconclusive":
    default:
      return { label: "Unknown", color: "text-muted-foreground" };
  }
}

function statusSource(status: AgentStatus): string {
  switch (status) {
    case "allowed":
      return "robots.txt: Allow";
    case "blocked":
      return "robots.txt: Disallow";
    case "no_rule":
      return "robots.txt: no rule (default allow)";
    case "restricted":
      return "UA test: blocked by site defenses";
    case "inconclusive":
    default:
      return "inconclusive";
  }
}

function formatFieldLabel(field: string): string {
  if (field.startsWith("agent_access_")) return field.replace("agent_access_", "") + " access";
  if (field.startsWith("agent_ua_")) return field.replace("agent_ua_", "") + " HTTP access";
  return field;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const scan = getLatestLightweightScan(brand.id);
  const changelog = getChangelogForBrand(brand.id, 3);

  if (!scan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
          <h1 className="text-2xl font-black text-foreground mb-2">{brand.name}</h1>
          <p className="text-sm text-muted-foreground">
            No scan data yet.{" "}
            <a href={brand.url} target="_blank" rel="noopener noreferrer" className="text-[#0259DD] hover:underline">
              {brand.url}
            </a>
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  let agentStatus: Record<string, AgentStatus> = {};
  try {
    agentStatus = JSON.parse(scan.agentStatusJson) as Record<string, AgentStatus>;
  } catch {
    agentStatus = {};
  }

  const statuses = AGENT_ORDER.map(agent => ({
    agent,
    status: (agentStatus[agent] ?? "inconclusive") as AgentStatus,
  }));

  const verdict = deriveVerdict(statuses);
  const score = computeArcScore(scan);
  const scoreMeta = arcScoreLabel(score.total);

  const { blocked: blockedCount } = summarizeAccess(scan);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${brand.name} — AI Agent Access Report`,
    url: `${SITE_URL}/brand/${brand.slug}`,
    dateModified: scan.scannedAt,
    isPartOf: {
      "@type": "Dataset",
      name: "ARC Report — AI agent access in e-commerce",
      url: SITE_URL,
      license: "https://creativecommons.org/licenses/by/4.0/",
    },
    about: {
      "@type": "Organization",
      name: brand.name,
      url: brand.url,
    },
    description: `Daily scan of ${brand.name}: ${blockedCount === 0 ? `all ${TRACKED_AGENT_COUNT} tracked AI agents allowed` : `${blockedCount} of ${TRACKED_AGENT_COUNT} tracked AI agents blocked or restricted`}.`,
  };

  const dataSignals: Array<{ label: string; value: string }> = [
    { label: "JSON-LD", value: scan.hasJsonLd ? "Detected" : "Not detected" },
    { label: "Schema.org Product", value: scan.hasSchemaProduct ? "Detected" : "Not detected" },
    { label: "Open Graph", value: scan.hasOpenGraph ? "Yes" : "No" },
    { label: "Product feed", value: scan.hasProductFeed ? "Yes" : "No" },
    { label: "llms.txt", value: scan.hasLlmsTxt ? "Yes" : "No" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-8">

        {/* 1. Header */}
        <header className="border-b border-gray-200 pb-6">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-1">
            {brand.name}
          </h1>
          <a
            href={brand.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#0259DD] hover:underline font-mono"
          >
            {brand.url.replace(/^https?:\/\//, "")}
          </a>
          <div className="text-xs text-muted-foreground mt-2 font-mono">
            Last scanned {formatTimestamp(scan.scannedAt)}
          </div>
        </header>

        {/* 2. Verdict */}
        <div className={`border-2 ${verdict.bg} px-5 py-4`}>
          <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
            Verdict
          </div>
          <div className={`text-xl font-black ${verdict.color}`}>
            {verdict.label}
          </div>
        </div>

        {/* 2b. ARC Score with always-visible component breakdown */}
        <section className="border-2 border-gray-200 bg-white px-5 py-4">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                ARC Score v1.0
              </div>
              <div className="text-3xl font-black font-mono" style={{ color: scoreMeta.color }}>
                {score.total}
                <span className="text-base text-muted-foreground font-semibold">/100</span>
                <span className="ml-3 text-sm font-bold" style={{ color: scoreMeta.color }}>{scoreMeta.label}</span>
              </div>
            </div>
            <Link href="/methodology#score" className="text-xs text-[#0259DD] hover:underline shrink-0">
              How it&apos;s computed →
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Agent access", value: score.agentAccess, max: 50 },
              { label: "Structured data", value: score.structuredData, max: 25 },
              { label: "Protocol files", value: score.protocolFiles, max: 15 },
              { label: "Scan stability", value: score.scanStability, max: 10 },
            ].map((c) => (
              <div key={c.label}>
                <div className="flex items-baseline justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-mono font-bold text-foreground">{c.value}/{c.max}</span>
                </div>
                <div className="h-1.5 bg-gray-100">
                  <div className="h-full bg-[#0259DD]" style={{ width: `${(c.value / c.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Agent allow/block table */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Agent access
          </h2>
          <div className="border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Agent</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-foreground">Source</th>
                </tr>
              </thead>
              <tbody>
                {statuses.map(({ agent, status }) => {
                  const s = statusLabel(status);
                  return (
                    <tr key={agent} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-xs">{agent}</td>
                      <td className={`px-4 py-2.5 font-semibold ${s.color}`}>{s.label}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground font-mono">
                        {statusSource(status)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Infra chips */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Infrastructure
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-mono font-semibold text-foreground">
                {scan.platform && scan.platform !== "unknown" ? scan.platform : "—"}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">CDN</span>
              <span className="font-mono font-semibold text-foreground">
                {scan.cdn && scan.cdn !== "unknown" ? scan.cdn : "—"}
              </span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs">
              <span className="text-muted-foreground">WAF</span>
              <span className="font-mono font-semibold text-foreground">
                {scan.waf && scan.waf !== "none-detected" ? scan.waf : "none"}
              </span>
            </span>
          </div>
        </section>

        {/* 5. Data signals */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Data signals
          </h2>
          <ul className="border border-gray-200 bg-white divide-y divide-gray-100">
            {dataSignals.map(s => (
              <li key={s.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-muted-foreground">{s.label}</span>
                <span className="font-mono font-semibold text-foreground">{s.value}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* 6. Recent changes */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Recent changes
          </h2>
          {changelog.length === 0 ? (
            <div className="border border-gray-200 bg-white px-4 py-6 text-center text-sm text-muted-foreground">
              No changes detected yet.
            </div>
          ) : (
            <div className="border border-gray-200 bg-white divide-y divide-gray-100">
              {changelog.map(entry => (
                <div key={entry.id} className="px-4 py-3 text-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-foreground">
                      {formatFieldLabel(entry.field)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDateShort(entry.detectedAt)}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    <span className="font-mono bg-red-50 text-red-700 px-1 py-0.5">
                      {entry.oldValue ?? "none"}
                    </span>
                    <span className="mx-1">→</span>
                    <span className="font-mono bg-green-50 text-green-700 px-1 py-0.5">
                      {entry.newValue ?? "none"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6b. Embeddable badge */}
        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
            Embed this score
          </h2>
          <div className="border border-gray-200 bg-white px-4 py-4 space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/badge/${brand.slug}.svg`}
              alt={`ARC Score badge for ${brand.name}`}
              height={22}
            />
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">HTML</div>
              <pre className="bg-gray-50 border border-gray-200 text-[11px] font-mono p-2 overflow-x-auto">{`<a href="${SITE_URL}/brand/${brand.slug}"><img src="${SITE_URL}/badge/${brand.slug}.svg" alt="ARC Score for ${brand.name}" height="22"></a>`}</pre>
            </div>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Markdown</div>
              <pre className="bg-gray-50 border border-gray-200 text-[11px] font-mono p-2 overflow-x-auto">{`[![ARC Score for ${brand.name}](${SITE_URL}/badge/${brand.slug}.svg)](${SITE_URL}/brand/${brand.slug})`}</pre>
            </div>
            <p className="text-xs text-muted-foreground">Updates automatically with each daily scan.</p>
          </div>
        </section>

        {/* 7. Methodology */}
        <section className="border-t border-gray-200 pt-5 text-xs text-muted-foreground">
          Scanned daily via robots.txt parsing and live HTTP tests for{" "}
          {TRACKED_AGENT_COUNT} AI agents. Changes are confirmed across two
          consecutive scans before publishing.{" "}
          <Link href="/methodology" className="text-[#0259DD] hover:underline">
            Read the full methodology →
          </Link>
        </section>

      </main>
      <Footer />
    </div>
  );
}
