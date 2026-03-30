"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function AuthNavLink() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        setAuthenticated(data.authenticated === true);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  if (checking) return null;

  if (authenticated) {
    return (
      <Link
        href="/account"
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Account
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      Log In
    </Link>
  );
}
