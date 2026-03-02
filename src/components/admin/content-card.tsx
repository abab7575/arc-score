"use client";

import { ExternalLink, BookOpen, Flag } from "lucide-react";
import SourceTypeIcon from "./source-type-icon";

export interface ContentItem {
  id: number;
  title: string;
  url: string;
  description: string | null;
  publishedAt: string | null;
  sourceType: string;
  relevanceScore: number;
  relevanceTags: string;
  mentionedBrands: string;
  thumbnailUrl: string | null;
  read: boolean;
  flagged: boolean;
  sourceName: string;
}

function relevanceBadge(score: number) {
  if (score >= 70) return { label: "High", className: "bg-emerald-500/20 text-emerald-400" };
  if (score >= 40) return { label: "Medium", className: "bg-yellow-500/20 text-yellow-400" };
  return { label: "Low", className: "bg-white/10 text-white/40" };
}

interface ContentCardProps {
  item: ContentItem;
  onMarkRead: (id: number, read: boolean) => void;
  onToggleFlag: (id: number, flagged: boolean) => void;
}

export default function ContentCard({ item, onMarkRead, onToggleFlag }: ContentCardProps) {
  const badge = relevanceBadge(item.relevanceScore);
  let tags: string[] = [];
  try {
    tags = JSON.parse(item.relevanceTags);
  } catch {}

  return (
    <div
      className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors ${
        item.read ? "opacity-60" : ""
      }`}
    >
      {/* Thumbnail for YouTube/podcast */}
      {item.thumbnailUrl && (
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          <div
            className="h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
          />
        </a>
      )}

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {/* Meta row */}
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${badge.className}`}
              >
                {item.relevanceScore}
              </span>
              <SourceTypeIcon sourceType={item.sourceType} showLabel />
              <span className="text-xs text-white/30 truncate">{item.sourceName}</span>
              {item.publishedAt && (
                <span className="text-xs text-white/20">
                  {new Date(item.publishedAt).toLocaleDateString()}
                </span>
              )}
              {item.flagged && (
                <Flag className="w-3 h-3 text-[#FF6648] flex-shrink-0" />
              )}
            </div>

            {/* Title */}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-white hover:text-[#0259DD] transition-colors inline-flex items-center gap-1"
            >
              <span className="line-clamp-2">{item.title}</span>
              <ExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
            </a>

            {/* Description */}
            {item.description && (
              <p className="text-xs text-white/40 mt-1.5 line-clamp-2">
                {item.description}
              </p>
            )}

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 rounded bg-white/5 text-xs text-white/40"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 4 && (
                  <span className="text-xs text-white/20">+{tags.length - 4}</span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => onMarkRead(item.id, !item.read)}
              className={`p-2 rounded-md hover:bg-white/10 transition-colors ${
                item.read ? "text-emerald-400" : "text-white/30"
              }`}
              title={item.read ? "Mark unread" : "Mark read"}
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              onClick={() => onToggleFlag(item.id, !item.flagged)}
              className={`p-2 rounded-md hover:bg-white/10 transition-colors ${
                item.flagged ? "text-[#FF6648]" : "text-white/30"
              }`}
              title={item.flagged ? "Unflag" : "Flag"}
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
