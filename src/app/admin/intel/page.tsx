"use client";

import { useEffect, useState } from "react";
import {
  Search,
  BookOpen,
  Flag,
  ExternalLink,
  Plus,
  X,
  Loader2,
  Rss,
  Check,
} from "lucide-react";

interface Article {
  id: number;
  title: string;
  url: string;
  description: string | null;
  publishedAt: string | null;
  relevanceScore: number;
  relevanceTags: string; // JSON
  mentionedBrands: string; // JSON
  read: boolean;
  flagged: boolean;
  sourceName: string;
}

interface SuggestedBrand {
  id: number;
  name: string;
  url: string | null;
  mentionCount: number;
  status: string;
}

interface ScanResult {
  totalItems: number;
  newArticles: number;
  highRelevance: number;
  newSuggestions: number;
  errors: string[];
}

function relevanceBadge(score: number) {
  if (score >= 70) return { label: "High", className: "bg-emerald-500/20 text-emerald-600" };
  if (score >= 40) return { label: "Medium", className: "bg-yellow-500/20 text-yellow-600" };
  return { label: "Low", className: "bg-secondary text-muted-foreground" };
}

const BRAND_CATEGORIES = [
  "general",
  "fashion",
  "beauty",
  "electronics",
  "home",
  "grocery",
  "marketplace",
  "luxury",
  "dtc",
  "sports",
  "resale",
  "payments",
];

export default function AdminIntelPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  // Scan state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Edit-before-add state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("general");

  // Filters
  const [search, setSearch] = useState("");
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [minRelevance, setMinRelevance] = useState(0);
  const [sourceId, setSourceId] = useState<number | undefined>();

  async function fetchArticles() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterUnread) params.set("unread", "true");
    if (filterFlagged) params.set("flagged", "true");
    if (minRelevance > 0) params.set("minRelevance", String(minRelevance));
    if (sourceId) params.set("sourceId", String(sourceId));

    const res = await fetch(`/api/admin/news?${params}`);
    setArticles(await res.json());
  }

  async function fetchSuggestions() {
    const res = await fetch("/api/admin/suggested-brands");
    setSuggestions(await res.json());
  }

  useEffect(() => {
    Promise.all([fetchArticles(), fetchSuggestions()]).then(() =>
      setLoading(false)
    );
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchArticles();
  }, [filterUnread, filterFlagged, minRelevance, sourceId]);

  async function handleScanNews() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/admin/news/scan", { method: "POST" });
      const result: ScanResult = await res.json();
      setScanResult(result);
      // Refresh articles and suggestions
      await Promise.all([fetchArticles(), fetchSuggestions()]);
    } catch {
      setScanResult({
        totalItems: 0,
        newArticles: 0,
        highRelevance: 0,
        newSuggestions: 0,
        errors: ["Network error — scan failed"],
      });
    } finally {
      setScanning(false);
    }
  }

  async function handleMarkRead(id: number, read: boolean) {
    await fetch(`/api/admin/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read } : a))
    );
  }

  async function handleToggleFlag(id: number, flagged: boolean) {
    await fetch(`/api/admin/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged }),
    });
    setArticles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, flagged } : a))
    );
  }

  function openEditPanel(s: SuggestedBrand) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditUrl(
      s.url || `https://${s.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`
    );
    setEditCategory("general");
  }

  function closeEditPanel() {
    setEditingId(null);
    setEditName("");
    setEditUrl("");
    setEditCategory("general");
  }

  async function handleAddBrand() {
    if (!editingId) return;
    await fetch(`/api/admin/suggested-brands/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "added",
        name: editName,
        url: editUrl,
        category: editCategory,
      }),
    });
    setSuggestions((prev) => prev.filter((s) => s.id !== editingId));
    closeEditPanel();
  }

  async function handleDismiss(id: number) {
    await fetch(`/api/admin/suggested-brands/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "dismissed" }),
    });
    setSuggestions((prev) => prev.filter((s) => s.id !== id));
    if (editingId === id) closeEditPanel();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchArticles();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Scan button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Intel</h1>
        <button
          onClick={handleScanNews}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0259DD] text-white text-sm font-medium hover:bg-[#0259DD]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rss className="w-4 h-4" />
          )}
          {scanning ? "Scanning..." : "Scan News"}
        </button>
      </div>

      {/* Scan result banner */}
      {scanResult && (
        <div
          className={`rounded-xl px-5 py-4 text-sm ${
            scanResult.errors.length > 0 && scanResult.newArticles === 0
              ? "bg-red-500/10 border border-red-500/20 text-red-600"
              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>
                <strong>{scanResult.newArticles}</strong> new articles
              </span>
              <span>
                <strong>{scanResult.highRelevance}</strong> high relevance
              </span>
              <span>
                <strong>{scanResult.newSuggestions}</strong> new brand suggestions
              </span>
              <span className="text-muted-foreground/60">
                {scanResult.totalItems} items checked
              </span>
            </div>
            <button
              onClick={() => setScanResult(null)}
              className="p-1 hover:bg-secondary rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {scanResult.errors.length > 0 && (
            <div className="mt-2 text-xs text-muted-foreground/60">
              {scanResult.errors.length} feed error{scanResult.errors.length !== 1 && "s"} (some feeds may be unavailable)
            </div>
          )}
        </div>
      )}

      {/* Suggested Brands */}
      {suggestions.length > 0 && (
        <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#7C3AED] uppercase tracking-wider mb-3">
            Suggested Brands from News
          </h2>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                  editingId === s.id
                    ? "bg-[#7C3AED]/20 border-[#7C3AED]/40"
                    : "bg-white border-border"
                }`}
              >
                <span className="text-sm text-foreground">{s.name}</span>
                <span className="text-xs text-muted-foreground/60">&times;{s.mentionCount}</span>
                <button
                  onClick={() => openEditPanel(s)}
                  className="p-0.5 rounded hover:bg-emerald-500/20 text-emerald-600"
                  title="Add brand"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDismiss(s.id)}
                  className="p-0.5 rounded hover:bg-red-500/20 text-red-600"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Edit-before-add panel */}
          {editingId && (
            <div className="mt-4 bg-white border border-border shadow-sm rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Add Brand
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted-foreground/60 mb-1">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground/60 mb-1">URL</label>
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground/60 mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                  >
                    {BRAND_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAddBrand}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Add Brand
                </button>
                <button
                  onClick={closeEditPanel}
                  className="px-4 py-2 rounded-lg bg-white border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
          />
        </form>

        <button
          onClick={() => setFilterUnread(!filterUnread)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            filterUnread
              ? "bg-[#0259DD] text-white"
              : "bg-white border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Unread
        </button>

        <button
          onClick={() => setFilterFlagged(!filterFlagged)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            filterFlagged
              ? "bg-[#FF6648] text-white"
              : "bg-white border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          Flagged
        </button>

        <select
          value={minRelevance}
          onChange={(e) => setMinRelevance(parseInt(e.target.value))}
          className="px-3 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
        >
          <option value={0}>All Relevance</option>
          <option value={20}>20+ Relevance</option>
          <option value={40}>40+ Relevance</option>
          <option value={70}>70+ Relevance</option>
        </select>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {articles.length === 0 && (
          <div className="bg-white border border-border shadow-sm rounded-xl px-5 py-12 text-center text-muted-foreground/60 text-sm">
            No articles found. Click &quot;Scan News&quot; to fetch the latest.
          </div>
        )}
        {articles.map((article) => {
          const badge = relevanceBadge(article.relevanceScore);
          let tags: string[] = [];
          try {
            tags = JSON.parse(article.relevanceTags);
          } catch {}

          return (
            <div
              key={article.id}
              className={`bg-white border border-border shadow-sm rounded-xl px-5 py-4 ${
                article.read ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
                    >
                      {article.relevanceScore}
                    </span>
                    <span className="text-xs text-muted-foreground/60">{article.sourceName}</span>
                    {article.publishedAt && (
                      <span className="text-xs text-muted-foreground/60">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    )}
                    {article.flagged && (
                      <Flag className="w-3 h-3 text-[#FF6648]" />
                    )}
                  </div>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-foreground hover:text-[#0259DD] transition-colors inline-flex items-center gap-1"
                  >
                    {article.title}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>

                  {article.description && (
                    <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-2">
                      {article.description}
                    </p>
                  )}

                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 py-0.5 rounded bg-secondary text-xs text-muted-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMarkRead(article.id, !article.read)}
                    className={`p-2 rounded-md hover:bg-secondary transition-colors ${
                      article.read ? "text-emerald-600" : "text-muted-foreground/60"
                    }`}
                    title={article.read ? "Mark unread" : "Mark read"}
                  >
                    <BookOpen className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleFlag(article.id, !article.flagged)}
                    className={`p-2 rounded-md hover:bg-secondary transition-colors ${
                      article.flagged ? "text-[#FF6648]" : "text-muted-foreground/60"
                    }`}
                    title={article.flagged ? "Unflag" : "Flag"}
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
