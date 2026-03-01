"use client";

import { useEffect, useState } from "react";
import { Activity, Store, TrendingUp, Clock, RefreshCw } from "lucide-react";

interface ScanHealth {
  lastScanAt: string | null;
  totalBrands: number;
  avgScore: number;
  todayScans: number;
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
    case "A": return "text-emerald-400";
    case "B": return "text-blue-400";
    case "C": return "text-yellow-400";
    case "D": return "text-orange-400";
    case "F": return "text-red-400";
    default: return "text-white/50";
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
    const res = await fetch("/api/admin/dashboard");
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  async function triggerFullScan() {
    setScanning(true);
    await fetch("/api/cron/daily-scan?force=true", { method: "POST" });
    setScanning(false);
  }

  useEffect(() => { fetchData(); }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white/40">Loading...</div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total Brands",
      value: data.totalBrands,
      icon: Store,
      color: "#0259DD",
    },
    {
      label: "Avg Score",
      value: data.avgScore,
      icon: TrendingUp,
      color: "#FBBA16",
    },
    {
      label: "Scans Today",
      value: data.todayScans,
      icon: Activity,
      color: "#7C3AED",
    },
    {
      label: "Last Scan",
      value: data.lastScanAt ? timeAgo(data.lastScanAt) : "Never",
      icon: Clock,
      color: "#FF6648",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <button
          onClick={triggerFullScan}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0259DD] text-white text-sm font-medium hover:bg-[#0259DD]/80 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? "animate-spin" : ""}`} />
          {scanning ? "Starting..." : "Full Scan"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white/5 border border-white/10 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.color + "20" }}
                >
                  <Icon className="w-4 h-4" style={{ color: card.color }} />
                </div>
                <span className="text-sm text-white/50">{card.label}</span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Scans */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider">
            Recent Scans
          </h2>
        </div>
        <div className="divide-y divide-white/5">
          {data.recentScans.map((scan) => (
            <div
              key={scan.id}
              className="px-5 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className={`font-mono font-bold text-lg w-8 ${gradeColor(scan.grade)}`}>
                  {scan.grade}
                </span>
                <div>
                  <p className="text-sm font-medium text-white">{scan.brandName}</p>
                  <p className="text-xs text-white/40">{scan.brandSlug}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-sm font-mono text-white/70">
                  {scan.overallScore}/100
                </span>
                <span className="text-xs text-white/30">
                  {timeAgo(scan.scannedAt)}
                </span>
              </div>
            </div>
          ))}
          {data.recentScans.length === 0 && (
            <div className="px-5 py-8 text-center text-white/30 text-sm">
              No scans yet. Run your first scan above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
