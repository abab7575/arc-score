/**
 * Scorecard — Big, bold brand score report
 */

import React from "react";
import { ImageFrame, ScoreBar, GradeBadge, COLORS, getScoreColor, getGradeForScore, getReadiness } from "./shared";

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
  const grade = data.grade || getGradeForScore(data.score);
  const readiness = getReadiness(data.score);

  return (
    <ImageFrame>
      <div style={{ display: "flex", flex: 1, gap: 40 }}>
        {/* Left — Score hero */}
        <div style={{ display: "flex", flexDirection: "column", width: 400, justifyContent: "center", gap: 16 }}>
          {/* Tag */}
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.08em" }}>
            AI AGENT READINESS REPORT
          </span>

          {/* Brand */}
          <span style={{ fontSize: 42, fontWeight: 900, color: COLORS.navy, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
            {data.brandName}
          </span>

          {/* Score + Grade */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 100, height: 100, border: `4px solid ${color}`, borderRadius: 12 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 50, fontWeight: 700, color }}>{data.score}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GradeBadge grade={grade} size="lg" />
                <span style={{ fontSize: 20, fontWeight: 800, color }}>{readiness}</span>
              </div>
              <span style={{ fontSize: 14, color: COLORS.gray }}>out of 100</span>
              {data.delta !== undefined && data.delta !== 0 && (
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: data.delta > 0 ? COLORS.emerald : COLORS.red }}>
                  {data.delta > 0 ? "+" : ""}{data.delta} since last scan
                </span>
              )}
            </div>
          </div>

          {/* Verdict */}
          <div style={{ padding: "14px 18px", backgroundColor: color + "10", borderRadius: 10, borderLeft: `4px solid ${color}` }}>
            <span style={{ fontSize: 15, color: COLORS.navy, lineHeight: 1.5 }}>
              {data.score >= 70
                ? "AI shopping bots can browse, find products, and reach checkout on this site."
                : data.score >= 50
                  ? "AI bots hit friction on this site — some shopping journeys fail."
                  : "Most AI shopping bots fail on this site. Key flows are broken."
              }
            </span>
          </div>
        </div>

        {/* Right — Category bars */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 8 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: COLORS.gray, letterSpacing: "0.08em", marginBottom: 4 }}>
            BREAKDOWN BY CATEGORY
          </span>
          {categories.map((cat) => (
            <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", backgroundColor: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.lightGray}` }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, width: 170, display: "flex" }}>{cat.name}</span>
              <ScoreBar score={cat.score} width={200} height={14} />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: getScoreColor(cat.score), width: 36, display: "flex", justifyContent: "flex-end" }}>{cat.score}</span>
              <GradeBadge grade={cat.grade || getGradeForScore(cat.score)} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </ImageFrame>
  );
}
