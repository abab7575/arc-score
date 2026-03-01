import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { AI_AGENT_PROFILES, getFeedAgents, getBrowserAgents } from "@/lib/ai-agents";
import type { AIAgentProfile, AdoptionLevel } from "@/lib/ai-agents";
import { CATEGORY_CONFIG } from "@/lib/constants";
import type { CategoryId } from "@/types/report";
import { ExternalLink, Rss, Monitor, Zap, TrendingUp, Users, ShoppingCart } from "lucide-react";
import { FeedAgentDiagram, BrowserAgentDiagram } from "@/components/agents/paradigm-diagrams";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Shopping Agent Landscape — ARC Score",
  description: "Explore the 10 AI shopping agents reshaping e-commerce. Learn how feed-based and browser-automation agents interact with online stores differently.",
};

const adoptionColors: Record<AdoptionLevel, { bg: string; text: string }> = {
  "Mainstream": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Early Mainstream": { bg: "bg-blue-50", text: "text-blue-700" },
  "Early Adopter": { bg: "bg-amber-50", text: "text-amber-700" },
  "Experimental": { bg: "bg-violet-50", text: "text-violet-700" },
};

function AgentCard({ agent }: { agent: AIAgentProfile }) {
  const topWeights = Object.entries(agent.weights)
    .filter(([, w]) => w > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4) as [CategoryId, number][];

  const adoption = adoptionColors[agent.adoptionLevel];

  return (
    <div className="card-soft rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${agent.type === "feed" ? "bg-[#0259DD]/10" : "bg-[#FF6648]/10"}`}>
            {agent.type === "feed" ? (
              <Rss size={18} className="text-[#0259DD]" />
            ) : (
              <Monitor size={18} className="text-[#FF6648]" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
            <p className="text-[11px] text-muted-foreground">{agent.company}</p>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${adoption.bg} ${adoption.text}`}>
          {agent.adoptionLevel}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
        {agent.description}
      </p>

      <div className="mb-3">
        <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">How it works</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.howItWorks}</p>
      </div>

      <div className="mb-3">
        <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">What it needs from your site</p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{agent.whatItNeeds}</p>
      </div>

      <div className="mb-3">
        <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">Key ARC Score categories</p>
        <div className="flex flex-wrap gap-1.5">
          {topWeights.map(([catId, weight]) => (
            <span
              key={catId}
              className="px-2 py-0.5 bg-gray-50 rounded text-[10px] text-muted-foreground"
            >
              {CATEGORY_CONFIG[catId].name} ({Math.round(weight * 100)}%)
            </span>
          ))}
        </div>
      </div>

      {agent.protocol && (
        <div className="mb-3">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700">
            {agent.protocol}
          </span>
        </div>
      )}

      <a
        href={agent.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[11px] text-[#0259DD] hover:underline"
      >
        Learn more <ExternalLink size={10} />
      </a>
    </div>
  );
}

export default function AgentsPage() {
  const feedAgents = getFeedAgents();
  const browserAgents = getBrowserAgents();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12">

        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="spec-label text-muted-foreground">landscape</span>
            <span className="spec-label text-[#FF6648]">2025</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            The AI Shopping Agent Landscape
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            AI agents are becoming the new storefront. From ChatGPT Shopping to Amazon Buy For Me,
            these autonomous systems discover, compare, and facilitate purchases on behalf of consumers.
            Understanding how they work is the first step to being ready for them.
          </p>
        </div>

        {/* Market Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <div className="card-soft rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp size={14} className="text-[#0259DD]" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Projected Spend</span>
            </div>
            <p className="data-num text-xl font-bold text-foreground">$20.9B</p>
            <p className="text-[10px] text-muted-foreground">AI-influenced purchases by 2026</p>
          </div>
          <div className="card-soft rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Zap size={14} className="text-[#FF6648]" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Traffic Growth</span>
            </div>
            <p className="data-num text-xl font-bold text-foreground">805%</p>
            <p className="text-[10px] text-muted-foreground">YoY AI bot traffic to e-commerce</p>
          </div>
          <div className="card-soft rounded-xl p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Users size={14} className="text-emerald-600" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Daily Queries</span>
            </div>
            <p className="data-num text-xl font-bold text-foreground">50M+</p>
            <p className="text-[10px] text-muted-foreground">ChatGPT shopping queries per day</p>
          </div>
        </div>

        {/* Two Paradigms */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Two Paradigms of AI Shopping
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            AI shopping agents fall into two fundamentally different camps — and they need
            completely different things from your website.
          </p>

          {/* Paradigm 1: Feed/API */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#0259DD]/10 flex items-center justify-center">
                <Rss size={14} className="text-[#0259DD]" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Feed / API-First</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed max-w-2xl">
              These agents read your product data <em>without visiting your website</em>.
              They consume structured feeds, Schema.org markup, and protocol-based APIs
              like ACP to discover and surface products programmatically.
            </p>
            <FeedAgentDiagram />
            <div className="mt-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">What matters most</p>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-[#0259DD]/5 rounded text-[10px] text-[#0259DD]">Structured data</span>
                <span className="px-2 py-0.5 bg-[#0259DD]/5 rounded text-[10px] text-[#0259DD]">Product feeds</span>
                <span className="px-2 py-0.5 bg-[#0259DD]/5 rounded text-[10px] text-[#0259DD]">ACP / APIs</span>
                <span className="px-2 py-0.5 bg-[#0259DD]/5 rounded text-[10px] text-[#0259DD]">robots.txt</span>
              </div>
            </div>
          </div>

          {/* Paradigm 2: Browser Automation */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#FF6648]/10 flex items-center justify-center">
                <Monitor size={14} className="text-[#FF6648]" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Browser Automation</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4 leading-relaxed max-w-2xl">
              These agents <em>actually navigate your website</em> like a human would —
              clicking buttons, filling forms, selecting variants, and attempting the full checkout flow.
              They need a clean, accessible, fast UI.
            </p>
            <BrowserAgentDiagram />
            <div className="mt-3">
              <p className="text-[10px] font-semibold text-foreground uppercase tracking-wider mb-1.5">What matters most</p>
              <div className="flex flex-wrap gap-1">
                <span className="px-2 py-0.5 bg-[#FF6648]/5 rounded text-[10px] text-[#FF6648]">Cart & checkout UX</span>
                <span className="px-2 py-0.5 bg-[#FF6648]/5 rounded text-[10px] text-[#FF6648]">Navigation</span>
                <span className="px-2 py-0.5 bg-[#FF6648]/5 rounded text-[10px] text-[#FF6648]">No bot blocking</span>
                <span className="px-2 py-0.5 bg-[#FF6648]/5 rounded text-[10px] text-[#FF6648]">Page speed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feed/API Agents */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Rss size={16} className="text-[#0259DD]" />
            <h2 className="text-lg font-semibold text-foreground">
              Feed / API-First Agents
            </h2>
            <span className="spec-label text-muted-foreground">{feedAgents.length} agents</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {feedAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* Browser Agents */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={16} className="text-[#FF6648]" />
            <h2 className="text-lg font-semibold text-foreground">
              Browser-Automation Agents
            </h2>
            <span className="spec-label text-muted-foreground">{browserAgents.length} agents</span>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {browserAgents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        {/* Protocol Landscape */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            The Protocol Landscape
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-2xl">
            Emerging commerce protocols aim to let agents facilitate checkout programmatically — no browser needed.
          </p>

          <div className="space-y-3">
            <div className="card-soft rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">ACP</span>
                <h3 className="text-sm font-semibold text-foreground">Agentic Commerce Protocol</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>By:</strong> OpenAI + Stripe
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ACP lets AI agents create checkout sessions via HTTPS/JSON APIs. Merchants expose a
                <code className="text-[10px] bg-gray-50 px-1 rounded mx-0.5">/.well-known/acp</code> discovery document,
                and agents can programmatically browse products, create carts, and initiate Stripe-powered checkouts
                without ever opening a browser. Used by ChatGPT Shopping.
              </p>
            </div>

            <div className="card-soft rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">UCP</span>
                <h3 className="text-sm font-semibold text-foreground">Universal Checkout Protocol</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>By:</strong> Google
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Google&apos;s approach to standardizing AI-driven checkout flows. Integrates with
                Google&apos;s Shopping Graph and Merchant Center to enable agents within Google&apos;s
                ecosystem to facilitate transactions through a unified protocol.
              </p>
            </div>

            <div className="card-soft rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-50 text-pink-700">APP</span>
                <h3 className="text-sm font-semibold text-foreground">Klarna App Protocol</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                <strong>By:</strong> Klarna
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Klarna&apos;s proprietary protocol for enabling AI agents to interact with Klarna-integrated
                merchants. Focuses on payment processing, price comparison, and buy-now-pay-later flows
                within the Klarna ecosystem.
              </p>
            </div>
          </div>
        </section>

        {/* Connection to ARC Score */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            How ARC Score Measures Agent Readiness
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-2xl leading-relaxed">
            ARC Score tests whether AI agents <em>could</em> successfully shop on your site — without
            actually making purchases. We test the full journey: product discovery, data readability,
            navigation, add-to-cart, and checkout reachability. Each AI agent weights these
            categories differently. A brand scoring 85 overall might be excellent for feed-based
            agents but poor for browser agents — or vice versa.
          </p>
          <div className="card-soft rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart size={16} className="text-[#0259DD]" />
              <h3 className="text-sm font-semibold text-foreground">Per-Agent Compatibility Scores</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-3">
              Every brand report on ARC Score includes compatibility scores for all {AI_AGENT_PROFILES.length} agents.
              Each score reflects how well that specific agent could navigate and interact with the site,
              based on its unique weight profile applied to the 7 ARC Score categories.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF6648] hover:underline"
            >
              View the ARC Score Index <ExternalLink size={10} />
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
