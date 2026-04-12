import { NextRequest, NextResponse } from "next/server";
import { getCustomerByEmail } from "@/lib/customer-auth";
import { sendEmail } from "@/lib/email/send";
import { passwordResetEmail } from "@/lib/email/templates";
import { rateLimit } from "@/lib/rate-limit";

// Simple token store — in production you'd use a DB table, but this works for now
// Tokens expire after 1 hour
const resetTokens = new Map<string, { customerId: number; expires: number }>();

export function getResetToken(token: string) {
  const entry = resetTokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    resetTokens.delete(token);
    return null;
  }
  return entry;
}

export function deleteResetToken(token: string) {
  resetTokens.delete(token);
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { success } = rateLimit(ip, 3, 60000);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again in a minute." }, { status: 429 });
  }

  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const customer = getCustomerByEmail(email);
    if (!customer) {
      return NextResponse.json({ success: true });
    }

    // Generate token
    const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");

    resetTokens.set(token, {
      customerId: customer.id,
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    const baseUrl = process.env.BASE_URL || "https://www.arcreport.ai";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const emailData = passwordResetEmail({ resetUrl });
    await sendEmail({ to: email, ...emailData });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
