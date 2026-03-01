"use client";

import { useState } from "react";
import { Share2, Download, ExternalLink, Check } from "lucide-react";

interface ReportHeaderProps {
  url: string;
  scannedAt: string;
}

export function ReportHeader({ url, scannedAt }: ReportHeaderProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const date = new Date(scannedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 border-b border-[#E8E0D8]">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            ARC Score Report
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <a
            href={`https://${url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[#0259DD] hover:underline flex items-center gap-1"
          >
            {url}
            <ExternalLink size={12} />
          </a>
          <span className="text-xs text-muted-foreground">
            Scanned {date}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm text-foreground transition-colors"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
          {copied ? "Copied" : "Share"}
        </button>
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0259DD] hover:bg-[#0248b8] text-sm text-white font-medium transition-colors">
          <Download size={14} />
          PDF
        </button>
      </div>
    </div>
  );
}
