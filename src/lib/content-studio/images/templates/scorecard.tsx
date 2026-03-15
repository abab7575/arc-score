/**
 * Scorecard — Journey-style: We sent bots → Here's what happened → Score
 */

import React from "react";
import { ImageFrame, ScoreBar, COLORS, getScoreColor, getGradeForScore, getReadiness } from "./shared";

export interface ScorecardData {
  brandName: string;
  score: number;
  grade: string;
  delta?: number;
  categories: { name: string; score: number; grade: string }[];
  verdict?: string;
}

export function ScorecardImage({ data }: { data: ScorecardData }) {
  const categories = (data.categories || []).slice(0, 7);
  const color = getScoreColor(data.score);
  const readiness = getReadiness(data.score);

  // Find best and worst categories for the story
  const sorted = [...categories].sort((a, b) => a.score - b.score);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];

  return (
    <ImageFrame>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 0 }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral }}>
              AI Agent Readiness Report
            </span>
            <span style={{ fontSize: 28, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              We sent 5 AI shopping bots to {data.brandName}
            </span>
          </div>
          {/* Score circle */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 36, border: `4px solid ${color}`, backgroundColor: color + "10" }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 30, fontWeight: 700, color }}>{data.score}</span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color }}>{readiness}</span>
          </div>
        </div>

        {/* 3-column journey */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {/* Col 1: What we tested */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.lightGray}`, padding: "18px", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: COLORS.cobalt, borderRadius: 6 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: COLORS.white }}>1</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy }}>What we tested</span>
            </div>
            <span style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.5 }}>
              5 AI bots tried to browse, find products, add to cart, and checkout on {data.brandName}.
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: "auto" }}>
              {categories.slice(0, 4).map((cat) => (
                <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: getScoreColor(cat.score), flexShrink: 0, display: "flex" }} />
                  <span style={{ fontSize: 13, color: COLORS.navy }}>{cat.name}</span>
                </div>
              ))}
              {categories.length > 4 && (
                <span style={{ fontSize: 12, color: COLORS.gray }}>+{categories.length - 4} more</span>
              )}
            </div>
          </div>

          {/* Col 2: What happened */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.lightGray}`, padding: "18px", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: COLORS.coral, borderRadius: 6 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: COLORS.white }}>2</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy }}>What happened</span>
            </div>
            {best && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", backgroundColor: COLORS.emerald + "08", borderRadius: 8, borderLeft: `3px solid ${COLORS.emerald}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.emerald }}>Best: {best.name}</span>
                <span style={{ fontSize: 14, color: COLORS.navy }}>Scored {best.score}/100</span>
              </div>
            )}
            {worst && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", backgroundColor: getScoreColor(worst.score) + "08", borderRadius: 8, borderLeft: `3px solid ${getScoreColor(worst.score)}` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(worst.score) }}>Worst: {worst.name}</span>
                <span style={{ fontSize: 14, color: COLORS.navy }}>Scored {worst.score}/100</span>
              </div>
            )}
            <span style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.5, marginTop: "auto" }}>
              {data.score >= 70
                ? "Most bots completed the shopping journey."
                : data.score >= 50
                  ? "Bots hit friction at several points."
                  : "Most bots couldn't complete a purchase."
              }
            </span>
          </div>

          {/* Col 3: Full breakdown */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: color + "06", borderRadius: 16, border: `2px solid ${color}20`, padding: "18px", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: color, borderRadius: 6 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: COLORS.white }}>3</span>
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy }}>Full breakdown</span>
            </div>
            {categories.map((cat) => (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: COLORS.navy, width: 110, display: "flex" }}>{cat.name}</span>
                <ScoreBar score={cat.score} width={100} height={10} />
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: getScoreColor(cat.score), width: 28, display: "flex", justifyContent: "flex-end" }}>{cat.score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
