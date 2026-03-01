"use client";

import { useState } from "react";
import type { Finding, Severity, CategoryId } from "@/types/report";
import { SEVERITY_CONFIG, CATEGORY_CONFIG } from "@/lib/constants";
import { FindingCard } from "./finding-card";
import { InfoTooltip, EXPLAINERS } from "@/components/ui/info-tooltip";

interface FindingsSectionProps {
  findings: Finding[];
}

export function FindingsSection({ findings }: FindingsSectionProps) {
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryId | "all">("all");

  const filtered = findings.filter((f) => {
    if (severityFilter !== "all" && f.severity !== severityFilter) return false;
    if (categoryFilter !== "all" && f.category !== categoryFilter) return false;
    return true;
  });

  const severities: (Severity | "all")[] = ["all", "critical", "high", "medium", "low"];
  const categories = Array.from(new Set(findings.map((f) => f.category)));

  return (
    <section className="py-12">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Detailed Findings
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {findings.length} issues found — things that make it harder for AI agents to shop on this site. Click any finding to see what happened, why it matters, and how to fix it. Filter by severity to prioritize.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex flex-wrap gap-1.5">
          {severities.map((sev) => {
            const severityTooltips: Record<string, string> = {
              critical: EXPLAINERS.severityCritical,
              high: EXPLAINERS.severityHigh,
              medium: EXPLAINERS.severityMedium,
              low: EXPLAINERS.severityLow,
            };
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  severityFilter === sev
                    ? "bg-[#0259DD] text-white"
                    : "bg-gray-100 text-muted-foreground hover:text-foreground"
                }`}
                title={sev !== "all" ? severityTooltips[sev] : undefined}
              >
                {sev === "all" ? "All" : SEVERITY_CONFIG[sev].label}
                {sev !== "all" && (
                  <span className="ml-1 opacity-60">
                    ({findings.filter((f) => f.severity === sev).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-gray-200 text-foreground"
                : "bg-gray-100 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-gray-200 text-foreground"
                  : "bg-gray-100 text-muted-foreground hover:text-foreground"
              }`}
            >
              {CATEGORY_CONFIG[cat]?.name}
            </button>
          ))}
        </div>
      </div>

      {/* Finding cards */}
      <div className="space-y-3">
        {filtered.map((finding) => (
          <FindingCard key={finding.id} finding={finding} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No findings match this filter.
        </div>
      )}
    </section>
  );
}
