"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import { TableSkeleton } from "@/components/ui/Skeleton";
import {
  StatBand,
  SectionCard,
  Segmented,
  Toggle,
  fieldClass,
  monoFieldClass,
  buttonPrimary,
  buttonSecondary,
  buttonDanger,
} from "@/components/ui/Panels";
import { FilterMenu } from "@/components/docs/FilterMenu";
import {
  api,
  AgentCompliance,
  GuardrailBreach,
  GuardrailComplianceResponse,
  GuardrailPolicyInput,
  RunStats,
} from "@/lib/api";
import { formatNumber, formatCurrency, parseApiError, cn } from "@/lib/utils";
import { useActiveProject } from "@/contexts/ActiveProjectContext";
import { Plus, X, ChevronDown, ShieldAlert } from "lucide-react";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

/* ─────────────────────────────────────────────
   Guardrails — a declared boundary per agent,
   judged against what the events table saw.
   Four boundaries: tools, read-only, models,
   per-run limits. Observe-and-alert, not block.
   ───────────────────────────────────────────── */

const BREACH_COPY: Record<GuardrailBreach["kind"], string> = {
  undeclared_tool: "Tool outside the permitted list",
  write_in_readonly: "Write tool on a read-only agent",
  undeclared_model: "Model outside the permitted list",
  tool_calls_over_limit: "Tool calls per run over the limit",
  run_cost_over_limit: "Cost per run over the limit",
};

const RUN_KINDS = new Set<GuardrailBreach["kind"]>(["tool_calls_over_limit", "run_cost_over_limit"]);
const NEW_AGENT = "__new__";

function relTime(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

function shortDay(iso: string): string {
  return new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
}

function StatusDot({ status }: { status: AgentCompliance["status"] }) {
  return (
    <span
      className={cn(
        "inline-block h-2 w-2 shrink-0 rounded-full",
        status === "breach" ? "bg-red-400" : status === "compliant" ? "bg-emerald-400" : "bg-neutral-600",
      )}
      aria-hidden
    />
  );
}

function statusLabel(a: AgentCompliance): string {
  if (a.status === "breach") {
    const n = a.breaches.reduce((s, b) => s + b.count, 0);
    return `${formatNumber(n)} breach${n === 1 ? "" : "es"}`;
  }
  if (a.status === "compliant") return "Compliant";
  return "No guardrail";
}

/** One-line rendering of a policy: what is bounded and how. */
function boundarySummary(a: AgentCompliance): string[] {
  const parts: string[] = [];
  if (a.allowed_tools !== null) {
    parts.push(a.allowed_tools.length === 0 ? "no tools" : `tools: ${a.allowed_tools.join(", ")}`);
  }
  if (a.read_only) parts.push("read-only");
  if (a.allowed_models !== null) {
    parts.push(a.allowed_models.length === 0 ? "no models" : `models: ${a.allowed_models.join(", ")}`);
  }
  if (a.max_tool_calls_per_run !== null) parts.push(`≤ ${a.max_tool_calls_per_run} tool calls / run`);
  if (a.max_cost_per_run_usd !== null) parts.push(`≤ ${formatCurrency(a.max_cost_per_run_usd)} / run`);
  return parts;
}

/* ── Detail widgets ───────────────────────────────────────────────────── */

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">{children}</p>;
}

function UsageBar({ pct, bad }: { pct: number; bad?: boolean }) {
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-white/8">
      <span
        className={cn("block h-full rounded-full", bad ? "bg-red-400" : "bg-neutral-300")}
        style={{ width: `${Math.max(2, Math.min(100, pct))}%` }}
      />
    </span>
  );
}

function ToolsPanel({ agent }: { agent: AgentCompliance }) {
  const max = Math.max(1, ...agent.tool_usage.map((t) => t.calls));
  if (agent.tool_usage.length === 0) {
    return (
      <div>
        <Label>Tools</Label>
        <p className="mt-2 text-[13px] text-neutral-500">
          No instrumented tool calls. Wrap calls in <code className="text-neutral-400">track_costs.tool()</code> to
          judge a tool boundary.
        </p>
      </div>
    );
  }
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>Tools</Label>
        <span className="text-[11.5px] text-neutral-600">{formatNumber(agent.tracked_tool_calls)} instrumented calls</span>
      </div>
      <ul className="mt-2 space-y-2">
        {agent.tool_usage.map((t) => (
          <li key={t.tool_name} className="text-[12.5px]">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <span className={cn("truncate font-mono", t.breach_kind ? "text-red-300" : "text-neutral-200")}>
                  {t.tool_name}
                </span>
                {t.access && <span className="shrink-0 text-[11px] text-neutral-600">{t.access}</span>}
                {agent.read_only && !t.access && !t.breach_kind && (
                  <span className="shrink-0 text-[11px] text-neutral-600">untagged</span>
                )}
              </span>
              <span className="shrink-0 tabular-nums text-neutral-400">
                {formatNumber(t.calls)}
                <span className="text-neutral-600"> · {relTime(t.last_seen)}</span>
              </span>
            </div>
            <div className="mt-1">
              <UsageBar pct={(t.calls / max) * 100} bad={Boolean(t.breach_kind)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModelsPanel({ agent }: { agent: AgentCompliance }) {
  const totalCost = Math.max(1e-9, agent.model_usage.reduce((s, m) => s + m.cost, 0));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>Models</Label>
        <span className="text-[11.5px] text-neutral-600">{formatCurrency(agent.total_cost)} in window</span>
      </div>
      {agent.model_usage.length === 0 ? (
        <p className="mt-2 text-[13px] text-neutral-500">No calls in this window.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {agent.model_usage.map((m) => (
            <li key={m.model} className="text-[12.5px]">
              <div className="flex items-center justify-between gap-3">
                <span className={cn("truncate font-mono", m.permitted ? "text-neutral-200" : "text-red-300")}>
                  {m.model}
                </span>
                <span className="shrink-0 tabular-nums text-neutral-400">
                  {formatCurrency(m.cost)}
                  <span className="text-neutral-600"> · {formatNumber(m.calls)} calls</span>
                </span>
              </div>
              <div className="mt-1">
                <UsageBar pct={(m.cost / totalCost) * 100} bad={!m.permitted} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RunsPanel({
  agent,
  onSuggest,
}: {
  agent: AgentCompliance;
  onSuggest: (stats: RunStats) => void;
}) {
  const s = agent.run_stats;
  if (!s) {
    return (
      <div>
        <Label>Per run</Label>
        <p className="mt-2 text-[13px] text-neutral-500">
          No runs seen. Wrap a run in <code className="text-neutral-400">track_costs.workflow()</code> to judge
          per-run limits.
        </p>
      </div>
    );
  }
  const rows: { label: string; p50: string; p95: string; max: string; limit: string | null; over: boolean }[] = [
    {
      label: "Tool calls",
      p50: String(s.p50_tool_calls),
      p95: String(s.p95_tool_calls),
      max: String(s.max_tool_calls),
      limit: agent.max_tool_calls_per_run !== null ? String(agent.max_tool_calls_per_run) : null,
      over: agent.max_tool_calls_per_run !== null && s.max_tool_calls > agent.max_tool_calls_per_run,
    },
    {
      label: "Cost",
      p50: formatCurrency(s.p50_cost),
      p95: formatCurrency(s.p95_cost),
      max: formatCurrency(s.max_cost),
      limit: agent.max_cost_per_run_usd !== null ? formatCurrency(agent.max_cost_per_run_usd) : null,
      over: agent.max_cost_per_run_usd !== null && s.max_cost > agent.max_cost_per_run_usd,
    },
  ];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>Per run</Label>
        <span className="text-[11.5px] text-neutral-600">{formatNumber(s.runs)} runs</span>
      </div>
      <table className="mt-2 w-full text-[12.5px] tabular-nums">
        <thead>
          <tr className="text-[11px] text-neutral-600">
            <th className="pb-1 text-left font-normal"></th>
            <th className="pb-1 text-right font-normal">p50</th>
            <th className="pb-1 text-right font-normal">p95</th>
            <th className="pb-1 text-right font-normal">max</th>
            <th className="pb-1 text-right font-normal">limit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-white/6">
              <td className="py-1.5 text-neutral-400">{r.label}</td>
              <td className="py-1.5 text-right text-neutral-300">{r.p50}</td>
              <td className="py-1.5 text-right text-neutral-300">{r.p95}</td>
              <td className={cn("py-1.5 text-right", r.over ? "text-red-300" : "text-neutral-200")}>{r.max}</td>
              <td className="py-1.5 text-right text-neutral-200">{r.limit ?? <span className="text-neutral-600">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(agent.max_tool_calls_per_run === null || agent.max_cost_per_run_usd === null) && (
        <button
          type="button"
          onClick={() => onSuggest(s)}
          className="mt-2 cursor-pointer text-[12px] text-neutral-400 underline decoration-white/20 underline-offset-2 hover:text-white"
        >
          Set limits from p95
        </button>
      )}
    </div>
  );
}

function BreachSeries({ agent }: { agent: AgentCompliance }) {
  if (agent.breach_series.length === 0) return null;
  const max = Math.max(1, ...agent.breach_series.map((d) => d.count));
  const total = agent.breach_series.reduce((s, d) => s + d.count, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>Breaches by day</Label>
        <span className="text-[11.5px] text-neutral-600">{formatNumber(total)} in window</span>
      </div>
      <div className="mt-3 flex h-12 items-end gap-1" role="img" aria-label="Breaching calls per day">
        {agent.breach_series.map((d) => (
          <span
            key={d.day}
            title={`${shortDay(d.day)}: ${formatNumber(d.count)}`}
            className="flex-1 rounded-sm bg-red-400/80"
            style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-neutral-600">
        <span>{shortDay(agent.breach_series[0].day)}</span>
        <span>{shortDay(agent.breach_series[agent.breach_series.length - 1].day)}</span>
      </div>
    </div>
  );
}

function BreachList({ agent }: { agent: AgentCompliance }) {
  if (agent.breaches.length === 0) return null;
  return (
    <ul className="divide-y divide-red-900/30 overflow-hidden rounded-lg border border-red-900/40">
      {agent.breaches.map((b) => (
        <li
          key={`${b.kind}-${b.subject}`}
          className="flex flex-col gap-1 bg-red-950/15 px-4 py-2.5 text-[13px] sm:flex-row sm:items-center sm:gap-4"
        >
          <ShieldAlert size={14} className="hidden shrink-0 text-red-400 sm:block" aria-hidden />
          <span className="text-red-200">{BREACH_COPY[b.kind]}</span>
          <span className="font-mono text-[12.5px] text-red-300/90">
            {RUN_KINDS.has(b.kind)
              ? `worst run ${b.subject.slice(0, 8)}… · ${
                  b.kind === "run_cost_over_limit" ? formatCurrency(b.observed ?? 0) : `${b.observed} calls`
                } vs limit ${b.kind === "run_cost_over_limit" ? formatCurrency(b.limit ?? 0) : b.limit}`
              : b.subject}
          </span>
          <span className="tabular-nums text-neutral-400 sm:ml-auto">
            {formatNumber(b.count)} {RUN_KINDS.has(b.kind) ? `run${b.count === 1 ? "" : "s"}` : `call${b.count === 1 ? "" : "s"}`}
            {b.last_seen && <span className="text-neutral-600"> · {relTime(b.last_seen)}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── Editor state ─────────────────────────────────────────────────────── */

interface EditorState {
  agent_name: string;
  restrictTools: boolean;
  toolsText: string;
  read_only: boolean;
  restrictModels: boolean;
  modelsText: string;
  maxToolCalls: string;
  maxCost: string;
  enabled: boolean;
  isNew: boolean;
}

function editorFor(agent?: AgentCompliance, name = ""): EditorState {
  const declared = agent && agent.status !== "no_guardrail";
  return {
    agent_name: agent?.agent_name ?? name,
    restrictTools: declared ? agent.allowed_tools !== null : false,
    toolsText: (agent?.allowed_tools ?? agent?.observed_tools ?? []).join(", "),
    read_only: agent?.read_only ?? false,
    restrictModels: declared ? agent.allowed_models !== null : false,
    modelsText: (agent?.allowed_models ?? agent?.observed_models ?? []).join(", "),
    maxToolCalls: agent?.max_tool_calls_per_run?.toString() ?? "",
    maxCost: agent?.max_cost_per_run_usd?.toString() ?? "",
    enabled: true,
    isNew: !declared,
  };
}

function splitList(text: string): string[] {
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default function GuardrailsPage() {
  const { isConfigured } = useApiConfiguration();
  const { activeProject } = useActiveProject();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<GuardrailComplianceResponse | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const projectId = activeProject?.id;

  const fetchData = useCallback(async () => {
    if (!api.hasProjectAccess()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await api.getGuardrailCompliance(timeRange));
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Escape closes the editor sheet.
  useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor]);

  const agents = useMemo(() => data?.agents ?? [], [data]);
  const observedTools = useMemo(
    () =>
      [
        ...new Set([
          ...agents.flatMap((a) => a.observed_tools),
          ...(data?.tool_tags ?? []).map((t) => t.tool_name),
        ]),
      ].sort(),
    [agents, data],
  );

  if (isConfigured === null) return <LoadingSpinner />;
  if (isConfigured === false) return <OnboardingScreen />;

  const breachCalls = agents
    .flatMap((a) => a.breaches)
    .filter((b) => !RUN_KINDS.has(b.kind))
    .reduce((s, b) => s + b.count, 0);
  const runsOver = agents
    .flatMap((a) => a.breaches)
    .filter((b) => RUN_KINDS.has(b.kind))
    .reduce((s, b) => s + b.count, 0);
  const covered = agents.filter((a) => a.status !== "no_guardrail").length;
  const coverage =
    data && data.total_calls > 0 ? Math.round((data.tool_tracked_calls / data.total_calls) * 100) : 0;
  const spendCovered = agents.filter((a) => a.status !== "no_guardrail").reduce((s, a) => s + a.total_cost, 0);
  const spendTotal = agents.reduce((s, a) => s + a.total_cost, 0);

  async function saveGuardrail() {
    if (!editor || !projectId) return;
    const name = editor.agent_name.trim();
    if (!name) {
      setError("Give the guardrail an agent name.");
      return;
    }
    const maxToolCalls = editor.maxToolCalls.trim() ? Number(editor.maxToolCalls) : null;
    const maxCost = editor.maxCost.trim() ? Number(editor.maxCost) : null;
    if (maxToolCalls !== null && (!Number.isInteger(maxToolCalls) || maxToolCalls < 1)) {
      setError("Tool calls per run must be a whole number of at least 1.");
      return;
    }
    if (maxCost !== null && (!Number.isFinite(maxCost) || maxCost <= 0)) {
      setError("Cost per run must be a positive amount.");
      return;
    }
    const payload: GuardrailPolicyInput = {
      agent_name: name,
      allowed_tools: editor.restrictTools ? splitList(editor.toolsText) : null,
      read_only: editor.read_only,
      allowed_models: editor.restrictModels ? splitList(editor.modelsText) : null,
      max_tool_calls_per_run: maxToolCalls,
      max_cost_per_run_usd: maxCost,
      enabled: editor.enabled,
    };
    setSaving(true);
    setError(null);
    try {
      await api.upsertGuardrail(projectId, payload);
      setEditor(null);
      await fetchData();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeGuardrail(agentName: string) {
    if (!projectId) return;
    setError(null);
    try {
      await api.deleteGuardrail(projectId, agentName);
      setEditor(null);
      await fetchData();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  async function setToolTag(toolName: string, access: "read" | "write" | null) {
    if (!projectId) return;
    setError(null);
    try {
      if (access === null) await api.deleteToolTag(projectId, toolName);
      else await api.upsertToolTag(projectId, { tool_name: toolName, access });
      await fetchData();
    } catch (err) {
      setError(parseApiError(err));
    }
  }

  const tagFor = (tool: string): "read" | "write" | null =>
    data?.tool_tags.find((t) => t.tool_name === tool)?.access ?? null;

  const canEdit = Boolean(projectId);

  /** Open the editor with per-run limits taken from the observed p95. */
  function suggestLimits(agent: AgentCompliance, stats: RunStats) {
    const base = editorFor(agent);
    setEditor({
      ...base,
      maxToolCalls: base.maxToolCalls || String(Math.max(1, Math.ceil(stats.p95_tool_calls))),
      maxCost: base.maxCost || String(Math.max(0.01, Math.ceil(stats.p95_cost * 100) / 100)),
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Guardrails</h1>
          <p className="mt-1 text-sm leading-relaxed text-neutral-400">
            Declare the boundary each agent should stay inside — which tools and
            models it may use, and how much a single run may do — and see, per
            agent, whether it did. Breaches alert owners and admins the moment
            they arrive. Spend limits for the whole project are a different
            control:{" "}
            <Link
              href="/settings#budget"
              className="text-neutral-200 underline decoration-white/30 underline-offset-2 hover:text-white"
            >
              Budget
            </Link>{" "}
            in Settings.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <button
            type="button"
            onClick={() => setEditor(editorFor(undefined, ""))}
            disabled={!canEdit}
            className={buttonPrimary}
            title={canEdit ? undefined : "Sign in with a member account to edit guardrails"}
          >
            <Plus size={14} />
            New guardrail
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Summary */}
      {!loading && data && (
        <StatBand
          items={[
            {
              label: "Breaching calls",
              value: formatNumber(breachCalls),
              tone: breachCalls > 0 ? "bad" : "default",
              sub: "Tool or model outside a boundary",
            },
            {
              label: "Runs over a limit",
              value: formatNumber(runsOver),
              tone: runsOver > 0 ? "bad" : "default",
              sub: "Tool calls or cost per run",
            },
            {
              label: "Agents covered",
              value: (
                <>
                  {covered}
                  <span className="text-base font-normal text-neutral-500"> / {agents.length}</span>
                </>
              ),
              sub:
                spendTotal > 0
                  ? `${Math.round((spendCovered / spendTotal) * 100)}% of spend under a guardrail`
                  : "With a guardrail declared",
            },
            {
              label: "Tool-call coverage",
              value: `${coverage}%`,
              sub: `${formatNumber(data.tool_tracked_calls)} of ${formatNumber(data.total_calls)} calls name a tool`,
            },
          ]}
        />
      )}

      {/* Agents */}
      <SectionCard
        title="Agents"
        description="Breaches first, then by spend. Open a row for what the agent used, how its runs are distributed, and every breach in the window."
      >
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={5} />
          </div>
        ) : agents.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <h3 className="text-[15px] font-semibold text-white">No agent activity in this window</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
              Once agents report events they appear here. You can declare a guardrail
              before the first event arrives with “New guardrail”.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {agents.map((agent) => {
              const open = expanded === agent.agent_name;
              const boundary = boundarySummary(agent);
              return (
                <div key={agent.agent_name}>
                  <div
                    className={cn(
                      "grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_auto]",
                      open && "bg-white/2",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : agent.agent_name)}
                      className="flex min-w-0 cursor-pointer items-center gap-3 text-left"
                      aria-expanded={open}
                    >
                      <ChevronDown
                        size={14}
                        className={cn("shrink-0 text-neutral-600 transition-transform", open && "rotate-180")}
                        aria-hidden
                      />
                      <span className="truncate text-[14px] font-medium text-white">{agent.agent_name}</span>
                    </button>

                    <span className="hidden items-center gap-2 text-[13px] sm:flex">
                      <StatusDot status={agent.status} />
                      <span
                        className={
                          agent.status === "breach"
                            ? "text-red-300"
                            : agent.status === "compliant"
                              ? "text-neutral-200"
                              : "text-neutral-500"
                        }
                      >
                        {statusLabel(agent)}
                      </span>
                    </span>

                    <span className="hidden truncate text-[12.5px] tabular-nums text-neutral-500 sm:block">
                      <span className="text-neutral-300">{formatCurrency(agent.total_cost)}</span> · {formatNumber(agent.total_calls)} calls
                      {agent.runs_seen > 0 && ` · ${formatNumber(agent.runs_seen)} runs`}
                    </span>

                    <span className="hidden truncate text-[13px] text-neutral-400 sm:block">
                      {boundary.length ? boundary.join(" · ") : "—"}
                    </span>

                    <span className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditor(editorFor(agent))}
                        disabled={!canEdit}
                        className={cn(buttonSecondary, "h-8 px-3 text-[12.5px]")}
                      >
                        {agent.status === "no_guardrail" ? "Declare" : "Edit"}
                      </button>
                    </span>

                    {/* Mobile status line */}
                    <span className="col-span-2 flex items-center gap-2 text-[12.5px] sm:hidden">
                      <StatusDot status={agent.status} />
                      <span className="text-neutral-300">{statusLabel(agent)}</span>
                      <span className="truncate text-neutral-500">
                        · {formatCurrency(agent.total_cost)} · {formatNumber(agent.total_calls)} calls
                      </span>
                    </span>
                  </div>

                  {open && (
                    <div className="space-y-5 border-t border-white/5 bg-white/1.5 px-5 py-5 sm:pl-12">
                      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-3">
                        <ToolsPanel agent={agent} />
                        <ModelsPanel agent={agent} />
                        <RunsPanel agent={agent} onSuggest={(stats) => suggestLimits(agent, stats)} />
                      </div>
                      {(agent.breach_series.length > 0 || agent.breaches.length > 0) && (
                        <div className="grid gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                          <BreachSeries agent={agent} />
                          <div>
                            <Label>Breaches</Label>
                            <div className="mt-2">
                              <BreachList agent={agent} />
                            </div>
                          </div>
                        </div>
                      )}
                      {agent.unknown_access_tools.length > 0 && (
                        <p className="text-[12.5px] text-neutral-400">
                          {agent.unknown_access_tools.length} observed tool
                          {agent.unknown_access_tools.length > 1 ? "s have" : " has"} no read/write tag (
                          {agent.unknown_access_tools.join(", ")}). Read-only compliance cannot judge them
                          until they are tagged below.
                        </p>
                      )}
                      <p className="text-[12px] text-neutral-600">
                        {formatNumber(agent.tracked_tool_calls)} of {formatNumber(agent.total_calls)} calls name a
                        tool; only those can be judged against a tool boundary. Model boundaries see every call.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* Tool access tags */}
      <SectionCard
        title="Tool access"
        description="Tag each tool as read or write so a read-only guardrail knows what a breach is. Untagged tools are reported as unknown, never silently judged."
      >
        {observedTools.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">No instrumented tools observed yet.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {observedTools.map((tool) => (
              <div key={tool} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <span className="truncate font-mono text-[13px] text-neutral-200">{tool}</span>
                <Segmented<"read" | "write" | null>
                  label={`Access for ${tool}`}
                  value={tagFor(tool)}
                  onChange={(v) => setToolTag(tool, v)}
                  options={[
                    { value: null, label: "Untagged" },
                    { value: "read", label: "Read" },
                    { value: "write", label: "Write" },
                  ]}
                />
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* How it is judged */}
      <SectionCard title="How compliance is judged">
        <ul className="grid gap-x-8 gap-y-3 px-5 py-4 text-[13px] leading-relaxed text-neutral-400 sm:grid-cols-3">
          <li>
            <span className="text-neutral-200">Tools</span> are judged on calls wrapped in{" "}
            <code className="text-neutral-300">track_costs.tool(&quot;name&quot;)</code>, with or without a{" "}
            <code className="text-neutral-300">workflow()</code> from SDK 0.2.2. Anything not instrumented is
            invisible, which is why coverage sits next to every verdict.
          </li>
          <li>
            <span className="text-neutral-200">Models</span> are judged on every call. Per-run limits are judged
            over calls that share a run, so they need{" "}
            <code className="text-neutral-300">track_costs.workflow()</code> around the run. The per-run table
            shows p50, p95 and max so a limit can be set from what the agent actually does.
          </li>
          <li>
            <span className="text-neutral-200">Breaches alert, they do not block.</span> Owners and admins get a
            notification and the project webhook receives{" "}
            <code className="text-neutral-300">guardrail.breach</code>, once per agent, subject and kind per
            hour. Blocking at the call site is on the SDK roadmap.
          </li>
        </ul>
      </SectionCard>

      {/* Editor sheet */}
      {editor && (
        <div className="fixed inset-0 z-60">
          <button
            type="button"
            aria-label="Close editor"
            onClick={() => setEditor(null)}
            className="absolute inset-0 cursor-default bg-black/60"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="guardrail-editor-title"
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-white/10 bg-[#0c0c0e] shadow-2xl"
          >
            <header className="flex items-start justify-between border-b border-white/6 px-5 py-4">
              <div>
                <h2 id="guardrail-editor-title" className="text-[15px] font-semibold text-white">
                  {editor.isNew ? "New guardrail" : "Edit guardrail"}
                </h2>
                <p className="mt-0.5 text-[12.5px] text-neutral-500">Leave a section on “Any” to keep it unbounded.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditor(null)}
                className="cursor-pointer rounded-md p-1 text-neutral-500 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
              {/* Agent */}
              <div>
                <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">Agent</label>
                {editor.isNew ? (
                  <div className="mt-2 space-y-2">
                    <FilterMenu
                      label="Agent"
                      value={agents.some((a) => a.agent_name === editor.agent_name) ? editor.agent_name : NEW_AGENT}
                      options={[NEW_AGENT, ...agents.filter((a) => a.status === "no_guardrail").map((a) => a.agent_name)]}
                      format={(v) => (v === NEW_AGENT ? "Type a name…" : v)}
                      searchable={agents.length > 6}
                      onChange={(v) =>
                        setEditor({
                          ...editorFor(agents.find((a) => a.agent_name === v), v === NEW_AGENT ? "" : v),
                          isNew: true,
                        })
                      }
                    />
                    {!agents.some((a) => a.agent_name === editor.agent_name) && (
                      <input
                        type="text"
                        value={editor.agent_name}
                        onChange={(e) => setEditor({ ...editor, agent_name: e.target.value })}
                        placeholder="exactly as passed to track_costs.agent()"
                        className={monoFieldClass}
                        autoFocus
                      />
                    )}
                  </div>
                ) : (
                  <p className="mt-2 font-mono text-[14px] text-white">{editor.agent_name}</p>
                )}
              </div>

              {/* Tools */}
              <fieldset>
                <div className="flex items-center justify-between">
                  <legend className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">Tools</legend>
                  <Segmented<"any" | "only">
                    label="Tool boundary"
                    value={editor.restrictTools ? "only" : "any"}
                    onChange={(v) => setEditor({ ...editor, restrictTools: v === "only" })}
                    options={[
                      { value: "any", label: "Any" },
                      { value: "only", label: "Only these" },
                    ]}
                  />
                </div>
                {editor.restrictTools && (
                  <input
                    type="text"
                    value={editor.toolsText}
                    onChange={(e) => setEditor({ ...editor, toolsText: e.target.value })}
                    placeholder="web_search, search_docs"
                    className={cn(monoFieldClass, "mt-2")}
                  />
                )}
                <div className="mt-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[13px] text-neutral-200">Read-only</p>
                    <p className="text-[12px] text-neutral-500">Any write-tagged tool becomes a breach.</p>
                  </div>
                  <Toggle label="Read-only agent" checked={editor.read_only} onChange={(v) => setEditor({ ...editor, read_only: v })} />
                </div>
              </fieldset>

              {/* Models */}
              <fieldset>
                <div className="flex items-center justify-between">
                  <legend className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">Models</legend>
                  <Segmented<"any" | "only">
                    label="Model boundary"
                    value={editor.restrictModels ? "only" : "any"}
                    onChange={(v) => setEditor({ ...editor, restrictModels: v === "only" })}
                    options={[
                      { value: "any", label: "Any" },
                      { value: "only", label: "Only these" },
                    ]}
                  />
                </div>
                {editor.restrictModels && (
                  <input
                    type="text"
                    value={editor.modelsText}
                    onChange={(e) => setEditor({ ...editor, modelsText: e.target.value })}
                    placeholder="gpt-4o-mini, claude-sonnet-4"
                    className={cn(monoFieldClass, "mt-2")}
                  />
                )}
              </fieldset>

              {/* Per-run limits */}
              <fieldset>
                <legend className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">Per run</legend>
                <p className="mt-1 text-[12px] text-neutral-500">
                  Judged over calls that share a <code className="text-neutral-400">workflow()</code>. Blank means no limit.
                </p>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[12.5px] text-neutral-300">Max tool calls</span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={editor.maxToolCalls}
                      onChange={(e) => setEditor({ ...editor, maxToolCalls: e.target.value })}
                      placeholder="e.g. 8"
                      className={cn(fieldClass, "mt-1 tabular-nums")}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[12.5px] text-neutral-300">Max cost (USD)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      inputMode="decimal"
                      value={editor.maxCost}
                      onChange={(e) => setEditor({ ...editor, maxCost: e.target.value })}
                      placeholder="e.g. 0.25"
                      className={cn(fieldClass, "mt-1 tabular-nums")}
                    />
                  </label>
                </div>
              </fieldset>

              <div className="flex items-center justify-between gap-4 border-t border-white/6 pt-4">
                <div>
                  <p className="text-[13px] text-neutral-200">Enabled</p>
                  <p className="text-[12px] text-neutral-500">Off keeps the policy but stops judging.</p>
                </div>
                <Toggle label="Guardrail enabled" checked={editor.enabled} onChange={(v) => setEditor({ ...editor, enabled: v })} />
              </div>
            </div>

            <footer className="flex items-center justify-between gap-3 border-t border-white/6 px-5 py-4">
              {!editor.isNew ? (
                <button type="button" onClick={() => removeGuardrail(editor.agent_name)} className={buttonDanger}>
                  Remove
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setEditor(null)} className={buttonSecondary}>
                  Cancel
                </button>
                <button type="button" onClick={saveGuardrail} disabled={saving || !canEdit} className={buttonPrimary}>
                  {saving ? "Saving…" : "Save guardrail"}
                </button>
              </div>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}
