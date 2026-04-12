"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import Link from "next/link";
import { Lock, Loader2, Download } from "lucide-react";

const AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Amazonbot",
  "Bingbot",
];

const PLATFORMS = ["shopify", "bigcommerce", "magento", "woocommerce", "salesforce", "custom"];
const CDNS = ["cloudflare", "fastly", "akamai", "cloudfront", "vercel"];

export default function ExportPage() {
  const [state, setState] = useState<"loading" | "unauthenticated" | "free" | "pro">("loading");
  const [preview, setPreview] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const [platforms, setPlatforms] = useState<string[]>([]);
  const [cdns, setCdns] = useState<string[]>([]);
  const [blockedAgent, setBlockedAgent] = useState("");
  const [allowedAgent, setAllowedAgent] = useState("");
  const [changedDays, setChangedDays] = useState("");
  const [requireJsonLd, setRequireJsonLd] = useState(false);
  const [requireOpenGraph, setRequireOpenGraph] = useState(false);
  const [requireProductFeed, setRequireProductFeed] = useState(false);
  const [requireLlmsTxt, setRequireLlmsTxt] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(data => {
        if (!data.authenticated) {
          setState("unauthenticated");
          return;
        }
        setState(data.customer.plan === "free" ? "free" : "pro");
      })
      .catch(() => setState("unauthenticated"));
  }, []);

  function buildQuery(extras: Record<string, string> = {}) {
    const params = new URLSearchParams();
    params.set("type", "matrix");
    if (platforms.length) params.set("platform", platforms.join(","));
    if (cdns.length) params.set("cdn", cdns.join(","));
    if (blockedAgent) params.set("blockedAgent", blockedAgent);
    if (allowedAgent) params.set("allowedAgent", allowedAgent);
    if (changedDays) params.set("changedDays", changedDays);
    if (requireJsonLd) params.set("hasJsonLd", "true");
    if (requireOpenGraph) params.set("hasOpenGraph", "true");
    if (requireProductFeed) params.set("hasProductFeed", "true");
    if (requireLlmsTxt) params.set("hasLlmsTxt", "true");
    for (const [k, v] of Object.entries(extras)) params.set(k, v);
    return params.toString();
  }

  async function runPreview() {
    setBusy(true);
    setPreview(null);
    try {
      const res = await fetch(`/api/export?${buildQuery({ format: "json" })}`);
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Preview failed");
        return;
      }
      const data = await res.json();
      setPreview(data.brandCount ?? (data.data?.length ?? 0));
    } finally {
      setBusy(false);
    }
  }

  function download(format: "csv" | "json") {
    const url = `/api/export?${buildQuery({ format })}`;
    window.location.href = url;
  }

  function togglePlatform(p: string) {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  }
  function toggleCdn(c: string) {
    setCdns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center text-muted-foreground text-sm">
          Loading...
        </main>
        <Footer />
      </div>
    );
  }

  if (state === "unauthenticated" || state === "free") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
          <div className="border-2 border-dashed border-gray-300 bg-gray-50/50 p-10 text-center">
            <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-black text-foreground mb-2">
              Filtered exports are a Pro feature
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Pick any combination of filters — platform, CDN, agent access, structured data, recent changes — and export the matching brands as CSV or JSON.
            </p>
            <Link
              href="/pricing"
              className="inline-block text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-6 py-3 transition-colors"
            >
              {state === "unauthenticated" ? "View pricing" : "Upgrade to Pro"}
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">
            Filtered export
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick filters and export matching brands as CSV or JSON.
          </p>
        </div>

        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Platform</h2>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                  platforms.includes(p)
                    ? "bg-[#0259DD] border-[#0259DD] text-white"
                    : "bg-white border-gray-200 text-foreground hover:border-[#0259DD]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">CDN</h2>
          <div className="flex flex-wrap gap-2">
            {CDNS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => toggleCdn(c)}
                className={`px-3 py-1.5 text-xs font-mono border transition-colors ${
                  cdns.includes(c)
                    ? "bg-[#0259DD] border-[#0259DD] text-white"
                    : "bg-white border-gray-200 text-foreground hover:border-[#0259DD]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Agent blocked
            </h2>
            <select
              value={blockedAgent}
              onChange={e => setBlockedAgent(e.target.value)}
              className="w-full border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#0259DD]"
            >
              <option value="">Any</option>
              {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
              Agent allowed
            </h2>
            <select
              value={allowedAgent}
              onChange={e => setAllowedAgent(e.target.value)}
              className="w-full border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#0259DD]"
            >
              <option value="">Any</option>
              {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Changed in last N days
          </h2>
          <input
            type="number"
            min="1"
            value={changedDays}
            onChange={e => setChangedDays(e.target.value)}
            placeholder="e.g. 7"
            className="w-40 border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-[#0259DD]"
          />
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">
            Structured data present
          </h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={requireJsonLd} onChange={e => setRequireJsonLd(e.target.checked)} />
              JSON-LD
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={requireOpenGraph} onChange={e => setRequireOpenGraph(e.target.checked)} />
              Open Graph
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={requireProductFeed} onChange={e => setRequireProductFeed(e.target.checked)} />
              Product feed
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={requireLlmsTxt} onChange={e => setRequireLlmsTxt(e.target.checked)} />
              llms.txt
            </label>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={runPreview}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-[#0259DD] text-[#0259DD] px-5 py-2.5 text-sm font-bold hover:bg-[#0259DD]/5 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Preview count
          </button>
          <button
            onClick={() => download("csv")}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-[#FF6648] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#e85a3f] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Download CSV
          </button>
          <button
            onClick={() => download("json")}
            disabled={busy}
            className="inline-flex items-center gap-2 bg-[#0A1628] text-white px-5 py-2.5 text-sm font-bold hover:bg-[#0A1628]/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Download JSON
          </button>

          {preview !== null && (
            <span className="text-sm text-muted-foreground font-mono ml-auto">
              {preview} brand{preview === 1 ? "" : "s"} match
            </span>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
