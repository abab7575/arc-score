/**
 * Mover Alert — "[Brand] just dropped/gained X points. Here's what changed."
 */

import React from "react";
import { ImageFrame, GradeBadge, COLORS, getScoreColor, getGradeForScore, getReadiness } from "./shared";

export interface MoverAlertData {
  brandName: string;
  scoreBefore: number;
  scoreAfter: number;
  delta: number;
  grade: string;
  topChanges?: { category: string; delta: number }[];
}

export function MoverAlertImage({ data }: { data: MoverAlertData }) {
  const isUp = data.delta > 0;
  const deltaColor = isUp ? COLORS.emerald : COLORS.coral;
  const afterColor = getScoreColor(data.scoreAfter);
  const grade = data.grade || getGradeForScore(data.scoreAfter);
  const topChanges = (data.topChanges || []).slice(0, 4);

  return (
    <ImageFrame whyItMatters={isUp
      ? `${data.brandName} is becoming more accessible to AI shopping agents. As more customers delegate buying to AI, this improvement means more completed purchases.`
      : `${data.brandName} is getting harder for AI agents to shop. Every point lost means more failed purchases from customers who sent an AI to buy for them.`
    }>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
        {/* Headline */}
        <span style={{ fontSize: 28, fontWeight: 900, color: COLORS.navy, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {data.brandName}{" "}
          <span style={{ color: deltaColor }}>
            {isUp ? `gained ${data.delta} points` : `dropped ${Math.abs(data.delta)} points`}
          </span>{" "}
          in AI agent readiness
        </span>
        <span style={{ fontSize: 14, color: COLORS.gray }}>
          We scan {data.brandName} daily with 5 AI shopping bots. {isUp ? "Things just got better." : "Something just broke."}
        </span>

        {/* Before → After visual */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "20px 28px", backgroundColor: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.lightGray}` }}>
          {/* Before */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: COLORS.gray, letterSpacing: "0.1em" }}>BEFORE</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 52, fontWeight: 700, color: COLORS.gray + "60", lineHeight: 1 }}>{data.scoreBefore}</span>
            <span style={{ fontSize: 11, color: COLORS.gray }}>{getReadiness(data.scoreBefore)}</span>
          </div>

          {/* Delta */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "16px 24px", backgroundColor: deltaColor + "10", borderRadius: 12, border: `2px solid ${deltaColor}25` }}>
            <span style={{ fontSize: 20, color: deltaColor }}>{isUp ? "▲" : "▼"}</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 36, fontWeight: 700, color: deltaColor, lineHeight: 1 }}>
              {isUp ? "+" : ""}{data.delta}
            </span>
          </div>

          {/* After */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: COLORS.gray, letterSpacing: "0.1em" }}>AFTER</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 52, fontWeight: 700, color: afterColor, lineHeight: 1 }}>{data.scoreAfter}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <GradeBadge grade={grade} size="sm" />
              <span style={{ fontSize: 11, color: afterColor, fontWeight: 600 }}>{getReadiness(data.scoreAfter)}</span>
            </div>
          </div>

          {/* Category changes */}
          {topChanges.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1.5, borderLeft: `2px solid ${COLORS.lightGray}`, paddingLeft: 24 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: COLORS.gray, letterSpacing: "0.1em" }}>WHAT CHANGED</span>
              {topChanges.map((c) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: COLORS.navy }}>{c.category}</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ImageFrame>
  );
}
