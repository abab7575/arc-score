/**
 * Scorecard — "We sent AI bots to shop [Brand]. Here's what happened."
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
  const worst = categories.length > 0 ? categories.reduce((a, b) => a.score < b.score ? a : b) : null;

  return (
    <ImageFrame whyItMatters={`When AI agents can't shop your site, you lose sales you'll never see in analytics. ${data.score >= 70 ? `${data.brandName} is ahead of most — but there's still room to improve.` : `${data.brandName} is losing AI-driven customers right now.`}`}>
      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* Left — the story */}
        <div style={{ display: "flex", flexDirection: "column", width: 420, gap: 12 }}>
          {/* Headline */}
          <span style={{ fontSize: 26, fontWeight: 900, color: COLORS.navy, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
            We sent 5 AI bots to shop {data.brandName}.{" "}
            <span style={{ color }}>{data.score >= 70 ? "Most of them succeeded." : data.score >= 50 ? "Some of them got stuck." : "Most of them failed."}</span>
          </span>

          {/* Score hero */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", backgroundColor: COLORS.white, borderRadius: 12, border: `2px solid ${color}30` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, border: `3px solid ${color}`, borderRadius: 8 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 40, fontWeight: 700, color }}>{data.score}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GradeBadge grade={grade} size="md" />
                <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy }}>{readiness}</span>
              </div>
              <span style={{ fontSize: 12, color: COLORS.gray }}>out of 100 — scored across 7 categories</span>
              {data.delta !== undefined && data.delta !== 0 && (
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: data.delta > 0 ? COLORS.emerald : COLORS.red }}>
                  {data.delta > 0 ? "+" : ""}{data.delta} since last scan
                </span>
              )}
            </div>
          </div>

          {/* Worst category callout */}
          {worst && worst.score < 70 && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", backgroundColor: getScoreColor(worst.score) + "10", borderRadius: 8, borderLeft: `4px solid ${getScoreColor(worst.score)}` }}>
              <span style={{ fontSize: 13, color: COLORS.navy }}>
                <span style={{ fontWeight: 700 }}>Biggest gap:</span> {worst.name} scored just {worst.score}/100
              </span>
            </div>
          )}
        </div>

        {/* Right — category breakdown */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, fontWeight: 700, color: COLORS.gray, letterSpacing: "0.1em", marginBottom: 6 }}>WHERE AI AGENTS SUCCEED AND FAIL</span>
          {categories.map((cat) => (
            <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", backgroundColor: COLORS.white, borderRadius: 6, border: `1px solid ${COLORS.lightGray}` }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.navy, width: 150, display: "flex" }}>{cat.name}</span>
              <ScoreBar score={cat.score} width={220} height={10} />
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: getScoreColor(cat.score), width: 32, display: "flex", justifyContent: "flex-end" }}>{cat.score}</span>
              <GradeBadge grade={cat.grade || getGradeForScore(cat.score)} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </ImageFrame>
  );
}
