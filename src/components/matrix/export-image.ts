/**
 * Client-side canvas renderer for the matrix "Export as image" button (D2).
 * Draws the currently filtered view (capped) with ARC attribution and date
 * baked into the image.
 */

export interface ExportRow {
  name: string;
  arcScore?: number;
  agents: Record<string, string>;
}

const STATUS_COLORS: Record<string, string> = {
  blocked: "#DC2626",
  allowed: "#059669",
  no_rule: "#C5DAF7",
  restricted: "#F59E0B",
};

const MAX_ROWS = 60;

export function exportMatrixImage(rows: ExportRow[], agentIds: string[], agentShorts: string[]) {
  const shown = rows.slice(0, MAX_ROWS);
  const scale = 2;
  const nameW = 200;
  const scoreW = 56;
  const cellW = 52;
  const rowH = 22;
  const headerH = 64;
  const footerH = 44;
  const width = nameW + scoreW + agentIds.length * cellW + 32;
  const height = headerH + shown.length * rowH + footerH + 24;

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#FFF8F0";
  ctx.fillRect(0, 0, width, height);

  const left = 16;
  const date = new Date().toISOString().split("T")[0];

  // Title
  ctx.fillStyle = "#0A1628";
  ctx.font = "800 18px Inter, system-ui, sans-serif";
  ctx.fillText("ARC Report — Agent Access Matrix", left, 26);
  ctx.font = "11px JetBrains Mono, monospace";
  ctx.fillStyle = "#6B7280";
  ctx.fillText(
    `${rows.length} brands · ${date} · arcreport.ai/matrix · CC BY 4.0`,
    left,
    42,
  );

  // Column headers
  ctx.font = "700 9px JetBrains Mono, monospace";
  ctx.fillStyle = "#0A1628";
  ctx.fillText("BRAND", left, headerH - 6);
  ctx.fillText("SCORE", left + nameW, headerH - 6);
  agentShorts.forEach((short, i) => {
    const x = left + nameW + scoreW + i * cellW;
    ctx.fillText(short, x, headerH - 6);
  });

  // Rows
  shown.forEach((row, r) => {
    const y = headerH + r * rowH;
    ctx.font = "500 11px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#0A1628";
    let name = row.name;
    while (ctx.measureText(name).width > nameW - 12 && name.length > 3) {
      name = name.slice(0, -2);
    }
    if (name !== row.name) name += "…";
    ctx.fillText(name, left, y + 15);

    // Score
    const score = row.arcScore;
    ctx.font = "700 11px JetBrains Mono, monospace";
    ctx.fillStyle =
      score === undefined ? "#9CA3AF"
        : score >= 85 ? "#059669"
        : score >= 65 ? "#0259DD"
        : score >= 40 ? "#D97706"
        : "#DC2626";
    ctx.fillText(score === undefined ? "—" : String(score), left + nameW, y + 15);

    // Cells
    agentIds.forEach((agent, i) => {
      const x = left + nameW + scoreW + i * cellW;
      const status = row.agents[agent];
      ctx.fillStyle = STATUS_COLORS[status] ?? "#EFEAE3";
      ctx.globalAlpha = status === "no_rule" || !status ? 0.55 : 1;
      ctx.fillRect(x, y + 2, cellW - 4, rowH - 4);
      ctx.globalAlpha = 1;
    });
  });

  // Truncation note + footer bar
  let footY = headerH + shown.length * rowH + 18;
  ctx.font = "10px JetBrains Mono, monospace";
  ctx.fillStyle = "#6B7280";
  if (rows.length > MAX_ROWS) {
    ctx.fillText(`+ ${rows.length - MAX_ROWS} more brands — full matrix at arcreport.ai/matrix`, left, footY);
  }
  footY += 14;
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
    a.download = `arc-matrix-${date}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}
