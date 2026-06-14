import Link from "next/link";
import { getIndexStats } from "@/lib/index-data";

function formatUtc(iso: string | null): string {
  if (!iso) return "PENDING";
  return iso.replace("T", " ").slice(0, 16) + " UTC";
}

export function Footer() {
  // Live counts — never hardcode these (C4).
  const stats = getIndexStats();

  return (
    <footer className="mt-16">
      {/* Color block strip — cassette tape bottom edge */}
      <div className="flex h-2">
        <div className="flex-1 bg-[#FF6648]" />
        <div className="flex-1 bg-[#FBBA16]" />
        <div className="flex-1 bg-[#0259DD]" />
        <div className="flex-1 bg-[#84AFFB]" />
        <div className="flex-1 bg-[#FFE1D7]" />
        <div className="flex-1 bg-[#059669]" />
      </div>

      <div className="bg-[#0A1628] relative overflow-hidden">
        {/* Scan lines */}
        <div className="scan-lines" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
            {/* Left — Logo + spec info */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 bg-[#FF6648] flex items-center justify-center">
                  <span className="text-[9px] font-black text-white font-mono">AR</span>
                </div>
                <span className="text-sm font-black text-white tracking-tight">ARC Report</span>
              </div>
              <div className="space-y-1">
                <p className="spec-label text-white/25 text-[9px]">
                  THE OPEN DATASET OF AI AGENT ACCESS IN E-COMMERCE
                </p>
                <p className="spec-label text-white/25 text-[9px]">
                  DATA LICENSED CC BY 4.0 — ATTRIBUTION REQUIRED
                </p>
              </div>
            </div>

            {/* Right — Links in spec style */}
            <div className="flex flex-wrap items-center gap-0 border border-white/10 divide-x divide-white/10">
              {[
                { href: "/", label: "INDEX" },
                { href: "/insights", label: "INSIGHTS" },
                { href: "/data", label: "DATA" },
                { href: "/methodology", label: "METHODOLOGY" },
                { href: "/reliability", label: "RELIABILITY" },
                { href: "/docs", label: "API" },
                { href: "/docs/mcp", label: "PUBLIC MCP" },
                { href: "/docs/agency-mcp", label: "AGENCY MCP" },
                { href: "/about", label: "ABOUT" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="spec-label text-[9px] text-white/40 hover:text-white hover:bg-white/5 px-3 py-2.5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom spec line — live, never decorative */}
          <div className="mt-8 flex items-center gap-3 opacity-40">
            <div className="ruled-line flex-1" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, transparent 4px, transparent 8px)" }} />
            <span className="spec-label text-white/50 text-[8px]">
              {stats.brandCount.toLocaleString()} BRANDS · {stats.agentsTracked} AGENTS · LAST SCAN {formatUtc(stats.lastScan)}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
            <div className="ruled-line flex-1" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.15), rgba(255,255,255,0.15) 4px, transparent 4px, transparent 8px)" }} />
          </div>
        </div>
      </div>
    </footer>
  );
}
