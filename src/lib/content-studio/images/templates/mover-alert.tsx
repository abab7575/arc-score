/**
 * Mover Alert — Light theme, concept-first, big readable text, clear CTA
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
      <div style={{ display: "flex", flex: 1, gap: 40 }}>
        {/* Left — The concept */}
        <div style={{ display: "flex", flexDirection: "column", flex: 3, justifyContent: "center", gap: 16 }}>
          {/* Context line */}
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.02em" }}>
            We scan top e-commerce sites daily with AI shopping bots
          </span>

          {/* THE HOOK — huge */}
          <span style={{ fontSize: 38, fontWeight: 900, color: COLORS.navy, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {isUp
              ? `${data.brandName} just became easier for AI agents to shop.`
              : `${data.brandName} just got harder for AI agents to shop.`
            }
          </span>

          {/* Why it matters — readable */}
          <span style={{ fontSize: 18, color: COLORS.gray, lineHeight: 1.5 }}>
            {isUp
              ? "When your score goes up, more AI-driven purchases get through. That's revenue you didn't have to fight for."
              : "When your score drops, AI shoppers fail silently. No abandoned cart. No analytics. Just lost sales."
            }
          </span>

          {/* Category changes */}
          {topChanges.length > 0 && (
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              {topChanges.map((c) => (
                <div key={c.category} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", backgroundColor: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.lightGray}` }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: COLORS.navy }}>{c.category}</span>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 700, color: c.delta > 0 ? COLORS.emerald : COLORS.coral }}>
                    {c.delta > 0 ? "+" : ""}{c.delta}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — The proof */}
        <div style={{ display: "flex", flexDirection: "column", flex: 2, alignItems: "center", justifyContent: "center", gap: 20, padding: "24px", backgroundColor: COLORS.white, borderRadius: 20, border: `2px solid ${COLORS.lightGray}` }}>
          {/* Brand */}
          <span style={{ fontSize: 24, fontWeight: 800, color: COLORS.navy }}>{data.brandName}</span>

          {/* Delta circle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 130, height: 130, borderRadius: 65, backgroundColor: deltaColor + "12", border: `4px solid ${deltaColor}` }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 50, fontWeight: 700, color: deltaColor, lineHeight: 1 }}>
              {isUp ? "+" : ""}{data.delta}
            </span>
          </div>

          {/* Before → After */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.gray }}>Before</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 28, fontWeight: 700, color: COLORS.gray + "80" }}>{data.scoreBefore || "—"}</span>
            </div>
            <span style={{ fontSize: 24, color: COLORS.lightGray }}>→</span>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.gray }}>After</span>
              <ScorePill score={data.scoreAfter} size="lg" />
            </div>
          </div>

          <span style={{ fontSize: 16, fontWeight: 700, color: getScoreColor(data.scoreAfter) }}>{getReadiness(data.scoreAfter)}</span>
        </div>
      </div>
    </ImageFrame>
  );
}
