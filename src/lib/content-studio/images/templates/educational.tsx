/**
 * Educational — Bold explainer with full space usage
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
    <ImageFrame>
      <div style={{ display: "flex", flex: 1, gap: 40 }}>
        {/* Left — headline + subtitle */}
        <div style={{ display: "flex", flexDirection: "column", width: 440, justifyContent: "center", gap: 16 }}>
          <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.coral, letterSpacing: "0.08em" }}>
            AI SHOPPING AGENTS 101
          </span>

          <span style={{ fontSize: 34, fontWeight: 900, color: COLORS.navy, lineHeight: 1.12, letterSpacing: "-0.02em" }}>
            {data.title}
          </span>

          {data.subtitle && (
            <span style={{ fontSize: 16, color: COLORS.gray, lineHeight: 1.5 }}>
              {data.subtitle}
            </span>
          )}

          {/* Accent divider */}
          <div style={{ display: "flex", height: 4, width: 50, backgroundColor: accent, borderRadius: 2 }} />

          <span style={{ fontSize: 15, color: COLORS.gray, lineHeight: 1.5 }}>
            10 AI shopping agents are live today. They browse sites, read product data, and try to buy — just like a customer would. Here&apos;s what you need to know.
          </span>
        </div>

        {/* Right — bullets */}
        {bullets.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center", gap: 10 }}>
            {bullets.map((bullet, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", backgroundColor: COLORS.white, borderRadius: 10, border: `1px solid ${COLORS.lightGray}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, backgroundColor: accent, borderRadius: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 15, fontWeight: 700, color: COLORS.white }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 15, color: COLORS.navy, lineHeight: 1.5, paddingTop: 4 }}>{bullet}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ImageFrame>
  );
}
