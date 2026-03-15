/**
 * Mover Alert — Right side tells the story with context, not just numbers
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
  const topChanges = (data.topChanges || []).slice(0, 4);

  // Build a readable summary of what changed
  const changeStories = topChanges.map((c) => {
    const dir = c.delta > 0 ? "improved" : "declined";
    return `${c.category} ${dir} by ${Math.abs(c.delta)} points`;
  });

  return (
    <ImageFrame>
      <div style={{ display: "flex", flex: 1, gap: 40 }}>
        {/* Left — The hook */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 16 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral }}>
            We scan top e-commerce sites daily with AI shopping bots
          </span>

          <span style={{ fontSize: 38, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {data.brandName}
            <span style={{ color: deltaColor }}>
              {isUp ? ` is up ${absDelta} points` : ` is down ${absDelta} points`}
            </span>
          </span>

          <span style={{ fontSize: 18, color: COLORS.gray, lineHeight: 1.5 }}>
            {isUp
              ? "AI shopping bots can now complete more of the purchase journey on this site."
              : "AI shopping bots are now failing at more steps on this site. That means lost revenue."
            }
          </span>
        </div>

        {/* Right — The story card */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 0 }}>
          {/* Score card */}
          <div style={{ display: "flex", flexDirection: "column", backgroundColor: COLORS.white, borderRadius: 16, border: `2px solid ${COLORS.lightGray}`, overflow: "hidden" }}>
            {/* Score header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: `1px solid ${COLORS.lightGray}` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: COLORS.navy }}>{data.brandName}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: afterColor }}>{getReadiness(data.scoreAfter)}</span>
              </div>
              {/* Big delta */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 80, height: 80, borderRadius: 40, backgroundColor: deltaColor + "12", border: `3px solid ${deltaColor}` }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 32, fontWeight: 700, color: deltaColor }}>
                  {isUp ? "+" : ""}{data.delta}
                </span>
              </div>
            </div>

            {/* What changed — the actual story */}
            <div style={{ display: "flex", flexDirection: "column", padding: "16px 24px", gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.navy }}>What changed:</span>
              {changeStories.length > 0 ? (
                changeStories.map((story, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 8, height: 8, borderRadius: 4, backgroundColor: (topChanges[i]?.delta ?? 0) > 0 ? COLORS.emerald : COLORS.coral, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, color: COLORS.navy }}>{story}</span>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.coral, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, color: COLORS.navy }}>
                      {isUp ? "Checkout flow now works for AI bots" : "AI bots can no longer complete checkout"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.coral, flexShrink: 0 }} />
                    <span style={{ fontSize: 15, color: COLORS.navy }}>
                      {isUp ? "Product data is now machine-readable" : "Navigation elements are no longer accessible"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Score row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", backgroundColor: COLORS.cream, borderTop: `1px solid ${COLORS.lightGray}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 14, color: COLORS.gray }}>Score:</span>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 18, fontWeight: 700, color: COLORS.gray + "80", textDecoration: "line-through" }}>{data.scoreBefore || "—"}</span>
                <span style={{ fontSize: 16, color: COLORS.gray }}>→</span>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 700, color: afterColor }}>{data.scoreAfter}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
