"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AdminLink } from "./admin-link";
import { AuthNavLink } from "./auth-nav-link";

const navLinks = [
  { href: "/", label: "Index" },
  { href: "/matrix", label: "Matrix" },
  { href: "/landscape", label: "Landscape" },
  { href: "/changelog", label: "Changelog" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/weekly", label: "Weekly" },
  { href: "/docs", label: "Docs" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      {/* Animated multi-color accent bar */}
      <div className="accent-bar-top" />

      <nav className="sticky top-0 z-50 glass-strong">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Retro logo mark */}
            <div className="relative">
              <div className="w-7 h-7 bg-[#0259DD] flex items-center justify-center group-hover:bg-[#FF6648] transition-colors">
                <span className="text-[11px] font-black text-white font-mono">AR</span>
              </div>
              {/* Offset shadow */}
              <div className="absolute inset-0 w-7 h-7 bg-[#FF6648] -z-10 translate-x-[2px] translate-y-[2px] group-hover:bg-[#0259DD] transition-colors" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[15px] font-black text-foreground tracking-tight">
                ARC Report
              </span>
              <span className="spec-label text-muted-foreground hidden sm:inline">v2.0</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <AdminLink />
            <AuthNavLink />
          </div>

          {/* Mobile hamburger button */}
          <button
            className="sm:hidden p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div className="sm:hidden border-b bg-white z-50">
            <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <AdminLink />
              <AuthNavLink />
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
