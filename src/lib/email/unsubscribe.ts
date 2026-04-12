import crypto from "crypto";

function getSecret(): string {
  return process.env.SESSION_SECRET || process.env.JWT_SECRET || "arc-report-dev-unsubscribe-secret";
}

export function unsubscribeToken(email: string): string {
  const normalized = email.trim().toLowerCase();
  const mac = crypto.createHmac("sha256", getSecret()).update(normalized).digest("hex").slice(0, 24);
  const encoded = Buffer.from(normalized).toString("base64url");
  return `${encoded}.${mac}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const encoded = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  let email: string;
  try {
    email = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email.includes("@")) return null;
  const expected = crypto.createHmac("sha256", getSecret()).update(email).digest("hex").slice(0, 24);
  try {
    const a = Buffer.from(mac, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return email;
}

export function unsubscribeUrl(email: string): string {
  const base = process.env.BASE_URL || "https://www.arcreport.ai";
  return `${base}/api/unsubscribe?token=${unsubscribeToken(email)}`;
}
