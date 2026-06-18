"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  DollarSign,
  Activity,
  Zap,
  RefreshCw,
  Cpu,
  Crown,
  Timer,
  Gauge,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import { MainTimeSeriesChart } from "@/components/charts/MainTimeSeriesChart";
import { ModelDonut } from "@/components/charts/ModelDonut";
import { AgentRankList } from "@/components/dashboard/AgentRankList";
import { HeroStatCard, type Delta } from "@/components/dashboard/HeroStatCard";
import { MetricCardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import {
  api,
  AnalyticsOverview,
  AgentStats,
  ModelStats,
  TimeSeriesPoint,
} from "@/lib/api";
import {
  formatCurrency,
  formatNumber,
  formatLatency,
  formatPercentage,
  parseApiError,
} from "@/lib/utils";
import { useAutoRefresh, formatLastRefresh } from "@/hooks/useAutoRefresh";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

/** Percent change of the second half of the window vs the first half. */
function seriesDelta(
  data: TimeSeriesPoint[],
  key: "cost" | "calls" | "tokens",
): Delta {
  if (data.length < 2) return { value: 0, direction: "neutral" };

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d[key], 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d[key], 0) / secondHalf.length;

  if (firstAvg === 0) return { value: 0, direction: "neutral" };

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  return {
    value: Math.abs(change),
    direction: change > 2 ? "up" : change < -2 ? "down" : "neutral",
  };
}

/** Snapshot cell in the operational strip below the hero cards. */
function SnapshotStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="px-5 py-4 first:pl-6 last:pr-6">
      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-600 mb-1.5">
        {label}
      </p>
      <p className="text-[15px] font-semibold text-white tabular-nums leading-none">
        {value}
      </p>
      {sub && (
        <p className="mt-1.5 text-[11.5px] text-neutral-500 truncate">{sub}</p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { isConfigured, recheckConfiguration } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [models, setModels] = useState<ModelStats[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);

  const fetchData = useCallback(async () => {
    // Don't fetch if not configured
    if (!api.isConfigured()) {
      return;
    }

    try {
      const [overviewData, agentsData, modelsData, timeSeriesData] =
        await Promise.all([
          api.getOverview(timeRange),
          api.getAgentStats(timeRange),
          api.getModelStats(timeRange),
          api.getTimeSeries(timeRange),
        ]);

      setOverview(overviewData);
      setAgents(agentsData);
      setModels(modelsData);
      setTimeSeries(timeSeriesData);
      setError(null);
      setShowOnboarding(false);
    } catch (err) {
      const errorMessage = parseApiError(err);

      // If we get a 401 (invalid API key), show onboarding instead of error
      if (
        errorMessage.includes("401") ||
        errorMessage.includes("Invalid API key") ||
        errorMessage.includes("session has expired")
      ) {
        setShowOnboarding(true);
        setError(null);
      } else {
        setError(errorMessage);
      }
    }
  }, [timeRange]);

  // Auto-refresh hook
  const { isRefreshing, lastRefresh, refresh, autoRefreshEnabled } =
    useAutoRefresh({
      onRefresh: fetchData,
    });

  useEffect(() => {
    async function initialFetch() {
      // Skip fetch if not configured
      if (!api.isConfigured()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      await fetchData();
      setLoading(false);
    }

    initialFetch();
  }, [fetchData]);

  // ── Derived insight values ────────────────────────────────────────────
  const insights = useMemo(() => {
    const byCost = [...agents].sort((a, b) => b.total_cost - a.total_cost);
    const bySlowest = [...agents].sort(
      (a, b) => b.avg_latency_ms - a.avg_latency_ms,
    );
    const byCalls = [...models].sort((a, b) => b.total_calls - a.total_calls);

    const windowCost = timeSeries.reduce((s, p) => s + p.cost, 0);
    const daysMap: Record<string, number> = {
      "1h": 1 / 24,
      "24h": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const days = daysMap[timeRange] ?? 7;
    const projectedMonthly = days > 0 ? (windowCost / days) * 30.4 : 0;

    const failedCalls = overview
      ? Math.round(overview.total_calls * (1 - overview.success_rate / 100))
      : 0;
    const costPer1k =
      overview && overview.total_tokens > 0
        ? (overview.total_cost / overview.total_tokens) * 1000
        : 0;

    return {
      topAgent: byCost[0] ?? null,
      slowestAgent: bySlowest[0] ?? null,
      topModel: byCalls[0] ?? null,
      projectedMonthly,
      failedCalls,
      costPer1k,
    };
  }, [agents, models, timeSeries, timeRange, overview]);

  // Show onboarding if API key not configured OR if we got a 401 error
  if (isConfigured === false || showOnboarding) {
    return <OnboardingScreen />;
  }

  // Still checking configuration
  if (isConfigured === null) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Overview
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cost and performance across your AI agents
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Refresh status */}
          <div className="hidden md:flex items-center gap-2 text-[12.5px] text-neutral-600">
            {autoRefreshEnabled && (
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
            {lastRefresh && (
              <span>Updated {formatLastRefresh(lastRefresh)}</span>
            )}
          </div>

          {/* Manual refresh button */}
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-neutral-400 hover:text-white border border-white/6 hover:border-white/12 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-900/50 bg-red-950/20">
          <p className="text-red-400">{error}</p>
          <p className="mt-2 text-sm text-neutral-400">
            Make sure the backend is running and accessible.
          </p>
        </Card>
      )}

      {/* Hero stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : overview ? (
          <>
            <HeroStatCard
              label="Total Spend"
              value={formatCurrency(overview.total_cost)}
              sub={`${formatCurrency(overview.avg_cost_per_call)} / call`}
              icon={<DollarSign size={15} />}
              iconClassName="bg-sky-500/10 text-sky-400"
              delta={seriesDelta(timeSeries, "cost")}
              upIsBad
              sparkline={{
                data: timeSeries.map((p) => p.cost),
                color: "#38bdf8",
              }}
            />
            <HeroStatCard
              label="API Calls"
              value={formatNumber(overview.total_calls)}
              sub={`${formatNumber(overview.avg_tokens_per_call)} tok / call`}
              icon={<Activity size={15} />}
              iconClassName="bg-violet-500/10 text-violet-400"
              delta={seriesDelta(timeSeries, "calls")}
              sparkline={{
                data: timeSeries.map((p) => p.calls),
                color: "#a78bfa",
              }}
            />
            <HeroStatCard
              label="Tokens"
              value={formatNumber(overview.total_tokens)}
              sub={`${formatNumber(overview.total_input_tokens)} in · ${formatNumber(overview.total_output_tokens)} out`}
              icon={<Zap size={15} />}
              iconClassName="bg-amber-500/10 text-amber-400"
              delta={seriesDelta(timeSeries, "tokens")}
              sparkline={{
                data: timeSeries.map((p) => p.tokens),
                color: "#fbbf24",
              }}
            />
            <HeroStatCard
              label="Success Rate"
              value={formatPercentage(overview.success_rate)}
              sub={
                insights.failedCalls > 0
                  ? `${formatNumber(insights.failedCalls)} failed calls`
                  : "No failures in window"
              }
              icon={<Gauge size={15} />}
              iconClassName={
                overview.success_rate >= 97
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              }
            />
          </>
        ) : null}
      </div>

      {/* Operational snapshot strip */}
      {!loading && overview && (
        <Card padding="none" className="overflow-x-auto">
          <div className="grid min-w-175 grid-cols-3 lg:grid-cols-6 divide-x divide-white/4">
            <SnapshotStat
              label="Projected / mo"
              value={formatCurrency(insights.projectedMonthly)}
              sub="At current run rate"
            />
            <SnapshotStat
              label="Cost / 1K tok"
              value={formatCurrency(insights.costPer1k)}
              sub="Blended, all models"
            />
            <SnapshotStat
              label="Avg Latency"
              value={formatLatency(overview.avg_latency_ms)}
              sub={
                insights.slowestAgent
                  ? `Slowest: ${insights.slowestAgent.agent_name}`
                  : undefined
              }
            />
            <SnapshotStat
              label="Active Agents"
              value={String(agents.length)}
              sub={
                insights.topAgent
                  ? `Top: ${insights.topAgent.agent_name}`
                  : undefined
              }
            />
            <SnapshotStat
              label="Models in Use"
              value={String(models.length)}
              sub={
                insights.topModel ? `Most used: ${insights.topModel.model}` : undefined
              }
            />
            <SnapshotStat
              label="Failed Calls"
              value={formatNumber(insights.failedCalls)}
              sub={`${(100 - overview.success_rate).toFixed(2)}% error rate`}
            />
          </div>
        </Card>
      )}

      {/* Main activity chart */}
      <Card>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-[15px] font-semibold text-white tracking-tight">
              Activity
            </h3>
            <p className="text-[12.5px] text-neutral-500 mt-0.5">
              Spend, calls and tokens over the selected window
            </p>
          </div>
        </div>
        <div className="mt-4">
          {loading ? (
            <ChartSkeleton />
          ) : timeSeries.length > 0 ? (
            <MainTimeSeriesChart data={timeSeries} range={timeRange} />
          ) : (
            <div className="flex h-64 items-center justify-center text-neutral-500">
              No data available
            </div>
          )}
        </div>
      </Card>

      {/* Model share + agent ranking */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Cpu size={14} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white tracking-tight">
                Cost by Model
              </h3>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : models.length > 0 ? (
            <ModelDonut data={models} />
          ) : (
            <div className="flex h-60 items-center justify-center text-neutral-500">
              No model data available
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Crown size={14} />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-white tracking-tight">
                Top Agents by Cost
              </h3>
            </div>
          </div>
          {loading ? (
            <ChartSkeleton />
          ) : agents.length > 0 ? (
            <AgentRankList data={agents} />
          ) : (
            <div className="flex h-60 items-center justify-center text-neutral-500">
              No agent data available
            </div>
          )}
        </Card>
      </div>

      {/* Spotlight row */}
      {!loading && overview && insights.topAgent && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card padding="sm" className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Crown size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-600">
                Biggest spender
              </p>
              <p className="text-[14px] font-semibold text-white truncate mt-0.5">
                {insights.topAgent.agent_name}
              </p>
              <p className="text-[12px] text-neutral-500 tabular-nums">
                {formatCurrency(insights.topAgent.total_cost)} ·{" "}
                {formatNumber(insights.topAgent.total_calls)} calls
              </p>
            </div>
          </Card>

          {insights.topModel && (
            <Card padding="sm" className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Cpu size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-600">
                  Workhorse model
                </p>
                <p className="text-[14px] font-semibold text-white font-mono truncate mt-0.5">
                  {insights.topModel.model}
                </p>
                <p className="text-[12px] text-neutral-500 tabular-nums">
                  {formatNumber(insights.topModel.total_calls)} calls ·{" "}
                  {formatCurrency(insights.topModel.total_cost)}
                </p>
              </div>
            </Card>
          )}

          {insights.slowestAgent && (
            <Card padding="sm" className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Timer size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-600">
                  Slowest agent
                </p>
                <p className="text-[14px] font-semibold text-white truncate mt-0.5">
                  {insights.slowestAgent.agent_name}
                </p>
                <p className="text-[12px] text-neutral-500 tabular-nums">
                  {formatLatency(insights.slowestAgent.avg_latency_ms)} avg
                  response
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
