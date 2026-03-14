/**
 * Shared Image Frame — NASA x Tokyo x 1970s retro
 *
 * Navy background, gradient mesh overlay, scan lines, coral stripe, watermark.
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
  gray: "#94A3B8",
} as const;

// ── Image Frame Wrapper ──────────────────────────────────────────

export function ImageFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label?: string;
}) {
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
      {/* Gradient mesh overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(ellipse at 20% 50%, rgba(2, 89, 221, 0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)`,
          display: "flex",
        }}
      />

      {/* Coral cassette stripe at top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: COLORS.coral,
          display: "flex",
        }}
      />

      {/* Content area */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "32px 48px 24px",
          position: "relative",
        }}
      >
        {/* Top label */}
        {label && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.coral,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {label}
            </span>
          </div>
        )}

        {children}
      </div>

      {/* Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 24,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: "JetBrains Mono",
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(255, 255, 255, 0.3)",
            letterSpacing: "0.15em",
          }}
        >
          ARC SCORE
        </span>
      </div>

      {/* Bottom cobalt accent line */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: COLORS.cobalt,
          opacity: 0.5,
          display: "flex",
        }}
      />
    </div>
  );
}

// ── Reusable Components ──────────────────────────────────────────

export function ScoreBar({
  score,
  width = 300,
  height = 12,
}: {
  score: number;
  width?: number;
  height?: number;
}) {
  const fillWidth = Math.round((score / 100) * width);
  const color =
    score >= 85
      ? "#059669"
      : score >= 70
      ? COLORS.cobalt
      : score >= 50
      ? "#d97706"
      : score >= 30
      ? "#ea580c"
      : "#dc2626";

  return (
    <div
      style={{
        display: "flex",
        width,
        height,
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: fillWidth,
          height,
          backgroundColor: color,
          borderRadius: 2,
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
  const color =
    grade === "A"
      ? "#059669"
      : grade === "B"
      ? COLORS.cobalt
      : grade === "C"
      ? "#d97706"
      : grade === "D"
      ? "#ea580c"
      : "#dc2626";

  const dims = size === "lg" ? 56 : size === "md" ? 40 : 28;
  const fontSize = size === "lg" ? 28 : size === "md" ? 20 : 14;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: dims,
        height: dims,
        backgroundColor: color,
        borderRadius: 2,
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
