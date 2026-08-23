/**
 * Cost estimation over the public catalogue.
 *
 * Pure functions, no I/O, so the arithmetic is testable on its own. The formula
 * matches how AgentCost bills a real event: rates are per 1,000 tokens, cached
 * input tokens are charged at the cached rate when the provider publishes one
 * and at the full input rate when it does not.
 */

export type CatalogRates = {
  input?: number | null;
  output?: number | null;
  cached_input?: number | null;
  cache_write?: number | null;
  provider?: string | null;
};

export type EstimateRequest = {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens?: number;
  cache_write_tokens?: number;
  /** Multiply the whole estimate, e.g. 1,000 runs of the same step. */
  calls?: number;
};

export type EstimateBreakdown = {
  input_cost: number;
  output_cost: number;
  cached_input_cost: number;
  cache_write_cost: number;
};

export type Estimate = {
  model: string;
  matched_to: string;
  provider: string;
  calls: number;
  tokens: {
    input: number;
    output: number;
    cached_input: number;
    cache_write: number;
    total: number;
  };
  rates_per_1k: {
    input: number;
    output: number;
    cached_input: number | null;
    cache_write: number | null;
  };
  cost_per_call: EstimateBreakdown & { total: number };
  total_cost: number;
  currency: "USD";
  /** True when the provider publishes no cached rate, so cached tokens bill at full input rate. */
  cached_billed_at_input_rate: boolean;
};

export class EstimateInputError extends Error {}

const MAX_TOKENS = 100_000_000;
const MAX_CALLS = 10_000_000;

function requireCount(value: unknown, field: string, max: number, fallback = 0): number {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new EstimateInputError(`"${field}" must be a number.`);
  }
  if (value < 0) throw new EstimateInputError(`"${field}" cannot be negative.`);
  if (value > max) {
    throw new EstimateInputError(`"${field}" exceeds the maximum of ${max.toLocaleString("en-US")}.`);
  }
  return value;
}

/** Validate and normalise a request body into an EstimateRequest. */
export function parseEstimateRequest(body: unknown): EstimateRequest {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new EstimateInputError("Body must be a JSON object.");
  }

  const raw = body as Record<string, unknown>;
  const model = raw.model;
  if (typeof model !== "string" || model.trim() === "") {
    throw new EstimateInputError('"model" is required and must be a non-empty string.');
  }

  const calls = requireCount(raw.calls, "calls", MAX_CALLS, 1);
  if (calls < 1) throw new EstimateInputError('"calls" must be at least 1.');

  return {
    model: model.trim(),
    input_tokens: requireCount(raw.input_tokens, "input_tokens", MAX_TOKENS),
    output_tokens: requireCount(raw.output_tokens, "output_tokens", MAX_TOKENS),
    cached_input_tokens: requireCount(raw.cached_input_tokens, "cached_input_tokens", MAX_TOKENS),
    cache_write_tokens: requireCount(raw.cache_write_tokens, "cache_write_tokens", MAX_TOKENS),
    calls,
  };
}

/** Round to a cent-fraction fine enough for sub-cent per-call costs. */
function round(value: number): number {
  return Number(value.toFixed(10));
}

export function estimate(
  request: EstimateRequest,
  matchedTo: string,
  rates: CatalogRates,
): Estimate {
  const inputRate = rates.input ?? 0;
  const outputRate = rates.output ?? 0;
  const cachedRate = rates.cached_input ?? null;
  const writeRate = rates.cache_write ?? null;

  const cachedTokens = request.cached_input_tokens ?? 0;
  const writeTokens = request.cache_write_tokens ?? 0;
  const calls = request.calls ?? 1;

  // A null cached rate means the provider publishes none -- the SDK bills those
  // tokens at the full input rate. Treating null as 0 would report cached tokens
  // as free, which is the more dangerous way to be wrong.
  const effectiveCachedRate = cachedRate ?? inputRate;

  const perCall: EstimateBreakdown = {
    input_cost: round((request.input_tokens / 1000) * inputRate),
    output_cost: round((request.output_tokens / 1000) * outputRate),
    cached_input_cost: round((cachedTokens / 1000) * effectiveCachedRate),
    cache_write_cost: round((writeTokens / 1000) * (writeRate ?? 0)),
  };

  const perCallTotal = round(
    perCall.input_cost +
      perCall.output_cost +
      perCall.cached_input_cost +
      perCall.cache_write_cost,
  );

  return {
    model: request.model,
    matched_to: matchedTo,
    provider: rates.provider ?? "unknown",
    calls,
    tokens: {
      input: request.input_tokens,
      output: request.output_tokens,
      cached_input: cachedTokens,
      cache_write: writeTokens,
      total: request.input_tokens + request.output_tokens + cachedTokens + writeTokens,
    },
    rates_per_1k: {
      input: inputRate,
      output: outputRate,
      cached_input: cachedRate,
      cache_write: writeRate,
    },
    cost_per_call: { ...perCall, total: perCallTotal },
    total_cost: round(perCallTotal * calls),
    currency: "USD",
    cached_billed_at_input_rate: cachedTokens > 0 && cachedRate === null,
  };
}

/**
 * Find a catalogue entry for a requested model name.
 *
 * Exact match, then case-insensitive, then the shortest catalogue name whose
 * final path segment is the requested one — which is how a provider-prefixed
 * entry ("azure/gpt-4o") is found from a bare model name. Deliberately
 * conservative: a loose match here would quote the wrong price.
 */
export function resolveModel(
  pricing: Record<string, unknown>,
  requested: string,
): { name: string; rates: CatalogRates } | null {
  if (Object.prototype.hasOwnProperty.call(pricing, requested)) {
    return { name: requested, rates: pricing[requested] as CatalogRates };
  }

  const lowered = requested.toLowerCase();
  const names = Object.keys(pricing);

  const caseInsensitive = names.find((name) => name.toLowerCase() === lowered);
  if (caseInsensitive) {
    return { name: caseInsensitive, rates: pricing[caseInsensitive] as CatalogRates };
  }

  const suffixMatches = names
    .filter((name) => name.toLowerCase().endsWith(`/${lowered}`))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));

  if (suffixMatches.length > 0) {
    return { name: suffixMatches[0], rates: pricing[suffixMatches[0]] as CatalogRates };
  }

  return null;
}
