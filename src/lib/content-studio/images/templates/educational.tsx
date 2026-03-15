/**
 * Educational — "Here's something every e-commerce leader needs to know about AI agents"
 */

import React from "react";
import { ImageFrame, COLORS } from "./shared";

export interface EducationalData {
  title: string;
  subtitle?: string;
  bullets?: string[];
  accentColor?: string;
}

export function EducationalImage({ data }: { data: EducationalData }) {
  const bullets = (data.bullets || []).slice(0, 5);
  const accent = data.accentColor || COLORS.cobalt;

  return (
    <ImageFrame whyItMatters="10 AI shopping agents are live today — from ChatGPT to Amazon Buy For Me. Each one interacts with your site differently. Most e-commerce sites aren't ready for any of them.">
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
        {/* Type */}
        <span style={{ fontFamily: "JetBrains Mono", fontSize: 11, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.1em", backgroundColor: COLORS.coral + "15", padding: "4px 10px", borderRadius: 4, display: "flex", alignSelf: "flex-start" }}>
          AI AGENT READINESS 101
        </span>

        {/* Headline */}
        <span style={{ fontSize: 32, fontWeight: 900, color: COLORS.navy, lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: 900 }}>
          {data.title}
        </span>

        {data.subtitle && (
          <span style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.5, maxWidth: 800 }}>
            {data.subtitle}
          </span>
        )}

        {/* Accent divider */}
        <div style={{ display: "flex", height: 4, width: 50, backgroundColor: accent, borderRadius: 2 }} />

        {/* Bullets */}
        {bullets.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
            {bullets.map((bullet, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", backgroundColor: COLORS.white, borderRadius: 8, border: `1px solid ${COLORS.lightGray}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, backgroundColor: accent + "15", borderRadius: 6, flexShrink: 0 }}>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 12, fontWeight: 700, color: accent }}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <span style={{ fontSize: 14, color: COLORS.navy, lineHeight: 1.5, paddingTop: 2 }}>{bullet}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ImageFrame>
  );
}
