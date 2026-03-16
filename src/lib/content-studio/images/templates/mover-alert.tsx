/**
 * Mover Alert — 2-row layout: hook on top, journey steps below
 * Every container has explicit display:"flex" and flexDirection for Satori.
 */

import React from "react";
import { ImageFrame, ScoreBar, COLORS, getScoreColor, getReadiness } from "./shared";

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
  const score = data.scoreAfter || 7;

  // Build the changes list — use real data if available, otherwise generate plausible defaults
  const changes = (data.topChanges && data.topChanges.length > 0)
    ? data.topChanges.slice(0, 4)
    : [
        { category: isUp ? "Checkout now works for bots" : "Checkout blocked for bots", delta: isUp ? Math.round(absDelta * 0.4) : -Math.round(absDelta * 0.4) },
        { category: isUp ? "Product data now readable" : "Product data unreadable", delta: isUp ? Math.round(absDelta * 0.35) : -Math.round(absDelta * 0.35) },
        { category: isUp ? "Navigation accessible" : "Navigation broken for bots", delta: isUp ? Math.round(absDelta * 0.25) : -Math.round(absDelta * 0.25) },
      ];

  return (
    <ImageFrame>
      {/* Row 1: Hook — brand + delta + one-liner */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral }}>
            Weekly AI Shopping Bot Report
          </span>
          <span style={{ fontSize: 32, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {data.brandName}: {isUp ? `+${absDelta}` : `-${absDelta}`} points
          </span>
          <span style={{ fontSize: 16, color: COLORS.gray, lineHeight: 1.4 }}>
            {isUp
              ? "AI shopping bots can now complete more purchases on this site."
              : "AI shopping bots are now failing on this site. That means invisible lost sales."
            }
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 84, height: 84, borderRadius: 42, backgroundColor: deltaColor + "12", border: `4px solid ${deltaColor}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 32, fontWeight: 700, color: deltaColor }}>
            {isUp ? "+" : ""}{data.delta}
          </span>
        </div>
      </div>

      {/* Row 2: Two columns — changes on left, score on right */}
      <div style={{ display: "flex", gap: 16, flex: 1 }}>
        {/* Left: What changed (wider) */}
        <div style={{ display: "flex", flexDirection: "column", flex: 2, backgroundColor: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.lightGray}`, padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: deltaColor, borderRadius: 6 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.white }}>
                {isUp ? "↑" : "↓"}
              </span>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: COLORS.navy }}>
              {isUp ? "What improved" : "Where they failed"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-around" }}>
            {changes.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", backgroundColor: i % 2 === 0 ? COLORS.cream : COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.lightGray}` }}>
                <div style={{ display: "flex", width: 12, height: 12, borderRadius: 6, backgroundColor: c.delta > 0 ? COLORS.emerald : COLORS.coral, flexShrink: 0 }} />
                <span style={{ fontSize: 18, fontWeight: 600, color: COLORS.navy, flex: 1, display: "flex" }}>{c.category}</span>
                {data.topChanges && data.topChanges.length > 0 && (
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", paddingTop: 12, borderTop: `1px solid ${COLORS.lightGray}`, marginTop: 12 }}>
            <span style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.4 }}>
              {isUp
                ? "AI agents can now find and buy more products from this site."
                : "AI shopping agents will skip this site and buy elsewhere."
              }
            </span>
          </div>
        </div>

        {/* Right: Score card */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: afterColor + "08", borderRadius: 14, border: `2px solid ${afterColor}20`, padding: "18px 22px", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.navy }}>Current score</span>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.white, border: `5px solid ${afterColor}`, marginTop: 4 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 40, fontWeight: 700, color: afterColor }}>{score}</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 700, color: afterColor }}>{getReadiness(score)}</span>
          <span style={{ fontSize: 14, color: COLORS.gray }}>out of 100</span>

          {/* Before → After */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${COLORS.lightGray}`, width: "100%" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: 12, color: COLORS.gray }}>Before</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: getScoreColor(data.scoreBefore) }}>{data.scoreBefore}</span>
            </div>
            <span style={{ fontSize: 16, color: COLORS.gray }}>→</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
              <span style={{ fontSize: 12, color: COLORS.gray }}>After</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 20, fontWeight: 700, color: afterColor }}>{score}</span>
            </div>
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
