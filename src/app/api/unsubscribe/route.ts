import { NextRequest } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

function page(body: string, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Unsubscribe — ARC Report</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { margin: 0; padding: 0; background: #FFF8F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0A1628; }
  .wrap { max-width: 520px; margin: 0 auto; padding: 80px 24px; }
  .bar { height: 4px; background: linear-gradient(90deg, #0259DD 0%, #FF6648 33%, #FBBA16 66%, #7C3AED 100%); margin-bottom: 48px; }
  h1 { font-size: 28px; font-weight: 900; margin: 0 0 16px; letter-spacing: -0.02em; }
  p { font-size: 15px; color: #475569; line-height: 1.7; margin: 0 0 16px; }
  a { color: #0259DD; font-weight: 700; text-decoration: none; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="bar"></div>
    ${body}
    <p style="margin-top:32px;"><a href="https://www.arcreport.ai">Back to ARC Report</a></p>
  </div>
</body>
</html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handle(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return page(`<h1>Missing token</h1><p>This unsubscribe link is invalid.</p>`, 400);
  }

  const email = verifyUnsubscribeToken(token);
  if (!email) {
    return page(`<h1>Invalid link</h1><p>This unsubscribe link is invalid or has been tampered with.</p>`, 400);
  }

  const now = new Date().toISOString();
  db.update(schema.customers).set({ unsubscribedAt: now }).where(eq(schema.customers.email, email)).run();
  db.update(schema.emailSubscribers).set({ unsubscribedAt: now }).where(eq(schema.emailSubscribers.email, email)).run();

  return page(`
    <h1>You're unsubscribed.</h1>
    <p>We won't send <strong>${email}</strong> any more marketing or lifecycle emails from ARC Report.</p>
    <p>Transactional emails (password resets, payment receipts, brand claim confirmations) will still go through — those are required.</p>
  `);
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
