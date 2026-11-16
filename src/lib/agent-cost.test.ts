import { describe, expect, it } from "vitest";

import type { ModelPricing } from "./catalog";
import {
  FEATURED_MODELS,
  SCENARIOS,
  calculatorModels,
  featuredModels,
  formatUsd,
  monthlyCost,
  runCost,
  runTokens,
} from "./agent-cost";

const rates = { model_name: "m", provider: "openai", input: 0.002, output: 0.01, cached_input: 0.0002 };

function model(overrides: Partial<ModelPricing>): ModelPricing {
  return {
    model_name: "x",
    provider: "openai",
    input: 0.001,
    output: 0.002,
    cached_input: null,
    mode: "chat",
    deprecation_date: null,
    ...overrides,
  };
}

describe("runTokens", () => {
  it("re-sends the base every step and grows context triangularly", () => {
    const t = runTokens({ steps: 3, baseInputTokens: 1000, growthPerStep: 100, outputPerStep: 50, cachePrefix: false });
    // steps 1..3 see 0, 100, 200 tokens of growth
    expect(t.growthInput).toBe(300);
    expect(t.input).toBe(3 * 1000 + 300);
    expect(t.output).toBe(150);
    expect(t.cachedInput).toBe(0);
  });

  it("caches the prefix on every step after the first", () => {
    const t = runTokens({ steps: 3, baseInputTokens: 1000, growthPerStep: 0, outputPerStep: 0, cachePrefix: true });
    expect(t.cachedInput).toBe(2000);
    expect(t.uncachedInput).toBe(1000);
  });

  it("treats bad input as zero instead of producing NaN", () => {
    const t = runTokens({ steps: Number.NaN, baseInputTokens: -5, growthPerStep: 10, outputPerStep: 10, cachePrefix: true });
    expect(t.input).toBe(0);
    expect(t.output).toBe(0);
  });
});

describe("runCost", () => {
  it("prices per 1,000 tokens", () => {
    const c = runCost({ steps: 1, baseInputTokens: 1000, growthPerStep: 0, outputPerStep: 1000, cachePrefix: false }, rates);
    expect(c.inputCost).toBeCloseTo(0.002);
    expect(c.outputCost).toBeCloseTo(0.01);
    expect(c.total).toBeCloseTo(0.012);
  });

  it("bills cached tokens at the input rate when no cached rate is published", () => {
    const w = { steps: 2, baseInputTokens: 1000, growthPerStep: 0, outputPerStep: 0, cachePrefix: true };
    const c = runCost(w, { ...rates, cached_input: null });
    expect(c.cachedBilledAtInputRate).toBe(true);
    expect(c.total).toBeCloseTo(runCost({ ...w, cachePrefix: false }, { ...rates, cached_input: null }).total);
  });

  it("makes caching cheaper when a cached rate exists", () => {
    const w = SCENARIOS[2].workload;
    expect(runCost({ ...w, cachePrefix: true }, rates).total).toBeLessThan(runCost(w, rates).total);
  });
});

describe("monthlyCost", () => {
  it("is per-run x runs/day x 30", () => {
    expect(monthlyCost(0.5, 100)).toBe(1500);
  });
});

describe("model lists", () => {
  const today = "2026-11-16";

  it("keeps featured order and drops missing or retired models", () => {
    const catalog = [
      model({ model_name: FEATURED_MODELS[1] }),
      model({ model_name: FEATURED_MODELS[0] }),
      model({ model_name: FEATURED_MODELS[2], deprecation_date: "2026-01-01" }),
    ];
    expect(featuredModels(catalog, today).map((m) => m.model_name)).toEqual([
      FEATURED_MODELS[0],
      FEATURED_MODELS[1],
    ]);
  });

  it("offers first-party chat models without snapshots, gateways or retired models", () => {
    const catalog = [
      model({ model_name: "gpt-5.6" }),
      model({ model_name: "gpt-5.4-2026-03-17" }),
      model({ model_name: "claude-haiku-4-5-20251001", provider: "anthropic" }),
      model({ model_name: "databricks-gpt-5", provider: "databricks" }),
      model({ model_name: "text-embedding-3", mode: "embedding" }),
      model({ model_name: "gpt-old", deprecation_date: "2026-01-01" }),
      model({ model_name: "claude-opus-5", provider: "anthropic" }),
    ];
    expect(calculatorModels(catalog, today).map((m) => m.model_name)).toEqual([
      "claude-opus-5",
      "gpt-5.6",
    ]);
  });
});

describe("formatUsd", () => {
  it("keeps sub-cent precision and rounds large sums", () => {
    expect(formatUsd(0.00421)).toBe("$0.0042");
    expect(formatUsd(0.137)).toBe("$0.137");
    expect(formatUsd(12.345)).toBe("$12.35");
    expect(formatUsd(12400.4)).toBe("$12,400");
  });
});
