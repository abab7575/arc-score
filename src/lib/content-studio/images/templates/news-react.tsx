/**
 * News React Image — Commentary on AI commerce news
 *
 * At a glance: "Here's a news story about AI shopping + our take on it."
 */

import React from "react";
import { ImageFrame, Tag, COLORS } from "./shared";

export interface NewsReactData {
  headline: string;
  source?: string;
  commentary?: string;
  url?: string;
}

export function NewsReactImage({ data }: { data: NewsReactData }) {
  return (
    <ImageFrame>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
        {/* Tags */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag label="AI Commerce News" color={COLORS.mustard} />
          {data.source && (
            <Tag label={data.source} color={COLORS.cobalt} />
          )}
        </div>

        {/* Headline */}
        <span style={{ fontFamily: "Inter", fontSize: 36, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.02em", lineHeight: 1.2, maxWidth: 900 }}>
          {data.headline}
        </span>

        {/* Divider */}
        <div style={{ display: "flex", height: 3, backgroundColor: COLORS.lightGray, borderRadius: 2 }}>
          <div style={{ width: 60, height: 3, backgroundColor: COLORS.mustard, borderRadius: 2, display: "flex" }} />
        </div>

        {/* Commentary */}
        {data.commentary && (
          <div style={{ display: "flex", padding: "20px 24px", backgroundColor: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.lightGray}`, borderLeft: `4px solid ${COLORS.coral}`, flex: 1, maxHeight: 200 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.1em" }}>
                OUR TAKE
              </span>
              <span style={{ fontSize: 16, color: COLORS.navy, lineHeight: 1.6 }}>
                {data.commentary}
              </span>
            </div>
          </div>
        )}

        {/* What this means */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, backgroundColor: COLORS.cobalt, borderRadius: 6 }}>
            <span style={{ color: COLORS.white, fontSize: 16 }}>?</span>
          </div>
          <span style={{ fontSize: 13, color: COLORS.gray }}>
            What does this mean for your site? Check your AI agent readiness score at robotshopper.com
          </span>
        </div>
      </div>
    </ImageFrame>
  );
}
