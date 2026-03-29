"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Monitor,
  ShoppingCart,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  ArrowRight,
  ExternalLink,
  Globe,
  Database,
  Shield,
  Code,
  FileText,
  CreditCard,
  BarChart3,
  Bot,
  Cpu,
  MessageSquare,
  Sparkles,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ─────────────────────────────────────────────────────────────────────
   SHARED COMPONENTS
   ───────────────────────────────────────────────────────────────────── */

/** Dark section wrapper — guarantees dark bg via inline style */
function DarkSection({
  children,
  id,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: "#0A1628" }}
    >
      {/* Gradient mesh overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 15% 25%, rgba(2,89,221,0.12) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 85% 20%, rgba(255,102,72,0.08) 0%, transparent 50%), " +
            "radial-gradient(ellipse at 50% 80%, rgba(124,58,237,0.06) 0%, transparent 50%)",
        }}
      />
      {/* Scan lines overlay */}
      <div className="scan-lines" />
      {children}
    </section>
  );
}

function Typewriter({ phrases }: { phrases: string[] }) {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const phrase = phrases[phraseIdx];
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          if (charIdx < phrase.length) setCharIdx((c) => c + 1);
          else setTimeout(() => setDeleting(true), 2200);
        } else {
          if (charIdx > 0) setCharIdx((c) => c - 1);
          else {
            setDeleting(false);
            setPhraseIdx((p) => (p + 1) % phrases.length);
          }
        }
      },
      deleting ? 25 : 55
    );
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, phraseIdx, phrases, mounted]);

  if (!mounted) return <span className="blink">|</span>;
  return (
    <span>
      {phrases[phraseIdx].substring(0, charIdx)}
      <span className="blink">|</span>
    </span>
  );
}

function Counter({
  value,
  prefix = "",
  suffix = "",
  duration = 2,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || counted.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const t = Math.min((now - start) / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - t, 3);
            setDisplay(Math.round(value * eased));
            if (t < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className="data-num">
      {prefix}
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

function SectionTag({ children, color = "#FF6648" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="spec-label inline-block px-2.5 py-1 rounded-sm mb-4"
      style={{ color, backgroundColor: color + "18" }}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION NAV — Interactive table of contents
   Fun retro "mission brief" style with colored pills
   ═══════════════════════════════════════════════════════════════════════ */
const NAV_ITEMS = [
  { id: "why-now", label: "Why Now", color: "#FF6648", number: "01" },
  { id: "journey", label: "The Journey", color: "#0259DD", number: "02" },
  { id: "ecosystem", label: "Ecosystem", color: "#059669", number: "03" },
  { id: "protocols", label: "Protocols", color: "#7C3AED", number: "04" },
  { id: "framework", label: "Framework", color: "#FBBA16", number: "05" },
  { id: "score-scale", label: "Score Scale", color: "#0259DD", number: "06" },
  { id: "numbers", label: "Numbers", color: "#FF6648", number: "07" },
  { id: "glossary", label: "Glossary", color: "#7C3AED", number: "08" },
  { id: "fix-list", label: "Fix List", color: "#dc2626", number: "09" },
  { id: "get-started", label: "Get Started", color: "#059669", number: "10" },
];

function SectionNav() {
  const [active, setActive] = useState("");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sectionEls = NAV_ITEMS.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];

    const observers = sectionEls.map((el) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(el.id);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      return observer;
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={navRef} className="relative py-6 sm:py-8 bg-[#0A1628]" id="section-nav">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6648]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FBBA16]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
          </div>
          <span className="spec-label text-white/40">mission_brief.exe — 10 sections</span>
        </div>

        {/* Nav pills */}
        <div className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer"
                style={{
                  borderColor: isActive ? item.color + "60" : "rgba(255,255,255,0.08)",
                  backgroundColor: isActive ? item.color + "15" : "rgba(255,255,255,0.03)",
                }}
              >
                <span
                  className="text-[9px] font-mono font-bold opacity-40 group-hover:opacity-80 transition-opacity"
                  style={{ color: item.color }}
                >
                  {item.number}
                </span>
                <span
                  className="text-[11px] font-semibold transition-colors"
                  style={{ color: isActive ? item.color : "rgba(255,255,255,0.6)" }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ backgroundColor: item.color }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   ═══════════════════════════════════════════════════════════════════════ */
function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".hero-dot").forEach((dot, i) => {
        gsap.to(dot, {
          y: -100 - i * 30,
          scrollTrigger: { trigger: sectionRef.current, start: "top top", end: "bottom top", scrub: 1 },
        });
      });
      gsap.fromTo(
        ".hero-title-word",
        { y: 80, opacity: 0, rotateX: -40 },
        { y: 0, opacity: 1, rotateX: 0, stagger: 0.12, duration: 1, ease: "back.out(1.4)", delay: 0.2 }
      );
      gsap.fromTo(
        ".hero-fade",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.15, duration: 0.8, ease: "power3.out", delay: 0.8 }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const queries = [
    '"Find me a sustainable running shoe under $150"',
    '"Compare protein powders with free next-day delivery"',
    '"Buy the Dyson V15 from whoever has the best return policy"',
    '"Get me a birthday gift for my wife, she loves candles"',
    '"Reorder my usual coffee beans from the cheapest source"',
  ];

  return (
    <section ref={sectionRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden gradient-mesh">
      <div className="retro-grid" />
      <div className="absolute inset-0 pointer-events-none">
        {[
          { x: "8%", y: "15%", size: 12, color: "#FF6648" },
          { x: "85%", y: "20%", size: 8, color: "#0259DD" },
          { x: "72%", y: "70%", size: 10, color: "#FBBA16" },
          { x: "15%", y: "75%", size: 7, color: "#84AFFB" },
          { x: "50%", y: "10%", size: 6, color: "#7C3AED" },
          { x: "92%", y: "55%", size: 9, color: "#FF6648" },
          { x: "30%", y: "85%", size: 11, color: "#059669" },
          { x: "65%", y: "40%", size: 5, color: "#FBBA16" },
          { x: "20%", y: "45%", size: 8, color: "#0259DD" },
          { x: "78%", y: "88%", size: 7, color: "#84AFFB" },
        ].map((dot, i) => (
          <div
            key={i}
            className="hero-dot absolute rounded-full"
            style={{ left: dot.x, top: dot.y, width: dot.size, height: dot.size, backgroundColor: dot.color, opacity: 0.2 }}
          />
        ))}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <line x1="8%" y1="15%" x2="50%" y2="10%" stroke="#0259DD" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="50%" y1="10%" x2="85%" y2="20%" stroke="#FF6648" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="15%" y1="75%" x2="30%" y2="85%" stroke="#FBBA16" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="72%" y1="70%" x2="92%" y2="55%" stroke="#0259DD" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>
      <div className="cassette-stripes" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 py-20">
        <div className="hero-title-word">
          <div className="flex items-center gap-2 mb-6">
            <span className="spec-label text-muted-foreground">interactive guide</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FF6648]" />
            <span className="spec-label text-[#FF6648]">2026</span>
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.95] mb-6 tracking-tight">
          <span className="hero-title-word inline-block">The&nbsp;</span>
          <span className="hero-title-word inline-block text-[#0259DD]">Agentic&nbsp;</span>
          <br className="hidden sm:block" />
          <span className="hero-title-word inline-block">Commerce&nbsp;</span>
          <span className="hero-title-word inline-block text-retro-heavy" data-text="Revolution">Revolution</span>
        </h1>

        <div className="hero-fade max-w-2xl mb-5">
          <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">
            AI agents are discovering, comparing, and facilitating purchases for{" "}
            <strong className="text-foreground">700 million weekly ChatGPT users</strong>.
            Most e-commerce sites are invisible to them.
          </p>
        </div>

        <div className="hero-fade mb-8">
          <div className="inline-flex items-start gap-2 rounded-lg bg-[#0A1628] px-4 py-3 max-w-lg">
            <Bot size={16} className="text-[#84AFFB] shrink-0 mt-0.5" />
            <p className="text-sm text-[#84AFFB] font-mono leading-relaxed min-h-[2.5rem]">
              <Typewriter phrases={queries} />
            </p>
          </div>
        </div>

        <div className="hero-fade flex flex-wrap gap-3 mb-6">
          <a href="/submit" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-6 py-3 transition-all relative group hover:translate-y-[-2px]">
            Check Your Score <ArrowRight size={14} />
            <span className="absolute inset-0 bg-[#0A1628] -z-10 translate-x-[3px] translate-y-[3px] group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-transform" />
          </a>
          <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground border-2 border-foreground/20 hover:border-[#0259DD] hover:text-[#0259DD] px-6 py-3 transition-all">
            View Leaderboard
          </a>
        </div>

        <div className="hero-fade flex items-center gap-4 text-[10px] font-mono text-foreground/50">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            1,000+ brands tracked
          </span>
          <span className="text-foreground/20">|</span>
          <span>Updated weekly</span>
          <span className="text-foreground/20">|</span>
          <span>Free tier available</span>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 hero-fade">
        <span className="spec-label text-foreground/30 text-[9px]">Scroll to explore</span>
        <div className="w-5 h-8 rounded-full border-2 border-foreground/15 flex justify-center pt-1">
          <div className="w-1 h-2 rounded-full bg-[#FF6648] animate-bounce" />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 2 — WHY NOW
   ═══════════════════════════════════════════════════════════════════════ */
function WhyNowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".stat-card", { scale: 0.7, opacity: 0, y: 60 }, {
        scale: 1, opacity: 1, y: 0, stagger: 0.15, duration: 0.7, ease: "back.out(1.6)",
        scrollTrigger: { trigger: ".stat-cards-container", start: "top 80%", once: true },
      });
      gsap.fromTo(".strike-through", { width: "0%" }, {
        width: "100%", duration: 0.6, ease: "power2.inOut",
        scrollTrigger: { trigger: ".strike-text", start: "top 75%", once: true }, delay: 0.3,
      });
      gsap.fromTo(".amazon-callout", { x: -60, opacity: 0 }, {
        x: 0, opacity: 1, duration: 0.8, ease: "power3.out",
        scrollTrigger: { trigger: ".amazon-callout", start: "top 85%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const stats = [
    { value: "$3–5T", label: "AI-mediated global commerce by 2030", source: "McKinsey, Jan 2026", color: "#0259DD" },
    { value: "670%", label: "Growth in AI-driven retail traffic, Cyber Monday 2025", source: "Adobe", color: "#FF6648" },
    { value: "23%", label: "Americans who facilitated a purchase via AI last month", source: "Morgan Stanley AlphaWise", color: "#FBBA16" },
  ];

  return (
    <DarkSection id="why-now" className="py-20 sm:py-28">
      <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="gsap-reveal mb-4">
          <SectionTag color="#FF6648">why now</SectionTag>
        </div>
        <div className="gsap-reveal">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 max-w-3xl leading-tight">
            The single most important shift in e-commerce{" "}
            <span className="text-[#FF6648]">since the shopping cart.</span>
          </h2>
          <p className="text-sm text-white/60 mb-12 max-w-xl">
            Three forces are converging: AI agents have reached decision-grade capability,
            open protocols give them transactional power, and consumer intent is shifting upstream.
          </p>
        </div>

        <div className="stat-cards-container grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="stat-card rounded-xl p-6 border"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", borderLeftColor: stat.color, borderLeftWidth: 4 }}
            >
              <p className="data-num text-3xl sm:text-4xl font-black mb-2" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-white/80 mb-3 leading-relaxed">{stat.label}</p>
              <p className="text-[9px] font-mono text-white/35 uppercase tracking-wider">{stat.source}</p>
            </div>
          ))}
        </div>

        <div className="strike-text text-center mb-12">
          <p className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug">
            If your site is not machine-readable,
            <br />
            agents{" "}
            <span className="relative inline-block">
              <span className="text-white/50">won&apos;t find you</span>
              <span className="strike-through absolute left-0 top-1/2 h-[3px] bg-[#FF6648]" style={{ width: "0%" }} />
            </span>{" "}
            <span className="text-emerald-400 font-black">can&apos;t buy from you</span>.
          </p>
        </div>

        <div className="amazon-callout rounded-xl p-6 max-w-2xl mx-auto" style={{ backgroundColor: "rgba(5,150,105,0.1)", border: "1px solid rgba(5,150,105,0.25)" }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-300 mb-1">Amazon blocked ChatGPT from its robots.txt.</p>
              <p className="text-xs text-white/60 leading-relaxed">
                700M+ weekly users can&apos;t see Amazon products in ChatGPT Shopping.
                Zero Amazon competition. For non-Amazon brands,{" "}
                <strong className="text-white/90">the window is open — right now.</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </DarkSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 3 — AGENT JOURNEY
   "Mission Control" dashboard — creative grid layout
   ═══════════════════════════════════════════════════════════════════════ */
function AgentJourneySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      // Query bar slides in
      gsap.fromTo(".journey-query", { y: -30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".journey-query", start: "top 85%", once: true },
      });
      // Grid panels stagger in
      gsap.fromTo(".journey-panel", { opacity: 0, y: 40, scale: 0.95 }, {
        opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.3)",
        scrollTrigger: { trigger: ".journey-grid", start: "top 80%", once: true },
      });
      // Result panel slides up
      gsap.fromTo(".journey-result", { opacity: 0, y: 50 }, {
        opacity: 1, y: 0, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".journey-result", start: "top 85%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const steps = [
    { icon: Search, label: "Research", number: "02", example: "Searching 47 retailers... Reading product feeds, Schema.org markup, APIs", detail: "Agent queries structured data across multiple merchants", color: "#7C3AED" },
    { icon: BarChart3, label: "Compare", number: "03", example: "Found 8 matches. Comparing prices, delivery, return policies...", detail: "Agent evaluates trade-offs on the user's behalf", color: "#FBBA16" },
    { icon: ShoppingCart, label: "Checkout", number: "04", example: "Initiating checkout via ACP at Retailer A... €349, free Thu delivery", detail: "Agent triggers programmatic checkout or navigates the site", color: "#FF6648" },
    { icon: CheckCircle2, label: "Follow-up", number: "05", example: "Order confirmed. Tracking sent. Return window: 30 days.", detail: "Agent manages delivery tracking, returns, and preferences", color: "#059669" },
  ];

  return (
    <section ref={sectionRef} id="journey" className="py-20 sm:py-28 bg-background relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="gsap-reveal">
          <SectionTag color="#0259DD">the journey</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 leading-tight">
            How AI Agents Shop <span className="text-[#0259DD]">Today</span>
          </h2>
          <p className="text-sm text-foreground/60 max-w-xl mb-10">
            From a natural language request to a completed transaction — five steps,
            no browser tabs, no clicking through pages.
          </p>
        </div>

        {/* STEP 01: The user query — full-width "terminal" */}
        <div className="journey-query rounded-2xl bg-[#0A1628] p-5 sm:p-6 mb-4 relative overflow-hidden">
          <div className="scan-lines" />
          <div className="relative z-10">
            {/* Terminal chrome */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF6648]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#FBBA16]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
              </div>
              <span className="text-[9px] font-mono text-white/30 ml-2">step_01 — intent</span>
              <span className="text-[9px] font-mono text-[#0259DD] ml-auto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0259DD] animate-pulse" />
                AGENT ACTIVE
              </span>
            </div>
            {/* Query */}
            <div className="flex items-start gap-3">
              <MessageSquare size={20} className="text-[#84AFFB] shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-mono text-white/40 mb-1">USER REQUEST</p>
                <p className="text-base sm:text-lg font-bold text-[#84AFFB] leading-relaxed">
                  &ldquo;Find me a blue velvet sofa under €400, delivered by Friday&rdquo;
                </p>
              </div>
            </div>
            {/* Processing indicator */}
            <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-white/30">
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-[#0259DD] animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full bg-[#0259DD] animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-[#0259DD] animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
              Processing query across 47 merchants...
            </div>
          </div>
        </div>

        {/* STEPS 02-05: 2x2 grid on desktop */}
        <div className="journey-grid grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {steps.map((step, i) => (
            <div
              key={step.label}
              className="journey-panel rounded-2xl p-5 border-2 transition-all duration-300 cursor-default group"
              style={{
                borderColor: activeStep === i ? step.color + "50" : step.color + "20",
                backgroundColor: activeStep === i ? step.color + "08" : "white",
              }}
              onMouseEnter={() => setActiveStep(i)}
              onMouseLeave={() => setActiveStep(null)}
            >
              {/* Panel header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: step.color + "15" }}>
                    <step.icon size={17} style={{ color: step.color }} />
                  </div>
                  <div>
                    <p className="text-[9px] font-mono font-bold" style={{ color: step.color }}>STEP {step.number}</p>
                    <h3 className="text-sm font-bold text-foreground">{step.label}</h3>
                  </div>
                </div>
                <span className="data-num text-3xl font-black text-foreground/[0.06] group-hover:text-foreground/[0.12] transition-colors">
                  {step.number}
                </span>
              </div>

              <p className="text-xs text-foreground/60 mb-3">{step.detail}</p>

              {/* Chat bubble */}
              <div className="rounded-lg p-3 font-mono text-[11px] leading-relaxed" style={{ backgroundColor: step.color + "08", color: step.color + "bb", border: `1px solid ${step.color}15` }}>
                <div className="flex items-start gap-2">
                  <Bot size={11} style={{ color: step.color }} className="shrink-0 mt-0.5" />
                  {step.example}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RESULT: Success vs failure comparison — full width */}
        <div className="journey-result grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Success */}
          <div className="rounded-2xl p-5 border-2 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-emerald-600 font-bold">AGENT-READY SITE</p>
                <h3 className="text-sm font-bold text-foreground">Retailer A wins the sale</h3>
              </div>
            </div>
            <div className="space-y-2 text-xs text-foreground/70">
              <p>✓ Product schema found — all fields populated</p>
              <p>✓ Price: €349 — matches feed, page, and schema</p>
              <p>✓ Free delivery Thursday — confirmed via API</p>
              <p>✓ 30-day returns — policy schema present</p>
              <p>✓ Checkout via ACP — completed in 3 seconds</p>
            </div>
          </div>

          {/* Failure */}
          <div className="rounded-2xl p-5 border-2 border-red-200 bg-red-50/50">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <XCircle size={16} className="text-red-500" />
              </div>
              <div>
                <p className="text-[9px] font-mono text-red-500 font-bold">AGENT-INVISIBLE SITES</p>
                <h3 className="text-sm font-bold text-foreground">Retailers B & C lose</h3>
              </div>
            </div>
            <div className="space-y-2 text-xs text-foreground/70">
              <p className="line-through text-foreground/40">✗ Retailer B — €379, no delivery info found</p>
              <p className="line-through text-foreground/40">✗ Retailer C — site blocked the agent&apos;s crawl</p>
              <p className="line-through text-foreground/40">✗ Retailer D — JS-only content, no schema</p>
            </div>
            <div className="mt-3 rounded-lg bg-red-100/50 p-2.5">
              <p className="text-[11px] font-mono text-red-700/70">
                Lost the sale. Not on price — on <strong>readability</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 4 — ECOSYSTEM
   ═══════════════════════════════════════════════════════════════════════ */
function EcosystemSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".eco-card", { opacity: 0, y: 50, rotateY: -8 }, {
        opacity: 1, y: 0, rotateY: 0, stagger: 0.1, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".eco-grid", start: "top 80%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const platforms = [
    { name: "OpenAI / ChatGPT", stat: "700M+ weekly users", detail: "Instant Checkout live. ACP protocol. Shopping Research launched Feb 2026.", color: "#0259DD", icon: Bot, badge: "Market Leader" },
    { name: "Google / Gemini", stat: "AI Mode in Search", detail: "Universal Commerce Protocol (UCP). 20+ retail partners. Agentic checkout.", color: "#059669", icon: Globe, badge: "Infrastructure" },
    { name: "Perplexity", stat: "Research-first shopping", detail: "PayPal partnership. Buy with Pro. Heavy citation of structured product pages.", color: "#7C3AED", icon: Search, badge: "Rising Fast" },
    { name: "Anthropic / Claude", stat: "Computer-use agent", detail: "Browses sites directly. Powers custom agents. MCP creator.", color: "#FF6648", icon: Cpu, badge: "Developer Choice" },
    { name: "Microsoft Copilot", stat: "Enterprise reach", detail: "Windows + Edge + M365 integration. Shopify syndication support.", color: "#0891b2", icon: Monitor, badge: "Enterprise" },
    { name: "Custom Agents", stat: "Fastest growing segment", detail: "Developer-built agents via MCP. Zapier AI, Make.com, and coding agents.", color: "#FBBA16", icon: Code, badge: "Wild Card" },
  ];

  return (
    <DarkSection id="ecosystem" className="py-20 sm:py-28">
      <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="gsap-reveal">
          <SectionTag color="#FF6648">the ecosystem</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            Meet the Agents <span className="text-[#84AFFB]">Already Shopping</span>
          </h2>
          <p className="text-sm text-white/60 mb-12 max-w-xl">
            Six major platforms are building AI shopping agents. Each has different
            requirements — but all need machine-readable product data and clean checkout flows.
          </p>
        </div>

        <div className="eco-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((p) => (
            <div key={p.name} className="eco-card card-3d rounded-xl p-5 border transition-all group relative overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 50%, ${p.color}12 0%, transparent 70%)` }} />
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: p.color + "20" }}>
                    <p.icon size={18} style={{ color: p.color }} />
                  </div>
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: p.color + "18", color: p.color }}>{p.badge}</span>
                </div>
                <h3 className="text-sm font-bold text-white mb-0.5">{p.name}</h3>
                <p className="text-[11px] font-mono mb-2" style={{ color: p.color }}>{p.stat}</p>
                <p className="text-[11px] text-white/55 leading-relaxed mb-3">{p.detail}</p>
                <div className="flex items-center gap-2">
                  <span className="relative flex items-center justify-center w-2 h-2">
                    <span className="absolute w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
                    <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400/80">Live & Shopping</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DarkSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 5 — PROTOCOL STACK
   ═══════════════════════════════════════════════════════════════════════ */
function ProtocolSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".protocol-card", { opacity: 0, y: 40, x: -30 }, {
        opacity: 1, y: 0, x: 0, stagger: 0.12, duration: 0.7, ease: "power3.out",
        scrollTrigger: { trigger: ".protocol-stack", start: "top 80%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const protocols = [
    { abbr: "ACP", name: "Agentic Commerce Protocol", by: "OpenAI + Stripe", color: "#059669", icon: ShoppingCart, bullets: ["Powers ChatGPT Instant Checkout", "Open source, Apache 2.0", "1M+ Shopify merchants eligible", "REST endpoints + webhooks"] },
    { abbr: "UCP", name: "Universal Commerce Protocol", by: "Google", color: "#0259DD", icon: Globe, bullets: ["Powers AI Mode + Gemini Shopping", "Co-built with Shopify, Target, Walmart", "20+ retailers already signed up", "Compatible with ACP and A2A"] },
    { abbr: "MCP", name: "Model Context Protocol", by: "Anthropic", color: "#7C3AED", icon: Cpu, bullets: ["Makes your store queryable by any agent", "Shopify MCP server available now", "\"Read/Execute\" permission for AI", "The USB-C of agent integrations"] },
    { abbr: "AP2", name: "Payment Protocols", by: "Google + Mastercard + Visa + Stripe", color: "#FF6648", icon: CreditCard, bullets: ["Secure agent-initiated payments", "Single-transaction tokens (SPT)", "Fraud-protected by design", "Consent verification built in"] },
    { abbr: "llms.txt", name: "The Sitemap for AI", by: "Community standard", color: "#FBBA16", icon: FileText, bullets: ["Lives at yourdomain.com/llms.txt", "Points agents to your product feed", "Dell was first major brand to adopt", "Takes 2 hours to implement"] },
  ];

  return (
    <section ref={sectionRef} id="protocols" className="py-20 sm:py-28 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="gsap-reveal">
          <SectionTag color="#7C3AED">the protocols</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 leading-tight">
            The Plumbing <span className="text-[#7C3AED]">Nobody Told You About</span>
          </h2>
          <p className="text-sm text-foreground/60 mb-12 max-w-xl">
            Open standards are emerging that let agents and merchants transact without bespoke
            integrations. Protocol adoption is becoming a direct signal of agent-readiness.
          </p>
        </div>

        <div className="gsap-reveal flex gap-1 mb-10 h-2 rounded-full overflow-hidden">
          {protocols.map((p) => (
            <div key={p.abbr} className="flex-1 relative group cursor-default" style={{ backgroundColor: p.color }}>
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <span className="text-[8px] font-mono whitespace-nowrap bg-foreground text-white px-2 py-0.5 rounded">{p.abbr}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="protocol-stack space-y-3">
          {protocols.map((p) => (
            <div key={p.abbr} className="protocol-card card-soft rounded-xl p-5 border-l-[4px] hover:translate-x-1 transition-transform" style={{ borderLeftColor: p.color }}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: p.color + "12" }}>
                    <p.icon size={18} style={{ color: p.color }} />
                  </div>
                  <div className="sm:hidden">
                    <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                    <p className="text-[10px] text-foreground/50">By: {p.by}</p>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="hidden sm:block mb-2">
                    <h3 className="text-sm font-bold text-foreground">{p.name}</h3>
                    <p className="text-[10px] text-foreground/50">By: {p.by}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                    {p.bullets.map((b) => (
                      <div key={b} className="flex items-start gap-2">
                        <Sparkles size={10} className="shrink-0 mt-0.5" style={{ color: p.color }} />
                        <span className="text-[11px] text-foreground/60">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-mono font-bold px-3 py-1.5 rounded shrink-0" style={{ backgroundColor: p.color + "12", color: p.color }}>{p.abbr}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="gsap-reveal mt-8 text-center">
          <p className="text-[10px] font-mono text-foreground/40">
            ACP/UCP → commerce · AP2/Visa/Mastercard → payments · MCP → agent communication · llms.txt → discovery
          </p>
          <p className="text-[10px] font-mono text-[#7C3AED] mt-1 font-bold">
            Implement all layers = fully agent-transactable
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 6 — READINESS FRAMEWORK
   ═══════════════════════════════════════════════════════════════════════ */
function FrameworkSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".weight-segment", { scaleX: 0 }, {
        scaleX: 1, stagger: 0.15, duration: 0.6, ease: "power2.out",
        scrollTrigger: { trigger: ".weight-bar", start: "top 80%", once: true },
      });
      gsap.fromTo(".dim-card", { opacity: 0, y: 40, scale: 0.95 }, {
        opacity: 1, y: 0, scale: 1, stagger: 0.1, duration: 0.6, ease: "back.out(1.2)",
        scrollTrigger: { trigger: ".dim-grid", start: "top 80%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const dimensions = [
    { name: "Structured Data", weight: 25, icon: Database, color: "#059669", tag: "Highest Impact", desc: "Can agents understand your products without rendering pages?", checks: ["Product schema (JSON-LD) on all pages", "All required fields populated", "Live product feed (JSON/XML)", "Price consistency across sources"] },
    { name: "Checkout Readiness", weight: 20, icon: ShoppingCart, color: "#FBBA16", tag: "The Prize", desc: "Can agents actually complete a transaction?", checks: ["ACP implemented", "UCP registered", "Agent-compatible PSP (Stripe/PayPal)", "Guest checkout available"] },
    { name: "Crawlability & Discovery", weight: 18, icon: Globe, color: "#0259DD", desc: "Can AI bots reach and navigate your site?", checks: ["robots.txt allows all AI bots", "/llms.txt file present", "Server-rendered HTML", "Sub-2s page load for bots"] },
    { name: "Content & GEO", weight: 17, icon: FileText, color: "#7C3AED", desc: "Is your content structured for AI citation?", checks: ["Clear H1/H2/H3 hierarchy", "FAQ schema implemented", "Rich product descriptions", "Third-party reviews present"] },
    { name: "Trust & Policies", weight: 12, icon: Shield, color: "#FF6648", desc: "Can agents verify your policies?", checks: ["Returns policy + schema markup", "Delivery windows explicit", "No hidden fees at checkout", "Seller identity in schema"] },
    { name: "Technical Health", weight: 8, icon: Cpu, color: "#0891b2", desc: "Are the technical fundamentals solid?", checks: ["HTTPS enforced", "Core Web Vitals passing", "No JS-only product content", "Clean URL structure"] },
  ];

  return (
    <DarkSection id="framework" className="py-20 sm:py-28">
      <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="gsap-reveal">
          <SectionTag color="#FBBA16">the framework</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            6 Dimensions of <span className="text-[#FBBA16]">Agent Readiness</span>
          </h2>
          <p className="text-sm text-white/60 mb-10 max-w-xl">
            Agent readiness isn&apos;t one thing — it&apos;s a stack. Each dimension represents
            measurable signals that determine whether agents can discover, understand,
            and transact with your site.
          </p>
        </div>

        <div className="weight-bar flex rounded-lg overflow-hidden h-4 mb-12 relative">
          {dimensions.map((d) => (
            <div key={d.name} className="weight-segment relative group cursor-default origin-left" style={{ width: `${d.weight}%`, backgroundColor: d.color }}>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <span className="text-[9px] font-mono text-white whitespace-nowrap bg-white/20 px-2 py-1 rounded">{d.name} · {d.weight}pts</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dim-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
          {dimensions.map((d) => (
            <div key={d.name} className="dim-card rounded-xl p-5 border transition-all group" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.08)", borderLeftColor: d.color, borderLeftWidth: 4 }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: d.color + "18" }}>
                  <d.icon size={15} style={{ color: d.color }} />
                </div>
                <h3 className="text-xs font-bold text-white flex-1">{d.name}</h3>
                <span className="data-num text-lg font-black" style={{ color: d.color }}>{d.weight}</span>
                {d.tag && (
                  <span className="text-[7px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ backgroundColor: d.color + "20", color: d.color }}>{d.tag}</span>
                )}
              </div>
              <p className="text-[11px] text-white/50 mb-3">{d.desc}</p>
              <div className="space-y-2">
                {d.checks.map((check) => (
                  <div key={check} className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: d.color + "20" }}>
                      <CheckCircle2 size={9} style={{ color: d.color }} />
                    </div>
                    <span className="text-[10px] text-white/65">{check}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DarkSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 7 — SCORE SCALE
   ═══════════════════════════════════════════════════════════════════════ */
function ScoreScaleSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".score-bar-fill", { scaleX: 0 }, {
        scaleX: 1, duration: 1.5, ease: "power2.inOut",
        scrollTrigger: { trigger: ".score-bar-container", start: "top 75%", once: true },
      });
      gsap.fromTo(".score-band", { opacity: 0, x: -30 }, {
        opacity: 1, x: 0, stagger: 0.12, duration: 0.5, ease: "power2.out",
        scrollTrigger: { trigger: ".score-bands", start: "top 80%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const bands = [
    { min: 0, max: 39, label: "Agent-Invisible", color: "#dc2626", desc: "Agents cannot find, understand, or transact with you" },
    { min: 40, max: 59, label: "Agent-Emerging", color: "#ea580c", desc: "Discoverable but not purchasable" },
    { min: 60, max: 79, label: "Agent-Ready", color: "#d97706", desc: "Appearing in AI results, partial checkout capability" },
    { min: 80, max: 89, label: "Agent-Capable", color: "#0259DD", desc: "Active in major platforms, purchases happening" },
    { min: 90, max: 100, label: "Agent-Native", color: "#059669", desc: "Full protocol stack, benchmark for others" },
  ];

  return (
    <section ref={sectionRef} id="score-scale" className="py-20 sm:py-28 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="gsap-reveal">
          <SectionTag color="#0259DD">the scale</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 leading-tight">
            What Does Your Score <span className="text-[#0259DD]">Mean?</span>
          </h2>
          <p className="text-sm text-foreground/60 mb-10 max-w-xl">
            Every site gets a score from 0 to 100. Here&apos;s what the bands mean
            for your visibility to AI shopping agents.
          </p>
        </div>

        <div className="score-bar-container mb-8">
          <div className="flex rounded-xl overflow-hidden h-5 origin-left score-bar-fill">
            {bands.map((b) => (
              <div key={b.label} className="relative group cursor-default transition-all hover:brightness-110" style={{ width: `${b.max - b.min + 1}%`, backgroundColor: b.color }} />
            ))}
          </div>
          <div className="flex justify-between text-[9px] font-mono text-foreground/40 mt-2 px-0.5">
            <span>0</span><span>40</span><span>60</span><span>80</span><span>100</span>
          </div>
        </div>

        <div className="score-bands space-y-2 mt-12">
          {bands.map((b) => (
            <div key={b.label} className="score-band flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-foreground/10 hover:bg-white transition-all group">
              <div className="w-16 text-center shrink-0">
                <span className="data-num text-base font-black" style={{ color: b.color }}>{b.min}–{b.max}</span>
              </div>
              <div className="w-1.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: b.color }} />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{b.label}</p>
                <p className="text-xs text-foreground/55">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Industry benchmark */}
        <div className="gsap-reveal mt-12 rounded-2xl p-8 text-center relative overflow-hidden" style={{ backgroundColor: "#0A1628" }}>
          <div className="scan-lines" />
          <div className="relative z-10">
            <p className="spec-label text-white/40 mb-6">industry benchmark — top 100 e-commerce sites</p>
            <div className="flex flex-col sm:flex-row justify-center gap-8 sm:gap-16 mb-6">
              <div>
                <p className="data-num text-5xl sm:text-6xl font-black text-white mb-1">
                  <Counter value={52} /><span className="text-xl text-white/30">/100</span>
                </p>
                <p className="text-xs text-white/50">Average score</p>
              </div>
              <div className="hidden sm:block w-px bg-white/10" />
              <div>
                <p className="data-num text-5xl sm:text-6xl font-black text-[#FF6648] mb-1"><Counter value={4} suffix="%" /></p>
                <p className="text-xs text-white/50">Score above 80</p>
              </div>
            </div>
            <p className="text-sm font-bold text-white">Your competitors are not ready. <span className="text-[#FBBA16]">Are you?</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 8 — GROWTH STATS
   ═══════════════════════════════════════════════════════════════════════ */
function GrowthSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".growth-stat", { opacity: 0, scale: 0.8, y: 40 }, {
        opacity: 1, scale: 1, y: 0, stagger: 0.15, duration: 0.8, ease: "back.out(1.4)",
        scrollTrigger: { trigger: ".growth-grid", start: "top 80%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const stats = [
    { value: 385, prefix: "$", suffix: "B", label: "US e-commerce via AI agents by 2030", source: "Morgan Stanley", color: "#0259DD" },
    { value: 44, suffix: "%", label: "AI users who say AI is now their primary search", source: "McKinsey, 2025", color: "#FF6648" },
    { value: 357, suffix: "%", label: "YoY growth in AI referrals to top 1,000 sites", source: "June 2025", color: "#FBBA16" },
    { value: 33, suffix: "%", label: "More likely to be cited with structured data", source: "Industry study", color: "#7C3AED" },
  ];

  return (
    <DarkSection id="numbers" className="py-20 sm:py-28">
      <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="gsap-reveal">
          <SectionTag color="#FBBA16">the numbers</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            The Numbers <span className="text-[#FF6648]">Don&apos;t Lie</span>
          </h2>
          <p className="text-sm text-white/60 mb-12 max-w-xl">
            Every metric points in the same direction: AI agents are becoming the primary
            channel for product discovery and purchase.
          </p>
        </div>

        <div className="growth-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="growth-stat rounded-2xl p-8 text-center transition-all" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="data-num text-4xl sm:text-5xl md:text-6xl font-black mb-3" style={{ color: s.color }}>
                <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} duration={2.5} />
              </p>
              <p className="text-xs text-white/70 leading-relaxed mb-2">{s.label}</p>
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-wider">{s.source}</p>
            </div>
          ))}
        </div>
      </div>
    </DarkSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 9 — GLOSSARY
   ═══════════════════════════════════════════════════════════════════════ */
function GlossarySection() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const categories = [
    { key: "all", label: "All", color: "#0A1628" },
    { key: "protocol", label: "Protocols", color: "#0259DD" },
    { key: "concept", label: "Concepts", color: "#FF6648" },
    { key: "tech", label: "Technical", color: "#7C3AED" },
  ];

  const terms = [
    { term: "Agentic Commerce", cat: "concept", def: "When AI agents research, compare, and facilitate purchases on a user's behalf. The biggest shift in e-commerce since the shopping cart." },
    { term: "ACP", cat: "protocol", def: "Agentic Commerce Protocol — OpenAI + Stripe's open standard for agent-initiated checkout. Powers ChatGPT Instant Checkout." },
    { term: "UCP", cat: "protocol", def: "Universal Commerce Protocol — Google's standard for AI agents and merchant backends to exchange product, offer, and checkout data." },
    { term: "MCP", cat: "protocol", def: "Model Context Protocol — Anthropic's standard that makes your store interactively queryable by any AI agent. The USB-C of agent integrations." },
    { term: "AP2", cat: "protocol", def: "Google's Agent Payments Protocol. Verifies an AI agent has genuine permission from a real customer and secures the payment flow." },
    { term: "A2A", cat: "protocol", def: "Agent-to-Agent protocol. Lets a consumer's agent communicate directly with a merchant's agent. No human UI needed." },
    { term: "SPT", cat: "tech", def: "Stripe Shared Payment Token. A one-time-use, time-limited payment token for agent-initiated transactions. Can't be stolen or reused." },
    { term: "llms.txt", cat: "tech", def: "A markdown file at /llms.txt that gives AI agents a curated map of your most important pages and data sources. A sitemap designed for LLMs." },
    { term: "GEO", cat: "concept", def: "Generative Engine Optimisation. The practice of getting AI platforms to cite and recommend your brand in generated responses." },
    { term: "AEO", cat: "concept", def: "Answer Engine Optimisation. Being the source that AI quotes in its answers. The new SEO." },
    { term: "JSON-LD", cat: "tech", def: "How structured data is written for the web. Injected in a <script> tag. Invisible to users, gold to AI agents." },
    { term: "Product Feed", cat: "tech", def: "A structured file of your entire catalogue (JSON/XML/CSV). Updated daily minimum. What OpenAI requires for Instant Checkout." },
    { term: "Browser Agent", cat: "concept", def: "An AI agent that navigates your actual website — clicking buttons, filling forms, completing checkout — like a human would." },
    { term: "Feed Agent", cat: "concept", def: "An AI agent that reads your structured data and APIs without ever opening a browser. Faster and more reliable than browser agents." },
    { term: "Agent-Native", cat: "concept", def: "A site that has implemented the full protocol stack (ACP + UCP + MCP). Score: 90+. The gold standard." },
  ];

  const filtered = terms.filter(
    (t) =>
      (activeCategory === "all" || t.cat === activeCategory) &&
      (t.term.toLowerCase().includes(search.toLowerCase()) || t.def.toLowerCase().includes(search.toLowerCase()))
  );

  const getCatColor = (cat: string) => categories.find((c) => c.key === cat)?.color || "#0A1628";

  return (
    <section id="glossary" className="py-20 sm:py-28 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="gsap-reveal">
          <SectionTag color="#7C3AED">glossary</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-3 leading-tight">
            The Jargon, <span className="text-[#7C3AED]">Demystified</span>
          </h2>
          <p className="text-sm text-foreground/60 mb-8 max-w-xl">
            Agentic commerce comes with a lot of new terminology. Here&apos;s what it all means, in plain English.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input type="text" placeholder="Search terms..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-auto sm:max-w-xs px-4 py-2.5 text-sm rounded-lg border border-foreground/10 bg-white focus:outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 transition-all text-foreground" />
          <div className="flex gap-1.5">
            {categories.map((cat) => (
              <button key={cat.key} onClick={() => setActiveCategory(cat.key)}
                className="text-[10px] font-mono font-bold px-3 py-1.5 rounded-full transition-all cursor-pointer"
                style={activeCategory === cat.key ? { backgroundColor: cat.color, color: "#fff" } : { backgroundColor: "rgba(0,0,0,0.04)", color: "rgba(0,0,0,0.5)" }}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((t) => (
            <div key={t.term} className="card-soft rounded-xl p-4 hover:translate-y-[-2px] transition-all border-l-[3px]" style={{ borderLeftColor: getCatColor(t.cat) }}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-bold text-foreground">{t.term}</p>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0" style={{ backgroundColor: getCatColor(t.cat) + "12", color: getCatColor(t.cat) }}>{t.cat}</span>
              </div>
              <p className="text-[11px] text-foreground/60 leading-relaxed">{t.def}</p>
            </div>
          ))}
        </div>
        {filtered.length === 0 && <p className="text-sm text-foreground/50 text-center py-12">No terms match &ldquo;{search}&rdquo;</p>}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 10 — PRIORITY ACTIONS
   ═══════════════════════════════════════════════════════════════════════ */
function ActionsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".action-item", { opacity: 0, x: 60 }, {
        opacity: 1, x: 0, stagger: 0.08, duration: 0.5, ease: "power3.out",
        scrollTrigger: { trigger: ".action-list", start: "top 80%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const actions = [
    { title: "Fix robots.txt", desc: "Allow all AI bots (GPTBot, ClaudeBot, PerplexityBot, etc.)", impact: "Critical", effort: "15 min", color: "#dc2626" },
    { title: "Add Product Schema", desc: "JSON-LD on every product page with all required fields", impact: "Critical", effort: "1–2 weeks", color: "#dc2626" },
    { title: "Create /llms.txt", desc: "Your AI sitemap. Link to product feed and key pages", impact: "High", effort: "2 hours", color: "#ea580c" },
    { title: "Build a product feed", desc: "JSON/XML, refreshed daily minimum. Required for ACP", impact: "Critical", effort: "1 week", color: "#dc2626" },
    { title: "Fix price consistency", desc: "Schema = page = feed. Zero tolerance for mismatches", impact: "High", effort: "2–3 days", color: "#ea580c" },
    { title: "Enable guest checkout", desc: "Agents can't create accounts. Remove the barrier", impact: "High", effort: "1–3 days", color: "#ea580c" },
    { title: "Enable ACP / Agentic Storefront", desc: "ChatGPT + Perplexity + Copilot from a single setup", impact: "Critical", effort: "1–2 weeks", color: "#dc2626" },
    { title: "Register for UCP", desc: "Google Merchant Center → Google AI Mode visibility", impact: "High", effort: "1 week", color: "#ea580c" },
  ];

  return (
    <DarkSection id="fix-list" className="py-20 sm:py-28">
      <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="gsap-reveal">
          <SectionTag color="#FF6648">action plan</SectionTag>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 leading-tight">
            The Priority <span className="text-[#FF6648]">Fix List</span>
          </h2>
          <p className="text-sm text-white/60 mb-12 max-w-xl">
            Ordered by impact. Start at the top. Each fix moves the needle.
          </p>
        </div>

        <div className="action-list space-y-2">
          {actions.map((a, i) => (
            <div key={a.title} className="action-item flex items-center gap-3 sm:gap-5 rounded-xl p-4 sm:p-5 transition-all group cursor-default" style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: i < 2 ? "#FF664818" : i < 4 ? "#FBBA1618" : "#0259DD18" }}>
                <span className="data-num text-sm font-black" style={{ color: i < 2 ? "#FF6648" : i < 4 ? "#FBBA16" : "#0259DD" }}>{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{a.title}</p>
                <p className="text-[11px] text-white/45 truncate">{a.desc}</p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <span className="text-[9px] font-mono font-bold px-2 py-1 rounded" style={{ backgroundColor: a.color + "25", color: a.color === "#dc2626" ? "#fca5a5" : "#fdba74" }}>{a.impact}</span>
                <span className="text-[10px] font-mono text-white/35 hidden sm:inline">{a.effort}</span>
              </div>
              <ArrowRight size={14} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </DarkSection>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 11 — CTA
   ═══════════════════════════════════════════════════════════════════════ */
function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".cta-content > *", { opacity: 0, y: 30 }, {
        opacity: 1, y: 0, stagger: 0.12, duration: 0.7, ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="get-started" className="relative py-24 sm:py-32 overflow-hidden" style={{ backgroundColor: "#0A1628", backgroundImage: "linear-gradient(135deg, #0A1628, #0E2444, #1a1040, #0A1628)", backgroundSize: "400% 400%" }}>
      <div className="scan-lines" />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[#0259DD]/10 blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-[#FF6648]/10 blur-[60px]" />
        <div className="absolute top-1/2 right-1/3 w-56 h-56 rounded-full bg-[#7C3AED]/[0.08] blur-[70px]" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 cta-content text-center">
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            AI Agents Are Already Shopping.
            <br />
            <span className="text-[#FF6648]">Can They Buy From You?</span>
          </h2>
        </div>
        <div>
          <p className="text-sm text-white/55 mb-8 max-w-md mx-auto">
            Weekly automated scanning of your site.
            Ranked against 100 of the world&apos;s top e-commerce brands.
            Watch your score improve as you make each fix.
          </p>
        </div>
        <div>
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <a href="/submit" className="inline-flex items-center gap-2 text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-8 py-4 transition-all relative group hover:translate-y-[-2px]">
              Get Your AgentScore <ArrowRight size={14} />
              <span className="absolute inset-0 bg-black/30 -z-10 translate-x-[3px] translate-y-[3px] group-hover:translate-x-[4px] group-hover:translate-y-[4px] transition-transform" />
            </a>
            <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white border-2 border-white/20 hover:border-white/50 px-8 py-4 transition-all">
              View the Leaderboard <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="rounded-xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-bold text-white mb-1">Free</p>
              <p className="text-[10px] text-white/45">Public leaderboard. One scan/month.</p>
            </div>
            <div className="rounded-xl p-5 text-center relative" style={{ backgroundColor: "rgba(2,89,221,0.12)", border: "2px solid rgba(2,89,221,0.3)" }}>
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold bg-[#0259DD] text-white px-2 py-0.5 rounded-full">POPULAR</span>
              <p className="text-sm font-bold text-[#84AFFB] mb-1">Growth — €49/mo</p>
              <p className="text-[10px] text-white/45">5 sites weekly. 6-month trends. Alerts.</p>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-sm font-bold text-white mb-1">Pro — €149/mo</p>
              <p className="text-[10px] text-white/45">20 sites. API. Competitor tracking.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
   ═══════════════════════════════════════════════════════════════════════ */
export function LandscapeContent() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !mainRef.current) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.to(".scroll-progress", {
        scaleX: 1, ease: "none",
        scrollTrigger: { trigger: mainRef.current, start: "top top", end: "bottom bottom", scrub: 0.3 },
      });
      ScrollTrigger.batch(".gsap-reveal", {
        onEnter: (elements) => {
          gsap.fromTo(elements, { opacity: 0, y: 40 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.7, ease: "power3.out" });
        },
        start: "top 88%",
        once: true,
      });
      gsap.utils.toArray<HTMLElement>(".section-divider").forEach((div) => {
        gsap.fromTo(div, { scaleX: 0 }, {
          scaleX: 1, duration: 0.8, ease: "power2.inOut",
          scrollTrigger: { trigger: div, start: "top 95%", once: true },
        });
      });
    }, mainRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={mainRef} className="relative">
      <div className="scroll-progress" style={{ transform: "scaleX(0)" }} />
      <main>
        <HeroSection />
        <SectionNav />
        <div className="section-divider origin-left" />
        <WhyNowSection />
        <div className="section-divider origin-left" />
        <AgentJourneySection />
        <div className="section-divider origin-left" />
        <EcosystemSection />
        <div className="section-divider origin-left" />
        <ProtocolSection />
        <div className="section-divider origin-left" />
        <FrameworkSection />
        <div className="section-divider origin-left" />
        <ScoreScaleSection />
        <div className="section-divider origin-left" />
        <GrowthSection />
        <div className="section-divider origin-left" />
        <GlossarySection />
        <div className="section-divider origin-left" />
        <ActionsSection />
        <div className="section-divider origin-left" />
        <CTASection />
      </main>
    </div>
  );
}
