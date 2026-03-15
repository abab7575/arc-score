/**
 * Leaderboard Image Template — Top N brands ranked in a category
 */

import React from "react";
import { ImageFrame, ScoreBar, GradeBadge, COLORS } from "./shared";

export interface LeaderboardData {
  title: string;
  subtitle?: string;
  brands: { rank: number; name: string; score: number; grade: string }[];
  totalBrands: number;
}

export function LeaderboardImage({ data }: { data: LeaderboardData }) {
  const displayBrands = data.brands.slice(0, 8);

  return (
    <ImageFrame label="Leaderboard">
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {/* Title */}
        <span
          style={{
            fontSize: 32,
            fontWeight: 900,
            color: COLORS.cream,
            lineHeight: 1.2,
            marginBottom: 4,
          }}
        >
          {data.title}
        </span>
        {data.subtitle && (
          <span
            style={{
              fontSize: 16,
              fontWeight: 400,
              color: COLORS.gray,
              marginBottom: 20,
            }}
          >
            {data.subtitle}
          </span>
        )}

        {/* Rankings */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {displayBrands.map((brand) => (
            <div
              key={brand.rank}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 16,
                  fontWeight: 700,
                  color: brand.rank <= 3 ? COLORS.mustard : COLORS.gray,
                  width: 32,
                  textAlign: "right",
                }}
              >
                {brand.rank}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.white,
                  width: 200,
                }}
              >
                {brand.name}
              </span>
              <ScoreBar score={brand.score} width={500} height={14} />
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.white,
                  width: 40,
                  textAlign: "right",
                }}
              >
                {brand.score}
              </span>
              <GradeBadge grade={brand.grade} size="sm" />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            marginTop: "auto",
            paddingTop: 16,
          }}
        >
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              color: COLORS.gray,
            }}
          >
            {data.totalBrands} brands tracked · robotshopper.com
          </span>
        </div>
      </div>
    </ImageFrame>
  );
}
