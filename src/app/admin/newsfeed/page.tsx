"use client";

import { useEffect, useState } from "react";
import {
  Search,
  BookOpen,
  Flag,
  Loader2,
  Rss,
  X,
  SortAsc,
  LayoutGrid,
  List,
} from "lucide-react";
import ContentCard, { type ContentItem } from "@/components/admin/content-card";

type SourceTypeFilter = "all" | "rss" | "blog" | "youtube" | "podcast" | "reddit" | "newsletter";
type SortMode = "newest" | "relevance";
type ViewMode = "grid" | "list";

interface ScanResult {
  totalItems: number;
  newArticles: number;
  highRelevance: number;
  newSuggestions: number;
  errors: string[];
}

const SOURCE_TYPE_TABS: { value: SourceTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "rss", label: "RSS" },
  { value: "blog", label: "Blog" },
  { value: "youtube", label: "YouTube" },
  { value: "podcast", label: "Podcast" },
  { value: "reddit", label: "Reddit" },
  { value: "newsletter", label: "Newsletter" },
];

export default function NewsfeedPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceTypeFilter>("all");
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [minRelevance, setMinRelevance] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  async function fetchItems() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (filterUnread) params.set("unread", "true");
    if (filterFlagged) params.set("flagged", "true");
    if (minRelevance > 0) params.set("minRelevance", String(minRelevance));
    params.set("limit", "100");

    const res = await fetch(`/api/admin/news?${params}`);
    let data: ContentItem[] = await res.json();

    // Client-side source type filter
    if (sourceTypeFilter !== "all") {
      data = data.filter((item) => (item.sourceType || "rss") === sourceTypeFilter);
    }

    // Sort
    if (sortMode === "relevance") {
      data.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    setItems(data);
  }

  useEffect(() => {
    fetchItems().then(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [filterUnread, filterFlagged, minRelevance, sourceTypeFilter, sortMode]);

  async function handleScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/admin/news/scan", { method: "POST" });
      const result: ScanResult = await res.json();
      setScanResult(result);
      await fetchItems();
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
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, read } : a)));
  }

  async function handleToggleFlag(id: number, flagged: boolean) {
    await fetch(`/api/admin/news/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flagged }),
    });
    setItems((prev) => prev.map((a) => (a.id === id ? { ...a, flagged } : a)));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchItems();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Newsfeed</h1>
          <p className="text-sm text-white/40 mt-1">
            {items.length} items from {new Set(items.map((i) => i.sourceName)).size} sources
          </p>
        </div>
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0259DD] text-white text-sm font-medium hover:bg-[#0259DD]/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rss className="w-4 h-4" />
          )}
          {scanning ? "Scanning..." : "Scan All Sources"}
        </button>
      </div>

      {/* Scan result banner */}
      {scanResult && (
        <div
          className={`rounded-xl px-5 py-4 text-sm ${
            scanResult.errors.length > 0 && scanResult.newArticles === 0
              ? "bg-red-500/10 border border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span><strong>{scanResult.newArticles}</strong> new items</span>
              <span><strong>{scanResult.highRelevance}</strong> high relevance</span>
              <span><strong>{scanResult.newSuggestions}</strong> brand suggestions</span>
              <span className="text-white/30">{scanResult.totalItems} checked</span>
            </div>
            <button onClick={() => setScanResult(null)} className="p-1 hover:bg-white/10 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {scanResult.errors.length > 0 && (
            <div className="mt-2 text-xs text-white/40">
              {scanResult.errors.length} feed error{scanResult.errors.length !== 1 && "s"}
            </div>
          )}
        </div>
      )}

      {/* Source type tabs */}
      <div className="flex items-center gap-3 overflow-x-auto">
        <div className="flex gap-1 bg-white/5 rounded-lg p-1 flex-shrink-0">
          {SOURCE_TYPE_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSourceTypeFilter(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                sourceTypeFilter === tab.value
                  ? "bg-[#0259DD] text-white"
                  : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
          />
        </form>

        <button
          onClick={() => setFilterUnread(!filterUnread)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            filterUnread
              ? "bg-[#0259DD] text-white"
              : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
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
              : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
          }`}
        >
          <Flag className="w-3.5 h-3.5" />
          Flagged
        </button>

        <select
          value={minRelevance}
          onChange={(e) => setMinRelevance(parseInt(e.target.value))}
          className="px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
        >
          <option value={0}>All Relevance</option>
          <option value={20}>20+</option>
          <option value={40}>40+</option>
          <option value={70}>70+</option>
        </select>

        <button
          onClick={() => setSortMode(sortMode === "newest" ? "relevance" : "newest")}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:text-white transition-colors"
        >
          <SortAsc className="w-3.5 h-3.5" />
          {sortMode === "newest" ? "Newest" : "Relevance"}
        </button>

        <button
          onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors"
        >
          {viewMode === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
        </button>
      </div>

      {/* Content cards */}
      {items.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-12 text-center text-white/30 text-sm">
          No items found. Click &quot;Scan All Sources&quot; to fetch the latest.
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3"
              : "space-y-3"
          }
        >
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              onMarkRead={handleMarkRead}
              onToggleFlag={handleToggleFlag}
            />
          ))}
        </div>
      )}
    </div>
  );
}
