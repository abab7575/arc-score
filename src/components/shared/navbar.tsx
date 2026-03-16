import Link from "next/link";
import { AdminLink } from "./admin-link";

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
              <span className="spec-label text-muted-foreground hidden sm:inline">v1.0</span>
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
              href="/compare"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/agents"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Agents
            </Link>
            <Link
              href="/landscape"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Landscape
            </Link>
            <Link
              href="/methodology"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </Link>
            <AdminLink />
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/submit"
              className="text-sm font-bold text-white bg-[#FF6648] hover:bg-[#e85a3f] px-4 py-1.5 transition-colors relative group/btn"
            >
              Submit Your Site
              {/* Offset shadow on button */}
              <span className="absolute inset-0 bg-[#0A1628] -z-10 translate-x-[2px] translate-y-[2px] group-hover/btn:translate-x-[3px] group-hover/btn:translate-y-[3px] transition-transform" />
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
}
