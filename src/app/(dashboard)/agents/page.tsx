"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { HeroStatCard } from "@/components/dashboard/HeroStatCard";
import { api, AgentStats } from "@/lib/api";
import {
  formatCurrency,
  formatNumber,
  formatLatency,
  formatPercentage,
} from "@/lib/utils";
import { Users, DollarSign, Activity, Gauge } from "lucide-react";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

export default function AgentsPage() {
  const { isConfigured } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!api.isConfigured()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await api.getAgentStats(timeRange, 50);
        setAgents(data);
        setShowOnboarding(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("Invalid API key")
        ) {
          setShowOnboarding(true);
          setError(null);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  const summary = useMemo(() => {
    const totalCost = agents.reduce((sum, a) => sum + a.total_cost, 0);
    const totalCalls = agents.reduce((sum, a) => sum + a.total_calls, 0);
    // Weight success by call volume so a tiny noisy agent can't skew it.
    const weightedSuccess =
      totalCalls > 0
        ? agents.reduce((sum, a) => sum + a.success_rate * a.total_calls, 0) /
          totalCalls
        : 0;
    const sorted = [...agents].sort((a, b) => b.total_cost - a.total_cost);
    return {
      totalCost,
      totalCalls,
      weightedSuccess,
      sorted,
      topAgent: sorted[0] ?? null,
    };
  }, [agents]);

  // Show onboarding if not configured or invalid API key
  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Agents
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cost and performance breakdown by agent
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-900/50 bg-red-950/20">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HeroStatCard
          label="Active Agents"
          value={String(agents.length)}
          sub={
            summary.topAgent
              ? `Top spender: ${summary.topAgent.agent_name}`
              : undefined
          }
          icon={<Users size={15} />}
          iconClassName="bg-sky-500/10 text-sky-400"
        />
        <HeroStatCard
          label="Total Spend"
          value={formatCurrency(summary.totalCost)}
          sub={
            summary.topAgent && summary.totalCost > 0
              ? `${((summary.topAgent.total_cost / summary.totalCost) * 100).toFixed(0)}% from top agent`
              : undefined
          }
          icon={<DollarSign size={15} />}
          iconClassName="bg-emerald-500/10 text-emerald-400"
        />
        <HeroStatCard
          label="Total Calls"
          value={formatNumber(summary.totalCalls)}
          sub={
            summary.totalCalls > 0
              ? `${formatCurrency(summary.totalCost / summary.totalCalls)} / call blended`
              : undefined
          }
          icon={<Activity size={15} />}
          iconClassName="bg-violet-500/10 text-violet-400"
        />
        <HeroStatCard
          label="Success Rate"
          value={
            summary.totalCalls > 0
              ? formatPercentage(summary.weightedSuccess)
              : "—"
          }
          sub="Weighted by call volume"
          icon={<Gauge size={15} />}
          iconClassName={
            summary.weightedSuccess >= 97 || summary.totalCalls === 0
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-amber-500/10 text-amber-400"
          }
        />
      </div>

      {/* Agents Table */}
      <Card padding="none">
        <div className="border-b border-white/6 px-6 py-4">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            Agent Performance
          </h3>
          <p className="text-[12.5px] text-neutral-500 mt-0.5">
            Ranked by spend in the selected window
          </p>
        </div>
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : agents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">#</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead className="w-44">Cost Share</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Cost / Call</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Latency</TableHead>
                <TableHead className="text-right">Success</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.sorted.map((agent, index) => {
                const share =
                  summary.totalCost > 0
                    ? (agent.total_cost / summary.totalCost) * 100
                    : 0;
                return (
                  <TableRow key={agent.agent_name}>
                    <TableCell className="font-mono text-xs text-neutral-600 tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/12 border border-white/6 text-[12px] font-semibold text-sky-300">
                          {agent.agent_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-white">
                          {agent.agent_name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-500"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-[11.5px] text-neutral-500 tabular-nums">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">
                      {formatCurrency(agent.total_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-400">
                      {agent.total_calls > 0
                        ? formatCurrency(agent.total_cost / agent.total_calls)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatNumber(agent.total_calls)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatNumber(agent.total_tokens)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatLatency(agent.avg_latency_ms)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={
                          agent.success_rate >= 95
                            ? "success"
                            : agent.success_rate >= 80
                              ? "warning"
                              : "error"
                        }
                      >
                        {formatPercentage(agent.success_rate)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-64 items-center justify-center text-neutral-500">
            No agent data available
          </div>
        )}
      </Card>
    </div>
  );
}
