"use client";

import { useState } from "react";
import type { FixPrompt } from "@/lib/fix-prompts";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="shrink-0 text-[11px] font-mono font-bold text-white bg-[#0259DD] hover:bg-[#024bb5] px-3 py-1.5 transition-colors"
    >
      {copied ? "Copied ✓" : "Copy Claude Code prompt"}
    </button>
  );
}

/**
 * One entry per failed check, each with a tailored Claude Code prompt the
 * merchant can paste into their own repository's session.
 */
export function FixPrompts({ prompts }: { prompts: FixPrompt[] }) {
  if (prompts.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
        Fix it with Claude Code
      </h2>
      <p className="text-xs text-muted-foreground mb-3">
        Each failed check below has a ready-made prompt tailored to this scan&apos;s findings.{" "}
        <strong className="text-foreground">Run it in Claude Code from your site&apos;s repository.</strong>
      </p>
      <div className="border border-gray-200 bg-white divide-y divide-gray-100">
        {prompts.map((p) => (
          <details key={p.id} className="group">
            <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-semibold text-foreground flex items-center gap-2 min-w-0">
                <span className="text-[#DC2626] shrink-0">✗</span>
                <span className="truncate">{p.title}</span>
                <span className="text-[10px] text-muted-foreground font-normal group-open:hidden shrink-0">show prompt</span>
              </span>
              <CopyButton text={p.prompt} />
            </summary>
            <pre className="mx-4 mb-3 bg-gray-50 border border-gray-200 text-[11px] leading-relaxed font-mono p-3 overflow-x-auto whitespace-pre-wrap">{p.prompt}</pre>
          </details>
        ))}
      </div>
    </section>
  );
}
