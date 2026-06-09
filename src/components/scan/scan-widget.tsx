"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TRACKED_AGENT_IDS } from "@/lib/site";
import { buildFixPrompts } from "@/lib/fix-prompts";
import { FixPrompts } from "@/components/brand/fix-prompts";

interface ScanResultData {
  known: boolean;
  slug?: string;
  name?: string;
  domain?: string;
  url?: string;
  agentStatus?: Record<string, string>;
  platform?: string;
  cdn?: string;
  waf?: string;
  signals?: Record<string, boolean>;
  arcScore?: number;
  arcScoreLabel?: string;
  arcScoreComponents?: {
    agentAccess: number;
    structuredData: number;
    protocolFiles: number;
    scanStability: number;
  };
  scannedAt?: string;
  remainingToday?: number;
}

const SIGNAL_LABELS: Record<string, string> = {
  jsonLd: "JSON-LD",
  schemaProduct: "Schema.org Product",
  openGraph: "Open Graph",
  sitemap: "Sitemap",
  productFeed: "Product feed",
  llmsTxt: "llms.txt",
  agentsTxt: "agents.txt",
  ucp: "UCP",
};

function statusStyle(status: string): { label: string; cls: string } {
  switch (status) {
    case "allowed":
    case "no_rule":
      return { label: "Allowed", cls: "text-[#059669]" };
    case "blocked":
      return { label: "Blocked", cls: "text-[#DC2626]" };
    case "restricted":
      return { label: "Restricted (WAF)", cls: "text-[#D97706]" };
    default:
      return { label: "Unknown", cls: "text-muted-foreground" };
  }
}

export function ScanWidget({ defaultDomain }: { defaultDomain?: string }) {
  const router = useRouter();
  const [domain, setDomain] = useState(defaultDomain ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const autoRan = useRef(false);

  const runScan = useCallback(async (d: string) => {
    if (!d.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: d }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Scan failed. Please try again.");
        return;
      }
      if (data.known && data.slug) {
        router.push(`/brand/${data.slug}`);
        return;
      }
      setResult(data);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (defaultDomain && !autoRan.current) {
      autoRan.current = true;
      runScan(defaultDomain);
    }
  }, [defaultDomain, runScan]);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          runScan(domain);
        }}
        className="flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          inputMode="url"
          placeholder="yourstore.com"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="flex-1 border-2 border-gray-300 px-4 py-3 text-base font-mono bg-white focus:outline-none focus:border-[#0259DD]"
          aria-label="Domain to scan"
        />
        <button
          type="submit"
          disabled={loading}
          className="text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] disabled:opacity-60 px-6 py-3 transition-colors"
        >
          {loading ? "Scanning…" : "Scan free"}
        </button>
      </form>
      <p className="text-xs text-muted-foreground mt-2">
        No signup. 5 free scans per day. Already-tracked brands open instantly; new domains run a
        live ~25-request scan and join the daily index.
      </p>

      {loading && (
        <div className="mt-8 border-2 border-gray-200 bg-white px-5 py-8 text-center">
          <div className="text-sm font-mono text-muted-foreground animate-pulse">
            Running live scan — robots.txt, {TRACKED_AGENT_IDS.length} agent HTTP tests, structured
            data, platform detection…
          </div>
        </div>
      )}

      {error && (
        <div className="mt-8 border-2 border-amber-300 bg-amber-50 px-5 py-4 text-sm text-foreground">
          {error}{" "}
          <Link href="/" className="text-[#0259DD] hover:underline">Browse the index →</Link>
        </div>
      )}

      {result && !result.known && (
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-black text-foreground tracking-tight">{result.domain}</h2>
            <div className="text-xs text-muted-foreground mt-1 font-mono">
              Live scan · {result.scannedAt?.replace("T", " ").slice(0, 16)} UTC · queued for the daily index
            </div>
          </div>

          {/* ARC Score */}
          <section className="border-2 border-gray-200 bg-white px-5 py-4">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">
              ARC Score v1.0
            </div>
            <div className="text-3xl font-black font-mono text-foreground">
              {result.arcScore}
              <span className="text-base text-muted-foreground font-semibold">/100</span>
              <span className="ml-3 text-sm font-bold text-[#0259DD]">{result.arcScoreLabel}</span>
            </div>
            {result.arcScoreComponents && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Agent access", value: result.arcScoreComponents.agentAccess, max: 50 },
                  { label: "Structured data", value: result.arcScoreComponents.structuredData, max: 25 },
                  { label: "Protocol files", value: result.arcScoreComponents.protocolFiles, max: 15 },
                  { label: "Scan stability", value: result.arcScoreComponents.scanStability, max: 10 },
                ].map((c) => (
                  <div key={c.label}>
                    <div className="flex items-baseline justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{c.label}</span>
                      <span className="font-mono font-bold text-foreground">{c.value}/{c.max}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100">
                      <div className="h-full bg-[#0259DD]" style={{ width: `${(c.value / c.max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Agent access table */}
          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Agent access
            </h3>
            <div className="border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Agent</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TRACKED_AGENT_IDS.map((agent) => {
                    const st = statusStyle(result.agentStatus?.[agent] ?? "inconclusive");
                    return (
                      <tr key={agent} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-2.5 font-mono text-xs">{agent}</td>
                        <td className={`px-4 py-2.5 font-semibold ${st.cls}`}>{st.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Infrastructure */}
          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Infrastructure
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                ["Platform", result.platform && result.platform !== "unknown" ? result.platform : "—"],
                ["CDN", result.cdn && result.cdn !== "unknown" ? result.cdn : "—"],
                ["WAF", result.waf && result.waf !== "none-detected" ? result.waf : "none"],
              ].map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-mono font-semibold text-foreground">{v}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Data signals */}
          <section>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-3">
              Data signals
            </h3>
            <ul className="border border-gray-200 bg-white divide-y divide-gray-100">
              {Object.entries(SIGNAL_LABELS).map(([key, label]) => (
                <li key={key} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-mono font-semibold ${result.signals?.[key] ? "text-[#059669]" : "text-[#DC2626]"}`}>
                    {result.signals?.[key] ? "Detected" : "Not detected"}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <FixPrompts
            prompts={buildFixPrompts({
              domain: result.domain ?? "",
              agentStatus: result.agentStatus ?? {},
              signals: {
                jsonLd: !!result.signals?.jsonLd,
                schemaProduct: !!result.signals?.schemaProduct,
                openGraph: !!result.signals?.openGraph,
                sitemap: !!result.signals?.sitemap,
                productFeed: !!result.signals?.productFeed,
                llmsTxt: !!result.signals?.llmsTxt,
                agentsTxt: !!result.signals?.agentsTxt,
              },
              platform: result.platform,
              waf: result.waf,
            })}
          />

          <div className="border border-gray-200 bg-gray-50/60 px-4 py-3 text-xs text-muted-foreground">
            {result.domain} has been queued for the daily index — it will get a permanent brand page,
            change tracking, and a badge once included.
            {typeof result.remainingToday === "number" && ` You have ${result.remainingToday} free scans left today.`}{" "}
            <Link href="/methodology" className="text-[#0259DD] hover:underline">How this scan works →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
