/**
 * News React — AI commerce news + our perspective on what it means
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
    <ImageFrame whyItMatters="AI agents are becoming your next customers. Every week brings new shopping bots, protocols, and platforms. If your site isn't ready, you're invisible to this new channel.">
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 16 }}>
        {/* Type + source */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: COLORS.mustard, letterSpacing: "0.1em", backgroundColor: COLORS.mustard + "15", padding: "4px 10px", borderRadius: 4, display: "flex" }}>
            AI COMMERCE NEWS
          </span>
          {data.source && (
            <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: COLORS.cobalt, letterSpacing: "0.1em", backgroundColor: COLORS.cobalt + "15", padding: "4px 10px", borderRadius: 4, display: "flex" }}>
              {data.source.toUpperCase()}
            </span>
          )}
        </div>

        {/* Headline */}
        <span style={{ fontSize: 32, fontWeight: 900, color: COLORS.navy, lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 950 }}>
          {data.headline}
        </span>

        {/* Divider */}
        <div style={{ display: "flex", height: 3, width: 60, backgroundColor: COLORS.mustard, borderRadius: 2 }} />

        {/* Commentary */}
        {data.commentary && (
          <div style={{ display: "flex", padding: "20px 24px", backgroundColor: COLORS.white, borderRadius: 12, border: `1px solid ${COLORS.lightGray}`, borderLeft: `4px solid ${COLORS.coral}`, flex: 1, maxHeight: 180 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.1em" }}>
                WHAT THIS MEANS FOR E-COMMERCE
              </span>
              <span style={{ fontSize: 16, color: COLORS.navy, lineHeight: 1.6 }}>
                {data.commentary}
              </span>
            </div>
          </div>
        )}

        {!data.commentary && (
          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 18, color: COLORS.gray, textAlign: "center", maxWidth: 600, lineHeight: 1.6 }}>
              The AI shopping landscape is evolving fast. New agents, new protocols, new ways for customers to buy without ever visiting your site.
            </span>
          </div>
        )}
      </div>
    </ImageFrame>
  );
}
