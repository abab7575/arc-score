"use client";

import { useState } from "react";
import { ExternalLink, Plus, Loader2 } from "lucide-react";
import {
  TWITTER_ACCOUNTS,
  getTwitterProfileUrl,
} from "@/lib/content/twitter-accounts";

function categoryColor(category: string) {
  const colors: Record<string, string> = {
    ecommerce: "bg-blue-500/20 text-blue-600",
    retail: "bg-orange-500/20 text-orange-600",
    startups: "bg-emerald-500/20 text-emerald-600",
    ai: "bg-purple-500/20 text-purple-600",
    payments: "bg-pink-500/20 text-pink-600",
    analysis: "bg-yellow-500/20 text-yellow-600",
    "ai-agents": "bg-violet-500/20 text-violet-600",
  };
  return colors[category] || "bg-secondary text-muted-foreground";
}

export default function TwitterPanel() {
  const [tweetUrl, setTweetUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<string | null>(null);

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!tweetUrl.trim()) return;

    setAdding(true);
    setAddResult(null);

    try {
      // Extract tweet text from URL — for now we just save the URL as a content item
      const res = await fetch("/api/admin/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Tweet: ${tweetUrl.split("/").pop()}`,
          url: tweetUrl,
          sourceType: "twitter",
          description: `Manually added tweet from ${tweetUrl}`,
        }),
      });

      if (res.ok) {
        setAddResult("Tweet added to newsfeed");
        setTweetUrl("");
      } else {
        setAddResult("Failed to add tweet");
      }
    } catch {
      setAddResult("Network error");
    } finally {
      setAdding(false);
      setTimeout(() => setAddResult(null), 3000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Watched Accounts */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Watched Accounts
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TWITTER_ACCOUNTS.map((account) => (
            <a
              key={account.handle}
              href={getTwitterProfileUrl(account.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 bg-white border border-border shadow-sm rounded-lg hover:border-sky-500/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-600 text-xs font-bold">
                  {account.name[0]}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground group-hover:text-sky-600 transition-colors">
                    {account.name}
                  </div>
                  <div className="text-xs text-muted-foreground/60">@{account.handle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColor(
                    account.category
                  )}`}
                >
                  {account.category}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-sky-600 transition-colors" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Quick Add Tweet */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Quick Add Tweet
        </h3>
        <form onSubmit={handleQuickAdd} className="flex gap-2">
          <input
            type="url"
            value={tweetUrl}
            onChange={(e) => setTweetUrl(e.target.value)}
            placeholder="Paste tweet URL (https://x.com/...)"
            className="flex-1 px-4 py-2.5 rounded-lg bg-white border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <button
            type="submit"
            disabled={adding || !tweetUrl.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add
          </button>
        </form>
        {addResult && (
          <p className="text-xs text-muted-foreground mt-2">{addResult}</p>
        )}
      </div>
    </div>
  );
}
