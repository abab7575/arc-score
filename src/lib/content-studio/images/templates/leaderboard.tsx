/**
 * Leaderboard — "Which brands are ready for AI shoppers? We ranked them."
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
  const topScore = brands[0]?.score ?? 0;
  const bottomScore = brands[brands.length - 1]?.score ?? 0;

  return (
    <ImageFrame whyItMatters={`AI agents are becoming the new shoppers. The brands that rank highest here are the ones AI can actually buy from. The rest are losing sales they'll never know about.`}>
      {/* Headline */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            {data.title}
          </span>
          <span style={{ fontSize: 13, color: COLORS.gray }}>
            Ranked by how well AI shopping bots can browse, find products, and checkout
          </span>
        </div>
        {data.totalTracked && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", backgroundColor: COLORS.cobalt + "10", borderRadius: 6, flexShrink: 0 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: COLORS.cobalt }}>{data.totalTracked}</span>
            <span style={{ fontSize: 10, color: COLORS.cobalt, fontWeight: 600 }}>brands tracked</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ display: "flex", height: 3, backgroundColor: COLORS.lightGray, marginBottom: 12, borderRadius: 2 }}>
        <div style={{ width: 60, height: 3, backgroundColor: COLORS.coral, borderRadius: 2, display: "flex" }} />
      </div>

      {/* Rankings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        {brands.map((brand, i) => (
          <div key={brand.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: i === 0 ? "10px 14px" : "6px 14px", backgroundColor: i === 0 ? COLORS.cobalt + "08" : "transparent", borderRadius: 8, borderLeft: i === 0 ? `4px solid ${COLORS.coral}` : "4px solid transparent" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 20 : 14, fontWeight: 700, color: i < 3 ? COLORS.coral : COLORS.gray, width: 28, display: "flex", justifyContent: "flex-end" }}>{i + 1}</span>
            <span style={{ fontSize: i === 0 ? 16 : 14, fontWeight: i === 0 ? 800 : 600, color: COLORS.navy, width: 160, display: "flex" }}>{brand.name}</span>
            <ScoreBar score={brand.score} width={400} height={i === 0 ? 14 : 10} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 18 : 14, fontWeight: 700, color: getScoreColor(brand.score), width: 40, display: "flex", justifyContent: "flex-end" }}>{brand.score}</span>
            <GradeBadge grade={brand.grade} size={i === 0 ? "md" : "sm"} />
          </div>
        ))}
      </div>

      {/* Spread callout */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
        <span style={{ fontSize: 12, color: COLORS.gray }}>
          Score spread: <span style={{ fontWeight: 700, color: getScoreColor(topScore) }}>{topScore}</span> to <span style={{ fontWeight: 700, color: getScoreColor(bottomScore) }}>{bottomScore}</span> — {topScore - bottomScore > 30 ? "huge gap between leaders and laggards" : "competitive field"}
        </span>
      </div>
    </ImageFrame>
  );
}
