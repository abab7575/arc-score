"use client";

import { useState, useEffect } from "react";

interface Agent {
  id: string;
  name: string;
  company: string;
  product: string;
}

interface BrandResult {
  slug: string;
  name: string;
  url: string;
  category: string;
  robotsTxtFound: boolean;
  robotsTxtUrl: string;
  agents: Record<string, "allowed" | "blocked" | "no_rule">;
  blockedCount: number;
  allowedCount: number;
  totalAgents: number;
  scannedAt: string;
}

interface MatrixData {
  generatedAt: string;
  totalBrands: number;
  agents: Agent[];
  results: BrandResult[];
  summary: {
    allBlocked: number;
    someBlocked: number;
    noneBlocked: number;
    avgBlockedAgents: string;
  };
}

type SortMode = "most-blocked" | "most-open" | "name" | "category";
type FilterMode = "all" | "blocking" | "open";

export default function RobotsMatrixPage() {
  const [data, setData] = useState<MatrixData | null>(null);
  const [sort, setSort] = useState<SortMode>("most-blocked");
  const [filter, setFilter] = useState<FilterMode>("all");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/robots-matrix")
      .then((r) => {
        if (!r.ok) throw new Error("Matrix data not found. Run: npx tsx scripts/scan-robots-matrix.ts on the server.");
        return r.json();
      })
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div style={{ backgroundColor: "#0A1628", minHeight: "100vh", color: "#FFF8F0", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14, color: "#FF6648" }}>Matrix data not available</div>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#94A3B8", maxWidth: 400, textAlign: "center" }}>
          Run <code style={{ backgroundColor: "#0F1D32", padding: "2px 6px", borderRadius: 4 }}>npx tsx scripts/scan-robots-matrix.ts</code> on the server to generate the data.
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ backgroundColor: "#0A1628", minHeight: "100vh", color: "#FFF8F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 14 }}>Loading matrix data...</div>
      </div>
    );
  }

  const categories = Array.from(new Set(data.results.map((r) => r.category))).sort();

  let filtered = data.results;
  if (filter === "blocking") filtered = filtered.filter((r) => r.blockedCount > 0);
  if (filter === "open") filtered = filtered.filter((r) => r.blockedCount === 0);
  if (selectedCategory !== "all") filtered = filtered.filter((r) => r.category === selectedCategory);
  if (search) filtered = filtered.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  if (sort === "most-blocked") filtered.sort((a, b) => b.blockedCount - a.blockedCount || a.name.localeCompare(b.name));
  if (sort === "most-open") filtered.sort((a, b) => a.blockedCount - b.blockedCount || a.name.localeCompare(b.name));
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "category") filtered.sort((a, b) => a.category.localeCompare(b.category) || b.blockedCount - a.blockedCount);

  const blockingBrands = data.results.filter((r) => r.blockedCount > 0).length;
  const openBrands = data.results.filter((r) => r.blockedCount === 0).length;
  const pctOpen = ((openBrands / data.totalBrands) * 100).toFixed(0);

  return (
    <div style={{ backgroundColor: "#0A1628", minHeight: "100vh", color: "#FFF8F0" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, letterSpacing: 2, color: "#FF6648", textTransform: "uppercase", marginBottom: 8 }}>
            INTERNAL INTELLIGENCE
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>
            AI Agent Access Matrix
          </h1>
          <p style={{ color: "#94A3B8", marginTop: 4, fontSize: 14 }}>
            robots.txt analysis across {data.totalBrands} brands — generated {new Date(data.generatedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          <StatCard value={data.totalBrands.toString()} label="Brands Scanned" color="#0259DD" />
          <StatCard value={`${pctOpen}%`} label="Fully Open to AI" color="#059669" />
          <StatCard value={blockingBrands.toString()} label="Blocking Some Agents" color="#FF6648" />
          <StatCard value={data.summary.allBlocked.toString()} label="Blocking All Agents" color="#DC2626" />
          <StatCard value={data.summary.avgBlockedAgents} label="Avg Agents Blocked" color="#FBBA16" />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "8px 14px", borderRadius: 6, border: "1px solid #1E293B",
              backgroundColor: "#0F1D32", color: "#FFF8F0", fontSize: 13,
              fontFamily: "JetBrains Mono, monospace", width: 200,
            }}
          />
          <SelectControl value={filter} onChange={(v) => setFilter(v as FilterMode)} options={[
            { value: "all", label: "All Brands" },
            { value: "blocking", label: "Blocking Agents" },
            { value: "open", label: "Fully Open" },
          ]} />
          <SelectControl value={selectedCategory} onChange={setSelectedCategory} options={[
            { value: "all", label: "All Categories" },
            ...categories.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
          ]} />
          <SelectControl value={sort} onChange={(v) => setSort(v as SortMode)} options={[
            { value: "most-blocked", label: "Most Blocked First" },
            { value: "most-open", label: "Most Open First" },
            { value: "name", label: "A-Z" },
            { value: "category", label: "By Category" },
          ]} />
          <span style={{ color: "#64748B", fontSize: 12, fontFamily: "JetBrains Mono, monospace" }}>
            {filtered.length} brands shown
          </span>
        </div>

        {/* Agent Header Row */}
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            {/* Column Headers */}
            <div style={{ display: "flex", borderBottom: "1px solid #1E293B", paddingBottom: 8, marginBottom: 4 }}>
              <div style={{ width: 200, flexShrink: 0, fontSize: 11, color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>
                BRAND
              </div>
              <div style={{ width: 70, flexShrink: 0, textAlign: "center", fontSize: 11, color: "#64748B", fontFamily: "JetBrains Mono, monospace" }}>
                STATUS
              </div>
              {data.agents.map((agent) => (
                <div key={agent.id} style={{
                  flex: 1, minWidth: 70, textAlign: "center", fontSize: 9,
                  color: "#94A3B8", fontFamily: "JetBrains Mono, monospace",
                  lineHeight: 1.3, padding: "0 2px",
                }}>
                  <div style={{ fontWeight: 700, fontSize: 10 }}>{agent.name.replace("Bot", "").replace("-User", "").replace("-Extended", "")}</div>
                  <div style={{ color: "#475569", fontSize: 8 }}>{agent.company}</div>
                </div>
              ))}
            </div>

            {/* Brand Rows */}
            {filtered.map((brand) => (
              <BrandRow key={brand.slug} brand={brand} agents={data.agents} />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginTop: 32, display: "flex", gap: 24, padding: 16, backgroundColor: "#0F1D32", borderRadius: 8 }}>
          <LegendItem color="#059669" label="Explicitly Allowed" />
          <LegendItem color="#0259DD" label="No Rule (Allowed by Default)" />
          <LegendItem color="#DC2626" label="Explicitly Blocked" />
        </div>
      </div>
    </div>
  );
}

function BrandRow({ brand, agents }: { brand: BrandResult; agents: Agent[] }) {
  const allOpen = brand.blockedCount === 0;
  const allBlocked = brand.blockedCount === agents.length;

  return (
    <div style={{
      display: "flex", alignItems: "center",
      padding: "6px 0",
      borderBottom: "1px solid #1E293B10",
      backgroundColor: allBlocked ? "#DC262608" : undefined,
    }}>
      {/* Brand Name */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <a
          href={brand.robotsTxtUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#FFF8F0", fontSize: 13, fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {brand.name}
        </a>
        <div style={{ fontSize: 10, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
          {brand.category}
        </div>
      </div>

      {/* Status Badge */}
      <div style={{ width: 70, flexShrink: 0, textAlign: "center" }}>
        {allOpen && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "#05966920", color: "#059669", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
            OPEN
          </span>
        )}
        {allBlocked && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "#DC262620", color: "#DC2626", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
            CLOSED
          </span>
        )}
        {!allOpen && !allBlocked && (
          <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, backgroundColor: "#FBBA1620", color: "#FBBA16", fontFamily: "JetBrains Mono, monospace", fontWeight: 700 }}>
            {brand.blockedCount}/{agents.length}
          </span>
        )}
      </div>

      {/* Agent Cells */}
      {agents.map((agent) => {
        const status = brand.agents[agent.id];
        let bg = "#0259DD30"; // no_rule = blue (allowed by default)
        let symbol = "·";
        if (status === "blocked") { bg = "#DC262640"; symbol = "✕"; }
        if (status === "allowed") { bg = "#05966940"; symbol = "✓"; }

        return (
          <div key={agent.id} style={{
            flex: 1, minWidth: 70, textAlign: "center",
          }}>
            <span style={{
              display: "inline-block", width: 24, height: 24, lineHeight: "24px",
              borderRadius: 4, fontSize: 12, fontWeight: 700,
              backgroundColor: bg,
              color: status === "blocked" ? "#DC2626" : status === "allowed" ? "#059669" : "#0259DD",
            }}>
              {symbol}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div style={{
      backgroundColor: "#0F1D32", borderRadius: 8, padding: "16px 20px",
      borderLeft: `3px solid ${color}`, flex: "1 1 150px",
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "JetBrains Mono, monospace" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SelectControl({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px", borderRadius: 6, border: "1px solid #1E293B",
        backgroundColor: "#0F1D32", color: "#FFF8F0", fontSize: 12,
        fontFamily: "JetBrains Mono, monospace",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ display: "inline-block", width: 16, height: 16, borderRadius: 3, backgroundColor: `${color}40` }} />
      <span style={{ fontSize: 12, color: "#94A3B8", fontFamily: "JetBrains Mono, monospace" }}>{label}</span>
    </div>
  );
}
