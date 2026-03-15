/**
 * News React — The hook is the news itself.
 * Our take is the value-add.
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
      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 24 }}>
        {/* Source tag */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.mustard, letterSpacing: "0.08em" }}>
            AI COMMERCE NEWS
          </span>
          {data.source && (
            <>
              <span style={{ fontSize: 14, color: "rgba(255,248,240,0.2)" }}>•</span>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: "rgba(255,248,240,0.4)", letterSpacing: "0.05em" }}>
                VIA {data.source.toUpperCase()}
              </span>
            </>
          )}
        </div>

        {/* Headline — BIG */}
        <span style={{ fontSize: 40, fontWeight: 900, color: COLORS.cream, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {data.headline}
        </span>

        {/* Divider */}
        <div style={{ display: "flex", height: 3, width: 60, backgroundColor: COLORS.mustard, borderRadius: 2 }} />

        {/* Commentary */}
        <div style={{ display: "flex", padding: "20px 24px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", borderLeft: `4px solid ${COLORS.coral}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.08em" }}>
              WHAT THIS MEANS FOR YOUR SITE
            </span>
            <span style={{ fontSize: 18, color: COLORS.cream, lineHeight: 1.6 }}>
              {data.commentary || "AI agents are becoming the new shoppers. Every new bot, protocol, and platform means more customers who never visit your site directly. Is yours ready?"}
            </span>
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
