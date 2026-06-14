import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { Webhook } from "svix";

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const rawBody = await request.text();
  let payload: {
    type?: string;
    data?: { email_id?: string; to?: string[] };
  };
  try {
    payload = new Webhook(secret).verify(rawBody, {
      "svix-id": request.headers.get("svix-id") || "",
      "svix-timestamp": request.headers.get("svix-timestamp") || "",
      "svix-signature": request.headers.get("svix-signature") || "",
    }) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  if (payload.type === "email.bounced" || payload.type === "email.complained") {
    const reason = payload.type === "email.bounced" ? "bounce" : "complaint";
    for (const email of payload.data?.to ?? []) {
      db.insert(schema.emailSuppressions).values({ email: email.toLowerCase(), reason }).onConflictDoNothing().run();
      db.update(schema.agencyCampaigns).set({ status: "bounced" })
        .where(eq(schema.agencyCampaigns.contactEmail, email.toLowerCase())).run();
    }
  }
  return NextResponse.json({ received: true });
}
