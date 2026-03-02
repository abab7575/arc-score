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
        router.push("/account");
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-md mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#059669]/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#059669]" />
          </div>
          <h1 className="text-2xl font-black text-foreground mb-2">
            Payment Successful
          </h1>
          <p className="text-muted-foreground">
            Create your account to access your full reports.
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
