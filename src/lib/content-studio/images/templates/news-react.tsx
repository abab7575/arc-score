/**
 * News React Image Template — Article title + commentary card
 */

import React from "react";
import { ImageFrame, COLORS } from "./shared";

export interface NewsReactData {
  headline: string;
  source: string;
  commentary?: string;
}

export function NewsReactImage({ data }: { data: NewsReactData }) {
  return (
    <ImageFrame label="Industry News">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
          gap: 24,
        }}
      >
        {/* Source badge */}
        <div style={{ display: "flex" }}>
          <span
            style={{
              fontFamily: "JetBrains Mono",
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.mustard,
              padding: "4px 12px",
              backgroundColor: "rgba(251, 186, 22, 0.1)",
              borderRadius: 2,
            }}
          >
            {data.source}
          </span>
        </div>

        {/* Headline */}
        <span
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: COLORS.cream,
            lineHeight: 1.3,
            maxWidth: 1000,
          }}
        >
          {data.headline}
        </span>

        {/* Commentary */}
        {data.commentary && (
          <div
            style={{
              display: "flex",
              borderLeft: `3px solid ${COLORS.coral}`,
              paddingLeft: 20,
            }}
          >
            <span
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: COLORS.gray,
                lineHeight: 1.6,
                fontStyle: "italic",
                maxWidth: 900,
              }}
            >
              {data.commentary}
            </span>
          </div>
        )}

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
            AI Agent Readiness perspective · arcscore.com
          </span>
        </div>
      </div>
    </ImageFrame>
  );
}
