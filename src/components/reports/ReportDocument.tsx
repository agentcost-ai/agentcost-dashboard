"use client";

import Link from "next/link";
import {
  DollarSign,
  Activity,
  Zap,
  Gauge,
  Timer,
  TrendingUp,
  Cpu,
  Crown,
  AlertTriangle,
  CalendarClock,
  PiggyBank,
  Scale,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { HeroStatCard, type Delta } from "@/components/dashboard/HeroStatCard";
import { MainTimeSeriesChart } from "@/components/charts/MainTimeSeriesChart";
import { ModelDonut } from "@/components/charts/ModelDonut";
import { DeltaBadge } from "./DeltaBadge";
import { CadenceBars } from "./CadenceBars";
import {
  formatCurrency,
  formatNumber,
  formatLatency,
  formatPercentage,
} from "@/lib/utils";
import type {
  ExecutiveReport,
  MetricDelta,
  ModelStats,
} from "@/lib/api";

/** Map the backend MetricDelta onto HeroStatCard's Delta shape. */
function toHeroDelta(d: MetricDelta): Delta {
  return { value: Math.abs(d.change_percent), direction: d.direction };
}

function fmtMoney(value: number, currency: string): string {
  if (currency === "USD") return formatCurrency(value);
  const symbol = currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SectionHeading({
  icon,
  title,
  subtitle,
  iconClass,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  iconClass: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-2.5">
      <div
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-[15px] font-semibold tracking-tight text-white">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[12.5px] text-neutral-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function errorBadgeVariant(rate: number): "success" | "warning" | "error" {
  if (rate >= 5) return "error";
  if (rate >= 1) return "warning";
  return "success";
}

interface ReportDocumentProps {
  report: ExecutiveReport;
}

export function ReportDocument({ report }: ReportDocumentProps) {
  const { summary, overview, run_rate, budget, latency, efficiency } = report;
  const currency = report.currency;

  const spanMs =
    report.timeseries.length > 1
      ? new Date(report.timeseries[report.timeseries.length - 1].timestamp).getTime() -
        new Date(report.timeseries[0].timestamp).getTime()
      : 0;
  const chartRange = spanMs > 0 && spanMs <= 2 * 86400_000 ? "24h" : "30d";

  const sortedModels: ModelStats[] = [...report.models].sort(
    (a, b) => b.total_cost - a.total_cost,
  );

  return (
    <div className="report-print-root space-y-6">
      {/* ── Printable document header ─────────────────────────────────── */}
      <div className="report-section flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-sky-400">
            AgentCost — Executive Report
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            Cost &amp; Usage Report
          </h2>
          <p className="mt-1 text-sm text-neutral-400">
            {report.project_name}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-neutral-500">
            <span className="flex items-center gap-1.5">
              Spend <DeltaBadge delta={summary.cost} upIsBad />
            </span>
            <span className="flex items-center gap-1.5">
              Calls <DeltaBadge delta={summary.calls} />
            </span>
            <span className="flex items-center gap-1.5">
              Tokens <DeltaBadge delta={summary.tokens} />
            </span>
            <span className="flex items-center gap-1.5">
              Success <DeltaBadge delta={summary.success_rate} />
            </span>
          </div>
        </div>
        <div className="text-right text-[12.5px] text-neutral-500">
          <p className="text-neutral-300">
            {report.range_label} · {fmtDate(report.period_start)} –{" "}
            {fmtDate(report.period_end)}
          </p>
          <p>Generated {new Date(report.generated_at).toLocaleString()}</p>
          <p className="mt-0.5">
            Compared to previous {run_rate.window_days}-day window
          </p>
        </div>
      </div>

      {overview.total_calls === 0 && (
        <Card className="report-section border-amber-900/40 bg-amber-950/10">
          <p className="text-sm text-amber-300">
            No activity recorded in this window. Send events with the AgentCost
            SDK, then regenerate the report.
          </p>
        </Card>
      )}

      {/* ── Executive summary band ────────────────────────────────────── */}
      <div className="report-section grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <HeroStatCard
          label="Total Spend"
          value={fmtMoney(overview.total_cost, currency)}
          sub={`${fmtMoney(overview.avg_cost_per_call, currency)} / call`}
          icon={<DollarSign size={15} />}
          iconClassName="bg-sky-500/10 text-sky-400"
          delta={toHeroDelta(summary.cost)}
          upIsBad
          sparkline={{ data: report.timeseries.map((p) => p.cost), color: "#38bdf8" }}
        />
        <HeroStatCard
          label="API Calls"
          value={formatNumber(overview.total_calls)}
          sub={`${formatNumber(overview.avg_tokens_per_call)} tok / call`}
          icon={<Activity size={15} />}
          iconClassName="bg-violet-500/10 text-violet-400"
          delta={toHeroDelta(summary.calls)}
          sparkline={{ data: report.timeseries.map((p) => p.calls), color: "#a78bfa" }}
        />
        <HeroStatCard
          label="Tokens"
          value={formatNumber(overview.total_tokens)}
          sub={`${formatNumber(overview.total_input_tokens)} in · ${formatNumber(overview.total_output_tokens)} out`}
          icon={<Zap size={15} />}
          iconClassName="bg-amber-500/10 text-amber-400"
          delta={toHeroDelta(summary.tokens)}
          sparkline={{ data: report.timeseries.map((p) => p.tokens), color: "#fbbf24" }}
        />
        <HeroStatCard
          label="Success Rate"
          value={formatPercentage(overview.success_rate)}
          sub={`${formatPercentage(100 - overview.success_rate)} error rate`}
          icon={<Gauge size={15} />}
          iconClassName="bg-emerald-500/10 text-emerald-400"
          delta={toHeroDelta(summary.success_rate)}
        />
        <HeroStatCard
          label="Avg Latency"
          value={formatLatency(overview.avg_latency_ms)}
          sub={`p95 ${formatLatency(latency.p95)}`}
          icon={<Timer size={15} />}
          iconClassName="bg-rose-500/10 text-rose-400"
          delta={toHeroDelta(summary.avg_latency_ms)}
          upIsBad
        />
        <HeroStatCard
          label="Projected / mo"
          value={fmtMoney(run_rate.projected_monthly_cost, currency)}
          sub="At current run rate"
          icon={<TrendingUp size={15} />}
          iconClassName="bg-indigo-500/10 text-indigo-400"
        />
      </div>

      {/* ── Spend trend ───────────────────────────────────────────────── */}
      <Card className="report-section">
        <SectionHeading
          icon={<Activity size={14} />}
          title="Activity Over Time"
          subtitle="Spend, calls and tokens across the period"
          iconClass="bg-sky-500/10 text-sky-400"
        />
        {report.timeseries.length > 0 ? (
          <MainTimeSeriesChart data={report.timeseries} range={chartRange} />
        ) : (
          <div className="flex h-48 items-center justify-center text-neutral-500">
            No data available
          </div>
        )}
      </Card>

      {/* ── Budget status ─────────────────────────────────────────────── */}
      <Card className="report-section">
        <SectionHeading
          icon={<PiggyBank size={14} />}
          title="Budget Status"
          subtitle={
            budget.enabled
              ? `Monthly budget · ${budget.mode} enforcement`
              : "No monthly budget configured"
          }
          iconClass="bg-emerald-500/10 text-emerald-400"
        />
        {budget.enabled && budget.budget ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Budget" value={fmtMoney(budget.budget, currency)} />
              <Stat
                label="Spent (MTD)"
                value={fmtMoney(budget.current_spend, currency)}
              />
              <Stat
                label="Projected"
                value={fmtMoney(budget.projected_spend, currency)}
              />
              <Stat
                label="Utilization"
                value={
                  budget.utilization_percent != null
                    ? `${budget.utilization_percent.toFixed(1)}%`
                    : "—"
                }
              />
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className={`h-full rounded-full ${
                  (budget.utilization_percent ?? 0) >= 100
                    ? "bg-red-500"
                    : (budget.utilization_percent ?? 0) >= 80
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{
                  width: `${Math.min(budget.utilization_percent ?? 0, 100)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Set a monthly budget in Settings to track utilization and get alerts.
          </p>
        )}
      </Card>

      {/* ── Cost concentration ────────────────────────────────────────── */}
      <Card className="report-section">
        <SectionHeading
          icon={<Cpu size={14} />}
          title="Cost Concentration by Model"
          iconClass="bg-violet-500/10 text-violet-400"
        />
        {report.models.length > 0 ? (
          <>
            <ModelDonut data={report.models} />
            {report.model_pareto.top_count > 0 && (
              <p className="mt-4 rounded-lg border border-white/6 bg-white/2 px-4 py-3 text-[13px] text-neutral-300">
                <span className="font-semibold text-white">
                  Top {report.model_pareto.top_count} of{" "}
                  {report.model_pareto.total_models}
                </span>{" "}
                {report.model_pareto.total_models === 1 ? "model" : "models"}{" "}
                drive{" "}
                <span className="font-semibold text-white">
                  {report.model_pareto.top_share.toFixed(1)}%
                </span>{" "}
                of total spend.
              </p>
            )}
          </>
        ) : (
          <div className="flex h-40 items-center justify-center text-neutral-500">
            No model data available
          </div>
        )}
      </Card>

      {/* ── Model breakdown ───────────────────────────────────────────── */}
      <Card padding="none" className="report-section">
        <div className="border-b border-white/6 px-6 py-4">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            Model Breakdown
          </h3>
          <p className="mt-0.5 text-[12.5px] text-neutral-500">
            Ranked by spend · cost efficiency per model
          </p>
        </div>
        {sortedModels.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="w-44">Cost Share</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Cost / 1K</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedModels.map((m) => {
                const modelShare = m.cost_share ?? 0;
                return (
                <TableRow key={m.model}>
                  <TableCell className="font-mono font-medium text-white">
                    {m.model}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-violet-500"
                          style={{ width: `${modelShare}%` }}
                        />
                      </div>
                      <span className="text-[11.5px] tabular-nums text-neutral-500">
                        {modelShare.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-white">
                    {fmtMoney(m.total_cost, currency)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-neutral-400">
                    {m.total_tokens > 0
                      ? fmtMoney((m.total_cost / m.total_tokens) * 1000, currency)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-neutral-300">
                    {formatNumber(m.total_calls)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-neutral-300">
                    {formatLatency(m.avg_latency_ms)}
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-32 items-center justify-center text-neutral-500">
            No model data
          </div>
        )}
      </Card>

      {/* ── Agent breakdown ───────────────────────────────────────────── */}
      <Card padding="none" className="report-section">
        <div className="border-b border-white/6 px-6 py-4">
          <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
            <Crown size={15} className="text-amber-400" /> Agent Breakdown
          </h3>
          <p className="mt-0.5 text-[12.5px] text-neutral-500">
            Spend, throughput and reliability per agent
          </p>
        </div>
        {report.agents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead className="w-44">Cost Share</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Success</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.agents.map((a) => {
                const share = report.agent_cost_share[a.agent_name] ?? 0;
                return (
                  <TableRow key={a.agent_name}>
                    <TableCell className="font-medium text-white">
                      {a.agent_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-amber-500"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-[11.5px] tabular-nums text-neutral-500">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">
                      {fmtMoney(a.total_cost, currency)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatNumber(a.total_calls)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatNumber(a.total_tokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatLatency(a.avg_latency_ms)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatPercentage(a.success_rate)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-32 items-center justify-center text-neutral-500">
            No agent data
          </div>
        )}
      </Card>

      {/* ── Latency + efficiency ──────────────────────────────────────── */}
      <div className="report-section grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionHeading
            icon={<Timer size={14} />}
            title="Latency Percentiles"
            subtitle={`${formatNumber(latency.sample_size)} calls${latency.approximate ? " · sampled" : ""}`}
            iconClass="bg-rose-500/10 text-rose-400"
          />
          <div className="grid grid-cols-4 gap-3">
            <Stat label="p50" value={formatLatency(latency.p50)} />
            <Stat label="p95" value={formatLatency(latency.p95)} />
            <Stat label="p99" value={formatLatency(latency.p99)} />
            <Stat label="avg" value={formatLatency(latency.avg)} />
          </div>
        </Card>
        <Card>
          <SectionHeading
            icon={<Scale size={14} />}
            title="Token Efficiency"
            subtitle="Blended cost and token shape"
            iconClass="bg-sky-500/10 text-sky-400"
          />
          <div className="grid grid-cols-2 gap-3">
            <Stat
              label="Cost / 1K tokens"
              value={fmtMoney(efficiency.blended_cost_per_1k, currency)}
            />
            <Stat
              label="Input : Output"
              value={`${efficiency.in_out_ratio.toFixed(2)} : 1`}
            />
            <Stat
              label="Input tokens"
              value={formatNumber(efficiency.total_input_tokens)}
            />
            <Stat
              label="Output tokens"
              value={formatNumber(efficiency.total_output_tokens)}
            />
          </div>
        </Card>
      </div>

      {/* ── Reliability / errors ──────────────────────────────────────── */}
      <Card className="report-section">
        <SectionHeading
          icon={<AlertTriangle size={14} />}
          title="Reliability"
          subtitle="Failure rate by model and most frequent errors"
          iconClass="bg-red-500/10 text-red-400"
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            {report.errors.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Errors</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.errors.map((e) => (
                    <TableRow key={e.model}>
                      <TableCell className="font-mono text-neutral-200">
                        {e.model}
                      </TableCell>
                      <TableCell className="text-right font-mono text-neutral-300">
                        {formatNumber(e.total_calls)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-neutral-300">
                        {formatNumber(e.error_count)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={errorBadgeVariant(e.error_rate)}>
                          {e.error_rate.toFixed(2)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-neutral-500">No model data.</p>
            )}
          </div>
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
              Top errors
            </p>
            {report.top_errors.length > 0 ? (
              <ul className="space-y-2">
                {report.top_errors.map((e, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg border border-white/6 bg-white/2 px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-[12.5px] text-neutral-300">
                      {e.error}
                    </span>
                    <span className="shrink-0 font-mono text-[12px] text-neutral-400">
                      ×{formatNumber(e.count)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-400">
                No failures recorded in this window.
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* ── Usage cadence ─────────────────────────────────────────────── */}
      <Card className="report-section">
        <SectionHeading
          icon={<CalendarClock size={14} />}
          title="Usage Cadence"
          subtitle={
            report.cadence.busiest_day
              ? `Busiest day: ${report.cadence.busiest_day} · Busiest hour: ${report.cadence.busiest_hour}`
              : "When your agents are most active"
          }
          iconClass="bg-indigo-500/10 text-indigo-400"
        />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
              By day of week
            </p>
            <CadenceBars
              data={report.cadence.by_dow}
              busiestLabel={report.cadence.busiest_day}
              color="bg-indigo-500"
            />
          </div>
          <div>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-500">
              By hour of day (UTC)
            </p>
            <CadenceBars
              data={report.cadence.by_hour}
              busiestLabel={report.cadence.busiest_hour}
              color="bg-sky-500"
              labelWidth="w-12"
            />
          </div>
        </div>
      </Card>

      {/* ── Savings rollup ────────────────────────────────────────────── */}
      <Card className="report-section">
        <SectionHeading
          icon={<PiggyBank size={14} />}
          title="Optimization Savings"
          subtitle={`${report.savings.suggestion_count} opportunities · ${report.savings.high_priority_count} high priority`}
          iconClass="bg-emerald-500/10 text-emerald-400"
        />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[2rem] font-semibold leading-none tracking-tight text-emerald-400 tabular-nums">
              {fmtMoney(report.savings.total_potential_savings_monthly, currency)}
            </p>
            <p className="mt-1.5 text-[13px] text-neutral-400">
              estimated potential savings / month ·{" "}
              {report.savings.total_potential_savings_percent.toFixed(1)}% of spend
            </p>
          </div>
          <Link
            href="/optimizations"
            className="rounded-lg border border-white/10 px-4 py-2 text-[13px] font-medium text-neutral-200 transition-colors hover:border-white/20 hover:text-white"
          >
            View optimizations →
          </Link>
        </div>
        {report.savings.top_suggestions.length > 0 && (
          <ul className="mt-5 space-y-2">
            {report.savings.top_suggestions.map((s, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-4 rounded-lg border border-white/6 bg-white/2 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-medium text-white">
                    {s.title}
                  </p>
                  {s.agent_name && (
                    <p className="text-[11.5px] text-neutral-500">
                      {s.agent_name}
                    </p>
                  )}
                </div>
                {s.estimated_savings_monthly != null && (
                  <span className="shrink-0 font-mono text-[13px] text-emerald-400">
                    {fmtMoney(s.estimated_savings_monthly, currency)}/mo
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Print footer */}
      <p className="report-section hidden text-center text-[11px] text-neutral-500 print:block">
        Generated by AgentCost · {report.project_name} · {report.range_label}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/6 bg-white/2 px-3 py-2.5">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-[15px] font-semibold tabular-nums text-white">
        {value}
      </p>
    </div>
  );
}
