"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatBand, SectionCard } from "@/components/ui/Panels";
import {
  api,
  type AgentDetail,
  type DimensionStat,
  type OptimizationSuggestion,
} from "@/lib/api";
import { formatCurrency, formatNumber, formatLatency, cn } from "@/lib/utils";
import { ACCENT, CHART_CHROME, TOOLTIP_CONTENT_STYLE } from "@/lib/palette";
import { useApiConfiguration, OnboardingScreen, LoadingSpinner } from "@/hooks/useApiConfiguration";

/* ─────────────────────────────────────────────
   One agent, read top to bottom: what it cost
   and how that changed, where the money went,
   what was wasted, what the guardrail saw, the
   runs, and what to do.
   ───────────────────────────────────────────── */

function usd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
function small(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return usd(n, n < 0.01 ? 4 : 3);
}
function pct(part: number, whole: number): string {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "—";
}
function ago(iso: string | null): string {
  if (!iso) return "—";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
function dayLabel(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" });
}
function stamp(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
function axisUsd(v: number): string {
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  if (v >= 10) return `$${v.toFixed(0)}`;
  return v === 0 ? "$0" : `$${v.toFixed(v >= 1 ? 1 : 2)}`;
}

/* ── Chart ─────────────────────────────────────────────────────────── */

type DayPoint = { day: string; label: string; cost: number; calls: number; flagged: boolean };

function DayTooltip({ active, payload }: { active?: boolean; payload?: { payload?: DayPoint }[] }) {
  const p = payload?.[0]?.payload;
  if (!active || !p) return null;
  return (
    <div style={TOOLTIP_CONTENT_STYLE} className="px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">{p.label}</p>
      <p className="mt-1 text-[13px] font-semibold tabular-nums text-white">{formatCurrency(p.cost)}</p>
      <p className="text-[12px] tabular-nums text-neutral-400">{formatNumber(p.calls)} calls</p>
    </div>
  );
}

function SpendByDay({ points, mean }: { points: DayPoint[]; mean: number }) {
  if (points.length === 0) {
    return <div className="flex h-56 items-center justify-center text-sm text-neutral-500">No spend in this window</div>;
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 12, right: 36, left: 0, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={CHART_CHROME.grid} strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_CHROME.axisTick, fontSize: 11 }}
            interval={points.length > 16 ? Math.ceil(points.length / 8) - 1 : 0}
            dy={6}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_CHROME.axisTick, fontSize: 11 }}
            tickFormatter={axisUsd}
            width={48}
          />
          <Tooltip content={<DayTooltip />} cursor={{ fill: CHART_CHROME.cursorFill }} />
          {mean > 0 && (
            <ReferenceLine
              y={mean}
              stroke={CHART_CHROME.referenceLine}
              strokeDasharray="4 4"
              label={{ value: "avg", position: "right", fill: CHART_CHROME.referenceLabel, fontSize: 10 }}
            />
          )}
          <Bar dataKey="cost" radius={[3, 3, 0, 0]} maxBarSize={44}>
            {points.map((p) => (
              <Cell key={p.day} fill={p.flagged ? ACCENT : "#52525b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── Ledger primitives ────────────────────────────────────────────── */

function Column({ title, sub, rows, total, empty, keyLabel }: { title: string; sub?: string; rows: DimensionStat[]; total: number; empty: string; keyLabel?: (k: string) => string }) {
  return (
    <div className="min-w-0 px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold text-white">{title}</h3>
        {sub && <span className="text-[12px] text-neutral-500">{sub}</span>}
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-500">{empty}</p>
      ) : (
        <div className="mt-2">
          {rows.map((r) => (
            <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_5rem_3.25rem] items-baseline gap-3 border-b border-white/5 py-2.5 text-[13px] last:border-0">
              <span className="min-w-0">
                <span className="block truncate font-medium text-neutral-100">{keyLabel ? keyLabel(r.key) : r.key}</span>
                <span className="block text-[12px] text-neutral-500">{formatNumber(r.total_calls)} calls</span>
              </span>
              <span className="text-right tabular-nums text-neutral-200">{formatCurrency(r.total_cost)}</span>
              <span className="text-right text-[12px] tabular-nums text-neutral-500">{pct(r.total_cost, total)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, sub, value, note, tone }: { label: string; sub?: string; value: string; note?: string; tone?: "bad" | "good" | "accent" }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_6rem_4rem] items-baseline gap-3 border-b border-white/5 py-2.5 text-[13px] last:border-0">
      <span className="min-w-0">
        <span className="block font-medium text-neutral-100">{label}</span>
        {sub && <span className="block text-[12px] leading-snug text-neutral-500">{sub}</span>}
      </span>
      <span className={cn("text-right tabular-nums", tone === "bad" ? "text-red-300" : tone === "good" ? "text-emerald-300" : tone === "accent" ? "text-indigo-300" : "text-neutral-200")}>
        {value}
      </span>
      <span className="text-right text-[12px] tabular-nums text-neutral-500">{note ?? ""}</span>
    </div>
  );
}

function Policy({ label, policy, observed, ok }: { label: string; policy: string; observed: string; ok: boolean }) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_3.5rem] items-baseline gap-3 border-b border-white/5 py-2.5 text-[13px] last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="min-w-0 truncate text-neutral-300">{policy}</span>
      <span className="min-w-0 truncate font-medium text-neutral-100">{observed}</span>
      <span className={cn("text-right text-[12px]", ok ? "text-emerald-300" : "text-red-300")}>{ok ? "ok" : "breach"}</span>
    </div>
  );
}

const TH = "text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500";

/* ── Page ─────────────────────────────────────────────────────────── */

export default function AgentPage() {
  const params = useParams<{ name: string }>();
  const agentName = decodeURIComponent(params.name);
  const { isConfigured } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<AgentDetail | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!api.hasProjectAccess()) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [d, opts] = await Promise.all([
          api.getAgentDetail(agentName, timeRange),
          api.getOptimizations().catch(() => [] as OptimizationSuggestion[]),
        ]);
        setDetail(d && d.summary ? d : null);
        setSuggestions((Array.isArray(opts) ? opts : []).filter((o) => o.agent_name === agentName));
        setShowOnboarding(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch data";
        if (message.includes("401") || message.includes("Invalid API key")) {
          setShowOnboarding(true);
          setError(null);
        } else if (message.includes("404") || message.includes("No events")) {
          setDetail(null);
          setError(null);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [agentName, timeRange]);

  const derived = useMemo(() => {
    if (!detail) return null;
    const s = detail.summary;
    const wasted = s.repeated_cost + s.failed_cost;
    // Flag the day that carries the repeated work, when it stands out.
    let flaggedDay: string | null = null;
    if (s.signal.kind === "repeated_work" && s.daily.length > 2) {
      const sorted = [...s.daily].sort((a, b) => b.cost - a.cost);
      const rest = sorted.slice(1);
      const mean = rest.reduce((x, p) => x + p.cost, 0) / rest.length;
      if (sorted[0].cost > mean * 1.35) flaggedDay = sorted[0].day;
    }
    const others = s.daily.filter((p) => p.day !== flaggedDay);
    const dayMean = others.length ? others.reduce((x, p) => x + p.cost, 0) / others.length : 0;
    const flagged = s.daily.find((p) => p.day === flaggedDay) ?? null;
    const points: DayPoint[] = s.daily.map((p) => ({ day: p.day, label: dayLabel(p.day), cost: p.cost, calls: p.calls, flagged: p.day === flaggedDay }));
    const loopStep = detail.steps.find((st) => st.max_calls_per_run > Math.ceil(st.calls_per_run) + 1);
    const c = detail.compliance;
    const breaches = c?.status === "breach" ? c.breaches.reduce((x, b) => x + b.count, 0) : 0;
    const kinds = new Set((c?.breaches ?? []).map((b) => b.kind));
    return { wasted, flaggedDay, flagged, dayMean, points, loopStep, breaches, kinds };
  }, [detail]);

  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  const header = (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <Link href="/agents" className="inline-flex items-center gap-1 text-[12.5px] text-neutral-500 transition-colors hover:text-neutral-200">
          <ArrowLeft size={13} /> Agents
        </Link>
        <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight text-white">{agentName}</h1>
        {detail && (
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-neutral-500">
            <span>
              {detail.summary.models.map((m, i) => (
                <span key={m.model}>
                  {i > 0 && " · "}
                  <span className="text-neutral-300">{m.model}</span> {pct(m.cost, detail.summary.total_cost)}
                </span>
              ))}
            </span>
            {detail.by_workflow[0] && (
              <span>
                workflow <span className="text-neutral-300">{detail.by_workflow[0].key}</span>
              </span>
            )}
            <span>
              first seen{" "}
              <span className="text-neutral-300">
                {detail.summary.first_seen ? new Date(detail.summary.first_seen).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
              </span>
            </span>
            <span>
              last call <span className="text-neutral-300">{ago(detail.summary.last_seen)}</span>
            </span>
            {detail.compliance && detail.compliance.status !== "no_guardrail" && (
              <span className={cn("inline-flex items-center gap-1.5", detail.compliance.status === "breach" ? "text-red-300" : "text-emerald-300")}>
                <span className={cn("size-1.5 rounded-full", detail.compliance.status === "breach" ? "bg-red-400" : "bg-emerald-400")} aria-hidden />
                {detail.compliance.status === "breach" ? `${derived?.breaches} guardrail breach${derived?.breaches === 1 ? "" : "es"}` : "Guardrail compliant"}
              </span>
            )}
          </p>
        )}
      </div>
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-white/8 p-6">
          <TableSkeleton rows={8} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">{error}</div>
      </div>
    );
  }

  if (!detail || !derived) {
    return (
      <div className="space-y-6">
        {header}
        <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-white/8 text-sm text-neutral-500">
          <p>No calls from this agent in the selected window.</p>
          <p className="text-[12.5px]">Try a longer range, or check the agent name in your SDK config.</p>
        </div>
      </div>
    );
  }

  const s = detail.summary;
  const c = detail.compliance;
  const dist = detail.distribution;
  const hasPolicy = !!c && c.status !== "no_guardrail";

  return (
    <div className="space-y-6">
      {header}

      <StatBand
        items={[
          {
            label: "Spend",
            value: (
              <>
                {formatCurrency(s.total_cost)}
                {s.cost_change_percent !== null && (
                  <span className="ml-2 text-[13px] font-medium text-neutral-400">
                    {s.cost_change_percent > 0 ? "+" : ""}
                    {s.cost_change_percent.toFixed(1)}%
                  </span>
                )}
              </>
            ),
            sub: `${s.share_percent.toFixed(1)}% of the project`,
          },
          {
            label: "Cost / run",
            value: small(s.cost_per_run),
            sub: s.runs > 0 ? `${formatNumber(s.runs)} runs · ${s.calls_per_run} calls each` : "untraced",
          },
          {
            label: "Cost / success",
            value: small(detail.outcomes?.cost_per_success),
            sub: detail.outcomes
              ? `${formatNumber(detail.outcomes.failed)} failed run${detail.outcomes.failed === 1 ? "" : "s"} paid for`
              : "declare outcomes to see this",
          },
          {
            label: "Wasted",
            value: formatCurrency(derived.wasted),
            sub: `${pct(derived.wasted, s.total_cost)} of spend`,
          },
          {
            label: "Cache",
            value: s.cached_share !== null ? `${Math.round(s.cached_share)}%` : "—",
            sub: s.cached_share !== null ? <span className="text-emerald-300/80">{formatCurrency(s.cache_savings)} saved</span> : "no cached input seen",
          },
          {
            label: "Latency",
            value: (
              <>
                {formatLatency(detail.latency.p95)}
                <span className="ml-1.5 text-[12px] font-medium text-neutral-500">p95</span>
              </>
            ),
            sub: `p50 ${formatLatency(detail.latency.p50)} · p99 ${formatLatency(detail.latency.p99)}`,
          },
        ]}
      />

      {/* Spend over time and what was wasted */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <SectionCard
          title="Spend by day"
          description={
            derived.flagged
              ? `${dayLabel(derived.flagged.day)} is ${formatCurrency(derived.flagged.cost - derived.dayMean)} above the average of the other days${derived.loopStep ? `; ${derived.loopStep.step_name} ran up to ${derived.loopStep.max_calls_per_run} times in one run` : ""}.`
              : `Average ${formatCurrency(derived.dayMean)} a day.`
          }
        >
          <div className="px-3 pb-3 pt-4">
            <SpendByDay points={derived.points} mean={derived.dayMean} />
          </div>
        </SectionCard>

        <SectionCard title="Wasted" description="Spend that bought nothing, and the runs worth bounding.">
          <div className="px-5 py-1">
            <Row
              label="Repeated identical calls"
              sub={s.repeated_runs > 0 ? `same input inside one run · ${formatNumber(s.repeated_runs)} runs` : "none found"}
              value={formatCurrency(s.repeated_cost)}
              note={pct(s.repeated_cost, s.total_cost)}
              tone={s.signal.kind === "repeated_work" ? "accent" : undefined}
            />
            <Row
              label="Failed calls that still billed"
              sub={s.failed_calls > 0 ? `${formatNumber(s.failed_calls)} calls` : "none"}
              value={formatCurrency(s.failed_cost)}
              note={pct(s.failed_cost, s.total_cost)}
              tone={s.signal.kind === "failed_spend" ? "bad" : undefined}
            />
            <Row
              label="Tail runs"
              sub={dist ? `the most expensive 5% · ${formatNumber(dist.tail_runs)} runs · p95 ${small(dist.p95)}` : "needs traced runs"}
              value={dist ? formatCurrency(detail.tail_cost) : "—"}
              note={dist ? `${dist.tail_share_percent.toFixed(0)}%` : ""}
            />
            {c?.max_cost_per_run_usd != null && c.run_stats && (
              <Row
                label="Most expensive run"
                sub={`guardrail cap ${small(c.max_cost_per_run_usd)}`}
                value={small(c.run_stats.max_cost)}
                note={c.run_stats.max_cost > c.max_cost_per_run_usd ? "over" : "under"}
                tone={c.run_stats.max_cost > c.max_cost_per_run_usd ? "bad" : undefined}
              />
            )}
          </div>
        </SectionCard>
      </div>

      {/* Steps */}
      <SectionCard
        title="Cost by step"
        description={detail.steps.length ? `Median and p95 per run across ${formatNumber(s.runs)} runs. Calls per run above one means the step repeats inside a run.` : undefined}
      >
        {detail.steps.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-neutral-500">
            Untraced. Wrap runs in <code className="font-mono text-neutral-300">workflow()</code> and name steps to see where each run spends.{" "}
            <Link href="/docs/sdk" className="underline decoration-white/20 underline-offset-2 hover:text-white">SDK docs</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-180 px-5 py-1">
              <div className={cn("grid grid-cols-[minmax(0,1.4fr)_4rem_5.5rem_5.5rem_5.5rem_minmax(0,1fr)] gap-3 border-b border-white/6 py-2", TH)}>
                <span>Step</span>
                <span className="text-right">Runs</span>
                <span className="text-right">Calls / run</span>
                <span className="text-right">Median</span>
                <span className="text-right">p95</span>
                <span>Share of spend</span>
              </div>
              {detail.steps.map((st) => {
                const looping = st.max_calls_per_run > Math.ceil(st.calls_per_run) + 1;
                return (
                  <div key={st.step_name} className="grid grid-cols-[minmax(0,1.4fr)_4rem_5.5rem_5.5rem_5.5rem_minmax(0,1fr)] items-center gap-3 border-b border-white/5 py-2.5 text-[13px] last:border-0">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-neutral-100">{st.step_name}</span>
                      <span className="block truncate text-[12px] text-neutral-500">
                        {st.tool ? "tool · " : ""}
                        {st.models.join(", ")}
                      </span>
                    </span>
                    <span className="text-right tabular-nums text-neutral-300">{formatNumber(st.runs)}</span>
                    <span className="text-right tabular-nums text-neutral-300">
                      {st.calls_per_run}
                      {looping && <span className="text-indigo-300"> → {st.max_calls_per_run}</span>}
                    </span>
                    <span className="text-right tabular-nums text-neutral-200">{small(st.median_cost_per_run)}</span>
                    <span className="text-right tabular-nums text-neutral-200">{small(st.p95_cost_per_run)}</span>
                    <span className="flex items-center gap-2.5">
                      <span className="h-1 w-full max-w-44 overflow-hidden rounded-full bg-white/8">
                        <span className="block h-full rounded-full bg-indigo-400" style={{ width: `${Math.max(2, (st.total_cost / s.total_cost) * 100)}%` }} />
                      </span>
                      <span className="w-11 shrink-0 text-[12px] tabular-nums text-neutral-500">{pct(st.total_cost, s.total_cost)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Attribution: one object, three columns */}
      <SectionCard title="Where the money went" description="Spend attributed by the metadata on each call.">
        <div className="grid lg:grid-cols-3 lg:divide-x lg:divide-white/6 max-lg:divide-y max-lg:divide-white/6">
          <Column
            title="By developer"
            sub="user_id"
            rows={detail.by_user}
            total={s.total_cost}
            empty="Tag calls with metadata(user_id=…) to see who drives this agent's spend."
          />
          <Column
            title="By session"
            sub={s.sessions > 0 ? `top ${detail.by_session.length} of ${formatNumber(s.sessions)}` : "session_id"}
            rows={detail.by_session}
            total={s.total_cost}
            empty="Tag calls with metadata(session_id=…) to see the conversations that cost the most."
          />
          <Column
            title="By model"
            sub="cached input in brackets"
            rows={detail.by_model}
            total={s.total_cost}
            empty="No calls in this window."
            keyLabel={(k) => {
              const m = s.models.find((x) => x.model === k);
              return m?.cached_share ? `${k} (${Math.round(m.cached_share)}% cached)` : k;
            }}
          />
        </div>
      </SectionCard>

      {/* Guardrail and runs */}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <SectionCard
          title="Guardrail"
          description={hasPolicy ? "The declared policy against what actually ran." : undefined}
          action={
            <Link href="/guardrails" className="inline-flex items-center gap-1 text-[12.5px] text-neutral-400 underline decoration-white/20 underline-offset-2 hover:text-white">
              {hasPolicy ? "Edit" : "Set one"}
              <ArrowUpRight size={12} />
            </Link>
          }
        >
          {!hasPolicy || !c ? (
            <p className="px-5 py-6 text-[13px] leading-relaxed text-neutral-500">
              No guardrail for this agent. Declare which tools and models it may use, and how much a run may do, and every breach shows here the moment it happens.
            </p>
          ) : (
            <div className="px-5 py-1">
              <div className={cn("grid grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_3.5rem] gap-3 border-b border-white/6 py-2", TH)}>
                <span></span>
                <span>Policy</span>
                <span>Observed</span>
                <span className="text-right">State</span>
              </div>
              <Policy
                label="Tools"
                policy={c.allowed_tools?.length ? c.allowed_tools.join(", ") : c.read_only ? "read-only" : "any"}
                observed={c.observed_tools.length ? c.observed_tools.join(", ") : "none seen"}
                ok={!derived.kinds.has("undeclared_tool") && !derived.kinds.has("write_in_readonly")}
              />
              <Policy
                label="Models"
                policy={c.allowed_models?.length ? c.allowed_models.join(", ") : "any"}
                observed={c.observed_models.join(", ") || "—"}
                ok={!derived.kinds.has("undeclared_model")}
              />
              {c.max_tool_calls_per_run != null && (
                <Policy
                  label="Tool calls / run"
                  policy={`≤ ${c.max_tool_calls_per_run}`}
                  observed={c.run_stats ? `max ${formatNumber(c.run_stats.max_tool_calls)}` : "—"}
                  ok={!derived.kinds.has("tool_calls_over_limit")}
                />
              )}
              {c.max_cost_per_run_usd != null && (
                <Policy
                  label="Cost / run"
                  policy={`≤ ${small(c.max_cost_per_run_usd)}`}
                  observed={c.run_stats ? `max ${small(c.run_stats.max_cost)}` : "—"}
                  ok={!derived.kinds.has("run_cost_over_limit")}
                />
              )}
              <p className="py-3 text-[12px] text-neutral-500">
                {c.breach_series.length > 0
                  ? `Breaches by day: ${c.breach_series.map((d) => `${d.day.slice(5)} · ${d.count}`).join(", ")}`
                  : `${formatNumber(c.tracked_tool_calls)} tool calls tracked · ${formatNumber(c.runs_seen)} runs seen · no breaches in this window`}
              </p>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Runs" description={detail.traces.length ? "The most expensive runs in the window." : undefined}>
          {detail.traces.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-neutral-500">No traced runs in this window.</p>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-130 px-5 py-1">
                <div className={cn("grid grid-cols-[6.5rem_minmax(0,1fr)_3rem_5rem_3.5rem] gap-3 border-b border-white/6 py-2", TH)}>
                  <span>Run</span>
                  <span>Started</span>
                  <span className="text-right">Calls</span>
                  <span className="text-right">Cost</span>
                  <span className="text-right">Failed</span>
                </div>
                {detail.traces.map((t) => (
                  <div key={t.trace_id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem_5rem_3.5rem] items-baseline gap-3 border-b border-white/5 py-2.5 text-[13px] last:border-0">
                    <span className="truncate font-mono text-[12px] text-neutral-200">{t.trace_id}</span>
                    <span className="truncate text-neutral-500">{stamp(t.started_at)}</span>
                    <span className="text-right tabular-nums text-neutral-300">{t.calls}</span>
                    <span className="text-right tabular-nums text-neutral-200">{small(t.total_cost)}</span>
                    <span className={cn("text-right tabular-nums", t.failed_calls > 0 ? "text-red-300" : "text-neutral-500")}>{t.failed_calls}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Actions */}
      <SectionCard
        title="What to do"
        description="Recommendations that apply to this agent."
        action={
          <Link href="/optimizations" className="inline-flex items-center gap-1 text-[12.5px] text-neutral-400 underline decoration-white/20 underline-offset-2 hover:text-white">
            All recommendations
            <ArrowUpRight size={12} />
          </Link>
        }
      >
        {suggestions.length === 0 && !derived.loopStep ? (
          <p className="px-5 py-6 text-[13px] text-neutral-500">Nothing to recommend for this agent yet.</p>
        ) : (
          <div className="px-5 py-1">
            {derived.loopStep && (
              <Row
                label={`Cap ${derived.loopStep.step_name} at ${Math.ceil(derived.loopStep.calls_per_run) + 1} calls per run`}
                sub={`it ran up to ${derived.loopStep.max_calls_per_run}× in one run · ${formatNumber(s.repeated_runs)} runs repeated identical calls`}
                value={`−${formatCurrency(s.repeated_cost)}`}
                note="guardrail"
                tone="good"
              />
            )}
            {suggestions.map((o) => (
              <Row
                key={o.title}
                label={o.title}
                sub={o.alternative_model ? `${o.model} → ${o.alternative_model} · ${o.metrics?.quality_impact ?? o.priority}` : o.priority}
                value={o.estimated_savings_monthly ? `−${usd(o.estimated_savings_monthly, 0)} / mo` : "—"}
                note={o.estimated_savings_percent ? `${o.estimated_savings_percent}%` : ""}
                tone={o.estimated_savings_monthly ? "good" : undefined}
              />
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
