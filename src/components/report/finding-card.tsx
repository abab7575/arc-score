"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, AlertTriangle, AlertCircle, Info } from "lucide-react";
import type { Finding } from "@/types/report";
import { SEVERITY_CONFIG, CATEGORY_CONFIG } from "@/lib/constants";
import { CodeBlock } from "./code-block";
import { InfoTooltip, EXPLAINERS } from "@/components/ui/info-tooltip";

interface FindingCardProps {
  finding: Finding;
}

const SEVERITY_ICONS = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: AlertCircle,
  low: Info,
};

const IMPACT_LABELS = {
  blocked: { label: "Blocked", className: "text-red-600 bg-red-50", tooltip: EXPLAINERS.blocked },
  degraded: { label: "Degraded", className: "text-amber-600 bg-amber-50", tooltip: EXPLAINERS.degraded },
  "fallback-available": { label: "Fallback", className: "text-indigo-600 bg-indigo-50", tooltip: EXPLAINERS.fallback },
};

export function FindingCard({ finding }: FindingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const severity = SEVERITY_CONFIG[finding.severity];
  const category = CATEGORY_CONFIG[finding.category];
  const Icon = SEVERITY_ICONS[finding.severity];

  return (
    <div
      className="rounded-xl bg-white border border-gray-200 shadow-sm overflow-hidden"
      style={{ borderLeftColor: severity.color, borderLeftWidth: 4 }}
    >
      {/* Collapsed header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-start gap-4 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon size={18} style={{ color: severity.color }} className="mt-0.5 shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{finding.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ color: severity.color, backgroundColor: severity.bgColor }}
            >
              {severity.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {category?.name}
            </span>
            <InfoTooltip content={EXPLAINERS.effort} size="sm">
              <span className="text-[10px] text-muted-foreground">
                Effort: {finding.effort}
              </span>
            </InfoTooltip>
            <InfoTooltip content={EXPLAINERS.pointsGain} size="sm">
              <span className="text-[10px] text-emerald-600">
                +{finding.estimatedPointsGain} pts
              </span>
            </InfoTooltip>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 mt-1"
        >
          <ChevronDown size={16} className="text-muted-foreground" />
        </motion.div>
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-5 border-t border-gray-200 pt-4">
              {/* What happened */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  What Happened
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {finding.whatHappened}
                </p>
              </div>

              {/* Why it matters */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Why It Matters
                </h4>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {finding.whyItMatters}
                </p>
              </div>

              {/* Affected agents */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Affected Agents
                </h4>
                <div className="space-y-1.5">
                  {(finding.affectedAgents ?? []).map((agent) => {
                    const impact = IMPACT_LABELS[agent.impact];
                    return (
                      <div key={agent.name} className="flex items-center gap-2">
                        <InfoTooltip content={impact.tooltip} size="sm">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${impact.className}`}>
                            {impact.label}
                          </span>
                        </InfoTooltip>
                        <span className="text-xs text-gray-700">
                          {agent.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* The fix */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  The Fix
                </h4>
                <p className="text-sm text-foreground/80 mb-3">
                  {finding.fix.summary}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  {finding.fix.technicalDetail}
                </p>
                {finding.fix.codeSnippet && (
                  <CodeBlock code={finding.fix.codeSnippet} />
                )}
                <p className="text-xs text-muted-foreground mt-3">
                  Estimated effort: {finding.fix.effortEstimate}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
