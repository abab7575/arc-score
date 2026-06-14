import { SITE_URL } from "@/lib/site";
import { createHmac, timingSafeEqual } from "node:crypto";

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export async function sendAgencyEmail(input: SendEmailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");
  const from = process.env.DEFAULT_FROM_EMAIL || "ARC Report <agency@updates.arcreport.ai>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
      reply_to: input.replyTo || process.env.DEFAULT_REPLY_TO || "hello@arcreport.ai",
      headers: {
        "List-Unsubscribe": `<${getUnsubscribeUrl(input.to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
  return response.json() as Promise<{ id: string }>;
}

function unsubscribeSecret(): string {
  const secret = process.env.CUSTOMER_SESSION_SECRET;
  if (!secret) throw new Error("CUSTOMER_SESSION_SECRET not configured");
  return secret;
}

export function createUnsubscribeToken(email: string): string {
  const encoded = Buffer.from(email.trim().toLowerCase()).toString("base64url");
  const signature = createHmac("sha256", unsubscribeSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function readUnsubscribeToken(token: string): string | null {
  const [encoded, signature, extra] = token.split(".");
  if (!encoded || !signature || extra) return null;
  const expected = createHmac("sha256", unsubscribeSecret()).update(encoded).digest("base64url");
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  try {
    const email = Buffer.from(encoded, "base64url").toString("utf8").trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  } catch {
    return null;
  }
}

export function getUnsubscribeUrl(email: string): string {
  return `${SITE_URL}/agency/unsubscribe?token=${encodeURIComponent(createUnsubscribeToken(email))}`;
}

export function emailShell(title: string, bodyHtml: string, unsubscribeUrl?: string): string {
  return `<!doctype html><html><body style="margin:0;background:#fff8f0;color:#0a1628;font-family:Arial,sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:32px 20px">
    <div style="font:700 13px monospace;color:#0259dd;margin-bottom:20px">ARC REPORT / AGENTIC COMMERCE INTELLIGENCE</div>
    <h1 style="font-size:24px;line-height:1.2">${title}</h1>${bodyHtml}
    <p style="font-size:12px;color:#6b7280;margin-top:32px">ARC Report · Independent AI-commerce monitoring
    ${unsubscribeUrl ? ` · <a href="${unsubscribeUrl}">Unsubscribe</a>` : ""}</p>
  </div></body></html>`;
}
