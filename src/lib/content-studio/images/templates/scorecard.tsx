/**
 * Scorecard Image — Brand score breakdown as infographic
 *
 * At a glance: "This brand scored X. Here's where it's strong and weak."
 */

import React from "react";
import { ImageFrame, ScoreBar, GradeBadge, Tag, COLORS, getScoreColor, getGradeForScore } from "./shared";

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

  return (
    <ImageFrame>
      <div style={{ display: "flex", gap: 48, flex: 1 }}>
        {/* Left column — Hero score */}
        <div style={{ display: "flex", flexDirection: "column", width: 380, gap: 16 }}>
          <Tag label="AI Agent Readiness Report" />

          <span style={{ fontFamily: "Inter", fontSize: 36, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {data.brandName}
          </span>

          {/* Big score */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 100, height: 100, border: `4px solid ${color}`, borderRadius: 8 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 48, fontWeight: 700, color }}>{data.score}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <GradeBadge grade={grade} size="lg" />
              {data.delta !== undefined && data.delta !== 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: data.delta > 0 ? COLORS.emerald : COLORS.red }}>
                    {data.delta > 0 ? "+" : ""}{data.delta}
                  </span>
                  <span style={{ fontSize: 11, color: COLORS.gray }}>vs last scan</span>
                </div>
              )}
            </div>
          </div>

          {/* Verdict */}
          <div style={{ display: "flex", marginTop: 8, padding: "12px 16px", backgroundColor: COLORS.lightGray, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
            <span style={{ fontSize: 13, color: COLORS.navy, lineHeight: 1.5 }}>
              {data.verdict || (data.score >= 70 ? "This site is ready for AI shopping agents. Most agents can browse, find products, and reach checkout." : data.score >= 50 ? "This site has friction points for AI agents. Some shopping journeys fail or require workarounds." : "AI agents struggle on this site. Key shopping flows are broken or inaccessible.")}
            </span>
          </div>

          {/* What we tested */}
          <span style={{ fontSize: 11, color: COLORS.gray, marginTop: 4 }}>
            We sent 5 AI agents to shop this site — a browser bot, data parser, accessibility crawler, vision AI, and feed checker.
          </span>
        </div>

        {/* Right column — Category breakdown */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: COLORS.gray, letterSpacing: "0.1em", marginBottom: 8 }}>
            CATEGORY BREAKDOWN
          </span>

          {categories.map((cat) => {
            const catColor = getScoreColor(cat.score);
            return (
              <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", backgroundColor: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.lightGray}` }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.navy, width: 160, display: "flex" }}>{cat.name}</span>
                <ScoreBar score={cat.score} width={240} height={12} />
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: catColor, width: 36, textAlign: "right", display: "flex", justifyContent: "flex-end" }}>{cat.score}</span>
                <GradeBadge grade={cat.grade || getGradeForScore(cat.score)} size="sm" />
              </div>
            );
          })}
        </div>
      </div>
    </ImageFrame>
  );
}
