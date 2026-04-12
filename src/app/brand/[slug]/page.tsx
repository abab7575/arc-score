import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { TrackBrandButton } from "@/components/brand/track-button";
import {
  getBrandBySlug,
  getLatestLightweightScan,
  getChangelogForBrand,
} from "@/lib/db/queries";
import type { Metadata } from "next";

interface BrandPageProps {
  params: Promise<{ slug: string }>;
}

type AgentStatus = "allowed" | "blocked" | "restricted" | "no_rule" | "inconclusive";

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

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };
  return {
    title: `${brand.name} AI Agent Access | ARC Report`,
    description: `Live scan of ${brand.name}'s AI agent access — robots.txt, user-agent rules, platform, CDN, structured data.`,
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

  const dataSignals: Array<{ label: string; value: string }> = [
    { label: "JSON-LD", value: scan.hasJsonLd ? "Detected" : "Not detected" },
    { label: "Schema.org Product", value: scan.hasSchemaProduct ? "Detected" : "Not detected" },
    { label: "Open Graph", value: scan.hasOpenGraph ? "Yes" : "No" },
    { label: "Product feed", value: scan.hasProductFeed ? "Yes" : "No" },
    { label: "llms.txt", value: scan.hasLlmsTxt ? "Yes" : "No" },
  ];

  return (
    <div className="min-h-screen bg-background">
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

        {/* 7. CTA */}
        <div className="pt-2">
          <TrackBrandButton brandId={brand.id} />
        </div>

      </main>
      <Footer />
    </div>
  );
}
