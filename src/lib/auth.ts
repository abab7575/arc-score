/**
 * Auth utilities — Edge Runtime compatible (uses Web Crypto API).
 */

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function toBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacSign(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toBase64Url(sig);
}

async function hmacVerify(data: string, signature: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = fromBase64Url(signature);
  return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
}

export function verifyPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;

  // Constant-time-ish comparison
  if (input.length !== password.length) return false;
  let result = 0;
  for (let i = 0; i < input.length; i++) {
    result |= input.charCodeAt(i) ^ password.charCodeAt(i);
  }
  return result === 0;
}

export async function createSessionToken(): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET not set");

  const payload = {
    role: "admin",
    exp: Date.now() + SESSION_DURATION_MS,
  };

  const data = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const sig = await hmacSign(data, secret);

  return `${data}.${sig}`;
}

export async function verifySessionToken(token: string): Promise<boolean> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || !token) return false;

  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [data, sig] = parts;

  const valid = await hmacVerify(data, sig, secret);
  if (!valid) return false;

  try {
    const padded = data.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded));
    if (payload.exp < Date.now()) return false;
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export const SESSION_COOKIE_NAME = "arc_admin_session";
