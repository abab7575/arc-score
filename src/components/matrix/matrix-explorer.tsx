"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface Agent {
  id: string;
  short: string;
  company: string;
  product: string;
}

const AGENTS: Agent[] = [
  { id: "GPTBot", short: "GPT", company: "OpenAI", product: "ChatGPT training" },
  { id: "ChatGPT-User", short: "GPT-U", company: "OpenAI", product: "ChatGPT live" },
  { id: "ClaudeBot", short: "Claude", company: "Anthropic", product: "Claude training" },
  { id: "Claude-Web", short: "Cl-Web", company: "Anthropic", product: "Claude live" },
  { id: "PerplexityBot", short: "Perp", company: "Perplexity", product: "Perplexity / Comet" },
  { id: "Google-Extended", short: "Goog", company: "Google", product: "AI Mode / Gemini" },
  { id: "Amazonbot", short: "Amzn", company: "Amazon", product: "Buy For Me" },
  { id: "Bingbot", short: "Bing", company: "Microsoft", product: "Copilot / Bing" },
  { id: "CCBot", short: "CC", company: "Common Crawl", product: "Open training data" },
];

type AgentStatus = "allowed" | "blocked" | "no_rule";

interface BrandRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  agents: Record<string, AgentStatus>;
  blockedCount: number;
  scannedAt: string | null;
}

type SortMode = "most-blocked" | "most-open" | "name" | "category";
type FilterMode = "all" | "blocking" | "open";

const COLORS = {
  bg: "#FFF8F0",
  panel: "#FFFFFF",
  border: "#E8E0D8",
  text: "#0A1628",
  muted: "#6B7280",
  blocked: "#DC2626",
  allowed: "#059669",
  noRule: "#C5DAF7",
  unknown: "#EFEAE3",
  cobalt: "#0259DD",
  coral: "#FF6648",
};

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
  const [sort, setSort] = useState<SortMode>("most-blocked");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = useMemo(
    () => Array.from(new Set(brands.map((b) => b.category))).sort(),
    [brands],
  );

  const filtered = useMemo(() => {
    let result = brands;
    if (filter === "blocking") result = result.filter((r) => r.blockedCount > 0);
    if (filter === "open") result = result.filter((r) => r.blockedCount === 0);
    if (selectedCategory !== "all")
      result = result.filter((r) => r.category === selectedCategory);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    const sorted = [...result];
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
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
              Agent access matrix
            </h1>
            <p style={{ color: COLORS.muted, marginTop: 8, fontSize: 14, maxWidth: 640, lineHeight: 1.6 }}>
              Daily robots.txt scan of {stats.scannedBrands.toLocaleString()} brands × {AGENTS.length} AI agents.
              Each cell is one brand × one agent.
            </p>
          </div>

          {/* Stats Row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
            <Stat value={stats.scannedBrands.toLocaleString()} label="Brands scanned" color={COLORS.cobalt} />
            <Stat value={`${stats.percentFullyOpen}%`} label="Fully open to AI" color={COLORS.allowed} />
            <Stat value={stats.brandsBlocking.toLocaleString()} label="Blocking ≥1 agent" color={COLORS.coral} />
            <Stat value={stats.avgBlockedAgents.toString()} label="Avg agents blocked" color={COLORS.text} />
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
                  { value: "blocking", label: "Blocking ≥1" },
                  { value: "open", label: "Fully open" },
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
                  { value: "most-blocked", label: "Most blocked" },
                  { value: "most-open", label: "Most open" },
                  { value: "name", label: "A–Z" },
                  { value: "category", label: "By category" },
                ]}
              />
              <span style={{ color: COLORS.muted, fontSize: 12, ...mono }}>
                {filtered.length.toLocaleString()} shown
              </span>
              <div style={{ flex: 1 }} />
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
            <strong style={{ color: COLORS.text }}>Methodology:</strong> Each row is one brand;
            each column is one AI agent. Cells reflect that brand&apos;s robots.txt rule for that
            agent — <span style={{ color: COLORS.allowed, fontWeight: 600 }}>green</span> = explicitly
            allowed, <span style={{ color: COLORS.blocked, fontWeight: 600 }}>red</span> = explicitly
            blocked, <span style={{ color: COLORS.cobalt, fontWeight: 600 }}>blue</span> = no rule
            (allowed by default). robots.txt is a policy declaration; some sites also enforce at the
            CDN/WAF level, which isn&apos;t reflected here.
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
      {AGENTS.map((agent) => {
        const status = brand.agents[agent.id];
        const color =
          status === "blocked"
            ? COLORS.blocked
            : status === "allowed"
              ? COLORS.allowed
              : status === "no_rule"
                ? COLORS.noRule
                : COLORS.unknown;
        const label =
          status === "blocked"
            ? "Blocked"
            : status === "allowed"
              ? "Allowed"
              : status === "no_rule"
                ? "No rule"
                : "Unknown";
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
                opacity: status === "no_rule" || !status ? 0.55 : 1,
              }}
            />
          </td>
        );
      })}
    </tr>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div
      style={{
        backgroundColor: COLORS.panel,
        padding: "12px 16px",
        border: `1px solid ${COLORS.border}`,
        borderLeft: `3px solid ${color}`,
        flex: "1 1 140px",
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 800, color, ...mono, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{label}</div>
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
    <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
      <Swatch color={COLORS.allowed} label="Allowed" />
      <Swatch color={COLORS.noRule} label="No rule" opacity={0.55} />
      <Swatch color={COLORS.blocked} label="Blocked" />
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
