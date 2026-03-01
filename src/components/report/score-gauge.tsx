"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { getGrade, getGradeColor, getGradeLabel } from "@/lib/scoring";

interface ScoreGaugeProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animated?: boolean;
  delay?: number;
}

export function ScoreGauge({
  score,
  size = 240,
  strokeWidth = 12,
  animated = true,
  delay = 0.3,
}: ScoreGaugeProps) {
  const [hasAnimated, setHasAnimated] = useState(!animated);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const grade = getGrade(score);
  const gradeColor = getGradeColor(grade);
  const gradeLabel = getGradeLabel(grade);

  const motionScore = useMotionValue(0);
  const displayScore = useTransform(motionScore, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(score);
      return;
    }
    const timeout = setTimeout(() => {
      setHasAnimated(true);
      const controls = animate(motionScore, score, {
        duration: 1.5,
        ease: "easeOut",
      });
      const unsubscribe = displayScore.on("change", (v) => setDisplayValue(v));
      return () => {
        controls.stop();
        unsubscribe();
      };
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [score, animated, delay, motionScore, displayScore]);

  const progress = hasAnimated ? score / 100 : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth={strokeWidth}
        />

        {/* Score arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{
            duration: animated ? 1.5 : 0,
            delay: animated ? delay : 0,
            ease: "easeOut",
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-7xl font-bold tabular-nums tracking-tight"
          style={{ color: gradeColor }}
        >
          {displayValue}
        </span>
        <span className="text-lg text-muted-foreground font-medium -mt-1">/100</span>
        <motion.span
          className="text-2xl font-bold mt-1"
          style={{ color: gradeColor }}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: animated ? delay + 1.5 : 0, duration: 0.4 }}
        >
          {grade}
        </motion.span>
        <motion.span
          className="text-sm text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: animated ? delay + 1.8 : 0, duration: 0.4 }}
        >
          {gradeLabel}
        </motion.span>
      </div>
    </div>
  );
}
