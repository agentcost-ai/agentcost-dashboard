"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatBand, SectionCard } from "@/components/ui/Panels";
import { api, type AgentSummary, type OptimizationSuggestion } from "@/lib/api";
import { formatCurrency, formatNumber, formatLatency, cn } from "@/lib/utils";
import { ACCENT, ACCENT_SOFT } from "@/lib/palette";
import { useApiConfiguration, OnboardingScreen, LoadingSpinner } from "@/hooks/useApiConfiguration";

/* ─────────────────────────────────────────────
   Agents — a ranked ledger where every row
   carries change and cause, and opens the
   agent's own page.
   ───────────────────────────────────────────── */

const COLUMNS =
  "grid-cols-[2rem_minmax(0,1.9fr)_minmax(0,1.15fr)_5.5rem_minmax(0,0.8fr)_minmax(0,0.6fr)_minmax(0,0.75fr)_minmax(0,0.7fr)_minmax(0,0.95fr)_minmax(0,2.2fr)]";

function usd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function perRun(n: number | null): string {
  if (n === null) return "—";
  return usd(n, n < 0.01 ? 4 : 3);
}

/** Seven-day trend in one hairline. The peak is marked only when it is the story. */
function Trend({ data, mark }: { data: number[]; mark: boolean }) {
  if (data.length < 2) return <span className="text-neutral-700">—</span>;
  const w = 84;
  const h = 22;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i * w) / (data.length - 1),
    y: h - 3 - ((v - min) / span) * (h - 6),
  }));
  const peak = pts[data.indexOf(max)];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden className="block">
      <polyline
        fill="none"
        stroke={ACCENT_SOFT}
        strokeWidth="1.25"
        strokeLinejoin="round"
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
      />
      {mark && <circle cx={peak.x} cy={peak.y} r="2.4" fill={ACCENT} stroke="#0a0a0b" strokeWidth="1" />}
    </svg>
  );
}

function Delta({ value }: { value: number | null }) {
  if (value === null) return <span className="text-neutral-600">new</span>;
  const sign = value > 0 ? "+" : "";
  return (
    <span className={cn("tabular-nums", Math.abs(value) >= 10 ? "text-neutral-300" : "text-neutral-500")}>
      {sign}
      {value.toFixed(1)}%
    </span>
  );
}

function Guardrail({ agent }: { agent: AgentSummary }) {
  const s = agent.signal;
  if (s.kind === "breach") {
    return (
      <span className="inline-flex items-center gap-1.5 text-red-300">
        <span className="size-1.5 rounded-full bg-red-400" aria-hidden />
        {s.title.replace(" guardrail", "")}
      </span>
    );
  }
  return null;
}

type Row = AgentSummary & { swap?: OptimizationSuggestion };

function Signal({ row }: { row: Row }) {
  const s = row.signal;
  if (s.kind === "none" && row.swap) {
    const monthly = row.swap.estimated_savings_monthly;
    return (
      <span className="text-neutral-400">
        <span className="font-medium text-neutral-200">Model swap.</span>{" "}
        {row.swap.alternative_model} at {row.swap.metrics?.savings_percentage ?? "—"}% less
        {monthly ? <span className="text-emerald-300"> · −{usd(monthly, 0)}/mo</span> : null}
      </span>
    );
  }
  if (s.kind === "none") return <span className="text-neutral-600">—</span>;
  return (
    <span className="text-neutral-400">
      <span className={cn("font-medium", s.kind === "breach" ? "text-red-300" : "text-neutral-200")}>
        {s.title}.
      </span>{" "}
      {s.detail}
      {s.amount ? <span className="text-indigo-300"> · {usd(s.amount)} wasted</span> : null}
    </span>
  );
}

export default function AgentsPage() {
  const { isConfigured } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentSummary[]>([]);
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
        // Recommendations are a secondary column: their failure must not blank the page.
        const [rows, opts] = await Promise.all([
          api.getAgentSummaries(timeRange, 50),
          api.getOptimizations().catch(() => [] as OptimizationSuggestion[]),
        ]);
        setAgents(rows);
        setSuggestions(Array.isArray(opts) ? opts : []);
        setShowOnboarding(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch data";
        if (message.includes("401") || message.includes("Invalid API key")) {
          setShowOnboarding(true);
          setError(null);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [timeRange]);

  const rows: Row[] = useMemo(
    () =>
      agents.map((a) => ({
        ...a,
        swap: suggestions.find((o) => o.agent_name === a.agent_name && o.alternative_model),
      })),
    [agents, suggestions],
  );

  const totals = useMemo(() => {
    const cost = agents.reduce((s, a) => s + a.total_cost, 0);
    const previous = agents.reduce((s, a) => s + a.previous_cost, 0);
    const wasted = agents.reduce((s, a) => s + a.repeated_cost + a.failed_cost, 0);
    const tracedCost = agents.filter((a) => a.runs > 0).reduce((s, a) => s + a.total_cost, 0);
    const runs = agents.reduce((s, a) => s + a.runs, 0);
    const cacheSavings = agents.reduce((s, a) => s + a.cache_savings, 0);
    const calls = agents.reduce((s, a) => s + a.total_calls, 0);
    const latency = calls ? agents.reduce((s, a) => s + a.avg_latency_ms * a.total_calls, 0) / calls : 0;
    const breaching = agents.filter((a) => a.signal.kind === "breach").length;
    const cachedInputs = agents.filter((a) => a.cached_share !== null);
    return {
      cost,
      change: previous > 0 ? ((cost - previous) / previous) * 100 : null,
      wasted,
      wastedShare: cost > 0 ? (wasted / cost) * 100 : 0,
      costPerRun: runs > 0 ? tracedCost / runs : null,
      runs,
      cacheSavings,
      cachedAgents: cachedInputs.length,
      latency,
      breaching,
    };
  }, [agents]);

  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Agents</h1>
          <p className="mt-1 text-sm text-neutral-500">
            What each agent cost, how that changed, and what to look at first.
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <StatBand
        items={[
          {
            label: "Agents",
            value: String(agents.length),
            sub:
              totals.breaching > 0
                ? `${totals.breaching} with a guardrail breach`
                : "No guardrail breaches",
          },
          {
            label: "Spend",
            value: (
              <>
                {formatCurrency(totals.cost)}
                {totals.change !== null && (
                  <span className="ml-2 text-[13px] font-medium text-neutral-400">
                    {totals.change > 0 ? "+" : ""}
                    {totals.change.toFixed(1)}%
                  </span>
                )}
              </>
            ),
            sub: totals.change !== null ? "vs the previous window" : "no previous window",
          },
          {
            label: "Wasted",
            value: formatCurrency(totals.wasted),
            sub: `repeats and failed calls · ${totals.wastedShare.toFixed(1)}%`,
          },
          {
            label: "Cost / run",
            value: totals.costPerRun !== null ? perRun(totals.costPerRun) : "—",
            sub: totals.runs > 0 ? `${formatNumber(totals.runs)} traced runs` : "no traced runs",
          },
          {
            label: "Cache savings",
            value: formatCurrency(totals.cacheSavings),
            sub:
              totals.cachedAgents > 0
                ? `${totals.cachedAgents} agent${totals.cachedAgents === 1 ? "" : "s"} with cached input`
                : "no cached input seen",
          },
          {
            label: "Latency",
            value: formatLatency(totals.latency),
            sub: "average, weighted by calls",
          },
        ]}
      />

      <SectionCard
        title="Ranked by spend"
        description="Signal is the most expensive thing we can prove about the agent in this window. Open a row for the full picture."
        action={
          <Link
            href="/guardrails"
            className="text-[12.5px] text-neutral-400 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Manage guardrails
          </Link>
        }
      >
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : rows.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-275">
              <div
                className={cn(
                  "grid items-center gap-x-4 border-b border-white/6 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500",
                  COLUMNS,
                )}
              >
                <span>#</span>
                <span>Agent</span>
                <span className="text-right">Spend</span>
                <span>Trend</span>
                <span className="text-right">Per run</span>
                <span className="text-right">Cache</span>
                <span className="text-right">Failed $</span>
                <span className="text-right">Latency</span>
                <span>Guardrail</span>
                <span>Signal</span>
              </div>
              <div className="divide-y divide-white/5">
                {rows.map((agent, index) => (
                  <Link
                    key={agent.agent_name}
                    href={`/agents/${encodeURIComponent(agent.agent_name)}`}
                    className={cn(
                      "grid items-center gap-x-4 px-5 py-3 text-[13px] transition-colors hover:bg-white/3",
                      COLUMNS,
                    )}
                  >
                    <span className="text-[12px] tabular-nums text-neutral-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-white">{agent.agent_name}</span>
                      <span className="block truncate text-[12px] text-neutral-500">
                        {agent.models.map((m) => m.model).join(" · ") || "—"}
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block tabular-nums text-white">{formatCurrency(agent.total_cost)}</span>
                      <span className="block text-[12px]">
                        <Delta value={agent.cost_change_percent} />
                      </span>
                    </span>
                    <span>
                      <Trend
                        data={agent.daily.map((d) => d.cost)}
                        mark={agent.signal.kind === "repeated_work"}
                      />
                    </span>
                    <span className="text-right tabular-nums text-neutral-300">{perRun(agent.cost_per_run)}</span>
                    <span className="text-right tabular-nums text-neutral-300">
                      {agent.cached_share !== null ? `${Math.round(agent.cached_share)}%` : <span className="text-neutral-600">—</span>}
                    </span>
                    <span
                      className={cn(
                        "text-right tabular-nums",
                        agent.signal.kind === "failed_spend" ? "text-red-300" : "text-neutral-300",
                      )}
                    >
                      {agent.failed_cost > 0 ? usd(agent.failed_cost) : <span className="text-neutral-600">—</span>}
                    </span>
                    <span className="text-right tabular-nums text-neutral-300">{formatLatency(agent.avg_latency_ms)}</span>
                    <span className="text-[12.5px]">
                      <Guardrail agent={agent} />
                      {agent.signal.kind !== "breach" && <span className="text-neutral-600">—</span>}
                    </span>
                    <span className="text-[12.5px] leading-snug">
                      <Signal row={agent} />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-56 items-center justify-center text-sm text-neutral-500">
            No agent data in this window
          </div>
        )}
      </SectionCard>
    </div>
  );
}
