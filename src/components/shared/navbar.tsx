import Link from "next/link";
import { AdminLink } from "./admin-link";
import { AuthNavLink } from "./auth-nav-link";

export function Navbar() {
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

          <div className="flex items-center gap-5">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Index
            </Link>
            <Link
              href="/matrix"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Matrix
            </Link>
            <Link
              href="/landscape"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Landscape
            </Link>
            <Link
              href="/changelog"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Changelog
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <AdminLink />
            <AuthNavLink />
          </div>
        </div>
      </nav>
    </>
  );
}
