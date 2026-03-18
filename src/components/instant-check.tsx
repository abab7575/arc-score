"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
  Globe,
  CheckCircle2,
  Code2,
  FileJson,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// ── Types (mirrors API response) ──────────────────────────────────────

interface AgentAccess {
  agent: string;
  company: string;
  product: string;
  status: "allowed" | "blocked" | "no_rule";
}

interface Issue {
  severity: "critical" | "high" | "medium";
  title: string;
  locked: boolean;
}

interface StructuredData {
  hasJsonLd: boolean;
  hasSchemaProduct: boolean;
  hasOpenGraph: boolean;
  hasProductFeed: boolean;
}

interface InstantCheckResult {
  url: string;
  checkedAt: string;
  score?: number;
  grade?: string;
  agentAccess: AgentAccess[];
  issues: Issue[];
  structuredData: StructuredData;
  blockedAgentCount: number;
  totalAgentsChecked: number;
  semanticHtml: {
    hasNav: boolean;
    hasMain: boolean;
    hasH1: boolean;
  };
  confidence?: {
    robotsTxt: string;
    structuredData: string;
  };
  note?: string;
}

// ── Loading Messages ──────────────────────────────────────────────────

const LOADING_STEPS = [
  { message: "Fetching robots.txt...", icon: Shield },
  { message: "Checking AI agent access rules...", icon: ShieldCheck },
  { message: "Analyzing structured data...", icon: FileJson },
  { message: "Scanning for product markup...", icon: Code2 },
  { message: "Testing for product feeds...", icon: Globe },
  { message: "Compiling results...", icon: CheckCircle2 },
];

// ── Main Component ────────────────────────────────────────────────────

export function InstantCheck() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InstantCheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  // Cycle through loading messages
  useEffect(() => {
    if (!loading) return;
    setLoadingStep(0);
    const interval = setInterval(() => {
      setLoadingStep((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 2500);
    return () => clearInterval(interval);
  }, [loading]);

  // Scroll to results when they appear
  useEffect(() => {
    if (result && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    }
  }, [result]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/instant-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to check URL");
      }

      const data: InstantCheckResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* ── Input Form ──────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto lg:mx-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative group">
            <Globe
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0A1628]/25 group-focus-within:text-[#FF6648] transition-colors"
            />
            <input
              type="text"
              placeholder="Enter any URL — nike.com, glossier.com..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full pl-12 pr-4 py-4 border-2 border-[#0A1628]/12 bg-white text-base text-[#0A1628] placeholder:text-[#0A1628]/30 focus:outline-none focus:border-[#FF6648] focus:shadow-[0_0_0_4px_rgba(255,102,72,0.1)] transition-all disabled:opacity-60"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="px-8 py-4 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center justify-center gap-2 shrink-0"
            style={{ minWidth: "160px" }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Checking...
              </>
            ) : (
              <>Check AI Agent Access</>
            )}
          </button>
        </div>

        <div className="flex items-center gap-4 mt-3 text-xs text-[#0A1628]/40">
          <span>276 brands tracked</span>
          <span className="w-1 h-1 rounded-full bg-[#0A1628]/20" />
          <span>Real data</span>
          <span className="w-1 h-1 rounded-full bg-[#0A1628]/20" />
          <span>100% free</span>
        </div>
      </form>

      {/* ── Loading State ───────────────────────────────────────── */}
      {loading && (
        <div className="mt-8 max-w-2xl mx-auto lg:mx-0">
          <div
            className="border border-[#0A1628]/10 bg-white p-6"
            style={{ boxShadow: "0 4px 24px rgba(10,22,40,0.06)" }}
          >
            <div className="space-y-3">
              {LOADING_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const isActive = i === loadingStep;
                const isDone = i < loadingStep;

                return (
                  <div
                    key={step.message}
                    className={`flex items-center gap-3 transition-all duration-300 ${
                      isDone
                        ? "opacity-50"
                        : isActive
                        ? "opacity-100"
                        : "opacity-20"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2
                        size={16}
                        className="text-[#059669] shrink-0"
                      />
                    ) : isActive ? (
                      <Loader2
                        size={16}
                        className="text-[#FF6648] animate-spin shrink-0"
                      />
                    ) : (
                      <StepIcon
                        size={16}
                        className="text-[#0A1628]/20 shrink-0"
                      />
                    )}
                    <span
                      className={`text-sm ${
                        isActive
                          ? "text-[#0A1628] font-medium"
                          : "text-[#0A1628]/50"
                      }`}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {step.message}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-5 h-1 bg-[#0A1628]/5 overflow-hidden">
              <div
                className="h-full bg-[#FF6648] transition-all duration-1000 ease-out"
                style={{
                  width: `${((loadingStep + 1) / LOADING_STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────── */}
      {error && !loading && (
        <div className="mt-6 max-w-2xl mx-auto lg:mx-0">
          <div className="border border-[#dc2626]/20 bg-[#dc2626]/5 p-4 flex items-start gap-3">
            <AlertCircle size={16} className="text-[#dc2626] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#dc2626]">{error}</p>
              <p className="text-xs text-[#dc2626]/60 mt-1">
                Make sure the URL is correct and the site is publicly accessible.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ─────────────────────────────────────────────── */}
      {result && !loading && (
        <div ref={resultRef} className="mt-10">
          <ResultsDisplay result={result} />
        </div>
      )}
    </div>
  );
}

// ── Results Display ────────────────────────────────────────────────────

function ResultsDisplay({ result }: { result: InstantCheckResult }) {
  const topIssues = result.issues.slice(0, 3);

  return (
    <div
      className="border border-[#E8E0D8] overflow-hidden"
      style={{
        backgroundColor: "#FFF8F0",
        boxShadow: "0 20px 60px rgba(10,22,40,0.08), 0 2px 8px rgba(10,22,40,0.04)",
      }}
    >
      {/* ── Results Header ──────────────────────────────────── */}
      <div
        className="p-6 sm:p-8"
        style={{ backgroundColor: "#0A1628" }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Summary icon */}
          <div className="relative shrink-0 w-20 h-20 flex items-center justify-center rounded-sm" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
            {result.blockedAgentCount > 0 ? (
              <ShieldAlert size={36} className="text-[#FF6648]" />
            ) : (
              <ShieldCheck size={36} className="text-[#059669]" />
            )}
          </div>

          {/* Result info */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex items-center gap-3 justify-center sm:justify-start mb-2">
              <span
                className="text-xs font-bold px-3 py-1 rounded-sm"
                style={{
                  backgroundColor: "rgba(2,89,221,0.15)",
                  color: "#84AFFB",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                AI AGENT ACCESS CHECK
              </span>
            </div>

            <h3
              className="text-lg font-bold text-white mb-1 truncate max-w-md"
              title={result.url}
            >
              {new URL(result.url).hostname}
            </h3>

            <p className="text-xs text-white/40" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Checked {new Date(result.checkedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {new Date(result.checkedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </p>

            <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
              <div className="flex items-center gap-1.5">
                {result.blockedAgentCount > 0 ? (
                  <ShieldAlert size={14} className="text-[#dc2626]" />
                ) : (
                  <ShieldCheck size={14} className="text-[#059669]" />
                )}
                <span
                  className="text-xs text-white/60"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  {result.blockedAgentCount}/{result.totalAgentsChecked} agents blocked in robots.txt
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Agent Access Grid ─────────────────────────────────── */}
      <div className="p-6 sm:p-8 border-b border-[#E8E0D8]">
        <div className="flex items-center gap-3 mb-1">
          <Shield size={14} className="text-[#0259DD]" />
          <span
            className="text-[10px] font-bold text-[#0A1628]/50 tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            AI AGENT ACCESS — ROBOTS.TXT
          </span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
          <span
            className="text-[9px] font-bold text-[#059669] tracking-wider px-2 py-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", backgroundColor: "rgba(5,150,105,0.08)" }}
          >
            HIGH CONFIDENCE
          </span>
        </div>
        <p className="text-[11px] text-[#0A1628]/40 mb-5">Based on the actual robots.txt file served by this domain.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {result.agentAccess.map((agent) => (
            <AgentBadge key={agent.agent} agent={agent} />
          ))}
        </div>

        <div className="flex items-center gap-5 mt-4 text-[10px] text-[#0A1628]/40">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#059669]" />
            <span>Allowed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#dc2626]" />
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0259DD]" />
            <span>No rule (default allow)</span>
          </div>
        </div>
      </div>

      {/* ── Structured Data ───────────────────────────────────── */}
      <div className="p-6 sm:p-8 border-b border-[#E8E0D8]">
        <div className="flex items-center gap-3 mb-1">
          <FileJson size={14} className="text-[#7C3AED]" />
          <span
            className="text-[10px] font-bold text-[#0A1628]/50 tracking-wider"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            STRUCTURED DATA & MARKUP
          </span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
          <span
            className="text-[9px] font-bold text-[#d97706] tracking-wider px-2 py-0.5"
            style={{ fontFamily: "'JetBrains Mono', monospace", backgroundColor: "rgba(217,119,6,0.08)" }}
          >
            LIGHTWEIGHT CHECK
          </span>
        </div>
        <p className="text-[11px] text-[#0A1628]/40 mb-5">Our quick check may not detect JavaScript-rendered data. A full scan provides more detail.</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <DataCheckCard
            label="JSON-LD"
            found={result.structuredData.hasJsonLd}
          />
          <DataCheckCard
            label="Product Schema"
            found={result.structuredData.hasSchemaProduct}
          />
          <DataCheckCard
            label="Open Graph"
            found={result.structuredData.hasOpenGraph}
          />
          <DataCheckCard
            label="Product Feed"
            found={result.structuredData.hasProductFeed}
          />
        </div>
      </div>

      {/* ── Potential Issues ──────────────────────────────────── */}
      {topIssues.length > 0 && (
        <div className="p-6 sm:p-8 border-b border-[#E8E0D8]">
          <div className="flex items-center gap-3 mb-1">
            <Info size={14} className="text-[#FF6648]" />
            <span
              className="text-[10px] font-bold text-[#0A1628]/50 tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              POTENTIAL ISSUES
            </span>
            <div className="flex-1 h-px bg-[#E8E0D8]" />
          </div>
          <p className="text-[11px] text-[#0A1628]/40 mb-5">Based on our quick check. Some items may require a deeper scan to confirm.</p>

          <div className="space-y-3">
            {topIssues.map((issue, i) => (
              <IssueRow key={i} issue={issue} />
            ))}
          </div>
        </div>
      )}

      {/* ── Learn More ────────────────────────────────────────── */}
      <div
        className="p-6 sm:p-8"
        style={{ backgroundColor: "#0A1628" }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="flex-1 text-center sm:text-left">
            <h4 className="text-base font-bold text-white mb-1">
              Want to learn more?
            </h4>
            <p className="text-xs text-white/50 leading-relaxed max-w-md">
              Our Guide to Agentic Commerce explains what these results mean, why they matter,
              and what the smartest brands are doing about it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <Link
              href="/guide"
              className="flex items-center gap-2 px-6 py-3 bg-[#0259DD] text-white text-sm font-bold hover:bg-[#024BBB] transition-colors"
            >
              Read our Guide to Agentic Commerce
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Agent Badge ────────────────────────────────────────────────────────

function AgentBadge({ agent }: { agent: AgentAccess }) {
  const statusConfig = {
    allowed: {
      bg: "bg-[#059669]/8",
      border: "border-[#059669]/20",
      icon: <ShieldCheck size={14} className="text-[#059669]" />,
      label: "ALLOWED",
      labelColor: "text-[#059669]",
    },
    blocked: {
      bg: "bg-[#dc2626]/8",
      border: "border-[#dc2626]/20",
      icon: <ShieldAlert size={14} className="text-[#dc2626]" />,
      label: "BLOCKED",
      labelColor: "text-[#dc2626]",
    },
    no_rule: {
      bg: "bg-[#0259DD]/8",
      border: "border-[#0259DD]/15",
      icon: <ShieldQuestion size={14} className="text-[#0259DD]" />,
      label: "NO RULE",
      labelColor: "text-[#0259DD]",
    },
  };

  const config = statusConfig[agent.status];

  return (
    <div
      className={`${config.bg} border ${config.border} p-3 flex flex-col gap-2`}
    >
      <div className="flex items-center justify-between">
        {config.icon}
        <span
          className={`text-[8px] font-bold tracking-wider ${config.labelColor}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {config.label}
        </span>
      </div>
      <div>
        <div
          className="text-xs font-bold text-[#0A1628] truncate"
          title={agent.agent}
        >
          {agent.agent}
        </div>
        <div className="text-[10px] text-[#0A1628]/40 truncate">
          {agent.company}
        </div>
      </div>
    </div>
  );
}

// ── Data Check Card ────────────────────────────────────────────────────

function DataCheckCard({ label, found }: { label: string; found: boolean }) {
  return (
    <div
      className={`p-3 border ${
        found
          ? "bg-[#059669]/5 border-[#059669]/15"
          : "bg-[#0A1628]/3 border-[#0A1628]/8"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {found ? (
          <CheckCircle2 size={14} className="text-[#059669]" />
        ) : (
          <ShieldQuestion size={14} className="text-[#0A1628]/30" />
        )}
        <span
          className={`text-[9px] font-bold tracking-wider ${
            found ? "text-[#059669]" : "text-[#0A1628]/40"
          }`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {found ? "DETECTED" : "NOT DETECTED"}
        </span>
      </div>
      <div className="text-xs font-semibold text-[#0A1628]">{label}</div>
    </div>
  );
}

// ── Issue Row ──────────────────────────────────────────────────────────

function IssueRow({ issue }: { issue: Issue }) {
  const severityConfig = {
    critical: {
      color: "#FF6648",
      bg: "bg-[#FF6648]/6",
      border: "border-[#FF6648]/12",
      label: "WORTH CHECKING",
      icon: <AlertTriangle size={14} className="text-[#FF6648]" />,
    },
    high: {
      color: "#d97706",
      bg: "bg-[#d97706]/6",
      border: "border-[#d97706]/12",
      label: "WORTH CHECKING",
      icon: <Info size={14} className="text-[#d97706]" />,
    },
    medium: {
      color: "#0A1628",
      bg: "bg-[#0A1628]/3",
      border: "border-[#0A1628]/8",
      label: "NOTE",
      icon: <Info size={14} className="text-[#0A1628]/40" />,
    },
  };

  const config = severityConfig[issue.severity];

  return (
    <div className={`${config.bg} border ${config.border} p-3 flex items-start gap-3`}>
      <div className="shrink-0 mt-0.5">{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[8px] font-bold tracking-wider px-1.5 py-0.5"
            style={{
              color: config.color,
              backgroundColor: `${config.color}10`,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {config.label}
          </span>
        </div>
        <p className="text-xs font-medium text-[#0A1628] mt-1 leading-relaxed">
          {issue.title}
        </p>
      </div>
    </div>
  );
}
