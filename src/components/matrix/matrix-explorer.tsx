"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TRACKED_AGENTS } from "@/lib/site";
import { exportMatrixImage } from "@/components/matrix/export-image";

interface Agent {
  id: string;
  short: string;
  company: string;
  product: string;
}

const SHORT_NAMES: Record<string, string> = {
  "GPTBot": "GPT", "ChatGPT-User": "GPT-U", "ClaudeBot": "Claude", "Claude-Web": "Cl-Web",
  "PerplexityBot": "Perp", "Google-Extended": "Goog", "Amazonbot": "Amzn", "Bingbot": "Bing", "CCBot": "CC",
};

const AGENTS: Agent[] = TRACKED_AGENTS.map((a) => ({
  id: a.id,
  short: SHORT_NAMES[a.id] ?? a.id,
  company: a.company,
  product: a.product,
}));

type AgentStatus = "allowed" | "blocked" | "no_rule" | "restricted" | "inconclusive";

interface BrandRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  agents: Record<string, AgentStatus>;
  blockedCount: number;
  scannedAt: string | null;
  arcScore?: number;
}

type SortMode = "score" | "waf-gap" | "most-blocked" | "most-open" | "name" | "category";
type FilterMode = "all" | "ready" | "waf-gap" | "blocking" | "effectively-open";

const COLORS = {
  bg: "#FFF8F0",
  panel: "#FFFFFF",
  border: "#E8E0D8",
  text: "#0A1628",
  muted: "#6B7280",
  blocked: "#DC2626",
  restricted: "#F59E0B",
  allowed: "#059669",
  noRule: "#BFE3CF",
  unknown: "#EFEAE3",
  cobalt: "#0259DD",
  coral: "#FF6648",
};

/** An agent can effectively reach the site (door open, not blocked or WAF-walled). */
function isEffectivelyOpen(status: AgentStatus): boolean {
  return status === "allowed" || status === "no_rule";
}
function isReachableBlock(status: AgentStatus): boolean {
  return status === "blocked" || status === "restricted";
}

interface ReadinessMetrics {
  effectivelyOpen: number;
  effectivelyOpenPct: number;
  wafGap: number; // robots.txt allows, but WAF restricts ≥1 agent
  wafGapPct: number;
  policyBlocking: number; // explicit robots.txt block of ≥1 agent
  ready: number; // ARC Score ≥ 65
  readyPct: number;
  medianScore: number;
}

function computeReadiness(brands: BrandRow[]): ReadinessMetrics {
  const n = brands.length || 1;
  let effectivelyOpen = 0;
  let wafGap = 0;
  let policyBlocking = 0;
  let ready = 0;
  const scores: number[] = [];
  for (const b of brands) {
    const vals = Object.values(b.agents);
    const hasPolicyBlock = vals.some((v) => v === "blocked");
    const hasWafRestrict = vals.some((v) => v === "restricted");
    if (!hasPolicyBlock && !hasWafRestrict) effectivelyOpen += 1;
    if (!hasPolicyBlock && hasWafRestrict) wafGap += 1;
    if (hasPolicyBlock) policyBlocking += 1;
    if ((b.arcScore ?? 0) >= 65) ready += 1;
    if (b.arcScore !== undefined) scores.push(b.arcScore);
  }
  scores.sort((a, b) => a - b);
  return {
    effectivelyOpen,
    effectivelyOpenPct: Math.round((effectivelyOpen / n) * 100),
    wafGap,
    wafGapPct: Math.round((wafGap / n) * 100),
    policyBlocking,
    ready,
    readyPct: Math.round((ready / n) * 100),
    medianScore: scores.length ? scores[Math.floor(scores.length / 2)] : 0,
  };
}

function brandHasWafGap(b: BrandRow): boolean {
  const vals = Object.values(b.agents);
  return !vals.some((v) => v === "blocked") && vals.some((v) => v === "restricted");
}
function brandRestrictedCount(b: BrandRow): number {
  return Object.values(b.agents).filter(isReachableBlock).length;
}

export interface MatrixExplorerProps {
  brands: BrandRow[];
  stats: {
    totalBrands: number;
    scannedBrands: number;
    brandsBlocking: number;
    brandsFullyOpen: number;
    avgBlockedAgents: number;
    percentFullyOpen: number;
  };
}

/**
 * Client-side explorer over server-rendered matrix data. The full dataset is
 * passed as props so it lands in the initial HTML; sorting/filtering is
 * progressive enhancement.
 */
export function MatrixExplorer({ brands, stats }: MatrixExplorerProps) {
  const [sort, setSort] = useState<SortMode>("score");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(
    () => Array.from(new Set(brands.map((b) => b.category))).sort(),
    [brands],
  );

  const readiness = useMemo(() => computeReadiness(brands), [brands]);

  const filtered = useMemo(() => {
    let result = brands;
    if (filter === "ready") result = result.filter((r) => (r.arcScore ?? 0) >= 65);
    if (filter === "waf-gap") result = result.filter(brandHasWafGap);
    if (filter === "blocking") result = result.filter((r) => r.blockedCount > 0);
    if (filter === "effectively-open")
      result = result.filter((r) => Object.values(r.agents).every(isEffectivelyOpen));
    if (selectedCategory !== "all")
      result = result.filter((r) => r.category === selectedCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    const sorted = [...result];
    if (sort === "score")
      sorted.sort((a, b) => (b.arcScore ?? -1) - (a.arcScore ?? -1) || a.name.localeCompare(b.name));
    if (sort === "waf-gap")
      sorted.sort((a, b) => brandRestrictedCount(b) - brandRestrictedCount(a) || a.name.localeCompare(b.name));
    if (sort === "most-blocked")
      sorted.sort((a, b) => b.blockedCount - a.blockedCount || a.name.localeCompare(b.name));
    if (sort === "most-open")
      sorted.sort((a, b) => a.blockedCount - b.blockedCount || a.name.localeCompare(b.name));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "category")
      sorted.sort(
        (a, b) => a.category.localeCompare(b.category) || b.blockedCount - a.blockedCount,
      );
    return sorted;
  }, [brands, filter, selectedCategory, search, sort]);

  return (
    <>
      <div style={{ backgroundColor: COLORS.bg, minHeight: "100vh", color: COLORS.text }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
          {/* Header */}
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
              Agent access matrix
            </h1>
            <p style={{ color: COLORS.muted, marginTop: 8, fontSize: 14, maxWidth: 680, lineHeight: 1.6 }}>
              {stats.percentFullyOpen}% of {stats.scannedBrands.toLocaleString()} brands unlock the
              door in robots.txt — but only{" "}
              <strong style={{ color: COLORS.text }}>{readiness.effectivelyOpenPct}%</strong> are
              actually reachable by every agent once you count{" "}
              <strong style={{ color: COLORS.restricted }}>WAF blocks</strong>. The amber cells are
              brands that <em>say</em> yes and <em>enforce</em> no.
            </p>
          </div>

          {/* Stats Row — readiness, not just robots.txt */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <Stat
              value={String(readiness.medianScore)}
              label="Median ARC Score / 100"
              color={COLORS.cobalt}
            />
            <Stat
              value={`${readiness.readyPct}%`}
              label="Agent-ready (score ≥ 65)"
              color={COLORS.allowed}
              active={filter === "ready"}
              onClick={() => setFilter(filter === "ready" ? "all" : "ready")}
            />
            <Stat
              value={readiness.wafGap.toLocaleString()}
              label="Silently WAF-blocking ≥1 agent"
              color={COLORS.restricted}
              active={filter === "waf-gap"}
              onClick={() => setFilter(filter === "waf-gap" ? "all" : "waf-gap")}
              hint="Allowed in robots.txt, blocked in practice — the agent sales they don't know they're losing"
            />
            <Stat
              value={readiness.policyBlocking.toLocaleString()}
              label="Actively blocking in robots.txt"
              color={COLORS.coral}
              active={filter === "blocking"}
              onClick={() => setFilter(filter === "blocking" ? "all" : "blocking")}
            />
          </div>

          {/* Controls — sticky */}
          <div
            style={{
              position: "sticky",
              top: 0,
              zIndex: 30,
              backgroundColor: COLORS.bg,
              paddingTop: 8,
              paddingBottom: 12,
              borderBottom: `1px solid ${COLORS.border}`,
              marginBottom: 0,
            }}
          >
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "7px 12px",
                  border: `1px solid ${COLORS.border}`,
                  backgroundColor: COLORS.panel,
                  color: COLORS.text,
                  fontSize: 13,
                  ...mono,
                  width: 200,
                }}
              />
              <Select
                value={filter}
                onChange={(v) => setFilter(v as FilterMode)}
                options={[
                  { value: "all", label: "All brands" },
                  { value: "ready", label: "Agent-ready (≥65)" },
                  { value: "waf-gap", label: "WAF gap (says yes, blocks)" },
                  { value: "blocking", label: "Blocking in robots.txt" },
                  { value: "effectively-open", label: "Reachable by all agents" },
                ]}
              />
              <Select
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: "all", label: "All categories" },
                  ...categories.map((c) => ({
                    value: c,
                    label: c.charAt(0).toUpperCase() + c.slice(1),
                  })),
                ]}
              />
              <Select
                value={sort}
                onChange={(v) => setSort(v as SortMode)}
                options={[
                  { value: "score", label: "ARC Score" },
                  { value: "waf-gap", label: "Most WAF-blocked" },
                  { value: "most-blocked", label: "Most robots-blocked" },
                  { value: "most-open", label: "Most open" },
                  { value: "name", label: "A–Z" },
                  { value: "category", label: "By category" },
                ]}
              />
              <span style={{ color: COLORS.muted, fontSize: 12, ...mono }}>
                {filtered.length.toLocaleString()} shown
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={() =>
                  exportMatrixImage(
                    filtered.map((b) => ({ name: b.name, arcScore: b.arcScore, agents: b.agents })),
                    AGENTS.map((a) => a.id),
                    AGENTS.map((a) => a.short),
                  )
                }
                style={{
                  padding: "7px 12px",
                  border: `1px solid ${COLORS.cobalt}`,
                  backgroundColor: COLORS.cobalt,
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  ...mono,
                }}
                title="Download the current view as a PNG with attribution and date"
              >
                Export as image
              </button>
              <Legend />
            </div>
          </div>

          {/* Heatmap */}
          <div style={{ overflowX: "auto", marginTop: 0 }}>
            <table
              style={{
                borderCollapse: "separate",
                borderSpacing: 0,
                minWidth: 640,
                width: "100%",
                fontSize: 12,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      position: "sticky",
                      left: 0,
                      zIndex: 10,
                      backgroundColor: COLORS.bg,
                      padding: "10px 12px 8px 0",
                      textAlign: "left",
                      fontSize: 10,
                      fontWeight: 600,
                      color: COLORS.muted,
                      ...mono,
                      letterSpacing: 0.5,
                      borderBottom: `1px solid ${COLORS.border}`,
                      minWidth: 200,
                    }}
                  >
                    BRAND
                  </th>
                  <th
                    style={{
                      padding: "10px 8px 8px 0",
                      textAlign: "right",
                      fontSize: 10,
                      fontWeight: 600,
                      color: COLORS.muted,
                      ...mono,
                      letterSpacing: 0.5,
                      borderBottom: `1px solid ${COLORS.border}`,
                      width: 52,
                      minWidth: 52,
                    }}
                    title="ARC Score v1.0 — agent access 50 + structured data 25 + protocol files 15 + stability 10. Formula: /methodology"
                  >
                    SCORE
                  </th>
                  {AGENTS.map((agent) => (
                    <th
                      key={agent.id}
                      title={`${agent.id} — ${agent.company} (${agent.product})`}
                      style={{
                        padding: "10px 0 8px",
                        textAlign: "center",
                        fontSize: 10,
                        fontWeight: 600,
                        color: COLORS.muted,
                        ...mono,
                        letterSpacing: 0.3,
                        borderBottom: `1px solid ${COLORS.border}`,
                        width: 56,
                        minWidth: 56,
                      }}
                    >
                      <div style={{ color: COLORS.text, fontSize: 11, fontWeight: 700 }}>
                        {agent.short}
                      </div>
                      <div style={{ color: COLORS.muted, fontSize: 9, marginTop: 2 }}>
                        {agent.company}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((brand) => (
                  <HeatmapRow key={brand.id} brand={brand} />
                ))}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div style={{ padding: 48, textAlign: "center", color: COLORS.muted, fontSize: 14 }}>
              No brands match these filters.
            </div>
          )}

          {/* Methodology */}
          <div
            style={{
              marginTop: 32,
              padding: 20,
              backgroundColor: COLORS.panel,
              border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${COLORS.cobalt}`,
              fontSize: 13,
              color: COLORS.muted,
              lineHeight: 1.65,
            }}
          >
            <strong style={{ color: COLORS.text }}>How to read this:</strong> each row is one brand,
            each column one AI agent.{" "}
            <span style={{ color: COLORS.allowed, fontWeight: 600 }}>Green</span> = the agent gets in
            (allowed, or no rule = allowed by default).{" "}
            <span style={{ color: COLORS.restricted, fontWeight: 600 }}>Amber</span> = the brand
            allows the agent in robots.txt but its WAF/CDN actually blocks the request — a silent
            gap most brands don&apos;t know they have.{" "}
            <span style={{ color: COLORS.blocked, fontWeight: 600 }}>Red</span> = an explicit
            robots.txt block. The robots.txt &quot;allowed&quot; rate flatters everyone; the amber
            tells you who&apos;s actually losing agent traffic. The{" "}
            <strong style={{ color: COLORS.text }}>ARC Score</strong> column folds all of this —
            access, structured data, protocol files, stability — into one 0–100 number (
            <Link href="/methodology#score" style={{ color: COLORS.cobalt }}>formula</Link>).
          </div>
        </div>
      </div>
    </>
  );
}

function HeatmapRow({ brand }: { brand: BrandRow }) {
  return (
    <tr
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      <td
        style={{
          position: "sticky",
          left: 0,
          backgroundColor: COLORS.bg,
          padding: "0 12px 0 0",
          minWidth: 200,
          maxWidth: 200,
          height: 24,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <Link
          href={`/brand/${brand.slug}`}
          style={{
            color: COLORS.text,
            fontSize: 12,
            fontWeight: 500,
            textDecoration: "none",
            display: "block",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {brand.name}
        </Link>
      </td>
      <td
        style={{
          padding: "0 8px 0 0",
          textAlign: "right",
          height: 24,
          borderBottom: `1px solid ${COLORS.border}`,
          ...mono,
          fontSize: 11,
          fontWeight: 700,
          color:
            brand.arcScore === undefined ? COLORS.muted
              : brand.arcScore >= 85 ? COLORS.allowed
              : brand.arcScore >= 65 ? COLORS.cobalt
              : brand.arcScore >= 40 ? "#D97706"
              : COLORS.blocked,
        }}
        title={`ARC Score ${brand.arcScore ?? "—"}/100`}
      >
        {brand.arcScore ?? "—"}
      </td>
      {AGENTS.map((agent) => {
        const status = brand.agents[agent.id];
        const color =
          status === "blocked"
            ? COLORS.blocked
            : status === "restricted"
              ? COLORS.restricted
              : status === "allowed"
                ? COLORS.allowed
                : status === "no_rule"
                  ? COLORS.noRule
                  : COLORS.unknown;
        const label =
          status === "blocked"
            ? "Blocked in robots.txt"
            : status === "restricted"
              ? "Allowed in robots.txt, blocked by WAF/CDN"
              : status === "allowed"
                ? "Allowed"
                : status === "no_rule"
                  ? "No rule (allowed by default)"
                  : "Inconclusive";
        return (
          <td
            key={agent.id}
            title={`${brand.name} · ${agent.id}: ${label}`}
            style={{
              padding: 1,
              height: 24,
              width: 56,
              minWidth: 56,
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: 22,
                backgroundColor: color,
                opacity: status === "no_rule" || status === "inconclusive" || !status ? 0.6 : 1,
              }}
            />
          </td>
        );
      })}
    </tr>
  );
}

function Stat({
  value,
  label,
  color,
  active,
  onClick,
  hint,
}: {
  value: string;
  label: string;
  color: string;
  active?: boolean;
  onClick?: () => void;
  hint?: string;
}) {
  const clickable = !!onClick;
  return (
    <div
      onClick={onClick}
      title={hint ?? (clickable ? "Click to filter the matrix" : undefined)}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && onClick?.() : undefined}
      style={{
        backgroundColor: active ? "#FFFFFF" : COLORS.panel,
        padding: "12px 16px",
        border: `1px solid ${active ? color : COLORS.border}`,
        borderLeft: `3px solid ${color}`,
        boxShadow: active ? `inset 0 0 0 1px ${color}` : undefined,
        flex: "1 1 150px",
        cursor: clickable ? "pointer" : "default",
        transition: "border-color 0.12s",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color, ...mono, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
        {label}
        {clickable && (
          <span style={{ fontSize: 9, color: active ? color : COLORS.muted, opacity: 0.7 }}>
            {active ? "✓ filtered" : "↳ filter"}
          </span>
        )}
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "7px 10px",
        border: `1px solid ${COLORS.border}`,
        backgroundColor: COLORS.panel,
        color: COLORS.text,
        fontSize: 12,
        ...mono,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Legend() {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
      <Swatch color={COLORS.allowed} label="Allowed" />
      <Swatch color={COLORS.noRule} label="No rule" opacity={0.6} />
      <Swatch color={COLORS.restricted} label="WAF block" />
      <Swatch color={COLORS.blocked} label="robots block" />
    </div>
  );
}

function Swatch({ color, label, opacity = 1 }: { color: string; label: string; opacity?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          display: "inline-block",
          width: 14,
          height: 14,
          backgroundColor: color,
          opacity,
        }}
      />
      <span style={{ fontSize: 11, color: COLORS.muted, ...mono }}>{label}</span>
    </div>
  );
}

const mono = { fontFamily: "JetBrains Mono, monospace" } as const;
