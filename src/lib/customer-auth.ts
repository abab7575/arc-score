/**
 * Customer authentication — separate from admin auth.
 * Uses Web Crypto for password hashing and session tokens.
 */

import { db, schema } from "@/lib/db/index";
import { eq, and } from "drizzle-orm";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const CUSTOMER_COOKIE_NAME = "arc_customer_session";

// ── Password Hashing ────────────────────────────────────────────────

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(input: string): Promise<string> {
  const encoded = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", encoded);
  return toHex(hash);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function pbkdf2Hash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const saltBytes = hexToBytes(saltHex);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: saltBytes.buffer as ArrayBuffer, iterations: 600_000, hash: "SHA-256" },
    keyMaterial,
    256, // 32 bytes
  );
  return toHex(derived);
}

export async function hashPassword(password: string): Promise<string> {
  const saltArr = crypto.getRandomValues(new Uint8Array(16));
  const salt = toHex(saltArr.buffer as ArrayBuffer);
  const hash = await pbkdf2Hash(password, salt);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  // PBKDF2 produces 64-hex-char output (32 bytes); legacy SHA-256 also produces
  // 64 hex chars but the salt was 32 hex chars (16 bytes). Distinguish by trying
  // PBKDF2 first, then falling back to legacy SHA-256 for backward compatibility.
  const pbkdf2Computed = await pbkdf2Hash(password, salt);
  if (pbkdf2Computed === hash) return true;

  // Fallback: legacy SHA-256 hash(salt + password)
  const legacyComputed = await sha256(salt + password);
  return legacyComputed === hash;
}

// ── Session Tokens ──────────────────────────────────────────────────

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

async function hmacSign(data: string): Promise<string> {
  const secret = process.env.CUSTOMER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET!;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toBase64Url(sig);
}

async function hmacVerify(data: string, signature: string): Promise<boolean> {
  const secret = process.env.CUSTOMER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET!;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
  );
  const sigBytes = fromBase64Url(signature);
  const sigBuffer = new ArrayBuffer(sigBytes.length);
  new Uint8Array(sigBuffer).set(sigBytes);
  return crypto.subtle.verify("HMAC", key, sigBuffer, enc.encode(data));
}

export async function createCustomerSession(customerId: number): Promise<string> {
  const payload = { cid: customerId, exp: Date.now() + SESSION_DURATION_MS };
  const data = btoa(JSON.stringify(payload))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const sig = await hmacSign(data);
  return `${data}.${sig}`;
}

export async function verifyCustomerSession(token: string): Promise<number | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [data, sig] = parts;
  const valid = await hmacVerify(data, sig);
  if (!valid) return null;

  try {
    const padded = data.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(padded));
    if (payload.exp < Date.now()) return null;
    return payload.cid as number;
  } catch {
    return null;
  }
}

// ── Customer Queries ────────────────────────────────────────────────

export function getCustomerById(id: number) {
  return db.select().from(schema.customers).where(eq(schema.customers.id, id)).get();
}

export function getCustomerByEmail(email: string) {
  return db.select().from(schema.customers).where(eq(schema.customers.email, email.toLowerCase())).get();
}

export function getCustomerByStripeId(stripeCustomerId: string) {
  return db.select().from(schema.customers).where(eq(schema.customers.stripeCustomerId, stripeCustomerId)).get();
}

export function createCustomer(data: { email: string; passwordHash: string; name?: string; stripeCustomerId?: string }) {
  return db.insert(schema.customers).values({
    email: data.email.toLowerCase(),
    passwordHash: data.passwordHash,
    name: data.name,
    stripeCustomerId: data.stripeCustomerId,
  }).returning().get();
}

export function updateCustomerPlan(id: number, plan: string) {
  return db.update(schema.customers).set({ plan }).where(eq(schema.customers.id, id)).run();
}

export function updateCustomerStripeId(id: number, stripeCustomerId: string) {
  return db.update(schema.customers).set({ stripeCustomerId }).where(eq(schema.customers.id, id)).run();
}

// ── Subscription Queries ────────────────────────────────────────────

export function getActiveSubscription(customerId: number) {
  return db.select().from(schema.subscriptions)
    .where(eq(schema.subscriptions.customerId, customerId))
    .get();
}

export function upsertSubscription(data: {
  customerId: number;
  stripeSubscriptionId: string;
  stripePriceId: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}) {
  const existing = db.select().from(schema.subscriptions)
    .where(eq(schema.subscriptions.stripeSubscriptionId, data.stripeSubscriptionId))
    .get();

  if (existing) {
    return db.update(schema.subscriptions).set({
      stripePriceId: data.stripePriceId,
      plan: data.plan,
      status: data.status,
      currentPeriodEnd: data.currentPeriodEnd,
      cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      updatedAt: new Date().toISOString(),
    }).where(eq(schema.subscriptions.id, existing.id)).run();
  }

  return db.insert(schema.subscriptions).values(data).returning().get();
}

export function deleteSubscription(stripeSubscriptionId: string) {
  return db.delete(schema.subscriptions)
    .where(eq(schema.subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .run();
}

// ── Brand Claims ────────────────────────────────────────────────────

export function getClaimedBrands(customerId: number) {
  return db.select().from(schema.brandClaims)
    .where(eq(schema.brandClaims.customerId, customerId))
    .all();
}

export function claimBrand(customerId: number, brandId: number) {
  return db.insert(schema.brandClaims)
    .values({ customerId, brandId })
    .returning()
    .get();
}

export function unclaimBrand(customerId: number, brandId: number) {
  return db.delete(schema.brandClaims)
    .where(and(eq(schema.brandClaims.customerId, customerId), eq(schema.brandClaims.brandId, brandId)))
    .run();
}
