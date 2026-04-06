"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function EmailCapture({
  source = "homepage",
  heading = "Get the weekly digest",
  subtext = "One email per week with the biggest agent access changes across 1,000+ brands.",
}: {
  source?: string;
  heading?: string;
  subtext?: string;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      if (res.ok) {
        setState("success");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="border-2 border-[#059669] bg-emerald-50 px-6 py-6 text-center">
        <p className="text-sm font-semibold text-[#059669]">You&apos;re in. Watch your inbox.</p>
      </div>
    );
  }

  return (
    <div className="border-2 border-gray-200 bg-white px-6 py-6">
      <p className="text-sm font-bold text-foreground mb-1">{heading}</p>
      <p className="text-xs text-muted-foreground mb-4">{subtext}</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="flex-1 px-3 py-2 border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD] rounded-none"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className="px-4 py-2 bg-[#0259DD] text-white text-sm font-semibold hover:bg-[#0259DD]/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Subscribe"}
        </button>
      </form>
      {state === "error" && (
        <p className="text-xs text-red-500 mt-2">Something went wrong. Try again.</p>
      )}
    </div>
  );
}
