"use client";

import { motion } from "framer-motion";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { JourneyStep, TestResult } from "@/types/report";

function ResultBadge({ result }: { result: TestResult }) {
  switch (result) {
    case "pass":
      return (
        <div className="flex items-center gap-1.5 text-emerald-600">
          <CheckCircle2 size={14} />
          <span className="text-xs font-medium">Pass</span>
        </div>
      );
    case "partial":
      return (
        <div className="flex items-center gap-1.5 text-amber-600">
          <AlertCircle size={14} />
          <span className="text-xs font-medium">Partial</span>
        </div>
      );
    case "fail":
      return (
        <div className="flex items-center gap-1.5 text-red-600">
          <XCircle size={14} />
          <span className="text-xs font-medium">Fail</span>
        </div>
      );
  }
}

function dotColor(result: TestResult) {
  switch (result) {
    case "pass":
      return "bg-emerald-600";
    case "partial":
      return "bg-amber-600";
    case "fail":
      return "bg-red-600";
  }
}

interface JourneyTimelineProps {
  steps: JourneyStep[];
}

export function JourneyTimeline({ steps }: JourneyTimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-4 bottom-4 w-px bg-gray-200" />

      <div className="space-y-1">
        {steps.map((step, i) => (
          <motion.div
            key={step.stepNumber}
            className="relative pl-10 py-3"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-[10px] top-[22px] w-[11px] h-[11px] rounded-full border-2 border-white z-10 ${dotColor(
                step.result
              )}`}
            />

            <div className="card-soft rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  Step {step.stepNumber}
                </span>
                <div className="flex items-center gap-3">
                  {step.duration && (
                    <span className="text-xs text-gray-400 tabular-nums">
                      {(step.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                  <ResultBadge result={step.result} />
                </div>
              </div>

              <p className="text-sm font-medium text-foreground mb-2">
                {step.action}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.narration}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
