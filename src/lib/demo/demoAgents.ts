/**
 * Demo data for the Agents list and the agent page. Derived from the same
 * agent and workflow profiles as the rest of the demo so totals agree with
 * the Overview and Workflows pages.
 */

import type {
  AgentDetail,
  AgentModelShare,
  AgentOutcomes,
  AgentSignal,
  AgentStepCost,
  AgentSummary,
  DimensionStat,
} from "../api";
import {
  AGENTS,
  WORKFLOWS,
  dayMultiplier,
  demoAgentStats,
  demoGuardrailCompliance,
  demoRepeatedWork,
  demoRunCostDistribution,
  demoTraces,
  perCallCost,
  rangeToDays,
  round2,
  stepCost,
} from "./demoData";

const AGENT_WORKFLOW: Record<string, string> = {
  "support-triage-agent": "support-triage",
  "research-agent": "research-brief",
};

// Spend change against the previous window, per agent.
const DRIFT: Record<string, number> = {
  "support-triage-agent": 1.124,
  "research-agent": 1.031,
  "report-writer": 0.98,
  "code-review-agent": 1.008,
  "faq-bot": 1.056,
  "sentiment-classifier": 1.012,
  "email-drafter": 0.995,
};

const CACHE_SHARE: Record<string, number> = {
  "research-agent": 41,
  "code-review-agent": 27,
  "support-triage-agent": 18,
};

// Share of spend lost to identical calls repeated inside one run.
const REPEAT_SHARE: Record<string, number> = {
  "support-triage-agent": 0.108,
  "research-agent": 0.03,
};

const DEVELOPERS = ["maya.chen", "dev.patel", "ci-bot"];

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function dim(key: string, calls: number, tokens: number, cost: number, latency: number, success: number): DimensionStat {
  return {
    key,
    total_calls: Math.round(calls),
    total_tokens: Math.round(tokens),
    total_cost: round6(cost),
    avg_latency_ms: Math.round(latency),
    success_rate: round2(success),
  };
}

function signalFor(args: {
  cost: number;
  calls: number;
  runs: number;
  failed: number;
  failedCost: number;
  repeatedCost: number;
  repeatedRuns: number;
  maxOutput: number;
  breaches: number;
  breachDetail: string | null;
}): AgentSignal {
  if (args.breaches > 0) {
    return {
      kind: "breach",
      title: `${args.breaches} guardrail breach${args.breaches === 1 ? "" : "es"}`,
      detail: args.breachDetail,
      amount: null,
    };
  }
  if (args.cost > 0 && args.repeatedCost / args.cost >= 0.05) {
    return {
      kind: "repeated_work",
      title: "Repeated work",
      detail: `${args.repeatedRuns} runs re-ran an identical call`,
      amount: round6(args.repeatedCost),
    };
  }
  if (args.cost > 0 && args.failedCost / args.cost >= 0.02) {
    return {
      kind: "failed_spend",
      title: `${round2((args.failed / args.calls) * 100)}% of calls fail and still bill`,
      detail: `${args.failed} failed calls`,
      amount: round6(args.failedCost),
    };
  }
  if (args.calls >= 100 && args.maxOutput > 0 && args.maxOutput <= 16) {
    return {
      kind: "classification",
      title: "Classification, not generation",
      detail: `Output never above ${args.maxOutput} tokens across ${args.calls} calls`,
      amount: null,
    };
  }
  if (args.runs === 0 && args.calls > 0) {
    return {
      kind: "untraced",
      title: "Untraced",
      detail: "Wrap runs in workflow() to get cost per run and step costs",
      amount: null,
    };
  }
  return { kind: "none", title: "Nothing to flag", detail: null, amount: null };
}

export function demoAgentSummaries(range: string, limit: number): AgentSummary[] {
  const days = rangeToDays(range);
  let prevMult = 0;
  for (let d = days; d < days * 2; d++) prevMult += dayMultiplier(d);

  const stats = demoAgentStats(range, 50);
  const projectCost = stats.reduce((s, a) => s + a.total_cost, 0);
  const compliance = Object.fromEntries(
    demoGuardrailCompliance(range).agents.map((a) => [a.agent_name, a]),
  );
  const now = Date.now();

  return stats.slice(0, limit).map((a) => {
    const p = AGENTS.find((x) => x.name === a.agent_name)!;
    const workflow = WORKFLOWS.find((w) => w.name === AGENT_WORKFLOW[a.agent_name]);
    const callsPerRun = workflow ? workflow.steps.reduce((sum, st) => sum + st.callsPerRun, 0) : 0;
    const runs = workflow ? Math.round(a.total_calls / callsPerRun) : 0;
    const cost = a.total_cost;
    const previous = round2((p.callsPerDay * prevMult * perCallCost(p)) / (DRIFT[a.agent_name] ?? 1));
    const repeatedCost = round6(cost * (REPEAT_SHARE[a.agent_name] ?? 0));
    const repeatedRuns = repeatedCost > 0 ? Math.round(runs * 0.064) : 0;
    const failed = Math.round(a.total_calls * p.errorRate);
    const failedCost = round6(cost * p.errorRate);
    const cachedShare: number | null = CACHE_SHARE[a.agent_name] ?? null;
    const c = compliance[a.agent_name];
    const breaches = c?.status === "breach" ? c.breaches.reduce((s, b) => s + b.count, 0) : 0;

    // Daily series; the retry loop lands on the day before today.
    const daily = [];
    for (let d = days - 1; d >= 0; d--) {
      const ts = new Date(now - d * 86_400_000);
      const base = p.callsPerDay * dayMultiplier(d) * perCallCost(p);
      const spike = d === 1 && repeatedCost > 0 ? repeatedCost : 0;
      daily.push({
        day: ts.toISOString().slice(0, 10),
        cost: round6(base + spike),
        calls: Math.round(p.callsPerDay * dayMultiplier(d)),
        failed_cost: round6(base * p.errorRate),
      });
    }
    if (range === "1h" || range === "24h") daily.splice(0, daily.length - 1);

    const models: AgentModelShare[] = [{ model: p.model, calls: a.total_calls, cost: round6(cost), cached_share: cachedShare }];
    if (a.agent_name === "support-triage-agent") {
      models[0] = { ...models[0], calls: Math.round(a.total_calls * 0.91), cost: round6(cost * 0.96) };
      models.push({ model: "gpt-4o-mini", calls: Math.round(a.total_calls * 0.09), cost: round6(cost * 0.04), cached_share: null });
    }

    return {
      agent_name: a.agent_name,
      total_calls: a.total_calls,
      total_tokens: a.total_tokens,
      total_cost: cost,
      avg_latency_ms: a.avg_latency_ms,
      success_rate: a.success_rate,
      share_percent: round2(projectCost > 0 ? (cost / projectCost) * 100 : 0),
      previous_cost: previous,
      cost_change_percent: previous > 0 ? Math.round(((cost - previous) / previous) * 1000) / 10 : null,
      models,
      runs,
      cost_per_run: runs ? round6(cost / runs) : null,
      calls_per_run: runs ? round2(a.total_calls / runs) : null,
      cached_share: cachedShare,
      cache_savings: cachedShare ? round6(cost * (cachedShare / 100) * 0.45) : 0,
      failed_calls: failed,
      failed_cost: failedCost,
      repeated_cost: repeatedCost,
      repeated_runs: repeatedRuns,
      developers: workflow ? 3 : 2,
      sessions: workflow ? Math.round(runs * 0.84) : 0,
      first_seen: new Date(now - 56 * 86_400_000).toISOString(),
      last_seen: new Date(now - (3 + (a.total_calls % 7)) * 60_000).toISOString(),
      daily,
      signal: signalFor({
        cost,
        calls: a.total_calls,
        runs,
        failed,
        failedCost,
        repeatedCost,
        repeatedRuns,
        maxOutput: p.outTokens <= 16 ? 14 : p.outTokens * 3,
        breaches,
        breachDetail:
          c?.breaches[0]?.kind === "write_in_readonly"
            ? `${c.breaches[0].subject} called in read-only mode`
            : c?.breaches[0]?.kind === "tool_calls_over_limit"
              ? `A run made ${c.breaches[0].observed} tool calls, the cap is ${c.breaches[0].limit}`
              : null,
      }),
    };
  });
}

export function demoAgentDetail(agentName: string, range: string): AgentDetail | null {
  const summary = demoAgentSummaries(range, 50).find((s) => s.agent_name === agentName);
  if (!summary) return null;
  const p = AGENTS.find((x) => x.name === agentName)!;
  const workflow = WORKFLOWS.find((w) => w.name === AGENT_WORKFLOW[agentName]);
  const runs = summary.runs;
  const successPct = 100 - p.errorRate * 100;

  const rawStepTotal = workflow
    ? workflow.steps.reduce((sum, st) => sum + runs * stepCost(st) * st.callsPerRun, 0) + summary.repeated_cost
    : 0;
  const scale = rawStepTotal > 0 ? summary.total_cost / rawStepTotal : 1;
  const steps: AgentStepCost[] = workflow
    ? workflow.steps
        .map((step) => {
          const median = round6(stepCost(step) * step.callsPerRun * scale);
          const looping = step.tool && summary.repeated_cost > 0;
          const total = round6(runs * median + (looping ? summary.repeated_cost : 0));
          return {
            step_name: step.name,
            tool: Boolean(step.tool),
            models: [step.model],
            runs,
            calls: Math.round(runs * step.callsPerRun) + (looping ? summary.repeated_runs * 6 : 0),
            calls_per_run: step.callsPerRun,
            max_calls_per_run: looping ? 9 : Math.ceil(step.callsPerRun),
            total_cost: total,
            median_cost_per_run: median,
            p95_cost_per_run: round6(median * (step.tool ? 2.9 : 1.15)),
            success_rate: round2(successPct),
          };
        })
        .sort((a, b) => b.total_cost - a.total_cost)
    : [];

  const cost = summary.total_cost;
  const by_model: DimensionStat[] = summary.models.map((m) =>
    dim(m.model, m.calls, (m.calls / summary.total_calls) * summary.total_tokens, m.cost, p.avgLatencyMs, successPct),
  );
  const by_tool: DimensionStat[] = steps
    .filter((s) => s.tool)
    .map((s) => dim(s.step_name, s.calls, s.calls * 2200, s.total_cost, p.avgLatencyMs * 1.3, s.success_rate));
  const devShares = workflow ? [0.43, 0.31, 0.26] : [0.58, 0.42];
  const by_user: DimensionStat[] = devShares.map((share, i) =>
    dim(DEVELOPERS[i], summary.total_calls * share, summary.total_tokens * share, cost * share, p.avgLatencyMs, successPct),
  );
  const by_session: DimensionStat[] = workflow
    ? [
        dim("sess_8f2a1c", 41, 41 * 2200, cost * 0.0037, p.avgLatencyMs * 1.4, 100),
        dim("sess_1c9d77", 38, 38 * 2200, cost * 0.0035, p.avgLatencyMs * 1.3, 100),
        dim("sess_77b0e2", 12, 12 * 2200, cost * 0.0011, p.avgLatencyMs, 100),
      ]
    : [];
  const by_workflow: DimensionStat[] = workflow
    ? [dim(workflow.name, summary.total_calls, summary.total_tokens, cost, p.avgLatencyMs, successPct)]
    : [];

  const rawDistribution = workflow ? demoRunCostDistribution(range, workflow.name, 24) : null;
  const distribution = rawDistribution
    ? {
        ...rawDistribution,
        runs,
        total_cost: cost,
        tail_runs: Math.max(1, Math.round(runs * 0.05)),
      }
    : null;
  const tail_cost = distribution ? round6((cost * distribution.tail_share_percent) / 100) : 0;
  const costPerRun = runs > 0 ? cost / runs : 0;
  const failedRuns = runs > 0 ? Math.round(runs * p.errorRate * 1.6) : 0;
  const outcomes: AgentOutcomes | null =
    runs > 0
      ? {
          runs,
          succeeded: runs - failedRuns,
          failed: failedRuns,
          unknown: 0,
          cost_on_success: round6(cost - failedRuns * costPerRun),
          cost_on_failure: round6(failedRuns * costPerRun),
          cost_per_success: round6(cost / (runs - failedRuns)),
          success_rate: round2(((runs - failedRuns) / runs) * 100),
        }
      : null;

  return {
    summary,
    latency: {
      p50: Math.round(p.avgLatencyMs * 0.76),
      p95: Math.round(p.avgLatencyMs * 2.5),
      p99: Math.round(p.avgLatencyMs * 4.3),
      avg: p.avgLatencyMs,
      sample_size: summary.total_calls,
      approximate: false,
    },
    steps,
    by_model,
    by_tool,
    by_user,
    by_session,
    by_workflow,
    distribution,
    tail_cost,
    repeated_work:
      workflow && summary.repeated_cost > 0
        ? demoRepeatedWork(range, 25).filter((f) => f.workflow === workflow.name).slice(0, 8)
        : [],
    traces: workflow ? demoTraces(range, workflow.name, 8) : [],
    outcomes,
    compliance: demoGuardrailCompliance(range).agents.find((a) => a.agent_name === agentName) ?? null,
  };
}
