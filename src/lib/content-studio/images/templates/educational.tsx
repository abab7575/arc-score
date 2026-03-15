/**
 * Educational Image — Explainer/insight about AI agent commerce
 *
 * At a glance: "Here's something you should know about AI shopping agents."
 */

import React from "react";
import { ImageFrame, Tag, COLORS } from "./shared";

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
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 12 }}>
        {/* Header */}
        <Tag label="Did You Know?" color={COLORS.coral} />

        <span style={{ fontFamily: "Inter", fontSize: 38, fontWeight: 900, color: COLORS.navy, letterSpacing: "-0.02em", lineHeight: 1.15, maxWidth: 900 }}>
          {data.title}
        </span>

        {data.subtitle && (
          <span style={{ fontSize: 16, color: COLORS.gray, lineHeight: 1.5, maxWidth: 800 }}>
            {data.subtitle}
          </span>
        )}

        {/* Accent divider */}
        <div style={{ display: "flex", height: 4, width: 60, backgroundColor: accent, borderRadius: 2, marginTop: 4, marginBottom: 4 }} />

        {/* Bullets */}
        {bullets.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {bullets.map((bullet, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "12px 16px",
                  backgroundColor: COLORS.white,
                  borderRadius: 10,
                  border: `1px solid ${COLORS.lightGray}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, backgroundColor: accent + "15", borderRadius: 6, flexShrink: 0 }}>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 13, fontWeight: 700, color: accent }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <span style={{ fontSize: 14, color: COLORS.navy, lineHeight: 1.5, paddingTop: 3 }}>
                  {bullet}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer context */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "auto" }}>
          <span style={{ fontSize: 11, color: COLORS.gray }}>
            Learn more about AI agent readiness at robotshopper.com
          </span>
        </div>
      </div>
    </ImageFrame>
  );
}
