"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import type { TestResult } from "@/types/report";

interface ReplayCursorProps {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  result: TestResult;
  /** When true, cursor wanders before settling (fail steps) */
  wander?: boolean;
  /** Unique key to trigger re-animation */
  stepKey: number;
}

const RIPPLE_COLORS: Record<TestResult, string> = {
  pass: "#10b981",   // emerald-500
  partial: "#f59e0b", // amber-500
  fail: "#ef4444",    // red-500
};

const MOVE_DURATION: Record<TestResult, number> = {
  pass: 0.4,
  partial: 0.6,
  fail: 1.0,
};

export function ReplayCursor({ x, y, result, wander, stepKey }: ReplayCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const ripple = rippleRef.current;
    if (!cursor || !ripple) return;

    const tl = gsap.timeline();

    if (wander && result === "fail") {
      // Wandering path: overshoot, drift, settle
      tl.to(cursor, {
        left: `${x + 8}%`,
        top: `${y - 5}%`,
        duration: 0.3,
        ease: "power2.out",
      })
        .to(cursor, {
          left: `${x - 6}%`,
          top: `${y + 3}%`,
          duration: 0.25,
          ease: "power1.inOut",
        })
        .to(cursor, {
          left: `${x + 2}%`,
          top: `${y - 2}%`,
          duration: 0.2,
          ease: "power1.inOut",
        })
        .to(cursor, {
          left: `${x}%`,
          top: `${y}%`,
          duration: 0.25,
          ease: "power2.inOut",
        });
    } else {
      tl.to(cursor, {
        left: `${x}%`,
        top: `${y}%`,
        duration: MOVE_DURATION[result],
        ease: "power2.out",
      });
    }

    // Ripple after cursor arrives
    tl.fromTo(
      ripple,
      { scale: 0, opacity: 0.8 },
      { scale: 2.5, opacity: 0, duration: 0.7, ease: "power2.out" }
    );

    return () => {
      tl.kill();
    };
  }, [x, y, result, wander, stepKey]);

  return (
    <div
      ref={cursorRef}
      className="absolute pointer-events-none z-20"
      style={{ left: `${x}%`, top: `${y}%`, willChange: "transform" }}
    >
      {/* Cursor arrow */}
      <svg
        width="14"
        height="18"
        viewBox="0 0 16 20"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M1 1L1 15L5.5 11L10 18L13 16.5L8.5 9.5L14 8.5L1 1Z"
          fill="#4f46e5"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>

      {/* Ripple */}
      <div
        ref={rippleRef}
        className="absolute top-0 left-0 w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{
          borderColor: RIPPLE_COLORS[result],
          opacity: 0,
        }}
      />
    </div>
  );
}
