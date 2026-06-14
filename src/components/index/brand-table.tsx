"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { BrandCategory } from "@/lib/brands";
import { CATEGORY_LABELS } from "@/lib/brands";
import type { MatrixBrandRow } from "@/lib/index-data";
import { TRACKED_AGENT_COUNT } from "@/lib/site";

/**
 * Client-side filtering/sorting on top of a server-rendered index or sample.
 * The controls remain progressive enhancement over the rows supplied.
 */
export function BrandTable({
  brands,
  totalCount = brands.length,
  title = "Brand index",
}: {
  brands: MatrixBrandRow[];
  totalCount?: number;
  title?: string;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"alpha" | "blocked" | "score" | "platform">("score");

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
        case "score":
          return (b.arcScore ?? -1) - (a.arcScore ?? -1);
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

  return (
    <>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-black text-foreground tracking-tight">
          {title}
        </h2>
        <span className="text-xs text-muted-foreground">
          {filtered.length} shown from {totalCount.toLocaleString()} brand{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label htmlFor="brand-search" className="sr-only">Search brands</label>
        <input
          id="brand-search"
          type="text"
          placeholder="Search brands..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0259DD] w-48"
        />
        <label htmlFor="brand-category" className="sr-only">Filter by category</label>
        <select
          id="brand-category"
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value as BrandCategory | "all")}
          className="border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0259DD]"
        >
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <label htmlFor="brand-sort" className="sr-only">Sort brands</label>
        <select
          id="brand-sort"
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0259DD]"
        >
          <option value="score">ARC Score</option>
          <option value="alpha">A-Z</option>
          <option value="blocked">Most Blocked</option>
          <option value="platform">By Platform</option>
        </select>
      </div>

      {/* Brand table */}
      <div className="border border-gray-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/50">
              <th className="text-left px-4 py-2.5 font-semibold text-foreground">Brand</th>
              <th className="text-right px-4 py-2.5 font-semibold text-foreground" title="ARC Score v1.0 — see /methodology">Score</th>
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
                <td className="px-4 py-2.5 text-right">
                  {brand.arcScore !== undefined ? (
                    <span className={`font-mono font-bold tabular-nums ${
                      brand.arcScore >= 85 ? "text-[#059669]"
                        : brand.arcScore >= 65 ? "text-[#0259DD]"
                        : brand.arcScore >= 40 ? "text-[#D97706]"
                        : "text-[#DC2626]"
                    }`}>{brand.arcScore}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
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
                      {brand.blockedAgentCount ?? 0} / {TRACKED_AGENT_COUNT}
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
    </>
  );
}
