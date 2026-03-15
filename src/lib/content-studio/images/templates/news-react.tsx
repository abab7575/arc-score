/**
 * News React — Light theme, big headline, clear commentary
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
        {/* Source */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.mustard, letterSpacing: "0.02em" }}>
            AI Commerce News
          </span>
          {data.source && (
            <>
              <span style={{ fontSize: 16, color: COLORS.lightGray }}>•</span>
              <span style={{ fontSize: 16, fontWeight: 600, color: COLORS.gray }}>
                via {data.source}
              </span>
            </>
          )}
        </div>

        {/* Headline */}
        <span style={{ fontSize: 36, fontWeight: 900, color: COLORS.navy, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          {data.headline}
        </span>

        {/* Divider */}
        <div style={{ display: "flex", height: 4, width: 60, backgroundColor: COLORS.mustard, borderRadius: 2 }} />

        {/* Commentary */}
        <div style={{ display: "flex", padding: "20px 24px", backgroundColor: COLORS.white, borderRadius: 14, border: `1px solid ${COLORS.lightGray}`, borderLeft: `4px solid ${COLORS.coral}` }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.coral }}>
              What this means for e-commerce
            </span>
            <span style={{ fontSize: 18, color: COLORS.navy, lineHeight: 1.6 }}>
              {data.commentary || "AI agents are becoming the new shoppers. Is your site ready for them? We scan hundreds of sites daily to find out."}
            </span>
          </div>
        </div>
      </div>
    </ImageFrame>
  );
}
