/**
 * Mover Alert — The hook is "AI bots are failing on real sites."
 * The brand is the proof.
 */

import React from "react";
import { ImageFrame, ScorePill, COLORS, getScoreColor, getReadiness } from "./shared";

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
  const topChanges = (data.topChanges || []).slice(0, 3);

  return (
    <ImageFrame>
      <div style={{ display: "flex", flex: 1, gap: 48 }}>
        {/* Left — The concept (60%) */}
        <div style={{ display: "flex", flexDirection: "column", flex: 3, justifyContent: "center", gap: 20 }}>
          {/* THE HOOK — big, provocative */}
          <span style={{ fontSize: 42, fontWeight: 900, color: COLORS.cream, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {isUp
              ? "An e-commerce site just got better at selling to AI agents."
              : "An e-commerce site just broke for AI shoppers."
            }
          </span>

          {/* The explainer */}
          <span style={{ fontSize: 18, color: "rgba(255,248,240,0.55)", lineHeight: 1.6 }}>
            {isUp
              ? "We scan hundreds of sites daily with 5 AI shopping bots. When a score jumps, it means more AI-driven purchases are getting through."
              : "We scan hundreds of sites daily with 5 AI shopping bots. When a score drops, it means customers sending AI to buy are getting turned away."
            }
          </span>

          {/* What changed */}
          {topChanges.length > 0 && (
            <div style={{ display: "flex", gap: 12 }}>
              {topChanges.map((c) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span style={{ fontSize: 14, color: COLORS.cream }}>{c.category}</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — The proof (40%) */}
        <div style={{ display: "flex", flexDirection: "column", flex: 2, alignItems: "center", justifyContent: "center", gap: 16, padding: "24px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
          {/* Brand name */}
          <span style={{ fontSize: 28, fontWeight: 800, color: COLORS.cream, textAlign: "center" }}>{data.brandName}</span>

          {/* Big delta */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 120, height: 120, borderRadius: 60, backgroundColor: deltaColor + "18", border: `3px solid ${deltaColor}` }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 48, fontWeight: 700, color: deltaColor, lineHeight: 1 }}>
              {isUp ? "+" : ""}{data.delta}
            </span>
          </div>

          {/* Before → After */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "rgba(255,248,240,0.35)" }}>BEFORE</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 24, fontWeight: 700, color: "rgba(255,248,240,0.4)" }}>{data.scoreBefore || "—"}</span>
            </div>
            <span style={{ fontSize: 18, color: "rgba(255,248,240,0.25)" }}>→</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "rgba(255,248,240,0.35)" }}>AFTER</span>
              <ScorePill score={data.scoreAfter} size="md" />
            </div>
          </div>

          {/* Readiness label */}
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, color: getScoreColor(data.scoreAfter), letterSpacing: "0.05em" }}>
            {getReadiness(data.scoreAfter).toUpperCase()}
          </span>
        </div>
      </div>
    </ImageFrame>
  );
}
