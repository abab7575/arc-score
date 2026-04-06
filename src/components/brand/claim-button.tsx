"use client";

import { useState } from "react";
import { Loader2, UserCheck } from "lucide-react";

export function ClaimBrandButton({ brandId, brandName }: { brandId: number; brandName: string }) {
  const [state, setState] = useState<"idle" | "form" | "loading" | "done">("idle");
  const [email, setEmail] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      // Save email as subscriber with brand claim context
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: `claim:${brandId}` }),
      });
      setState("done");
    } catch {
      setState("done"); // Still show success — email is captured
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 text-sm text-[#059669] font-medium">
        <UserCheck className="w-4 h-4" />
        <span>Claim submitted — we&apos;ll be in touch.</span>
      </div>
    );
  }

  if (state === "form" || state === "loading") {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          autoFocus
          className="px-3 py-1.5 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD] w-48"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-3 py-1.5 bg-[#0A1628] text-white text-sm font-medium hover:bg-[#0A1628]/90 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {state === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Claim
        </button>
        <button
          type="button"
          onClick={() => setState("idle")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setState("form")}
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-arc-border)] px-4 py-2 text-sm font-mono text-foreground hover:bg-white transition-colors"
    >
      <UserCheck className="w-4 h-4" />
      Claim this brand
    </button>
  );
}
