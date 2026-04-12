"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import {
  Loader2,
  CreditCard,
  LogOut,
  Plus,
  X,
  Shield,
  ExternalLink,
} from "lucide-react";

interface AccountData {
  authenticated: boolean;
  customer: {
    id: number;
    email: string;
    name: string | null;
    plan: string;
    planName: string;
    brandLimit: number;
  };
  subscription: {
    status: string;
    plan: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
  claimedBrandIds: number[];
}

interface BrandOption {
  id: number;
  name: string;
  slug: string;
  score: number | null;
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get("welcome") === "1";
  const [account, setAccount] = useState<AccountData | null>(null);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/brands").then((r) => r.json()),
    ]).then(([accountData, brandsData]) => {
      if (!accountData.authenticated) {
        router.push("/login");
        return;
      }
      setAccount(accountData);
      setBrands(
        (brandsData.brands ?? []).map((b: { id: number; name: string; slug: string; latestScore: number | null }) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          score: b.latestScore,
        }))
      );
      setLoading(false);
    }).catch(() => {
      router.push("/login");
    });
  }, [router]);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  async function handleClaimBrand() {
    if (!selectedBrandId) return;
    setClaimLoading(true);
    try {
      const res = await fetch("/api/auth/claim-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandId: parseInt(selectedBrandId) }),
      });
      if (res.ok) {
        // Refresh account data
        const data = await fetch("/api/auth/me").then((r) => r.json());
        setAccount(data);
        setSelectedBrandId("");
      }
    } catch {
      alert("Failed to claim brand");
    } finally {
      setClaimLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!account) return null;

  const claimedBrands = brands.filter((b) =>
    account.claimedBrandIds.includes(b.id)
  );
  const availableBrands = brands.filter(
    (b) => !account.claimedBrandIds.includes(b.id)
  );
  const canClaimMore =
    account.customer.plan !== "free" &&
    claimedBrands.length < account.customer.brandLimit;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Welcome banner for new subscribers */}
        {isWelcome && account.customer.plan !== "free" && (
          <div className="bg-[#0259DD] text-white rounded-xl p-6 mb-6">
            <h2 className="text-lg font-black mb-2">Welcome to {account.customer.planName}.</h2>
            <p className="text-sm text-white/80 mb-4">Your account is active. Here&apos;s how to get started:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a href="/account/watchlist" className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Step 1</div>
                <div className="text-sm font-bold">Set up your watchlist</div>
              </a>
              <a href="/" className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Step 2</div>
                <div className="text-sm font-bold">Browse brand readouts</div>
              </a>
              <a href="/leaderboard" className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                <div className="text-xs font-bold text-white/60 uppercase tracking-wider mb-1">Step 3</div>
                <div className="text-sm font-bold">Check the leaderboard</div>
              </a>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-foreground">Account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {account.customer.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>

        {/* Plan Card */}
        <div className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-[#0259DD]" />
                <span className="text-sm font-bold text-foreground uppercase tracking-wider">
                  {account.customer.planName} Plan
                </span>
              </div>
              {account.subscription ? (
                <p className="text-sm text-muted-foreground">
                  {account.subscription.cancelAtPeriodEnd
                    ? `Cancels on ${new Date(account.subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(account.subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {account.customer.plan === "free"
                    ? "Upgrade to unlock full reports and monitoring"
                    : "Active subscription"}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {account.customer.plan === "free" ? (
                <a
                  href="/pricing"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0259DD] text-white text-sm font-semibold hover:bg-[#0259DD]/90 transition-colors"
                >
                  Upgrade
                </a>
              ) : (
                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {portalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CreditCard className="w-4 h-4" />
                  )}
                  Manage Billing
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Watchlist Link */}
        {account.customer.plan !== "free" && (
          <a
            href="/account/watchlist"
            className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-6 mb-4 hover:border-[#0259DD] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#0259DD]" />
              <div>
                <span className="font-bold text-foreground text-sm">Watchlist</span>
                <p className="text-xs text-muted-foreground">Track brands and get daily change alerts</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#0259DD] transition-colors" />
          </a>
        )}

        {/* Export Link */}
        {account.customer.plan !== "free" && (
          <a
            href="/export"
            className="flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 hover:border-[#0259DD] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#0259DD]" />
              <div>
                <span className="font-bold text-foreground text-sm">Filtered export</span>
                <p className="text-xs text-muted-foreground">Filter by platform, CDN, agent access, and export CSV/JSON</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-[#0259DD] transition-colors" />
          </a>
        )}

        {/* Claimed Brands */}
        {account.customer.plan !== "free" && (
          <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Your Brands
              </h2>
              <span className="text-xs text-muted-foreground">
                {claimedBrands.length} / {account.customer.brandLimit}
              </span>
            </div>

            {claimedBrands.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No brands claimed yet. Claim a brand below to unlock its full report.
              </p>
            ) : (
              <div className="space-y-2 mb-4">
                {claimedBrands.map((brand) => (
                  <div
                    key={brand.id}
                    className="flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground text-sm">
                        {brand.name}
                      </span>
                      {brand.score !== null && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {brand.score}/100
                        </span>
                      )}
                    </div>
                    <a
                      href={`/brand/${brand.slug}`}
                      className="flex items-center gap-1 text-xs text-[#0259DD] hover:underline"
                    >
                      View Report
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {canClaimMore && (
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <select
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                >
                  <option value="">Select a brand to claim...</option>
                  {availableBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleClaimBrand}
                  disabled={!selectedBrandId || claimLoading}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-[#0259DD] text-white text-sm font-medium hover:bg-[#0259DD]/90 disabled:opacity-50 transition-colors"
                >
                  {claimLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Claim
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
