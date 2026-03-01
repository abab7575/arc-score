"use client";

import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import type { ActionItem } from "@/types/report";
import { SEVERITY_CONFIG } from "@/lib/constants";

interface ActionPlanProps {
  actions: ActionItem[];
  currentScore: number;
  estimatedScoreAfterFixes: number;
}

export function ActionPlan({
  actions,
  currentScore,
  estimatedScoreAfterFixes,
}: ActionPlanProps) {
  const quickWins = actions.filter((a) => a.isQuickWin);
  const allSorted = [...actions].sort((a, b) => a.severity === "critical" ? -1 : b.severity === "critical" ? 1 : 0);

  return (
    <section className="py-12">
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Action Plan
      </h2>
      <p className="text-sm text-muted-foreground mb-8">
        Prioritized fixes ranked by impact and effort.
      </p>

      {/* Score projection */}
      <div className="card-soft rounded-xl p-6 mb-8">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-amber-600 tabular-nums">
              {currentScore}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Current</p>
          </div>
          <ArrowRight size={24} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600 tabular-nums">
              {estimatedScoreAfterFixes}
            </p>
            <p className="text-xs text-muted-foreground mt-1">After Fixes</p>
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-4">
          Fix the top 3 issues to jump from{" "}
          <span className="text-amber-600 font-semibold">{currentScore}</span>{" "}
          to an estimated{" "}
          <span className="text-emerald-600 font-semibold">
            {estimatedScoreAfterFixes}
          </span>
        </p>
      </div>

      {/* Quick wins callout */}
      {quickWins.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={16} className="text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">
              Quick Wins
            </h3>
            <span className="text-xs text-muted-foreground">
              High impact, low effort
            </span>
          </div>
          <div className="space-y-2">
            {quickWins.map((action, i) => (
              <motion.div
                key={action.findingId}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-amber-50 border border-amber-100"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <Zap size={14} className="text-amber-600 shrink-0" />
                  <span className="text-sm text-foreground">{action.title}</span>
                </div>
                <span className="text-xs text-emerald-600 font-medium shrink-0">
                  +{action.estimatedPointsGain} pts
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Full action table */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                #
              </th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Finding
              </th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Severity
              </th>
              <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Effort
              </th>
              <th className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">
                Impact
              </th>
            </tr>
          </thead>
          <tbody>
            {allSorted.map((action, i) => {
              const sev = SEVERITY_CONFIG[action.severity];
              return (
                <tr
                  key={action.findingId}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {action.title}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded"
                      style={{ color: sev.color, backgroundColor: sev.bgColor }}
                    >
                      {sev.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground capitalize">
                    {action.effort}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-emerald-600 font-medium tabular-nums">
                    +{action.estimatedPointsGain} pts
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
