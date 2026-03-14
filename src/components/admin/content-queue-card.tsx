"use client";

import { Check, Copy, Download, Archive, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface ContentQueueItem {
  id: number;
  contentType: string;
  platform: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageTemplate: string | null;
  status: string;
  priorityScore: number;
  generatedBy: string;
  createdAt: string;
}

interface Props {
  item: ContentQueueItem;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
}

const PLATFORM_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  x: { bg: "rgba(0, 0, 0, 0.8)", text: "#FFFFFF", label: "X" },
  linkedin: { bg: "rgba(10, 102, 194, 0.9)", text: "#FFFFFF", label: "LinkedIn" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#d97706",
  approved: "#059669",
  posted: "#0259DD",
  archived: "#6B7280",
};

export function ContentQueueCard({ item, onStatusChange, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  const platformStyle = PLATFORM_STYLES[item.platform] || PLATFORM_STYLES.x;
  const statusColor = STATUS_COLORS[item.status] || "#6B7280";
  const charCount = item.body.length;
  const isOverLimit = item.platform === "x" && charCount > 280;

  async function handleCopy() {
    await navigator.clipboard.writeText(item.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadImage() {
    if (!item.imageUrl) return;
    const a = document.createElement("a");
    a.href = item.imageUrl;
    a.download = `${item.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.png`;
    a.click();
  }

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {/* Image preview */}
      {item.imageUrl ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: "#0A1628",
            backgroundImage: `url(${item.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ) : item.imageTemplate ? (
        <div
          style={{
            width: "100%",
            aspectRatio: "16 / 9",
            backgroundColor: "#0A1628",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ImageIcon style={{ width: 32, height: 32, color: "rgba(255,255,255,0.2)" }} />
        </div>
      ) : null}

      <div style={{ padding: 16 }}>
        {/* Top row: platform badge + status + priority */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: platformStyle.text,
              backgroundColor: platformStyle.bg,
              padding: "2px 8px",
              borderRadius: 4,
              letterSpacing: "0.05em",
            }}
          >
            {platformStyle.label}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: statusColor,
                display: "inline-block",
              }}
            />
            {item.status}
          </span>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              color: "#94A3B8",
              marginLeft: "auto",
            }}
          >
            P{item.priorityScore}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1E293B",
            margin: "0 0 6px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {item.title}
        </h3>

        {/* Body preview */}
        <p
          style={{
            fontSize: 13,
            color: "#64748B",
            margin: "0 0 10px",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {item.body}
        </p>

        {/* Char count */}
        <div style={{ marginBottom: 12 }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono, monospace)",
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: isOverLimit ? "rgba(220, 38, 38, 0.1)" : "rgba(0,0,0,0.04)",
              color: isOverLimit ? "#dc2626" : "#94A3B8",
            }}
          >
            {charCount} chars{isOverLimit ? " (over limit!)" : ""}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {item.status === "draft" && (
            <button
              onClick={() => onStatusChange(item.id, "approved")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#059669",
                backgroundColor: "rgba(5, 150, 105, 0.08)",
                border: "1px solid rgba(5, 150, 105, 0.2)",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <Check style={{ width: 14, height: 14 }} />
              Approve
            </button>
          )}

          <button
            onClick={handleCopy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: copied ? "#059669" : "#64748B",
              backgroundColor: copied ? "rgba(5, 150, 105, 0.08)" : "rgba(0,0,0,0.04)",
              border: "1px solid transparent",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {copied ? (
              <>
                <Check style={{ width: 14, height: 14 }} />
                Copied!
              </>
            ) : (
              <>
                <Copy style={{ width: 14, height: 14 }} />
                Copy
              </>
            )}
          </button>

          {item.imageUrl && (
            <button
              onClick={handleDownloadImage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#64748B",
                backgroundColor: "rgba(0,0,0,0.04)",
                border: "1px solid transparent",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              <Download style={{ width: 14, height: 14 }} />
              Image
            </button>
          )}

          {item.status !== "archived" && (
            <button
              onClick={() => onStatusChange(item.id, "archived")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                color: "#94A3B8",
                backgroundColor: "rgba(0,0,0,0.04)",
                border: "1px solid transparent",
                borderRadius: 6,
                cursor: "pointer",
                marginLeft: "auto",
              }}
            >
              <Archive style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
