import { NextRequest, NextResponse } from "next/server";
import { addEmailSubscriber } from "@/lib/customer-auth";
import { getBrandBySlug } from "@/lib/db/queries";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { brandClaimEmail } from "@/lib/email/templates";

function deriveVerdict(blocked: number, allowed: number): string {
  if (allowed > 0 && blocked === 0) return "Open";
  if (blocked > 0 && allowed === 0) return "Closed";
  if (allowed > 0 && blocked > 0) return "Partially open";
  return "Unknown";
}

export async function POST(request: NextRequest) {
  try {
    const { email, source } = await request.json();
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    addEmailSubscriber(email, source || "homepage");

    // If this is a brand claim, send the claim follow-up email
    if (source && source.startsWith("claim:")) {
      const brandId = parseInt(source.replace("claim:", ""), 10);
      if (brandId) {
        const brand = db.select().from(schema.brands).where(eq(schema.brands.id, brandId)).get();
        if (brand) {
          const latestScan = db
            .select()
            .from(schema.lightweightScans)
            .where(eq(schema.lightweightScans.brandId, brandId))
            .orderBy(desc(schema.lightweightScans.scannedAt))
            .limit(1)
            .get();

          let snapshot: { verdict: string | null; platform: string | null; cdn: string | null; topBlocker: string | null } | undefined;
          if (latestScan) {
            let topBlocker: string | null = null;
            try {
              const agentStatus = JSON.parse(latestScan.agentStatusJson) as Record<string, string>;
              const blockedAgent = Object.entries(agentStatus).find(([, v]) => v === "blocked");
              if (blockedAgent) topBlocker = blockedAgent[0];
            } catch {
              // ignore parse errors — leave topBlocker null
            }
            snapshot = {
              verdict: deriveVerdict(latestScan.blockedAgentCount, latestScan.allowedAgentCount),
              platform: latestScan.platform,
              cdn: latestScan.cdn,
              topBlocker,
            };
          }

          const claimData = brandClaimEmail({ brandName: brand.name, brandSlug: brand.slug, snapshot });
          void sendEmail({ to: email, ...claimData });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
