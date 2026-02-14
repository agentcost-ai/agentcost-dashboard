"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DollarSign,
  Activity,
  Zap,
  Clock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Users,
  Cpu,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Card, MetricCard } from "@/components/ui/Card";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import { CostChart } from "@/components/charts/CostChart";
import { AgentChart } from "@/components/charts/AgentChart";
import { ModelChart } from "@/components/charts/ModelChart";
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

// Calculate trend from time series data
function calculateTrend(data: TimeSeriesPoint[]): {
  value: number;
  direction: "up" | "down" | "neutral";
} {
  if (data.length < 2) return { value: 0, direction: "neutral" };

  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);

  const firstAvg =
    firstHalf.reduce((sum, d) => sum + d.cost, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, d) => sum + d.cost, 0) / secondHalf.length;

  if (firstAvg === 0) return { value: 0, direction: "neutral" };

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  return {
    value: Math.abs(change),
    direction: change > 2 ? "up" : change < -2 ? "down" : "neutral",
  };
}

// Trend indicator component
function TrendIndicator({
  trend,
}: {
  trend: { value: number; direction: "up" | "down" | "neutral" };
}) {
  if (trend.direction === "neutral") {
    return <span className="text-xs text-neutral-500">No change</span>;
  }

  const isUp = trend.direction === "up";
  return (
    <span
      className={`flex items-center gap-1 text-xs ${isUp ? "text-red-400" : "text-emerald-400"}`}
    >
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {trend.value.toFixed(1)}%
    </span>
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

  // Show onboarding if API key not configured OR if we got a 401 error
  if (isConfigured === false || showOnboarding) {
    return <OnboardingScreen />;
  }

  // Still checking configuration
  if (isConfigured === null) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Overview</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Monitor your AI agent costs and performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Refresh status */}
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            {autoRefreshEnabled && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Auto-refresh
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-neutral-400 hover:text-white hover:bg-neutral-700/50 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={16}
              className={isRefreshing ? "animate-spin" : ""}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </>
        ) : overview ? (
          <>
            <MetricCard
              title="Total Cost"
              value={formatCurrency(overview.total_cost)}
              subtitle={
                <div className="flex items-center gap-2">
                  <span>{formatNumber(overview.total_calls)} calls</span>
                  <TrendIndicator trend={calculateTrend(timeSeries)} />
                </div>
              }
              icon={<DollarSign size={20} />}
            />
            <MetricCard
              title="Total Tokens"
              value={formatNumber(overview.total_tokens)}
              subtitle={`${formatNumber(overview.avg_tokens_per_call)} avg/call`}
              icon={<Zap size={20} />}
            />
            <MetricCard
              title="Avg Latency"
              value={formatLatency(overview.avg_latency_ms)}
              subtitle="Response time"
              icon={<Clock size={20} />}
            />
            <MetricCard
              title="Success Rate"
              value={formatPercentage(overview.success_rate)}
              subtitle={`${overview.total_calls} total calls`}
              icon={<Activity size={20} />}
            />
          </>
        ) : null}
      </div>

      {/* Extended Analytics Row */}
      {!loading && overview && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-blue-400" />
              <span className="text-xs text-neutral-500 uppercase tracking-wide">
                Agents
              </span>
            </div>
            <p className="text-xl font-semibold text-white">{agents.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Cpu size={14} className="text-purple-400" />
              <span className="text-xs text-neutral-500 uppercase tracking-wide">
                Models
              </span>
            </div>
            <p className="text-xl font-semibold text-white">{models.length}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={14} className="text-emerald-400" />
              <span className="text-xs text-neutral-500 uppercase tracking-wide">
                Avg Cost/Call
              </span>
            </div>
            <p className="text-xl font-semibold text-white">
              {formatCurrency(overview.avg_cost_per_call)}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-amber-400" />
              <span className="text-xs text-neutral-500 uppercase tracking-wide">
                Input Tokens
              </span>
            </div>
            <p className="text-xl font-semibold text-white">
              {formatNumber(overview.total_input_tokens)}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={14} className="text-orange-400" />
              <span className="text-xs text-neutral-500 uppercase tracking-wide">
                Output Tokens
              </span>
            </div>
            <p className="text-xl font-semibold text-white">
              {formatNumber(overview.total_output_tokens)}
            </p>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-medium text-white">
            Cost Over Time
          </h3>
          {loading ? (
            <ChartSkeleton />
          ) : timeSeries.length > 0 ? (
            <CostChart data={timeSeries} />
          ) : (
            <div className="flex h-64 items-center justify-center text-neutral-500">
              No data available
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-medium text-white">Cost by Agent</h3>
          {loading ? (
            <ChartSkeleton />
          ) : agents.length > 0 ? (
            <AgentChart data={agents} />
          ) : (
            <div className="flex h-64 items-center justify-center text-neutral-500">
              No agent data available
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-medium text-white">Cost by Model</h3>
          {loading ? (
            <ChartSkeleton />
          ) : models.length > 0 ? (
            <ModelChart data={models} />
          ) : (
            <div className="flex h-64 items-center justify-center text-neutral-500">
              No model data available
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-medium text-white">
            Performance Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-neutral-400">Most Expensive Agent</span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Highest cost contributor
                </p>
              </div>
              <div className="text-right">
                <span className="font-medium text-white">
                  {agents.length > 0
                    ? agents.sort((a, b) => b.total_cost - a.total_cost)[0]
                        .agent_name
                    : "-"}
                </span>
                {agents.length > 0 && (
                  <p className="text-xs text-neutral-500">
                    {formatCurrency(
                      agents.sort((a, b) => b.total_cost - a.total_cost)[0]
                        .total_cost,
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-neutral-400">Most Used Model</span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  By number of calls
                </p>
              </div>
              <div className="text-right">
                <span className="font-medium text-white font-mono text-sm">
                  {models.length > 0
                    ? models.sort((a, b) => b.total_calls - a.total_calls)[0]
                        .model
                    : "-"}
                </span>
                {models.length > 0 && (
                  <p className="text-xs text-neutral-500">
                    {formatNumber(
                      models.sort((a, b) => b.total_calls - a.total_calls)[0]
                        .total_calls,
                    )}{" "}
                    calls
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="text-neutral-400">Slowest Agent</span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Highest avg latency
                </p>
              </div>
              <div className="text-right">
                <span className="font-medium text-white">
                  {agents.length > 0
                    ? agents.sort(
                        (a, b) => b.avg_latency_ms - a.avg_latency_ms,
                      )[0].agent_name
                    : "-"}
                </span>
                {agents.length > 0 && (
                  <p className="text-xs text-neutral-500">
                    {formatLatency(
                      agents.sort(
                        (a, b) => b.avg_latency_ms - a.avg_latency_ms,
                      )[0].avg_latency_ms,
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-neutral-400">Cost Efficiency</span>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Cost per 1K tokens
                </p>
              </div>
              <span className="font-medium text-white">
                {overview && overview.total_tokens > 0
                  ? formatCurrency(
                      (overview.total_cost / overview.total_tokens) * 1000,
                    )
                  : "-"}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
