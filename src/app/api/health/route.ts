import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";

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
