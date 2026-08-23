import { describe, expect, it } from "vitest";

import {
  EstimateInputError,
  estimate,
  parseEstimateRequest,
  resolveModel,
  type CatalogRates,
} from "./estimate";

const GPT4O: CatalogRates = {
  input: 0.0025,
  output: 0.01,
  cached_input: 0.00125,
  cache_write: null,
  provider: "openai",
};

const NO_CACHED_RATE: CatalogRates = {
  input: 0.003,
  output: 0.015,
  cached_input: null,
  cache_write: null,
  provider: "anthropic",
};

describe("parseEstimateRequest", () => {
  it("accepts a minimal body and defaults the optional counts", () => {
    const parsed = parseEstimateRequest({
      model: "gpt-4o",
      input_tokens: 1000,
      output_tokens: 500,
    });
    expect(parsed).toEqual({
      model: "gpt-4o",
      input_tokens: 1000,
      output_tokens: 500,
      cached_input_tokens: 0,
      cache_write_tokens: 0,
      calls: 1,
    });
  });

  it("trims the model name", () => {
    expect(parseEstimateRequest({ model: "  gpt-4o  " }).model).toBe("gpt-4o");
  });

  it("rejects a body that is not an object", () => {
    for (const body of ["nope", 42, null, [], undefined]) {
      expect(() => parseEstimateRequest(body)).toThrow(EstimateInputError);
    }
  });

  it("requires a non-empty model", () => {
    expect(() => parseEstimateRequest({ input_tokens: 1 })).toThrow(/model/);
    expect(() => parseEstimateRequest({ model: "   " })).toThrow(/model/);
    expect(() => parseEstimateRequest({ model: 7 })).toThrow(/model/);
  });

  it("rejects negative, non-numeric and absurd token counts", () => {
    expect(() => parseEstimateRequest({ model: "x", input_tokens: -1 })).toThrow(
      /cannot be negative/,
    );
    expect(() => parseEstimateRequest({ model: "x", input_tokens: "many" })).toThrow(
      /must be a number/,
    );
    expect(() => parseEstimateRequest({ model: "x", input_tokens: Infinity })).toThrow(
      /must be a number/,
    );
    expect(() =>
      parseEstimateRequest({ model: "x", input_tokens: 100_000_001 }),
    ).toThrow(/maximum/);
  });

  it("requires calls to be at least 1", () => {
    expect(() => parseEstimateRequest({ model: "x", calls: 0 })).toThrow(/at least 1/);
    expect(parseEstimateRequest({ model: "x", calls: 250 }).calls).toBe(250);
  });
});

describe("estimate", () => {
  it("prices input and output per 1,000 tokens", () => {
    const result = estimate(
      { model: "gpt-4o", input_tokens: 12000, output_tokens: 800 },
      "gpt-4o",
      GPT4O,
    );
    // 12 * 0.0025 = 0.03 ; 0.8 * 0.01 = 0.008
    expect(result.cost_per_call.input_cost).toBeCloseTo(0.03, 10);
    expect(result.cost_per_call.output_cost).toBeCloseTo(0.008, 10);
    expect(result.total_cost).toBeCloseTo(0.038, 10);
    expect(result.currency).toBe("USD");
    expect(result.provider).toBe("openai");
  });

  it("multiplies by the call count", () => {
    const result = estimate(
      { model: "gpt-4o", input_tokens: 1000, output_tokens: 1000, calls: 1000 },
      "gpt-4o",
      GPT4O,
    );
    expect(result.cost_per_call.total).toBeCloseTo(0.0125, 10);
    expect(result.total_cost).toBeCloseTo(12.5, 10);
  });

  it("bills cached tokens at the cached rate when one is published", () => {
    const result = estimate(
      {
        model: "gpt-4o",
        input_tokens: 0,
        output_tokens: 0,
        cached_input_tokens: 10000,
      },
      "gpt-4o",
      GPT4O,
    );
    expect(result.cost_per_call.cached_input_cost).toBeCloseTo(0.0125, 10);
    expect(result.cached_billed_at_input_rate).toBe(false);
  });

  it("bills cached tokens at the FULL input rate when none is published", () => {
    // Treating a null cached rate as zero would report cached tokens as free,
    // which is the more dangerous way to be wrong.
    const result = estimate(
      {
        model: "claude",
        input_tokens: 0,
        output_tokens: 0,
        cached_input_tokens: 10000,
      },
      "claude",
      NO_CACHED_RATE,
    );
    expect(result.cost_per_call.cached_input_cost).toBeCloseTo(0.03, 10);
    expect(result.cached_billed_at_input_rate).toBe(true);
  });

  it("does not flag the full-rate fallback when there are no cached tokens", () => {
    const result = estimate(
      { model: "claude", input_tokens: 100, output_tokens: 100 },
      "claude",
      NO_CACHED_RATE,
    );
    expect(result.cached_billed_at_input_rate).toBe(false);
  });

  it("treats a missing rate as zero rather than throwing", () => {
    const result = estimate(
      { model: "mystery", input_tokens: 1000, output_tokens: 1000 },
      "mystery",
      { provider: null },
    );
    expect(result.total_cost).toBe(0);
    expect(result.provider).toBe("unknown");
  });

  it("reports the rates and token totals it used", () => {
    const result = estimate(
      {
        model: "gpt-4o",
        input_tokens: 10,
        output_tokens: 20,
        cached_input_tokens: 30,
        cache_write_tokens: 40,
      },
      "azure/gpt-4o",
      GPT4O,
    );
    expect(result.matched_to).toBe("azure/gpt-4o");
    expect(result.tokens.total).toBe(100);
    expect(result.rates_per_1k).toEqual({
      input: 0.0025,
      output: 0.01,
      cached_input: 0.00125,
      cache_write: null,
    });
  });
});

describe("resolveModel", () => {
  const catalog = {
    "gpt-4o": GPT4O,
    "azure/gpt-4o-mini": GPT4O,
    "bedrock/us-east/gpt-4o-mini": GPT4O,
    "Claude-Sonnet-4-6": NO_CACHED_RATE,
  };

  it("prefers an exact match", () => {
    expect(resolveModel(catalog, "gpt-4o")?.name).toBe("gpt-4o");
  });

  it("falls back to a case-insensitive match", () => {
    expect(resolveModel(catalog, "claude-sonnet-4-6")?.name).toBe("Claude-Sonnet-4-6");
  });

  it("finds a provider-prefixed entry from a bare name, shortest first", () => {
    expect(resolveModel(catalog, "gpt-4o-mini")?.name).toBe("azure/gpt-4o-mini");
  });

  it("returns null rather than guessing", () => {
    expect(resolveModel(catalog, "gpt-5-ultra")).toBeNull();
    // A substring is not a match — that would quote the wrong price.
    expect(resolveModel(catalog, "gpt")).toBeNull();
  });

  it("is not fooled by inherited object properties", () => {
    expect(resolveModel(catalog, "toString")).toBeNull();
    expect(resolveModel(catalog, "constructor")).toBeNull();
  });
});
