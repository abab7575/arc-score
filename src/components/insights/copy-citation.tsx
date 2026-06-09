"use client";

import { useState } from "react";

export function CopyCitation({ stat, anchor, date }: { stat: string; anchor: string; date: string }) {
  const [copied, setCopied] = useState(false);
  const citation = `${stat} — ARC Report, ${date}, arcreport.ai/insights#${anchor}`;

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(citation).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      title={citation}
      className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-[#0259DD] border border-gray-200 hover:border-[#0259DD] px-2 py-1 transition-colors"
    >
      {copied ? "Copied ✓" : "Copy citation"}
    </button>
  );
}
