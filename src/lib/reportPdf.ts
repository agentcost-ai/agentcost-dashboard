/**
 * Professional PDF export for the Executive Report.
 *
 * Generates a real PDF client-side with jsPDF + autotable and downloads it
 * directly — no browser print dialog, no "about:blank" headers, no dashboard
 * chrome. Vector charts, a letterhead, an executive-summary KPI grid, and
 * clean tables produce a consistent, board-ready document on every machine.
 *
 * jsPDF and autotable are dynamically imported so they stay out of the main
 * bundle until the user actually exports.
 */

import type { ExecutiveReport, MetricDelta, CadenceBucket } from "@/lib/api";
import type { jsPDF } from "jspdf";
import { AGENTCOST_LOGO_PNG } from "@/lib/reportLogo";

// ── palette (RGB) ──
const INK: [number, number, number] = [31, 36, 48];
const SKY: [number, number, number] = [2, 132, 199];
const MUTED: [number, number, number] = [138, 144, 155];
const FAINT: [number, number, number] = [184, 190, 200];
const LINE: [number, number, number] = [233, 237, 243];
const GREEN: [number, number, number] = [22, 163, 74];
const RED: [number, number, number] = [220, 38, 38];
const AMBER: [number, number, number] = [180, 83, 9];
const VIOLET: [number, number, number] = [124, 92, 246];
const FILL: [number, number, number] = [252, 253, 254];

// ── page geometry (A4, mm) ──
const PW = 210;
const PH = 297;
const M = 14;
const CW = PW - 2 * M; // content width = 182
const BOTTOM = PH - 16;

// ── formatting ──
const money = (v: number, c: string) => {
  const x = Number.isFinite(v) ? v : 0;
  const sym = c === "USD" ? "$" : c === "INR" ? "₹" : "";
  const d = Math.abs(x) > 0 && Math.abs(x) < 1 ? 4 : 2;
  const body = x.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  return sym ? `${sym}${body}` : `${body} ${c}`;
};
const num = (v: number) => (Number.isFinite(v) ? v : 0).toLocaleString();
const pct = (v: number) => `${(Number.isFinite(v) ? v : 0).toFixed(1)}%`;
const lat = (ms: number) => (!Number.isFinite(ms) ? "0 ms" : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`);
const dateStr = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const dateTimeStr = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
// Compact range that fits the period bar cell, e.g. "May 29 – Jun 28, 2026".
const compactRange = (startIso: string, endIso: string) => {
  const s = new Date(startIso);
  const e = new Date(endIso);
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return s.getFullYear() === e.getFullYear()
    ? `${md(s)} – ${md(e)}, ${e.getFullYear()}`
    : `${md(s)}, ${s.getFullYear()} – ${md(e)}, ${e.getFullYear()}`;
};

export async function downloadReportPdf(report: ExecutiveReport): Promise<void> {
  const doc = await buildReportDoc(report);
  const safe = report.range_label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`agentcost-report-${safe}.pdf`);
}

/** Build the jsPDF document (no save) — exported for headless verification. */
export async function buildReportDoc(report: ExecutiveReport): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const c = report.currency;
  let y = M;

  // ── small helpers bound to this doc ──
  const setColor = (rgb: [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const setFill = (rgb: [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const setDraw = (rgb: [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const text = (s: string | string[], x: number, yy: number, opts?: Parameters<jsPDF["text"]>[3]) =>
    doc.text(s, x, yy, opts);
  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      y = M;
    }
  };

  // ── letterhead ──
  // Brand mark: the actual AgentCost logo (lucide Grid2x2Plus) + wordmark.
  const logoSize = 10;
  doc.addImage(AGENTCOST_LOGO_PNG, "PNG", M, y, logoSize, logoSize);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(21);
  setColor(INK);
  text("AgentCost", M + logoSize + 4.5, y + 7.4);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  setColor(FAINT);
  text("CONFIDENTIAL", PW - M, y + 3.8, { align: "right", charSpace: 0.4 });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setColor(MUTED);
  text(`Generated ${dateTimeStr(report.generated_at)}`, PW - M, y + 8.4, { align: "right" });

  y += 13;
  setDraw(SKY);
  doc.setLineWidth(0.7);
  doc.line(M, y, PW - M, y);
  y += 9;

  // ── title block ──
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  setColor(INK);
  text(report.project_name, M, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  setColor(MUTED);
  text("Executive cost & usage report", M, y);
  y += 5;

  // period bar
  const pbH = 13;
  setFill([246, 248, 251]);
  setDraw(LINE);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, CW, pbH, 2, 2, "FD");
  const cells = [
    ["REPORTING PERIOD", compactRange(report.period_start, report.period_end)],
    ["WINDOW", `${report.range_label} (${report.run_rate.window_days}d)`],
    ["COMPARED AGAINST", `Prior ${report.run_rate.window_days}-day window`],
    ["CURRENCY", report.currency],
  ];
  const cw4 = CW / 4;
  cells.forEach(([label, val], i) => {
    const cx = M + i * cw4 + 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    setColor(MUTED);
    text(label, cx, y + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setColor(INK);
    text(doc.splitTextToSize(val, cw4 - 6)[0], cx, y + 9.6);
  });
  y += pbH + 9;

  // ── section heading helper ──
  const section = (n: number, title: string, sub: string) => {
    ensure(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    setColor(SKY);
    text(String(n).padStart(2, "0"), M, y + 1);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    setColor(INK);
    text(title, M + 8, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    setColor(MUTED);
    text(sub, M + 8, y + 5.4);
    y += 8;
    setDraw(LINE);
    doc.setLineWidth(0.2);
    doc.line(M, y, PW - M, y);
    y += 6;
  };

  // jsPDF's built-in Helvetica (WinAnsi) has no ▲/▼ glyphs, so use ASCII +/-.
  const deltaStr = (d: MetricDelta) => (d.direction === "neutral" ? "no change" : `${d.direction === "up" ? "+" : "-"}${Math.abs(d.change_percent).toFixed(1)}%`);
  const deltaColor = (d: MetricDelta, upIsBad = false): [number, number, number] =>
    d.direction === "neutral" ? MUTED : (d.direction === "up") === upIsBad ? RED : GREEN;

  // ── 01 Executive Summary ──
  section(1, "Executive Summary", "Headline metrics versus the prior period");

  const topModel = [...report.models].sort((a, b) => b.total_cost - a.total_cost)[0];
  const highlight = report.overview.total_calls
    ? `Across ${num(report.overview.total_calls)} calls this period, spend totalled ${money(report.overview.total_cost, c)}${
        topModel ? `, led by ${topModel.model} (${(topModel.cost_share ?? 0).toFixed(0)}% of cost)` : ""
      }. At the current run-rate that projects to ${money(report.run_rate.projected_monthly_cost, c)}/mo${
        report.savings.total_potential_savings_monthly > 0
          ? `, with an estimated ${money(report.savings.total_potential_savings_monthly, c)}/mo recoverable through optimization.`
          : "."
      }`
    : "No activity was recorded in this window.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  const hLines = doc.splitTextToSize(highlight, CW - 12) as string[];
  const hH = hLines.length * 4.6 + 7;
  ensure(hH + 46);
  setFill([240, 247, 253]);
  setDraw([214, 232, 247]);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, CW, hH, 2, 2, "FD");
  setFill(SKY);
  doc.rect(M, y, 1.2, hH, "F");
  setColor(INK);
  text(hLines, M + 6, y + 6);
  y += hH + 6;

  // KPI grid 3x2 — [label, value, delta|null, sub, upIsBad]
  const kpis: Array<[string, string, MetricDelta | null, string, boolean]> = [
    ["TOTAL SPEND", money(report.overview.total_cost, c), report.summary.cost, `${money(report.overview.avg_cost_per_call, c)}/call`, true],
    ["API CALLS", num(report.overview.total_calls), report.summary.calls, `${num(report.overview.avg_tokens_per_call)} tok/call`, false],
    ["TOKENS", num(report.overview.total_tokens), report.summary.tokens, `${num(report.overview.total_input_tokens)} in`, false],
    ["SUCCESS RATE", pct(report.overview.success_rate), report.summary.success_rate, `${pct(100 - report.overview.success_rate)} errors`, false],
    ["AVG LATENCY", lat(report.overview.avg_latency_ms), report.summary.avg_latency_ms, `p95 ${lat(report.latency.p95)}`, true],
    ["PROJECTED / MO", money(report.run_rate.projected_monthly_cost, c), null, "at current run-rate", false],
  ];
  const gap = 4;
  const kw = (CW - gap * 2) / 3;
  const kh = 20;
  ensure(2 * kh + gap);
  kpis.forEach((k, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = M + col * (kw + gap);
    const yy = y + row * (kh + gap);
    setFill(FILL);
    setDraw(LINE);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, yy, kw, kh, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    setColor(MUTED);
    text(k[0], x + 4, yy + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    setColor(INK);
    text(k[1], x + 4, yy + 11.6);
    // delta (colored) + sub (muted) on one line
    let sx = x + 4;
    if (k[2]) {
      const dstr = deltaStr(k[2]);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      setColor(deltaColor(k[2], k[4]));
      text(dstr, sx, yy + 16.8);
      sx += doc.getTextWidth(dstr) + 1.6;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    setColor(MUTED);
    text(k[3], sx, yy + 16.8);
  });
  y += 2 * kh + gap + 8;

  // ── 02 Spend Over Time ──
  section(2, "Spend Over Time", "Cost trend across the reporting window");
  ensure(46);
  drawAreaChart(doc, report.timeseries.map((p) => p.cost), M, y, CW, 38);
  y += 38 + 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  setColor(MUTED);
  if (report.timeseries.length > 1) {
    text(dateStr(report.timeseries[0].timestamp), M, y + 3);
    text(dateStr(report.timeseries[report.timeseries.length - 1].timestamp), PW - M, y + 3, { align: "right" });
  }
  y += 9;

  // ── 03 Budget Status ──
  const b = report.budget;
  section(3, "Budget Status", b.enabled ? `Month-to-date · ${b.mode} enforcement` : "Monthly budget");
  if (b.enabled && b.budget) {
    ensure(24);
    const bcells: Array<[string, string]> = [
      ["BUDGET", money(b.budget, c)],
      ["SPENT (MTD)", money(b.current_spend, c)],
      ["PROJECTED", money(b.projected_spend, c)],
      ["UTILIZATION", b.utilization_percent != null ? pct(b.utilization_percent) : "—"],
    ];
    bcells.forEach(([label, val], i) => {
      const cx = M + i * (CW / 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      setColor(MUTED);
      text(label, cx, y + 3);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      setColor(INK);
      text(val, cx, y + 9.5);
    });
    y += 13;
    const util = Math.min(b.utilization_percent ?? 0, 100);
    const barColor = (b.utilization_percent ?? 0) >= 100 ? RED : (b.utilization_percent ?? 0) >= 80 ? AMBER : GREEN;
    setFill([238, 240, 244]);
    doc.roundedRect(M, y, CW, 2.6, 1.3, 1.3, "F");
    setFill(barColor);
    doc.roundedRect(M, y, (CW * util) / 100, 2.6, 1.3, 1.3, "F");
    y += 11;
  } else {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    setColor(MUTED);
    text("No monthly budget configured. Set one in Settings to track utilization.", M, y + 2);
    y += 10;
  }

  // ── shared table styling ──
  const tableBase = {
    theme: "plain" as const,
    margin: { left: M, right: M },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 }, textColor: INK, lineColor: LINE, lineWidth: 0 },
    headStyles: { fontStyle: "bold" as const, fontSize: 7, textColor: MUTED, fillColor: [250, 251, 253] as [number, number, number], lineColor: LINE, lineWidth: { bottom: 0.3 } },
    bodyStyles: { lineColor: LINE, lineWidth: { bottom: 0.15 } },
    didDrawPage: () => drawFooter(doc, report),
  };

  // ── 04 Model Breakdown ──
  section(4, "Model Breakdown", "Ranked by spend, with cost efficiency per model");
  autoTable(doc, {
    ...tableBase,
    startY: y,
    head: [["Model", "Share", "Cost", "Cost / 1K", "Calls", "Latency"]],
    body: [...report.models]
      .sort((a, b) => b.total_cost - a.total_cost)
      .map((m) => [
        m.model,
        `${(m.cost_share ?? 0).toFixed(1)}%`,
        money(m.total_cost, c),
        m.total_tokens > 0 ? money((m.total_cost / m.total_tokens) * 1000, c) : "—",
        num(m.total_calls),
        lat(m.avg_latency_ms),
      ]),
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  // ── 05 Agent Breakdown ──
  section(5, "Agent Breakdown", "Spend, throughput and reliability per agent");
  autoTable(doc, {
    ...tableBase,
    startY: y,
    head: [["Agent", "Share", "Cost", "Calls", "Tokens", "Latency", "Success"]],
    body: report.agents.map((a) => [
      a.agent_name,
      `${(report.agent_cost_share[a.agent_name] ?? 0).toFixed(1)}%`,
      money(a.total_cost, c),
      num(a.total_calls),
      num(a.total_tokens),
      lat(a.avg_latency_ms),
      pct(a.success_rate),
    ]),
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" }, 4: { halign: "right" }, 5: { halign: "right" }, 6: { halign: "right" } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  // ── 06 Performance & Efficiency ──
  section(6, "Performance & Efficiency", "Latency distribution and token economics");
  ensure(26);
  const tiles: Array<[string, string]> = [
    ["P50", lat(report.latency.p50)],
    ["P95", lat(report.latency.p95)],
    ["P99", lat(report.latency.p99)],
    ["AVG", lat(report.latency.avg)],
    ["COST / 1K", money(report.efficiency.blended_cost_per_1k, c)],
    ["IN : OUT", `${report.efficiency.in_out_ratio.toFixed(2)} : 1`],
    ["INPUT TOK", num(report.efficiency.total_input_tokens)],
    ["OUTPUT TOK", num(report.efficiency.total_output_tokens)],
  ];
  const tw = (CW - gap * 3) / 4;
  const th = 16;
  tiles.forEach((t, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = M + col * (tw + gap);
    const yy = y + row * (th + gap);
    setFill(FILL);
    setDraw(LINE);
    doc.setLineWidth(0.2);
    doc.roundedRect(x, yy, tw, th, 2, 2, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.2);
    setColor(MUTED);
    text(t[0], x + 3.5, yy + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    setColor(INK);
    text(t[1], x + 3.5, yy + 11.5);
  });
  y += 2 * th + gap + 8;

  // ── 07 Reliability ──
  section(7, "Reliability", "Failure rate by model and most frequent errors");
  autoTable(doc, {
    ...tableBase,
    startY: y,
    head: [["Model", "Calls", "Errors", "Rate"]],
    body: report.errors.length
      ? report.errors.map((e) => [e.model, num(e.total_calls), num(e.error_count), `${e.error_rate.toFixed(2)}%`])
      : [["No model data", "", "", ""]],
    columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  if (report.top_errors.length) {
    ensure(10 + report.top_errors.length * 6);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    setColor(MUTED);
    text("TOP ERRORS", M, y);
    y += 5;
    report.top_errors.slice(0, 5).forEach((e) => {
      setDraw(LINE);
      setFill([255, 255, 255]);
      doc.setLineWidth(0.2);
      doc.roundedRect(M, y, CW, 6.5, 1.5, 1.5, "D");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      setColor(INK);
      text(doc.splitTextToSize(e.error, CW - 24)[0], M + 3, y + 4.3);
      doc.setFont("helvetica", "bold");
      setColor(MUTED);
      text(`×${num(e.count)}`, PW - M - 3, y + 4.3, { align: "right" });
      y += 8;
    });
  }
  y += 4;

  // ── 08 Usage Cadence ──
  // Keep heading + 7-row table + side chart together on one page.
  ensure(82);
  section(8, "Usage Cadence", report.cadence.busiest_day ? `Busiest day: ${report.cadence.busiest_day} · Busiest hour: ${report.cadence.busiest_hour ?? ""}` : "When your agents are most active");
  autoTable(doc, {
    ...tableBase,
    startY: y,
    head: [["Day of week", "Calls"]],
    body: report.cadence.by_dow.map((d) => [d.label, num(d.calls)]),
    columnStyles: { 1: { halign: "right" } },
    tableWidth: CW * 0.46,
  });
  const dowFinalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  // hour bar chart on the right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(MUTED);
  const chartX = M + CW * 0.52;
  const chartW = CW * 0.48;
  text("BY HOUR OF DAY (UTC)", chartX, y + 1);
  drawBarChart(doc, report.cadence.by_hour, chartX, y + 4, chartW, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  setColor(MUTED);
  text("00:00", chartX, y + 4 + 28 + 3.5);
  text("12:00", chartX + chartW / 2, y + 4 + 28 + 3.5, { align: "center" });
  text("23:00", chartX + chartW, y + 4 + 28 + 3.5, { align: "right" });
  y = Math.max(dowFinalY, y + 4 + 28 + 5) + 9;

  // ── 09 Optimization Savings ──
  section(9, "Optimization Savings", `${report.savings.suggestion_count} opportunities · ${report.savings.high_priority_count} high priority`);
  ensure(22 + report.savings.top_suggestions.length * 8);
  setFill([240, 253, 244]);
  setDraw([205, 238, 214]);
  doc.setLineWidth(0.2);
  doc.roundedRect(M, y, CW, 18, 2, 2, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  setColor(GREEN);
  text(money(report.savings.total_potential_savings_monthly, c), M + 6, y + 9.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setColor([77, 122, 93]);
  text("estimated potential savings / month", M + 6, y + 14);
  text(`${report.savings.total_potential_savings_percent.toFixed(1)}% of current spend`, PW - M - 6, y + 11, { align: "right" });
  y += 22;
  report.savings.top_suggestions.slice(0, 3).forEach((sg) => {
    ensure(9);
    setDraw(LINE);
    doc.setLineWidth(0.2);
    doc.roundedRect(M, y, CW, 8, 1.5, 1.5, "D");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    setColor(INK);
    text(doc.splitTextToSize(sg.title, CW - 36)[0], M + 3, y + 3.6);
    if (sg.agent_name) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      setColor(MUTED);
      text(sg.agent_name, M + 3, y + 6.6);
    }
    if (sg.estimated_savings_monthly != null) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      setColor(GREEN);
      text(`${money(sg.estimated_savings_monthly, c)}/mo`, PW - M - 3, y + 5, { align: "right" });
    }
    y += 10;
  });

  // ── footers (page numbers) on every page ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    drawFooter(doc, report, i, pages);
  }

  return doc;
}

// ── footer ──
function drawFooter(doc: jsPDF, report: ExecutiveReport, page?: number, total?: number) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
  doc.setDrawColor(LINE[0], LINE[1], LINE[2]);
  doc.setLineWidth(0.2);
  doc.line(M, PH - 11, PW - M, PH - 11);
  doc.text("Generated by AgentCost · agentcost.tech", M, PH - 7);
  doc.text(`${report.project_name} · ${report.range_label}`, PW - M, PH - 7, { align: "right" });
  if (page && total) {
    doc.text(`Page ${page} of ${total}`, PW / 2, PH - 7, { align: "center" });
  }
}

// ── vector charts ──
function drawAreaChart(doc: jsPDF, values: number[], x: number, y: number, w: number, h: number) {
  // frame gridlines
  doc.setDrawColor(236, 236, 237);
  doc.setLineWidth(0.15);
  [0, 0.25, 0.5, 0.75, 1].forEach((g) => {
    const gy = y + h - g * h;
    doc.line(x, gy, x + w, gy);
  });
  if (!values.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(MUTED[0], MUTED[1], MUTED[2]);
    doc.text("No activity in this window", x + w / 2, y + h / 2, { align: "center" });
    return;
  }
  const max = Math.max(...values, 0) || 1;
  const n = values.length;
  const px = (i: number) => x + (n > 1 ? (i / (n - 1)) * w : w / 2);
  const py = (v: number) => y + h - (v / max) * (h - 2) - 1;
  const pts = values.map((v, i) => [px(i), py(v)] as [number, number]);

  // filled area (pale sky), as a closed polygon via doc.lines
  const start: [number, number] = [pts[0][0], y + h];
  const deltas: number[][] = [];
  deltas.push([pts[0][0] - start[0], pts[0][1] - start[1]]);
  for (let i = 1; i < pts.length; i++) deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  deltas.push([0, y + h - pts[pts.length - 1][1]]);
  doc.setFillColor(213, 234, 248);
  doc.lines(deltas, start[0], start[1], [1, 1], "F", true);

  // top stroke
  const lineDeltas: number[][] = [];
  for (let i = 1; i < pts.length; i++) lineDeltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
  doc.setDrawColor(SKY[0], SKY[1], SKY[2]);
  doc.setLineWidth(0.7);
  doc.lines(lineDeltas, pts[0][0], pts[0][1], [1, 1], "S", false);
}

function drawBarChart(doc: jsPDF, buckets: CadenceBucket[], x: number, y: number, w: number, h: number) {
  if (!buckets.length) return;
  const max = Math.max(...buckets.map((b) => b.calls), 1);
  const n = buckets.length;
  const g = 0.9;
  const bw = (w - g * (n - 1)) / n;
  doc.setFillColor(VIOLET[0], VIOLET[1], VIOLET[2]);
  buckets.forEach((b, i) => {
    const bh = Math.max((b.calls / max) * h, 0.2);
    doc.roundedRect(x + i * (bw + g), y + h - bh, bw, bh, 0.4, 0.4, "F");
  });
}
