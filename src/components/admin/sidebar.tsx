"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, Newspaper, Rss, GitBranch, Megaphone, Send, Settings, LogOut, Grid3X3, BookOpen } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/brands", label: "Brands", icon: Store },
  { href: "/admin/robots-matrix", label: "Matrix", icon: Grid3X3 },
  { href: "/admin/intel", label: "Intel", icon: Newspaper },
  { href: "/admin/newsfeed", label: "Newsfeed", icon: Rss },
  { href: "/admin/brand-pipeline", label: "Pipeline", icon: GitBranch },
  { href: "/admin/content-studio", label: "Content", icon: Megaphone },
  { href: "/admin/outreach", label: "Outreach", icon: Send },
  { href: "/admin/tech-explainer", label: "Explainer", icon: BookOpen },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide on login page
  if (pathname === "/admin/login") return null;

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <nav style={{ backgroundColor: "#FFF8F0", borderBottom: "1px solid #E8E0D8" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-11 overflow-x-auto">
          <div className="flex items-center gap-1 sm:gap-3">
            <span
              className="font-mono text-[9px] tracking-widest mr-1 hidden sm:inline"
              style={{ color: "#FF6648" }}
            >
              MISSION CONTROL
            </span>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap"
                  style={
                    isActive
                      ? {
                          backgroundColor: "#0259DD",
                          color: "#fff",
                          borderRadius: 2,
                          boxShadow: "2px 2px 0 #0A1628",
                        }
                      : { color: "#6B7280" }
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium transition-colors"
            style={{ color: "#9CA3AF" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
