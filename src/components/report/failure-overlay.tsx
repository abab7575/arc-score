"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { Eye, Bot, Lightbulb } from "lucide-react";
import type { HumanAgentGap } from "@/types/report";

interface FailureOverlayProps {
  cursorX: number; // percentage
  cursorY: number; // percentage
  gaps?: HumanAgentGap[];
  stepKey: number;
}

export function FailureOverlay({ cursorX, cursorY, gaps, stepKey }: FailureOverlayProps) {
  const stuckRef = useRef<HTMLDivElement>(null);
  const gapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stuck = stuckRef.current;
    const gap = gapRef.current;
    if (!stuck) return;

    const tl = gsap.timeline();
    tl.from(stuck, {
      scale: 2,
      opacity: 0,
      duration: 0.5,
      ease: "back.out(2)",
    });

    if (gap) {
      tl.from(gap, {
        y: 40,
        opacity: 0,
        duration: 0.4,
        ease: "power3.out",
      }, "-=0.1");
    }

    return () => { tl.kill(); };
  }, [stepKey]);

  return (
    <>
      {/* Vignette spotlight */}
      <div
        className="replay-vignette"
        style={{
          "--cursor-x": `${cursorX}%`,
          "--cursor-y": `${cursorY}%`,
        } as React.CSSProperties}
      />

      {/* STUCK label */}
      <div
        ref={stuckRef}
        className="absolute z-20 pointer-events-none"
        style={{ left: `${cursorX}%`, top: `${Math.max(cursorY - 12, 4)}%`, transform: "translateX(-50%)" }}
      >
        <span
          className="glitch-text font-mono text-lg font-black text-red-500 tracking-widest"
          data-text="STUCK"
        >
          STUCK
        </span>
      </div>

      {/* Human vs Agent Gap panel */}
      {gaps && gaps.length > 0 && (
        <div
          ref={gapRef}
          className="absolute bottom-3 right-3 z-25 max-w-[280px]"
        >
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50/95 backdrop-blur-sm overflow-hidden shadow-lg">
            <div className="px-3 py-2 bg-amber-100/80 border-b border-amber-200 flex items-center gap-2">
              <Eye size={14} className="text-amber-700" />
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                Human vs Agent Gap
              </span>
            </div>
            <div className="p-3 space-y-3">
              {gaps.map((gap, i) => (
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
                  {i < gaps.length - 1 && (
                    <div className="border-t border-amber-200 pt-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
