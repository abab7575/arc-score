"use client";

import { Rss, Globe, Mail, Youtube, Headphones, MessageSquare } from "lucide-react";

const SOURCE_TYPE_CONFIG: Record<
  string,
  { icon: typeof Rss; color: string; label: string }
> = {
  rss: { icon: Rss, color: "text-orange-400", label: "RSS" },
  blog: { icon: Globe, color: "text-blue-400", label: "Blog" },
  newsletter: { icon: Mail, color: "text-emerald-400", label: "Newsletter" },
  youtube: { icon: Youtube, color: "text-red-400", label: "YouTube" },
  podcast: { icon: Headphones, color: "text-purple-400", label: "Podcast" },
  reddit: { icon: MessageSquare, color: "text-orange-500", label: "Reddit" },
  twitter: { icon: MessageSquare, color: "text-sky-400", label: "Twitter" },
};

interface SourceTypeIconProps {
  sourceType: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function SourceTypeIcon({
  sourceType,
  size = "sm",
  showLabel = false,
}: SourceTypeIconProps) {
  const config = SOURCE_TYPE_CONFIG[sourceType] || SOURCE_TYPE_CONFIG.rss;
  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <span className={`inline-flex items-center gap-1 ${config.color}`}>
      <Icon className={iconSize} />
      {showLabel && (
        <span className="text-xs font-medium">{config.label}</span>
      )}
    </span>
  );
}

export { SOURCE_TYPE_CONFIG };
