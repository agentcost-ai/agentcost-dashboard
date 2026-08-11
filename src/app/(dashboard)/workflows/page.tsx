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
import {
  api,
  WorkflowStats,
  StepStats,
  ToolStats,
  RepeatedWorkFinding,
  RunCostDistribution as Distribution,
  OutcomeStats,
} from "@/lib/api";
import { RunCostDistribution } from "@/components/charts/RunCostDistribution";
import { PreDeploymentCard } from "@/components/dashboard/PreDeploymentCard";
import { formatCurrency, formatNumber, formatLatency } from "@/lib/utils";
import {
  Workflow as WorkflowIcon,
  DollarSign,
  Repeat,
  Layers,
  Wrench,
  TriangleAlert,
  TerminalSquare,
} from "lucide-react";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

/**
 * A step running more than once per run is the loop signal. One extra call
 * is usually a legitimate retry; beyond that it is worth looking at.
 */
const LOOP_WARN_CALLS_PER_RUN = 2;

function EmptyState() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-white/5 text-neutral-400">
        <WorkflowIcon size={18} />
      </div>
      <h3 className="text-[15px] font-semibold text-white">
        No workflow data yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
        Wrap a multi-step run in{" "}
        <code className="text-neutral-300">track_costs.workflow()</code> and its
        calls in <code className="text-neutral-300">step()</code> or{" "}
        <code className="text-neutral-300">tool()</code>, and this page fills
        in. Calls made outside a workflow still appear under Agents and Models.
      </p>
      <pre className="mx-auto mt-5 max-w-md overflow-x-auto rounded-lg border border-white/6 bg-black/30 p-4 text-left text-xs leading-relaxed text-neutral-400">
        <code>{`with track_costs.workflow("support-triage"):
    with track_costs.step("classify"):
        llm.invoke(...)
    with track_costs.tool("search_docs"):
        llm.invoke(...)`}</code>
      </pre>

      <div className="mx-auto mt-8 max-w-2xl border-t border-white/6 pt-2 text-left">
        <PreDeploymentCard compact />
      </div>
    </div>
  );
}

export default function WorkflowsPage() {
  const { isConfigured } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [workflows, setWorkflows] = useState<WorkflowStats[]>([]);
  const [steps, setSteps] = useState<StepStats[]>([]);
  const [tools, setTools] = useState<ToolStats[]>([]);
  const [repeats, setRepeats] = useState<RepeatedWorkFinding[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeStats[]>([]);
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  // null = "whichever workflow spends most", which is what the server picks.
  const [focusWorkflow, setFocusWorkflow] = useState<string | null>(null);
  const [showPreDeploy, setShowPreDeploy] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!api.hasProjectAccess()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const [workflowData, stepData, toolData, repeatData, outcomeData] =
          await Promise.all([
            api.getWorkflowStats(timeRange, 20),
            api.getStepStats(timeRange, undefined, 50),
            api.getToolStats(timeRange, 25),
            api.getRepeatedWork(timeRange, 15),
            api.getOutcomeStats(timeRange, 20),
          ]);
        setWorkflows(workflowData);
        setSteps(stepData);
        setTools(toolData);
        setRepeats(repeatData);
        setOutcomes(outcomeData);
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

  // Kept apart from the main fetch: picking a different workflow should
  // re-draw the chart, not reload the four tables under it.
  useEffect(() => {
    let cancelled = false;
    async function fetchDistribution() {
      if (!api.hasProjectAccess()) return;
      try {
        const data = await api.getRunCostDistribution(
          timeRange,
          focusWorkflow ?? undefined,
        );
        if (!cancelled) setDistribution(data);
      } catch {
        // The tables below are the page's job; a missing chart must not
        // surface an error banner over data that loaded fine.
        if (!cancelled) setDistribution(null);
      }
    }
    fetchDistribution();
    return () => {
      cancelled = true;
    };
  }, [timeRange, focusWorkflow]);

  const summary = useMemo(() => {
    const totalCost = workflows.reduce((sum, w) => sum + w.total_cost, 0);
    const totalRuns = workflows.reduce((sum, w) => sum + w.runs, 0);
    const wasted = repeats.reduce((sum, r) => sum + r.wasted_cost, 0);
    const priciest = [...workflows].sort(
      (a, b) => b.avg_cost_per_run - a.avg_cost_per_run,
    )[0];
    const loopingSteps = steps.filter(
      (s) => s.calls_per_run >= LOOP_WARN_CALLS_PER_RUN,
    );
    return { totalCost, totalRuns, wasted, priciest, loopingSteps };
  }, [workflows, repeats, steps]);

  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  const hasData = workflows.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Workflows
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            What one run of your agent costs, and where the cost comes from
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreDeploy((v) => !v)}
            aria-expanded={showPreDeploy}
            className={
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors " +
              (showPreDeploy
                ? "border-white/10 bg-white/8 text-white"
                : "border-white/6 text-neutral-400 hover:bg-white/5 hover:text-neutral-200")
            }
          >
            <TerminalSquare size={15} aria-hidden />
            Pre-deploy check
          </button>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {showPreDeploy && (
        <Card padding="none">
          <PreDeploymentCard />
        </Card>
      )}

      {error && (
        <Card className="border-red-900/50 bg-red-950/20">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HeroStatCard
          label="Workflows"
          value={String(workflows.length)}
          sub={summary.totalRuns > 0 ? `${formatNumber(summary.totalRuns)} runs` : undefined}
          icon={<WorkflowIcon size={15} />}
          iconClassName="bg-sky-500/10 text-sky-400"
        />
        <HeroStatCard
          label="Traced Spend"
          value={formatCurrency(summary.totalCost)}
          sub={
            summary.totalRuns > 0
              ? `${formatCurrency(summary.totalCost / summary.totalRuns)} per run blended`
              : undefined
          }
          icon={<DollarSign size={15} />}
          iconClassName="bg-emerald-500/10 text-emerald-400"
        />
        <HeroStatCard
          label="Costliest Run"
          value={
            summary.priciest
              ? formatCurrency(summary.priciest.avg_cost_per_run)
              : "—"
          }
          sub={summary.priciest ? summary.priciest.workflow : undefined}
          icon={<Layers size={15} />}
          iconClassName="bg-violet-500/10 text-violet-400"
        />
        <HeroStatCard
          label="Repeated Work"
          value={formatCurrency(summary.wasted)}
          sub={
            repeats.length > 0
              ? `${repeats.length} spot${repeats.length === 1 ? "" : "s"} inside single runs`
              : "None detected"
          }
          icon={<Repeat size={15} />}
          iconClassName={
            summary.wasted > 0
              ? "bg-amber-500/10 text-amber-400"
              : "bg-emerald-500/10 text-emerald-400"
          }
        />
      </div>

      {/* Run cost distribution */}
      {!loading && distribution && (
        <Card padding="none">
          <RunCostDistribution
            data={distribution}
            workflows={workflows.map((w) => w.workflow)}
            selected={distribution.workflow}
            onSelect={setFocusWorkflow}
          />
        </Card>
      )}

      {/* Workflows */}
      <Card padding="none">
        <div className="border-b border-white/6 px-4 py-4 sm:px-6">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            Cost per workflow
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Averages are per run, not per call — a workflow with more steps
            is not automatically more expensive per run.
          </p>
        </div>
        {loading ? (
          <TableSkeleton rows={4} />
        ) : !hasData ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Avg / run</TableHead>
                  <TableHead className="text-right">Max / run</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Calls / run</TableHead>
                  <TableHead className="text-right">Depth</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workflows.map((w) => (
                  <TableRow key={w.workflow}>
                    <TableCell className="font-medium text-white">
                      {w.workflow}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatNumber(w.runs)}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {formatCurrency(w.avg_cost_per_run)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatCurrency(w.max_cost_per_run)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatCurrency(w.total_cost)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {w.avg_calls_per_run}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {w.max_depth}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={w.success_rate >= 97 ? "success" : "warning"}
                      >
                        {w.success_rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Outcomes */}
      {!loading && outcomes.some((o) => o.succeeded + o.failed > 0) && (
        <Card padding="none">
          <div className="border-b border-white/6 px-4 py-4 sm:px-6">
            <h3 className="text-[15px] font-semibold tracking-tight text-white">
              Cost per completed outcome
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              What a result costs, not what a run costs — failed runs were paid
              for too, so their spend is charged to the successes.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Workflow</TableHead>
                  <TableHead className="text-right">Succeeded</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Unreported</TableHead>
                  <TableHead className="text-right">Spent on failures</TableHead>
                  <TableHead className="text-right">Cost per success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outcomes
                  .filter((o) => o.succeeded + o.failed > 0)
                  .map((o) => (
                    <TableRow key={o.workflow ?? "—"}>
                      <TableCell className="font-medium text-white">
                        {o.workflow ?? "—"}
                      </TableCell>
                      <TableCell className="text-right text-neutral-400">
                        {formatNumber(o.succeeded)}
                      </TableCell>
                      <TableCell className="text-right">
                        {o.failed > 0 ? (
                          <span className="text-amber-400">
                            {formatNumber(o.failed)}
                          </span>
                        ) : (
                          <span className="text-neutral-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-neutral-500">
                        {o.unknown > 0 ? formatNumber(o.unknown) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-neutral-400">
                        {formatCurrency(o.cost_on_failure)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-white">
                        {o.cost_per_success != null
                          ? formatCurrency(o.cost_per_success)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Steps */}
      {!loading && steps.length > 0 && (
        <Card padding="none">
          <div className="border-b border-white/6 px-4 py-4 sm:px-6">
            <h3 className="text-[15px] font-semibold tracking-tight text-white">
              Cost per step
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Calls per run above 1 means the step ran more than once inside a
              single run — a retry, or a loop.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Calls / run</TableHead>
                  <TableHead className="text-right">Cost / run</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Avg latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {steps.map((s) => (
                  <TableRow key={`${s.workflow}:${s.step_name}`}>
                    <TableCell className="font-medium text-white">
                      {s.step_name}
                    </TableCell>
                    <TableCell className="text-neutral-400">
                      {s.workflow ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatNumber(s.runs)}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.calls_per_run >= LOOP_WARN_CALLS_PER_RUN ? (
                        <span className="inline-flex items-center gap-1.5 text-amber-400">
                          <TriangleAlert size={13} aria-hidden />
                          {s.calls_per_run}
                        </span>
                      ) : (
                        <span className="text-neutral-400">
                          {s.calls_per_run}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {formatCurrency(s.cost_per_run)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatCurrency(s.total_cost)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatLatency(s.avg_latency_ms)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Repeated work */}
      {!loading && repeats.length > 0 && (
        <Card padding="none">
          <div className="border-b border-white/6 px-4 py-4 sm:px-6">
            <h3 className="text-[15px] font-semibold tracking-tight text-white">
              Repeated work inside a single run
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              The same call made more than once within one run. Unlike
              duplicates across runs — which a cache fixes — this usually means
              the control flow is looping.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Step</TableHead>
                  <TableHead>Workflow</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Repeats</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Avoidable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repeats.map((r) => (
                  <TableRow key={`${r.trace_id}:${r.input_hash}:${r.step_name}`}>
                    <TableCell className="font-medium text-white">
                      {r.step_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-neutral-400">
                      {r.workflow ?? "—"}
                    </TableCell>
                    <TableCell className="text-neutral-400">{r.model}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="warning">{r.occurrences}×</Badge>
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatCurrency(r.spend)}
                    </TableCell>
                    <TableCell className="text-right text-amber-400">
                      {formatCurrency(r.wasted_cost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Tools */}
      {!loading && tools.length > 0 && (
        <Card padding="none">
          <div className="border-b border-white/6 px-4 py-4 sm:px-6">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-white">
              <Wrench size={15} className="text-neutral-400" aria-hidden />
              Cost per tool
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              LLM spend incurred while a tool was running.
            </p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead className="text-right">Runs</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Total cost</TableHead>
                  <TableHead className="text-right">Avg latency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((t) => (
                  <TableRow key={t.tool_name}>
                    <TableCell className="font-medium text-white">
                      {t.tool_name}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatNumber(t.runs)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatNumber(t.calls)}
                    </TableCell>
                    <TableCell className="text-right text-white">
                      {formatCurrency(t.total_cost)}
                    </TableCell>
                    <TableCell className="text-right text-neutral-400">
                      {formatLatency(t.avg_latency_ms)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
