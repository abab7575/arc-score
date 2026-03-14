/**
 * Mover Alert Image Template — Score delta with big arrow + before/after
 */

import React from "react";
import { ImageFrame, GradeBadge, COLORS } from "./shared";

export interface MoverAlertData {
  brandName: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  grade: string;
  topChanges?: { category: string; delta: number }[];
}

export function MoverAlertImage({ data }: { data: MoverAlertData }) {
  const isUp = data.delta > 0;
  const arrowColor = isUp ? "#059669" : "#dc2626";

  return (
    <ImageFrame label="Score Alert">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* Brand name */}
        <span
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: COLORS.cream,
          }}
        >
          {data.brandName}
        </span>

        {/* Score delta display */}
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          {/* Before */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.gray,
                marginBottom: 4,
              }}
            >
              BEFORE
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 64,
                fontWeight: 700,
                color: "rgba(255, 255, 255, 0.4)",
                lineHeight: 1,
              }}
            >
              {data.previousScore}
            </span>
          </div>

          {/* Arrow + delta */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <span
              style={{
                fontSize: 60,
                color: arrowColor,
                lineHeight: 1,
              }}
            >
              {isUp ? "↑" : "↓"}
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 28,
                fontWeight: 700,
                color: arrowColor,
              }}
            >
              {isUp ? "+" : ""}{data.delta}
            </span>
          </div>

          {/* After */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.gray,
                marginBottom: 4,
              }}
            >
              AFTER
            </span>
            <span
              style={{
                fontFamily: "JetBrains Mono",
                fontSize: 64,
                fontWeight: 700,
                color: COLORS.white,
                lineHeight: 1,
              }}
            >
              {data.currentScore}
            </span>
          </div>

          {/* Grade */}
          <GradeBadge grade={data.grade} size="lg" />
        </div>

        {/* Category changes if provided */}
        {data.topChanges && data.topChanges.length > 0 && (
          <div style={{ display: "flex", gap: 24, marginTop: 8 }}>
            {data.topChanges.slice(0, 4).map((change) => (
              <div
                key={change.category}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: 2,
                }}
              >
                <span style={{ fontSize: 13, color: COLORS.gray }}>{change.category}</span>
                <span
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: 13,
                    fontWeight: 700,
                    color: change.delta > 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {change.delta > 0 ? "+" : ""}{change.delta}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ImageFrame>
  );
}
