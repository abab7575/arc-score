"use client";

import { motion } from "framer-motion";
import type { CategoryScore } from "@/types/report";
import { getGradeColor } from "@/lib/scoring";
import { AGENT_CONFIG, CATEGORY_CONFIG } from "@/lib/constants";
import { InfoTooltip } from "@/components/ui/info-tooltip";

interface CategoryBarProps {
  category: CategoryScore;
  index: number;
}

export function CategoryBar({ category, index }: CategoryBarProps) {
  const color = getGradeColor(category.grade);

  return (
    <motion.div
      className="py-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2.4 + index * 0.1, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <InfoTooltip content={CATEGORY_CONFIG[category.id]?.description ?? category.summary}>
            <span className="text-sm font-medium text-foreground">
              {category.name}
            </span>
          </InfoTooltip>
          <span className="text-xs text-muted-foreground" title="Weight — how much this category counts toward the overall score">
            {Math.round(category.weight * 100)}% weight
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums" style={{ color }}>
            {category.score}<span className="text-xs text-muted-foreground font-normal">/100</span>
          </span>
          <span
            className="text-xs font-bold w-5 text-center"
            style={{ color }}
          >
            {category.grade}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${category.score}%` }}
          transition={{
            delay: 2.6 + index * 0.1,
            duration: 0.8,
            ease: "easeOut",
          }}
        />
      </div>

      {/* Summary + Agent badges */}
      <div className="flex items-start justify-between mt-2 gap-4">
        <p className="text-xs text-muted-foreground flex-1">
          {category.summary}
        </p>
        <div className="flex gap-1 shrink-0">
          {category.agentsCovered.map((agent) => (
            <span
              key={agent}
              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-muted-foreground"
            >
              {AGENT_CONFIG[agent]?.name.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
