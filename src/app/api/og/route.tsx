import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "AI Agent Intelligence for E-Commerce";
  const subtitle = searchParams.get("subtitle") || "1,000+ brands scanned daily";
  const stat = searchParams.get("stat") || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200",
          height: "630",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFF8F0",
          position: "relative",
        }}
      >
        {/* Accent bar */}
        <div
          style={{
            height: "6px",
            display: "flex",
            width: "100%",
          }}
        >
          <div style={{ flex: 1, backgroundColor: "#0259DD" }} />
          <div style={{ flex: 1, backgroundColor: "#FF6648" }} />
          <div style={{ flex: 1, backgroundColor: "#FBBA16" }} />
          <div style={{ flex: 1, backgroundColor: "#7C3AED" }} />
        </div>

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 80px",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "40px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                backgroundColor: "#0259DD",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                fontSize: "16px",
                fontWeight: 900,
                fontFamily: "monospace",
              }}
            >
              AR
            </div>
            <span
              style={{
                marginLeft: "14px",
                fontSize: "22px",
                fontWeight: 900,
                color: "#0A1628",
                letterSpacing: "-0.02em",
              }}
            >
              ARC Report
            </span>
            <span
              style={{
                marginLeft: "10px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                fontFamily: "monospace",
              }}
            >
              v2.0
            </span>
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: "52px",
              fontWeight: 900,
              color: "#0A1628",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
              marginBottom: "16px",
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "22px",
              color: "#64748B",
              lineHeight: 1.4,
              maxWidth: "700px",
            }}
          >
            {subtitle}
          </div>

          {/* Stat block */}
          {stat && (
            <div
              style={{
                display: "flex",
                marginTop: "32px",
                gap: "24px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "2px solid #0A1628",
                  padding: "16px 24px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <span style={{ fontSize: "36px", fontWeight: 900, color: "#FF6648", fontFamily: "monospace" }}>
                  {stat}
                </span>
                <span style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>
                  brands tracked
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            padding: "20px 80px",
            backgroundColor: "#0A1628",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ color: "#94A3B8", fontSize: "14px", fontFamily: "monospace" }}>
            arcreport.ai
          </span>
          <span style={{ color: "#64748B", fontSize: "12px" }}>
            Updated daily
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
