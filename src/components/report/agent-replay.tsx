"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  SkipForward,
  SkipBack,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import type { JourneyStep, TestResult } from "@/types/report";
import { ReplayCursor } from "./replay-cursor";
import { ThoughtBubble } from "./thought-bubble";
import { FailureOverlay } from "./failure-overlay";
import { JourneyFilmstrip } from "./journey-filmstrip";

gsap.registerPlugin(ScrollTrigger);

interface AgentReplayProps {
  steps: JourneyStep[];
  siteName: string;
  autoPlay?: boolean;
}

const RESULT_CONFIG: Record<TestResult, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pass: { label: "Pass", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  partial: { label: "Partial", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
  fail: { label: "Fail", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

function ResultIcon({ result, size = 14 }: { result: TestResult; size?: number }) {
  switch (result) {
    case "pass":
      return <CheckCircle2 size={size} className="text-emerald-600" />;
    case "partial":
      return <AlertCircle size={size} className="text-amber-600" />;
    case "fail":
      return <XCircle size={size} className="text-red-600" />;
  }
}

/* ── Mobile fallback: timer-based with buttons ─────────────────────────── */
function MobileReplay({ steps, siteName }: { steps: JourneyStep[]; siteName: string }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

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
      {/* Screenshot */}
      <div className="relative bg-gray-900">
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

        {/* Cursor + thought */}
        {step.cursorTarget && (
          <ReplayCursor
            x={step.cursorTarget.x}
            y={step.cursorTarget.y}
            result={step.result}
            wander={step.result === "fail"}
            stepKey={currentStep}
          />
        )}

        {step.thought && step.cursorTarget && (
          <ThoughtBubble
            text={step.thought}
            result={step.result}
            cursorX={step.cursorTarget.x}
            stepKey={currentStep}
          />
        )}

        {step.result === "fail" && step.cursorTarget && (
          <FailureOverlay
            cursorX={step.cursorTarget.x}
            cursorY={step.cursorTarget.y}
            gaps={step.humanAgentGaps}
            stepKey={currentStep}
          />
        )}
      </div>

      {/* Narration */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
            {step.stepNumber}
          </span>
          <span className="text-sm font-semibold text-foreground">{step.action}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${rc.bg} ${rc.text} ${rc.border} border`}>
            <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
            {rc.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{step.narration}</p>
        {step.duration && step.duration > 0 && (
          <p className="text-[11px] text-gray-400 mt-2 tabular-nums">
            {(step.duration / 1000).toFixed(1)}s
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-3">
        <button onClick={prevStep} className="p-2 rounded-md hover:bg-gray-100 text-gray-400">
          <SkipBack size={16} />
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button onClick={nextStep} className="p-2 rounded-md hover:bg-gray-100 text-gray-400">
          <SkipForward size={16} />
        </button>
        <span className="text-xs text-gray-400 tabular-nums ml-auto">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      <JourneyFilmstrip steps={steps} onStepClick={setCurrentStep} />
    </div>
  );
}

/* ── Desktop: scroll-driven GSAP replay ────────────────────────────────── */
export function AgentReplay({ steps, siteName }: AgentReplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const stepRef = useRef(0);

  // Detect mobile + reduced motion
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsMobile(window.innerWidth < 1024);
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload next screenshot
  useEffect(() => {
    const nextIdx = currentStep + 1;
    if (nextIdx < steps.length && steps[nextIdx].screenshotUrl) {
      const img = new Image();
      img.src = steps[nextIdx].screenshotUrl!;
    }
  }, [currentStep, steps]);

  // GSAP ScrollTrigger
  useEffect(() => {
    if (isMobile || reducedMotion || typeof window === "undefined") return;
    const container = containerRef.current;
    const pin = pinRef.current;
    if (!container || !pin) return;

    // Small delay to ensure DOM is ready
    const rafId = requestAnimationFrame(() => {
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: container,
          start: "top top",
          end: `+=${steps.length * 100}vh`,
          pin: pin,
          scrub: 0.3,
          snap: {
            snapTo: 1 / (steps.length - 1),
            duration: { min: 0.2, max: 0.5 },
            ease: "power2.inOut",
          },
          onUpdate: (self) => {
            const progress = self.progress;
            const newStep = Math.min(
              Math.floor(progress * steps.length),
              steps.length - 1
            );
            if (newStep !== stepRef.current) {
              stepRef.current = newStep;
              setCurrentStep(newStep);
            }
          },
        });
      }, container);

      ScrollTrigger.refresh();

      // Store ctx for cleanup
      (container as HTMLDivElement & { _gsapCtx?: gsap.Context })._gsapCtx = ctx;
    });

    return () => {
      cancelAnimationFrame(rafId);
      const ctx = (container as HTMLDivElement & { _gsapCtx?: gsap.Context })._gsapCtx;
      if (ctx) ctx.revert();
    };
  }, [isMobile, reducedMotion, steps.length]);

  // Filmstrip click: scroll to step position
  const scrollToStep = useCallback(
    (stepIndex: number) => {
      if (isMobile || reducedMotion) {
        setCurrentStep(stepIndex);
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const containerTop = container.getBoundingClientRect().top + window.scrollY;
      const totalScroll = steps.length * window.innerHeight;
      const targetScroll = containerTop + (stepIndex / steps.length) * totalScroll;
      window.scrollTo({ top: targetScroll, behavior: "smooth" });
    },
    [isMobile, reducedMotion, steps.length]
  );

  // Mobile / reduced motion fallback
  if (isMobile || reducedMotion) {
    return <MobileReplay steps={steps} siteName={siteName} />;
  }

  const step = steps[currentStep];
  const rc = RESULT_CONFIG[step.result];

  return (
    <div ref={containerRef}>
      <div
        ref={pinRef}
        className="rounded-xl border border-gray-200 overflow-hidden bg-white"
        style={{ willChange: "transform" }}
      >
        <div className="relative">
          {/* Screenshot — full width */}
          <div className="relative bg-gray-900" style={{ minHeight: "50vh" }}>
            {step.screenshotUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={step.screenshotUrl}
                alt={`Step ${step.stepNumber}: ${step.action}`}
                className="w-full h-auto block"
                style={{ maxHeight: "70vh", objectFit: "contain" }}
              />
            ) : (
              <div className="aspect-video flex items-center justify-center text-gray-500 text-sm">
                No screenshot available
              </div>
            )}

            {/* Cursor */}
            {step.cursorTarget && (
              <ReplayCursor
                x={step.cursorTarget.x}
                y={step.cursorTarget.y}
                result={step.result}
                wander={step.result === "fail"}
                stepKey={currentStep}
              />
            )}

            {/* Thought bubble */}
            {step.thought && step.cursorTarget && (
              <ThoughtBubble
                text={step.thought}
                result={step.result}
                cursorX={step.cursorTarget.x}
                stepKey={currentStep}
              />
            )}

            {/* Failure overlay */}
            {step.result === "fail" && step.cursorTarget && (
              <FailureOverlay
                cursorX={step.cursorTarget.x}
                cursorY={step.cursorTarget.y}
                gaps={step.humanAgentGaps}
                stepKey={currentStep}
              />
            )}

            {/* Narration panel — overlaid on right */}
            <div className="absolute top-4 right-4 w-[320px] z-30">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                {/* Step header */}
                <div className="px-4 pt-4 pb-3 border-b border-gray-100">
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

                {/* Narration text */}
                <div className="px-4 py-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.narration}
                  </p>
                  {step.duration && step.duration > 0 && (
                    <p className="text-[11px] text-gray-400 mt-2 tabular-nums">
                      {(step.duration / 1000).toFixed(1)}s
                    </p>
                  )}
                </div>

                {/* Step dots */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-1.5">
                    {steps.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => scrollToStep(i)}
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

                {/* Progress indicator */}
                <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400 tabular-nums data-num">
                    {currentStep + 1} / {steps.length}
                  </span>
                  <ResultIcon result={step.result} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll hint (only on first step) */}
        {currentStep === 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 animate-bounce">
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <span className="text-[10px] spec-label uppercase tracking-widest">Scroll to replay</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M19 12l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Filmstrip after last step */}
      {currentStep === steps.length - 1 && (
        <JourneyFilmstrip steps={steps} onStepClick={scrollToStep} />
      )}
    </div>
  );
}
