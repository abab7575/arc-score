"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Eye, Database, ArrowRight, TrendingUp, AlertTriangle, Zap, Mail, Bot, XCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface IndexHeroProps {
  onSearch: (query: string) => void;
}

export function IndexHero({ onSearch }: IndexHeroProps) {
  const [query, setQuery] = useState("");

  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ backgroundColor: "#FFF8F0" }}>
        {/* Retro grid — bolder */}
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,102,72,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(2,89,221,0.06) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Cassette diagonal stripes — more visible */}
        <div className="absolute top-0 right-0 w-[50%] h-full pointer-events-none z-[1] overflow-hidden">
          <div
            className="absolute top-[-20%] right-[-10%] w-[120%] h-[140%]"
            style={{
              background: "repeating-linear-gradient(-65deg, transparent, transparent 20px, rgba(255,102,72,0.06) 20px, rgba(255,102,72,0.06) 22px)",
            }}
          />
        </div>

        {/* Accent dots — bigger, more vivid */}
        <div className="absolute top-8 left-[5%] w-40 h-40 rounded-full border-2 border-[#0259DD]/8 z-[1]" />
        <div className="absolute top-14 left-[6%] w-28 h-28 rounded-full border border-[#FF6648]/10 z-[1]" />
        <div className="absolute bottom-16 left-[10%] w-3.5 h-3.5 rounded-full bg-[#FF6648] z-[1]" style={{ boxShadow: "0 0 12px rgba(255,102,72,0.4)" }} />
        <div className="absolute top-24 right-[18%] w-3 h-3 rounded-full bg-[#FBBA16] z-[1]" style={{ boxShadow: "0 0 10px rgba(251,186,22,0.4)" }} />
        <div className="absolute bottom-32 right-[8%] w-2 h-2 rounded-full bg-[#0259DD] z-[1]" style={{ boxShadow: "0 0 8px rgba(2,89,221,0.3)" }} />

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10 sm:pb-14">

          {/* Top spec line */}
          <div className="flex items-center gap-3 mb-8 opacity-60">
            <div className="flex-1 h-px" style={{ background: "repeating-linear-gradient(90deg, rgba(10,22,40,0.15), rgba(10,22,40,0.15) 4px, transparent 4px, transparent 8px)" }} />
            <span className="spec-label text-[#0A1628]/50">LIVE — SCANNING DAILY</span>
            <span className="w-2 h-2 rounded-full bg-[#059669] blink" />
            <div className="flex-1 h-px" style={{ background: "repeating-linear-gradient(90deg, rgba(10,22,40,0.15), rgba(10,22,40,0.15) 4px, transparent 4px, transparent 8px)" }} />
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-14">

            {/* Left — Message */}
            <div className="flex-1 text-center lg:text-left pt-2">
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-[#0A1628] tracking-tighter leading-[0.92] mb-5"
                style={{
                  textShadow: "2px 2px 0 rgba(255,102,72,0.15), 3px 3px 0 rgba(2,89,221,0.06)",
                }}
              >
                Can AI Agents<br />
                Shop Your<br />
                Store?
              </h1>

              <p className="text-sm sm:text-base text-[#0A1628]/65 max-w-md leading-relaxed mb-2 mx-auto lg:mx-0">
                Your customers are sending{" "}
                <span className="font-semibold text-[#0A1628]">ChatGPT, Perplexity, and Google AI</span>{" "}
                to buy for them. If your site isn&apos;t ready, you lose the sale — silently.
              </p>
              <p className="text-sm text-[#0A1628]/45 max-w-md leading-relaxed mb-6 mx-auto lg:mx-0">
                We send 5 robot shoppers to your store. They try to find products, add to cart, and check out.
                You get a score, the findings, and exactly how to fix it.
              </p>

              {/* Value props — compact, punchy */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-2 text-xs text-[#0A1628]/50">
                  <div className="w-5 h-5 bg-[#FF6648] flex items-center justify-center shrink-0">
                    <Eye size={11} className="text-white" />
                  </div>
                  <span><strong className="text-[#0A1628]/70">See</strong> where agents get stuck</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#0A1628]/50">
                  <div className="w-5 h-5 bg-[#0259DD] flex items-center justify-center shrink-0">
                    <AlertTriangle size={11} className="text-white" />
                  </div>
                  <span><strong className="text-[#0A1628]/70">Find</strong> what&apos;s broken</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#0A1628]/50">
                  <div className="w-5 h-5 bg-[#059669] flex items-center justify-center shrink-0">
                    <Zap size={11} className="text-white" />
                  </div>
                  <span><strong className="text-[#0A1628]/70">Fix</strong> it in hours</span>
                </div>
              </div>

              {/* Search */}
              <div className="max-w-md relative group mx-auto lg:mx-0">
                <Search
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0A1628]/25 group-focus-within:text-[#FF6648] transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search 276 brands..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    onSearch(e.target.value);
                  }}
                  className="w-full pl-11 pr-24 py-3.5 border-2 border-[#0A1628]/10 bg-white text-sm text-[#0A1628] placeholder:text-[#0A1628]/25 focus:outline-none focus:border-[#FF6648] focus:shadow-[0_0_0_3px_rgba(255,102,72,0.1)] transition-all font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 spec-label text-[#0A1628]/15">SEARCH</span>
              </div>

              {/* CTA row */}
              <div className="flex items-center gap-3 mt-4 justify-center lg:justify-start">
                <Link
                  href="/submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors"
                  style={{ boxShadow: "3px 3px 0 rgba(10,22,40,0.08)" }}
                >
                  Submit Your Site
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/pricing"
                  className="text-sm font-medium text-[#0A1628]/50 hover:text-[#0A1628] transition-colors"
                >
                  View Plans →
                </Link>
              </div>
            </div>

            {/* Right — Product Preview */}
            <div className="w-full max-w-sm lg:max-w-[420px] shrink-0">
              <ReportPreview />
            </div>
          </div>

          {/* Bottom spec line */}
          <div className="mt-10 opacity-30">
            <div className="h-px" style={{ background: "repeating-linear-gradient(90deg, rgba(10,22,40,0.15), rgba(10,22,40,0.15) 4px, transparent 4px, transparent 8px)" }} />
          </div>
        </div>

        {/* Color block strip — thicker */}
        <div className="flex h-[8px] relative z-10">
          <div className="flex-1 bg-[#FF6648]" />
          <div className="flex-1 bg-[#FBBA16]" />
          <div className="flex-1 bg-[#0259DD]" />
          <div className="flex-1 bg-[#84AFFB]" />
          <div className="flex-1 bg-[#FFE1D7]" />
          <div className="flex-1 bg-[#059669]" />
        </div>
      </div>

      {/* ── Brand Logo Ticker ────────────────────────────────────────── */}
      <BrandLogoTicker />

      {/* ── Email Capture ──────────────────────────────────────────── */}
      <EmailCapture />

      {/* ── How We Score ────────────────────────────────────────────── */}
      <HowWeScore />

      {/* ── Why It Matters ──────────────────────────────────────────── */}
      <WhyItMatters />
    </>
  );
}

/* ── Report Preview — "this is what you get" ─────────────────────────── */

function ReportPreview() {
  return (
    <div
      className="bg-white border-2 border-[#0A1628]/10 overflow-hidden relative"
      style={{ boxShadow: "6px 6px 0 rgba(10,22,40,0.06)" }}
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#0A1628]/8 bg-[#FAFAF8]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF6648]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FBBA16]/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#059669]/60" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="spec-label text-[8px] text-[#0A1628]/30">robotshopper.com/brand/glossier</span>
        </div>
      </div>

      {/* Score section */}
      <div className="px-5 pt-5 pb-3 text-center border-b border-[#0A1628]/5">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-[3px] border-[#059669] mb-2" style={{ boxShadow: "0 0 20px rgba(5,150,105,0.1)" }}>
          <span className="data-num text-3xl font-black text-[#059669]">87</span>
        </div>
        <div className="text-xs font-bold text-[#0A1628]">Glossier</div>
        <div className="spec-label text-[8px] text-[#059669] mt-0.5">GRADE A — AGENT-READY</div>
      </div>

      {/* Category bars preview */}
      <div className="px-5 py-3 border-b border-[#0A1628]/5">
        <div className="spec-label text-[7px] text-[#0A1628]/30 mb-2">SCORE BREAKDOWN</div>
        <div className="space-y-1.5">
          <MiniBar label="DISCOVER" score={100} color="#059669" />
          <MiniBar label="CART" score={100} color="#059669" />
          <MiniBar label="DATA" score={95} color="#059669" />
          <MiniBar label="NAVIGATE" score={77} color="#0259DD" />
          <MiniBar label="PRODUCT" score={75} color="#FBBA16" />
        </div>
      </div>

      {/* Finding preview — shows the "diagnostic" value */}
      <div className="px-5 py-3 border-b border-[#0A1628]/5">
        <div className="spec-label text-[7px] text-[#0A1628]/30 mb-2">FINDING DETECTED</div>
        <div className="flex items-start gap-2 px-3 py-2.5 bg-[#FFF8F0] border-l-2 border-[#ea580c]">
          <AlertTriangle size={12} className="text-[#ea580c] shrink-0 mt-0.5" />
          <div>
            <div className="text-[11px] font-semibold text-[#0A1628]">Missing product schema markup</div>
            <div className="text-[10px] text-[#0A1628]/45 mt-0.5">Feed agents can&apos;t read prices or availability</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="spec-label text-[7px] px-1.5 py-0.5 bg-[#ea580c]/10 text-[#ea580c]">HIGH</span>
              <span className="spec-label text-[7px] px-1.5 py-0.5 bg-[#059669]/10 text-[#059669]">+12 PTS IF FIXED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent journey preview — shows the "replay" value */}
      <div className="px-5 py-3 border-b border-[#0A1628]/5">
        <div className="spec-label text-[7px] text-[#0A1628]/30 mb-2">AGENT JOURNEY</div>
        <div className="flex items-center gap-2">
          {/* Step dots */}
          <div className="flex items-center gap-1">
            <StepDot result="pass" />
            <StepDot result="pass" />
            <StepDot result="pass" />
            <StepDot result="partial" />
            <StepDot result="fail" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <Bot size={10} className="text-[#0259DD] shrink-0" />
              <span className="text-[10px] font-semibold text-[#0A1628] truncate">ChatGPT Operator trying to checkout...</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <XCircle size={9} className="text-[#dc2626]" />
              <span className="text-[9px] text-[#dc2626]">Stuck on payment form — no guest checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action plan preview */}
      <div className="px-5 py-3">
        <div className="spec-label text-[7px] text-[#0A1628]/30 mb-2">ACTION PLAN</div>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="data-num text-sm font-bold text-[#ea580c]">87</span>
            <ArrowRight size={10} className="text-[#0A1628]/20" />
            <span className="data-num text-sm font-bold text-[#059669]">94</span>
          </div>
          <span className="spec-label text-[7px] text-[#059669]">+7 POINTS POSSIBLE</span>
        </div>
        <div className="space-y-1">
          <ActionRow num="1" text="Add JSON-LD product schema" pts="+12" />
          <ActionRow num="2" text="Enable guest checkout" pts="+8" />
          <ActionRow num="3" text="Allow GPTBot in robots.txt" pts="+5" />
        </div>
      </div>

      {/* CTA overlay */}
      <a
        href="/brand/glossier"
        className="flex items-center justify-center gap-2 py-2.5 bg-[#0259DD] text-white text-xs font-bold hover:bg-[#0249BB] transition-colors"
      >
        View Full Report
        <ChevronRight size={12} />
      </a>
    </div>
  );
}

function StepDot({ result }: { result: "pass" | "partial" | "fail" }) {
  const color = result === "pass" ? "#059669" : result === "partial" ? "#FBBA16" : "#dc2626";
  return (
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
  );
}

function ActionRow({ num, text, pts }: { num: string; text: string; pts: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px]">
      <span className="data-num text-[9px] font-bold text-[#0A1628]/25 w-3">{num}</span>
      <span className="text-[#0A1628]/60 flex-1 truncate">{text}</span>
      <span className="data-num text-[9px] font-bold text-[#059669]">{pts}</span>
    </div>
  );
}

function MiniBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="spec-label text-[#0A1628]/25 text-[7px] w-14 text-right shrink-0">{label}</span>
      <div className="flex-1 h-[4px] bg-[#0A1628]/5 overflow-hidden">
        <div className="h-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="data-num text-[9px] font-bold w-6 text-right shrink-0" style={{ color }}>{score}</span>
    </div>
  );
}

/* ── Brand Logo Ticker ─────────────────────────────────────────────── */

const TICKER_BRANDS = [
  "Nike", "Apple", "Adidas", "Samsung", "Glossier", "Lululemon", "Nordstrom",
  "Sephora", "Target", "Zara", "H&M", "Gap", "ASOS", "Uniqlo", "Puma",
  "Everlane", "Warby Parker", "Bombas", "Patagonia", "Allbirds",
];

function BrandLogoTicker() {
  const doubled = [...TICKER_BRANDS, ...TICKER_BRANDS];

  return (
    <div className="bg-white border-b border-[#E8E0D8] overflow-hidden py-5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-4">
        <div className="flex items-center gap-3">
          <span className="spec-label text-muted-foreground text-[9px]">WE SCORE BRANDS YOU KNOW</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
          <span className="spec-label text-muted-foreground/50 text-[9px]">276+ TRACKED</span>
        </div>
      </div>

      <div className="relative overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)" }}>
        <div
          className="flex items-center gap-8"
          style={{
            animation: "ticker 35s linear infinite",
            width: "max-content",
          }}
        >
          {doubled.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="text-sm font-bold text-foreground/20 whitespace-nowrap tracking-tight shrink-0"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

/* ── Email Capture ─────────────────────────────────────────────────── */

function EmailCapture() {
  const [email, setEmail] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, brandUrl: brandUrl || undefined }),
      });
      setSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: "#FFF8F0" }} className="border-b border-[#E8E0D8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-5">
          <Mail size={12} className="text-[#FF6648]" />
          <span className="spec-label text-muted-foreground text-[9px]">GET NOTIFIED</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        <div className="border border-[#E8E0D8] bg-white p-5 sm:p-6">
          {submitted ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#059669]/10 border border-[#059669]/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-[#059669]" />
                <span className="spec-label text-[#059669] text-[10px]">CONFIRMED</span>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">We&apos;ll be in touch!</h3>
              <p className="text-xs text-muted-foreground">You&apos;ll hear from us as soon as your score is ready.</p>
            </div>
          ) : (
            <>
              <h3 className="text-base sm:text-lg font-bold text-foreground mb-1">
                Get notified when we scan your brand
              </h3>
              <p className="text-xs text-muted-foreground mb-5">
                Enter your email and brand URL. We&apos;ll alert you when your score is ready.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                <div className="flex-1 min-w-0">
                  <label className="spec-label text-[9px] text-muted-foreground mb-1.5 block">EMAIL *</label>
                  <input type="email" required placeholder="you@company.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E8E0D8] bg-[#FFF8F0] text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#FF6648]/50 transition-colors font-mono"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <label className="spec-label text-[9px] text-muted-foreground mb-1.5 block">BRAND URL <span className="text-muted-foreground/40">(OPTIONAL)</span></label>
                  <input type="url" placeholder="https://yourbrand.com" value={brandUrl}
                    onChange={(e) => setBrandUrl(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E8E0D8] bg-[#FFF8F0] text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-[#FF6648]/50 transition-colors font-mono"
                  />
                </div>
                <button type="submit" disabled={loading}
                  className="px-6 py-2.5 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {loading ? "Sending..." : "Notify Me"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Why It Matters ─────────────────────────────────────────────────── */

function WhyItMatters() {
  const agents = [
    { name: "ChatGPT Shopping", type: "Feed" },
    { name: "Google AI Mode", type: "Feed" },
    { name: "Perplexity Shopping", type: "Feed" },
    { name: "Amazon Buy For Me", type: "Browser" },
    { name: "ChatGPT Operator", type: "Browser" },
    { name: "Claude Computer Use", type: "Vision" },
    { name: "Microsoft Copilot", type: "Feed" },
    { name: "Klarna AI", type: "Feed" },
    { name: "Perplexity Comet", type: "Browser" },
    { name: "OpenClaw", type: "Browser" },
  ];

  return (
    <div className="bg-[#FAFAF8] border-b border-[#E8E0D8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="spec-label text-muted-foreground text-[9px]">THE PROBLEM</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="border border-[#E8E0D8] bg-white p-5">
            <div className="w-9 h-9 flex items-center justify-center bg-[#FF6648] mb-3">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">Lost sales you can&apos;t see</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When an AI agent fails to buy on your site, there&apos;s no abandoned cart.
              No analytics event. The customer just buys from whoever the agent tries next.
            </p>
          </div>
          <div className="border border-[#E8E0D8] bg-white p-5">
            <div className="w-9 h-9 flex items-center justify-center bg-[#0259DD] mb-3">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">5 agents, 10 scoring lenses</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We send 5 specialized agents to test your site — browser, data,
              accessibility, visual, and feed. Then score through 10 real AI
              shopping agent lenses.
            </p>
          </div>
          <div className="border border-[#E8E0D8] bg-white p-5">
            <div className="w-9 h-9 flex items-center justify-center bg-[#059669] mb-3">
              <Zap size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">Fixable in hours, not months</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Most failures come from missing labels, blocked bots, or absent
              structured data. Small fixes that take hours, not engineering sprints.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <span className="spec-label text-muted-foreground text-[9px]">WE SCORE AGAINST 10 REAL AI SHOPPING AGENT LENSES</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {agents.map((agent) => (
            <div key={agent.name} className="flex items-center gap-2 px-3 py-1.5 border border-[#E8E0D8] bg-white text-xs">
              <span className="font-semibold text-foreground">{agent.name}</span>
              <span className="spec-label text-[8px] text-muted-foreground">{agent.type.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#E8E0D8]">
          <div className="flex-1">
            <p className="text-sm text-foreground font-semibold">See how your brand scores — or browse the index below.</p>
            <p className="text-xs text-muted-foreground mt-0.5">Free scores for every brand. Detailed findings and action plans with a paid plan.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/submit" className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors">
              Submit Your Site <ArrowRight size={14} />
            </Link>
            <Link href="/pricing" className="flex items-center gap-2 px-5 py-2.5 border border-[#E8E0D8] text-sm font-medium text-foreground hover:bg-gray-50 transition-colors">
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── How We Score ──────────────────────────────────────────────────────── */

function HowWeScore() {
  const steps = [
    { icon: Eye, number: "01", color: "#FF6648", title: "We send robot shoppers", desc: "Five AI agents visit your site — one browses like a customer, one reads data feeds, one tests accessibility, one uses AI vision, and one checks your product feeds." },
    { icon: ShoppingCart, number: "02", color: "#0259DD", title: "They try to buy something", desc: "Can they find products? Add to cart? Complete checkout? We test the full shopping journey, from homepage to payment." },
    { icon: Database, number: "03", color: "#059669", title: "You get a score + fix list", desc: "Your score shows how ready your store is — with specific findings, an action plan, and agent journey replays showing exactly what happened." },
  ];

  return (
    <div className="bg-white border-b border-[#E8E0D8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6">
          <span className="spec-label text-muted-foreground text-[9px]">HOW IT WORKS</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              <div className="shrink-0">
                <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: step.color }}>
                  <step.icon size={18} className="text-white" />
                </div>
                <div className="spec-label text-center mt-1.5 text-[9px]" style={{ color: step.color }}>{step.number}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-foreground mb-1">{step.title}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
