"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Eye, Database, ArrowRight, TrendingUp, AlertTriangle, Zap, Mail, Bot, XCircle, CheckCircle2 } from "lucide-react";

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
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8 sm:pb-12">

          {/* Two-column layout — tight */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">

            {/* Left — Message: big, bold, clear */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#0A1628] tracking-tighter leading-[0.88] mb-5"
                style={{
                  textShadow: "2px 2px 0 rgba(255,102,72,0.12), 3px 3px 0 rgba(2,89,221,0.05)",
                }}
              >
                AI agents are<br />
                shopping for<br />
                your customers.
              </h1>

              <p className="text-lg sm:text-xl text-[#0A1628]/70 max-w-lg leading-relaxed mb-6 mx-auto lg:mx-0">
                <strong className="text-[#0A1628]">84 million shopping queries</strong> hit ChatGPT every week.
                We send AI agents to your store and show you exactly where they fail — with screenshots, cursor replays, and a fix list.
              </p>

              {/* Search */}
              <div className="max-w-lg relative group mx-auto lg:mx-0 mb-4">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#0A1628]/25 group-focus-within:text-[#FF6648] transition-colors"
                />
                <input
                  type="text"
                  placeholder="Check your brand's score..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    onSearch(e.target.value);
                  }}
                  className="w-full pl-12 pr-32 py-4 border-2 border-[#0A1628]/12 bg-white text-base text-[#0A1628] placeholder:text-[#0A1628]/30 focus:outline-none focus:border-[#FF6648] focus:shadow-[0_0_0_4px_rgba(255,102,72,0.1)] transition-all"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors"
                >
                  Search
                </button>
              </div>

              <div className="flex items-center gap-4 justify-center lg:justify-start text-xs text-[#0A1628]/40">
                <span>276 brands scored</span>
                <span className="w-1 h-1 rounded-full bg-[#0A1628]/20" />
                <span>Updated weekly</span>
                <span className="w-1 h-1 rounded-full bg-[#0A1628]/20" />
                <span>Free to check</span>
              </div>
            </div>

            {/* Right — Agent Replay: the "oh shit" moment */}
            <div className="w-full max-w-md lg:max-w-[440px] shrink-0">
              <AgentReplayPreview />
            </div>
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

/* ── Agent Replay Preview — the "oh shit" moment ─────────────────────── */

function AgentReplayPreview() {
  return (
    <div className="relative overflow-hidden bg-[#0A1628] border-2 border-[#0A1628]/20" style={{ boxShadow: "6px 6px 0 rgba(10,22,40,0.08)" }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-[#0A1628]">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF6648]/60" />
          <div className="w-2 h-2 rounded-full bg-[#FBBA16]/60" />
          <div className="w-2 h-2 rounded-full bg-[#059669]/60" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="spec-label text-[7px] text-white/25">nike.com/checkout</span>
        </div>
      </div>

      {/* Fake website screenshot area */}
      <div className="relative" style={{ height: 200, background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)" }}>
        {/* Fake checkout form elements */}
        <div className="absolute inset-0 p-4">
          {/* Fake nav bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-12 h-3 bg-white/10 rounded" />
            <div className="flex-1" />
            <div className="w-6 h-3 bg-white/8 rounded" />
            <div className="w-6 h-3 bg-white/8 rounded" />
          </div>
          {/* Fake form */}
          <div className="max-w-[200px] mx-auto space-y-2">
            <div className="w-20 h-2.5 bg-white/15 rounded" />
            <div className="w-full h-5 bg-white/8 rounded border border-white/10" />
            <div className="w-16 h-2.5 bg-white/15 rounded" />
            <div className="w-full h-5 bg-white/8 rounded border border-white/10" />
            <div className="flex gap-2">
              <div className="flex-1 h-5 bg-white/8 rounded border border-white/10" />
              <div className="w-16 h-5 bg-white/8 rounded border border-white/10" />
            </div>
            <div className="w-24 h-2.5 bg-white/15 rounded mt-1" />
            <div className="w-full h-7 bg-white/5 rounded border border-white/10 flex items-center justify-center">
              <span className="text-[8px] text-white/20">Sign in to continue</span>
            </div>
          </div>
        </div>

        {/* Vignette/spotlight effect */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle 60px at 65% 72%, transparent 0%, rgba(10,22,40,0.7) 100%)",
          }}
        />

        {/* Cursor */}
        <div className="absolute" style={{ left: "63%", top: "68%", transform: "translate(-2px, -2px)" }}>
          {/* Cursor arrow */}
          <svg width="14" height="18" viewBox="0 0 14 18" fill="none" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
            <path d="M1 1L1 15L5 11L9 17L11 16L7 10L13 9L1 1Z" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
          </svg>
          {/* Red ripple */}
          <div
            className="absolute rounded-full border-2 border-[#dc2626]"
            style={{
              width: 24, height: 24, top: -4, left: -4,
              opacity: 0.5,
              animation: "pulse-ring 2s ease-out infinite",
            }}
          />
        </div>

        {/* STUCK label with glitch effect */}
        <div className="absolute" style={{ left: "53%", top: "52%", transform: "translateX(-50%)" }}>
          <span
            className="font-mono text-sm font-bold tracking-widest text-[#dc2626]"
            style={{
              textShadow: "2px 0 #FF6648, -2px 0 #0259DD",
              animation: "glitch 3s infinite",
            }}
          >
            STUCK
          </span>
        </div>

        {/* Thought bubble */}
        <div className="absolute bg-white/95 backdrop-blur-sm rounded-lg border border-[#dc2626]/30 px-2.5 py-1.5 max-w-[160px]"
          style={{ right: 12, top: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
        >
          <span className="text-[9px] leading-relaxed">
            <strong className="text-[#dc2626]">Agent:</strong>{" "}
            <span className="text-[#0A1628]/70">Looking for guest checkout... no option found. Login required.</span>
          </span>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="px-3 py-2.5 border-t border-white/10 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <StepDot result="pass" />
          <StepDot result="pass" />
          <StepDot result="pass" />
          <StepDot result="partial" />
          <StepDot result="fail" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[9px] font-semibold text-white/70">ChatGPT Operator</span>
          <span className="text-[9px] text-white/30 ml-1">· Step 5/5</span>
        </div>
        <span className="spec-label text-[7px] text-[#dc2626]">BLOCKED</span>
      </div>

      {/* Human vs Agent gap */}
      <div className="px-3 py-2.5 border-t border-white/10 bg-[#0A1628]">
        <div className="flex items-center gap-1.5 mb-2">
          <Eye size={9} className="text-[#FBBA16]" />
          <span className="spec-label text-[7px] text-[#FBBA16]">HUMAN VS AGENT GAP</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-start gap-1.5">
            <CheckCircle2 size={9} className="text-[#059669] shrink-0 mt-0.5" />
            <span className="text-[9px] text-white/50">Human sees a login form and creates an account</span>
          </div>
          <div className="flex items-start gap-1.5">
            <XCircle size={9} className="text-[#dc2626] shrink-0 mt-0.5" />
            <span className="text-[9px] text-white/50">Agent can&apos;t create accounts — needs guest checkout</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 0; }
        }
        @keyframes glitch {
          0%, 90%, 100% { transform: translateX(-50%); }
          92% { transform: translateX(calc(-50% + 2px)); }
          94% { transform: translateX(calc(-50% - 3px)); }
          96% { transform: translateX(calc(-50% + 1px)); }
          98% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

function StepDot({ result }: { result: "pass" | "partial" | "fail" }) {
  const color = result === "pass" ? "#059669" : result === "partial" ? "#FBBA16" : "#dc2626";
  return (
    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
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
              No analytics event. We show you the exact moment the agent gets stuck —
              with screenshots, cursor tracking, and the human vs agent gap.
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
    { icon: ShoppingCart, number: "02", color: "#0259DD", title: "Watch them try to buy", desc: "You get a step-by-step replay of each agent's journey — with screenshots, cursor tracking, and the exact moment they get stuck. See the gap between what a human sees and what the agent can't do." },
    { icon: Database, number: "03", color: "#059669", title: "Get the fix list", desc: "Every issue ranked by severity and impact. 'Fix this one thing and gain +12 points.' Hand it to your dev team — most fixes take hours, not months." },
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
