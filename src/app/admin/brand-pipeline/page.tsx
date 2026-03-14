"use client";

import { useEffect, useState } from "react";
import {
  Search,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Check,
  X,
  GitBranch,
} from "lucide-react";
import BrandDiscoveryCard, {
  type Discovery,
} from "@/components/admin/brand-discovery-card";

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

interface Stats {
  total: number;
  pending: number;
  tracking: number;
  skipped: number;
  reviewLater: number;
  addedThisWeek: number;
  categoriesCovered: number;
}

type TabValue = "pending" | "tracking" | "skipped" | "all";

export default function BrandPipelinePage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabValue>("pending");
  const [search, setSearch] = useState("");

  // Begin Tracking edit state
  const [editingDiscovery, setEditingDiscovery] = useState<Discovery | null>(
    null
  );
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCategory, setEditCategory] = useState("general");

  async function fetchDiscoveries() {
    try {
      const params = new URLSearchParams();
      if (activeTab !== "all") {
        // For pending tab, also show review_later items
        if (activeTab === "pending") {
          // Fetch both pending and review_later
        } else {
          params.set("status", activeTab);
        }
      }
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/brand-pipeline?${params}`);
      if (!res.ok) return;
      const data: Discovery[] = await res.json();

      // Client-side filter for pending tab (show pending + review_later)
      if (activeTab === "pending") {
        setDiscoveries(
          data.filter((d) => d.status === "pending" || d.status === "review_later")
        );
      } else {
        setDiscoveries(data);
      }
    } catch {}
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/admin/brand-pipeline/stats");
      if (res.ok) setStats(await res.json());
    } catch {}
  }

  useEffect(() => {
    Promise.all([fetchDiscoveries(), fetchStats()]).finally(() =>
      setLoading(false)
    );
  }, []);

  useEffect(() => {
    fetchDiscoveries();
  }, [activeTab]);

  async function handleAction(id: number, status: string) {
    await fetch(`/api/admin/brand-pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    // Optimistic update
    setDiscoveries((prev) =>
      prev
        .map((d) => (d.id === id ? { ...d, status } : d))
        .filter((d) => {
          if (activeTab === "pending")
            return d.status === "pending" || d.status === "review_later";
          if (activeTab !== "all") return d.status === activeTab;
          return true;
        })
    );
    fetchStats();
  }

  function openTrackingPanel(discovery: Discovery) {
    setEditingDiscovery(discovery);
    setEditName(discovery.name);
    setEditUrl(
      discovery.url ||
        `https://${discovery.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com`
    );
    setEditCategory(discovery.category || "general");
  }

  function closeTrackingPanel() {
    setEditingDiscovery(null);
    setEditName("");
    setEditUrl("");
    setEditCategory("general");
  }

  async function handleConfirmTracking() {
    if (!editingDiscovery) return;
    await fetch(`/api/admin/brand-pipeline/${editingDiscovery.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "tracking",
        name: editName,
        url: editUrl,
        category: editCategory,
      }),
    });
    setDiscoveries((prev) =>
      prev.filter((d) => d.id !== editingDiscovery.id)
    );
    closeTrackingPanel();
    fetchStats();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchDiscoveries();
  }

  const tabs: { value: TabValue; label: string; count?: number }[] = [
    { value: "pending", label: "Review Queue", count: stats ? stats.pending + stats.reviewLater : undefined },
    { value: "tracking", label: "Recently Added", count: stats?.tracking },
    { value: "skipped", label: "Skipped", count: stats?.skipped },
    { value: "all", label: "All", count: stats?.total },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Brand Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and triage brand discoveries from news monitoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#7C3AED]" />
          <span className="text-sm text-muted-foreground">
            {stats?.pending ?? 0} awaiting review
          </span>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-emerald-600 font-medium uppercase tracking-wider">
                Tracking
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.tracking}</div>
          </div>
          <div className="bg-[#FBBA16]/10 border border-[#FBBA16]/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-[#FBBA16]" />
              <span className="text-xs text-[#FBBA16] font-medium uppercase tracking-wider">
                In Queue
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.pending + stats.reviewLater}
            </div>
          </div>
          <div className="bg-[#0259DD]/10 border border-[#0259DD]/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-[#0259DD]" />
              <span className="text-xs text-[#0259DD] font-medium uppercase tracking-wider">
                This Week
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.addedThisWeek}
            </div>
          </div>
          <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-xs text-[#7C3AED] font-medium uppercase tracking-wider">
                Categories
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {stats.categoriesCovered}
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-[#0259DD] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 text-xs opacity-60">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search discoveries..."
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
          />
        </form>
      </div>

      {/* Begin Tracking edit panel */}
      {editingDiscovery && (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-3">
            Begin Tracking: {editingDiscovery.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground/60 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground/60 mb-1">URL</label>
              <input
                type="url"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground/60 mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              onClick={handleConfirmTracking}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm &amp; Begin Tracking
            </button>
            <button
              onClick={closeTrackingPanel}
              className="px-4 py-2 rounded-lg bg-white border border-border text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Discovery cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {discoveries.length === 0 && (
          <div className="col-span-full bg-white border border-border shadow-sm rounded-xl px-5 py-12 text-center text-muted-foreground/60 text-sm">
            {activeTab === "pending"
              ? "No brands awaiting review. Run a news scan to discover new brands."
              : `No ${activeTab === "all" ? "" : activeTab + " "}discoveries found.`}
          </div>
        )}
        {discoveries.map((d) => (
          <BrandDiscoveryCard
            key={d.id}
            discovery={d}
            onAction={handleAction}
            onBeginTracking={openTrackingPanel}
          />
        ))}
      </div>
    </div>
  );
}
