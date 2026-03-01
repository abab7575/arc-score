import { ExternalLink } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_COLORS, type BrandCategory } from "@/lib/brands";

interface BrandHeaderProps {
  name: string;
  url: string;
  category: string;
  scannedAt: string | null;
}

export function BrandHeader({ name, url, category, scannedAt }: BrandHeaderProps) {
  const initial = name.charAt(0).toUpperCase();
  const catColors = CATEGORY_COLORS[category as BrandCategory] ?? { bg: "bg-gray-50", text: "text-gray-700" };
  const dateStr = scannedAt
    ? new Date(scannedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Not scanned yet";

  return (
    <div className="flex items-center gap-4 py-8">
      <div className="w-14 h-14 rounded-xl bg-[#0259DD]/10 flex items-center justify-center shrink-0">
        <span className="text-2xl font-bold text-[#0259DD]">{initial}</span>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-foreground">{name}</h1>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${catColors.bg} ${catColors.text}`}>
            {CATEGORY_LABELS[category as BrandCategory] ?? category}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-[#0259DD] transition-colors"
          >
            {url.replace(/^https?:\/\//, "")}
            <ExternalLink size={10} />
          </a>
          <span className="text-gray-300">|</span>
          <span>Last scanned: {dateStr}</span>
        </div>
      </div>
    </div>
  );
}
