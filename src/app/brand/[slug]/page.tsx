import { notFound } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { InfoTooltip } from "@/components/ui/info-tooltip";
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

        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 pb-8 space-y-16">
          {/* ─── Agent Reach ──────────────────────────────────────── */}
          <div>
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Agent Reach
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  How nine major AI agents fare on this site
                </h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0 whitespace-nowrap">
                scanned {formatDate(scan.scannedAt)}
                {scan.homepageResponseMs ? ` · ${scan.homepageResponseMs}ms` : ""}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-6 mb-6 max-w-2xl">
              ARC checks each agent&apos;s robots.txt rule and a live HTTP request from
              that agent&apos;s user-agent string. The five outcomes are ordered from
              least to most friction.
            </p>

            {/* Legend — inline, quiet */}
            <div className="rounded-lg border border-[color:var(--color-arc-border)] bg-white px-5 py-4 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                {(
                  ["allowed", "no_rule", "restricted", "blocked", "inconclusive"] as AgentStatus[]
                ).map((status) => {
                  const tone = statusStyle(status);
                  return (
                    <div key={status} className="flex items-start gap-3">
                      <span
                        className={cx(
                          "mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] shrink-0 whitespace-nowrap",
                          tone.chip,
                        )}
                      >
                        {tone.label}
                      </span>
                      <span className="text-[13px] leading-5 text-muted-foreground">
                        {tone.tone}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Agent grid — one card style */}
            <div className="rounded-lg border border-[color:var(--color-arc-border)] bg-white overflow-hidden divide-y divide-[color:var(--color-arc-border)] sm:divide-y-0 sm:grid sm:grid-cols-3">
              {statuses.map(({ agent, status }, i) => {
                const tone = statusStyle(status);
                return (
                  <div
                    key={agent}
                    className={cx(
                      "flex items-center justify-between gap-3 px-5 py-4",
                      i % 3 !== 0 && "sm:border-l sm:border-[color:var(--color-arc-border)]",
                      i >= 3 && "sm:border-t sm:border-[color:var(--color-arc-border)]",
                    )}
                  >
                    <span className="text-sm font-mono text-foreground truncate">{agent}</span>
                    <span
                      className={cx(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] shrink-0 whitespace-nowrap",
                        tone.chip,
                      )}
                    >
                      {tone.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Machine-Readable Signals ─────────────────────────── */}
          <div>
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Machine-Readable Signals
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
                What agents can understand once inside
              </h2>
              <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
                A site can be reachable and still be hard for agents to understand. These
                are the published signals ARC found on this scan.
              </p>
            </div>

            <div className="rounded-lg border border-[color:var(--color-arc-border)] bg-white divide-y divide-[color:var(--color-arc-border)]">
              {machineReadableLayers.map((layer) => (
                <div key={layer.title} className="px-5 sm:px-6 py-5">
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-foreground">
                      {layer.title}
                    </h3>
                    <span className="text-[11px] text-muted-foreground shrink-0 max-w-[60%] text-right">
                      {layer.summary}
                    </span>
                  </div>

                  <dl className="divide-y divide-[color:var(--color-arc-border)] -mx-5 sm:-mx-6">
                    {layer.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-baseline justify-between gap-4 px-5 sm:px-6 py-2.5"
                      >
                        <dt className="text-sm text-foreground">
                          {item.label}
                          {item.detail && (
                            <span className="text-xs text-muted-foreground ml-2 font-mono">
                              {item.detail}
                            </span>
                          )}
                        </dt>
                        <dd
                          className={cx(
                            "text-[11px] font-mono font-semibold uppercase tracking-[0.12em] shrink-0",
                            item.active ? "text-emerald-700" : "text-muted-foreground/60",
                          )}
                        >
                          {item.active ? "present" : "not detected"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>

          {/* ─── Peer Position ────────────────────────────────────── */}
          <div>
            <div className="mb-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                Peer Position
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
                How this sits in its category
              </h2>
              <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
                Comparisons against {brand.category || "category"} peers in the ARC index.
                These numbers shift as the field evolves, so read them as the current shape of
                the market, not a fixed benchmark.
              </p>
            </div>

            <div className="rounded-lg border border-[color:var(--color-arc-border)] bg-white divide-y divide-[color:var(--color-arc-border)]">
              <PeerLine
                label="Access"
                value={categoryAccessPct ?? "Not enough peers to compare"}
                detail={`${blockedCount + restrictedCount} of 9 agents showed friction on this scan.`}
              />
              <PeerLine
                label="Machine-readable coverage"
                value={categorySignalPct ?? "Not enough peers to compare"}
                detail={`${machineReadableCount} of 8 signals currently detected.`}
              />
              <PeerLine
                label="llms.txt adoption"
                value={scan.hasLlmsTxt ? "Publishes llms.txt" : "No llms.txt"}
                detail={`${llmsCategoryAdoption}% of ${brand.category || "category"} peers currently publish llms.txt.`}
              />
              <PeerLine
                label="Agent declaration file"
                value={
                  scan.hasAgentsTxt
                    ? `Publishes ${scan.agentsTxtVariant ?? "declaration file"}`
                    : "None detected"
                }
                detail={`${guidanceCategoryAdoption}% of ${brand.category || "category"} peers publish any agent or LLM guidance file.`}
              />
            </div>
          </div>

          {/* ─── Recent Changes ───────────────────────────────────── */}
          <div>
            <div className="flex items-baseline justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  Recent Changes
                </p>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                  Confirmed movement
                </h2>
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                last {Math.min(changelog.length, 12)} {pluralize(Math.min(changelog.length, 12), "entry", "entries")}
              </span>
            </div>

            {changelog.length === 0 ? (
              <div className="rounded-lg border border-[color:var(--color-arc-border)] bg-white px-5 py-8 text-sm text-muted-foreground">
                No confirmed changes have been published for this brand yet. ARC buffers noisy
                signals before promoting them, so stable profiles will look empty here.
              </div>
            ) : (
              <div className="rounded-lg border border-[color:var(--color-arc-border)] bg-white divide-y divide-[color:var(--color-arc-border)]">
                {changelog.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-baseline gap-4 px-5 sm:px-6 py-3.5"
                  >
                    <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-20">
                      {formatDate(entry.detectedAt)}
                    </span>
                    <span className="text-sm text-foreground shrink-0 w-44 sm:w-56 truncate">
                      {formatFieldLabel(entry.field)}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground flex-1 min-w-0 truncate text-right">
                      {entry.oldValue ?? "—"} <span className="text-muted-foreground/60">→</span>{" "}
                      <span className="text-foreground">{entry.newValue ?? "—"}</span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── How to Read This ─────────────────────────────────── */}
          <div>
            <div className="mb-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
                How to Read This
              </p>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">
                This is an early-field readout
              </h2>
              <p className="text-sm text-muted-foreground leading-6 max-w-2xl">
                Agentic commerce is a young category. Most stores were not built with AI
                shoppers in mind, and files like llms.txt or agent declaration docs are
                only now starting to appear. Read this page with three things in mind.
              </p>
            </div>

            <ol className="rounded-lg border border-[color:var(--color-arc-border)] bg-white divide-y divide-[color:var(--color-arc-border)]">
              {[
                {
                  heading: "Open does not mean optimized.",
                  body: "A site can allow agent traffic and still give weak machine-readable guidance once the agent arrives.",
                },
                {
                  heading: "Policy is not the same as enforcement.",
                  body: "A brand can look open in robots.txt while site defenses still stop automated requests in practice.",
                },
                {
                  heading: "Movement matters more than a snapshot.",
                  body: "One static profile is useful. Repeated changes are what turn this page into intelligence.",
                },
              ].map((item, i) => (
                <li key={item.heading} className="flex items-baseline gap-4 px-5 sm:px-6 py-4">
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 w-6">
                    0{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-foreground mb-0.5">
                      {item.heading}
                    </div>
                    <p className="text-sm text-muted-foreground leading-6">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>


      <Footer />
    </div>
  );
}
