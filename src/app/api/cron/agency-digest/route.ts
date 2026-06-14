import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { getWorkspaceReadout } from "@/lib/agency/core";
import { emailShell, sendAgencyEmail } from "@/lib/agency/email";
import { SITE_URL } from "@/lib/site";

export async function GET(request: NextRequest) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaces = db.select().from(schema.agencyWorkspaces)
    .where(inArray(schema.agencyWorkspaces.status, ["active", "trialing"])).all();
  let sent = 0;
  for (const workspace of workspaces) {
    if (!workspace.customerId) continue;
    const customer = db.select().from(schema.customers).where(eq(schema.customers.id, workspace.customerId)).get();
    const data = getWorkspaceReadout(workspace.id);
    if (!customer || !data || customer.unsubscribedAt) continue;
    const priorities = [...data.sites].sort((a, b) => b.issues.length - a.issues.length).slice(0, 5);
    const text = `${workspace.name} weekly portfolio summary

${data.sites.length} sites monitored
${data.issueCount} open readiness issues
${data.staleCount} scans need refresh

Priority sites:
${priorities.map((item) => `- ${item.site.domain}: ${item.score?.total ?? "pending"} / 100, ${item.issues.length} issues`).join("\n")}

Open workspace: ${SITE_URL}/agency`;
    await sendAgencyEmail({
      to: customer.email,
      subject: `${workspace.name}: weekly AI-commerce portfolio summary`,
      text,
      html: emailShell("Weekly portfolio summary", `<p><strong>${data.issueCount}</strong> open issues across ${data.sites.length} sites.</p><ul>${priorities.map((item) => `<li>${item.site.domain}: ${item.score?.total ?? "pending"} / 100, ${item.issues.length} issues</li>`).join("")}</ul><p><a href="${SITE_URL}/agency">Open workspace</a></p>`),
    });
    sent++;
  }
  return NextResponse.json({ workspaces: workspaces.length, sent });
}
