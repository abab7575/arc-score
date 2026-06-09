"use client";

/**
 * Canvas export of a comparison as PNG with ARC attribution + date baked in.
 */

interface ExportBrand {
  name: string;
  scoreTotal: number;
  scoreColor: string;
  components: { label: string; value: number; max: number }[];
  agentStatus: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
  blocked: "#DC2626",
  allowed: "#059669",
  no_rule: "#C5DAF7",
  restricted: "#F59E0B",
};

export function CompareExportButton({
  brands,
  agentIds,
}: {
  brands: ExportBrand[];
  agentIds: string[];
}) {
  const exportImage = () => {
    const scale = 2;
    const labelW = 150;
    const colW = 150;
    const width = labelW + brands.length * colW + 40;
    const headerH = 64;
    const scoreH = 80;
    const compH = 4 * 20 + 12;
    const agentRowH = 22;
    const footerH = 34;
    const height = headerH + scoreH + compH + 24 + agentIds.length * agentRowH + footerH + 20;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);

    const date = new Date().toISOString().split("T")[0];
    const left = 20;

    ctx.fillStyle = "#FFF8F0";
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#0A1628";
    ctx.font = "800 18px Inter, system-ui, sans-serif";
    ctx.fillText(`ARC Score comparison: ${brands.map((b) => b.name).join(" vs ")}`, left, 28);
    ctx.font = "11px JetBrains Mono, monospace";
    ctx.fillStyle = "#6B7280";
    ctx.fillText(`${date} · arcreport.ai/compare · CC BY 4.0`, left, 46);

    // Brand columns: name + big score
    brands.forEach((b, i) => {
      const x = left + labelW + i * colW;
      ctx.font = "700 13px Inter, system-ui, sans-serif";
      ctx.fillStyle = "#0A1628";
      let name = b.name;
      while (ctx.measureText(name).width > colW - 16 && name.length > 3) name = name.slice(0, -2);
      ctx.fillText(name, x, headerH + 16);
      ctx.font = "900 30px JetBrains Mono, monospace";
      ctx.fillStyle = b.scoreColor;
      ctx.fillText(String(b.scoreTotal), x, headerH + 50);
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "#6B7280";
      ctx.fillText("/100 ARC Score", x + ctx.measureText(String(b.scoreTotal)).width + 34, headerH + 50);
    });

    // Component rows
    const compTop = headerH + scoreH;
    brands[0]?.components.forEach((c, r) => {
      const y = compTop + r * 20;
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "#6B7280";
      ctx.fillText(`${c.label} /${c.max}`, left, y + 12);
      brands.forEach((b, i) => {
        const x = left + labelW + i * colW;
        const comp = b.components[r];
        ctx.fillStyle = "#E5E7EB";
        ctx.fillRect(x, y + 4, colW - 30, 8);
        ctx.fillStyle = "#0259DD";
        ctx.fillRect(x, y + 4, (colW - 30) * (comp.value / comp.max), 8);
      });
    });

    // Agent matrix
    const agentTop = compTop + compH + 24;
    ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.fillStyle = "#0A1628";
    ctx.fillText("AGENT ACCESS", left, agentTop - 8);
    agentIds.forEach((agent, r) => {
      const y = agentTop + r * agentRowH;
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.fillStyle = "#0A1628";
      ctx.fillText(agent, left, y + 14);
      brands.forEach((b, i) => {
        const x = left + labelW + i * colW;
        const status = b.agentStatus[agent];
        ctx.fillStyle = STATUS_COLORS[status] ?? "#EFEAE3";
        ctx.globalAlpha = status === "no_rule" || !status ? 0.55 : 1;
        ctx.fillRect(x, y + 3, colW - 30, agentRowH - 6);
        ctx.globalAlpha = 1;
      });
    });

    ctx.fillStyle = "#0A1628";
    ctx.fillRect(0, height - 26, width, 26);
    ctx.fillStyle = "#FFF8F0";
    ctx.font = "700 10px JetBrains Mono, monospace";
    ctx.fillText(`ARC REPORT · arcreport.ai · ${date} · data CC BY 4.0`, left, height - 9);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `arc-compare-${brands.map((b) => b.name.toLowerCase().replace(/\W+/g, "-")).join("-vs-")}-${date}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <button
      onClick={exportImage}
      className="text-xs font-bold font-mono text-white bg-[#0259DD] hover:bg-[#024bb5] px-4 py-2 transition-colors"
      title="Download this comparison as a PNG with attribution and date"
    >
      Export as image
    </button>
  );
}
