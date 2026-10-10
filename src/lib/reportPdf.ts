/**
 * PDF export for the Executive Report.
 *
 * Draws the same document the Reports page shows, in its light theme: a warm
 * sheet, white cards, ink and one lavender, pills for shares and capsules for
 * series. Built client-side with jsPDF and downloaded directly, so there is
 * no browser print dialog and the file looks the same on every machine.
 *
 * jsPDF is dynamically imported so it stays out of the main bundle until the
 * user actually exports.
 */

import type { ExecutiveReport, MetricDelta } from "@/lib/api";
import type { jsPDF } from "jspdf";

type RGB = [number, number, number];

// ── palette (the light sheet's variables, as RGB) ──
const PAPER: RGB = [246, 245, 243];
const WHITE: RGB = [255, 255, 255];
const INK: RGB = [23, 23, 28];
const MUTED: RGB = [115, 115, 127];
const HAIR: RGB = [228, 228, 234];
const TRACK: RGB = [233, 233, 238];
const LAVENDER: RGB = [185, 187, 247];
const VIOLET: RGB = [100, 102, 233];
const GREY: RGB = [154, 154, 166];
const ON_DARK_MUTED: RGB = [150, 150, 160];
const DARK_TRACK: RGB = [52, 52, 60];
const GOOD: RGB = [28, 143, 98];
const BAD: RGB = [207, 71, 71];

// ── page geometry (A4, mm) ──
const PW = 210;
const PH = 297;
const M = 14;
const CW = PW - 2 * M; // content width = 182
const BOTTOM = PH - 18;
const GAP = 4;

// ── formatting ──
// Helvetica's built-in encoding has no rupee sign, so INR is spelled out.
const money = (v: number, c: string) => {
  const x = Number.isFinite(v) ? v : 0;
  const sym = c === "USD" ? "$" : c === "INR" ? "Rs " : "";
  const d = Math.abs(x) > 0 && Math.abs(x) < 1 ? 4 : 2;
  const body = x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
  return sym ? `${sym}${body}` : `${body} ${c}`;
};
const compact = (v: number) => {
  const x = Number.isFinite(v) ? v : 0;
  if (x >= 1_000_000) return `${(x / 1_000_000).toFixed(1)}M`;
  if (x >= 1_000) return `${(x / 1_000).toFixed(1)}K`;
  return x.toLocaleString("en-US");
};
const pct = (v: number, digits = 1) => `${(Number.isFinite(v) ? v : 0).toFixed(digits)}%`;
const lat = (ms: number) =>
  !Number.isFinite(ms) ? "0ms" : ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
const shortDay = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const dateTime = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

export async function downloadReportPdf(report: ExecutiveReport): Promise<void> {
  const doc = await buildReportDoc(report);
  const safe = report.range_label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`agentcost-report-${safe}.pdf`);
}

type Column = { label: string; width: number; align?: "left" | "right"; share?: boolean; mono?: boolean };
type Cell = string | { share: number; lead: boolean } | { text: string; color: RGB };

/** Build the jsPDF document (no save). Exported for headless verification. */
export async function buildReportDoc(report: ExecutiveReport): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const c = report.currency;
  const { summary, overview, run_rate, budget, latency, efficiency, savings } = report;
  let y = M;

  // ── primitives ──
  const ink = (rgb: RGB) => doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  const fill = (rgb: RGB) => doc.setFillColor(rgb[0], rgb[1], rgb[2]);
  const stroke = (rgb: RGB) => doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
  const font = (size: number, style: "normal" | "bold" = "normal", family = "helvetica") => {
    doc.setFont(family, style);
    doc.setFontSize(size);
  };
  const text = (s: string, x: number, yy: number, align: "left" | "right" | "center" = "left") =>
    doc.text(s, x, yy, { align });
  const fit = (s: string, width: number) => {
    if (doc.getTextWidth(s) <= width) return s;
    let out = s;
    while (out.length > 1 && doc.getTextWidth(`${out}...`) > width) out = out.slice(0, -1);
    return `${out}...`;
  };

  const paintPage = () => {
    fill(PAPER);
    doc.rect(0, 0, PW, PH, "F");
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) {
      doc.addPage();
      paintPage();
      y = M + 2;
    }
  };
  const card = (x: number, yy: number, w: number, h: number, bg: RGB = WHITE) => {
    fill(bg);
    doc.roundedRect(x, yy, w, h, 5, 5, "F");
  };
  /** A fully rounded pill. `bg` null draws an outline only. */
  const pill = (x: number, yy: number, w: number, h: number, bg: RGB | null, line: RGB = HAIR) => {
    if (bg) {
      fill(bg);
      doc.roundedRect(x, yy, w, h, h / 2, h / 2, "F");
    } else {
      stroke(line);
      doc.setLineWidth(0.25);
      doc.roundedRect(x, yy, w, h, h / 2, h / 2, "S");
    }
  };
  /** A pill sized to its label. Returns the width it took. */
  const labelPill = (label: string, x: number, yy: number, bg: RGB | null, fg: RGB, right = false, line: RGB = HAIR) => {
    font(7.5);
    const w = doc.getTextWidth(label) + 7;
    const left = right ? x - w : x;
    pill(left, yy, w, 6.4, bg, line);
    ink(fg);
    text(label, left + w / 2, yy + 4.3, "center");
    return w;
  };
  const deltaText = (d: MetricDelta) =>
    d.direction === "neutral" ? "flat" : `${d.direction === "up" ? "up" : "down"} ${Math.abs(d.change_percent).toFixed(1)}%`;
  const deltaColor = (d: MetricDelta, upIsBad = false): RGB =>
    d.direction === "neutral" ? MUTED : (d.direction === "up") === upIsBad ? BAD : GOOD;
  const cardTitle = (s: string, x: number, yy: number, fg: RGB = INK) => {
    font(12);
    ink(fg);
    text(s, x, yy);
  };
  const figure = (label: string, value: string, x: number, yy: number, sub?: string) => {
    font(7);
    ink(MUTED);
    text(label, x, yy);
    font(14);
    ink(INK);
    text(value, x, yy + 6.6);
    if (sub) {
      font(7);
      ink(MUTED);
      text(sub, x, yy + 10.6);
    }
  };

  /** Capsules standing on dots; the tallest is violet and carries its value. */
  const capsules = (values: number[], labels: string[], x: number, yy: number, w: number, h: number, peakText: string) => {
    const max = Math.max(...values, 0);
    if (!values.length || max === 0) {
      font(8);
      ink(MUTED);
      text("Nothing recorded in this window.", x + w / 2, yy + h / 2, "center");
      return;
    }
    const n = values.length;
    const slot = w / n;
    const cw = Math.min(1.5, slot * 0.42);
    const peak = values.indexOf(max);
    const top = yy + 7; // room for the peak label
    const usable = h - 7 - 6.5; // minus label room above and dots + axis below
    values.forEach((v, i) => {
      const cx = x + slot * i + slot / 2;
      const ch = Math.max((v / max) * usable, cw);
      const cy = top + usable - ch;
      fill(i === peak ? VIOLET : INK);
      doc.roundedRect(cx - cw / 2, cy, cw, ch, cw / 2, cw / 2, "F");
      doc.circle(cx, top + usable + 1.7, 0.45, "F");
      if (labels[i]) {
        font(6);
        ink(i === peak ? INK : MUTED);
        text(labels[i], cx, top + usable + 5.6, "center");
      }
      if (i === peak) {
        font(6.5);
        const pw = doc.getTextWidth(peakText) + 5;
        const px = Math.min(Math.max(cx - pw / 2, x), x + w - pw);
        pill(px, cy - 6.2, pw, 5, LAVENDER);
        ink(INK);
        text(peakText, px + pw / 2, cy - 2.8, "center");
      }
    });
  };

  /** Keep roughly `keep` evenly spaced labels and blank the rest. */
  const sparse = (labels: string[], keep: number) => {
    if (labels.length <= keep) return labels;
    const step = (labels.length - 1) / (keep - 1);
    const shown = new Set(Array.from({ length: keep }, (_, i) => Math.round(i * step)));
    return labels.map((l, i) => (shown.has(i) ? l : ""));
  };

  /** A share of the whole as an arc inside a tick dial. */
  const dial = (cx: number, cy: number, r: number, percent: number, caption: string) => {
    stroke(MUTED);
    doc.setLineWidth(0.18);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      doc.line(cx + Math.cos(a) * (r + 3.2), cy + Math.sin(a) * (r + 3.2), cx + Math.cos(a) * (r + 4.6), cy + Math.sin(a) * (r + 4.6));
    }
    stroke(TRACK);
    doc.setLineWidth(2.6);
    doc.circle(cx, cy, r, "S");
    stroke(VIOLET);
    doc.setLineCap("round");
    const sweep = (Math.min(Math.max(percent, 0), 100) / 100) * Math.PI * 2;
    const steps = Math.max(2, Math.ceil(sweep / 0.05));
    for (let i = 0; i < steps; i++) {
      const a0 = -Math.PI / 2 + (sweep * i) / steps;
      const a1 = -Math.PI / 2 + (sweep * (i + 1)) / steps;
      doc.line(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r);
    }
    doc.setLineCap("butt");
    font(15);
    ink(INK);
    text(pct(percent), cx, cy + 1.2, "center");
    font(6.5);
    ink(MUTED);
    text(caption, cx, cy + 5.2, "center");
  };

  /** Hairline table straight on the sheet. Repeats its header after a page break. */
  const table = (columns: Column[], rows: Cell[][]) => {
    const header = () => {
      let x = M;
      font(7);
      ink(MUTED);
      columns.forEach((col) => {
        text(col.label, col.align === "right" ? x + col.width : x, y + 3.6, col.align ?? "left");
        x += col.width;
      });
      y += 6;
    };
    // A table that fits on one page is never split across two; only one too
    // long for a page flows over, repeating its header.
    const whole = 6 + rows.length * 7.2;
    ensure(whole <= BOTTOM - M - 2 ? whole : 6 + 7.2);
    header();
    rows.forEach((row) => {
      if (y + 7.2 > BOTTOM) {
        doc.addPage();
        paintPage();
        y = M + 2;
        header();
      }
      stroke(HAIR);
      doc.setLineWidth(0.2);
      doc.line(M, y, PW - M, y);
      let x = M;
      row.forEach((cell, i) => {
        const col = columns[i];
        if (typeof cell === "object" && "share" in cell) {
          const bw = 24;
          pill(x, y + 2.9, bw, 1.5, TRACK);
          const fw = Math.max((Math.min(cell.share, 100) / 100) * bw, 1.5);
          pill(x, y + 2.9, fw, 1.5, cell.lead ? VIOLET : INK);
          font(7.5);
          ink(MUTED);
          text(pct(cell.share), x + bw + 2.5, y + 4.7);
        } else {
          const value = typeof cell === "string" ? cell : cell.text;
          font(8.5, "normal", col.mono ? "courier" : "helvetica");
          ink(typeof cell === "string" ? INK : cell.color);
          text(fit(value, col.width - 2), col.align === "right" ? x + col.width : x, y + 4.7, col.align ?? "left");
        }
        x += col.width;
      });
      y += 7.2;
    });
    y += 6;
  };

  const heading = (title: string, aside?: string) => {
    ensure(26);
    font(13);
    ink(INK);
    text(title, M, y + 4);
    if (aside) labelPill(aside, PW - M, y - 0.4, null, INK, true);
    y += 10;
  };

  // ── letterhead ──
  paintPage();
  font(11);
  const brandW = doc.getTextWidth("AgentCost") + 11;
  pill(M, y, brandW, 9, null, INK);
  ink(INK);
  text("AgentCost", M + brandW / 2, y + 5.9, "center");

  let px = PW - M;
  px -= labelPill(`against the previous ${run_rate.window_days} days`, px, y + 1.3, null, INK, true) + 2;
  px -= labelPill(`${day(report.period_start)} to ${day(report.period_end)}`, px, y + 1.3, null, INK, true) + 2;
  labelPill(report.range_label, px, y + 1.3, INK, WHITE, true);
  y += 21;

  font(23);
  ink(INK);
  text(fit(`Cost and usage, ${report.project_name}`, CW), M, y);
  y += 5.5;
  font(8);
  ink(MUTED);
  text(`Generated ${dateTime(report.generated_at)}`, M, y);
  y += 15;

  // ── the three numbers ──
  const numbers: Array<[string, string, MetricDelta, boolean]> = [
    ["Spend", money(overview.total_cost, c), summary.cost, true],
    ["Calls", compact(overview.total_calls), summary.calls, false],
    ["Tokens", compact(overview.total_tokens), summary.tokens, false],
  ];
  numbers.forEach(([label, value, delta, upIsBad], i) => {
    const x = M + i * (CW / 3);
    font(27);
    ink(INK);
    text(value, x, y);
    font(8);
    text(label, x, y + 5.4);
    ink(deltaColor(delta, upIsBad));
    text(deltaText(delta), x + doc.getTextWidth(label) + 2, y + 5.4);
  });
  y += 14;

  // ── who spent it: the three biggest agents as pills, the rest as one ──
  const ranked = report.agents
    .map((a) => ({ name: a.agent_name, share: report.agent_cost_share[a.agent_name] ?? 0 }))
    .sort((a, b) => b.share - a.share);
  const band = ranked.slice(0, 3);
  const rest = ranked.slice(3).reduce((s, a) => s + a.share, 0);
  if (rest > 0) band.push({ name: `${ranked.length - 3} more`, share: rest });
  if (band.length > 0) {
    const weights = band.map((a) => Math.max(a.share, 9));
    const total = weights.reduce((s, w) => s + w, 0);
    const usable = CW - (band.length - 1) * 1.5;
    let x = M;
    band.forEach((a, i) => {
      const w = (weights[i] / total) * usable;
      font(7.5);
      ink(INK);
      text(fit(a.name, w - 2), x + 1, y);
      const style: Array<[RGB | null, RGB]> = [
        [INK, WHITE],
        [LAVENDER, INK],
        [TRACK, INK],
        [null, INK],
      ];
      const [bg, fg] = style[Math.min(i, 3)];
      pill(x, y + 2, w, 9, bg, MUTED);
      ink(fg);
      text(pct(a.share, 0), x + 4, y + 7.7);
      x += w + 1.5;
    });
    font(7);
    ink(MUTED);
    text("Share of spend by agent", M + 1, y + 15.5);
    y += 23;
  }

  // ── four cards, two by two ──
  const cardW = (CW - GAP) / 2;
  const cardH = 56;
  ensure(cardH * 2 + GAP);

  // Run rate (the contrast card)
  {
    const x = M;
    card(x, y, cardW, cardH, INK);
    cardTitle("Run rate", x + 6, y + 9, WHITE);
    font(22);
    ink(WHITE);
    text(money(run_rate.projected_monthly_cost, c), x + 6, y + 22);
    font(7.5);
    ink(ON_DARK_MUTED);
    text("a month if this window repeats", x + 6, y + 27);
    if (budget.enabled && budget.budget) {
      const used = budget.utilization_percent ?? 0;
      text(`Budget ${money(budget.budget, c)}`, x + 6, y + 40);
      ink(WHITE);
      text(`${used.toFixed(0)}% used`, x + cardW - 6, y + 40, "right");
      pill(x + 6, y + 42.5, cardW - 12, 2.6, DARK_TRACK);
      pill(x + 6, y + 42.5, Math.max(((cardW - 12) * Math.min(used, 100)) / 100, 2.6), 2.6, used >= 100 ? BAD : LAVENDER);
      ink(ON_DARK_MUTED);
      text(`${money(budget.current_spend, c)} spent this month, ${budget.mode} enforcement`, x + 6, y + 49.5);
    } else {
      labelPill("No monthly budget set", x + 6, y + 42, null, WHITE, false, ON_DARK_MUTED);
    }
  }

  // Spend over time
  {
    const x = M + cardW + GAP;
    card(x, y, cardW, cardH);
    cardTitle("Spend over time", x + 6, y + 9);
    font(15);
    ink(INK);
    const avg = money(run_rate.daily_avg_cost, c);
    text(avg, x + 6, y + 18);
    font(7);
    ink(MUTED);
    text("a day, on average", x + 8 + doc.getTextWidth(avg) * (15 / 7), y + 18);
    const points = report.timeseries;
    const size = Math.max(1, Math.ceil(points.length / 31));
    const values: number[] = [];
    const labels: string[] = [];
    for (let i = 0; i < points.length; i += size) {
      const chunk = points.slice(i, i + size);
      values.push(chunk.reduce((s, p) => s + p.cost, 0));
      labels.push(shortDay(chunk[0].timestamp));
    }
    capsules(values, sparse(labels, 4), x + 6, y + 21, cardW - 12, 32, money(Math.max(...values, 0), c));
  }
  y += cardH + GAP;

  // Reliability
  {
    const x = M;
    card(x, y, cardW, cardH);
    cardTitle("Reliability", x + 6, y + 9);
    dial(x + cardW / 2, y + 30, 13.5, overview.success_rate, "of calls succeeded");
    font(7.5);
    ink(MUTED);
    text("Against last period", x + 6, y + cardH - 5);
    ink(deltaColor(summary.success_rate));
    text(deltaText(summary.success_rate), x + cardW - 6, y + cardH - 5, "right");
  }

  // Recoverable
  {
    const x = M + cardW + GAP;
    card(x, y, cardW, cardH);
    cardTitle("Recoverable", x + 6, y + 9);
    font(17);
    ink(INK);
    text(pct(savings.total_potential_savings_percent, 0), x + cardW - 6, y + 10, "right");
    const blocks = savings.top_suggestions
      .filter((s) => (s.estimated_savings_monthly ?? 0) > 0)
      .sort((a, b) => (b.estimated_savings_monthly ?? 0) - (a.estimated_savings_monthly ?? 0))
      .slice(0, 3);
    const blockTotal = blocks.reduce((s, b) => s + (b.estimated_savings_monthly ?? 0), 0);
    if (blocks.length > 0) {
      const tones: RGB[] = [LAVENDER, INK, GREY];
      const usable = cardW - 12 - (blocks.length - 1) * 1.5;
      let bx = x + 6;
      blocks.forEach((b, i) => {
        const part = (b.estimated_savings_monthly ?? 0) / blockTotal;
        const w = Math.max(part * usable, 9);
        font(6.5);
        ink(INK);
        text(pct(part * 100, 0), bx + 1, y + 19);
        fill(tones[i]);
        doc.roundedRect(bx, y + 20.5, w, 9, 2.6, 2.6, "F");
        bx += w + 1.5;
      });
    } else {
      font(8);
      ink(MUTED);
      text("Nothing to recommend in this window.", x + 6, y + 24);
    }
    font(15);
    ink(INK);
    text(money(savings.total_potential_savings_monthly, c), x + 6, y + 43);
    font(7.5);
    ink(MUTED);
    text(
      `a month across ${savings.suggestion_count} change${savings.suggestion_count === 1 ? "" : "s"}, ${savings.high_priority_count} high priority`,
      x + 6,
      y + 48.5,
    );
  }
  y += cardH + GAP;

  // ── what to change (the second contrast card) ──
  if (savings.top_suggestions.length > 0) {
    const items = savings.top_suggestions.slice(0, 5);
    const h = 17 + items.length * 10.5;
    ensure(h + GAP);
    card(M, y, CW, h, INK);
    cardTitle("What to change", M + 6, y + 9, WHITE);
    font(15);
    ink(WHITE);
    text(`${items.length}/${savings.suggestion_count}`, PW - M - 6, y + 10, "right");
    items.forEach((s, i) => {
      const yy = y + 17 + i * 10.5;
      fill(DARK_TRACK);
      doc.circle(M + 9.5, yy + 3, 3.2, "F");
      font(7);
      ink(WHITE);
      text(String(i + 1), M + 9.5, yy + 3.9, "center");
      font(8.5);
      text(fit(s.title, CW - 60), M + 16, yy + 2.4);
      font(7);
      ink(ON_DARK_MUTED);
      text(s.agent_name ?? "project-wide", M + 16, yy + 6.2);
      if (s.estimated_savings_monthly != null) {
        font(8.5);
        ink(WHITE);
        text(`${money(s.estimated_savings_monthly, c)} a month`, PW - M - 6, yy + 4, "right");
      }
    });
    y += h + 10;
  } else {
    y += 6;
  }

  // ── models ──
  const models = [...report.models].sort((a, b) => b.total_cost - a.total_cost);
  heading(
    "Models",
    report.model_pareto.top_count > 0
      ? `top ${report.model_pareto.top_count} of ${report.model_pareto.total_models} carry ${report.model_pareto.top_share.toFixed(0)}%`
      : undefined,
  );
  if (models.length > 0) {
    table(
      [
        { label: "Model", width: 48, mono: true },
        { label: "Share of spend", width: 44, share: true },
        { label: "Cost", width: 25, align: "right" },
        { label: "Per 1K tokens", width: 25, align: "right" },
        { label: "Calls", width: 20, align: "right" },
        { label: "Latency", width: 20, align: "right" },
      ],
      models.map((m, i) => [
        m.model,
        { share: m.cost_share ?? 0, lead: i === 0 },
        money(m.total_cost, c),
        m.total_tokens > 0 ? { text: money((m.total_cost / m.total_tokens) * 1000, c), color: MUTED } : "n/a",
        compact(m.total_calls),
        lat(m.avg_latency_ms),
      ]),
    );
  }

  // ── agents ──
  heading("Agents");
  if (report.agents.length > 0) {
    table(
      [
        { label: "Agent", width: 46 },
        { label: "Share of spend", width: 42, share: true },
        { label: "Cost", width: 22, align: "right" },
        { label: "Calls", width: 18, align: "right" },
        { label: "Tokens", width: 18, align: "right" },
        { label: "Latency", width: 18, align: "right" },
        { label: "Success", width: 18, align: "right" },
      ],
      report.agents.map((a, i) => [
        a.agent_name,
        { share: report.agent_cost_share[a.agent_name] ?? 0, lead: i === 0 },
        money(a.total_cost, c),
        compact(a.total_calls),
        compact(a.total_tokens),
        lat(a.avg_latency_ms),
        a.success_rate < 97 ? { text: pct(a.success_rate), color: BAD } : pct(a.success_rate),
      ]),
    );
  }

  // ── latency and tokens ──
  {
    const h = 44;
    ensure(h + GAP + 6);
    card(M, y, cardW, h);
    cardTitle("Latency", M + 6, y + 9);
    labelPill(`${compact(latency.sample_size)} calls${latency.approximate ? ", sampled" : ""}`, M + cardW - 6, y + 4.6, null, INK, true);
    const fw = (cardW - 12) / 4;
    figure("Median", lat(latency.p50), M + 6, y + 18);
    figure("p95", lat(latency.p95), M + 6 + fw, y + 18);
    figure("p99", lat(latency.p99), M + 6 + fw * 2, y + 18);
    figure("Average", lat(latency.avg), M + 6 + fw * 3, y + 18);
    const scale = Math.max(latency.p99, latency.avg, 1);
    const rw = cardW - 12;
    pill(M + 6, y + 33, rw, 2.4, TRACK);
    pill(M + 6, y + 33, Math.max((latency.p95 / scale) * rw, 2.4), 2.4, GREY);
    pill(M + 6, y + 33, Math.max((latency.p50 / scale) * rw, 2.4), 2.4, INK);
    fill(VIOLET);
    doc.circle(M + 6 + Math.min(latency.p99 / scale, 1) * rw, y + 34.2, 1.9, "F");
    font(6.5);
    ink(MUTED);
    text("Ink to the median, grey to p95, the marker at p99.", M + 6, y + 40.5);

    const x = M + cardW + GAP;
    card(x, y, cardW, h);
    cardTitle("Tokens", x + 6, y + 9);
    labelPill(`${efficiency.in_out_ratio.toFixed(2)} in to 1 out`, x + cardW - 6, y + 4.6, null, INK, true);
    const tw = (cardW - 12) / 3;
    figure("Per 1K tokens", money(efficiency.blended_cost_per_1k, c), x + 6, y + 18);
    figure("Input", compact(efficiency.total_input_tokens), x + 6 + tw, y + 18);
    figure("Output", compact(efficiency.total_output_tokens), x + 6 + tw * 2, y + 18);
    const tokens = efficiency.total_input_tokens + efficiency.total_output_tokens;
    const inShare = tokens > 0 ? efficiency.total_input_tokens / tokens : 0;
    const usable = cardW - 12 - 1.5;
    const inW = Math.min(Math.max(inShare * usable, 16), usable - 16);
    pill(x + 6, y + 31, inW, 8, INK);
    pill(x + 6 + inW + 1.5, y + 31, usable - inW, 8, LAVENDER);
    font(7.5);
    ink(WHITE);
    text(`${pct(inShare * 100, 0)} in`, x + 10, y + 36.2);
    ink(INK);
    text(`${pct((1 - inShare) * 100, 0)} out`, x + 6 + inW + 5.5, y + 36.2);
    y += h + 10;
  }

  // ── failures ──
  heading("Failures");
  if (report.errors.length > 0) {
    table(
      [
        { label: "Model", width: 92, mono: true },
        { label: "Calls", width: 30, align: "right" },
        { label: "Failed", width: 30, align: "right" },
        { label: "Rate", width: 30, align: "right" },
      ],
      report.errors.map((e) => [
        e.model,
        compact(e.total_calls),
        compact(e.error_count),
        { text: `${e.error_rate.toFixed(2)}%`, color: e.error_rate >= 5 ? BAD : e.error_rate < 1 ? MUTED : INK },
      ]),
    );
  }
  if (report.top_errors.length > 0) {
    table(
      [
        { label: "Most frequent errors", width: 140 },
        { label: "Seen", width: 42, align: "right" },
      ],
      report.top_errors.slice(0, 5).map((e) => [e.error, { text: `${compact(e.count)} times`, color: MUTED }]),
    );
  }

  // ── when the agents run ──
  {
    const h = 54;
    ensure(h + 4);
    const leftW = CW * 0.36;
    const rightW = CW - leftW - GAP;
    card(M, y, leftW, h);
    cardTitle("By day of week", M + 6, y + 9);
    const dow = report.cadence.by_dow;
    capsules(
      dow.map((b) => b.calls),
      dow.map((b) => b.label.slice(0, 1)),
      M + 6,
      y + 14,
      leftW - 12,
      36,
      `${report.cadence.busiest_day ?? "Busiest"}, ${compact(Math.max(...dow.map((b) => b.calls), 0))} calls`,
    );
    const x = M + leftW + GAP;
    card(x, y, rightW, h);
    cardTitle("By hour of day", x + 6, y + 9);
    labelPill("UTC", x + rightW - 6, y + 4.6, null, INK, true);
    const hours = report.cadence.by_hour;
    capsules(
      hours.map((b) => b.calls),
      sparse(hours.map((b) => b.label), 6),
      x + 6,
      y + 14,
      rightW - 12,
      36,
      `${report.cadence.busiest_hour ?? "Busiest"}, ${compact(Math.max(...hours.map((b) => b.calls), 0))} calls`,
    );
    y += h;
  }

  // ── footers ──
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    font(7);
    ink(MUTED);
    text("Generated by AgentCost · agentcost.tech", M, PH - 8);
    text(`Page ${i} of ${pages}`, PW / 2, PH - 8, "center");
    text(fit(`${report.project_name} · ${report.range_label}`, 70), PW - M, PH - 8, "right");
  }

  return doc;
}
