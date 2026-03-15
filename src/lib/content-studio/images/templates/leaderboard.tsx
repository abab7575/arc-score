/**
 * Leaderboard — Bold ranked list with clear context
 */

import React from "react";
import { ImageFrame, ScoreBar, GradeBadge, COLORS, getScoreColor } from "./shared";

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
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.08em" }}>
            AI AGENT READINESS RANKINGS
          </span>
          <span style={{ fontSize: 30, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {data.title}
          </span>
          <span style={{ fontSize: 15, color: COLORS.gray }}>
            Which sites can AI shopping bots actually buy from?
          </span>
        </div>
        {data.totalTracked && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 20px", backgroundColor: COLORS.cobalt + "10", borderRadius: 10, flexShrink: 0 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 28, fontWeight: 700, color: COLORS.cobalt }}>{data.totalTracked}</span>
            <span style={{ fontSize: 11, color: COLORS.cobalt, fontWeight: 600 }}>brands tracked</span>
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
            padding: i === 0 ? "12px 16px" : "8px 16px",
            backgroundColor: i === 0 ? COLORS.coral + "08" : COLORS.white,
            borderRadius: 10,
            border: i === 0 ? `2px solid ${COLORS.coral}30` : `1px solid ${COLORS.lightGray}`,
          }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 24 : 16, fontWeight: 700, color: i < 3 ? COLORS.coral : COLORS.gray, width: 32, display: "flex", justifyContent: "flex-end" }}>{i + 1}</span>
            <span style={{ fontSize: i === 0 ? 20 : 15, fontWeight: i === 0 ? 800 : 600, color: COLORS.navy, width: 180, display: "flex" }}>{brand.name}</span>
            <ScoreBar score={brand.score} width={380} height={i === 0 ? 18 : 12} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 22 : 15, fontWeight: 700, color: getScoreColor(brand.score), width: 44, display: "flex", justifyContent: "flex-end" }}>{brand.score}</span>
            <GradeBadge grade={brand.grade} size={i === 0 ? "md" : "sm"} />
          </div>
        ))}
      </div>
    </ImageFrame>
  );
}
