"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2, Lock } from "lucide-react";

export function TrackBrandButton({ brandId }: { brandId: number }) {
  const [state, setState] = useState<"loading" | "unauthenticated" | "free" | "watching" | "not_watching">("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) {
          setState("unauthenticated");
          return;
        }
        if (data.customer.plan === "free") {
          setState("free");
          return;
        }
        // Check if already watching
        return fetch("/api/watchlist").then((r) => r.json()).then((wl) => {
          const isWatching = (wl.watchlist ?? []).some((w: { brandId: number }) => w.brandId === brandId);
          setState(isWatching ? "watching" : "not_watching");
        });
      })
      .catch(() => setState("unauthenticated"));
  }, [brandId]);

  async function handleToggle() {
    if (state === "unauthenticated" || state === "free") {
      window.location.href = state === "free" ? "/pricing" : "/login";
      return;
    }
    setBusy(true);
    try {
      if (state === "watching") {
        await fetch("/api/watchlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId }),
        });
        setState("not_watching");
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brandId }),
        });
        if (res.ok) {
          setState("watching");
        } else {
          const data = await res.json();
          alert(data.error || "Failed to track brand");
        }
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") return null;

  const isGated = state === "unauthenticated" || state === "free";
  const isWatching = state === "watching";

  return (
    <button
      onClick={handleToggle}
      disabled={busy}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-mono transition-colors disabled:opacity-50 ${
        isWatching
          ? "border-[#0259DD] bg-[#0259DD] text-white hover:bg-[#0259DD]/90"
          : isGated
            ? "border-[color:var(--color-arc-border)] text-muted-foreground hover:bg-white"
            : "border-[#0259DD] text-[#0259DD] hover:bg-[#0259DD]/5"
      }`}
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isGated ? (
        <Lock className="w-4 h-4" />
      ) : isWatching ? (
        <BellOff className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {isWatching ? "Tracking" : isGated ? "Track this brand" : "Track this brand"}
    </button>
  );
}
