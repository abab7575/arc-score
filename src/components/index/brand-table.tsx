"use client";

import Link from "next/link";
import { ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS, type BrandCategory } from "@/lib/brands";
import { getGradeColor } from "@/lib/scoring";
import { Sparkline } from "./sparkline";
import type { BrandSummary, Grade } from "@/types/report";

interface BrandTableProps {
  brands: BrandSummary[];
}

// Rank badge colors — top 3 get special treatment
const RANK_COLORS: Record<number, { bg: string; text: string; shadow: string }> = {
  1: { bg: "#FF6648", text: "#ffffff", shadow: "0 0 12px rgba(255,102,72,0.3)" },
  2: { bg: "#0259DD", text: "#ffffff", shadow: "0 0 12px rgba(2,89,221,0.3)" },
  3: { bg: "#FBBA16", text: "#0A1628", shadow: "0 0 12px rgba(251,186,22,0.3)" },
};

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null || delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-gray-400 data-num">
        <Minus size={12} />
        —
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-[#059669] data-num font-bold">
        <TrendingUp size={12} />
        +{delta}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-[#dc2626] data-num font-bold">
      <TrendingDown size={12} />
      {delta}
    </span>
  );
}

export function BrandTable({ brands }: BrandTableProps) {
  if (brands.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground text-sm">
        No brands match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {brands.map((brand, i) => {
        const rank = i + 1;
        const gradeColor = brand.latestGrade
          ? getGradeColor(brand.latestGrade as Grade)
          : "#9ca3af";
        const catColors = CATEGORY_COLORS[brand.category as BrandCategory] ?? {
          bg: "bg-gray-50",
          text: "text-gray-700",
        };
        const rankStyle = RANK_COLORS[rank];
        const score = brand.latestScore ?? 0;

        return (
          <Link
            key={brand.slug}
            href={`/brand/${brand.slug}`}
            className="group block"
          >
            <div
              className="bg-white border border-[#E8E0D8] hover:border-[#0259DD]/30 transition-all relative overflow-hidden"
              style={{
                // Colored left edge — score-proportional
                borderLeftWidth: 4,
                borderLeftColor: gradeColor,
              }}
            >
              <div className="flex items-center gap-0">
                {/* Rank */}
                <div className="w-16 sm:w-20 shrink-0 flex items-center justify-center py-4">
                  {rankStyle ? (
                    <div
                      className="w-10 h-10 flex items-center justify-center"
                      style={{
                        backgroundColor: rankStyle.bg,
                        color: rankStyle.text,
                        boxShadow: rankStyle.shadow,
                      }}
                    >
                      <span className="data-num text-lg font-black">{rank}</span>
                    </div>
                  ) : (
                    <span className="data-num text-lg font-bold text-[#D8CFC5]">
                      {String(rank).padStart(2, "0")}
                    </span>
                  )}
                </div>

                {/* Brand info */}
                <div className="flex-1 min-w-0 py-4 pr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-bold text-foreground group-hover:text-[#0259DD] transition-colors truncate">
                      {brand.name}
                    </span>
                    {/* Category pill — cassette label style */}
                    <span
                      className={`hidden sm:inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${catColors.bg} ${catColors.text} border ${catColors.border ?? ""}`}
                    >
                      {CATEGORY_LABELS[brand.category as BrandCategory] ?? brand.category}
                    </span>
                  </div>

                  {/* Score bar — retro segmented */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 max-w-[200px] h-[6px] bg-[#F5F0EB] overflow-hidden relative">
                      <div
                        className="h-full transition-all duration-500"
                        style={{
                          width: `${score}%`,
                          backgroundColor: gradeColor,
                        }}
                      />
                      {/* Segmented overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: "repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(255,248,240,0.5) 3px, rgba(255,248,240,0.5) 4px)",
                        }}
                      />
                    </div>
                    <DeltaBadge delta={brand.delta} />
                  </div>
                </div>

                {/* Sparkline — hidden on mobile */}
                <div className="hidden md:flex items-center justify-center w-24 shrink-0">
                  {brand.scoreHistory.length >= 2 ? (
                    <Sparkline
                      data={brand.scoreHistory.map((h) => h.score)}
                      color={gradeColor}
                    />
                  ) : (
                    <span className="spec-label text-[#D8CFC5]">NO DATA</span>
                  )}
                </div>

                {/* Score + Grade */}
                <div className="w-20 sm:w-24 shrink-0 flex items-center justify-center gap-2 py-4 border-l border-[#F0E8E0]">
                  <div className="text-center">
                    <div className="data-num text-xl font-black" style={{ color: gradeColor }}>
                      {brand.latestScore ?? "—"}
                    </div>
                    <div className="spec-label text-[8px] text-muted-foreground mt-0.5">/100</div>
                  </div>
                  <div
                    className="w-8 h-8 flex items-center justify-center border-2"
                    style={{ borderColor: gradeColor, color: gradeColor }}
                  >
                    <span className="data-num text-xs font-black">
                      {brand.latestGrade ?? "—"}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div className="w-10 shrink-0 flex items-center justify-center">
                  <ChevronRight
                    size={16}
                    className="text-[#D8CFC5] group-hover:text-[#FF6648] group-hover:translate-x-1 transition-all"
                  />
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
