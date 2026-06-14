import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AdminCampaignsPage() {
  const campaigns = db.select({
    id: schema.agencyCampaigns.id,
    agency: schema.agencyWorkspaces.name,
    domain: schema.agencyWorkspaces.domain,
    email: schema.agencyCampaigns.contactEmail,
    subject: schema.agencyCampaigns.subject,
    body: schema.agencyCampaigns.body,
    status: schema.agencyCampaigns.status,
    warnings: schema.agencyCampaigns.validationWarningsJson,
    createdAt: schema.agencyCampaigns.createdAt,
  }).from(schema.agencyCampaigns)
    .innerJoin(schema.agencyWorkspaces, eq(schema.agencyCampaigns.workspaceId, schema.agencyWorkspaces.id))
    .orderBy(desc(schema.agencyCampaigns.createdAt)).all();
  const drafts = campaigns.filter((campaign) => campaign.status === "draft");
  return (
    <div>
      <div className="flex items-end justify-between">
        <div><h1 className="text-2xl font-black">Agency campaigns</h1><p className="text-sm text-muted-foreground mt-1">Nothing sends until this batch is approved.</p></div>
        {drafts.length > 0 && (
          <form action="/api/admin/campaigns/approve" method="post">
            <button className="bg-[#FF6648] text-white font-black px-5 py-3">Approve {drafts.length} drafts</button>
          </form>
        )}
      </div>
      <div className="mt-6 space-y-4">
        {campaigns.map((campaign) => (
          <article key={campaign.id} className="border-2 bg-white p-5">
            <div className="flex justify-between gap-3">
              <div><div className="font-black">{campaign.agency}</div><div className="text-xs text-muted-foreground">{campaign.email} · {campaign.domain}</div></div>
              <span className="spec-label capitalize">{campaign.status}</span>
            </div>
            <div className="mt-4 text-sm font-bold">{campaign.subject}</div>
            <pre className="mt-3 whitespace-pre-wrap text-xs bg-[#FFF8F0] p-3">{campaign.body}</pre>
            {campaign.warnings !== "[]" && <div className="mt-3 text-xs text-red-700">Warnings: {campaign.warnings}</div>}
          </article>
        ))}
      </div>
    </div>
  );
}
