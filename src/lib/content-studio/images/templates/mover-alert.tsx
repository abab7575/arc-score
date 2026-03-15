/**
 * Mover Alert — Big, bold score change story
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
  const absDelta = Math.abs(data.delta);
  const deltaColor = isUp ? COLORS.emerald : COLORS.coral;
  const afterColor = getScoreColor(data.scoreAfter);
  const grade = data.grade || getGradeForScore(data.scoreAfter);
  const topChanges = (data.topChanges || []).slice(0, 3);

  return (
    <ImageFrame>
      {/* Left + Right layout */}
      <div style={{ display: "flex", flex: 1, gap: 40 }}>
        {/* Left — The story */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
          {/* Tag */}
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: deltaColor, letterSpacing: "0.08em" }}>
            {isUp ? "▲ SCORE ALERT" : "▼ SCORE ALERT"}
          </span>

          {/* Brand + headline */}
          <span style={{ fontSize: 40, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            {data.brandName}
          </span>

          <span style={{ fontSize: 22, fontWeight: 700, color: deltaColor, lineHeight: 1.3 }}>
            {isUp
              ? `Just gained ${absDelta} points in AI agent readiness`
              : `Just dropped ${absDelta} points in AI agent readiness`
            }
          </span>

          {/* What this means */}
          <span style={{ fontSize: 16, color: COLORS.gray, lineHeight: 1.5 }}>
            {isUp
              ? "AI shopping bots can now complete more of the purchase journey on this site."
              : "AI shopping bots are hitting new barriers — failed checkouts, broken navigation, or blocked access."
            }
          </span>

          {/* Category changes */}
          {topChanges.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px 18px", backgroundColor: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.lightGray}` }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.gray, letterSpacing: "0.08em" }}>WHAT CHANGED</span>
              {topChanges.map((c) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.navy }}>{c.category}</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — Big visual score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 380, gap: 20 }}>
          {/* Delta circle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 160, height: 160, borderRadius: 80, backgroundColor: deltaColor + "12", border: `4px solid ${deltaColor}` }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 56, fontWeight: 700, color: deltaColor, lineHeight: 1 }}>
                {isUp ? "+" : ""}{data.delta}
              </span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, color: deltaColor, letterSpacing: "0.05em" }}>POINTS</span>
            </div>
          </div>

          {/* Before → After row */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.gray }}>BEFORE</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 32, fontWeight: 700, color: COLORS.gray + "80" }}>{data.scoreBefore || "—"}</span>
            </div>
            <span style={{ fontSize: 24, color: COLORS.gray }}>→</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, color: COLORS.gray }}>AFTER</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 32, fontWeight: 700, color: afterColor }}>{data.scoreAfter || "—"}</span>
            </div>
          </div>

          {/* Grade + readiness */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <GradeBadge grade={grade} size="md" />
            <span style={{ fontSize: 16, fontWeight: 700, color: afterColor }}>{getReadiness(data.scoreAfter)}</span>
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
