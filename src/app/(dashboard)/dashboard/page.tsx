"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { RefreshCw, KeyRound, ArrowRight, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatBand } from "@/components/ui/Panels";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import { MainTimeSeriesChart } from "@/components/charts/MainTimeSeriesChart";
import { ModelShare } from "@/components/dashboard/ModelShare";
import { AgentDayStack } from "@/components/dashboard/AgentDayStack";
import {
  SURFACE,
  usd,
  Money,
  Change,
  Eyebrow,
  TopAgentCard,
  AccentPanel,
  PanelSkeleton,
} from "@/components/dashboard/OverviewPanels";
import { ChartSkeleton } from "@/components/ui/Skeleton";
import {
  api,
  getStoredApiKeyForProject,
  getFallbackProjectKey,
  AnalyticsOverview,
  AgentStats,
  AgentSummary,
  ModelStats,
  OptimizationSummary,
  TimeSeriesPoint,
} from "@/lib/api";
import { formatNumber, formatLatency, formatPercentage, parseApiError, cn } from "@/lib/utils";
import { useAutoRefresh, formatLastRefresh } from "@/hooks/useAutoRefresh";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";
import { OpenAIImportModal } from "@/components/onboarding/OpenAIImportModal";
import { isDemoMode } from "@/lib/demo/demo";
import { track } from "@/lib/analytics";

/**
 * Zero-events snippet card: the user's REAL credentials, copy-paste-run.
 * Without this, the working snippet only existed on the (skipped-when-
 * configured) onboarding screen and in Settings — invisible exactly when
 * a new user is staring at an empty dashboard.
 */
function TrackAppSnippetCard() {
  const [creds, setCreds] = useState<{ apiKey: string; projectId: string }>({
    apiKey: "",
    projectId: "",
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const read = () => {
      const activeId = api.getActiveProjectId();
      if (activeId) {
        setCreds({
          projectId: activeId,
          apiKey: getStoredApiKeyForProject(activeId),
        });
      } else {
        const fallback = getFallbackProjectKey();
        setCreds({ projectId: fallback.projectId, apiKey: fallback.apiKey });
      }
    };
    read();
    window.addEventListener("agentcost_config_updated", read);
    window.addEventListener("agentcost_active_project_changed", read);
    return () => {
      window.removeEventListener("agentcost_config_updated", read);
      window.removeEventListener("agentcost_active_project_changed", read);
    };
  }, []);

  if (!creds.apiKey || !creds.projectId) return null;

  const snippet = `pip install agentcost\n\nfrom agentcost import track_costs\ntrack_costs.init(\n    api_key="${creds.apiKey}",\n    project_id="${creds.projectId}"\n)`;

  const copy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      track("api_key_copied");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-medium text-white">
            Track your app in 2 lines of Python
          </h3>
          <p className="mt-1 text-sm text-neutral-400">
            Your key and project are already filled in. Events appear here
            within seconds of your first LLM call.
          </p>
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg border border-neutral-700 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="mt-3 overflow-x-auto rounded-lg bg-neutral-900 border border-neutral-800 p-3 text-[12.5px] leading-relaxed text-neutral-300 font-mono">
        {snippet}
      </pre>
    </Card>
  );
}

export default function DashboardPage() {
  const { isConfigured } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [models, setModels] = useState<ModelStats[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [summaries, setSummaries] = useState<AgentSummary[]>([]);
  const [savings, setSavings] = useState<OptimizationSummary | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const fetchData = useCallback(async () => {
    // Don't fetch if not configured
    if (!api.hasProjectAccess()) {
      return;
    }

    try {
      // The per-agent summaries and the savings rollup feed secondary panels:
      // their failure must not blank the page.
      const [overviewData, agentsData, modelsData, timeSeriesData, summaryData, savingsData] =
        await Promise.all([
          api.getOverview(timeRange),
          api.getAgentStats(timeRange),
          api.getModelStats(timeRange),
          api.getTimeSeries(timeRange),
          api.getAgentSummaries(timeRange, 50).catch(() => [] as AgentSummary[]),
          api.getOptimizationSummary().catch(() => null),
        ]);

      setOverview(overviewData);
      setAgents(agentsData);
      setModels(modelsData);
      setTimeSeries(timeSeriesData);
      setSummaries(Array.isArray(summaryData) ? summaryData : []);
      setSavings(savingsData);
      setError(null);
      setShowOnboarding(false);

      // Funnel milestone: first time this browser sees real data for this
      // project. Fired once per project (localStorage flag), never in demo.
      if (!isDemoMode() && overviewData.total_calls > 0) {
        const projectId = api.getActiveProjectId() ?? "default";
        const flagKey = `agentcost_first_data_${projectId}`;
        if (!localStorage.getItem(flagKey)) {
          localStorage.setItem(flagKey, new Date().toISOString());
          track("first_data_seen");
        }
      }
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
      if (!api.hasProjectAccess()) {
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

    // Change against the previous window of equal length, the same figure the
    // Agents page reports.
    const previousCost = summaries.reduce((s, a) => s + a.previous_cost, 0);
    const currentCost = summaries.reduce((s, a) => s + a.total_cost, 0);

    return {
      topAgent: byCost[0] ?? null,
      slowestAgent: bySlowest[0] ?? null,
      topModel: byCalls[0] ?? null,
      projectedMonthly,
      failedCalls,
      costPer1k,
      change: previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : null,
      drivers: [...summaries].sort((a, b) => b.total_cost - a.total_cost).slice(0, 3),
    };
  }, [agents, models, timeSeries, timeRange, overview, summaries]);

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
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Overview
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cost and performance across your AI agents
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
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
            className="flex min-h-11 items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] text-neutral-400 hover:text-white border border-white/6 hover:border-white/12 transition-colors disabled:opacity-50 sm:min-h-0"
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

      {/* Zero-events state: quick OpenAI import entry point. Disappears the
          moment the project has any tracked events. */}
      {!loading &&
        !error &&
        overview &&
        overview.total_calls === 0 &&
        !isDemoMode() && (
          <Card className="border-sky-900/50 bg-sky-950/20">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-white">
                    No events yet? See your spend anyway
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    Import your last 30 days of OpenAI or Anthropic spend with an Admin key.
                    60 seconds, no code, key never stored.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-white hover:bg-neutral-200 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors"
              >
                Import spend
                <ArrowRight size={14} />
              </button>
            </div>
          </Card>
        )}

      {/* Zero-events state: the 2-line SDK snippet with real credentials. */}
      {!loading &&
        !error &&
        overview &&
        overview.total_calls === 0 &&
        !isDemoMode() && <TrackAppSnippetCard />}

      {/* The bill, and what it could be */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
        {loading ? (
          <>
            <PanelSkeleton className="h-[30rem]" />
            <PanelSkeleton className="h-[30rem]" />
          </>
        ) : overview ? (
          <>
            {/* Top to bottom: the number, how it got there, what it implies. */}
            <section id="tour-spend" className={cn(SURFACE, "flex flex-col p-5 sm:p-7")}>
              <Eyebrow>Total spend</Eyebrow>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Money
                  value={overview.total_cost}
                  className="text-[3.25rem] font-light leading-none tracking-[-0.03em] text-white sm:text-[4rem]"
                />
                {summaries.length > 0 && (
                  <span className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                    <Change percent={insights.change} className="px-2.5 py-1 text-[12.5px]" />
                    vs the previous window
                  </span>
                )}
              </div>

              <div className="mt-7 flex-1">
                {timeSeries.length > 0 ? (
                  <MainTimeSeriesChart data={timeSeries} range={timeRange} />
                ) : (
                  <div className="flex h-52 items-center justify-center text-neutral-500">
                    No data available
                  </div>
                )}
              </div>

              <dl className="mt-6 grid grid-cols-3 divide-x divide-white/6 border-t border-white/6 pt-5">
                {[
                  ["Projected a month", usd(insights.projectedMonthly), "at this run rate"],
                  ["Per call", usd(overview.avg_cost_per_call, 4), "average"],
                  ["Per 1K tokens", usd(insights.costPer1k, 4), "blended across models"],
                ].map(([label, value, sub]) => (
                  <div key={label} className="px-5 first:pl-0 last:pr-0">
                    <dt className="text-[12px] text-neutral-500">{label}</dt>
                    <dd className="mt-1.5 text-[1.35rem] font-light leading-none tracking-tight tabular-nums text-white">
                      {value}
                    </dd>
                    <dd className="mt-1.5 truncate text-[11.5px] text-neutral-600">{sub}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Accent panel: the money on the table, or the run rate when
                there is nothing to recommend yet. */}
            <AccentPanel>
                {savings && savings.total_potential_savings_monthly > 0 ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2.5 text-[14px] font-medium text-white">
                        <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-indigo-100">
                          <Sparkles className="size-4" strokeWidth={1.75} aria-hidden />
                        </span>
                        Optimizations
                      </span>
                      <span className="rounded-lg bg-indigo-200 px-2.5 py-1 text-[11.5px] font-semibold text-[#0d0d14]">
                        {savings.suggestion_count} found
                      </span>
                    </div>
                    <p className="mt-9 text-[1.5rem] font-light tracking-tight text-white">Recoverable spend</p>
                    <p className="mt-3 text-[2.75rem] font-light leading-none tracking-[-0.03em] text-white">
                      <Money value={savings.total_potential_savings_monthly} />
                    </p>
                    <p className="mt-2 text-[13px] text-neutral-300">
                      a month, {savings.total_potential_savings_percent.toFixed(0)}% of current spend
                    </p>
                    <p className="mt-4 max-w-[34ch] text-[13.5px] leading-relaxed text-neutral-400">
                      Found in the usage itself, and estimated per recommendation
                      before you change anything.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-[1.5rem] font-light tracking-tight text-white">Run rate</p>
                    <p className="mt-3 text-[2.75rem] font-light leading-none tracking-[-0.03em] text-white">
                      <Money value={insights.projectedMonthly} />
                    </p>
                    <p className="mt-2 text-[13px] text-neutral-300">a month if this window repeats</p>
                    <p className="mt-5 max-w-[34ch] text-[13.5px] leading-relaxed text-neutral-300">
                      Recommendations appear once there is enough usage to compare
                      like with like.
                    </p>
                  </>
                )}

                <div className="mt-auto space-y-2.5 pt-16">
                  <Link
                    href="/optimizations"
                    className="group flex items-center justify-center gap-2 rounded-xl bg-indigo-100 px-4 py-3.5 text-[13.5px] font-semibold text-[#0d0d14] shadow-[0_8px_30px_rgba(30,27,75,0.35)] transition-colors hover:bg-white"
                  >
                    See what to change
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                  <Link
                    href="/guardrails"
                    className="flex items-center justify-center rounded-xl border border-white/25 bg-[#1e1b4b]/35 px-4 py-3.5 text-[13.5px] font-medium text-white backdrop-blur-md transition-colors hover:bg-[#1e1b4b]/50"
                  >
                    Set a limit per agent
                  </Link>
                </div>
            </AccentPanel>
          </>
        ) : null}
      </div>

      {/* Who drove it */}
      {!loading && insights.drivers.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <Eyebrow>Where it went</Eyebrow>
                <span className="rounded-full bg-white/6 px-2 py-0.5 text-[11.5px] text-neutral-300">
                  {summaries.length} agent{summaries.length === 1 ? "" : "s"}
                </span>
              </div>
              <h2 className="mt-1.5 text-[1.6rem] font-light tracking-tight text-white">
                The agents behind the bill
              </h2>
            </div>
            <Link
              href="/agents"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 text-[12.5px] text-neutral-300 transition-colors hover:border-white/25 hover:text-white"
            >
              All agents
              <ArrowRight className="size-3" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {insights.drivers.map((agent, i) => (
              <TopAgentCard key={agent.agent_name} agent={agent} rank={i + 1} />
            ))}
          </div>
        </section>
      )}

      {/* Volume and health */}
      {!loading && overview && (
        <StatBand
          items={[
            {
              label: "API calls",
              value: formatNumber(overview.total_calls),
              sub: `${formatNumber(overview.avg_tokens_per_call)} tokens per call`,
            },
            {
              label: "Tokens",
              value: formatNumber(overview.total_tokens),
              sub: `${formatNumber(overview.total_input_tokens)} in · ${formatNumber(overview.total_output_tokens)} out`,
            },
            {
              label: "Success rate",
              value: formatPercentage(overview.success_rate),
              sub:
                insights.failedCalls > 0
                  ? `${formatNumber(insights.failedCalls)} failed calls`
                  : "no failures in window",
              tone: overview.success_rate >= 97 ? undefined : "bad",
            },
            {
              label: "Latency",
              value: formatLatency(overview.avg_latency_ms),
              sub: insights.slowestAgent ? `slowest: ${insights.slowestAgent.agent_name}` : "average",
            },
            {
              label: "Agents",
              value: String(agents.length),
              sub: insights.topAgent ? `top: ${insights.topAgent.agent_name}` : "none seen",
            },
            {
              label: "Models",
              value: String(models.length),
              sub: insights.topModel ? `most used: ${insights.topModel.model}` : "none seen",
            },
          ]}
        />
      )}

      {/* Model share, and who spent it each day */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className={cn(SURFACE, "p-5 sm:p-7")}>
          <Eyebrow>By model</Eyebrow>
          <h3 className="mb-7 mt-1.5 text-[1.35rem] font-light tracking-tight text-white">Where the dollars land</h3>
          {loading ? (
            <ChartSkeleton />
          ) : models.length > 0 ? (
            <ModelShare data={models} />
          ) : (
            <div className="flex h-60 items-center justify-center text-neutral-500">
              No model data available
            </div>
          )}
        </section>

        <section className={cn(SURFACE, "p-5 sm:p-7")}>
          <Eyebrow>By agent</Eyebrow>
          <h3 className="mb-6 mt-1.5 text-[1.35rem] font-light tracking-tight text-white">Who spent it, day by day</h3>
          {loading ? (
            <ChartSkeleton />
          ) : summaries.length > 0 ? (
            <AgentDayStack agents={summaries} />
          ) : (
            <div className="flex h-60 items-center justify-center text-neutral-500">
              No agent data available
            </div>
          )}
        </section>
      </div>

      <OpenAIImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </div>
  );
}
