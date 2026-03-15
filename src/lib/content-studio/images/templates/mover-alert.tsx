/**
 * Mover Alert Image — Score change with context
 *
 * At a glance: "This brand's score changed dramatically. Here's what happened."
 */

import React from "react";
import { ImageFrame, GradeBadge, Tag, COLORS, getScoreColor, getGradeForScore } from "./shared";

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
    <ImageFrame>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Tag label={isUp ? "Score Increase" : "Score Drop"} color={deltaColor} />
          <Tag label="AI Agent Readiness" />
        </div>

        {/* Brand name + big story */}
        <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 8 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            <span style={{ fontFamily: "Inter", fontSize: 42, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.02em", lineHeight: 1 }}>
              {data.brandName}
            </span>
            <span style={{ fontSize: 16, color: COLORS.gray, lineHeight: 1.5 }}>
              {isUp
                ? `Improved by ${data.delta} points — AI agents can now navigate more of the shopping journey successfully.`
                : `Dropped ${Math.abs(data.delta)} points — AI agents are hitting new barriers on this site.`
              }
            </span>
          </div>

          {/* Delta hero */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "20px 28px", backgroundColor: deltaColor + "10", borderRadius: 12, border: `2px solid ${deltaColor}30` }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 52, fontWeight: 700, color: deltaColor, lineHeight: 1 }}>
              {isUp ? "+" : ""}{data.delta}
            </span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: deltaColor, letterSpacing: "0.1em" }}>
              POINTS
            </span>
          </div>
        </div>

        {/* Before → After */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 16, padding: "20px 24px", backgroundColor: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.lightGray}` }}>
          {/* Before */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: COLORS.gray, letterSpacing: "0.1em" }}>BEFORE</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 48, fontWeight: 700, color: COLORS.gray + "80", lineHeight: 1 }}>{data.scoreBefore}</span>
            <GradeBadge grade={getGradeForScore(data.scoreBefore)} size="sm" />
          </div>

          {/* Arrow */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 60, height: 60, backgroundColor: deltaColor, borderRadius: 30 }}>
            <span style={{ fontSize: 28, color: COLORS.white }}>{isUp ? "→" : "→"}</span>
          </div>

          {/* After */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: COLORS.gray, letterSpacing: "0.1em" }}>AFTER</span>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 48, fontWeight: 700, color: afterColor, lineHeight: 1 }}>{data.scoreAfter}</span>
            <GradeBadge grade={grade} size="sm" />
          </div>

          {/* Top category changes */}
          {topChanges.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 2, borderLeft: `2px solid ${COLORS.lightGray}`, paddingLeft: 24 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 10, color: COLORS.gray, letterSpacing: "0.1em" }}>BIGGEST CATEGORY CHANGES</span>
              {topChanges.map((c) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: COLORS.navy, fontWeight: 500 }}>{c.category}</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Explainer */}
        <span style={{ fontSize: 11, color: COLORS.gray, marginTop: 4 }}>
          Robot Shopper scans {data.brandName} daily with 5 AI shopping agents to track agent readiness over time.
        </span>
      </div>
    </ImageFrame>
  );
}
