/**
 * Leaderboard — The hook is "Which sites are ready for AI shoppers?"
 * The ranking is the proof.
 */

import React from "react";
import { ImageFrame, ScoreBar, ScorePill, COLORS, getScoreColor } from "./shared";

export interface LeaderboardData {
  title: string;
  subtitle?: string;
  brands: { name: string; score: number; grade: string }[];
  totalTracked?: number;
}

export function LeaderboardImage({ data }: { data: LeaderboardData }) {
  const brands = (data.brands || []).slice(0, 8);

  return (
    <ImageFrame>
      {/* Header — hook + context */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 32, fontWeight: 900, color: COLORS.cream, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            {data.title}
          </span>
          <span style={{ fontSize: 16, color: "rgba(255,248,240,0.45)" }}>
            Ranked by how well AI shopping bots can browse, add to cart, and checkout
          </span>
        </div>
        {data.totalTracked && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, flexShrink: 0, border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 24, fontWeight: 700, color: COLORS.cobalt }}>{data.totalTracked}</span>
            <span style={{ fontSize: 12, color: "rgba(255,248,240,0.4)", fontWeight: 600 }}>sites<br />tracked</span>
          </div>
        )}
      </div>

      {/* Rankings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {brands.map((brand, i) => (
          <div key={brand.name} style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: i === 0 ? "12px 16px" : "7px 16px",
            backgroundColor: i === 0 ? "rgba(255,102,72,0.08)" : "rgba(255,255,255,0.03)",
            borderRadius: 10,
            border: i === 0 ? `1px solid rgba(255,102,72,0.2)` : "1px solid rgba(255,255,255,0.05)",
          }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 22 : 15, fontWeight: 700, color: i < 3 ? COLORS.coral : "rgba(255,248,240,0.3)", width: 30, display: "flex", justifyContent: "flex-end" }}>{i + 1}</span>
            <span style={{ fontSize: i === 0 ? 20 : 15, fontWeight: i === 0 ? 800 : 500, color: COLORS.cream, width: 180, display: "flex" }}>{brand.name}</span>
            <ScoreBar score={brand.score} width={400} height={i === 0 ? 16 : 10} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 20 : 15, fontWeight: 700, color: getScoreColor(brand.score), width: 40, display: "flex", justifyContent: "flex-end" }}>{brand.score}</span>
            <ScorePill score={brand.score} size={i === 0 ? "md" : "sm"} />
          </div>
        ))}
      </div>
    </ImageFrame>
  );
}
