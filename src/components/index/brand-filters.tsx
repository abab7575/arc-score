"use client";

import { Search } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS, type BrandCategory } from "@/lib/brands";

export type SortOption = "score" | "delta" | "alpha";

interface BrandFiltersProps {
  selectedCategory: BrandCategory | "all";
  onCategoryChange: (category: BrandCategory | "all") => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery?: string;
  onSearch?: (query: string) => void;
}

const categories: (BrandCategory | "all")[] = [
  "all", "fashion", "electronics", "home", "beauty", "grocery", "general", "dtc", "luxury", "sports",
];

export function BrandFilters({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  searchQuery = "",
  onSearch,
}: BrandFiltersProps) {
  return (
    <div className="space-y-3 py-4">
      {/* Search bar */}
      {onSearch && (
        <div className="relative group">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0A1628]/25 group-focus-within:text-[#FF6648] transition-colors"
          />
          <input
            type="text"
            placeholder="Search brands..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-[#E8E0D8] bg-white text-sm text-[#0A1628] placeholder:text-[#0A1628]/30 focus:outline-none focus:border-[#FF6648] focus:shadow-[0_0_0_3px_rgba(255,102,72,0.08)] transition-all"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isActive = cat === selectedCategory;
            const colors = cat !== "all" ? CATEGORY_COLORS[cat] : null;

            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? cat === "all"
                      ? "bg-[#0A1628] text-white"
                      : `${colors!.bg} ${colors!.text} border ${colors!.border}`
                    : "bg-white text-muted-foreground hover:text-foreground border border-[#E8E0D8] hover:border-[#0259DD]/30"
                }`}
              >
                {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="spec-label text-muted-foreground text-[9px]">SORT BY</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="text-xs font-bold border border-[#E8E0D8] px-3 py-1.5 text-foreground bg-white focus:outline-none focus:border-[#0259DD] font-mono uppercase"
          >
            <option value="score">Score</option>
            <option value="delta">Change</option>
            <option value="alpha">A-Z</option>
          </select>
        </div>
      </div>
    </div>
  );
}
