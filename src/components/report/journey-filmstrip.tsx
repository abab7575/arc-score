"use client";

import { useRef } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { JourneyStep, TestResult } from "@/types/report";

interface JourneyFilmstripProps {
  steps: JourneyStep[];
  onStepClick: (stepIndex: number) => void;
}

const BORDER_COLORS: Record<TestResult, string> = {
  pass: "border-l-emerald-500",
  partial: "border-l-amber-500",
  fail: "border-l-red-500",
};

const BADGE_BG: Record<TestResult, string> = {
  pass: "bg-emerald-500",
  partial: "bg-amber-500",
  fail: "bg-red-500",
};

function ResultIcon({ result }: { result: TestResult }) {
  switch (result) {
    case "pass":
      return <CheckCircle2 size={10} className="text-emerald-600" />;
    case "partial":
      return <AlertCircle size={10} className="text-amber-600" />;
    case "fail":
      return <XCircle size={10} className="text-red-600" />;
  }
}

export function JourneyFilmstrip({ steps, onStepClick }: JourneyFilmstripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const passCount = steps.filter((s) => s.result === "pass").length;
  const firstFail = steps.find((s) => s.result === "fail");
  const summaryText = firstFail
    ? `${passCount}/${steps.length} steps passed. Agent blocked at ${firstFail.action.toLowerCase()}.`
    : `${passCount}/${steps.length} steps passed.`;

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4">
      {/* Summary */}
      <p className="text-xs text-muted-foreground mb-3 spec-label">
        {summaryText}
      </p>

      {/* Horizontal scrollable strip */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin"
      >
        {steps.map((step, i) => (
          <button
            key={i}
            onClick={() => onStepClick(i)}
            className={`flex-shrink-0 w-[160px] rounded-lg border border-gray-200 border-l-4 ${BORDER_COLORS[step.result]} overflow-hidden hover:shadow-md transition-shadow group`}
          >
            {/* Thumbnail */}
            <div className="relative h-[90px] bg-gray-100">
              {step.screenshotUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={step.screenshotUrl}
                  alt={`Step ${step.stepNumber}`}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px]">
                  No screenshot
                </div>
              )}
              {/* Step number badge */}
              <span
                className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-full ${BADGE_BG[step.result]} text-white text-[9px] font-bold flex items-center justify-center`}
              >
                {step.stepNumber}
              </span>
            </div>

            {/* Label */}
            <div className="px-2 py-1.5 flex items-center gap-1.5">
              <ResultIcon result={step.result} />
              <span className="text-[10px] text-foreground truncate group-hover:text-indigo-600 transition-colors">
                {step.action}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
