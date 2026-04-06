"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Loader2, CheckCircle } from "lucide-react";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Reset failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-bold text-foreground mb-3">Invalid reset link</h1>
          <p className="text-sm text-muted-foreground mb-6">
            This link is missing a token. Please request a new password reset.
          </p>
          <a href="/login" className="text-sm text-[#0259DD] hover:underline">Back to login</a>
        </main>
        <Footer />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-10 h-10 text-[#059669] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-3">Password reset</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your password has been updated. You can now log in.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-[#0259DD] text-white text-sm font-bold hover:bg-[#0259DD]/90 transition-colors"
          >
            Log in
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-20">
        <h1 className="text-2xl font-black text-foreground mb-2">Set new password</h1>
        <p className="text-sm text-muted-foreground mb-8">Enter your new password below.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              required
              className="w-full px-3 py-2 border-2 border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0259DD] text-white text-sm font-bold hover:bg-[#0259DD]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Reset password
          </button>
        </form>
      </main>
      <Footer />
    </div>
  );
}
