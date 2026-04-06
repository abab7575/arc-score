"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { EmailCapture } from "@/components/shared/email-capture";
import { IndexHero } from "@/components/index/index-hero";
import type { BrandCategory } from "@/lib/brands";
import { CATEGORY_LABELS } from "@/lib/brands";
import Link from "next/link";
import { Info } from "lucide-react";

function HeaderWithTooltip({ label, tooltip, align }: { label: string; tooltip: string; align: "left" | "center" }) {
  return (
    <th className={`${align === "center" ? "text-center" : "text-left"} px-4 py-2.5 font-semibold text-foreground`}>
      <div className={`inline-flex items-center gap-1.5 group/tip relative ${align === "center" ? "justify-center" : ""}`}>
        {label}
        <Info className="w-3.5 h-3.5 text-muted-foreground/50 group-hover/tip:text-[#0259DD] transition-colors cursor-help" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-[#0A1628] text-white text-xs font-normal leading-relaxed p-3 opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 pointer-events-none group-hover/tip:pointer-events-auto">
          <p className="mb-2">{tooltip}</p>
          <Link href="/landscape" className="text-[#84AFFB] hover:text-white text-[10px] font-semibold uppercase tracking-wider">
            Learn more →
          </Link>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0A1628] rotate-45" />
        </div>
      </div>
    </th>
  );
}

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

interface MatrixStats {
  totalBrands: number;
  scannedBrands: number;
  brandsBlocking: number;
  percentFullyOpen: number;
}

export default function HomePage() {
  const [brands, setBrands] = useState<MatrixBrand[]>([]);
  const [stats, setStats] = useState<MatrixStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BrandCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"alpha" | "blocked" | "platform">("alpha");

  useEffect(() => {
    fetch("/api/matrix")
      .then(res => res.json())
      .then(data => {
        setBrands(data.brands ?? []);
        setStats(data.stats ?? null);
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
    description: "AI agent intelligence for e-commerce. Daily scanning of 1,000+ brands for robots.txt policies, user-agent access, structured data, and platform detection.",
  };

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />
      <IndexHero brandCount={stats?.totalBrands} />

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-2 border-gray-200 bg-white px-5 py-4">
            <div className="text-sm font-black text-[#FF6648] font-mono mb-2">/ 01</div>
            <div className="text-sm font-bold text-foreground mb-1">We scan 1,000+ brands daily</div>
            <div className="text-xs text-muted-foreground leading-relaxed">robots.txt policies, real HTTP agent access tests, structured data, platform detection, and protocol files like llms.txt.</div>
          </div>
          <div className="border-2 border-gray-200 bg-white px-5 py-4">
            <div className="text-sm font-black text-[#FF6648] font-mono mb-2">/ 02</div>
            <div className="text-sm font-bold text-foreground mb-1">Changes are confirmed and published</div>
            <div className="text-xs text-muted-foreground leading-relaxed">Every signal change is verified across two consecutive scans before appearing in the changelog. No false positives.</div>
          </div>
          <div className="border-2 border-gray-200 bg-white px-5 py-4">
            <div className="text-sm font-black text-[#FF6648] font-mono mb-2">/ 03</div>
            <div className="text-sm font-bold text-foreground mb-1">You get alerts when things move</div>
            <div className="text-xs text-muted-foreground leading-relaxed">Pro subscribers track specific brands and get daily email alerts. Everyone else gets the free weekly digest.</div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats bar */}
        {stats && (
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div>
              <span className="data-num text-lg font-bold text-foreground">{stats.totalBrands}</span>
              <span className="text-muted-foreground ml-1.5">brands tracked</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div>
              <span className="data-num text-lg font-bold text-[#059669]">{stats.percentFullyOpen}%</span>
              <span className="text-muted-foreground ml-1.5">fully open to AI</span>
            </div>
            <div className="w-px h-5 bg-border" />
            <div>
              <span className="data-num text-lg font-bold text-[#FF6648]">{stats.brandsBlocking}</span>
              <span className="text-muted-foreground ml-1.5">blocking agents</span>
            </div>
          </div>
        )}

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
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} brand{filtered.length !== 1 ? "s" : ""}
          </span>
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
                  <HeaderWithTooltip
                    label="Platform"
                    tooltip="The e-commerce platform powering the site (Shopify, Magento, Salesforce Commerce Cloud, etc). Detected from response headers and page source."
                    align="left"
                  />
                  <HeaderWithTooltip
                    label="Agents Blocked"
                    tooltip="How many of the 8 major AI shopping agents (GPTBot, ClaudeBot, PerplexityBot, etc) are blocked via robots.txt or HTTP response. 0/8 = fully open to AI agents."
                    align="center"
                  />
                  <HeaderWithTooltip
                    label="Structured Data"
                    tooltip="Machine-readable product data on the site. LD = JSON-LD schema markup. OG = Open Graph tags. Feed = product feed (Google Shopping, Shopify JSON). Agents need this to understand products."
                    align="center"
                  />
                  <HeaderWithTooltip
                    label="CDN / WAF"
                    tooltip="Content Delivery Network and Web Application Firewall protecting the site. WAFs like DataDome or PerimeterX can block AI agents even if robots.txt allows them."
                    align="left"
                  />
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
                        <span className={`data-num font-bold ${
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

        <div className="mt-12 max-w-lg mx-auto">
          <EmailCapture
            source="homepage"
            heading="Get the weekly digest"
            subtext="One email per week with the biggest agent access changes across 1,000+ brands."
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
