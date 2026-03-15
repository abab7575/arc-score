"use client";

import { useEffect, useState } from "react";
import { Activity, Store, TrendingUp, Clock, RefreshCw, Newspaper, AlertTriangle, GitBranch, Rss } from "lucide-react";

interface DailyBrief {
  todayContent: number;
  highRelevance: number;
  discoveriesToday: number;
  inReviewQueue: number;
  feedsFetchedToday: number;
  totalActiveFeeds: number;
}

interface ScanHealth {
  lastScanAt: string | null;
  totalBrands: number;
  avgScore: number;
  todayScans: number;
  dailyBrief: DailyBrief | null;
  recentScans: {
    id: number;
    brandName: string;
    brandSlug: string;
    overallScore: number;
    grade: string;
    scannedAt: string;
  }[];
}

function gradeColor(grade: string) {
  switch (grade) {
    case "A": return "#059669";
    case "B": return "#0259DD";
    case "C": return "#FBBA16";
    case "D": return "#FF6648";
    case "F": return "#DC2626";
    default: return "#9CA3AF";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "< 1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<ScanHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        setData({ lastScanAt: null, totalBrands: 0, avgScore: 0, todayScans: 0, dailyBrief: null, recentScans: [] });
      }
    } catch {
      setData({ lastScanAt: null, totalBrands: 0, avgScore: 0, todayScans: 0, dailyBrief: null, recentScans: [] });
    }
    setLoading(false);
  }

  async function triggerFullScan() {
    setScanning(true);
    try {
      await fetch("/api/cron/daily-scan?force=true", { method: "POST" });
    } catch { /* ignore */ }
    finally { setScanning(false); }
  }

  useEffect(() => { fetchData(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="font-mono text-xs" style={{ color: "#9CA3AF" }}>Loading...</div>
      </div>
    );
  }

  const cards = [
    { label: "Total Brands", value: data.totalBrands, icon: Store, color: "#0259DD" },
    { label: "Avg Score", value: data.avgScore, icon: TrendingUp, color: "#FBBA16" },
    { label: "Scans Today", value: data.todayScans, icon: Activity, color: "#7C3AED" },
    { label: "Last Scan", value: data.lastScanAt ? timeAgo(data.lastScanAt) : "Never", icon: Clock, color: "#FF6648" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: "#0A1628" }}>
          Dashboard
        </h1>
        <button
          onClick={triggerFullScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 transition-colors relative group"
          style={{ backgroundColor: "#0259DD" }}
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Starting..." : "Full Scan"}
          <span
            className="absolute inset-0 -z-10 transition-transform group-hover:translate-x-[3px] group-hover:translate-y-[3px]"
            style={{ backgroundColor: "#0A1628", transform: "translate(2px, 2px)" }}
          />
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="p-5 relative"
              style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8" }}
            >
              <div
                className="absolute inset-0 -z-10"
                style={{ backgroundColor: card.color + "30", transform: "translate(3px, 3px)" }}
              />
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: card.color + "20" }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="text-xs font-medium" style={{ color: "#6B7280" }}>{card.label}</span>
              </div>
              <div className="text-2xl font-black font-mono" style={{ color: "#0A1628" }}>
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Brief */}
      {data.dailyBrief && (
        <div className="p-5 relative" style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8" }}>
          <div
            className="absolute inset-0 -z-10"
            style={{ backgroundColor: "#7C3AED20", transform: "translate(3px, 3px)" }}
          />
          <h2
            className="font-mono text-[10px] uppercase tracking-widest mb-4"
            style={{ color: "#FF6648" }}
          >
            Daily Brief
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Newspaper, value: data.dailyBrief.todayContent, label: "New Today", color: "#0259DD" },
              { icon: AlertTriangle, value: data.dailyBrief.highRelevance, label: "High Relevance", color: "#FF6648" },
              { icon: GitBranch, value: data.dailyBrief.discoveriesToday, label: "Discoveries", color: "#7C3AED" },
              { icon: Store, value: data.dailyBrief.inReviewQueue, label: "In Queue", color: "#FBBA16" },
              { icon: Rss, value: data.dailyBrief.feedsFetchedToday, label: "Feeds Today", color: "#059669" },
              { icon: Activity, value: data.dailyBrief.totalActiveFeeds, label: "Active Feeds", color: "#9CA3AF" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="text-center">
                  <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: item.color }} />
                  <div className="text-xl font-black font-mono" style={{ color: "#0A1628" }}>{item.value}</div>
                  <div className="font-mono text-[9px] uppercase tracking-wider" style={{ color: "#9CA3AF" }}>{item.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Scans */}
      <div className="relative" style={{ backgroundColor: "#fff", border: "1px solid #E8E0D8" }}>
        <div
          className="absolute inset-0 -z-10"
          style={{ backgroundColor: "#0259DD15", transform: "translate(3px, 3px)" }}
        />
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #E8E0D8" }}>
          <h2 className="font-mono text-[10px] uppercase tracking-widest" style={{ color: "#FF6648" }}>
            Recent Scans
          </h2>
        </div>
        <div>
          {data.recentScans.map((scan, i) => (
            <div
              key={scan.id}
              className="px-5 py-3 flex items-center justify-between"
              style={i < data.recentScans.length - 1 ? { borderBottom: "1px solid #F0E8E0" } : {}}
            >
              <div className="flex items-center gap-4">
                <span
                  className="font-mono font-black text-lg w-8"
                  style={{ color: gradeColor(scan.grade) }}
                >
                  {scan.grade}
                </span>
                <div>
                  <p className="text-sm font-bold" style={{ color: "#0A1628" }}>{scan.brandName}</p>
                  <p className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>{scan.brandSlug}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-mono font-bold" style={{ color: "#6B7280" }}>
                  {scan.overallScore}/100
                </span>
                <span className="font-mono text-[10px]" style={{ color: "#9CA3AF" }}>
                  {timeAgo(scan.scannedAt)}
                </span>
              </div>
            </div>
          ))}
          {data.recentScans.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                No scans yet. Run your first scan above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
