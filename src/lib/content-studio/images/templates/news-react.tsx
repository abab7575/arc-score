/**
 * News React — Bold headline + commentary, fills the space
 */

import React from "react";
import { ImageFrame, COLORS } from "./shared";

export interface NewsReactData {
  headline: string;
  source?: string;
  commentary?: string;
  url?: string;
}

export function NewsReactImage({ data }: { data: NewsReactData }) {
  return (
    <ImageFrame>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 20 }}>
        {/* Tags */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.mustard, letterSpacing: "0.08em" }}>
            AI COMMERCE NEWS
          </span>
          {data.source && (
            <>
              <span style={{ fontSize: 14, color: COLORS.gray }}>•</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.cobalt, letterSpacing: "0.05em" }}>
                {data.source.toUpperCase()}
              </span>
            </>
          )}
        </div>

        {/* Headline */}
        <span style={{ fontSize: 38, fontWeight: 900, color: COLORS.navy, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {data.headline}
        </span>

        {/* Divider */}
        <div style={{ display: "flex", height: 4, width: 60, backgroundColor: COLORS.mustard, borderRadius: 2 }} />

        {/* Commentary or default */}
        <div style={{ display: "flex", padding: "20px 24px", backgroundColor: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.lightGray}`, borderLeft: `4px solid ${COLORS.coral}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.08em" }}>
              WHAT THIS MEANS FOR E-COMMERCE
            </span>
            <span style={{ fontSize: 17, color: COLORS.navy, lineHeight: 1.6 }}>
              {data.commentary || "AI agents are becoming the new shoppers. Every week brings new bots, new protocols, and new ways for customers to buy without ever visiting your site. Is yours ready?"}
            </span>
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
