/**
 * Shared Image Frame — Light-themed infographic style
 *
 * Cream background, bold brand colors, fun & funky Robot Shopper vibe.
 * Every image should tell the whole story at a glance.
 */

import React from "react";

// ── Brand Colors ──────────────────────────────────────────────────

export const COLORS = {
  navy: "#0A1628",
  cream: "#FFF8F0",
  cobalt: "#0259DD",
  coral: "#FF6648",
  mustard: "#FBBA16",
  violet: "#7C3AED",
  white: "#FFFFFF",
  gray: "#64748B",
  lightGray: "#F1EDE8",
  emerald: "#059669",
  red: "#dc2626",
  orange: "#ea580c",
  amber: "#d97706",
} as const;

export function getScoreColor(score: number): string {
  if (score >= 85) return COLORS.emerald;
  if (score >= 70) return COLORS.cobalt;
  if (score >= 50) return COLORS.amber;
  if (score >= 30) return COLORS.orange;
  return COLORS.red;
}

export function getGradeForScore(score: number): string {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

// ── Image Frame Wrapper ──────────────────────────────────────────

export function ImageFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: 1200,
        height: 675,
        display: "flex",
        flexDirection: "column",
        backgroundColor: COLORS.cream,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter",
      }}
    >
      {/* Top color strip — cassette tape edge */}
      <div style={{ display: "flex", height: 6, width: "100%" }}>
        <div style={{ flex: 1, backgroundColor: COLORS.coral, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.mustard, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.cobalt, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.violet, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.emerald, display: "flex" }} />
      </div>

      {/* Content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "32px 48px 20px",
          position: "relative",
        }}
      >
        {children}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 48px",
          backgroundColor: COLORS.navy,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Logo mark */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              backgroundColor: COLORS.coral,
            }}
          >
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.white,
              }}
            >
              RS
            </span>
          </div>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 14,
              fontWeight: 900,
              color: COLORS.white,
              letterSpacing: "-0.02em",
            }}
          >
            Robot Shopper
          </span>
        </div>
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.05em",
          }}
        >
          robotshopper.com
        </span>
      </div>
    </div>
  );
}

// ── Reusable Components ──────────────────────────────────────────

export function ScoreBar({
  score,
  width = 300,
  height = 14,
}: {
  score: number;
  width?: number;
  height?: number;
}) {
  const fillWidth = Math.round((score / 100) * width);
  const color = getScoreColor(score);

  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        backgroundColor: COLORS.lightGray,
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: fillWidth,
          height,
          backgroundColor: color,
          borderRadius: 4,
          display: "flex",
        }}
      />
    </div>
  );
}

export function GradeBadge({
  grade,
  size = "md",
}: {
  grade: string;
  size?: "sm" | "md" | "lg";
}) {
  const color = getScoreColor(
    grade === "A" ? 90 : grade === "B" ? 75 : grade === "C" ? 55 : grade === "D" ? 35 : 15
  );

  const dims = size === "lg" ? 56 : size === "md" ? 36 : 24;
  const fontSize = size === "lg" ? 28 : size === "md" ? 18 : 12;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: dims,
        height: dims,
        backgroundColor: color,
        borderRadius: 4,
        fontFamily: "JetBrains Mono",
        fontSize,
        fontWeight: 700,
        color: COLORS.white,
      }}
    >
      {grade}
    </div>
  );
}

export function Tag({
  label,
  color = COLORS.coral,
}: {
  label: string;
  color?: string;
}) {
  return (
    <span
      style={{
        display: "flex",
        fontFamily: "JetBrains Mono",
        fontSize: 11,
        fontWeight: 700,
        color,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        backgroundColor: color + "15",
        padding: "4px 10px",
        borderRadius: 4,
      }}
    >
      {label}
    </span>
  );
}
