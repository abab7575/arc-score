/**
 * Email sending via Resend API.
 */

const DEFAULT_FROM_ADDRESS = process.env.DEFAULT_FROM_EMAIL ?? "ARC Report <alerts@arcreport.ai>";
const DEFAULT_REPLY_TO = process.env.DEFAULT_REPLY_TO ?? "hello@arcreport.ai";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
  from?: string;
  replyTo?: string;
}): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipping email to", opts.to);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: opts.from ?? DEFAULT_FROM_ADDRESS,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo ?? DEFAULT_REPLY_TO,
      }),
    });

    if (res.ok) {
      return { success: true };
    }

    const body = await res.text();
    console.error(`[email] Resend error ${res.status}:`, body);
    return { success: false, error: `${res.status}: ${body}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    console.error("[email] Send failed:", msg);
    return { success: false, error: msg };
  }
}
