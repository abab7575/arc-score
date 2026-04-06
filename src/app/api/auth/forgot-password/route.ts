import { NextRequest, NextResponse } from "next/server";
import { getCustomerByEmail } from "@/lib/customer-auth";
import { sendEmail } from "@/lib/email/send";
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

    const baseUrl = process.env.BASE_URL || "https://arcreport.ai";
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your ARC Report password",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; max-width:500px; margin:0 auto; padding:32px;">
          <div style="height:4px; background:linear-gradient(90deg, #0259DD 0%, #FF6648 33%, #FBBA16 66%, #7C3AED 100%); margin-bottom:32px;"></div>
          <h1 style="font-size:22px; font-weight:900; color:#0A1628; margin:0 0 16px;">Reset your password</h1>
          <p style="font-size:15px; color:#475569; line-height:1.7; margin:0 0 24px;">
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
          <a href="${resetUrl}" style="display:inline-block; padding:14px 28px; background-color:#0259DD; color:#FFFFFF; font-size:13px; font-weight:800; text-decoration:none; text-transform:uppercase; letter-spacing:0.08em; font-family:monospace; border:2px solid #0A1628;">
            Reset Password
          </a>
          <p style="font-size:12px; color:#94A3B8; margin-top:24px; line-height:1.5;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
      text: `Reset your ARC Report password.\n\nClick this link to set a new password (expires in 1 hour):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
