"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { CheckCircle, Loader2 } from "lucide-react";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) {
          router.push("/account");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          name,
          stripeSessionId: sessionId,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/account?welcome=1");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-black text-foreground mb-2">
            No checkout session found
          </h1>
          <p className="text-muted-foreground mb-6">
            This page requires a valid checkout session. If you just completed a payment, check your email for confirmation.
          </p>
          <a href="/pricing" className="text-sm font-bold text-[#0259DD] hover:underline">
            Back to Pricing
          </a>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#059669]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#059669]" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">
            You&apos;re in. Welcome to Pro.
          </h1>
          <p className="text-muted-foreground">
            Set up your account below and you&apos;re ready to go.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0259DD] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0259DD] focus:border-transparent"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use the same email you used at checkout.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0259DD] focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-[#FF6648]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-[#0259DD] text-white font-semibold hover:bg-[#0259DD]/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* What happens next */}
        <div className="mt-10 border-t border-gray-200 pt-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4">
            What happens next
          </h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0259DD] text-white text-xs font-bold shrink-0 mt-0.5">1</span>
              <span><span className="font-semibold text-foreground">Set up your first watchlist.</span> Pick the brands you want to track daily.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0259DD] text-white text-xs font-bold shrink-0 mt-0.5">2</span>
              <span><span className="font-semibold text-foreground">Browse brand readouts.</span> Every brand has a live profile with agent access data.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0259DD] text-white text-xs font-bold shrink-0 mt-0.5">3</span>
              <span><span className="font-semibold text-foreground">Check your email.</span> You&apos;ll start receiving daily change alerts right away.</span>
            </li>
          </ol>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-[#0259DD] hover:underline">
            Log in
          </a>
        </p>
      </main>

      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
