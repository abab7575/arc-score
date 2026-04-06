import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/customer-auth";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { getResetToken, deleteResetToken } from "../forgot-password/route";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const entry = getResetToken(token);
    if (!entry) {
      return NextResponse.json({ error: "Invalid or expired reset link. Please request a new one." }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);
    db.update(schema.customers)
      .set({ passwordHash })
      .where(eq(schema.customers.id, entry.customerId))
      .run();

    deleteResetToken(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
