"use client";

import { useState, useEffect } from "react";
import type { TestResult } from "@/types/report";

interface ThoughtBubbleProps {
  text: string;
  result: TestResult;
  /** Cursor X position as percentage — bubble flips when cursor is in right 40% */
  cursorX: number;
  /** Unique key to restart typewriter */
  stepKey: number;
}

const BORDER_COLORS: Record<TestResult, string> = {
  pass: "border-emerald-300",
  partial: "border-amber-300",
  fail: "border-red-300",
};

const TEXT_COLORS: Record<TestResult, string> = {
  pass: "text-emerald-700",
  partial: "text-amber-700",
  fail: "text-red-700",
};

const LABEL_COLORS: Record<TestResult, string> = {
  pass: "text-emerald-500",
  partial: "text-amber-500",
  fail: "text-red-500",
};

export function ThoughtBubble({ text, result, cursorX, stepKey }: ThoughtBubbleProps) {
  const [charIdx, setCharIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setCharIdx(0);
    setDone(false);
  }, [stepKey, text]);

  useEffect(() => {
    if (charIdx >= text.length) {
      setDone(true);
      return;
    }
    const timer = setInterval(() => {
      setCharIdx((prev) => {
        if (prev >= text.length) {
          clearInterval(timer);
          setDone(true);
          return prev;
        }
        return prev + 1;
      });
    }, 30);
    return () => clearInterval(timer);
  }, [text, stepKey, charIdx >= text.length ? "done" : "typing"]);

  // Position: above-right of cursor, flip left when cursor is in right 40%
  const flipLeft = cursorX > 60;

  return (
    <div
      className={`absolute z-30 max-w-[200px] ${flipLeft ? "right-[42%]" : "left-[62%]"}`}
      style={{ top: "8%" }}
    >
      <div
        className={`bg-white/95 backdrop-blur-sm border ${BORDER_COLORS[result]} rounded-lg px-3 py-2 text-[10px] leading-relaxed shadow-sm`}
      >
        <span className={`${LABEL_COLORS[result]} font-semibold mr-1`}>
          Agent:
        </span>
        <span className={TEXT_COLORS[result]}>
          {text.substring(0, charIdx)}
          {!done && <span className="typewriter-cursor" />}
        </span>
      </div>
    </div>
  );
}
