/**
 * Leaderboard — Light theme, clear context, big readable text
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
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.02em" }}>
            AI Agent Readiness Rankings
          </span>
          <span style={{ fontSize: 30, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
            {data.title}
          </span>
          <span style={{ fontSize: 16, color: COLORS.gray }}>
            Ranked by how well AI shopping bots can buy from each site
          </span>
        </div>
        {data.totalTracked && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", backgroundColor: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.lightGray}`, flexShrink: 0 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 28, fontWeight: 700, color: COLORS.cobalt }}>{data.totalTracked}</span>
            <span style={{ fontSize: 14, color: COLORS.gray, fontWeight: 600 }}>sites tracked</span>
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
            backgroundColor: i === 0 ? COLORS.coral + "08" : COLORS.white,
            borderRadius: 10,
            border: i === 0 ? `2px solid ${COLORS.coral}25` : `1px solid ${COLORS.lightGray}`,
          }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 22 : 16, fontWeight: 700, color: i < 3 ? COLORS.coral : COLORS.gray, width: 30, display: "flex", justifyContent: "flex-end" }}>{i + 1}</span>
            <span style={{ fontSize: i === 0 ? 20 : 16, fontWeight: i === 0 ? 800 : 600, color: COLORS.navy, width: 180, display: "flex" }}>{brand.name}</span>
            <ScoreBar score={brand.score} width={380} height={i === 0 ? 18 : 12} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 22 : 16, fontWeight: 700, color: getScoreColor(brand.score), width: 40, display: "flex", justifyContent: "flex-end" }}>{brand.score}</span>
            <ScorePill score={brand.score} size={i === 0 ? "md" : "sm"} />
          </div>
        ))}
      </div>
    </ImageFrame>
  );
}
