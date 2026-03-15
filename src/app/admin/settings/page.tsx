"use client";

import { useEffect, useState } from "react";
import {
  Rss,
  Globe,
  Mail,
  Youtube,
  Headphones,
  MessageSquare,
  Loader2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Key,
  Activity,
} from "lucide-react";
import TwitterPanel from "@/components/admin/twitter-panel";

interface FeedSource {
  id: number;
  name: string;
  url: string;
  category: string;
  sourceType: string;
  active: boolean;
  lastFetchedAt: string | null;
}

function sourceTypeIcon(type: string) {
  const icons: Record<string, typeof Rss> = {
    rss: Rss,
    blog: Globe,
    newsletter: Mail,
    youtube: Youtube,
    podcast: Headphones,
    reddit: MessageSquare,
    twitter: MessageSquare,
  };
  return icons[type] || Rss;
}

function sourceTypeColor(type: string) {
  const colors: Record<string, string> = {
    rss: "text-orange-600",
    blog: "text-blue-600",
    newsletter: "text-emerald-600",
    youtube: "text-red-600",
    podcast: "text-purple-600",
    reddit: "text-orange-600",
    twitter: "text-sky-600",
  };
  return colors[type] || "text-muted-foreground";
}

export default function SettingsPage() {
  const [sources, setSources] = useState<FeedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<
    "sources" | "twitter" | "status" | "api"
  >("sources");

  async function fetchSources() {
    try {
      const res = await fetch("/api/admin/sources");
      if (res.ok) setSources(await res.json());
    } catch {}
  }

  useEffect(() => {
    fetchSources().finally(() => setLoading(false));
  }, []);

  async function handleToggleSource(id: number, active: boolean) {
    try {
      await fetch(`/api/admin/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active }),
      });
      setSources((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active } : s))
      );
    } catch { /* ignore */ }
  }

  async function handleDeleteSource(id: number) {
    try {
      await fetch(`/api/admin/sources/${id}`, { method: "DELETE" });
      setSources((prev) => prev.filter((s) => s.id !== id));
    } catch { /* ignore */ }
  }

  // Group sources by type
  const sourcesByType = sources.reduce(
    (acc, s) => {
      const type = s.sourceType || "rss";
      if (!acc[type]) acc[type] = [];
      acc[type].push(s);
      return acc;
    },
    {} as Record<string, FeedSource[]>
  );

  const sections = [
    { id: "sources" as const, label: "Sources", icon: Rss },
    { id: "twitter" as const, label: "Twitter", icon: MessageSquare },
    { id: "status" as const, label: "Scan Status", icon: Activity },
    { id: "api" as const, label: "API Keys", icon: Key },
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
      <h1 className="text-2xl font-bold text-foreground">Settings</h1>

      {/* Section tabs */}
      <div className="flex gap-1 bg-secondary rounded-lg p-1 w-fit">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-[#0259DD] text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Sources section */}
      {activeSection === "sources" && (
        <div className="space-y-6">
          {/* Source type summary */}
          <div className="flex flex-wrap gap-3">
            {Object.entries(sourcesByType).map(([type, typeSources]) => {
              const Icon = sourceTypeIcon(type);
              const activeCount = typeSources.filter((s) => s.active).length;
              return (
                <div
                  key={type}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-border shadow-sm rounded-lg"
                >
                  <Icon className={`w-4 h-4 ${sourceTypeColor(type)}`} />
                  <span className="text-sm text-foreground capitalize">{type}</span>
                  <span className="text-xs text-muted-foreground/60">
                    {activeCount}/{typeSources.length}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sources grouped by type */}
          {Object.entries(sourcesByType).map(([type, typeSources]) => (
            <div key={type}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 capitalize">
                {type} ({typeSources.length})
              </h3>
              <div className="space-y-1">
                {typeSources.map((source) => (
                  <div
                    key={source.id}
                    className={`flex items-center justify-between px-4 py-2.5 bg-white border border-border shadow-sm rounded-lg ${
                      !source.active ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm text-foreground truncate">
                        {source.name}
                      </span>
                      <span className="text-xs text-muted-foreground/60 truncate hidden sm:inline">
                        {source.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {source.lastFetchedAt && (
                        <span className="text-xs text-muted-foreground/60 hidden md:inline">
                          {new Date(source.lastFetchedAt).toLocaleDateString()}
                        </span>
                      )}
                      <button
                        onClick={() =>
                          handleToggleSource(source.id, !source.active)
                        }
                        className={`p-1 rounded hover:bg-secondary transition-colors ${
                          source.active ? "text-emerald-600" : "text-muted-foreground/60"
                        }`}
                        title={source.active ? "Disable" : "Enable"}
                      >
                        {source.active ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteSource(source.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-muted-foreground/60 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Twitter section */}
      {activeSection === "twitter" && <TwitterPanel />}

      {/* Scan Status section */}
      {activeSection === "status" && (
        <div className="space-y-4">
          <div className="bg-white border border-border shadow-sm rounded-xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Feed Health
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {sources.length}
                </div>
                <div className="text-xs text-muted-foreground/60">Total Sources</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">
                  {sources.filter((s) => s.active).length}
                </div>
                <div className="text-xs text-muted-foreground/60">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">
                  {
                    sources.filter(
                      (s) =>
                        s.lastFetchedAt &&
                        Date.now() - new Date(s.lastFetchedAt).getTime() <
                          24 * 60 * 60 * 1000
                    ).length
                  }
                </div>
                <div className="text-xs text-muted-foreground/60">Fetched Today</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {
                    sources.filter(
                      (s) =>
                        s.active &&
                        (!s.lastFetchedAt ||
                          Date.now() - new Date(s.lastFetchedAt).getTime() >
                            3 * 24 * 60 * 60 * 1000)
                    ).length
                  }
                </div>
                <div className="text-xs text-muted-foreground/60">Stale (3d+)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Keys section */}
      {activeSection === "api" && (
        <div className="space-y-4">
          <div className="bg-white border border-border shadow-sm rounded-xl p-5">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Configured Services
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">CRON_SECRET</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-600">
                  Set
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">ADMIN_PASSWORD</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-600">
                  Set
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-foreground">ANTHROPIC_API_KEY</span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
                  Not Set (Phase 5)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
