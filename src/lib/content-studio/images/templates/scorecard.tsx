/**
 * Scorecard — The hook is "We sent AI bots shopping. Here's what happened."
 * The brand score is the proof.
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
      <div style={{ display: "flex", flex: 1, gap: 48 }}>
        {/* Left — The hook + brand hero */}
        <div style={{ display: "flex", flexDirection: "column", flex: 3, justifyContent: "center", gap: 20 }}>
          {/* THE HOOK */}
          <span style={{ fontSize: 38, fontWeight: 900, color: COLORS.cream, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            We sent 5 AI shopping bots to {data.brandName}.
          </span>

          <span style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1.3 }}>
            {data.score >= 70
              ? "Most of them could browse, find products, and reach checkout."
              : data.score >= 50
                ? "Some of them got stuck. Key parts of the shopping journey broke."
                : "Most of them failed. This site isn't ready for AI shoppers."
            }
          </span>

          {/* Score + readiness */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, border: `3px solid ${color}`, borderRadius: 10 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 40, fontWeight: 700, color }}>{data.score}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 800, color }}>{readiness}</span>
              <span style={{ fontSize: 14, color: "rgba(255,248,240,0.4)" }}>out of 100 — 7 categories tested</span>
              {data.delta !== undefined && data.delta !== 0 && (
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: data.delta > 0 ? COLORS.emerald : COLORS.red }}>
                  {data.delta > 0 ? "+" : ""}{data.delta} since last scan
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right — Category bars */}
        <div style={{ display: "flex", flexDirection: "column", flex: 2, justifyContent: "center", gap: 8 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: "rgba(255,248,240,0.35)", letterSpacing: "0.08em", marginBottom: 4 }}>
            WHERE BOTS SUCCEED & FAIL
          </span>
          {categories.map((cat) => (
            <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.cream, width: 140, display: "flex" }}>{cat.name}</span>
              <ScoreBar score={cat.score} width={140} height={10} />
              <ScorePill score={cat.score} size="sm" />
            </div>
          ))}
        </div>
      </div>
    </ImageFrame>
  );
}
