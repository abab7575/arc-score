/**
 * Mover Alert — Full canvas, no dead space, handles missing data gracefully
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
  const hasBefore = data.scoreBefore && data.scoreBefore > 0;
  const topChanges = (data.topChanges || []).slice(0, 4);

  return (
    <ImageFrame>
      <div style={{ display: "flex", flex: 1, gap: 0 }}>
        {/* Left — 55% — The hook + context */}
        <div style={{ display: "flex", flexDirection: "column", width: "55%", justifyContent: "center", paddingRight: 40, gap: 20 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral }}>
            Weekly AI Agent Readiness Update
          </span>

          <span style={{ fontSize: 40, fontWeight: 900, color: COLORS.navy, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
            {data.brandName}
            <br />
            <span style={{ color: deltaColor }}>
              {isUp ? `+${absDelta} points` : `${data.delta} points`}
            </span>
          </span>

          <span style={{ fontSize: 19, color: COLORS.gray, lineHeight: 1.5 }}>
            {isUp
              ? "AI shopping bots can now complete more of the purchase journey on this site. More AI-driven sales are getting through."
              : "AI shopping bots are now failing at more steps on this site. Customers sending AI to buy are being turned away."
            }
          </span>

          {/* Inline score if we have before data */}
          {hasBefore && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 16, color: COLORS.gray }}>Score:</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 22, fontWeight: 700, color: COLORS.gray, textDecoration: "line-through" }}>{data.scoreBefore}</span>
              <span style={{ fontSize: 18, color: COLORS.gray }}>→</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 26, fontWeight: 700, color: afterColor }}>{data.scoreAfter}</span>
              <span style={{ fontSize: 16, color: COLORS.gray }}>/100</span>
            </div>
          )}
        </div>

        {/* Right — 45% — Story card */}
        <div style={{ display: "flex", flexDirection: "column", width: "45%", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", backgroundColor: COLORS.white, borderRadius: 16, border: `2px solid ${COLORS.lightGray}`, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", backgroundColor: deltaColor + "08", borderBottom: `1px solid ${COLORS.lightGray}` }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: COLORS.navy }}>{data.brandName}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: afterColor }}>{getReadiness(data.scoreAfter)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 72, height: 72, borderRadius: 36, backgroundColor: deltaColor + "15", border: `3px solid ${deltaColor}` }}>
                <span style={{ fontFamily: "JetBrains Mono", fontSize: 28, fontWeight: 700, color: deltaColor }}>
                  {isUp ? "+" : ""}{data.delta}
                </span>
              </div>
            </div>

            {/* What changed */}
            <div style={{ display: "flex", flexDirection: "column", padding: "18px 24px", gap: 12 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy }}>What this means:</span>

              {topChanges.length > 0 ? (
                topChanges.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.delta > 0 ? COLORS.emerald : COLORS.coral, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy, lineHeight: 1.4 }}>
                      {c.category}: {c.delta > 0 ? "+" : ""}{c.delta} pts
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: deltaColor, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy, lineHeight: 1.4 }}>
                      {isUp ? "Checkout flow improved for bots" : "Checkout flow broke for bots"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: deltaColor, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy, lineHeight: 1.4 }}>
                      {isUp ? "Product data now readable by AI" : "Product data harder for AI to parse"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: deltaColor, flexShrink: 0, display: "flex" }} />
                    <span style={{ fontSize: 15, color: COLORS.navy, lineHeight: 1.4 }}>
                      {isUp ? "Navigation accessible to agents" : "Navigation elements inaccessible"}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
