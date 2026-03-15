/**
 * Leaderboard Image — Top brands ranked in a category
 *
 * Self-explanatory: "These are the top e-commerce sites for AI agents."
 */

import React from "react";
import { ImageFrame, ScoreBar, GradeBadge, Tag, COLORS, getScoreColor } from "./shared";

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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Tag label="AI Agent Readiness Rankings" />
          <span style={{ fontFamily: "Inter", fontSize: 32, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {data.title}
          </span>
        </div>
        {data.totalTracked && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 28, fontWeight: 700, color: COLORS.cobalt }}>{data.totalTracked}</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: COLORS.gray, letterSpacing: "0.05em" }}>BRANDS TRACKED</span>
          </div>
        )}
      </div>

      {data.subtitle && (
        <span style={{ fontSize: 14, color: COLORS.gray, marginBottom: 16, display: "flex" }}>{data.subtitle}</span>
      )}

      <div style={{ display: "flex", height: 3, backgroundColor: COLORS.lightGray, marginBottom: 16, borderRadius: 2 }}>
        <div style={{ width: 80, height: 3, backgroundColor: COLORS.coral, borderRadius: 2, display: "flex" }} />
      </div>

      {/* Rankings */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {brands.map((brand, i) => (
          <div key={brand.name} style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 16px", backgroundColor: i === 0 ? COLORS.cobalt + "08" : "transparent", borderRadius: 8, borderLeft: i === 0 ? `4px solid ${COLORS.coral}` : "4px solid transparent" }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 22 : 16, fontWeight: 700, color: i < 3 ? COLORS.coral : COLORS.gray, width: 32, textAlign: "right", display: "flex", justifyContent: "flex-end" }}>{i + 1}</span>
            <span style={{ fontSize: i === 0 ? 18 : 15, fontWeight: i === 0 ? 800 : 600, color: COLORS.navy, width: 180, display: "flex" }}>{brand.name}</span>
            <ScoreBar score={brand.score} width={420} height={i === 0 ? 16 : 12} />
            <span style={{ fontFamily: "JetBrains Mono", fontSize: i === 0 ? 20 : 15, fontWeight: 700, color: getScoreColor(brand.score), width: 45, textAlign: "right", display: "flex", justifyContent: "flex-end" }}>{brand.score}</span>
            <GradeBadge grade={brand.grade} size={i === 0 ? "md" : "sm"} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
        <span style={{ fontSize: 11, color: COLORS.gray }}>Scored by sending 5 AI agents to shop each site — testing navigation, checkout, structured data, visual clarity, and product feeds.</span>
      </div>
    </ImageFrame>
  );
}
