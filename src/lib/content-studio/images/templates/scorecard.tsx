/**
 * Scorecard — Light theme, concept-first, big readable text, clear CTA
 */

import React from "react";
import { ImageFrame, ScoreBar, ScorePill, COLORS, getScoreColor, getGradeForScore, getReadiness } from "./shared";

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

  return (
    <ImageFrame>
      <div style={{ display: "flex", flex: 1, gap: 40 }}>
        {/* Left — The story */}
        <div style={{ display: "flex", flexDirection: "column", flex: 3, justifyContent: "center", gap: 16 }}>
          {/* Context */}
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.02em" }}>
            AI Agent Readiness Report
          </span>

          {/* THE HOOK */}
          <span style={{ fontSize: 36, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            We sent 5 AI shopping bots to {data.brandName}.
          </span>

          {/* Result */}
          <span style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.3 }}>
            {data.score >= 70
              ? "Most of them could browse, find products, and reach checkout."
              : data.score >= 50
                ? "Some of them got stuck along the way."
                : "Most of them couldn't complete the shopping journey."
            }
          </span>

          {/* Score + readiness */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", backgroundColor: COLORS.white, borderRadius: 14, border: `2px solid ${color}25` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, border: `4px solid ${color}`, borderRadius: 12 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 42, fontWeight: 700, color }}>{data.score}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color }}>{readiness}</span>
              <span style={{ fontSize: 15, color: COLORS.gray }}>out of 100</span>
              {data.delta !== undefined && data.delta !== 0 && (
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: data.delta > 0 ? COLORS.emerald : COLORS.red }}>
                  {data.delta > 0 ? "+" : ""}{data.delta} since last scan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right — Category bars */}
        <div style={{ display: "flex", flexDirection: "column", flex: 2, justifyContent: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.gray, letterSpacing: "0.04em", marginBottom: 4 }}>
            Where bots succeed and fail
          </span>
          {categories.map((cat) => (
            <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", backgroundColor: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.lightGray}` }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, width: 140, display: "flex" }}>{cat.name}</span>
              <ScoreBar score={cat.score} width={140} height={12} />
              <ScorePill score={cat.score} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </ImageFrame>
  );
}
