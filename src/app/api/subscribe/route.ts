import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`subscribe:${ip}`, 5, 60 * 60 * 1000).success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let input: { email?: unknown; source?: unknown };
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON body" }, { status: 400 });
  }

  const email = String(input.email || "").trim().toLowerCase();
  const source = String(input.source || "homepage").trim().slice(0, 100) || "homepage";
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  db.insert(schema.emailSubscribers).values({ email, source })
    .onConflictDoUpdate({
      target: schema.emailSubscribers.email,
      set: { source, unsubscribedAt: null },
    }).run();

  const claimMatch = /^claim:(\d+)$/.exec(source);
  if (claimMatch) {
    const brandId = Number(claimMatch[1]);
    const brand = db.select().from(schema.brands).where(eq(schema.brands.id, brandId)).get();
    if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    let customer = db.select().from(schema.customers).where(eq(schema.customers.email, email)).get();
    if (!customer) {
      customer = db.insert(schema.customers).values({
        email,
        passwordHash: "passwordless",
        plan: "free",
      }).returning().get();
    }
    const existing = db.select().from(schema.brandClaims).where(and(
      eq(schema.brandClaims.customerId, customer.id),
      eq(schema.brandClaims.brandId, brandId),
    )).get();
    if (!existing) db.insert(schema.brandClaims).values({ customerId: customer.id, brandId }).run();
  }

  return NextResponse.json({ subscribed: true });
}
