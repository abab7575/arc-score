"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError("Invalid password");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-[60vh] flex items-center justify-center"
      style={{ backgroundColor: "#FFF8F0" }}
    >
      <div className="w-full max-w-sm">
        <div
          className="p-8 relative"
          style={{
            backgroundColor: "#fff",
            border: "1px solid #E8E0D8",
          }}
        >
          {/* Offset shadow */}
          <div
            className="absolute inset-0 -z-10"
            style={{
              backgroundColor: "#0A1628",
              transform: "translate(4px, 4px)",
            }}
          />

          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div
                className="w-8 h-8 flex items-center justify-center"
                style={{ backgroundColor: "#FF6648" }}
              >
                <span className="text-xs font-black text-white font-mono">A</span>
              </div>
            </div>
            <h1
              className="text-xl font-black tracking-tight"
              style={{ color: "#0A1628" }}
            >
              Mission Control
            </h1>
            <p
              className="font-mono text-[10px] uppercase tracking-widest mt-1"
              style={{ color: "#9CA3AF" }}
            >
              ARC Score Admin
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoFocus
                className="w-full px-4 py-3 text-sm focus:outline-none"
                style={{
                  backgroundColor: "#FFF8F0",
                  border: "1px solid #E8E0D8",
                  color: "#0A1628",
                }}
              />
            </div>

            {error && (
              <p className="text-sm font-medium" style={{ color: "#FF6648" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors relative group"
              style={{ backgroundColor: "#0259DD" }}
            >
              {loading ? "Authenticating..." : "Enter"}
              <span
                className="absolute inset-0 -z-10 transition-transform group-hover:translate-x-[3px] group-hover:translate-y-[3px]"
                style={{
                  backgroundColor: "#0A1628",
                  transform: "translate(2px, 2px)",
                }}
              />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
