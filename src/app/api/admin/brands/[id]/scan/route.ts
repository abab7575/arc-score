import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { db, schema } from "@/lib/db/index";
import { eq } from "drizzle-orm";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const brand = db
      .select()
      .from(schema.brands)
      .where(eq(schema.brands.id, parseInt(id)))
      .get();

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Trigger scan in background
    execFile("npx", ["tsx", "scripts/scan-brand.ts", `--slug=${brand.slug}`, "--force"], { cwd: process.cwd() }, (error, stdout) => {
      if (error) {
        console.error(`[scan/${brand.slug}] Error:`, error.message);
      } else {
        console.log(`[scan/${brand.slug}] Done:`, stdout.slice(-200));
      }
    });

    return NextResponse.json({
      status: "started",
      message: `Scan triggered for ${brand.name}`,
      brandSlug: brand.slug,
    });
  } catch (error) {
    console.error("Trigger scan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
