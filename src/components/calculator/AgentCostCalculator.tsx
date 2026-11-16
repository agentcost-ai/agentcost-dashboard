"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  SCENARIOS,
  type AgentWorkload,
  type ModelRates,
  formatTokens,
  formatUsd,
  monthlyCost,
  runCost,
} from "@/lib/agent-cost";
import { track } from "@/lib/analytics";

type Props = {
  models: ModelRates[];
  /** Models compared side by side under the result; a subset of `models` is fine. */
  compareModels: ModelRates[];
  defaultModel: string;
};

const field =
  "w-full rounded-md border border-white/8 bg-white/3 px-3 py-2 text-[15px] text-white tabular-nums focus:border-sky-400/50 focus:outline-none";

function NumberField({
  label,
  hint,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
}: {
  label: string;
  hint: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-neutral-200">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        className={`${field} mt-1.5`}
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(Number.isFinite(next) ? Math.min(Math.max(next, min), max) : 0);
        }}
      />
      <span className="mt-1 block text-[12px] leading-snug text-neutral-500">{hint}</span>
    </label>
  );
}

export function AgentCostCalculator({ models, compareModels, defaultModel }: Props) {
  const [scenarioId, setScenarioId] = useState<string>("research");
  const [workload, setWorkload] = useState<AgentWorkload>(SCENARIOS[1].workload);
  const [modelName, setModelName] = useState(defaultModel);
  const [runsPerDay, setRunsPerDay] = useState(1000);

  const selected = models.find((m) => m.model_name === modelName) ?? models[0];

  const result = useMemo(
    () => (selected ? runCost(workload, selected) : null),
    [workload, selected],
  );

  const comparison = useMemo(() => {
    const pool = compareModels.some((m) => m.model_name === selected?.model_name)
      ? compareModels
      : selected
        ? [selected, ...compareModels]
        : compareModels;
    const rows = pool.map((m) => ({ model: m, total: runCost(workload, m).total }));
    rows.sort((a, b) => a.total - b.total);
    return rows;
  }, [compareModels, selected, workload]);

  const maxTotal = comparison.reduce((max, row) => Math.max(max, row.total), 0);

  const providers = useMemo(() => {
    const groups = new Map<string, ModelRates[]>();
    for (const m of models) {
      const list = groups.get(m.provider) ?? [];
      list.push(m);
      groups.set(m.provider, list);
    }
    return [...groups.entries()];
  }, [models]);

  const update = (patch: Partial<AgentWorkload>) => {
    setScenarioId("custom");
    setWorkload((current) => ({ ...current, ...patch }));
  };

  if (!selected || !result) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/2 p-6 text-neutral-400">
        Live model pricing is temporarily unavailable. Reload in a minute, or read the rates
        from <Link href="/docs/models" className="text-sky-300 underline">the model catalog</Link>.
      </p>
    );
  }

  const growthShare = result.tokens.input > 0 ? result.tokens.growthInput / result.tokens.input : 0;
  const perMonth = monthlyCost(result.total, runsPerDay);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
      {/* Inputs */}
      <div className="rounded-2xl border border-white/10 bg-white/2 p-5 sm:p-6">
        <p className="text-[13px] font-medium text-neutral-200">Start from a typical agent</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setScenarioId(s.id);
                setWorkload(s.workload);
                track("calculator_scenario", { scenario: s.id });
              }}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                scenarioId === s.id
                  ? "border-sky-400/60 bg-sky-400/10 text-sky-200"
                  : "border-white/10 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <label className="mt-6 block">
          <span className="text-[13px] font-medium text-neutral-200">Model</span>
          <select
            className={`${field} mt-1.5`}
            value={selected.model_name}
            onChange={(event) => {
              setModelName(event.target.value);
              track("calculator_model", { model: event.target.value });
            }}
          >
            {providers.map(([provider, list]) => (
              <optgroup key={provider} label={provider}>
                {list.map((m) => (
                  <option key={m.model_name} value={m.model_name}>
                    {m.model_name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span className="mt-1 block text-[12px] text-neutral-500">
            ${(selected.input * 1000).toFixed(2)} in / ${(selected.output * 1000).toFixed(2)} out per
            1M tokens
            {selected.cached_input != null &&
              ` · cached $${(selected.cached_input * 1000).toFixed(3)}`}
          </span>
        </label>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <NumberField
            label="Steps per run"
            hint="LLM calls the agent makes to finish one task."
            value={workload.steps}
            max={500}
            onChange={(steps) => update({ steps })}
          />
          <NumberField
            label="Runs per day"
            hint="Tasks the agent handles daily."
            value={runsPerDay}
            max={10_000_000}
            step={100}
            onChange={setRunsPerDay}
          />
          <NumberField
            label="Base prompt tokens"
            hint="System prompt, tool schemas, task. Re-sent every step."
            value={workload.baseInputTokens}
            max={2_000_000}
            step={500}
            onChange={(baseInputTokens) => update({ baseInputTokens })}
          />
          <NumberField
            label="Context growth / step"
            hint="Tool results and prior output added each step."
            value={workload.growthPerStep}
            max={500_000}
            step={100}
            onChange={(growthPerStep) => update({ growthPerStep })}
          />
          <NumberField
            label="Output tokens / step"
            hint="What the model writes per call."
            value={workload.outputPerStep}
            max={200_000}
            step={50}
            onChange={(outputPerStep) => update({ outputPerStep })}
          />
          <label className="flex items-start gap-2.5 self-center pt-2">
            <input
              type="checkbox"
              className="mt-1 size-4 accent-sky-400"
              checked={workload.cachePrefix}
              onChange={(event) => update({ cachePrefix: event.target.checked })}
            />
            <span>
              <span className="block text-[13px] font-medium text-neutral-200">Prompt caching</span>
              <span className="block text-[12px] leading-snug text-neutral-500">
                Serve the base prompt from cache after step 1.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-sky-500/25 bg-sky-500/4 p-5 sm:p-6" aria-live="polite">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-sky-300/80">
            {selected.model_name}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-4">
            <div>
              <p className="text-[12px] text-neutral-500">Per run</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                {formatUsd(result.total)}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-neutral-500">Per day</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                {formatUsd(result.total * runsPerDay)}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-neutral-500">Per month</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-sky-200 sm:text-3xl">
                {formatUsd(perMonth)}
              </p>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-1.5 border-t border-white/8 pt-4 text-[13px] sm:grid-cols-4">
            <div>
              <dt className="text-neutral-500">Input tokens</dt>
              <dd className="tabular-nums text-neutral-200">{formatTokens(result.tokens.input)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Output tokens</dt>
              <dd className="tabular-nums text-neutral-200">{formatTokens(result.tokens.output)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Input cost</dt>
              <dd className="tabular-nums text-neutral-200">
                {formatUsd(result.inputCost + result.cachedInputCost)}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Output cost</dt>
              <dd className="tabular-nums text-neutral-200">{formatUsd(result.outputCost)}</dd>
            </div>
          </dl>

          {growthShare > 0.25 && (
            <p className="mt-4 text-[13px] leading-relaxed text-neutral-300">
              <span className="font-medium text-amber-300">{Math.round(growthShare * 100)}%</span> of
              the input you pay for is context re-sent from earlier steps. Each extra step costs more
              than the one before it.
            </p>
          )}
          {result.cachedBilledAtInputRate && (
            <p className="mt-3 text-[12px] text-neutral-500">
              {selected.model_name} publishes no cached-input rate, so caching saves nothing here.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/2 p-5 sm:p-6">
          <p className="text-[13px] font-medium text-neutral-200">Same agent, other models (per run)</p>
          <ul className="mt-4 space-y-2">
            {comparison.map(({ model, total }) => {
              const isSelected = model.model_name === selected.model_name;
              return (
                <li key={model.model_name}>
                  <button
                    type="button"
                    onClick={() => setModelName(model.model_name)}
                    className="group grid w-full grid-cols-[minmax(0,9.5rem)_1fr_auto] items-center gap-3 text-left"
                  >
                    <span
                      className={`truncate font-mono text-[12px] ${
                        isSelected ? "text-sky-200" : "text-neutral-400 group-hover:text-neutral-200"
                      }`}
                    >
                      {model.model_name}
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <span
                        className={`block h-full rounded-full ${isSelected ? "bg-sky-400" : "bg-neutral-600"}`}
                        style={{ width: `${maxTotal > 0 ? Math.max((total / maxTotal) * 100, 1.5) : 0}%` }}
                      />
                    </span>
                    <span
                      className={`w-16 text-right text-[12px] tabular-nums ${
                        isSelected ? "text-white" : "text-neutral-400"
                      }`}
                    >
                      {formatUsd(total)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl border border-white/10 bg-[#0b0b0d] p-5">
          <p className="min-w-0 flex-1 text-[14px] text-neutral-300">
            This is an estimate. AgentCost measures the real cost of every run, per agent.
          </p>
          <Link
            href="/auth/register"
            onClick={() => track("click_signup", { location: "calculator" })}
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#0a0a0b] hover:bg-neutral-200"
          >
            Track it free <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
