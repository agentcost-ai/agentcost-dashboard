/**
 * What an AI agent run costs, from a workload shape and a model's rates.
 *
 * Pure, so the page, the calculator and the tests share one formula. Rates are
 * per 1,000 tokens, as everywhere else in AgentCost.
 *
 * The model is the one that actually drives agent bills: every step re-sends
 * the whole context, and the context grows by the previous step's tool results
 * and output. Input tokens therefore grow with the square of the step count:
 *
 *   input  = steps * base + growth * steps * (steps - 1) / 2
 *   output = steps * outputPerStep
 *
 * With prompt caching on, the stable prefix (`base`) is read from cache on
 * every step after the first. Cache-write premiums (charged by some providers
 * on the first step) are not included; on long runs they are a rounding error
 * next to the reads they save.
 */

import type { ModelPricing } from "@/lib/catalog";

export type AgentWorkload = {
  /** LLM calls in one run of the agent. */
  steps: number;
  /** System prompt, tool schemas and the task: re-sent on every step. */
  baseInputTokens: number;
  /** Tokens added to the context per step (tool results plus the previous output). */
  growthPerStep: number;
  /** Tokens the model generates per step. */
  outputPerStep: number;
  /** Whether the stable prefix is served from the provider's prompt cache. */
  cachePrefix: boolean;
};

export type ModelRates = Pick<
  ModelPricing,
  "model_name" | "provider" | "input" | "output" | "cached_input"
>;

export type RunTokens = {
  input: number;
  cachedInput: number;
  uncachedInput: number;
  output: number;
  /** Input tokens that exist only because earlier steps grew the context. */
  growthInput: number;
};

export type RunCost = {
  tokens: RunTokens;
  inputCost: number;
  cachedInputCost: number;
  outputCost: number;
  total: number;
  /** True when the model publishes no cached rate, so cached tokens bill at the input rate. */
  cachedBilledAtInputRate: boolean;
};

export type Scenario = {
  id: string;
  name: string;
  description: string;
  workload: AgentWorkload;
};

/**
 * Three shapes that cover most agents. Deliberately round numbers: they are
 * starting points for the calculator, stated as assumptions on the page.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "support",
    name: "Support agent",
    description: "Answers a ticket with a couple of lookups: 4 steps, small context.",
    workload: {
      steps: 4,
      baseInputTokens: 2_500,
      growthPerStep: 600,
      outputPerStep: 250,
      cachePrefix: false,
    },
  },
  {
    id: "research",
    name: "Research agent",
    description: "Searches, reads and summarises: 10 steps, large tool results.",
    workload: {
      steps: 10,
      baseInputTokens: 4_000,
      growthPerStep: 2_500,
      outputPerStep: 500,
      cachePrefix: false,
    },
  },
  {
    id: "coding",
    name: "Coding agent",
    description: "Reads files, edits, runs tests: 30 steps, big system prompt.",
    workload: {
      steps: 30,
      baseInputTokens: 15_000,
      growthPerStep: 3_000,
      outputPerStep: 700,
      cachePrefix: false,
    },
  },
];

/**
 * Current flagship and budget models from the providers people actually ask
 * about, in display order. A name missing from the catalogue (renamed or
 * retired) simply drops out of the table, so this list can lag safely; refresh
 * it when a provider ships a new generation.
 */
export const FEATURED_MODELS = [
  "claude-fable-5",
  "claude-opus-5",
  "claude-sonnet-5-5",
  "claude-haiku-5-5",
  "gpt-5.6",
  "gpt-5.5",
  "gpt-5.4-mini",
  "gpt-5.4-nano",
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "grok-4.5-latest",
  "deepseek-v4-pro",
  "deepseek-v4-flash",
];

/** First-party providers offered in the calculator's model picker. */
export const CALCULATOR_PROVIDERS = [
  "anthropic",
  "openai",
  "google",
  "xai",
  "deepseek",
  "mistral",
];

export const MONTH_DAYS = 30;

const clampCount = (value: number) =>
  Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;

export function runTokens(workload: AgentWorkload): RunTokens {
  const steps = clampCount(workload.steps);
  const base = clampCount(workload.baseInputTokens);
  const growth = clampCount(workload.growthPerStep);
  const out = clampCount(workload.outputPerStep);

  const growthInput = (growth * steps * (steps - 1)) / 2;
  const input = steps * base + growthInput;
  const cachedInput = workload.cachePrefix && steps > 1 ? base * (steps - 1) : 0;

  return {
    input,
    cachedInput,
    uncachedInput: input - cachedInput,
    output: steps * out,
    growthInput,
  };
}

export function runCost(workload: AgentWorkload, rates: ModelRates): RunCost {
  const tokens = runTokens(workload);
  const cachedRate = rates.cached_input ?? rates.input;

  const inputCost = (tokens.uncachedInput * rates.input) / 1000;
  const cachedInputCost = (tokens.cachedInput * cachedRate) / 1000;
  const outputCost = (tokens.output * rates.output) / 1000;

  return {
    tokens,
    inputCost,
    cachedInputCost,
    outputCost,
    total: inputCost + cachedInputCost + outputCost,
    cachedBilledAtInputRate: tokens.cachedInput > 0 && rates.cached_input == null,
  };
}

/** Monthly cost at a given number of runs per day. */
export function monthlyCost(perRun: number, runsPerDay: number): number {
  return perRun * clampCount(runsPerDay) * MONTH_DAYS;
}

function isRetired(model: Pick<ModelPricing, "deprecation_date">, today: string): boolean {
  return model.deprecation_date != null && model.deprecation_date <= today;
}

/** The featured models that exist in the catalogue and are not retired, in display order. */
export function featuredModels(catalog: ModelPricing[], today: string): ModelRates[] {
  const byName = new Map(catalog.map((m) => [m.model_name, m]));
  return FEATURED_MODELS.map((name) => byName.get(name))
    .filter((m): m is ModelPricing => m != null && m.input > 0 && !isRetired(m, today))
    .map(({ model_name, provider, input, output, cached_input }) => ({
      model_name,
      provider,
      input,
      output,
      cached_input,
    }));
}

// Dated snapshots ("-20251001", "-2025-04-14", "-0731") duplicate their alias.
const SNAPSHOT_SUFFIX = /-(\d{8}|\d{4}-\d{2}-\d{2}|\d{4})$/;

/**
 * The model picker's list: priced chat models from first-party providers,
 * without dated snapshots or retired models, sorted by provider then name.
 */
export function calculatorModels(catalog: ModelPricing[], today: string): ModelRates[] {
  return catalog
    .filter(
      (m) =>
        CALCULATOR_PROVIDERS.includes(m.provider) &&
        m.mode === "chat" &&
        m.input > 0 &&
        !m.model_name.includes("/") &&
        !SNAPSHOT_SUFFIX.test(m.model_name) &&
        !isRetired(m, today),
    )
    .map(({ model_name, provider, input, output, cached_input }) => ({
      model_name,
      provider,
      input,
      output,
      cached_input,
    }))
    .sort(
      (a, b) =>
        CALCULATOR_PROVIDERS.indexOf(a.provider) - CALCULATOR_PROVIDERS.indexOf(b.provider) ||
        a.model_name.localeCompare(b.model_name),
    );
}

/** "$0.0042", "$1.37", "$12,400": enough precision to compare sub-cent runs. */
export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0";
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(4)}`;
  if (value < 1) return `$${value.toFixed(3)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

export function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 10_000) return `${Math.round(value / 1000)}k`;
  return Math.round(value).toLocaleString("en-US");
}
