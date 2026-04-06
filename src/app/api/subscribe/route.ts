import { NextRequest, NextResponse } from "next/server";
import { addEmailSubscriber } from "@/lib/customer-auth";
import { getBrandBySlug } from "@/lib/db/queries";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/email/send";
import { brandClaimEmail } from "@/lib/email/templates";

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
          const claimData = brandClaimEmail({ brandName: brand.name, brandSlug: brand.slug });
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
