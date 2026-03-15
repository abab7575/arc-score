/**
 * Shared Image Frame — Every image tells a complete story
 *
 * Formula:
 * 1. WHO WE ARE (one-liner at top)
 * 2. THE INSIGHT (headline + data)
 * 3. WHY IT MATTERS (callout at bottom)
 * 4. BRANDING (Robot Shopper footer)
 */

import React from "react";

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

export function getReadiness(score: number): string {
  if (score >= 85) return "Agent-Ready";
  if (score >= 70) return "Mostly Ready";
  if (score >= 50) return "Needs Work";
  if (score >= 30) return "Poor";
  return "Not Ready";
}

// ── Image Frame ──────────────────────────────────────────────

export function ImageFrame({
  children,
  whyItMatters,
}: {
  children: React.ReactNode;
  whyItMatters?: string;
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
      {/* Top color strip */}
      <div style={{ display: "flex", height: 5, width: "100%" }}>
        <div style={{ flex: 1, backgroundColor: COLORS.coral, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.mustard, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.cobalt, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.violet, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.emerald, display: "flex" }} />
      </div>

      {/* Context bar — WHO WE ARE */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 48px", backgroundColor: COLORS.white, borderBottom: `1px solid ${COLORS.lightGray}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, backgroundColor: COLORS.coral }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color: COLORS.white }}>RS</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.navy }}>Robot Shopper</span>
          <span style={{ fontSize: 11, color: COLORS.gray }}>|</span>
          <span style={{ fontSize: 11, color: COLORS.gray }}>We send AI bots to shop real websites and score what breaks</span>
        </div>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: COLORS.gray, letterSpacing: "0.05em" }}>robotshopper.com</span>
      </div>

      {/* Content area */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "24px 48px 16px" }}>
        {children}
      </div>

      {/* WHY IT MATTERS callout */}
      {whyItMatters && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 48px", backgroundColor: COLORS.navy }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: COLORS.coral, borderRadius: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 14, color: COLORS.white, fontWeight: 800 }}>!</span>
          </div>
          <span style={{ fontSize: 13, color: COLORS.cream, fontWeight: 500, lineHeight: 1.4 }}>
            {whyItMatters}
          </span>
        </div>
      )}

      {/* Bottom bar — if no whyItMatters */}
      {!whyItMatters && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "10px 48px", backgroundColor: COLORS.navy }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
            See how your site scores at robotshopper.com
          </span>
        </div>
      )}
    </div>
  );
}

// ── Reusable Components ──────────────────────────────────────

export function ScoreBar({ score, width = 300, height = 14 }: { score: number; width?: number; height?: number }) {
  const fillWidth = Math.round((score / 100) * width);
  return (
    <div style={{ display: "flex", width, height, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: fillWidth, height, backgroundColor: getScoreColor(score), borderRadius: 4, display: "flex" }} />
    </div>
  );
}

export function GradeBadge({ grade, size = "md" }: { grade: string; size?: "sm" | "md" | "lg" }) {
  const color = getScoreColor(grade === "A" ? 90 : grade === "B" ? 75 : grade === "C" ? 55 : grade === "D" ? 35 : 15);
  const dims = size === "lg" ? 48 : size === "md" ? 32 : 22;
  const fontSize = size === "lg" ? 24 : size === "md" ? 16 : 11;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: dims, height: dims, backgroundColor: color, borderRadius: 4, fontFamily: "JetBrains Mono", fontSize, fontWeight: 700, color: COLORS.white }}>
      {grade}
    </div>
  );
}
