"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Loader2, Trash2, ExternalLink, Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WatchlistEntry {
  id: number;
  brandId: number;
  brandSlug: string;
  brandName: string;
  brandCategory: string;
  createdAt: string;
}

interface ChangelogEntry {
  id: number;
  brandId: number;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  detectedAt: string;
}

export default function WatchlistPage() {
  const router = useRouter();
  const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
  const [changes, setChanges] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/watchlist").then((r) => r.json()),
      fetch("/api/changelog?limit=100").then((r) => r.json()),
    ])
      .then(([watchData, changeData]) => {
        if (watchData.error === "Not authenticated") {
          router.push("/login");
          return;
        }
        setWatchlist(watchData.watchlist ?? []);
        setChanges(changeData.entries ?? []);
        setLoading(false);
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleRemove(brandId: number) {
    setRemoving(brandId);
    try {
      await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId }),
      });
      setWatchlist((prev) => prev.filter((w) => w.brandId !== brandId));
    } catch {
      alert("Failed to remove brand");
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const watchedBrandIds = new Set(watchlist.map((w) => w.brandId));
  const recentChanges = changes.filter((c) => watchedBrandIds.has(c.brandId));
  const brandNameMap = new Map(watchlist.map((w) => [w.brandId, w.brandName]));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6">
          <Link
            href="/account"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Account
          </Link>
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-[#0259DD]" />
            <h1 className="text-2xl font-black text-foreground">Watchlist</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Track brands and get daily alerts when their agent access changes.
          </p>
        </div>

        {/* Watched Brands */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
            Tracked Brands ({watchlist.length})
          </h2>

          {watchlist.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground mb-3">
                No brands tracked yet. Visit any brand page and click &ldquo;Track
                this brand&rdquo; to get started.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0259DD] text-white text-sm font-semibold hover:bg-[#0259DD]/90 transition-colors"
              >
                Browse brands
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlist.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div>
                    <Link
                      href={`/brand/${entry.brandSlug}`}
                      className="font-medium text-foreground text-sm hover:text-[#0259DD] transition-colors"
                    >
                      {entry.brandName}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {entry.brandCategory}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/brand/${entry.brandSlug}`}
                      className="flex items-center gap-1 text-xs text-[#0259DD] hover:underline"
                    >
                      View
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                    <button
                      onClick={() => handleRemove(entry.brandId)}
                      disabled={removing === entry.brandId}
                      className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      {removing === entry.brandId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Changes for Watched Brands */}
        {watchlist.length > 0 && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">
              Recent Changes
            </h2>

            {recentChanges.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No recent changes for your tracked brands.
              </p>
            ) : (
              <div className="space-y-3">
                {recentChanges.slice(0, 20).map((change) => (
                  <div
                    key={change.id}
                    className="px-4 py-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {brandNameMap.get(change.brandId) ??
                          `Brand #${change.brandId}`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(change.detectedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{change.field}</span>:{" "}
                      <span className="text-red-500 line-through">
                        {change.oldValue ?? "none"}
                      </span>{" "}
                      &rarr;{" "}
                      <span className="text-green-600">
                        {change.newValue ?? "none"}
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
