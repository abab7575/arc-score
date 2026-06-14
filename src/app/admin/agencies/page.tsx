import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function AdminAgenciesPage({ searchParams }: { searchParams: Promise<{ imported?: string; error?: string }> }) {
  const workspaces = db.select({
    id: schema.agencyWorkspaces.id,
    name: schema.agencyWorkspaces.name,
    domain: schema.agencyWorkspaces.domain,
    status: schema.agencyWorkspaces.status,
    createdAt: schema.agencyWorkspaces.createdAt,
    siteCount: sql<number>`count(${schema.agencySites.id})`,
  }).from(schema.agencyWorkspaces)
    .leftJoin(schema.agencySites, eq(schema.agencySites.workspaceId, schema.agencyWorkspaces.id))
    .groupBy(schema.agencyWorkspaces.id)
    .orderBy(desc(schema.agencyWorkspaces.createdAt)).all();
  return searchParams.then((query) => (
    <div>
      <h1 className="text-2xl font-black">Agency discovery</h1>
      <p className="mt-2 text-sm text-muted-foreground">Paste one agency domain per line or upload CSV content. Arc discovers portfolio stores, scans them, creates a preview, and drafts outreach.</p>
      {query.imported && <p className="mt-4 text-sm text-emerald-700">Processed {query.imported} agency domains.</p>}
      {query.error && <p className="mt-4 text-sm text-red-700">{query.error}</p>}
      <form action="/api/admin/agencies/import" method="post" className="mt-6 border-2 bg-white p-5">
        <textarea required name="csv" rows={10} placeholder={"agencyone.com\nagencytwo.com"} className="w-full border p-3 font-mono text-sm" />
        <button className="mt-3 bg-[#0259DD] text-white font-black px-5 py-3">Run automated discovery</button>
      </form>
      <div className="mt-8 border bg-white divide-y">
        {workspaces.map((workspace) => (
          <div key={workspace.id} className="p-4 flex items-center justify-between">
            <div><div className="font-bold">{workspace.name}</div><div className="text-xs font-mono text-muted-foreground">{workspace.domain}</div></div>
            <div className="text-right"><div className="text-sm capitalize">{workspace.status}</div><div className="text-xs text-muted-foreground">{workspace.siteCount} sites</div></div>
          </div>
        ))}
      </div>
    </div>
  ));
}
