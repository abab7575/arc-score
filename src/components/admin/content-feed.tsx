"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, Zap, Star, Copy, Check, Download } from "lucide-react";
import { ContentQueueCard } from "./content-queue-card";

interface ContentQueueItem {
  id: number;
  contentType: string;
  platform: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageTemplate: string | null;
  status: string;
  priorityScore: number;
  generatedBy: string;
  createdAt: string;
}

interface QueueStats {
  draft: number;
  approved: number;
  posted: number;
  todayCount: number;
}

type PlatformFilter = "all" | "x" | "linkedin";
type StatusFilter = "all" | "draft" | "approved" | "posted";
type SortMode = "priority" | "newest";

export function ContentFeed() {
  const [items, setItems] = useState<ContentQueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({ draft: 0, approved: 0, posted: 0, todayCount: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("draft");
  const [sortMode, setSortMode] = useState<SortMode>("priority");

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (platformFilter !== "all") params.set("platform", platformFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("sortBy", sortMode);

      const res = await fetch(`/api/admin/content-queue?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setItems(data.items);
      setStats(data.stats);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [platformFilter, statusFilter, sortMode]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/content-queue/generate", { method: "POST" });
      const data = await res.json();
      console.log("Generated:", data);
      await fetchQueue();
    } catch {
      // silent fail
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateImages() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/admin/content-queue/render-images?regenerate=true", { method: "POST" });
      const data = await res.json();
      console.log("Regenerated images:", data);
      await fetchQueue();
    } catch {
      // silent fail
    } finally {
      setRegenerating(false);
    }
  }

  async function handleStatusChange(id: number, status: string) {
    try {
      await fetch(`/api/admin/content-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchQueue();
    } catch {
      // silent fail
    }
  }

  async function handleDelete(id: number) {
    try {
      await fetch(`/api/admin/content-queue/${id}`, { method: "DELETE" });
      await fetchQueue();
    } catch {
      // silent fail
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  // Find the top pick — highest priority draft with an image
  const topPick = items.find((item) => item.status === "draft" && item.imageUrl);
  const restItems = topPick ? items.filter((item) => item.id !== topPick.id) : items;

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Content Feed</h2>
          {stats.draft > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706", backgroundColor: "rgba(217, 119, 6, 0.1)", padding: "2px 8px", borderRadius: 10 }}>
              {stats.draft} draft{stats.draft !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerateImages}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#FF6648", color: "#FFFFFF" }}
          >
            {regenerating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Rendering...</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Regenerate Images</>
            )}
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ backgroundColor: "#0259DD", color: "#FFFFFF" }}
          >
            {generating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Fresh</>
            )}
          </button>
        </div>
      </div>

      {/* ── TOP PICK — Post this one ─────────────────────────────── */}
      {topPick && (
        <TopPickCard
          item={topPick}
          onApprove={() => handleStatusChange(topPick.id, "approved")}
          onDelete={() => handleDelete(topPick.id)}
        />
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["all", "x", "linkedin"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                platformFilter === p ? "bg-[#0259DD] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "All" : p === "x" ? "X" : "LinkedIn"}
            </button>
          ))}
        </div>

        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["draft", "approved", "posted", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s ? "bg-[#0259DD] text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <button
          onClick={() => setSortMode(sortMode === "priority" ? "newest" : "priority")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary"
        >
          <RefreshCw className="w-3 h-3" />
          {sortMode === "priority" ? "By Priority" : "Newest First"}
        </button>
      </div>

      {/* Card grid */}
      {restItems.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "#94A3B8" }}>
          <p className="text-sm font-medium mb-2">No content yet</p>
          <p className="text-xs text-muted-foreground/60">
            Click &quot;Generate Fresh&quot; to discover stories and create posts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {restItems.map((item) => (
            <ContentQueueCard
              key={item.id}
              item={item}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Top Pick Card — Big, prominent, one-click workflow ──────────── */

function TopPickCard({
  item,
  onApprove,
  onDelete,
}: {
  item: ContentQueueItem;
  onApprove: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(item.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border-2 border-[#0259DD] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Star className="w-5 h-5 text-[#FBBA16] fill-[#FBBA16]" />
        <span className="text-sm font-bold text-[#0259DD]">Top Pick — Post This One</span>
        <span className="ml-auto text-xs font-semibold px-2.5 py-1 rounded-full" style={{
          backgroundColor: item.platform === "linkedin" ? "#0A66C2" : "#000",
          color: "#fff",
        }}>
          {item.platform === "linkedin" ? "LinkedIn" : "X"}
        </span>
      </div>

      <div className="flex gap-5">
        {/* Image */}
        {item.imageUrl && (
          <div className="w-[400px] shrink-0 rounded-lg overflow-hidden border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.imageUrl} alt={item.title} className="w-full h-auto" />
          </div>
        )}

        {/* Text + actions */}
        <div className="flex flex-col flex-1 gap-3">
          <h3 className="text-base font-bold text-foreground">{item.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1" style={{ whiteSpace: "pre-wrap" }}>
            {item.body.length > 400 ? item.body.slice(0, 400) + "..." : item.body}
          </p>
          <span className="text-xs text-muted-foreground">{item.body.length} chars</span>

          {/* Quick actions — big buttons */}
          <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-100">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
              style={{ backgroundColor: "#0259DD", color: "#fff" }}
            >
              {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy Text</>}
            </button>
            {item.imageUrl && (
              <a
                href={item.imageUrl}
                download={`${item.title.replace(/[^a-zA-Z0-9]/g, "-")}.png`}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
                style={{ backgroundColor: "#FF6648", color: "#fff" }}
              >
                <Download className="w-4 h-4" /> Download Image
              </a>
            )}
            <button
              onClick={onApprove}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
            >
              Mark Posted
            </button>
            <button
              onClick={onDelete}
              className="ml-auto text-xs text-muted-foreground hover:text-red-500 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
