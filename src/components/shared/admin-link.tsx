"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if the admin session cookie exists
    const hasAdminCookie = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith("arc_admin_session="));
    setIsAdmin(hasAdminCookie);
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/dashboard"
      className="text-sm font-medium text-[#0259DD] hover:text-[#0259DD]/80 transition-colors"
    >
      Admin
    </Link>
  );
}
