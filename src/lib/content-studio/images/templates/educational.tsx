/**
 * Educational — The hook is a bold question or statement.
 * The bullets are the value.
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
      <div style={{ display: "flex", flex: 1, gap: 48 }}>
        {/* Left — The hook */}
        <div style={{ display: "flex", flexDirection: "column", flex: 3, justifyContent: "center", gap: 20 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: COLORS.cream, lineHeight: 1.1, letterSpacing: "-0.03em" }}>
            {data.title}
          </span>

          {data.subtitle && (
            <span style={{ fontSize: 18, color: "rgba(255,248,240,0.55)", lineHeight: 1.6 }}>
              {data.subtitle}
            </span>
          )}

          {/* Accent line */}
          <div style={{ display: "flex", height: 4, width: 50, backgroundColor: accent, borderRadius: 2 }} />

          <span style={{ fontSize: 16, color: "rgba(255,248,240,0.4)", lineHeight: 1.5 }}>
            10 AI shopping agents are live today — from ChatGPT to Amazon Buy For Me. Each one interacts with your site differently.
          </span>
        </div>

        {/* Right — Bullets */}
        {bullets.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", flex: 2, justifyContent: "center", gap: 10 }}>
            {bullets.map((bullet, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 16px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, backgroundColor: accent, borderRadius: 8, flexShrink: 0 }}>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 14, fontWeight: 700, color: COLORS.white }}>{i + 1}</span>
                </div>
                <span style={{ fontSize: 14, color: COLORS.cream, lineHeight: 1.5, paddingTop: 4 }}>{bullet}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ImageFrame>
  );
}
