/**
 * Scorecard Image Template — Brand score + grade + 7 category bars
 */

import React from "react";
import { ImageFrame, ScoreBar, GradeBadge, COLORS } from "./shared";

export interface ScorecardData {
  brandName: string;
  overallScore: number;
  grade: string;
  categories: { name: string; score: number; grade: string }[];
  delta?: number | null;
}

export function ScorecardImage({ data }: { data: ScorecardData }) {
  const deltaStr =
    data.delta != null
      ? data.delta > 0
        ? `+${data.delta}`
        : `${data.delta}`
      : null;

  return (
    <ImageFrame label="Brand Scorecard">
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 24 }}>
        {/* Hero row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <GradeBadge grade={data.grade} size="lg" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: 36,
                fontWeight: 900,
                color: COLORS.cream,
                lineHeight: 1.1,
              }}
            >
              {data.brandName}
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 4 }}>
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 48,
                  fontWeight: 700,
                  color: COLORS.white,
                  lineHeight: 1,
                }}
              >
                {data.overallScore}
              </span>
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 20,
                  fontWeight: 700,
                  color: COLORS.gray,
                }}
              >
                / 100
              </span>
              {deltaStr && (
                <span
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: 18,
                    fontWeight: 700,
                    color: data.delta! > 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {deltaStr}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {data.categories.map((cat) => (
            <div
              key={cat.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  color: COLORS.gray,
                  width: 200,
                  textAlign: "right",
                }}
              >
                {cat.name}
              </span>
              <ScoreBar score={cat.score} width={600} height={16} />
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.white,
                  width: 40,
                  textAlign: "right",
                }}
              >
                {cat.score}
              </span>
              <GradeBadge grade={cat.grade} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </ImageFrame>
  );
}
