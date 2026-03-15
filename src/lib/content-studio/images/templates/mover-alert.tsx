/**
 * Mover Alert — Journey-style infographic
 *
 * Tells the STORY: We sent bots → Here's what happened → Here's the result
 * Uses a 3-step narrative arc, not just a scorecard.
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

  return (
    <ImageFrame>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 0 }}>
        {/* Title bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral }}>
              Weekly AI Shopping Bot Report
            </span>
            <span style={{ fontSize: 30, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              {data.brandName}: {isUp ? `Up ${absDelta}` : `Down ${absDelta}`} Points
            </span>
          </div>
          {/* Score pill */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: deltaColor + "12", border: `3px solid ${deltaColor}`, flexShrink: 0 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 28, fontWeight: 700, color: deltaColor }}>
              {isUp ? "+" : ""}{data.delta}
            </span>
          </div>
        </div>

        {/* ── 3-Step Journey ────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>

          {/* Step 1: We sent bots */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.lightGray}`, padding: "20px", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, backgroundColor: COLORS.cobalt, borderRadius: 8 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: COLORS.white }}>1</span>
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: COLORS.navy }}>We sent 5 AI bots</span>
            </div>
            <span style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.5 }}>
              Every day, we send 5 different AI shopping bots to {data.brandName} — a browser bot, data parser, accessibility crawler, vision AI, and feed checker.
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
              {["Browser", "Data", "A11y", "Vision", "Feed"].map((agent) => (
                <span key={agent} style={{ fontSize: 12, fontWeight: 600, color: COLORS.cobalt, backgroundColor: COLORS.cobalt + "10", padding: "4px 10px", borderRadius: 6 }}>
                  {agent}
                </span>
              ))}
            </div>
          </div>

          {/* Step 2: Where they got stuck */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: COLORS.white, borderRadius: 16, border: `1px solid ${COLORS.lightGray}`, padding: "20px", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, backgroundColor: deltaColor, borderRadius: 8 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: COLORS.white }}>2</span>
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: COLORS.navy }}>
                {isUp ? "What improved" : "Where they got stuck"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {(data.topChanges && data.topChanges.length > 0) ? (
                data.topChanges.slice(0, 4).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.delta > 0 ? COLORS.emerald : COLORS.coral, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy }}>{c.category}</span>
                    <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral, marginLeft: "auto" }}>
                      {c.delta > 0 ? "+" : ""}{c.delta}
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: deltaColor, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy }}>
                      {isUp ? "Checkout flow now works" : "Bots blocked at checkout"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: deltaColor, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy }}>
                      {isUp ? "Product data readable" : "Product data unreadable"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: deltaColor, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy }}>
                      {isUp ? "Navigation accessible" : "Navigation broken for bots"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Step 3: The result */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, backgroundColor: deltaColor + "08", borderRadius: 16, border: `2px solid ${deltaColor}25`, padding: "20px", gap: 12, alignItems: "center", justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, backgroundColor: deltaColor, borderRadius: 8 }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: COLORS.white }}>3</span>
              </div>
              <span style={{ fontSize: 17, fontWeight: 800, color: COLORS.navy }}>The result</span>
            </div>

            {/* Score */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.white, border: `4px solid ${afterColor}` }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 42, fontWeight: 700, color: afterColor }}>{data.scoreAfter}</span>
            </div>

            <span style={{ fontSize: 18, fontWeight: 800, color: afterColor }}>{getReadiness(data.scoreAfter)}</span>

            <span style={{ fontSize: 14, color: COLORS.gray, textAlign: "center", lineHeight: 1.4 }}>
              {data.scoreAfter >= 70
                ? "Most AI agents can shop here"
                : data.scoreAfter >= 50
                  ? "Some AI agents struggle here"
                  : "Most AI agents fail here"
              }
            </span>

            {data.scoreBefore > 0 && (
              <span style={{ fontSize: 14, color: COLORS.gray }}>
                Was: {data.scoreBefore}/100
              </span>
            )}
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
