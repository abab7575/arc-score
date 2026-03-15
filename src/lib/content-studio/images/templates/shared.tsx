/**
 * Shared Image Frame — Scroll-stopping social infographics
 *
 * The hook is the CONCEPT, not the data.
 * The data is the PROOF, not the headline.
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
        backgroundColor: COLORS.navy,
        position: "relative",
        overflow: "hidden",
        fontFamily: "Inter",
      }}
    >
      {/* Subtle gradient mesh */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "radial-gradient(ellipse at 20% 50%, rgba(2,89,221,0.12) 0%, transparent 60%), radial-gradient(ellipse at 85% 30%, rgba(124,58,237,0.08) 0%, transparent 50%)",
          display: "flex",
        }}
      />

      {/* Top color strip */}
      <div style={{ display: "flex", height: 5, width: "100%", flexShrink: 0, position: "relative" }}>
        <div style={{ flex: 1, backgroundColor: COLORS.coral, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.mustard, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.cobalt, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.violet, display: "flex" }} />
        <div style={{ flex: 1, backgroundColor: COLORS.emerald, display: "flex" }} />
      </div>

      {/* Content */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "32px 52px 24px", position: "relative" }}>
        {children}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 52px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, backgroundColor: COLORS.coral }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color: COLORS.white }}>RS</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.cream }}>Robot Shopper</span>
        </div>
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: "rgba(255,248,240,0.35)", letterSpacing: "0.03em" }}>robotshopper.com</span>
      </div>
    </div>
  );
}

// ── Score Pill ──────────────────────────────────────────────

export function ScorePill({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color = getScoreColor(score);
  const dims = size === "lg" ? { w: 72, h: 72, fs: 32 } : size === "md" ? { w: 48, h: 48, fs: 22 } : { w: 32, h: 32, fs: 14 };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: dims.w, height: dims.h, backgroundColor: color, borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: dims.fs, fontWeight: 700, color: COLORS.white }}>
      {score}
    </div>
  );
}

// ── Score Bar ──────────────────────────────────────────────

export function ScoreBar({ score, width = 300, height = 14 }: { score: number; width?: number; height?: number }) {
  const fillWidth = Math.round((score / 100) * width);
  return (
    <div style={{ display: "flex", width, height, backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: fillWidth, height, backgroundColor: getScoreColor(score), borderRadius: 4, display: "flex" }} />
    </div>
  );
}
