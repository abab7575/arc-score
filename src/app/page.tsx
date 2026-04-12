"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import type { BrandCategory } from "@/lib/brands";
import { CATEGORY_LABELS } from "@/lib/brands";
import Link from "next/link";

interface MatrixBrand {
  id: number;
  slug: string;
  name: string;
  url: string;
  category: string;
  scanned: boolean;
  platform?: string;
  cdn?: string;
  waf?: string;
  blockedAgentCount?: number;
  hasJsonLd?: boolean;
  hasSchemaProduct?: boolean;
  hasOpenGraph?: boolean;
  hasProductFeed?: boolean;
  scannedAt?: string;
}

interface HomepageStats {
  brandCount: number;
  lastScan: string | null;
  changesThisWeek: number;
  agentsTracked: number;
  recentChanges: Array<{
    id: number;
    brandId: number;
    brandSlug: string;
    brandName: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
    detectedAt: string;
  }>;
}

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
  const [brands, setBrands] = useState<MatrixBrand[]>([]);
  const [stats, setStats] = useState<HomepageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"alpha" | "blocked" | "platform">("alpha");

  useEffect(() => {
    Promise.all([
      fetch("/api/matrix").then(res => res.json()),
      fetch("/api/homepage-stats").then(res => res.json()),
    ])
      .then(([matrixData, statsData]) => {
        setBrands(matrixData.brands ?? []);
        setStats(statsData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = brands;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== "all") {
      result = result.filter(b => b.category === selectedCategory);
    }
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "blocked":
          return (b.blockedAgentCount ?? 0) - (a.blockedAgentCount ?? 0);
        case "platform":
          return (a.platform ?? "zzz").localeCompare(b.platform ?? "zzz");
        case "alpha":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return result;
  }, [brands, searchQuery, selectedCategory, sortBy]);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ARC Report",
    url: "https://arcreport.ai",
    description: "ARC Report scans 1,000+ ecommerce brands daily and alerts you when their AI agent access posture changes.",
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />

      {/* Hero */}
      <section style={{ backgroundColor: "#0A1628" }} className="border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-[1.05] max-w-3xl">
            See which AI agents your competitors are letting in.
          </h1>
          <p className="mt-5 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
            ARC Report scans 1,000+ ecommerce brands every day and alerts you the moment their AI access posture changes — robots.txt, user-agent rules, platform, CDN, structured data.
          </p>

          {/* Proof row */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 max-w-3xl">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {stats?.brandCount ?? "—"}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Brands monitored
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {relativeTime(stats?.lastScan ?? null)}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Last scan
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {stats?.changesThisWeek ?? "—"}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Changes this week
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono tabular-nums">
                {stats?.agentsTracked ?? 9}
              </div>
              <div className="mt-1 text-[10px] sm:text-xs uppercase tracking-wider text-white/50 font-semibold">
                Agents tracked
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href="/pricing"
              className="inline-block text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-6 py-3 transition-colors"
            >
              Start my watchlist →
            </Link>
            <a
              href="#brand-index"
              className="text-sm font-semibold text-white/70 hover:text-white transition-colors underline underline-offset-4"
            >
              Browse the index
            </a>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {/* Brand index */}
        <div id="brand-index" className="scroll-mt-16">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-black text-foreground tracking-tight">
              Brand index
            </h2>
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {brands.length} brand{brands.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <input
              type="text"
              placeholder="Search brands..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0259DD] w-48"
            />
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value as BrandCategory | "all")}
              className="border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0259DD]"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0259DD]"
            >
              <option value="alpha">A-Z</option>
              <option value="blocked">Most Blocked</option>
              <option value="platform">By Platform</option>
            </select>
          </div>

          {/* Brand table */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground text-sm">
              Loading brands...
            </div>
          ) : (
            <div className="border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Brand</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Platform</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-foreground">Agents Blocked</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-foreground">Structured Data</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">CDN / WAF</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(brand => (
                    <tr key={brand.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <Link href={`/brand/${brand.slug}`} className="font-medium text-foreground hover:text-[#0259DD] transition-colors">
                          {brand.name}
                        </Link>
                        <span className="text-xs text-muted-foreground ml-2">{brand.category}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        {brand.platform ? (
                          <span className="text-xs font-mono bg-gray-100 px-2 py-0.5">{brand.platform}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        {brand.scanned ? (
                          <span className={`font-mono font-bold tabular-nums ${
                            (brand.blockedAgentCount ?? 0) === 0
                              ? "text-[#059669]"
                              : (brand.blockedAgentCount ?? 0) >= 4
                                ? "text-[#FF6648]"
                                : "text-[#FBBA16]"
                          }`}>
                            {brand.blockedAgentCount ?? 0} / 8
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">pending</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {brand.scanned ? (
                            <>
                              {brand.hasJsonLd && <span className="text-[9px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5">LD</span>}
                              {brand.hasOpenGraph && <span className="text-[9px] font-mono bg-green-50 text-green-700 px-1.5 py-0.5">OG</span>}
                              {brand.hasProductFeed && <span className="text-[9px] font-mono bg-amber-50 text-amber-700 px-1.5 py-0.5">Feed</span>}
                              {!brand.hasJsonLd && !brand.hasOpenGraph && !brand.hasProductFeed && (
                                <span className="text-xs text-muted-foreground">none</span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {brand.cdn && brand.cdn !== "unknown" && (
                            <span className="text-[9px] font-mono bg-gray-100 px-1.5 py-0.5">{brand.cdn}</span>
                          )}
                          {brand.waf && brand.waf !== "none-detected" && (
                            <span className="text-[9px] font-mono bg-red-50 text-red-700 px-1.5 py-0.5">{brand.waf}</span>
                          )}
                          {(!brand.cdn || brand.cdn === "unknown") && (!brand.waf || brand.waf === "none-detected") && (
                            <span className="text-xs text-muted-foreground">--</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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

          {stats && stats.recentChanges.length > 0 ? (
            <div className="border border-gray-200 bg-white divide-y divide-gray-100">
              {stats.recentChanges.map(entry => (
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
