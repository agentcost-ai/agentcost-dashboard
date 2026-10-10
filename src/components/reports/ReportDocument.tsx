"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  cn,
  dayBucketDate,
  formatCurrency,
  formatNumber,
  formatLatency,
  formatPercentage,
} from "@/lib/utils";
import type { ExecutiveReport, MetricDelta, ModelStats, TimeSeriesPoint } from "@/lib/api";

/* ─────────────────────────────────────────────
   The executive report, set as a document: a
   light sheet on the dark app, because it is
   the one page that gets read by people who
   never open the dashboard. Ink, one lavender,
   and a hatch for "the rest". Shapes carry the
   data: pills for shares, capsules for series.
   ───────────────────────────────────────────── */

/* Every colour is a variable defined on .report-sheet in globals.css, once
   for the light sheet and once for the dark one. Print always uses light. */
const CARD =
  "report-section rounded-[26px] border border-[color:var(--rp-card-border)] bg-[var(--rp-card)] p-6 shadow-[var(--rp-card-shadow)] sm:p-7";
/** The contrast card: ink on the light sheet, pale lavender on the dark one. */
const DARK =
  "report-section rounded-[26px] bg-[var(--rp-contrast)] p-6 text-[color:var(--rp-on-contrast)] sm:p-7";
const MUTED = "text-[color:var(--rp-muted)]";
const ON_CONTRAST_MUTED = "text-[color:var(--rp-on-contrast-muted)]";
const INK = "var(--rp-ink)";
const LAVENDER = "var(--rp-accent)";
const VIOLET = "var(--rp-accent-strong)";
const HATCH = "repeating-linear-gradient(135deg, var(--rp-hatch) 0 1px, transparent 1px 7px)";

export type ReportTheme = "light" | "dark";

function fmtMoney(value: number, currency: string): string {
  if (currency === "USD" && Math.abs(value) < 1) return formatCurrency(value);
  const symbol = currency === "USD" ? "$" : currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Period-over-period change, as text. Green and red mean good and bad, not up and down. */
function Change({ delta, upIsBad = false, onDark = false }: { delta: MetricDelta; upIsBad?: boolean; onDark?: boolean }) {
  if (delta.direction === "neutral") {
    return <span className={onDark ? ON_CONTRAST_MUTED : MUTED}>flat</span>;
  }
  const bad = (delta.direction === "up") === upIsBad;
  return (
    <span className={cn("tabular-nums", bad ? "text-[color:var(--rp-bad)]" : "text-[color:var(--rp-good)]")}>
      {delta.direction === "up" ? "↑" : "↓"} {Math.abs(delta.change_percent).toFixed(1)}%
    </span>
  );
}

function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border border-[color:var(--rp-line)] px-3.5 py-1.5 text-[12.5px]", className)}>
      {children}
    </span>
  );
}

function CardTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h3 className="text-[1.3rem] font-normal tracking-[-0.01em]">{children}</h3>
      {aside}
    </div>
  );
}

/**
 * A series as capsules standing on a row of dots. The tallest is lavender and
 * carries its value; the rest are ink.
 */
function Capsules({
  values,
  labels,
  peakLabel,
  tall = false,
}: {
  values: number[];
  /** One per value, or a sparse set of the same length with "" for no label. */
  labels: string[];
  peakLabel: string;
  tall?: boolean;
}) {
  const max = Math.max(...values, 0);
  if (values.length === 0 || max === 0) {
    return <p className={cn("py-10 text-center text-[13px]", MUTED)}>Nothing recorded in this window.</p>;
  }
  const peak = values.indexOf(max);
  return (
    <div>
      <div className={cn("flex items-end", tall ? "h-40" : "h-32")}>
        {values.map((v, i) => (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <div
              className="relative w-[5px] rounded-full sm:w-[6px]"
              style={{
                height: `${Math.max((v / max) * 82, 3)}%`,
                backgroundColor: i === peak ? VIOLET : INK,
              }}
            >
              {i === peak && (
                <span
                  className={cn(
                    "absolute bottom-full mb-2 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums text-[color:var(--rp-on-accent)]",
                    i < values.length * 0.2 ? "left-0" : i > values.length * 0.8 ? "right-0" : "left-1/2 -translate-x-1/2",
                  )}
                  style={{ backgroundColor: LAVENDER }}
                >
                  {peakLabel}
                </span>
              )}
            </div>
            <span
              className="mt-2 size-[5px] rounded-full"
              style={{ backgroundColor: i === peak ? VIOLET : INK }}
              aria-hidden
            />
          </div>
        ))}
      </div>
      <div className={cn("mt-2 flex text-[11px]", MUTED)}>
        {labels.map((l, i) => (
          <span key={i} className={cn("min-w-0 flex-1 overflow-visible whitespace-nowrap text-center", i === peak && "text-[color:var(--rp-ink)]")}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Group a long series so no capsule gets thinner than it can be read. */
function bucketSeries(points: TimeSeriesPoint[], hourly: boolean) {
  const size = Math.max(1, Math.ceil(points.length / 31));
  const out: { cost: number; label: string }[] = [];
  for (let i = 0; i < points.length; i += size) {
    const chunk = points.slice(i, i + size);
    const first = chunk[0].timestamp;
    out.push({
      cost: chunk.reduce((s, p) => s + p.cost, 0),
      label: hourly ? format(new Date(first), "HH:mm") : format(dayBucketDate(first), "MMM d"),
    });
  }
  return { buckets: out, size };
}

/** Keep roughly `keep` evenly spaced labels and blank the rest. */
function sparse(labels: string[], keep: number): string[] {
  if (labels.length <= keep) return labels;
  const step = (labels.length - 1) / (keep - 1);
  const shown = new Set(Array.from({ length: keep }, (_, i) => Math.round(i * step)));
  return labels.map((l, i) => (shown.has(i) ? l : ""));
}

/** Success rate as an arc inside a tick dial. */
function Dial({ percent, caption }: { percent: number; caption: string }) {
  const size = 190;
  const r = 70;
  const c = 2 * Math.PI * r;
  const rTick = r + 17;
  const cTick = 2 * Math.PI * rTick;
  const filled = (Math.min(Math.max(percent, 0), 100) / 100) * c;
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90" role="img" aria-label={`${percent.toFixed(1)}% ${caption}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={rTick}
          fill="none"
          stroke="var(--rp-tick)"
          strokeWidth={6}
          strokeDasharray={`1 ${cTick / 60 - 1}`}
        />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--rp-track)" strokeWidth={13} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={VIOLET}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${c - filled}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[2.1rem] font-light leading-none tracking-[-0.03em] tabular-nums">{percent.toFixed(1)}%</p>
        <p className={cn("mt-1.5 text-[12px]", MUTED)}>{caption}</p>
      </div>
    </div>
  );
}

/** A share drawn as an ink capsule on a hairline track. */
function ShareBar({ percent, tone = INK }: { percent: number; tone?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="relative h-[6px] w-24 overflow-hidden rounded-full bg-[var(--rp-track)]">
        <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: tone }} />
      </span>
      <span className={cn("text-[12px] tabular-nums", MUTED)}>{percent.toFixed(1)}%</span>
    </span>
  );
}

function Figure({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div>
      <p className={cn("text-[12px]", MUTED)}>{label}</p>
      <p className="mt-1.5 text-[1.7rem] font-light leading-none tracking-[-0.02em] tabular-nums">{value}</p>
      {sub && <p className={cn("mt-1.5 text-[12px]", MUTED)}>{sub}</p>}
    </div>
  );
}

const TH = cn("pb-3 text-left text-[12px] font-normal", MUTED);
const TD = "border-t border-[color:var(--rp-hair)] py-3 text-[13.5px] tabular-nums";

interface ReportDocumentProps {
  report: ExecutiveReport;
  theme?: ReportTheme;
}

export function ReportDocument({ report, theme = "light" }: ReportDocumentProps) {
  const { summary, overview, run_rate, budget, latency, efficiency, savings } = report;
  const currency = report.currency;

  const spanMs =
    report.timeseries.length > 1
      ? new Date(report.timeseries[report.timeseries.length - 1].timestamp).getTime() -
        new Date(report.timeseries[0].timestamp).getTime()
      : 0;
  const hourly = spanMs > 0 && spanMs <= 2 * 86400_000;
  const { buckets, size: bucketSize } = bucketSeries(report.timeseries, hourly);
  const peakBucket = buckets.reduce((best, b) => (b.cost > best.cost ? b : best), buckets[0] ?? { cost: 0, label: "" });

  const sortedModels: ModelStats[] = [...report.models].sort((a, b) => b.total_cost - a.total_cost);

  // The header band: the three biggest agents as pills, everything else as one.
  const ranked = [...report.agents]
    .map((a) => ({ name: a.agent_name, share: report.agent_cost_share[a.agent_name] ?? 0 }))
    .sort((a, b) => b.share - a.share);
  const band = ranked.slice(0, 3);
  const restShare = ranked.slice(3).reduce((s, a) => s + a.share, 0);
  if (restShare > 0) band.push({ name: `${ranked.length - 3} more`, share: restShare });
  const bandStyles = [
    { className: "text-[color:var(--rp-on-ink)]", style: { backgroundColor: INK } },
    { className: "text-[color:var(--rp-on-accent)]", style: { backgroundColor: LAVENDER } },
    { className: "", style: { backgroundImage: HATCH } },
    { className: "border border-[color:var(--rp-line-strong)]", style: {} },
  ];

  const savingBlocks = savings.top_suggestions
    .filter((s) => (s.estimated_savings_monthly ?? 0) > 0)
    .sort((a, b) => (b.estimated_savings_monthly ?? 0) - (a.estimated_savings_monthly ?? 0))
    .slice(0, 3);
  const savingBlockTotal = savingBlocks.reduce((s, x) => s + (x.estimated_savings_monthly ?? 0), 0);
  const blockStyles = [
    { backgroundColor: LAVENDER, color: "var(--rp-on-accent)" },
    { backgroundColor: INK, color: "var(--rp-on-ink)" },
    { backgroundColor: "#9a9aa6", color: "#ffffff" },
  ];

  const tokenTotal = efficiency.total_input_tokens + efficiency.total_output_tokens;
  const inputShare = tokenTotal > 0 ? (efficiency.total_input_tokens / tokenTotal) * 100 : 0;
  const latencyMax = Math.max(latency.p99, latency.avg, 1);

  return (
    <div
      data-theme={theme}
      className="report-sheet report-print-root rounded-[32px] p-5 text-[color:var(--rp-ink)] sm:p-8 lg:p-10"
    >
      {/* ── Letterhead ────────────────────────────────────────────────── */}
      <div className="report-section">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Pill className="border-[color:var(--rp-line-strong)] px-5 py-2 text-[15px]">AgentCost</Pill>
          <div className="flex flex-wrap items-center gap-2">
            <Pill className="border-transparent bg-[var(--rp-ink)] text-[color:var(--rp-on-ink)]">{report.range_label}</Pill>
            <Pill>
              {fmtDate(report.period_start)} to {fmtDate(report.period_end)}
            </Pill>
            <Pill>against the previous {run_rate.window_days} days</Pill>
          </div>
        </div>

        <h2 className="mt-10 text-[2.4rem] font-light leading-[1.05] tracking-[-0.035em] sm:text-[3rem]">
          Cost and usage, {report.project_name}
        </h2>
        <p className={cn("mt-2 text-[13px]", MUTED)}>
          Generated {new Date(report.generated_at).toLocaleString()}
        </p>

        <div className="mt-9 flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          {/* Who spent it */}
          {band.length > 0 && (
            <div className="min-w-0 flex-1 basis-[26rem]">
              <div className="flex gap-1.5">
                {band.map((a, i) => (
                  <div key={a.name} className="min-w-[4.75rem]" style={{ flexGrow: Math.max(a.share, 6), flexBasis: 0 }}>
                    <p className="mb-2 truncate pl-1 text-[12.5px]">{a.name}</p>
                    <div
                      className={cn("flex h-12 items-center rounded-full px-4 text-[12.5px] tabular-nums", bandStyles[i].className)}
                      style={bandStyles[i].style}
                    >
                      {a.share.toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
              <p className={cn("mt-2.5 pl-1 text-[12px]", MUTED)}>Share of spend by agent</p>
            </div>
          )}

          {/* The three numbers */}
          <dl className="flex flex-wrap gap-x-10 gap-y-6">
            {[
              { label: "Spend", value: fmtMoney(overview.total_cost, currency), delta: summary.cost, upIsBad: true },
              { label: "Calls", value: formatNumber(overview.total_calls), delta: summary.calls, upIsBad: false },
              { label: "Tokens", value: formatNumber(overview.total_tokens), delta: summary.tokens, upIsBad: false },
            ].map((m) => (
              <div key={m.label}>
                <dd className="text-[3.1rem] font-light leading-none tracking-[-0.045em] tabular-nums sm:text-[3.6rem]">
                  {m.value}
                </dd>
                <dt className="mt-2 flex items-center gap-2 text-[12.5px]">
                  {m.label}
                  <Change delta={m.delta} upIsBad={m.upIsBad} />
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {overview.total_calls === 0 && (
        <div className={cn(CARD, "mt-8")}>
          <p className="text-[14px]">
            No activity recorded in this window. Send events with the AgentCost SDK, then regenerate the report.
          </p>
        </div>
      )}

      {/* ── Run rate, activity, reliability, savings ───────────────────── */}
      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={cn(DARK, "flex flex-col")}>
          <p className="text-[1.3rem] font-normal tracking-[-0.01em]">Run rate</p>
          <p className="mt-6 text-[2.5rem] font-light leading-none tracking-[-0.035em] tabular-nums">
            {fmtMoney(run_rate.projected_monthly_cost, currency)}
          </p>
          <p className={cn("mt-2 text-[12.5px]", ON_CONTRAST_MUTED)}>a month if this window repeats</p>

          <div className="mt-auto pt-10">
            {budget.enabled && budget.budget ? (
              <>
                <div className="flex items-baseline justify-between text-[12.5px]">
                  <span className={ON_CONTRAST_MUTED}>Budget {fmtMoney(budget.budget, currency)}</span>
                  <span className="tabular-nums">
                    {budget.utilization_percent != null ? `${budget.utilization_percent.toFixed(0)}% used` : "no usage yet"}
                  </span>
                </div>
                <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-[var(--rp-contrast-track)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(budget.utilization_percent ?? 0, 100)}%`,
                      backgroundColor: (budget.utilization_percent ?? 0) >= 100 ? "var(--rp-bad)" : "var(--rp-contrast-accent)",
                    }}
                  />
                </div>
                <p className={cn("mt-2.5 text-[12px]", ON_CONTRAST_MUTED)}>
                  {fmtMoney(budget.current_spend, currency)} spent this month, {budget.mode} enforcement
                </p>
              </>
            ) : (
              <span className="inline-flex rounded-full border border-[color:var(--rp-contrast-line)] px-3.5 py-1.5 text-[12.5px]">
                No monthly budget set
              </span>
            )}
          </div>
        </section>

        <section className={CARD}>
          <CardTitle>Spend over time</CardTitle>
          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-[2.1rem] font-light leading-none tracking-[-0.03em] tabular-nums">
              {fmtMoney(run_rate.daily_avg_cost, currency)}
            </p>
            <p className={cn("text-[12px] leading-tight", MUTED)}>
              a day,
              <br />
              on average
            </p>
          </div>
          <div className="mt-7">
            <Capsules
              values={buckets.map((b) => b.cost)}
              labels={sparse(buckets.map((b) => b.label), 4)}
              peakLabel={fmtMoney(peakBucket.cost, currency)}
            />
          </div>
          {bucketSize > 1 && (
            <p className={cn("mt-3 text-[11.5px]", MUTED)}>Each capsule is {bucketSize} days.</p>
          )}
        </section>

        <section className={cn(CARD, "flex flex-col")}>
          <CardTitle>Reliability</CardTitle>
          <div className="my-auto py-5">
            <Dial percent={overview.success_rate} caption="of calls succeeded" />
          </div>
          <div className="flex items-baseline justify-between text-[12.5px]">
            <span className={MUTED}>Against last period</span>
            <Change delta={summary.success_rate} />
          </div>
        </section>

        <section className={cn(CARD, "flex flex-col")}>
          <CardTitle
            aside={
              <span className="text-[2.1rem] font-light leading-none tracking-[-0.03em] tabular-nums">
                {savings.total_potential_savings_percent.toFixed(0)}%
              </span>
            }
          >
            Recoverable
          </CardTitle>
          {savingBlocks.length > 0 ? (
            <div className="mt-6 flex gap-1.5">
              {savingBlocks.map((s, i) => {
                const part = ((s.estimated_savings_monthly ?? 0) / savingBlockTotal) * 100;
                return (
                  <div key={i} className="min-w-[3.25rem]" style={{ flexGrow: part, flexBasis: 0 }}>
                    <p className="mb-1.5 pl-1 text-[11.5px] tabular-nums">{part.toFixed(0)}%</p>
                    <div className="flex h-12 items-center truncate rounded-2xl px-3 text-[12px]" style={blockStyles[i]}>
                      {i === 0 ? "Largest" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={cn("mt-6 text-[13px]", MUTED)}>Nothing to recommend in this window.</p>
          )}
          <div className="mt-auto pt-8">
            <p className="text-[1.7rem] font-light leading-none tracking-[-0.02em] tabular-nums">
              {fmtMoney(savings.total_potential_savings_monthly, currency)}
            </p>
            <p className={cn("mt-1.5 text-[12px]", MUTED)}>
              a month across {savings.suggestion_count} change{savings.suggestion_count === 1 ? "" : "s"},{" "}
              {savings.high_priority_count} of them high priority
            </p>
          </div>
        </section>
      </div>

      {/* ── Models, and what to change ─────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className={CARD}>
          <CardTitle
            aside={
              report.model_pareto.top_count > 0 ? (
                <Pill>
                  top {report.model_pareto.top_count} of {report.model_pareto.total_models} carry{" "}
                  {report.model_pareto.top_share.toFixed(0)}%
                </Pill>
              ) : undefined
            }
          >
            Models
          </CardTitle>
          {sortedModels.length > 0 ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[34rem]">
                <thead>
                  <tr>
                    <th className={TH}>Model</th>
                    <th className={TH}>Share of spend</th>
                    <th className={cn(TH, "text-right")}>Cost</th>
                    <th className={cn(TH, "text-right")}>Per 1K tokens</th>
                    <th className={cn(TH, "text-right")}>Calls</th>
                    <th className={cn(TH, "text-right")}>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModels.map((m, i) => (
                    <tr key={m.model}>
                      <td className={cn(TD, "font-mono text-[13px]")}>{m.model}</td>
                      <td className={TD}>
                        <ShareBar percent={m.cost_share ?? 0} tone={i === 0 ? VIOLET : INK} />
                      </td>
                      <td className={cn(TD, "text-right")}>{fmtMoney(m.total_cost, currency)}</td>
                      <td className={cn(TD, "text-right", MUTED)}>
                        {m.total_tokens > 0 ? fmtMoney((m.total_cost / m.total_tokens) * 1000, currency) : "n/a"}
                      </td>
                      <td className={cn(TD, "text-right")}>{formatNumber(m.total_calls)}</td>
                      <td className={cn(TD, "text-right")}>{formatLatency(m.avg_latency_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={cn("mt-6 text-[13px]", MUTED)}>No model data in this window.</p>
          )}
        </section>

        <section className={cn(DARK, "flex flex-col")}>
          <div className="flex items-start justify-between gap-4">
            <p className="text-[1.3rem] font-normal tracking-[-0.01em]">What to change</p>
            <p className="text-[2.1rem] font-light leading-none tracking-[-0.03em] tabular-nums">
              {savings.top_suggestions.length}
              <span className={ON_CONTRAST_MUTED}>/{savings.suggestion_count}</span>
            </p>
          </div>
          {savings.top_suggestions.length > 0 ? (
            <ol className="mt-6 space-y-4">
              {savings.top_suggestions.map((s, i) => (
                <li key={i} className="flex items-start gap-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--rp-contrast-track)] text-[12px] tabular-nums">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] leading-snug">{s.title}</p>
                    <p className={cn("mt-0.5 text-[12px]", ON_CONTRAST_MUTED)}>
                      {s.agent_name ?? "project-wide"}
                      {s.estimated_savings_monthly != null &&
                        `, ${fmtMoney(s.estimated_savings_monthly, currency)} a month`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className={cn("mt-6 text-[13px]", ON_CONTRAST_MUTED)}>No recommendations in this window.</p>
          )}
          <div className="mt-auto pt-8 print:hidden">
            <Link
              href="/optimizations"
              className="inline-flex rounded-full border border-[color:var(--rp-contrast-line)] px-4 py-2 text-[12.5px] transition-opacity hover:opacity-70"
            >
              Open optimizations
            </Link>
          </div>
        </section>
      </div>

      {/* ── Agents ─────────────────────────────────────────────────────── */}
      <section className={cn(CARD, "mt-4")}>
        <CardTitle>Agents</CardTitle>
        {report.agents.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[38rem]">
              <thead>
                <tr>
                  <th className={TH}>Agent</th>
                  <th className={TH}>Share of spend</th>
                  <th className={cn(TH, "text-right")}>Cost</th>
                  <th className={cn(TH, "text-right")}>Calls</th>
                  <th className={cn(TH, "text-right")}>Tokens</th>
                  <th className={cn(TH, "text-right")}>Latency</th>
                  <th className={cn(TH, "text-right")}>Success</th>
                </tr>
              </thead>
              <tbody>
                {report.agents.map((a, i) => (
                  <tr key={a.agent_name}>
                    <td className={TD}>{a.agent_name}</td>
                    <td className={TD}>
                      <ShareBar percent={report.agent_cost_share[a.agent_name] ?? 0} tone={i === 0 ? VIOLET : INK} />
                    </td>
                    <td className={cn(TD, "text-right")}>{fmtMoney(a.total_cost, currency)}</td>
                    <td className={cn(TD, "text-right")}>{formatNumber(a.total_calls)}</td>
                    <td className={cn(TD, "text-right")}>{formatNumber(a.total_tokens)}</td>
                    <td className={cn(TD, "text-right")}>{formatLatency(a.avg_latency_ms)}</td>
                    <td className={cn(TD, "text-right", a.success_rate < 97 && "text-[color:var(--rp-bad)]")}>
                      {formatPercentage(a.success_rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={cn("mt-6 text-[13px]", MUTED)}>No agent data in this window.</p>
        )}
      </section>

      {/* ── Latency and tokens ─────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={CARD}>
          <CardTitle
            aside={
              <Pill>
                {formatNumber(latency.sample_size)} calls{latency.approximate ? ", sampled" : ""}
              </Pill>
            }
          >
            Latency
          </CardTitle>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Figure label="Median" value={formatLatency(latency.p50)} />
            <Figure label="p95" value={formatLatency(latency.p95)} />
            <Figure label="p99" value={formatLatency(latency.p99)} />
            <Figure label="Average" value={formatLatency(latency.avg)} sub={<Change delta={summary.avg_latency_ms} upIsBad />} />
          </div>
          {/* Where the percentiles sit against the slowest of them */}
          <div className="relative mt-9 h-3 rounded-full bg-[var(--rp-track)]">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: `${(latency.p95 / latencyMax) * 100}%`, backgroundImage: HATCH }}
            />
            <span
              className="absolute inset-y-0 left-0 rounded-full bg-[var(--rp-ink)]"
              style={{ width: `${(latency.p50 / latencyMax) * 100}%` }}
            />
            <span
              className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[color:var(--rp-marker-ring)]"
              style={{ left: `${(latency.p99 / latencyMax) * 100}%`, backgroundColor: VIOLET }}
            />
          </div>
          <p className={cn("mt-3 text-[11.5px]", MUTED)}>
            Solid to the median, hatched to p95, the marker at p99.
          </p>
        </section>

        <section className={CARD}>
          <CardTitle aside={<Pill>{efficiency.in_out_ratio.toFixed(2)} in to 1 out</Pill>}>Tokens</CardTitle>
          <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Figure label="Per 1K tokens" value={fmtMoney(efficiency.blended_cost_per_1k, currency)} sub="blended" />
            <Figure label="Input" value={formatNumber(efficiency.total_input_tokens)} />
            <Figure label="Output" value={formatNumber(efficiency.total_output_tokens)} />
          </div>
          <div className="mt-9 flex h-12 gap-1.5">
            <div
              className="flex min-w-[4.5rem] items-center rounded-full bg-[var(--rp-ink)] px-4 text-[12.5px] tabular-nums text-[color:var(--rp-on-ink)]"
              style={{ flexGrow: Math.max(inputShare, 8), flexBasis: 0 }}
            >
              {inputShare.toFixed(0)}% in
            </div>
            <div
              className="flex min-w-[4.5rem] items-center rounded-full px-4 text-[12.5px] tabular-nums text-[color:var(--rp-on-accent)]"
              style={{ flexGrow: Math.max(100 - inputShare, 8), flexBasis: 0, backgroundColor: LAVENDER }}
            >
              {(100 - inputShare).toFixed(0)}% out
            </div>
          </div>
        </section>
      </div>

      {/* ── Failures ───────────────────────────────────────────────────── */}
      <section className={cn(CARD, "mt-4")}>
        <CardTitle>Failures</CardTitle>
        <div className="mt-5 grid grid-cols-1 gap-x-12 gap-y-8 lg:grid-cols-2">
          {report.errors.length > 0 ? (
            <table className="w-full self-start">
              <thead>
                <tr>
                  <th className={TH}>Model</th>
                  <th className={cn(TH, "text-right")}>Calls</th>
                  <th className={cn(TH, "text-right")}>Failed</th>
                  <th className={cn(TH, "text-right")}>Rate</th>
                </tr>
              </thead>
              <tbody>
                {report.errors.map((e) => (
                  <tr key={e.model}>
                    <td className={cn(TD, "font-mono text-[13px]")}>{e.model}</td>
                    <td className={cn(TD, "text-right")}>{formatNumber(e.total_calls)}</td>
                    <td className={cn(TD, "text-right")}>{formatNumber(e.error_count)}</td>
                    <td className={cn(TD, "text-right", e.error_rate >= 5 ? "text-[color:var(--rp-bad)]" : e.error_rate < 1 && MUTED)}>
                      {e.error_rate.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={cn("text-[13px]", MUTED)}>No model data in this window.</p>
          )}

          <div>
            <p className={cn("pb-3 text-[12px]", MUTED)}>Most frequent errors</p>
            {report.top_errors.length > 0 ? (
              <ul>
                {report.top_errors.map((e, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-6 border-t border-[color:var(--rp-hair)] py-3 text-[13.5px]">
                    <span className="min-w-0 flex-1 truncate">{e.error}</span>
                    <span className={cn("shrink-0 tabular-nums", MUTED)}>{formatNumber(e.count)} times</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-[color:var(--rp-hair)] py-3 text-[13.5px] text-[color:var(--rp-good)]">
                No failures recorded in this window.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── When the agents run ────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)]">
        <section className={CARD}>
          <CardTitle>By day of week</CardTitle>
          <div className="mt-8">
            <Capsules
              values={report.cadence.by_dow.map((b) => b.calls)}
              labels={report.cadence.by_dow.map((b) => b.label.slice(0, 1))}
              peakLabel={`${report.cadence.busiest_day ?? "Busiest"}, ${formatNumber(Math.max(...report.cadence.by_dow.map((b) => b.calls), 0))} calls`}
              tall
            />
          </div>
        </section>
        <section className={CARD}>
          <CardTitle aside={<Pill>UTC</Pill>}>By hour of day</CardTitle>
          <div className="mt-8">
            <Capsules
              values={report.cadence.by_hour.map((b) => b.calls)}
              labels={sparse(report.cadence.by_hour.map((b) => b.label), 6)}
              peakLabel={`${report.cadence.busiest_hour ?? "Busiest"}, ${formatNumber(Math.max(...report.cadence.by_hour.map((b) => b.calls), 0))} calls`}
              tall
            />
          </div>
        </section>
      </div>

      {/* Print footer */}
      <p className={cn("report-section mt-6 hidden text-center text-[11px] print:block", MUTED)}>
        Generated by AgentCost · {report.project_name} · {report.range_label}
      </p>
    </div>
  );
}
