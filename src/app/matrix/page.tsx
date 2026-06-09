import { Navbar } from "@/components/shared/navbar";
import { MatrixExplorer } from "@/components/matrix/matrix-explorer";
import { buildMatrixPayload } from "@/lib/index-data";

// Rendered per request from the live scan volume; full matrix ships in the HTML.
export const dynamic = "force-dynamic";

type AgentStatus = "allowed" | "blocked" | "no_rule" | "restricted" | "inconclusive";

export default function PublicMatrixPage() {
  const { stats, brands } = buildMatrixPayload();

  const rows = brands
    .filter((b) => b.scanned)
    .map((b) => ({
      id: b.id,
      slug: b.slug,
      name: b.name,
      category: b.category ?? "uncategorized",
      agents: (b.agentStatus ?? {}) as Record<string, AgentStatus>,
      blockedCount: b.blockedAgentCount ?? 0,
      scannedAt: b.scannedAt ?? null,
      arcScore: b.arcScore,
    }));

  return (
    <>
      <Navbar />
      <MatrixExplorer brands={rows} stats={stats} />
    </>
  );
}
