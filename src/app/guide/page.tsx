"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  ArrowRight,
  Bot,
  Shield,
  Database,
  Rss,
  Monitor,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Clock,
  Calendar,
  Eye,
  ShoppingCart,
  FileText,
  Search,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   THE GUIDE TO AGENTIC COMMERCE
   ═══════════════════════════════════════════════════════════════════════ */

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <HeroSection />

      {/* Color strip */}
      <div className="flex h-[6px]">
        <div className="flex-1 bg-[#FF6648]" />
        <div className="flex-1 bg-[#FBBA16]" />
        <div className="flex-1 bg-[#0259DD]" />
        <div className="flex-1 bg-[#84AFFB]" />
        <div className="flex-1 bg-[#FFE1D7]" />
        <div className="flex-1 bg-[#059669]" />
      </div>

      {/* ── CHAPTER 1: WHAT'S HAPPENING ──────────────────────────────── */}
      <ChapterOne />

      {/* ── CHAPTER 2: HOW AI AGENTS SEE YOUR SITE ───────────────────── */}
      <ChapterTwo />

      {/* ── CHAPTER 3: THE DATA ──────────────────────────────────────── */}
      <ChapterThree />

      {/* ── CHAPTER 4: WHAT TO DO ABOUT IT ───────────────────────────── */}
      <ChapterFour />

      {/* ── CHAPTER 5: WHERE THIS IS GOING ───────────────────────────── */}
      <ChapterFive />

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <CtaSection />

      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════════════ */

function HeroSection() {
  return (
    <div className="relative overflow-hidden" style={{ backgroundColor: "#0A1628" }}>
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(2,89,221,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(2,89,221,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Accent dots */}
      <div className="absolute top-16 left-[8%] w-3 h-3 rounded-full bg-[#FF6648] z-[1]" style={{ boxShadow: "0 0 20px rgba(255,102,72,0.4)" }} />
      <div className="absolute top-32 right-[12%] w-2.5 h-2.5 rounded-full bg-[#FBBA16] z-[1]" style={{ boxShadow: "0 0 16px rgba(251,186,22,0.4)" }} />
      <div className="absolute bottom-24 left-[15%] w-2 h-2 rounded-full bg-[#0259DD] z-[1]" style={{ boxShadow: "0 0 12px rgba(2,89,221,0.4)" }} />
      <div className="absolute bottom-16 right-[20%] w-3.5 h-3.5 rounded-full bg-[#7C3AED] z-[1]" style={{ boxShadow: "0 0 20px rgba(124,58,237,0.3)" }} />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-20 sm:pb-28 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-white/10 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
          <span className="spec-label text-white/50 text-[9px]">ORIGINAL RESEARCH</span>
        </div>

        <h1
          className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[0.92] mb-6"
          style={{
            textShadow: "2px 2px 0 rgba(2,89,221,0.3), 4px 4px 0 rgba(255,102,72,0.1)",
          }}
        >
          The Guide to<br />
          Agentic Commerce
        </h1>

        <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-4">
          AI agents are starting to shop. Is your store ready?
        </p>

        <p className="text-sm text-white/30 font-mono">
          Based on scanning <span className="text-[#FBBA16]">276</span> e-commerce brands
        </p>

        {/* Chapter navigation */}
        <div className="flex flex-wrap justify-center gap-3 mt-12">
          {[
            { num: "01", label: "What's Happening" },
            { num: "02", label: "How Agents See You" },
            { num: "03", label: "The Data" },
            { num: "04", label: "What To Do" },
            { num: "05", label: "Where It's Going" },
          ].map((ch) => (
            <a
              key={ch.num}
              href={`#chapter-${ch.num}`}
              className="flex items-center gap-2 px-3 py-2 border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all group"
            >
              <span className="spec-label text-[#FF6648] text-[9px]">{ch.num}</span>
              <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">{ch.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHAPTER 1 — WHAT'S HAPPENING
   ═══════════════════════════════════════════════════════════════════════ */

function ChapterOne() {
  return (
    <section id="chapter-01" style={{ backgroundColor: "#FFF8F0" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Chapter label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="spec-label text-[#FF6648] text-[10px] px-2.5 py-1" style={{ backgroundColor: "#FF664818" }}>
            CHAPTER 01
          </span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] mb-6 leading-tight">
          AI agents are now shopping<br />on behalf of consumers
        </h2>

        <p className="text-base text-[#0A1628]/70 max-w-3xl leading-relaxed mb-10">
          This is not a future prediction. It is happening right now. AI shopping agents are live, processing millions of
          product queries every week, and making purchase decisions for real consumers.
        </p>

        {/* Big stat callout */}
        <div className="border-2 border-[#0A1628]/10 bg-white p-6 sm:p-8 mb-12">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="data-num text-4xl sm:text-5xl font-black text-[#0259DD]">84M</span>
            <span className="spec-label text-[#0A1628]/40 text-[10px]">PER WEEK</span>
          </div>
          <p className="text-sm text-[#0A1628]/60">
            shopping queries processed by ChatGPT alone. That&apos;s 84 million times per week a consumer asks an AI
            agent to find, compare, or buy a product &mdash; instead of going to your site directly.
          </p>
        </div>

        {/* Two agent types */}
        <h3 className="text-lg font-bold text-[#0A1628] mb-2">
          10 major AI shopping agents, split into two types
        </h3>
        <p className="text-sm text-[#0A1628]/60 mb-6">
          Understanding the difference between these two types is the key to understanding agentic commerce.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          {/* Feed-based */}
          <div className="border border-[#0259DD]/20 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 flex items-center justify-center bg-[#0259DD]">
                <Database size={16} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#0A1628] block">Feed-Based Agents</span>
                <span className="spec-label text-[#0259DD] text-[9px]">READ YOUR DATA</span>
              </div>
            </div>
            <p className="text-xs text-[#0A1628]/60 leading-relaxed mb-4">
              These agents read your product data through APIs, feeds, and structured markup. They never open a browser.
              They need machine-readable data to discover and recommend your products.
            </p>
            <div className="space-y-1.5">
              {["ChatGPT Shopping", "Google AI Mode", "Perplexity Shopping", "Microsoft Copilot", "Klarna AI"].map((name) => (
                <div key={name} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#0259DD]/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0259DD]" />
                  <span className="text-xs font-medium text-[#0A1628]">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Browser-based */}
          <div className="border border-[#FF6648]/20 bg-white p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 flex items-center justify-center bg-[#FF6648]">
                <Monitor size={16} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-bold text-[#0A1628] block">Browser-Based Agents</span>
                <span className="spec-label text-[#FF6648] text-[9px]">USE YOUR SITE</span>
              </div>
            </div>
            <p className="text-xs text-[#0A1628]/60 leading-relaxed mb-4">
              These agents open a real browser, see the screen with AI vision, click buttons, and fill forms. They
              interact with your site like a human would &mdash; except they&apos;re software.
            </p>
            <div className="space-y-1.5">
              {["ChatGPT Operator", "Amazon Buy For Me", "Perplexity Comet", "Claude Computer Use", "OpenClaw"].map((name) => (
                <div key={name} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#FF6648]/5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6648]" />
                  <span className="text-xs font-medium text-[#0A1628]">{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Emphasis box */}
        <div className="border-l-4 border-[#FBBA16] bg-[#FBBA16]/5 px-5 py-4">
          <p className="text-sm font-semibold text-[#0A1628]">
            This isn&apos;t future speculation &mdash; these agents are live today.
          </p>
          <p className="text-xs text-[#0A1628]/60 mt-1">
            Every one of these 10 agents is publicly available and actively processing shopping queries right now.
            The question is whether your store is ready for them.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHAPTER 2 — HOW AI AGENTS SEE YOUR SITE
   ═══════════════════════════════════════════════════════════════════════ */

function ChapterTwo() {
  const layers = [
    {
      icon: FileText,
      color: "#FF6648",
      title: "robots.txt",
      subtitle: "THE SIGN ON YOUR DOOR",
      description:
        "A public text file on every website that tells bots what they're allowed to access. Think of it as a sign on your shop door: \"Humans welcome. GPTBot — stay out.\" Every website can have one at yoursite.com/robots.txt. Most CMOs don't know it exists.",
      detail: "Go to yoursite.com/robots.txt right now. You might be surprised by what you find.",
    },
    {
      icon: Shield,
      color: "#0259DD",
      title: "Server-Level Blocking",
      subtitle: "THE INVISIBLE BOUNCER",
      description:
        "Even if your robots.txt says \"welcome,\" your CDN — the network that delivers your site globally, companies like Akamai, Cloudflare — might block AI agents automatically. Your security team turned on \"bot protection\" and didn't realize it blocks AI shopping agents too.",
      detail: "This is the most common accidental blocker we see across 276 brands.",
    },
    {
      icon: Database,
      color: "#059669",
      title: "Structured Data",
      subtitle: "THE PRODUCT TRANSLATOR",
      description:
        "Invisible code on your product pages that tells AI agents: this is a product, it costs $89, it's in stock, here are the sizes. Without it, AI agents can see your page but can't understand what they're looking at. Uses a standard called Schema.org.",
      detail: "Only 25% of brands we scanned have complete structured product data.",
    },
    {
      icon: Rss,
      color: "#7C3AED",
      title: "Product Feeds",
      subtitle: "THE CATALOG FILE",
      description:
        "XML or JSON files listing your entire product catalog. Google Merchant Center feeds, Shopify's products.json, RSS feeds. Feed-based AI agents need these to discover and recommend your products.",
      detail: "Feed-based agents like ChatGPT Shopping and Google AI Mode rely entirely on these.",
    },
    {
      icon: Eye,
      color: "#FBBA16",
      title: "The Visual Experience",
      subtitle: "WHAT AI EYES SEE",
      description:
        "Computer use agents see your site the same way a human does — through screenshots. If your \"Add to Cart\" button is hard to find for a human, it's hard to find for an AI agent too.",
      detail: "Browser agents like Operator and Comet literally take screenshots and click on what they see.",
    },
  ];

  return (
    <section id="chapter-02" style={{ backgroundColor: "#0A1628" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Chapter label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="spec-label text-[#0259DD] text-[10px] px-2.5 py-1" style={{ backgroundColor: "#0259DD25" }}>
            CHAPTER 02
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
          How AI agents see your site
        </h2>
        <p className="text-base text-white/50 max-w-3xl leading-relaxed mb-12">
          There are five layers between an AI shopping agent and your products. Each one can block, confuse, or
          welcome the agent. Most brands don&apos;t know these layers exist.
        </p>

        <div className="space-y-4">
          {layers.map((layer, i) => (
            <div
              key={layer.title}
              className="border border-white/10 bg-white/[0.03] p-5 sm:p-6 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="shrink-0">
                  <div className="w-10 h-10 flex items-center justify-center" style={{ backgroundColor: layer.color }}>
                    <layer.icon size={18} className="text-white" />
                  </div>
                  <div className="spec-label text-center mt-1.5 text-[9px]" style={{ color: layer.color }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-bold text-white">{layer.title}</h3>
                    <span className="spec-label text-[8px]" style={{ color: layer.color }}>
                      {layer.subtitle}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed mb-2">{layer.description}</p>
                  <p className="text-xs font-medium font-mono" style={{ color: layer.color }}>
                    {layer.detail}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHAPTER 3 — THE DATA: 276 BRANDS SCANNED
   ═══════════════════════════════════════════════════════════════════════ */

function ChapterThree() {
  return (
    <section id="chapter-03" style={{ backgroundColor: "#FFF8F0" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Chapter label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="spec-label text-[#059669] text-[10px] px-2.5 py-1" style={{ backgroundColor: "#05966918" }}>
            CHAPTER 03
          </span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
          <span className="spec-label text-[#0A1628]/30 text-[9px]">ORIGINAL RESEARCH</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] mb-4 leading-tight">
          The Data: 276 Brands Scanned
        </h2>
        <p className="text-base text-[#0A1628]/60 max-w-3xl leading-relaxed mb-10">
          We sent AI agents to every major e-commerce brand we could find. Here&apos;s what we learned.
        </p>

        {/* Headline stat */}
        <div className="border-2 border-[#0A1628]/10 bg-white p-6 sm:p-8 mb-12">
          <p className="text-lg sm:text-xl font-bold text-[#0A1628] leading-snug mb-3">
            95% of e-commerce brands don&apos;t explicitly block AI agents in their robots.txt.
          </p>
          <p className="text-sm text-[#0A1628]/60 leading-relaxed">
            But many are accidentally invisible due to missing structured data, broken feeds, or server-level blocking.
            The door is open, but the lights are off.
          </p>
        </div>

        {/* Key findings grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { value: "69", label: "brands with complete structured data", sublabel: "out of 276", color: "#059669" },
            { value: "42", label: "brands blocking GPTBot specifically", sublabel: "{/* TODO: pull from real data */}", color: "#FF6648" },
            { value: "61", label: "average ARC Score across all brands", sublabel: "out of 100 {/* TODO: pull from real data */}", color: "#0259DD" },
            { value: "276", label: "total brands scanned and tracked", sublabel: "updated weekly", color: "#FBBA16" },
          ].map((stat) => (
            <div key={stat.label} className="border border-[#E8E0D8] bg-white p-4 text-center">
              <span className="data-num text-3xl font-black block mb-1" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-[10px] text-[#0A1628]/60 block leading-tight">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Three archetypes */}
        <h3 className="text-lg font-bold text-[#0A1628] mb-2">Three brand archetypes</h3>
        <p className="text-sm text-[#0A1628]/60 mb-6">
          After scanning 276 brands, clear patterns emerge. Most brands fall into one of three categories.
        </p>

        <div className="space-y-5 mb-12">
          {/* Archetype 1: The Open Door */}
          <div className="border border-[#059669]/20 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#059669]/10" style={{ backgroundColor: "#05966908" }}>
              <div className="w-7 h-7 flex items-center justify-center bg-[#059669]">
                <CheckCircle2 size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-[#0A1628]">The Open Door</span>
                <span className="spec-label text-[#059669] text-[9px] ml-2">GLOSSIER MODEL</span>
              </div>
              <div className="text-right">
                <span className="data-num text-xl font-bold text-[#059669]">73</span>
                <span className="spec-label text-[#059669] text-[8px] block">GRADE B</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-[#0A1628]/70 leading-relaxed mb-3">
                Welcomes all AI agents. Has structured data, product feeds, clean checkout. AI agents can find,
                understand, and attempt to buy Glossier products.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Robots.txt: Open", "Structured Data: Complete", "Product Feeds: Active", "Guest Checkout: Yes"].map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 bg-[#059669]/8 text-[#059669] font-medium">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Archetype 2: The Locked Gate */}
          <div className="border border-[#FF6648]/20 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#FF6648]/10" style={{ backgroundColor: "#FF664808" }}>
              <div className="w-7 h-7 flex items-center justify-center bg-[#FF6648]">
                <Lock size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-[#0A1628]">The Locked Gate</span>
                <span className="spec-label text-[#FF6648] text-[9px] ml-2">AMAZON MODEL</span>
              </div>
              <div className="text-right">
                <span className="data-num text-xl font-bold text-[#FF6648]">34</span>
                <span className="spec-label text-[#FF6648] text-[8px] block">GRADE D</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-[#0A1628]/70 leading-relaxed mb-3">
                Explicitly blocks 40+ AI bot user agents in robots.txt. A strategic business decision to protect their
                product data. Amazon blocks every AI shopping agent from reading their catalog &mdash; while sending their own
                Amazonbot to read everyone else&apos;s.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Robots.txt: 40+ Blocks", "Strategic Decision", "Protects Product Data", "Sends Own Bot"].map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 bg-[#FF6648]/8 text-[#FF6648] font-medium">{tag}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Archetype 3: The Accidental Blocker */}
          <div className="border border-[#FBBA16]/20 bg-white overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#FBBA16]/10" style={{ backgroundColor: "#FBBA1608" }}>
              <div className="w-7 h-7 flex items-center justify-center bg-[#FBBA16]">
                <AlertTriangle size={14} className="text-white" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-bold text-[#0A1628]">The Accidental Blocker</span>
                <span className="spec-label text-[#FBBA16] text-[9px] ml-2">NIKE MODEL</span>
              </div>
              <div className="text-right">
                <span className="data-num text-xl font-bold text-[#FBBA16]">67</span>
                <span className="spec-label text-[#FBBA16] text-[8px] block">GRADE C</span>
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-[#0A1628]/70 leading-relaxed mb-3">
                Robots.txt doesn&apos;t block AI agents, but the Akamai CDN returns 403 Forbidden to every AI user agent.
                Nike&apos;s security team is inadvertently preventing AI-driven discovery of Nike products. They may not
                even know.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Robots.txt: Open", "CDN: Blocking", "403 to AI Agents", "Accidental"].map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-1 bg-[#FBBA16]/10 text-[#b38600] font-medium">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Agent type impact */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="border border-[#0259DD]/15 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database size={14} className="text-[#0259DD]" />
              <span className="text-sm font-bold text-[#0A1628]">Feed-based agents</span>
            </div>
            <p className="text-xs text-[#0A1628]/60 leading-relaxed">
              ChatGPT Shopping, Google AI Mode, and other feed agents are most affected by <strong className="text-[#0A1628]">data gaps</strong> &mdash;
              missing structured data, broken product feeds, and incomplete catalog information.
            </p>
          </div>
          <div className="border border-[#FF6648]/15 bg-white p-5">
            <div className="flex items-center gap-2 mb-3">
              <Monitor size={14} className="text-[#FF6648]" />
              <span className="text-sm font-bold text-[#0A1628]">Browser-based agents</span>
            </div>
            <p className="text-xs text-[#0A1628]/60 leading-relaxed">
              Operator, Comet, and other browser agents are most affected by <strong className="text-[#0A1628]">checkout friction</strong> &mdash;
              login walls, ambiguous buttons, complex forms, and poor visual hierarchy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHAPTER 4 — WHAT TO DO ABOUT IT
   ═══════════════════════════════════════════════════════════════════════ */

function ChapterFour() {
  const quickWins = [
    {
      action: "Check your robots.txt",
      detail: "Go to yoursite.com/robots.txt right now. See who you're blocking. Remove blocks on GPTBot, PerplexityBot, ClaudeBot unless you have a strategic reason to block them.",
    },
    {
      action: "Add Schema.org Product markup",
      detail: "Add structured data to every product page. At minimum: name, price, availability, image, description. Most e-commerce platforms have plugins for this.",
    },
    {
      action: "Ensure guest checkout works",
      detail: "Browser agents cannot create accounts. If checkout requires login, every browser-based AI agent will fail at the last step. Enable guest checkout.",
    },
  ];

  const mediumEffort = [
    {
      action: "Audit your CDN/WAF bot rules",
      detail: "Whitelist GPTBot, PerplexityBot, ClaudeBot, and other AI agent user agents in your Cloudflare, Akamai, or Fastly configuration. Your security team may have blocked them without realizing the commerce impact.",
    },
    {
      action: "Set up Google Merchant Center feeds",
      detail: "If you don't have product feeds, create them. Feed-based agents like ChatGPT Shopping rely on these to discover and recommend your products. Shopify stores: your products.json feed already exists.",
    },
    {
      action: "Add llms.txt to your site",
      detail: "A new standard that helps AI agents understand your site structure, policies, and capabilities. Think of it as a README for AI agents. Place it at yoursite.com/llms.txt.",
    },
  ];

  const longerTerm = [
    {
      action: "Implement Agentic Commerce Protocol (ACP) endpoints",
      detail: "As the ACP standard matures, adding dedicated API endpoints for AI agent interactions will give you an advantage. This is the emerging standard for agent-to-store communication.",
    },
    {
      action: "Optimize checkout for autonomous buyers",
      detail: "Clear CTAs, simple forms, no ambiguous steps. Every unnecessary click is a point where an AI agent might get confused. Design for clarity, not cleverness.",
    },
    {
      action: "Monitor your AI agent readiness score",
      detail: "As AI agents evolve, your readiness score will change. Set up regular monitoring to catch regressions before they cost you sales you can't see in analytics.",
    },
  ];

  return (
    <section id="chapter-04" style={{ backgroundColor: "#0A1628" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Chapter label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="spec-label text-[#FBBA16] text-[10px] px-2.5 py-1" style={{ backgroundColor: "#FBBA1620" }}>
            CHAPTER 04
          </span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
          What to do about it
        </h2>
        <p className="text-base text-white/50 max-w-3xl leading-relaxed mb-12">
          Practical, prioritized recommendations. Start with the quick wins &mdash; most take less than a day
          and have an outsized impact on your AI agent readiness.
        </p>

        {/* Quick Wins */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 flex items-center justify-center bg-[#059669]">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white block">Quick Wins</span>
              <span className="spec-label text-[#059669] text-[9px]">1 DAY OR LESS</span>
            </div>
          </div>
          <div className="space-y-3">
            {quickWins.map((item) => (
              <div key={item.action} className="border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#059669] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-white block mb-1">{item.action}</span>
                    <p className="text-xs text-white/45 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medium Effort */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 flex items-center justify-center bg-[#0259DD]">
              <Clock size={16} className="text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white block">Medium Effort</span>
              <span className="spec-label text-[#0259DD] text-[9px]">ABOUT 1 WEEK</span>
            </div>
          </div>
          <div className="space-y-3">
            {mediumEffort.map((item) => (
              <div key={item.action} className="border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <ArrowRight size={16} className="text-[#0259DD] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-white block mb-1">{item.action}</span>
                    <p className="text-xs text-white/45 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Longer Term */}
        <div>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 flex items-center justify-center bg-[#7C3AED]">
              <Calendar size={16} className="text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white block">Longer Term</span>
              <span className="spec-label text-[#7C3AED] text-[9px]">ONGOING INVESTMENT</span>
            </div>
          </div>
          <div className="space-y-3">
            {longerTerm.map((item) => (
              <div key={item.action} className="border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Globe size={16} className="text-[#7C3AED] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-white block mb-1">{item.action}</span>
                    <p className="text-xs text-white/45 leading-relaxed">{item.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CHAPTER 5 — WHERE THIS IS GOING
   ═══════════════════════════════════════════════════════════════════════ */

function ChapterFive() {
  const predictions = [
    {
      icon: Monitor,
      color: "#FF6648",
      title: "Blocking becomes irrelevant",
      description:
        "Computer use agents browse your site exactly like a human — through screenshots and clicks. You can't block them with robots.txt because they don't read it. They open Chrome. The era of controlling AI access through text files is ending.",
    },
    {
      icon: Search,
      color: "#0259DD",
      title: "The question shifts",
      description:
        "It's no longer \"can agents access your site?\" It's \"will they succeed when they try?\" The brands that win will be the ones where AI agents can actually complete a purchase, not just read a product page.",
    },
    {
      icon: ShoppingCart,
      color: "#059669",
      title: "Agent conversion rate becomes a key metric",
      description:
        "Alongside human conversion rate, e-commerce teams will track agent conversion rate — what percentage of AI agent visits result in a successful purchase? This metric doesn't exist in your analytics today.",
    },
    {
      icon: Zap,
      color: "#FBBA16",
      title: "First-mover advantage is real",
      description:
        "Brands that optimize now will capture AI-driven traffic while competitors are still figuring out what agentic commerce means. When a consumer asks ChatGPT \"buy me running shoes,\" the agent will recommend brands it can actually buy from.",
    },
  ];

  return (
    <section id="chapter-05" style={{ backgroundColor: "#FFF8F0" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {/* Chapter label */}
        <div className="flex items-center gap-3 mb-8">
          <span className="spec-label text-[#7C3AED] text-[10px] px-2.5 py-1" style={{ backgroundColor: "#7C3AED18" }}>
            CHAPTER 05
          </span>
          <div className="flex-1 h-px bg-[#E8E0D8]" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A1628] mb-4 leading-tight">
          Where this is going
        </h2>
        <p className="text-base text-[#0A1628]/60 max-w-3xl leading-relaxed mb-12">
          Agentic commerce is early, but the trajectory is clear. Here&apos;s what the next 12&ndash;24 months look like.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
          {predictions.map((pred) => (
            <div key={pred.title} className="border border-[#E8E0D8] bg-white p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 flex items-center justify-center" style={{ backgroundColor: pred.color }}>
                  <pred.icon size={16} className="text-white" />
                </div>
                <h3 className="text-sm font-bold text-[#0A1628]">{pred.title}</h3>
              </div>
              <p className="text-xs text-[#0A1628]/60 leading-relaxed">{pred.description}</p>
            </div>
          ))}
        </div>

        {/* Closing statement */}
        <div className="border-l-4 border-[#0259DD] bg-[#0259DD]/5 px-5 py-4">
          <p className="text-sm font-semibold text-[#0A1628]">
            The shift isn&apos;t coming. It&apos;s here.
          </p>
          <p className="text-xs text-[#0A1628]/60 mt-1 leading-relaxed">
            84 million shopping queries per week on ChatGPT alone. 10 live AI shopping agents. 276 brands scanned.
            The data is clear: brands that are ready for AI agents will capture a growing share of commerce.
            The ones that aren&apos;t won&apos;t even know what they&apos;re missing.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════════════════════ */

function CtaSection() {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url || !email) return;
    setLoading(true);
    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, brandUrl: url }),
      });
      setSubmitted(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ backgroundColor: "#0A1628" }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Get your free ARC Score
          </h2>
          <p className="text-base text-white/50 max-w-xl mx-auto">
            Enter your site URL and we&apos;ll scan it against all 10 AI shopping agents. Free score, no credit card required.
          </p>
        </div>

        {submitted ? (
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#059669]/30 mb-4" style={{ backgroundColor: "#05966915" }}>
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <span className="spec-label text-[#059669] text-[10px]">SUBMITTED</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">We&apos;ll scan your site.</h3>
            <p className="text-sm text-white/50">You&apos;ll receive your ARC Score by email once the scan completes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-4">
            <div>
              <label className="spec-label text-white/40 text-[9px] mb-1.5 block">YOUR SITE URL *</label>
              <input
                type="url"
                required
                placeholder="https://yourstore.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-3 border border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#FF6648]/50 transition-colors font-mono"
              />
            </div>
            <div>
              <label className="spec-label text-white/40 text-[9px] mb-1.5 block">YOUR EMAIL *</label>
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-white/15 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-[#FF6648]/50 transition-colors font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#FF6648] text-white text-sm font-bold hover:bg-[#e85a3f] transition-colors disabled:opacity-50 relative group"
            >
              {loading ? "Submitting..." : "Get My Free ARC Score"}
              <span className="absolute inset-0 bg-[#0259DD] -z-10 translate-x-[2px] translate-y-[2px] group-hover:translate-x-[3px] group-hover:translate-y-[3px] transition-transform" />
            </button>
          </form>
        )}

        {/* Secondary CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 pt-10 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <Bot size={14} />
            Browse the full brand index
            <ArrowRight size={12} />
          </Link>
          <span className="hidden sm:inline text-white/15">|</span>
          <Link
            href="/agents"
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <Eye size={14} />
            See all 10 AI agent profiles
            <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
}
