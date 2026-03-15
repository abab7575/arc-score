/**
 * Mover Alert — 2-row layout: hook on top, journey steps below
 * Every container has explicit display:"flex" and flexDirection for Satori.
 */

import React from "react";
import { ImageFrame, COLORS, getScoreColor, getReadiness } from "./shared";

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
  const score = data.scoreAfter || 7; // fallback for display

  return (
    <ImageFrame>
      {/* Row 1: Hook — brand + delta + one-liner */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral }}>
            Weekly AI Shopping Bot Report
          </span>
          <span style={{ fontSize: 34, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {data.brandName}: {isUp ? `+${absDelta}` : `-${absDelta}`} points
          </span>
          <span style={{ fontSize: 17, color: COLORS.gray, lineHeight: 1.4 }}>
            {isUp
              ? "AI shopping bots can now complete more purchases on this site."
              : "AI shopping bots are now failing on this site. That means invisible lost sales."
            }
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 88, height: 88, borderRadius: 44, backgroundColor: deltaColor + "12", border: `4px solid ${deltaColor}`, flexShrink: 0 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 34, fontWeight: 700, color: deltaColor }}>
            {isUp ? "+" : ""}{data.delta}
          </span>
        </div>
      </div>

      {/* Row 2: Three steps — wide cards */}
      <div style={{ display: "flex", gap: 14, flex: 1 }}>
        {/* Step 1 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.lightGray}`, padding: "16px 18px", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: COLORS.cobalt, borderRadius: 6 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.white }}>1</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy }}>We sent 5 AI bots</span>
          </div>
          <span style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.5 }}>
            Browser bot, data parser, accessibility crawler, vision AI, and feed checker — all tried to shop {data.brandName}.
          </span>
        </div>

        {/* Step 2 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.lightGray}`, padding: "16px 18px", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: deltaColor, borderRadius: 6 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.white }}>2</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy }}>
              {isUp ? "What improved" : "Where they failed"}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(data.topChanges && data.topChanges.length > 0) ? (
              data.topChanges.slice(0, 3).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, backgroundColor: c.delta > 0 ? COLORS.emerald : COLORS.coral, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: COLORS.navy, flex: 1 }}>{c.category}</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}
                  </span>
                </div>
              ))
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, backgroundColor: deltaColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: COLORS.navy }}>{isUp ? "Checkout now works for bots" : "Checkout blocked for bots"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, backgroundColor: deltaColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: COLORS.navy }}>{isUp ? "Product data now readable" : "Product data unreadable"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", width: 8, height: 8, borderRadius: 4, backgroundColor: deltaColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 15, color: COLORS.navy }}>{isUp ? "Navigation accessible" : "Navigation broken for bots"}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Step 3 */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: afterColor + "08", borderRadius: 14, border: `2px solid ${afterColor}20`, padding: "16px 18px", gap: 10, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: afterColor, borderRadius: 6 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.white }}>3</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: COLORS.navy }}>Current score</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.white, border: `4px solid ${afterColor}` }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 36, fontWeight: 700, color: afterColor }}>{score}</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: afterColor }}>{getReadiness(score)}</span>
          <span style={{ fontSize: 14, color: COLORS.gray, textAlign: "center" }}>out of 100</span>
        </div>
      </div>
    </ImageFrame>
  );
}
