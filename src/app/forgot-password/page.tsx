"use client";

import { useState } from "react";
import { Navbar } from "@/components/shared/navbar";
import { Footer } from "@/components/shared/footer";
import { Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setSent(true); // Always show success to prevent enumeration
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-md mx-auto px-4 py-20">
        {sent ? (
          <div className="text-center">
            <Mail className="w-10 h-10 text-[#0259DD] mx-auto mb-4" />
            <h1 className="text-xl font-bold text-foreground mb-3">Check your email</h1>
            <p className="text-sm text-muted-foreground mb-6">
              If an account exists with that email, we sent a password reset link. It expires in 1 hour.
            </p>
            <a href="/login" className="text-sm text-[#0259DD] hover:underline">Back to login</a>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-black text-foreground mb-2">Reset your password</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3 border-2 border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0259DD]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0259DD] text-white text-sm font-bold hover:bg-[#0259DD]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              <a href="/login" className="text-[#0259DD] hover:underline">Back to login</a>
            </p>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
