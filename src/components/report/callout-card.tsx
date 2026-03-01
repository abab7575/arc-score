"use client";

import { motion } from "framer-motion";
import { Trophy, AlertTriangle } from "lucide-react";
import type { CategoryScore } from "@/types/report";
import { getGradeColor } from "@/lib/scoring";

interface CalloutCardProps {
  type: "win" | "risk";
  category: CategoryScore;
  delay?: number;
}

export function CalloutCard({ type, category, delay = 3.2 }: CalloutCardProps) {
  const isWin = type === "win";
  const color = getGradeColor(category.grade);
  const Icon = isWin ? Trophy : AlertTriangle;

  return (
    <motion.div
      className="card-soft rounded-xl p-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={16} style={{ color }} />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {isWin ? "Biggest Win" : "Biggest Risk"}
        </span>
      </div>
      <p className="text-sm font-semibold text-foreground">{category.name}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-lg font-bold tabular-nums" style={{ color }}>
          {category.score}
        </span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{category.summary}</p>
    </motion.div>
  );
}
