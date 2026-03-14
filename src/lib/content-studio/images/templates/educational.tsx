/**
 * Educational Image Template — Category/agent/protocol explainer card
 */

import React from "react";
import { ImageFrame, COLORS } from "./shared";

export interface EducationalData {
  title: string;
  subtitle: string;
  bullets: string[];
  accentColor?: string;
}

export function EducationalImage({ data }: { data: EducationalData }) {
  const accent = data.accentColor || COLORS.cobalt;

  return (
    <ImageFrame label="Did You Know?">
      <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
        {/* Title */}
        <span
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: COLORS.cream,
            lineHeight: 1.2,
          }}
        >
          {data.title}
        </span>

        {/* Subtitle */}
        <span
          style={{
            fontSize: 18,
            fontWeight: 400,
            color: COLORS.gray,
            lineHeight: 1.5,
            maxWidth: 900,
          }}
        >
          {data.subtitle}
        </span>

        {/* Accent divider */}
        <div
          style={{
            width: 60,
            height: 3,
            backgroundColor: accent,
            borderRadius: 2,
            display: "flex",
          }}
        />

        {/* Bullet points */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {data.bullets.slice(0, 5).map((bullet, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 14,
                  fontWeight: 700,
                  color: accent,
                  minWidth: 24,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 400,
                  color: COLORS.white,
                  lineHeight: 1.5,
                }}
              >
                {bullet}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            marginTop: "auto",
          }}
        >
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 12,
              color: COLORS.gray,
            }}
          >
            Learn more at arcscore.com
          </span>
        </div>
      </div>
    </ImageFrame>
  );
}
