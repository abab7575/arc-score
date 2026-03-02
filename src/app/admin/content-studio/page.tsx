"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Target,
  TrendingUp,
  Bot,
  CalendarDays,
  Newspaper,
  Loader2,
  Copy,
  Check,
  Megaphone,
} from "lucide-react";
import type { Platform, ContentType } from "@/lib/content-studio/templates";

// ── Types ───────────────────────────────────────────────────────────

interface BrandOption {
  slug: string;
  name: string;
  score: number | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface AgentOption {
  id: string;
  name: string;
  company: string;
  type: string;
}

interface ArticleOption {
  id: number;
  title: string;
  sourceName: string;
  publishedAt: string | null;
}

interface StudioData {
  brands: BrandOption[];
  categories: CategoryOption[];
  agents: AgentOption[];
  articles: ArticleOption[];
}

interface GenerateResult {
  content: string;
  charCount: number;
  platform: Platform;
  contentType: ContentType;
}

// ── Content Type Definitions ────────────────────────────────────────

const CONTENT_TYPES: {
  id: ContentType;
  label: string;
  description: string;
  icon: typeof Trophy;
}[] = [
  { id: "category-leaderboard", label: "Leaderboard", description: "Top brands in a category", icon: Trophy },
  { id: "score-spotlight", label: "Spotlight", description: "Deep-dive on one brand", icon: Target },
  { id: "biggest-movers", label: "Movers", description: "Biggest score changes", icon: TrendingUp },
  { id: "agent-readiness", label: "Agent Ready", description: "Top brands for an agent", icon: Bot },
  { id: "weekly-roundup", label: "Roundup", description: "Weekly stats summary", icon: CalendarDays },
  { id: "news-reaction", label: "News React", description: "React to news articles", icon: Newspaper },
];

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "x", label: "X" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "newsletter", label: "Newsletter" },
];

// ── Page ────────────────────────────────────────────────────────────

export default function ContentStudioPage() {
  // Data
  const [data, setData] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);

  // Selections
  const [contentType, setContentType] = useState<ContentType>("category-leaderboard");
  const [platform, setPlatform] = useState<Platform>("x");

  // Options
  const [categoryId, setCategoryId] = useState("");
  const [brandSlug, setBrandSlug] = useState("");
  const [agentId, setAgentId] = useState("");
  const [direction, setDirection] = useState<"up" | "down" | "both">("both");
  const [count, setCount] = useState(5);
  const [selectedArticleIds, setSelectedArticleIds] = useState<number[]>([]);
  const [commentary, setCommentary] = useState("");
  const [articleSearch, setArticleSearch] = useState("");

  // Output
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Load data ──────────────────────────────────────────────────

  useEffect(() => {
    fetch("/api/admin/content-studio/data")
      .then((r) => r.json())
      .then((d: StudioData) => {
        setData(d);
        if (d.categories.length > 0) setCategoryId(d.categories[0].id);
        if (d.brands.length > 0) setBrandSlug(d.brands[0].slug);
        if (d.agents.length > 0) setAgentId(d.agents[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Generate ───────────────────────────────────────────────────

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    setCopied(false);

    try {
      const res = await fetch("/api/admin/content-studio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType,
          platform,
          categoryId,
          brandSlug,
          agentId,
          direction,
          count,
          articleIds: selectedArticleIds,
          commentary,
        }),
      });
      const data: GenerateResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        content: "Error generating content. Check the console.",
        charCount: 0,
        platform,
        contentType,
      });
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleArticle(id: number) {
    setSelectedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // ── Loading state ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  const filteredArticles = data?.articles.filter((a) =>
    articleSearch
      ? a.title.toLowerCase().includes(articleSearch.toLowerCase())
      : true
  ) ?? [];

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content Studio</h1>
          <p className="text-sm text-white/40 mt-1">
            Turn ARC Score data into social posts in one click
          </p>
        </div>
        <Megaphone className="w-5 h-5 text-[#0259DD]" />
      </div>

      {/* Content Type Grid */}
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">
          Content Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CONTENT_TYPES.map((ct) => {
            const Icon = ct.icon;
            const active = contentType === ct.id;
            return (
              <button
                key={ct.id}
                onClick={() => {
                  setContentType(ct.id);
                  setResult(null);
                }}
                className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-center transition-all ${
                  active
                    ? "bg-[#0259DD]/10 border-[#0259DD] text-white"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{ct.label}</span>
                <span className="text-[10px] text-white/30 leading-tight">{ct.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform Pills */}
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wider font-medium mb-2">
          Platform
        </label>
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 w-fit">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPlatform(p.id);
                setResult(null);
              }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                platform === p.id
                  ? "bg-[#0259DD] text-white"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Options Panel */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
        <label className="block text-xs text-white/40 uppercase tracking-wider font-medium">
          Options
        </label>

        {/* Category Leaderboard */}
        {contentType === "category-leaderboard" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
              >
                {data?.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Count ({count})</label>
              <input
                type="range"
                min={3}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full accent-[#0259DD]"
              />
            </div>
          </div>
        )}

        {/* Score Spotlight */}
        {contentType === "score-spotlight" && (
          <div>
            <label className="block text-xs text-white/40 mb-1">Brand</label>
            <select
              value={brandSlug}
              onChange={(e) => setBrandSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
            >
              {data?.brands.map((b) => (
                <option key={b.slug} value={b.slug}>
                  {b.name} ({b.score ?? "N/A"})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Biggest Movers */}
        {contentType === "biggest-movers" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Direction</label>
              <div className="flex gap-1 bg-white/5 rounded-lg p-1">
                {(["up", "down", "both"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDirection(d)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-1 ${
                      direction === d
                        ? "bg-[#0259DD] text-white"
                        : "text-white/40 hover:text-white"
                    }`}
                  >
                    {d === "up" ? "Up" : d === "down" ? "Down" : "Both"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Count ({count})</label>
              <input
                type="range"
                min={3}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full accent-[#0259DD]"
              />
            </div>
          </div>
        )}

        {/* Agent Readiness */}
        {contentType === "agent-readiness" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Agent</label>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
              >
                {data?.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.company}) — {a.type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">Count ({count})</label>
              <input
                type="range"
                min={3}
                max={10}
                value={count}
                onChange={(e) => setCount(parseInt(e.target.value))}
                className="w-full accent-[#0259DD]"
              />
            </div>
          </div>
        )}

        {/* Weekly Roundup */}
        {contentType === "weekly-roundup" && (
          <p className="text-sm text-white/30">
            No options needed — auto-generates from latest data.
          </p>
        )}

        {/* News Reaction */}
        {contentType === "news-reaction" && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-white/40 mb-1">Search articles</label>
              <input
                type="text"
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                placeholder="Filter articles..."
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
              {filteredArticles.length === 0 && (
                <p className="text-sm text-white/30 py-2">No articles found.</p>
              )}
              {filteredArticles.map((a) => (
                <label
                  key={a.id}
                  className={`flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedArticleIds.includes(a.id)
                      ? "bg-[#0259DD]/10 border border-[#0259DD]/30"
                      : "bg-white/5 border border-transparent hover:bg-white/10"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedArticleIds.includes(a.id)}
                    onChange={() => toggleArticle(a.id)}
                    className="mt-0.5 accent-[#0259DD]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{a.title}</div>
                    <div className="text-[10px] text-white/30">{a.sourceName}</div>
                  </div>
                </label>
              ))}
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1">
                Commentary (optional)
              </label>
              <textarea
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                placeholder="Add your take..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#0259DD] resize-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full py-3 rounded-xl bg-[#0259DD] text-white font-semibold text-sm hover:bg-[#0259DD]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Generating...
          </>
        ) : (
          "Generate Content"
        )}
      </button>

      {/* Preview Panel */}
      {result && (
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40 uppercase tracking-wider font-medium">
                Preview
              </span>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded ${
                  platform === "x" && result.charCount > 280
                    ? "bg-red-500/20 text-red-400"
                    : "bg-white/10 text-white/50"
                }`}
              >
                {result.charCount} chars
                {platform === "x" && result.charCount > 280 && " (over limit!)"}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/10 text-white/60 hover:text-white hover:bg-white/20"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed max-h-[500px] overflow-y-auto">
            {result.content}
          </pre>
        </div>
      )}
    </div>
  );
}
