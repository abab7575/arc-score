"use client";

import { ExternalLink, Clock, Eye, Check, X, RotateCcw } from "lucide-react";

export interface Discovery {
  id: number;
  name: string;
  url: string | null;
  category: string | null;
  discoverySource: string;
  sourceArticleId: number | null;
  reason: string | null;
  mentionCount: number;
  status: string;
  notes: string | null;
  reviewedAt: string | null;
  createdAt: string;
  sourceArticleTitle: string | null;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function categoryBadgeColor(category: string | null) {
  const colors: Record<string, string> = {
    fashion: "bg-pink-500/20 text-pink-600",
    beauty: "bg-rose-500/20 text-rose-600",
    electronics: "bg-cyan-500/20 text-cyan-600",
    home: "bg-amber-500/20 text-amber-600",
    grocery: "bg-lime-500/20 text-lime-600",
    marketplace: "bg-blue-500/20 text-blue-600",
    luxury: "bg-purple-500/20 text-purple-600",
    dtc: "bg-orange-500/20 text-orange-600",
    sports: "bg-teal-500/20 text-teal-600",
    resale: "bg-indigo-500/20 text-indigo-600",
    payments: "bg-emerald-500/20 text-emerald-600",
  };
  return colors[category || ""] || "bg-secondary text-muted-foreground";
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    news_mention: "News",
    competitor_list: "Competitor",
    manual: "Manual",
  };
  return labels[source] || source;
}

interface BrandDiscoveryCardProps {
  discovery: Discovery;
  onAction: (id: number, status: string) => void;
  onBeginTracking: (discovery: Discovery) => void;
}

export default function BrandDiscoveryCard({
  discovery,
  onAction,
  onBeginTracking,
}: BrandDiscoveryCardProps) {
  return (
    <div className="bg-white border border-border shadow-sm rounded-xl p-5 hover:border-border/80 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Name + URL */}
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="text-base font-semibold text-foreground truncate">
              {discovery.name}
            </h3>
            {discovery.url && (
              <a
                href={discovery.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/60 hover:text-[#0259DD] transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {discovery.category && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${categoryBadgeColor(
                  discovery.category
                )}`}
              >
                {discovery.category}
              </span>
            )}
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-secondary text-muted-foreground">
              {sourceLabel(discovery.discoverySource)}
            </span>
            <span className="text-xs text-muted-foreground/60 font-mono">
              &times;{discovery.mentionCount}
            </span>
          </div>

          {/* Reason */}
          {discovery.reason && (
            <p className="text-xs text-muted-foreground/60 line-clamp-2 mb-2">
              {discovery.reason}
            </p>
          )}

          {/* Source article */}
          {discovery.sourceArticleTitle && (
            <p className="text-xs text-muted-foreground/60 truncate">
              From: {discovery.sourceArticleTitle}
            </p>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground/60">
            <Clock className="w-3 h-3" />
            {timeAgo(discovery.createdAt)}
          </div>
        </div>

        {/* Action buttons */}
        {discovery.status === "pending" && (
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={() => onBeginTracking(discovery)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
              title="Begin Tracking"
            >
              <Check className="w-3.5 h-3.5" />
              Track
            </button>
            <button
              onClick={() => onAction(discovery.id, "review_later")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-600 text-xs font-medium hover:bg-yellow-500/30 transition-colors"
              title="Review Later"
            >
              <Eye className="w-3.5 h-3.5" />
              Later
            </button>
            <button
              onClick={() => onAction(discovery.id, "skipped")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 text-xs font-medium hover:bg-red-500/30 transition-colors"
              title="Skip"
            >
              <X className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>
        )}

        {discovery.status === "review_later" && (
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <button
              onClick={() => onBeginTracking(discovery)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 text-xs font-medium hover:bg-emerald-500/30 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Track
            </button>
            <button
              onClick={() => onAction(discovery.id, "skipped")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-600 text-xs font-medium hover:bg-red-500/30 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Skip
            </button>
          </div>
        )}

        {discovery.status === "skipped" && (
          <button
            onClick={() => onAction(discovery.id, "pending")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restore
          </button>
        )}

        {discovery.status === "tracking" && (
          <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium">
            Tracking
          </span>
        )}
      </div>
    </div>
  );
}
