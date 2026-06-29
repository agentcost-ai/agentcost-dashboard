/**
 * Client-side CSV export for the Executive Report. Emits a single multi-section
 * CSV covering the raw breakdown tables (models, agents, errors, cadence) and
 * triggers a browser download. No external dependency.
 */

import type { ExecutiveReport } from "@/lib/api";

type Cell = string | number;

function escapeCell(value: Cell): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// Excel-friendly: CRLF row endings; the whole file is prefixed with a UTF-8
// BOM in exportReportCsv so currency symbols / accents render correctly.
function toCsv(rows: Cell[][]): string {
  return rows.map((r) => r.map(escapeCell).join(",")).join("\r\n");
}

function costPer1k(cost: number, tokens: number): number {
  return tokens > 0 ? Number(((cost / tokens) * 1000).toFixed(6)) : 0;
}

export function buildReportCsv(report: ExecutiveReport): string {
  const sections: string[] = [];

  sections.push(
    toCsv([
      ["AgentCost — Executive Cost & Usage Report"],
      ["Project", report.project_name],
      ["Period", report.range_label],
      ["Period start", report.period_start],
      ["Period end", report.period_end],
      ["Generated at", report.generated_at],
      ["Currency", report.currency],
    ]),
  );

  sections.push(
    toCsv([
      ["Summary metric", "Current", "Previous", "Change %"],
      ["Cost", report.summary.cost.current, report.summary.cost.previous, report.summary.cost.change_percent],
      ["Calls", report.summary.calls.current, report.summary.calls.previous, report.summary.calls.change_percent],
      ["Tokens", report.summary.tokens.current, report.summary.tokens.previous, report.summary.tokens.change_percent],
      ["Success rate %", report.summary.success_rate.current, report.summary.success_rate.previous, report.summary.success_rate.change_percent],
      ["Avg latency ms", report.summary.avg_latency_ms.current, report.summary.avg_latency_ms.previous, report.summary.avg_latency_ms.change_percent],
      ["Blended cost / 1K tokens", report.summary.blended_cost_per_1k, "", ""],
      ["Input:output token ratio", report.summary.in_out_ratio, "", ""],
      ["Projected monthly run-rate", report.run_rate.projected_monthly_cost, "", ""],
    ]),
  );

  sections.push(
    toCsv([
      ["Model Breakdown"],
      ["Model", "Calls", "Cost", "Total tokens", "Input tokens", "Output tokens", "Cost per 1K", "Avg latency ms", "Cost share %"],
      ...report.models.map((m) => [
        m.model,
        m.total_calls,
        m.total_cost,
        m.total_tokens,
        m.input_tokens,
        m.output_tokens,
        costPer1k(m.total_cost, m.total_tokens),
        m.avg_latency_ms,
        m.cost_share ?? 0,
      ]),
    ]),
  );

  sections.push(
    toCsv([
      ["Agent Breakdown"],
      ["Agent", "Calls", "Cost", "Total tokens", "Avg latency ms", "Success rate %", "Cost share %"],
      ...report.agents.map((a) => [
        a.agent_name,
        a.total_calls,
        a.total_cost,
        a.total_tokens,
        a.avg_latency_ms,
        a.success_rate,
        report.agent_cost_share[a.agent_name] ?? 0,
      ]),
    ]),
  );

  sections.push(
    toCsv([
      ["Reliability — Errors by Model"],
      ["Model", "Total calls", "Errors", "Error rate %"],
      ...report.errors.map((e) => [e.model, e.total_calls, e.error_count, e.error_rate]),
    ]),
  );

  if (report.top_errors.length > 0) {
    sections.push(
      toCsv([
        ["Top Errors"],
        ["Error", "Count"],
        ...report.top_errors.map((e) => [e.error, e.count]),
      ]),
    );
  }

  sections.push(
    toCsv([
      ["Usage Cadence — By Day of Week"],
      ["Day", "Calls", "Cost"],
      ...report.cadence.by_dow.map((b) => [b.label, b.calls, b.cost]),
    ]),
  );

  sections.push(
    toCsv([
      ["Usage Cadence — By Hour of Day"],
      ["Hour", "Calls", "Cost"],
      ...report.cadence.by_hour.map((b) => [b.label, b.calls, b.cost]),
    ]),
  );

  return sections.join("\r\n\r\n");
}

export function exportReportCsv(report: ExecutiveReport): void {
  // Prepend a UTF-8 BOM so Excel detects the encoding (fixes ₹/·/accents) and
  // the comma delimiter; without it Excel mis-renders unicode and columns.
  const BOM = String.fromCharCode(0xfeff);
  const csv = BOM + buildReportCsv(report);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const safeLabel = report.range_label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const a = document.createElement("a");
  a.href = url;
  a.download = `agentcost-report-${safeLabel}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
