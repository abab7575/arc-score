"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Eye, Database, ArrowRight, TrendingUp, AlertTriangle, Zap } from "lucide-react";

interface IndexHeroProps {
  onSearch: (query: string) => void;
}

export function IndexHero({ onSearch }: IndexHeroProps) {
  const [query, setQuery] = useState("");

  return (
    <>
      <div className="hero-bold relative">
        {/* Background layers */}
        <div className="retro-grid z-[1]" />
        <div className="scan-lines z-[1]" />
        <div className="cassette-stripes z-[1]" />

        {/* Decorative elements */}
        <div className="absolute top-8 left-[6%] w-32 h-32 rounded-full border border-[#84AFFB]/10 z-[1]" />
        <div className="absolute top-12 left-[7%] w-24 h-24 rounded-full border border-[#84AFFB]/8 z-[1]" />
        <div className="absolute bottom-12 left-[12%] w-3 h-3 rounded-full bg-[#FF6648] z-[1]" style={{ boxShadow: "0 0 12px #FF6648" }} />
        <div className="absolute top-20 right-[22%] w-2 h-2 rounded-full bg-[#FBBA16] z-[1]" style={{ boxShadow: "0 0 8px #FBBA16" }} />

        {/* ── Content ──────────────────────────────────────────────────── */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10 sm:pb-14">

          {/* Top spec line */}
          <div className="flex items-center gap-3 mb-10 opacity-40">
            <div className="flex-1 h-px" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px)" }} />
            <span className="spec-label text-white/50">LIVE — SCANNING DAILY</span>
            <span className="w-2 h-2 rounded-full bg-[#059669] blink" />
            <div className="flex-1 h-px" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px)" }} />
          </div>

          {/* ── Two-column hero layout ──────────────────────────────────── */}
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">

            {/* Left — Message */}
            <div className="flex-1 text-center lg:text-left">
              {/* The question that hooks */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-5"
                style={{
                  textShadow: "2px 2px 0 rgba(255,102,72,0.5), 4px 4px 0 rgba(132,175,251,0.25), 8px 8px 20px rgba(0,0,0,0.3)",
                }}
              >
                Can AI Agents<br />
                Shop Your<br />
                Store?
              </h1>

              {/* Clear explanation — lead with the business problem */}
              <p className="text-sm sm:text-base text-white/60 max-w-md leading-relaxed mb-3 mx-auto lg:mx-0">
                Your customers are sending AI agents to buy for them. If your
                site isn&apos;t ready, you lose the sale — silently, with no
                abandoned cart to recover.
              </p>
              <p className="text-xs text-white/35 max-w-md leading-relaxed mb-6 mx-auto lg:mx-0">
                We send 5 AI agents to your store — the same way{" "}
                <span className="text-[#FF6648]">ChatGPT</span>,{" "}
                <span className="text-[#FBBA16]">Perplexity</span>,{" "}
                <span className="text-[#84AFFB]">Google AI</span>, and{" "}
                <span className="text-white/60">Amazon Buy For Me</span>{" "}
                would. Then we tell you exactly what broke and how to fix it.
              </p>

              {/* Branding badge */}
              <div className="inline-flex items-center gap-3 px-4 py-2 border border-white/15 bg-white/[0.03] mb-6">
                <span className="spec-label text-[#FF6648]">ARC SCORE</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="spec-label text-white/50">AGENT READINESS INDEX</span>
                <span className="w-1 h-1 rounded-full bg-white/30" />
                <span className="spec-label text-[#84AFFB]">0–100</span>
              </div>

              {/* Search */}
              <div className="max-w-md relative group mx-auto lg:mx-0">
                <Search
                  size={15}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#FF6648] transition-colors"
                />
                <input
                  type="text"
                  placeholder="Search 276 brands..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    onSearch(e.target.value);
                  }}
                  className="w-full pl-11 pr-20 py-3 border border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#FF6648]/50 focus:bg-white/10 transition-all font-mono"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 spec-label text-white/20">SEARCH</span>
              </div>
            </div>

            {/* Right — Dual score preview: failing vs passing */}
            <div className="w-full max-w-xs lg:max-w-sm shrink-0 space-y-3">
              <FailingCard />
              <PassingCard />
            </div>
          </div>

          {/* Bottom spec line */}
          <div className="mt-10 opacity-25">
            <div className="h-px" style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.2) 4px, transparent 4px, transparent 8px)" }} />
          </div>
        </div>

        {/* Color block strip */}
        <div className="flex h-[6px] relative z-10">
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

      {/* ── How We Score — explainer strip ────────────────────────────── */}
      <HowWeScore />

      {/* ── Value Proposition — why this matters ─────────────────────── */}
      <WhyItMatters />
    </>
  );
}

/* ── Failing Card — "oh shit" ──────────────────────────────────────────── */

function FailingCard() {
  return (
    <div className="border border-[#dc2626]/30 bg-[#dc2626]/[0.04] backdrop-blur-sm relative overflow-hidden">
      {/* Red danger stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#dc2626]" />

      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className="w-12 h-12 flex items-center justify-center border-2 border-[#dc2626] shrink-0"
          style={{ boxShadow: "0 0 12px rgba(220,38,38,0.2)" }}
        >
          <span className="data-num text-lg font-black text-[#dc2626]">18</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Abercrombie</span>
            <span className="spec-label text-[8px] text-[#dc2626]">GRADE F</span>
          </div>
          <div className="spec-label text-[9px] text-[#dc2626]/80 mt-0.5">AGENTS BLOCKED — NOT READY</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="spec-label text-[8px] px-1.5 py-0.5 bg-[#dc2626]/15 text-[#dc2626]">CHECKOUT: FAILED</span>
            <span className="spec-label text-[8px] px-1.5 py-0.5 bg-[#dc2626]/15 text-[#dc2626]">BOTS: BLOCKED</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-1.5">
        <MiniBar label="DISCOVER" score={20} color="#dc2626" />
        <MiniBar label="CART" score={8} color="#dc2626" />
        <MiniBar label="DATA" score={15} color="#dc2626" />
      </div>

      <div className="px-4 py-2.5 border-t border-[#dc2626]/15 flex items-center justify-between">
        <span className="spec-label text-white/20 text-[8px]">AI AGENTS CAN&apos;T BUY HERE</span>
        <a href="/brand/abercrombie" className="spec-label text-[#FF6648] text-[8px] hover:text-white transition-colors cursor-pointer">SEE WHY →</a>
      </div>
    </div>
  );
}

/* ── Passing Card — "I'm good" ────────────────────────────────────────── */

function PassingCard() {
  return (
    <div className="border border-[#059669]/30 bg-[#059669]/[0.04] backdrop-blur-sm relative overflow-hidden">
      {/* Green success stripe */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#059669]" />

      <div className="px-4 py-3 flex items-center gap-3">
        <div
          className="w-12 h-12 flex items-center justify-center border-2 border-[#059669] shrink-0"
          style={{ boxShadow: "0 0 12px rgba(5,150,105,0.2)" }}
        >
          <span className="data-num text-lg font-black text-[#059669]">87</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Glossier</span>
            <span className="spec-label text-[8px] text-[#059669]">GRADE A</span>
          </div>
          <div className="spec-label text-[9px] text-[#059669]/80 mt-0.5">AGENT-READY — SALES FLOWING</div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="spec-label text-[8px] px-1.5 py-0.5 bg-[#059669]/15 text-[#059669]">CHECKOUT: WORKS</span>
            <span className="spec-label text-[8px] px-1.5 py-0.5 bg-[#059669]/15 text-[#059669]">FRICTION: LOW</span>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-1.5">
        <MiniBar label="DISCOVER" score={100} color="#059669" />
        <MiniBar label="CART" score={100} color="#059669" />
        <MiniBar label="DATA" score={95} color="#059669" />
      </div>

      <div className="px-4 py-2.5 border-t border-[#059669]/15 flex items-center justify-between">
        <span className="spec-label text-white/20 text-[8px]">AI AGENTS CAN SHOP HERE</span>
        <a href="/brand/glossier" className="spec-label text-[#FF6648] text-[8px] hover:text-white transition-colors cursor-pointer">VIEW REPORT →</a>
      </div>
    </div>
  );
}

function MiniBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="spec-label text-white/30 text-[8px] w-14 text-right shrink-0">{label}</span>
      <div className="flex-1 h-[4px] bg-white/5 overflow-hidden">
        <div className="h-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="data-num text-[10px] font-bold w-6 text-right shrink-0" style={{ color }}>{score}</span>
    </div>
  );
}

/* ── Brand Logo Ticker ─────────────────────────────────────────────── */

const TICKER_BRANDS = [
  { name: "Nike", domain: "nike.com" },
  { name: "Apple", domain: "apple.com" },
  { name: "Adidas", domain: "adidas.com" },
  { name: "Samsung", domain: "samsung.com" },
  { name: "Glossier", domain: "glossier.com" },
  { name: "Lululemon", domain: "lululemon.com" },
  { name: "Allbirds", domain: "allbirds.com" },
  { name: "Nordstrom", domain: "nordstrom.com" },
  { name: "Sephora", domain: "sephora.com" },
  { name: "Target", domain: "target.com" },
  { name: "Zara", domain: "zara.com" },
  { name: "H&M", domain: "hm.com" },
  { name: "Gap", domain: "gap.com" },
  { name: "ASOS", domain: "asos.com" },
  { name: "Uniqlo", domain: "uniqlo.com" },
  { name: "Puma", domain: "puma.com" },
  { name: "Everlane", domain: "everlane.com" },
  { name: "Warby Parker", domain: "warbyparker.com" },
  { name: "Bombas", domain: "bombas.com" },
  { name: "Patagonia", domain: "patagonia.com" },
];

function BrandLogoTicker() {
  // Double the array for seamless loop
  const doubled = [...TICKER_BRANDS, ...TICKER_BRANDS];

  return (
    <div className="bg-white border-b border-[#E8E0D8] overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="spec-label text-muted-foreground text-[9px]">WE SCORE BRANDS YOU KNOW</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
          <span className="spec-label text-muted-foreground/50 text-[9px]">276+ TRACKED</span>
        </div>
      </div>

      {/* Scrolling ticker */}
      <div className="relative">
        <div
          className="flex items-center gap-10 pb-5"
          style={{
            animation: "ticker 40s linear infinite",
            width: "max-content",
          }}
        >
          {doubled.map((brand, i) => (
            <div
              key={`${brand.domain}-${i}`}
              className="flex items-center gap-2.5 shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://logo.clearbit.com/${brand.domain}`}
                alt={brand.name}
                width={24}
                height={24}
                className="w-6 h-6 object-contain grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                loading="lazy"
              />
              <span className="text-xs font-medium text-muted-foreground/50 whitespace-nowrap">
                {brand.name}
              </span>
            </div>
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

/* ── Why It Matters — value prop bridge ─────────────────────────────── */

function WhyItMatters() {
  const agents = [
    { name: "ChatGPT Shopping", company: "OpenAI", type: "Feed" },
    { name: "Google AI Mode", company: "Google", type: "Feed" },
    { name: "Perplexity Shopping", company: "Perplexity", type: "Feed" },
    { name: "Amazon Buy For Me", company: "Amazon", type: "Browser" },
    { name: "ChatGPT Operator", company: "OpenAI", type: "Browser" },
    { name: "Claude Computer Use", company: "Anthropic", type: "Vision" },
    { name: "Microsoft Copilot", company: "Microsoft", type: "Feed" },
    { name: "Klarna AI", company: "Klarna", type: "Feed" },
    { name: "Perplexity Comet", company: "Perplexity", type: "Browser" },
    { name: "OpenClaw", company: "Open Source", type: "Browser" },
  ];

  return (
    <div className="bg-[#FAFAF8] border-b border-[#E8E0D8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="spec-label text-muted-foreground text-[9px]">THE PROBLEM</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        {/* Three stakes cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          <div className="border border-[#E8E0D8] bg-white p-5">
            <div className="w-9 h-9 flex items-center justify-center bg-[#FF6648] mb-3">
              <AlertTriangle size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">
              Lost sales you can&apos;t see
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When an AI agent fails to buy on your site, there&apos;s no abandoned cart.
              No analytics event. No retargeting pixel. The customer just buys
              from whoever the agent tries next.
            </p>
          </div>

          <div className="border border-[#E8E0D8] bg-white p-5">
            <div className="w-9 h-9 flex items-center justify-center bg-[#0259DD] mb-3">
              <TrendingUp size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">
              10 agents, 10 different ways in
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Some agents read your data feeds. Some open a browser and click.
              Some take screenshots and use vision AI. Your site needs to work
              for all of them — not just one.
            </p>
          </div>

          <div className="border border-[#E8E0D8] bg-white p-5">
            <div className="w-9 h-9 flex items-center justify-center bg-[#059669] mb-3">
              <Zap size={16} className="text-white" />
            </div>
            <h3 className="text-sm font-bold text-foreground mb-1.5">
              Fixable in hours, not months
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Most agent failures come from missing labels, blocked bots, or absent
              structured data. Small fixes that take hours, not engineering sprints.
              We tell you exactly which ones matter most.
            </p>
          </div>
        </div>

        {/* 10 AI agents ticker */}
        <div className="flex items-center gap-3 mb-4">
          <span className="spec-label text-muted-foreground text-[9px]">WE TEST AGAINST 10 REAL AI SHOPPING AGENTS</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="flex items-center gap-2 px-3 py-1.5 border border-[#E8E0D8] bg-white text-xs"
            >
              <span className="font-semibold text-foreground">{agent.name}</span>
              <span className="spec-label text-[8px] text-muted-foreground">{agent.type.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* CTA bridge */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t border-[#E8E0D8]">
          <div className="flex-1">
            <p className="text-sm text-foreground font-semibold">
              See how your brand scores — or browse the index below.
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Free scores for every brand. Detailed findings, action plans, and agent replays with a paid plan.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors"
            >
              Submit Your Site
              <ArrowRight size={14} />
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 px-5 py-2.5 border border-[#E8E0D8] text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
            >
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
    {
      icon: Eye,
      number: "01",
      label: "BROWSE",
      color: "#FF6648",
      title: "We send AI agents to shop",
      desc: "Five AI agents visit your site — one browses like a customer, one reads data feeds, one tests accessibility, one uses AI vision, and one checks your product feeds.",
    },
    {
      icon: ShoppingCart,
      number: "02",
      label: "TEST",
      color: "#0259DD",
      title: "They try to buy something",
      desc: "Can they find products? Add to cart? Complete checkout? We test the full shopping journey, from homepage to payment.",
    },
    {
      icon: Database,
      number: "03",
      label: "SCORE",
      color: "#059669",
      title: "You get a score out of 100",
      desc: "Your ARC Score shows how ready your store is for AI agent commerce — with specific findings and fixes to improve.",
    },
  ];

  return (
    <div className="bg-white border-b border-[#E8E0D8]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-6">
          <span className="spec-label text-muted-foreground text-[9px]">HOW IT WORKS</span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step) => (
            <div key={step.number} className="flex gap-4">
              {/* Number + icon */}
              <div className="shrink-0">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: step.color }}
                >
                  <step.icon size={18} className="text-white" />
                </div>
                <div className="spec-label text-center mt-1.5 text-[9px]" style={{ color: step.color }}>
                  {step.number}
                </div>
              </div>

              {/* Text */}
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
