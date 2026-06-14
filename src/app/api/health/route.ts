import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { billingEnvironmentReady } from "@/lib/agency/stripe";

export async function GET() {
  try {
    // Check DB connectivity by counting brands
    const result = db
      .select({ count: schema.brands.id })
      .from(schema.brands)
      .all();

    const brandCount = result.length;

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      db: {
        connected: true,
        brands: brandCount,
      },
      services: {
        emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_WEBHOOK_SECRET),
        billingConfigured: billingEnvironmentReady(),
        customerAuthConfigured: Boolean(process.env.CUSTOMER_SESSION_SECRET),
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        db: {
          connected: false,
          error: (err as Error).message,
        },
      },
      { status: 503 }
    );
  }
}
