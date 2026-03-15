/**
 * Shared Image Frame — Bold, punchy social media infographics
 *
 * Rules:
 * - No tiny text. Minimum 14px for anything readable.
 * - Fill the space. No dead zones.
 * - Hook → Data → CTA. Every image.
 * - Must be readable at phone-in-feed size (small thumbnail).
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

export function ImageFrame({ children }: { children: React.ReactNode }) {
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
      <div style={{ display: "flex", height: 6, width: "100%", flexShrink: 0 }}>
        <div style={{ flex: 1, backgroundColor: COLORS.coral, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.mustard, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.cobalt, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.violet, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.emerald, display: "flex" }} />
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "28px 48px 0" }}>
        {children}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 48px",
          backgroundColor: COLORS.navy,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, backgroundColor: COLORS.coral }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: COLORS.white }}>RS</span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.white }}>Robot Shopper</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>We test if AI agents can shop your site</span>
        </div>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em" }}>robotshopper.com</span>
      </div>
    </div>
  );
}

// ── Score Bar ──────────────────────────────────────────────

export function ScoreBar({ score, width = 300, height = 16 }: { score: number; width?: number; height?: number }) {
  const fillWidth = Math.round((score / 100) * width);
  return (
    <div style={{ display: "flex", width, height, backgroundColor: COLORS.lightGray, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: fillWidth, height, backgroundColor: getScoreColor(score), borderRadius: 4, display: "flex" }} />
    </div>
  );
}

// ── Grade Badge ──────────────────────────────────────────────

export function GradeBadge({ grade, size = "md" }: { grade: string; size?: "sm" | "md" | "lg" }) {
  const color = getScoreColor(grade === "A" ? 90 : grade === "B" ? 75 : grade === "C" ? 55 : grade === "D" ? 35 : 15);
  const dims = size === "lg" ? 52 : size === "md" ? 36 : 26;
  const fontSize = size === "lg" ? 26 : size === "md" ? 18 : 13;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: dims, height: dims, backgroundColor: color, borderRadius: 6, fontFamily: "JetBrains Mono", fontSize, fontWeight: 700, color: COLORS.white }}>
      {grade}
    </div>
  );
}
