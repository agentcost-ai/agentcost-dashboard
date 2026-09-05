"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { StatBand, SectionCard } from "@/components/ui/Panels";
import { api, AgentStats, AgentCompliance } from "@/lib/api";
import {
  formatCurrency,
  formatNumber,
  formatLatency,
  formatPercentage,
  cn,
} from "@/lib/utils";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

/* ─────────────────────────────────────────────
   Agents — one ranked ledger of what each agent
   cost, how it behaved, and whether it stayed
   inside its guardrail.
   ───────────────────────────────────────────── */

const COLUMNS =
  "grid-cols-[2rem_minmax(0,2fr)_minmax(0,1.3fr)_repeat(3,minmax(0,1fr))_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1.1fr)]";

function guardrailCell(c: AgentCompliance | undefined) {
  if (!c || c.status === "no_guardrail") {
    return <span className="text-neutral-600">—</span>;
  }
  const breaches = c.breaches.reduce((s, b) => s + b.count, 0);
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          c.status === "breach" ? "bg-red-400" : "bg-emerald-400",
        )}
        aria-hidden
      />
      <span className={c.status === "breach" ? "text-red-300" : "text-neutral-300"}>
        {c.status === "breach" ? `${formatNumber(breaches)} breach${breaches === 1 ? "" : "es"}` : "Compliant"}
      </span>
    </span>
  );
}

export default function AgentsPage() {
  const { isConfigured } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agents, setAgents] = useState<AgentStats[]>([]);
  const [compliance, setCompliance] = useState<Record<string, AgentCompliance>>({});
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
        // Guardrail status is a secondary column: its failure must not blank the page.
        const [stats, guard] = await Promise.all([
          api.getAgentStats(timeRange, 50),
          api.getGuardrailCompliance(timeRange).catch(() => null),
        ]);
        setAgents(stats);
        setCompliance(
          Object.fromEntries((guard?.agents ?? []).map((a) => [a.agent_name, a])),
        );
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

  const summary = useMemo(() => {
    const totalCost = agents.reduce((sum, a) => sum + a.total_cost, 0);
    const totalCalls = agents.reduce((sum, a) => sum + a.total_calls, 0);
    // Weight success by call volume so a tiny noisy agent can't skew it.
    const weightedSuccess =
      totalCalls > 0
        ? agents.reduce((sum, a) => sum + a.success_rate * a.total_calls, 0) / totalCalls
        : 0;
    const sorted = [...agents].sort((a, b) => b.total_cost - a.total_cost);
    return { totalCost, totalCalls, weightedSuccess, sorted, topAgent: sorted[0] ?? null };
  }, [agents]);

  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  const breachingAgents = Object.values(compliance).filter((c) => c.status === "breach").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Agents</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cost, behaviour and guardrail status for every agent in the window.
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
            label: "Active agents",
            value: String(agents.length),
            sub: summary.topAgent ? `Top spender: ${summary.topAgent.agent_name}` : undefined,
          },
          {
            label: "Spend",
            value: formatCurrency(summary.totalCost),
            sub:
              summary.topAgent && summary.totalCost > 0
                ? `${((summary.topAgent.total_cost / summary.totalCost) * 100).toFixed(0)}% from the top agent`
                : undefined,
          },
          {
            label: "Calls",
            value: formatNumber(summary.totalCalls),
            sub:
              summary.totalCalls > 0
                ? `${formatCurrency(summary.totalCost / summary.totalCalls)} per call, blended`
                : undefined,
          },
          {
            label: "Success rate",
            value: summary.totalCalls > 0 ? formatPercentage(summary.weightedSuccess) : "—",
            tone:
              summary.totalCalls > 0 && summary.weightedSuccess < 95 ? "bad" : "default",
            sub:
              breachingAgents > 0
                ? `${breachingAgents} agent${breachingAgents === 1 ? "" : "s"} breaching a guardrail`
                : "Weighted by call volume",
          },
        ]}
      />

      <SectionCard
        title="Ranked by spend"
        description="Share is each agent's part of the window's spend. Guardrail shows the agent's compliance in the same window."
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
        ) : agents.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-260">
              <div
                className={cn(
                  "grid items-center gap-x-4 border-b border-white/6 px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500",
                  COLUMNS,
                )}
              >
                <span>#</span>
                <span>Agent</span>
                <span>Share</span>
                <span className="text-right">Cost</span>
                <span className="text-right">Per call</span>
                <span className="text-right">Calls</span>
                <span className="text-right">Tokens</span>
                <span className="text-right">Latency</span>
                <span className="text-right">Success</span>
                <span>Guardrail</span>
              </div>
              <div className="divide-y divide-white/5">
                {summary.sorted.map((agent, index) => {
                  const share = summary.totalCost > 0 ? (agent.total_cost / summary.totalCost) * 100 : 0;
                  const c = compliance[agent.agent_name];
                  return (
                    <div
                      key={agent.agent_name}
                      className={cn(
                        "grid items-center gap-x-4 px-5 py-3 text-[13px] transition-colors hover:bg-white/2",
                        COLUMNS,
                      )}
                    >
                      <span className="font-mono text-[12px] tabular-nums text-neutral-600">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="truncate font-medium text-white">{agent.agent_name}</span>
                      <span className="flex items-center gap-2.5">
                        <span className="h-1 w-full max-w-24 overflow-hidden rounded-full bg-white/8">
                          <span
                            className="block h-full rounded-full bg-white"
                            style={{ width: `${Math.max(2, share)}%` }}
                          />
                        </span>
                        <span className="w-11 shrink-0 tabular-nums text-neutral-500">
                          {share.toFixed(1)}%
                        </span>
                      </span>
                      <span className="text-right font-mono tabular-nums text-white">
                        {formatCurrency(agent.total_cost)}
                      </span>
                      <span className="text-right font-mono tabular-nums text-neutral-400">
                        {agent.total_calls > 0 ? formatCurrency(agent.total_cost / agent.total_calls) : "—"}
                      </span>
                      <span className="text-right font-mono tabular-nums text-neutral-300">
                        {formatNumber(agent.total_calls)}
                      </span>
                      <span className="text-right font-mono tabular-nums text-neutral-300">
                        {formatNumber(agent.total_tokens)}
                      </span>
                      <span className="text-right font-mono tabular-nums text-neutral-300">
                        {formatLatency(agent.avg_latency_ms)}
                      </span>
                      <span
                        className={cn(
                          "text-right font-mono tabular-nums",
                          agent.success_rate < 90 ? "text-red-300" : "text-neutral-200",
                        )}
                      >
                        {formatPercentage(agent.success_rate)}
                      </span>
                      <span className="text-[12.5px]">{guardrailCell(c)}</span>
                    </div>
                  );
                })}
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
