import { eq, isNull, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getAgencySession } from "@/lib/agency/core";
import { SITE_URL } from "@/lib/site";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AgencySettingsPage() {
  const [auth, cookieStore] = await Promise.all([getAgencySession(), cookies()]);
  if (!auth) return null;
  const newKey = cookieStore.get("arc_new_api_key")?.value;
  const keys = db.select().from(schema.agencyApiKeys).where(and(
    eq(schema.agencyApiKeys.workspaceId, auth.workspace.id),
    isNull(schema.agencyApiKeys.revokedAt),
  )).all();
  return (
    <>
      <h1 className="text-3xl font-black">Settings & MCP</h1>
      <form action="/api/agency/settings" method="post" className="mt-6 border-2 bg-white p-5 space-y-4">
        <label className="block text-sm font-bold">Agency name<input name="name" defaultValue={auth.workspace.name} className="mt-1 w-full border px-3 py-2 font-normal" /></label>
        <label className="block text-sm font-bold">Logo URL<input name="logoUrl" defaultValue={auth.workspace.logoUrl ?? ""} className="mt-1 w-full border px-3 py-2 font-normal" /></label>
        <label className="block text-sm font-bold">Brand color<input name="primaryColor" type="color" defaultValue={auth.workspace.primaryColor} className="mt-1 block h-10 w-20" /></label>
        <button className="bg-[#0259DD] text-white font-black px-4 py-2">Save branding</button>
      </form>
      <section className="mt-8 border-2 bg-white p-5">
        <div className="spec-label text-[#0259DD]">PRIVATE AGENCY MCP</div>
        <h2 className="text-xl font-black mt-1">Use portfolio intelligence inside LLMs</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Connect to <code>{SITE_URL}/api/agency/mcp</code> and send the key as <code>Authorization: Bearer arc_...</code>.
        </p>
        <pre className="mt-4 overflow-x-auto bg-[#0A1628] text-white p-4 text-xs">{`claude mcp add --transport http arc-agency ${SITE_URL}/api/agency/mcp \\
  --header "Authorization: Bearer YOUR_ARC_KEY"`}</pre>
        <p className="mt-3 text-xs text-muted-foreground">
          See the <a href="/docs/agency-mcp" className="text-[#0259DD] hover:underline">Agency MCP guide</a> for tools,
          protocol testing, and other clients.
        </p>
        {newKey && (
          <div className="mt-4 bg-amber-50 border border-amber-300 p-4">
            <div className="text-xs font-bold">COPY THIS KEY NOW. IT WILL NOT BE SHOWN AGAIN.</div>
            <code className="block mt-2 break-all">{newKey}</code>
          </div>
        )}
        <form action="/api/agency/api-keys" method="post" className="mt-4">
          <button className="bg-[#0A1628] text-white font-black px-4 py-2">Create MCP key</button>
        </form>
        <div className="mt-5 space-y-2">
          {keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between border p-3">
              <div><span className="font-mono">{key.keyPrefix}…</span><span className="text-xs text-muted-foreground ml-3">Last used {key.lastUsedAt ?? "never"}</span></div>
              <form action="/api/agency/api-keys/revoke" method="post">
                <input type="hidden" name="id" value={key.id} />
                <button className="text-xs text-red-700">Revoke</button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
