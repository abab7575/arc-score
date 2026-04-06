import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { TrackBrandButton } from "@/components/brand/track-button";
import {
  getBrandBySlug,
  getLatestLightweightScan,
  getChangelogForBrand,
  getLightweightScanHistory,
  getMatrixData,
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

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  robots: "Discovery and crawl policy",
  commerce: "Machine-readable product understanding",
  guidance: "Explicit guidance for agent or LLM systems",
  infra: "The delivery and enforcement layer agents meet first",
};

export const dynamicParams = true;
export const dynamic = "force-dynamic";

function hasScan<T>(value: T | null): value is T {
  return value !== null;
}

export async function generateMetadata({ params }: BrandPageProps): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) return { title: "Brand Not Found" };

  return {
    title: `${brand.name} — AI Agent Readout | ARC Report`,
    description: `See whether ${brand.name} is reachable by major AI agents, what machine-readable signals it publishes, and how it compares with peers.`,
  };
}

function statusStyle(status: AgentStatus): {
  label: string;
  chip: string;
  tone: string;
} {
  switch (status) {
    case "allowed":
      return {
        label: "open",
        chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
        tone: "ARC saw no meaningful friction for this agent on this scan.",
      };
    case "blocked":
      return {
        label: "blocked by policy",
        chip: "bg-red-50 text-red-700 border-red-200",
        tone: "The site appears to explicitly tell this agent not to access it.",
      };
    case "restricted":
      return {
        label: "blocked by site defenses",
        chip: "bg-amber-50 text-amber-700 border-amber-200",
        tone: "The site looks open in policy, but security tooling appears to stop the request.",
      };
    case "no_rule":
      return {
        label: "no explicit rule",
        chip: "bg-slate-100 text-slate-600 border-slate-200",
        tone: "The site does not name this agent in robots.txt, so access is usually allowed by default.",
      };
    case "inconclusive":
    default:
      return {
        label: "unclear this scan",
        chip: "bg-zinc-100 text-zinc-500 border-zinc-200",
        tone: "ARC could not get a clean answer on this scan, usually due to timeouts or temporary issues.",
      };
  }
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural;
}

function pct(count: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
}

function percentileLabel(
  value: number,
  peerValues: number[],
  higherIsBetter: boolean,
): string | null {
  if (peerValues.length < 4) return null;

  const comparisonCount = peerValues.filter((peerValue) =>
    higherIsBetter ? value > peerValue : value < peerValue,
  ).length;

  return `Ahead of ${pct(comparisonCount, peerValues.length)}% of peers`;
}

function formatFieldLabel(field: string) {
  if (field.includes("robots.txt")) return field;
  return field
    .replace(/^agent_ua_/, "")
    .replace(/^agent_access_/, "")
    .replace(/_/g, " ")
    .replace(/\bjson ld\b/i, "JSON-LD")
    .replace(/\bllms txt\b/i, "llms.txt")
    .replace(/\bucp\b/i, "UCP")
    .replace(/\bcdn\b/i, "CDN")
    .replace(/\bwaf\b/i, "WAF");
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function LabelWithInfo({
  label,
  content,
  detail,
}: {
  label: string;
  content: string;
  detail?: string;
}) {
  return (
    <InfoTooltip content={content} detail={detail}>
      <span>{label}</span>
    </InfoTooltip>
  );
}

function StatCard({
  label,
  value,
  detail,
  accent,
}: {
  label: ReactNode;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div className="card-elevated p-5 bg-white">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
        {label}
      </p>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            {value}
          </div>
          <p className="text-sm text-muted-foreground mt-2">{detail}</p>
        </div>
        <div className={cx("h-12 w-2 rounded-full", accent)} />
      </div>
    </div>
  );
}

function AudienceRow({
  audience,
  title,
  body,
}: {
  audience: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-[color:var(--color-arc-border)] bg-[color:var(--color-arc-cream)] px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1">
            {audience}
          </div>
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <p className="text-sm leading-6 text-muted-foreground mt-1">{body}</p>
        </div>
      </div>
    </div>
  );
}

const LAYER_TOOLTIPS = [
  {
    content: "Can an agent find this site and understand its structure?",
    detail:
      "robots.txt tells agents which paths are allowed. Sitemaps list the URLs the site wants discovered. Both are table-stakes for any indexing or crawling behavior.",
  },
  {
    content: "Can an agent understand products without rendering the page?",
    detail:
      "JSON-LD, Schema.org Product, Open Graph, and product feeds let agents parse titles, prices, availability, and images from structured data instead of scraping visible HTML.",
  },
  {
    content: "Does the site publish explicit guidance for agents or LLMs?",
    detail:
      "llms.txt, agent declaration files, and UCP endpoints are emerging. Most brands still publish nothing here, so even one file is notable. Naming is unsettled — treat as descriptive.",
  },
] as const;

const INSTRUMENT_TOOLTIPS = {
  ACCESS: {
    content: "How openly this site admits AI agents vs. peers in its category.",
    detail:
      "Based on how many of the 9 major AI agent identities showed friction on this scan (blocked by policy or restricted by defenses). Fewer is better.",
  },
  COVERAGE: {
    content: "How much machine-readable structure this site publishes vs. peers.",
    detail:
      "Sums across 8 signals: robots.txt, sitemap, JSON-LD, Schema.org Product, Open Graph, product feed, llms.txt, and UCP. Higher is better.",
  },
  "LLMS.TXT": {
    content: "Is llms.txt published at the root of this site?",
    detail:
      "llms.txt is an emerging proposal (llmstxt.org) for sites to give LLMs a curated entry point. Still young — most brands publish nothing.",
  },
  "AGENT GUIDANCE": {
    content: "Does this site publish any explicit agent policy or brief file?",
    detail:
      "Checks for /agents.txt, /agents-brief.txt, and /.well-known/agents.txt. Standards are unsettled as of early 2026; this is a descriptive signal, not a compliance check.",
  },
} as const;

const STATUS_HEX: Record<AgentStatus, string> = {
  allowed: "#059669",
  no_rule: "#94A3B8",
  restricted: "#FBBA16",
  blocked: "#FF6648",
  inconclusive: "#CBD5E1",
};

const STATUS_SHADOW: Record<AgentStatus, string> = {
  allowed: "#00492C",
  no_rule: "#475569",
  restricted: "#8B6914",
  blocked: "#8A2D16",
  inconclusive: "#64748B",
};

function getFieldColor(field: string): string {
  if (field.toLowerCase().includes("robots.txt")) return "#0259DD";
  if (field.toLowerCase().includes("llms") || field.toLowerCase().includes("agent")) return "#7C3AED";
  if (
    field.toLowerCase().includes("json") ||
    field.toLowerCase().includes("schema") ||
    field.toLowerCase().includes("open graph") ||
    field.toLowerCase().includes("feed")
  )
    return "#FF6648";
  if (field.toLowerCase().includes("platform") || field.toLowerCase().includes("cdn") || field.toLowerCase().includes("waf"))
    return "#FBBA16";
  return "#94A3B8";
}

function InstrumentCard({
  tag,
  color,
  value,
  valueSuffix,
  detail,
  lowPool,
  tooltipContent,
  tooltipDetail,
}: {
  tag: string;
  color: string;
  value: string;
  valueSuffix?: string;
  detail: string;
  lowPool?: boolean;
  tooltipContent?: string;
  tooltipDetail?: string;
}) {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 -z-10"
        style={{ backgroundColor: color, opacity: 0.25, transform: "translate(4px, 4px)" }}
      />
      <div className="border-2 border-[#0A1628] bg-white h-full">
        {/* Colored top bar */}
        <div
          className="border-b-2 border-[#0A1628] px-4 py-2 flex items-center justify-between gap-2"
          style={{ backgroundColor: color }}
        >
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.14em] text-white">
            {tag}
          </span>
          <span className="flex gap-1">
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span className="w-1 h-1 rounded-full bg-white/60" />
            <span className="w-1 h-1 rounded-full bg-white/60" />
          </span>
        </div>
        <div className="px-5 py-5">
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="data-num text-3xl sm:text-4xl font-black leading-none tracking-tight"
              style={{ color: "#0A1628" }}
            >
              {value}
            </span>
            {valueSuffix && (
              <span className="text-[11px] font-mono text-muted-foreground">{valueSuffix}</span>
            )}
          </div>
          {lowPool && (
            <p className="text-[10px] font-mono text-[#FF6648] mb-2 uppercase tracking-[0.08em]">
              small peer pool
            </p>
          )}
          <div className="inline-flex items-start gap-1.5">
            <p className="text-sm text-muted-foreground leading-6 flex-1">{detail}</p>
            {tooltipContent && (
              <span className="mt-1 shrink-0">
                <InfoTooltip content={tooltipContent} detail={tooltipDetail} />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PeerLine({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="px-5 sm:px-6 py-4">
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-semibold text-foreground text-right">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground leading-6">{detail}</p>
    </div>
  );
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { slug } = await params;
  const brand = getBrandBySlug(slug);
  if (!brand) notFound();

  const scan = getLatestLightweightScan(brand.id);
  const changelog = getChangelogForBrand(brand.id, 12);
  const history = getLightweightScanHistory(brand.id, 30).reverse();
  const matrix = getMatrixData().filter((entry) => entry.scan !== null);

  if (!scan) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
          <div className="card-elevated p-10 text-center">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              Brand
            </p>
            <h1 className="text-3xl font-black text-foreground mb-3">{brand.name}</h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              There is no lightweight scan data for this brand yet, so ARC cannot say anything
              useful about agent reach, machine-readable guidance, or recent movement.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  let agentStatus = {} as Record<string, AgentStatus>;
  if (scan.agentStatusJson) {
    try {
      agentStatus = JSON.parse(scan.agentStatusJson) as Record<string, AgentStatus>;
    } catch {
      agentStatus = {};
    }
  }

  const statuses = AGENT_ORDER.map((agent) => ({
    agent,
    status: (agentStatus[agent] ?? "inconclusive") as AgentStatus,
  }));

  const blockedCount = statuses.filter((entry) => entry.status === "blocked").length;
  const restrictedCount = statuses.filter((entry) => entry.status === "restricted").length;
  const inconclusiveCount = statuses.filter((entry) => entry.status === "inconclusive").length;
  const openCount = statuses.filter(
    (entry) => entry.status === "allowed" || entry.status === "no_rule",
  ).length;
  const guidanceCount = Number(scan.hasLlmsTxt) + Number(scan.hasAgentsTxt);
  const machineReadableCount = [
    scan.hasJsonLd,
    scan.hasSchemaProduct,
    scan.hasOpenGraph,
    scan.hasSitemap,
    scan.hasProductFeed,
    scan.hasLlmsTxt,
    scan.hasAgentsTxt,
    scan.hasUcp,
  ].filter(Boolean).length;
  const commerceMarkupCount = [
    scan.hasJsonLd,
    scan.hasSchemaProduct,
    scan.hasOpenGraph,
    scan.hasSitemap,
    scan.hasProductFeed,
  ].filter(Boolean).length;
  const last30dChanges = changelog.filter((entry) => daysAgo(entry.detectedAt) <= 30);

  const categoryPeers = matrix.filter(
    (entry) => entry.brand.category === brand.category && entry.scan !== null,
  );
  const categoryPeerScans = categoryPeers.map((entry) => entry.scan).filter(hasScan);
  const allPeerScans = matrix.map((entry) => entry.scan).filter(hasScan);

  const categorySignalPct = percentileLabel(
    machineReadableCount,
    categoryPeerScans.map((peer) =>
      [
        peer.hasJsonLd,
        peer.hasSchemaProduct,
        peer.hasOpenGraph,
        peer.hasSitemap,
        peer.hasProductFeed,
        peer.hasLlmsTxt,
        peer.hasAgentsTxt,
        peer.hasUcp,
      ].filter(Boolean).length,
    ),
    true,
  );

  const categoryAccessPct = percentileLabel(
    blockedCount + restrictedCount,
    categoryPeerScans.map((peer) => peer.blockedAgentCount),
    false,
  );

  const llmsCategoryAdoption = pct(
    categoryPeerScans.filter((peer) => peer.hasLlmsTxt).length,
    categoryPeerScans.length,
  );
  const guidanceCategoryAdoption = pct(
    categoryPeerScans.filter((peer) => peer.hasLlmsTxt || peer.hasAgentsTxt).length,
    categoryPeerScans.length,
  );
  const marketGuidanceAdoption = pct(
    allPeerScans.filter((peer) => peer.hasLlmsTxt || peer.hasAgentsTxt).length,
    allPeerScans.length,
  );

  let heroTitle = `${brand.name} appears open to most major AI agents.`;
  let heroBody =
    "The bigger question is not just reach, but whether this site gives agents enough machine-readable structure to understand products and act confidently.";

  if (blockedCount > 0) {
    heroTitle = `${brand.name} is selectively limiting AI agent access.`;
    heroBody =
      "This is the kind of page an agent builder checks first: who is explicitly closing doors, and whether those limits look like policy or enforcement.";
  } else if (restrictedCount > 0) {
    heroTitle = `${brand.name} looks open on paper, but some agents may still hit friction.`;
    heroBody =
      "That usually points to infra behavior rather than explicit robots policy, which matters if you are trying to predict real agent reach instead of theoretical openness.";
  } else if (guidanceCount > 0) {
    heroTitle = `${brand.name} is open to agents and already publishing explicit guidance.`;
    heroBody =
      "That makes this page useful as a benchmark for early standards adoption, not just a reach check.";
  } else if (machineReadableCount <= 3) {
    heroTitle = `${brand.name} is reachable, but still thin on explicit agent-readability signals.`;
    heroBody =
      "That is the core 'so what': an agent may be allowed in, but still get less structured context than it wants once it arrives.";
  }

  const standoutNotes: string[] = [];
  if (categoryAccessPct) {
    standoutNotes.push(`${categoryAccessPct} on openness versus ${brand.category} peers.`);
  }
  if (categorySignalPct) {
    standoutNotes.push(`${categorySignalPct} on machine-readable coverage.`);
  }
  if (scan.hasLlmsTxt) {
    standoutNotes.push(
      `Publishes llms.txt, which only ${llmsCategoryAdoption}% of ${brand.category} brands in the index currently do.`,
    );
  } else {
    standoutNotes.push(
      `Does not publish llms.txt, while ${llmsCategoryAdoption}% of ${brand.category} peers already do.`,
    );
  }
  if (scan.hasAgentsTxt) {
    standoutNotes.push(`Publishes an agent declaration file (${scan.agentsTxtVariant ?? "detected"}).`);
  } else {
    standoutNotes.push(
      `No agent declaration file detected. Only ${guidanceCategoryAdoption}% of ${brand.category} peers publish any explicit agent guidance file.`,
    );
  }
  if (last30dChanges.length > 0) {
    standoutNotes.push(
      `${last30dChanges.length} confirmed ${pluralize(last30dChanges.length, "change", "changes")} in the last 30 days.`,
    );
  } else {
    standoutNotes.push("No confirmed changes in the last 30 days. This brand currently looks stable.");
  }

  const signalTimeline = history.map((entry) =>
    [
      entry.hasJsonLd,
      entry.hasSchemaProduct,
      entry.hasOpenGraph,
      entry.hasSitemap,
      entry.hasProductFeed,
      entry.hasLlmsTxt,
      entry.hasAgentsTxt,
      entry.hasUcp,
    ].filter(Boolean).length,
  );
  const maxTimeline = Math.max(...signalTimeline, 1);
  const standoutSummary = standoutNotes[0] ?? "This brand currently looks stable in the ARC index.";
  const standoutList = standoutNotes.slice(1, 4);
  const watchLabel =
    blockedCount > 0
      ? "Access risk"
      : restrictedCount > 0
        ? "Infra friction"
        : guidanceCount > 0
          ? "Standards lead"
          : "Guidance gap";
  const watchBody =
    blockedCount > 0
      ? `${blockedCount} ${pluralize(blockedCount, "agent is", "agents are")} explicitly blocked.`
      : restrictedCount > 0
        ? `${restrictedCount} ${pluralize(restrictedCount, "agent looks", "agents look")} restricted by enforcement rather than policy.`
        : guidanceCount > 0
          ? `Publishes ${guidanceCount} explicit ${pluralize(guidanceCount, "guidance file", "guidance files")}.`
          : "No explicit LLM or agent guidance file detected.";

  const machineReadableLayers = [
    {
      title: "Discovery layer",
      summary: SIGNAL_DESCRIPTIONS.robots,
      accent: "bg-[color:var(--color-arc-peach)]",
      items: [
        { label: "robots.txt", active: scan.robotsTxtFound, detail: "Crawl policy visible" },
        { label: "Sitemap", active: scan.hasSitemap, detail: "Site discovery path" },
      ],
    },
    {
      title: "Commerce markup",
      summary: SIGNAL_DESCRIPTIONS.commerce,
      accent: "bg-[color:var(--color-arc-periwinkle)]",
      items: [
        { label: "JSON-LD", active: scan.hasJsonLd },
        { label: "Schema.org Product", active: scan.hasSchemaProduct },
        { label: "Open Graph", active: scan.hasOpenGraph },
        { label: "Product feed", active: scan.hasProductFeed },
      ],
    },
    {
      title: "Guidance files",
      summary: SIGNAL_DESCRIPTIONS.guidance,
      accent: "bg-[color:var(--color-arc-mustard)]",
      items: [
        {
          label: "llms.txt",
          active: scan.hasLlmsTxt,
          detail:
            scan.hasLlmsTxt && scan.llmsTxtBytes
              ? `${scan.llmsTxtBytes}B / ${scan.llmsTxtLinkCount ?? 0} links`
              : undefined,
        },
        {
          label: "Agent declaration file",
          active: scan.hasAgentsTxt,
          detail: scan.hasAgentsTxt ? scan.agentsTxtVariant ?? undefined : undefined,
        },
        { label: "UCP endpoint", active: scan.hasUcp },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pb-16">
        <section className="hero-gradient border-b border-[color:var(--color-arc-border)]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_0.85fr] gap-8 items-start">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <span className="spec-label text-muted-foreground">BRAND</span>
                  <span className="spec-label text-muted-foreground">/</span>
                  <span className="spec-label text-muted-foreground uppercase">
                    {brand.category || "unknown"}
                  </span>
                  {scan.platform && (
                    <>
                      <span className="spec-label text-muted-foreground">/</span>
                      <span className="spec-label text-muted-foreground uppercase">
                        {scan.platform}
                      </span>
                    </>
                  )}
                </div>

                <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-none mb-5">
                  {brand.name}
                </h1>

                <p className="max-w-3xl text-xl sm:text-2xl leading-tight text-foreground font-semibold mb-4">
                  {heroTitle}
                </p>
                <p className="max-w-3xl text-base sm:text-lg leading-8 text-muted-foreground mb-6">
                  {heroBody}
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <a
                    href={brand.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-full border border-[color:var(--color-arc-border)] bg-white px-4 py-2 text-sm font-mono text-[color:var(--color-arc-cobalt)] hover:bg-[color:var(--color-arc-cream)]"
                  >
                    Visit site
                  </a>
                  <Link
                    href="/changelog"
                    className="inline-flex items-center rounded-full border border-[color:var(--color-arc-border)] px-4 py-2 text-sm font-mono text-foreground hover:bg-white"
                  >
                    View market changelog
                  </Link>
                  <Link
                    href="/docs"
                    className="inline-flex items-center rounded-full border border-[color:var(--color-arc-border)] px-4 py-2 text-sm font-mono text-foreground hover:bg-white"
                  >
                    API docs
                  </Link>
                  <TrackBrandButton brandId={brand.id} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard
                    label={
                      <LabelWithInfo
                        label="Agent Reach"
                        content="How many major AI agent identities ARC could treat as meaningfully reachable on this scan."
                        detail="Open includes agents that were explicitly allowed and agents with no explicit robots rule. It does not mean the site is fully optimized for AI shopping."
                      />
                    }
                    value={`${openCount}/${AGENT_ORDER.length}`}
                    detail={`${blockedCount + restrictedCount} showed visible friction or blocking`}
                    accent="bg-[color:var(--color-arc-cobalt)]"
                  />
                  <StatCard
                    label={
                      <LabelWithInfo
                        label="Guidance Files"
                        content="Files like llms.txt or an agent declaration file that tell AI systems how the site is structured or what they are allowed to do."
                        detail="This field is young. Most brands still publish nothing here, so even one guidance file can be notable."
                      />
                    }
                    value={`${guidanceCount}/2`}
                    detail={`${marketGuidanceAdoption}% of tracked brands publish any explicit guidance`}
                    accent="bg-[color:var(--color-arc-mustard)]"
                  />
                  <StatCard
                    label={
                      <LabelWithInfo
                        label="Structured Layer"
                        content="Machine-readable product and site signals that help AI systems understand what the site sells without relying only on the visual page."
                        detail="Examples include JSON-LD, Schema.org Product, Open Graph, feeds, and sitemaps."
                      />
                    }
                    value={`${commerceMarkupCount}/5`}
                    detail="Markup and feed signals detected"
                    accent="bg-[color:var(--color-arc-coral)]"
                  />
                  <StatCard
                    label={
                      <LabelWithInfo
                        label="30-Day Movement"
                        content="How many confirmed changes ARC published for this brand in the last 30 days."
                        detail="ARC buffers noisy fields before publishing them, so this is meant to reflect actual movement rather than one-off scan flicker."
                      />
                    }
                    value={String(last30dChanges.length)}
                    detail="Confirmed signal changes"
                    accent="bg-[color:var(--color-arc-forest)]"
                  />
                </div>
              </div>

              <div className="card-elevated p-6 bg-white">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      If You Only Read One Thing
                    </p>
                    <h2 className="text-2xl font-black text-foreground mt-2">
                      {standoutSummary}
                    </h2>
                  </div>
                  <div className="h-14 w-14 rounded-full bg-[color:var(--color-arc-peach)] shrink-0" />
                </div>

                <div className="rounded-xl border border-[color:var(--color-arc-border)] bg-[color:var(--color-arc-cream)] px-4 py-4 mb-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                    Watchpoint
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-base font-bold text-foreground">{watchLabel}</div>
                      <p className="text-sm text-muted-foreground mt-1 leading-6">{watchBody}</p>
                    </div>
                    <div className="rounded-full bg-white border border-[color:var(--color-arc-border)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[color:var(--color-arc-cobalt)]">
                      ARC Read
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <AudienceRow
                    audience="Agent Builders"
                    title="Reach check"
                    body="See whether this site is actually accessible and what machine-readable assets wait behind the front door."
                  />
                  <AudienceRow
                    audience="Platform Teams"
                    title="Benchmark check"
                    body="Use the peer context to tell whether this brand is publishing more structure and guidance than others in the same category."
                  />
                  <AudienceRow
                    audience="Watchers"
                    title="Movement check"
                    body="Recent confirmed changes turn the page from a profile into a watchlist entry."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 space-y-24">
          {/* ═══════════════════════════════════════════════════════════
              01 // AGENT REACH ARRAY
              ═══════════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="data-num text-sm font-black text-[#FF6648] shrink-0">/ 01</span>
              <span className="spec-label text-muted-foreground shrink-0">AGENT REACH ARRAY</span>
              <span className="h-px flex-1 bg-[color:var(--color-arc-border)]" />
              <span className="spec-label text-muted-foreground shrink-0 hidden sm:inline">
                RUN_{String(scan.id).padStart(4, "0")} / {formatDate(scan.scannedAt).toUpperCase()}
              </span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[0.9] mb-3 max-w-3xl">
              Who can get <span className="text-[#0259DD]">in the door.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-7 max-w-2xl mb-10">
              Nine AI agents, one scan. Color tells you the outcome; hover any status
              in the legend to read what it means.
            </p>

            {/* Big readout card with offset shadow */}
            <div className="relative mb-5">
              <div
                className="absolute inset-0 -z-10"
                style={{ backgroundColor: "#0A1628", transform: "translate(4px, 4px)" }}
              />
              <div className="border-2 border-[#0A1628] bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] divide-y-2 sm:divide-y-0 sm:divide-x-2 divide-[#0A1628]">
                  {/* Count block */}
                  <div className="px-6 py-6 sm:px-8 sm:py-7 min-w-[200px]">
                    <div className="spec-label text-muted-foreground mb-3 inline-flex items-center gap-1.5">
                      REACH
                      <InfoTooltip
                        content="How many of the nine AI agents ARC could treat as meaningfully reachable on this scan."
                        detail="Counts both agents explicitly allowed in robots.txt and agents with no explicit rule (default-allowed). It does not count agents blocked by policy or by site defenses."
                      />
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="data-num text-[64px] sm:text-[84px] font-black text-[#0259DD] tabular-nums leading-[0.85]">
                        {String(openCount).padStart(2, "0")}
                      </span>
                      <span className="data-num text-3xl sm:text-4xl font-black text-[#0A1628]/20 leading-none pb-1">
                        / 09
                      </span>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground mt-3">
                      agents open on this scan
                    </p>
                  </div>

                  {/* Distribution visualization */}
                  <div className="px-6 py-6 sm:px-8 sm:py-7">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="spec-label text-muted-foreground inline-flex items-center gap-1.5">
                        DISTRIBUTION
                        <InfoTooltip
                          content="One colored segment per agent, in the order shown below. Color indicates this scan's outcome."
                          detail="Green = open. Grey = no explicit rule (default-allowed). Mustard = restricted by site defenses. Coral = blocked by policy. Light grey = scan was inconclusive."
                        />
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 bg-[#059669]" />
                          {statuses.filter((s) => s.status === "allowed").length}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 bg-slate-400" />
                          {statuses.filter((s) => s.status === "no_rule").length}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 bg-[#FBBA16]" />
                          {restrictedCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 bg-[#FF6648]" />
                          {blockedCount}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 bg-slate-300" />
                          {inconclusiveCount}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-10 border-2 border-[#0A1628]">
                      {statuses.map(({ agent, status }, i) => {
                        const color = STATUS_HEX[status];
                        return (
                          <div
                            key={agent}
                            className="flex-1 border-r-2 border-[#0A1628] last:border-r-0 relative group"
                            style={{ backgroundColor: color }}
                            title={`${agent}: ${statusStyle(status).label}`}
                          >
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] font-mono font-bold text-[#0A1628] opacity-0 group-hover:opacity-100 transition-opacity">
                              {i + 1}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-2">
                      <span>01 · GPTBot</span>
                      <span>09 · Bingbot</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3×3 agent tile grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {statuses.map(({ agent, status }, i) => {
                const tone = statusStyle(status);
                const color = STATUS_HEX[status];
                const shadow = STATUS_SHADOW[status];
                return (
                  <div key={agent} className="relative">
                    <div
                      className="absolute inset-0 -z-10"
                      style={{ backgroundColor: shadow, transform: "translate(3px, 3px)" }}
                    />
                    <div className="border-2 border-[#0A1628] bg-white px-4 py-4 h-full">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div
                          className="h-11 w-11 rounded-full border-2 border-[#0A1628] shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <div className="text-right">
                          <div className="data-num text-[10px] font-bold text-muted-foreground">
                            {String(i + 1).padStart(2, "0")} / 09
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-mono font-bold text-foreground mb-1 truncate">
                        {agent}
                      </div>
                      <div
                        className="text-[10px] font-mono font-bold uppercase tracking-[0.12em]"
                        style={{ color: shadow }}
                      >
                        {tone.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend — inline, bold swatches */}
            <div className="border-t-2 border-dashed border-[#0A1628]/20 pt-5">
              <div className="spec-label text-muted-foreground mb-3">LEGEND</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {(
                  ["allowed", "no_rule", "restricted", "blocked", "inconclusive"] as AgentStatus[]
                ).map((s) => {
                  const tone = statusStyle(s);
                  return (
                    <div key={s} className="flex items-start gap-3 text-[13px]">
                      <span
                        className="inline-block w-3 h-3 border border-[#0A1628] shrink-0 mt-1"
                        style={{ backgroundColor: STATUS_HEX[s] }}
                      />
                      <div className="flex-1">
                        <span className="font-mono font-bold uppercase tracking-[0.1em] text-[11px] text-foreground">
                          {tone.label}
                        </span>
                        <span className="text-muted-foreground ml-2 text-[12px]">{tone.tone}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              02 // MACHINE-READABLE STACK
              ═══════════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="data-num text-sm font-black text-[#0259DD] shrink-0">/ 02</span>
              <span className="spec-label text-muted-foreground shrink-0">MACHINE-READABLE STACK</span>
              <span className="h-px flex-1 bg-[color:var(--color-arc-border)]" />
              <span className="spec-label text-muted-foreground shrink-0 hidden sm:inline">
                {machineReadableCount} / 08 LAYERS ACTIVE
              </span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[0.9] mb-3 max-w-3xl">
              What agents can <span className="text-[#FF6648]">understand.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-7 max-w-2xl mb-10">
              A site can be reachable and still be hard for agents to read. Three
              published layers, ranked from table-stakes to frontier.
            </p>

            {/* Three stack columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {machineReadableLayers.map((layer, idx) => {
                const layerColors = [
                  { band: "#0259DD", shadow: "#001F4D", text: "#0259DD" }, // discovery
                  { band: "#FF6648", shadow: "#8A2D16", text: "#FF6648" }, // commerce
                  { band: "#FBBA16", shadow: "#6B4E00", text: "#8B6914" }, // guidance
                ][idx];
                const activeCount = layer.items.filter((i) => i.active).length;
                const totalCount = layer.items.length;
                return (
                  <div key={layer.title} className="relative">
                    <div
                      className="absolute inset-0 -z-10"
                      style={{
                        backgroundColor: layerColors.shadow,
                        transform: "translate(4px, 4px)",
                      }}
                    />
                    <div className="border-2 border-[#0A1628] bg-white h-full flex flex-col">
                      {/* Colored band header */}
                      <div
                        className="border-b-2 border-[#0A1628] px-4 py-3"
                        style={{ backgroundColor: layerColors.band }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-[0.14em] text-white">
                            {layer.title}
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.1em] text-white/70">
                            0{idx + 1}
                          </span>
                        </div>
                      </div>

                      {/* Big fraction */}
                      <div className="px-4 py-5 border-b border-[#0A1628]/10">
                        <div className="flex items-baseline gap-1">
                          <span
                            className="data-num text-5xl font-black leading-none tabular-nums"
                            style={{ color: layerColors.text }}
                          >
                            {String(activeCount).padStart(2, "0")}
                          </span>
                          <span className="data-num text-xl font-black text-[#0A1628]/20 leading-none">
                            / 0{totalCount}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-2 uppercase tracking-[0.08em] inline-flex items-start gap-1.5">
                          <span>{layer.summary}</span>
                          <InfoTooltip
                            content={LAYER_TOOLTIPS[idx].content}
                            detail={LAYER_TOOLTIPS[idx].detail}
                          />
                        </div>
                      </div>

                      {/* Signal rows */}
                      <div className="flex-1 divide-y divide-[#0A1628]/10">
                        {layer.items.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 px-4 py-3"
                          >
                            {item.active ? (
                              <div
                                className="h-3 w-3 rounded-full border border-[#0A1628] shrink-0"
                                style={{ backgroundColor: layerColors.band }}
                              />
                            ) : (
                              <div className="h-3 w-3 rounded-full border border-[#0A1628]/30 bg-white shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div
                                className={cx(
                                  "text-sm truncate",
                                  item.active ? "text-foreground font-semibold" : "text-muted-foreground",
                                )}
                              >
                                {item.label}
                              </div>
                              {item.detail && (
                                <div className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">
                                  {item.detail}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              03 // POSITION vs PEERS
              ═══════════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="data-num text-sm font-black text-[#FBBA16] shrink-0">/ 03</span>
              <span className="spec-label text-muted-foreground shrink-0">
                POSITION // {(brand.category || "CATEGORY").toUpperCase()} PEERS
              </span>
              <span className="h-px flex-1 bg-[color:var(--color-arc-border)]" />
              <span className="spec-label text-muted-foreground shrink-0 hidden sm:inline">
                N={categoryPeerScans.length}
              </span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[0.9] mb-3 max-w-3xl">
              How it sits against <span className="text-[#FBBA16]">peers.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-7 max-w-2xl mb-10">
              Four lenses. Numbers shift as the field evolves, so treat these as the
              current shape of the market, not a fixed benchmark.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InstrumentCard
                tag="ACCESS"
                color="#0259DD"
                value={categoryAccessPct ?? "—"}
                valueSuffix={categoryAccessPct ? "" : "n/a"}
                detail={`${blockedCount + restrictedCount} of 9 agents showed friction on this scan.`}
                lowPool={categoryPeerScans.length < 4}
                tooltipContent={INSTRUMENT_TOOLTIPS.ACCESS.content}
                tooltipDetail={INSTRUMENT_TOOLTIPS.ACCESS.detail}
              />
              <InstrumentCard
                tag="COVERAGE"
                color="#FF6648"
                value={categorySignalPct ?? "—"}
                valueSuffix={categorySignalPct ? "" : "n/a"}
                detail={`${machineReadableCount} of 8 machine-readable signals detected.`}
                lowPool={categoryPeerScans.length < 4}
                tooltipContent={INSTRUMENT_TOOLTIPS.COVERAGE.content}
                tooltipDetail={INSTRUMENT_TOOLTIPS.COVERAGE.detail}
              />
              <InstrumentCard
                tag="LLMS.TXT"
                color="#7C3AED"
                value={scan.hasLlmsTxt ? "YES" : "NO"}
                valueSuffix=""
                detail={`${llmsCategoryAdoption}% of ${brand.category || "peers"} publish llms.txt.`}
                tooltipContent={INSTRUMENT_TOOLTIPS["LLMS.TXT"].content}
                tooltipDetail={INSTRUMENT_TOOLTIPS["LLMS.TXT"].detail}
              />
              <InstrumentCard
                tag="AGENT GUIDANCE"
                color="#00492C"
                value={scan.hasAgentsTxt ? "YES" : "NO"}
                valueSuffix={scan.hasAgentsTxt && scan.agentsTxtVariant ? scan.agentsTxtVariant : ""}
                detail={`${guidanceCategoryAdoption}% of ${brand.category || "peers"} publish any explicit guidance file.`}
                tooltipContent={INSTRUMENT_TOOLTIPS["AGENT GUIDANCE"].content}
                tooltipDetail={INSTRUMENT_TOOLTIPS["AGENT GUIDANCE"].detail}
              />
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              04 // TRANSMISSION LOG
              ═══════════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="data-num text-sm font-black text-[#059669] shrink-0">/ 04</span>
              <span className="spec-label text-muted-foreground shrink-0">TRANSMISSION LOG</span>
              <span className="h-px flex-1 bg-[color:var(--color-arc-border)]" />
              <span className="spec-label text-muted-foreground shrink-0 hidden sm:inline">
                {changelog.length} ENTRIES
              </span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[0.9] mb-3 max-w-3xl">
              What moved <span className="text-[#059669]">recently.</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-7 max-w-2xl mb-10">
              Confirmed published changes. ARC buffers noisy signals before promoting
              them, so stable brands will look empty here — that is a feature.
            </p>

            <div className="relative">
              <div
                className="absolute inset-0 -z-10"
                style={{ backgroundColor: "#0A1628", transform: "translate(4px, 4px)" }}
              />
              <div className="border-2 border-[#0A1628] bg-white overflow-hidden">
                {/* Terminal chrome header */}
                <div
                  className="flex items-center gap-2 px-4 py-2.5 border-b-2 border-[#0A1628]"
                  style={{ backgroundColor: "#0A1628" }}
                >
                  <span className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF6648]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FBBA16]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                  </span>
                  <span className="text-[10px] font-mono text-white/50 ml-2">
                    arc.report / brand / {brand.slug} / log
                  </span>
                  <span className="text-[10px] font-mono text-[#84AFFB] ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84AFFB] animate-pulse" />
                    {changelog.length > 0 ? "ACTIVE" : "STANDBY"}
                  </span>
                </div>

                {/* Log entries */}
                {changelog.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <div className="spec-label text-muted-foreground mb-2">NO TRANSMISSIONS</div>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      This brand has not produced a confirmed change yet. Stable profiles
                      are a signal of their own.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#0A1628]/10">
                    {changelog.map((entry) => {
                      const fieldColor = getFieldColor(entry.field);
                      return (
                        <div
                          key={entry.id}
                          className="flex items-baseline gap-4 px-4 sm:px-5 py-3 hover:bg-[color:var(--color-arc-cream)] transition-colors"
                        >
                          <span
                            className="inline-block w-1 self-stretch shrink-0"
                            style={{ backgroundColor: fieldColor }}
                          />
                          <span className="data-num text-[11px] text-muted-foreground shrink-0 w-20 tabular-nums">
                            {formatDate(entry.detectedAt).toUpperCase()}
                          </span>
                          <span className="text-[13px] font-mono text-foreground shrink-0 w-48 sm:w-56 truncate">
                            {formatFieldLabel(entry.field)}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground flex-1 min-w-0 truncate text-right">
                            <span className="text-[#FF6648]">{entry.oldValue ?? "—"}</span>
                            <span className="text-muted-foreground/40 mx-2">→</span>
                            <span className="text-[#059669] font-bold">{entry.newValue ?? "—"}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              05 // FIELD NOTES
              ═══════════════════════════════════════════════════════════ */}
          <div>
            <div className="flex items-baseline gap-3 mb-6">
              <span className="data-num text-sm font-black text-[#7C3AED] shrink-0">/ 05</span>
              <span className="spec-label text-muted-foreground shrink-0">FIELD NOTES</span>
              <span className="h-px flex-1 bg-[color:var(--color-arc-border)]" />
              <span className="spec-label text-muted-foreground shrink-0 hidden sm:inline">
                INTERPRET WITH CARE
              </span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[0.9] mb-3 max-w-3xl">
              This is an <span className="text-[#7C3AED]">early-field</span> readout.
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground leading-7 max-w-2xl mb-10">
              Agentic commerce is a young category. Most stores were not built with AI
              shoppers in mind. Read this page with three things in mind.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  heading: "Open does not mean optimized.",
                  body: "A site can allow agent traffic and still give weak machine-readable guidance once the agent arrives.",
                  color: "#0259DD",
                },
                {
                  heading: "Policy is not enforcement.",
                  body: "A brand can look open in robots.txt while site defenses still stop automated requests in practice.",
                  color: "#FF6648",
                },
                {
                  heading: "Movement beats snapshots.",
                  body: "One static profile is useful. Repeated changes are what turn this page into intelligence.",
                  color: "#FBBA16",
                },
              ].map((item, i) => (
                <div key={item.heading} className="relative">
                  <div
                    className="absolute inset-0 -z-10"
                    style={{ backgroundColor: item.color, opacity: 0.25, transform: "translate(4px, 4px)" }}
                  />
                  <div className="border-2 border-[#0A1628] bg-white p-5 h-full">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <span
                        className="data-num text-[72px] font-black leading-none"
                        style={{ color: item.color }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className="inline-block h-3 w-3 rounded-full border-2 border-[#0A1628] mt-3 shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                    <div className="text-base font-black text-foreground mb-2 leading-tight">
                      {item.heading}
                    </div>
                    <p className="text-sm text-muted-foreground leading-6">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>



      <Footer />
    </div>
  );
}
