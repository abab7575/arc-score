/**
 * Shared Image Frame
 *
 * RULES:
 * 1. LIGHT cream background — matches the website
 * 2. robotshopper.com must be BIG and prominent
 * 3. No text under 14px
 * 4. CTA to visit the site must be obvious
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

      {/* CTA Footer — BIG and clear */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 48px",
          backgroundColor: COLORS.navy,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, backgroundColor: COLORS.coral, borderRadius: 4 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: COLORS.white }}>RS</span>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: COLORS.white }}>Robot Shopper</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 16, color: "rgba(255,248,240,0.6)" }}>Check your site&apos;s score →</span>
          <div style={{ display: "flex", alignItems: "center", padding: "8px 20px", backgroundColor: COLORS.coral, borderRadius: 6 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: COLORS.white, letterSpacing: "0.02em" }}>robotshopper.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ScorePill({ score, size = "md" }: { score: number; size?: "sm" | "md" | "lg" }) {
  const color = getScoreColor(score);
  const dims = size === "lg" ? { w: 72, h: 72, fs: 32 } : size === "md" ? { w: 48, h: 48, fs: 22 } : { w: 36, h: 36, fs: 16 };
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: dims.w, height: dims.h, backgroundColor: color, borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: dims.fs, fontWeight: 700, color: COLORS.white }}>
      {score}
    </div>
  );
}

export function ScoreBar({ score, width = 300, height = 16 }: { score: number; width?: number; height?: number }) {
  const fillWidth = Math.round((score / 100) * width);
  return (
    <div style={{ display: "flex", width, height, backgroundColor: COLORS.lightGray, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ width: fillWidth, height, backgroundColor: getScoreColor(score), borderRadius: 6, display: "flex" }} />
    </div>
  );
}
