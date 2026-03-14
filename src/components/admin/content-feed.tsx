"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, Zap } from "lucide-react";
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

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-foreground">Content Feed</h2>
          {stats.draft > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#d97706",
                backgroundColor: "rgba(217, 119, 6, 0.1)",
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {stats.draft} draft{stats.draft !== 1 ? "s" : ""}
            </span>
          )}
          {stats.approved > 0 && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#059669",
                backgroundColor: "rgba(5, 150, 105, 0.1)",
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {stats.approved} approved
            </span>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          style={{
            backgroundColor: "#0259DD",
            color: "#FFFFFF",
          }}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Fresh
            </>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        {/* Platform filter */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["all", "x", "linkedin"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPlatformFilter(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                platformFilter === p
                  ? "bg-[#0259DD] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "all" ? "All" : p === "x" ? "X" : "LinkedIn"}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["draft", "approved", "posted", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-[#0259DD] text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort toggle */}
        <button
          onClick={() => setSortMode(sortMode === "priority" ? "newest" : "priority")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-secondary"
        >
          <RefreshCw className="w-3 h-3" />
          {sortMode === "priority" ? "By Priority" : "Newest First"}
        </button>
      </div>

      {/* Card grid */}
      {items.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "#94A3B8",
          }}
        >
          <p className="text-sm font-medium mb-2">No content yet</p>
          <p className="text-xs text-muted-foreground/60">
            Click &quot;Generate Fresh&quot; to discover stories and create posts
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((item) => (
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
