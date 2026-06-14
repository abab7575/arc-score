import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { createOpaqueToken, hashToken, normalizeDomain, pruneExpiredLoginTokens, recordAgencyEvent } from "@/lib/agency/core";
import { emailShell, sendAgencyEmail } from "@/lib/agency/email";
import { publicUrl } from "@/lib/public-url";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL } from "@/lib/site";

export async function POST(request: NextRequest) {
  const contentType = request.headers.get("content-type") || "";
  const input = contentType.includes("application/json")
    ? await request.json()
    : Object.fromEntries(await request.formData());
  const email = String(input.email || "").trim().toLowerCase();
  const emailDomain = normalizeDomain(email.split("@")[1] || "");
  const workspaceId = Number(input.workspaceId || 0) || undefined;
  const previewToken = String(input.previewToken || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.redirect(publicUrl("/agency/login?error=Enter+a+valid+business+email"), 303);
  }
  const freeEmailDomains = new Set([
    "gmail.com", "googlemail.com", "yahoo.com", "outlook.com", "hotmail.com",
    "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com",
  ]);
  if (freeEmailDomains.has(emailDomain)) {
    return NextResponse.redirect(publicUrl("/agency/login?error=Use+your+agency+work+email"), 303);
  }
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  if (!rateLimit(`agency-login:${ip}:${email}`, 3, 60 * 60 * 1000).success) {
    return NextResponse.redirect(publicUrl("/agency/login?error=Too+many+requests.+Try+again+later."), 303);
  }
  pruneExpiredLoginTokens();
  const customer = db.select().from(schema.customers).where(eq(schema.customers.email, email)).get();
  let workspace = workspaceId
    ? db.select().from(schema.agencyWorkspaces).where(eq(schema.agencyWorkspaces.id, workspaceId)).get()
    : customer
      ? db.select().from(schema.agencyWorkspaces).where(eq(schema.agencyWorkspaces.customerId, customer.id)).get()
      : db.select().from(schema.agencyWorkspaces).where(eq(schema.agencyWorkspaces.domain, emailDomain)).get();
  if (!workspace) {
    const owner = customer ?? db.insert(schema.customers).values({
      email,
      passwordHash: "passwordless",
      name: email.split("@")[0],
      plan: "free",
    }).returning().get();
    const name = emailDomain.split(".")[0]
      .split(/[-_]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
    workspace = db.insert(schema.agencyWorkspaces).values({
      customerId: owner.id,
      name: name || emailDomain,
      domain: emailDomain,
      status: "prospect",
    }).returning().get();
    recordAgencyEvent(workspace.id, "workspace_created", { source: "self_serve" });
  }
  if (emailDomain !== workspace.domain) {
    return NextResponse.redirect(publicUrl("/agency/login?error=Use+an+email+at+the+agency+domain"), 303);
  }
  const token = createOpaqueToken();
  db.insert(schema.agencyLoginTokens).values({
    email,
    workspaceId: workspace.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  }).run();
  const callback = `${SITE_URL}/api/agency/auth/callback?token=${encodeURIComponent(token)}${previewToken ? `&preview=${encodeURIComponent(previewToken)}` : ""}`;
  try {
    await sendAgencyEmail({
      to: email,
      subject: `Sign in to ${workspace.name}'s ARC workspace`,
      text: `Use this secure link within 30 minutes:\n${callback}`,
      html: emailShell("Your secure ARC sign-in link", `<p>Use this link within 30 minutes:</p><p><a href="${callback}" style="background:#0259dd;color:white;padding:12px 18px;text-decoration:none;font-weight:bold">Sign in to ARC</a></p>`),
    });
  } catch {
    db.delete(schema.agencyLoginTokens).where(eq(schema.agencyLoginTokens.tokenHash, hashToken(token))).run();
    return NextResponse.redirect(publicUrl("/agency/login?error=Email+delivery+failed.+Please+try+again."), 303);
  }
  recordAgencyEvent(workspace.id, "magic_link_requested", { email });
  return NextResponse.redirect(publicUrl("/agency/login?sent=1"), 303);
}
