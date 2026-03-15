"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { IndexHero } from "@/components/index/index-hero";
import { StatsBar } from "@/components/index/stats-bar";
import { BrandFilters, type SortOption } from "@/components/index/brand-filters";
import { BrandTable } from "@/components/index/brand-table";
import type { BrandSummary } from "@/types/report";
import type { BrandCategory } from "@/lib/brands";

export default function HomePage() {
  const [brands, setBrands] = useState<BrandSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory | "all">("all");
  const [sortBy, setSortBy] = useState<SortOption>("score");

  useEffect(() => {
    fetch("/api/brands")
      .then((res) => res.json())
      .then((data) => {
        setBrands(data.brands ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = brands;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.slug.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter((b) => b.category === selectedCategory);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.latestScore ?? -1) - (a.latestScore ?? -1);
        case "delta":
          return (b.delta ?? 0) - (a.delta ?? 0);
        case "alpha":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [brands, searchQuery, selectedCategory, sortBy]);

  const stats = useMemo(() => {
    const scored = brands.filter((b) => b.latestScore !== null);
    return {
      total: brands.length,
      avgScore: scored.length
        ? Math.round(scored.reduce((s, b) => s + (b.latestScore ?? 0), 0) / scored.length)
        : 0,
      lastUpdated: scored.length
        ? scored.reduce((latest, b) =>
            (b.scannedAt ?? "") > (latest ?? "") ? b.scannedAt : latest,
          null as string | null)
        : null,
    };
  }, [brands]);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ARC Score",
    url: "https://arcscore.com",
    description:
      "The Agent Readiness Index for E-Commerce. We score how well AI shopping agents can navigate and buy from e-commerce sites.",
    sameAs: [],
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />
      <IndexHero onSearch={setSearchQuery} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6">
        <StatsBar
          totalBrands={stats.total}
          avgScore={stats.avgScore}
          lastUpdated={stats.lastUpdated}
        />

        <BrandFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">
            Loading brands...
          </div>
        ) : (
          <BrandTable brands={filtered} />
        )}
      </main>

      <Footer />
    </div>
  );
}
