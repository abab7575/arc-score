"use client";

import type { CategoryScore } from "@/types/report";
import { CategoryBar } from "./category-bar";
import { CalloutCard } from "./callout-card";
import { InfoTooltip, EXPLAINERS } from "@/components/ui/info-tooltip";

interface ScoreBreakdownProps {
  categories: CategoryScore[];
}

export function ScoreBreakdown({ categories }: ScoreBreakdownProps) {
  const sorted = [...categories].sort((a, b) => b.score - a.score);
  const bestCategory = sorted[0];
  const worstCategory = sorted[sorted.length - 1];

  return (
    <section className="py-12">
      <h2 className="text-xl font-semibold text-foreground mb-1">
        Score Breakdown
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        <InfoTooltip content={EXPLAINERS.arcScore}>
          How this site performs across each area that AI shopping agents depend on. Each category is weighted by its importance to agent commerce.
        </InfoTooltip>
      </p>

      <div className="divide-y divide-gray-200">
        {categories.map((cat, i) => (
          <CategoryBar key={cat.id} category={cat} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <CalloutCard type="win" category={bestCategory} delay={3.2} />
        <CalloutCard type="risk" category={worstCategory} delay={3.4} />
      </div>
    </section>
  );
}
