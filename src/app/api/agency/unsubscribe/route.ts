import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { readUnsubscribeToken } from "@/lib/agency/email";

function suppress(email: string) {
  if (!email) return;
  db.insert(schema.emailSuppressions).values({ email: email.toLowerCase(), reason: "unsubscribe" })
    .onConflictDoNothing().run();
  db.update(schema.agencyCampaigns).set({ status: "suppressed" })
    .where(eq(schema.agencyCampaigns.contactEmail, email.toLowerCase())).run();
}

export async function GET(request: NextRequest) {
  const email = readUnsubscribeToken(request.nextUrl.searchParams.get("token") || "");
  if (!email) return new NextResponse("Invalid unsubscribe link.", { status: 400 });
  suppress(email);
  return new NextResponse("<h1>You are unsubscribed.</h1><p>ARC Report will not send further agency outreach to this address.</p>", {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const email = readUnsubscribeToken(String(form.get("token") || request.nextUrl.searchParams.get("token") || ""));
  if (!email) return NextResponse.json({ error: "Invalid unsubscribe token" }, { status: 400 });
  suppress(email);
  return NextResponse.json({ unsubscribed: true });
}
