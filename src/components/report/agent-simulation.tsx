"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Bot,
  Lightbulb,
} from "lucide-react";
import type { JourneyStep, TestResult, HumanAgentGap } from "@/types/report";

interface AgentSimulationProps {
  steps: JourneyStep[];
  siteName: string;
  autoPlay?: boolean;
  compact?: boolean;
}

const RESULT_CONFIG = {
  pass: {
    label: "Pass",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  partial: {
    label: "Partial",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  fail: {
    label: "Fail",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    dot: "bg-red-500",
  },
};

function ResultIcon({ result, size = 16 }: { result: TestResult; size?: number }) {
  switch (result) {
    case "pass":
      return <CheckCircle2 size={size} className="text-emerald-600" />;
    case "partial":
      return <AlertCircle size={size} className="text-amber-600" />;
    case "fail":
      return <XCircle size={size} className="text-red-600" />;
  }
}

export function AgentSimulation({
  steps,
  siteName,
  autoPlay = false,
}: AgentSimulationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  }, [steps.length]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  }, [steps.length]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(nextStep, 4000);
    return () => clearInterval(interval);
  }, [isPlaying, nextStep]);

  const step = steps[currentStep];
  const rc = RESULT_CONFIG[step.result];

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Side-by-side: screenshot left, narration right */}
      <div className="flex flex-col lg:flex-row">
        {/* Left: Screenshot */}
        <div className="lg:w-[62%] flex-shrink-0 bg-gray-900 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {step.screenshotUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={step.screenshotUrl}
                  alt={`Step ${step.stepNumber}: ${step.action}`}
                  className="w-full h-auto block"
                />
              ) : (
                <div className="aspect-video flex items-center justify-center text-gray-500 text-sm">
                  No screenshot available
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Narration panel */}
        <div className="lg:w-[38%] flex flex-col border-t lg:border-t-0 lg:border-l border-gray-200">
          {/* Step header */}
          <div className="px-5 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {step.stepNumber}
              </span>
              <span className="text-sm font-semibold text-foreground">
                {step.action}
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text} ${rc.border} border`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
              {rc.label}
            </span>
          </div>

          {/* Narration + Gap Callout */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="px-5 py-4 flex-1 overflow-y-auto"
            >
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.narration}
              </p>

              {/* Human vs Agent Gap Callout */}
              {step.humanAgentGaps && step.humanAgentGaps.length > 0 && (
                <div className="mt-4 rounded-lg border-2 border-amber-300 bg-amber-50/80 overflow-hidden">
                  <div className="px-3 py-2 bg-amber-100/80 border-b border-amber-200 flex items-center gap-2">
                    <Eye size={14} className="text-amber-700" />
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                      Human vs Agent Gap
                    </span>
                  </div>
                  <div className="p-3 space-y-3">
                    {step.humanAgentGaps.map((gap: HumanAgentGap, i: number) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-start gap-2">
                          <Eye size={13} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-emerald-800 leading-relaxed">
                            <span className="font-semibold">What a human sees:</span>{" "}
                            {gap.what}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Bot size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-red-800 leading-relaxed">
                            <span className="font-semibold">Why the agent can&apos;t:</span>{" "}
                            {gap.why}
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <Lightbulb size={13} className="text-amber-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-amber-800 leading-relaxed">
                            <span className="font-semibold">Fix:</span>{" "}
                            {gap.recommendation}
                          </p>
                        </div>
                        {i < step.humanAgentGaps!.length - 1 && (
                          <div className="border-t border-amber-200 pt-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step.thought && !step.humanAgentGaps?.length && (
                <div className="mt-3 px-3 py-2 rounded-md bg-cyan-50 border border-cyan-100">
                  <p className="text-xs text-cyan-700 leading-relaxed">
                    <span className="font-semibold">Agent thinking:</span>{" "}
                    {step.thought}
                  </p>
                </div>
              )}
              {step.duration && step.duration > 0 && (
                <p className="text-[11px] text-gray-400 mt-3 tabular-nums">
                  {(step.duration / 1000).toFixed(1)}s
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Step dots - quick nav */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-1.5">
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentStep(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentStep
                      ? "w-6 bg-indigo-600"
                      : `w-2 ${
                          s.result === "pass"
                            ? "bg-emerald-300 hover:bg-emerald-400"
                            : s.result === "partial"
                              ? "bg-amber-300 hover:bg-amber-400"
                              : "bg-red-300 hover:bg-red-400"
                        }`
                  }`}
                  title={`Step ${s.stepNumber}: ${s.action}`}
                />
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              <button
                onClick={prevStep}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <SkipBack size={14} />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button
                onClick={nextStep}
                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <SkipForward size={14} />
              </button>
            </div>
            <span className="text-xs text-gray-400 tabular-nums">
              {currentStep + 1} / {steps.length}
            </span>
            <div className="ml-auto">
              <ResultIcon result={step.result} size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
