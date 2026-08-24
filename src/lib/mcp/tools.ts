/**
 * The tools the AgentCost MCP server exposes.
 *
 * Every handler reads the same cached catalogue the public API serves, and
 * the estimator is the same pure module /api/v1/estimate uses — so an MCP
 * client and an HTTP client can never be quoted different prices.
 *
 * Each tool returns BOTH `structuredContent` (typed, matching `outputSchema`)
 * and a human-readable text block. The spec asks for the text block for
 * backwards compatibility, and it is also what a model reads when a client
 * does not surface structured content.
 */

import { fetchRawCatalog } from "@/lib/catalog";
import {
  EstimateInputError,
  estimate,
  parseEstimateRequest,
  resolveModel,
  type CatalogRates,
} from "@/lib/estimate";

export type McpTool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
};

export type ToolResult = {
  content: { type: "text"; text: string }[];
  structuredContent?: unknown;
  isError?: boolean;
};

/** Every tool here only reads public data — worth telling the client. */
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: true };

const RATE_PROPERTIES = {
  model: { type: "string", description: "Catalogue name for the model." },
  provider: { type: "string", description: "Provider slug, e.g. openai, anthropic, google." },
  input: { type: ["number", "null"], description: "USD per 1,000 input tokens." },
  output: { type: ["number", "null"], description: "USD per 1,000 output tokens." },
  cached_input: {
    type: ["number", "null"],
    description:
      "USD per 1,000 cached input tokens. null means the provider publishes no cached rate, so cached tokens bill at the full input rate.",
  },
  cache_write: { type: ["number", "null"], description: "USD per 1,000 tokens written to the prompt cache." },
  mode: { type: ["string", "null"], description: "Modality: chat, embedding, image_generation, ..." },
  deprecation_date: {
    type: ["string", "null"],
    description: "Announced retirement date, YYYY-MM-DD. null if none announced.",
  },
} as const;

export const TOOLS: McpTool[] = [
  {
    name: "list_models",
    title: "List model pricing",
    description:
      "Search the public AgentCost catalogue of LLM models and their per-1,000-token rates. " +
      "Filter by provider and/or a substring of the model name. Use this to compare model costs " +
      "or find a cheaper alternative. Returns rates in USD; no credentials required.",
    inputSchema: {
      type: "object",
      properties: {
        provider: {
          type: "string",
          description: "Provider slug to filter by, e.g. openai, anthropic, google, aws, azure.",
        },
        query: {
          type: "string",
          description: "Case-insensitive substring to match against the model name, e.g. 'sonnet' or 'gpt-4'.",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 200,
          default: 25,
          description: "Maximum models to return. Results are sorted cheapest-input-first.",
        },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        models: { type: "array", items: { type: "object", properties: RATE_PROPERTIES } },
        returned: { type: "integer", description: "How many models this result contains." },
        matched: { type: "integer", description: "How many models matched before the limit was applied." },
      },
      required: ["models", "returned", "matched"],
    },
    annotations: READ_ONLY,
  },

  {
    name: "get_model_pricing",
    title: "Get pricing for one model",
    description:
      "Look up the per-1,000-token rates for a single named model. Resolves the name exactly, " +
      "then case-insensitively, then by provider-prefixed suffix (so 'gpt-4o' finds 'azure/gpt-4o'). " +
      "Use this when you already know which model you are pricing.",
    inputSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
          minLength: 1,
          description: "Model name as the provider spells it, e.g. gpt-4o or claude-sonnet-4-6.",
        },
      },
      required: ["model"],
      additionalProperties: false,
    },
    outputSchema: { type: "object", properties: { ...RATE_PROPERTIES, matched_to: { type: "string" } } },
    annotations: READ_ONLY,
  },

  {
    name: "estimate_cost",
    title: "Estimate what a call will cost",
    description:
      "Work out the USD cost of one or more LLM calls before making them, from the current catalogue. " +
      "Give a model and the token counts involved. Use `calls` to price a whole job rather than a single call. " +
      "Cached input tokens bill at the provider's cached rate when one is published and at the full input " +
      "rate when it is not; the result reports which happened.",
    inputSchema: {
      type: "object",
      properties: {
        model: { type: "string", minLength: 1, description: "Model name, e.g. gpt-4o." },
        input_tokens: { type: "integer", minimum: 0, description: "Prompt tokens per call." },
        output_tokens: { type: "integer", minimum: 0, description: "Completion tokens per call." },
        cached_input_tokens: {
          type: "integer",
          minimum: 0,
          default: 0,
          description: "Prompt tokens served from the provider's cache, per call.",
        },
        cache_write_tokens: {
          type: "integer",
          minimum: 0,
          default: 0,
          description: "Tokens written into the prompt cache, per call.",
        },
        calls: {
          type: "integer",
          minimum: 1,
          default: 1,
          description: "How many identical calls to price. Use this to cost a whole job.",
        },
      },
      required: ["model", "input_tokens", "output_tokens"],
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        model: { type: "string" },
        matched_to: { type: "string" },
        provider: { type: "string" },
        total_cost: { type: "number", description: "Total USD cost for all calls." },
        currency: { type: "string", enum: ["USD"] },
        cost_per_call: { type: "object" },
        rates_per_1k: { type: "object" },
        tokens: { type: "object" },
        cached_billed_at_input_rate: { type: "boolean" },
      },
      required: ["model", "total_cost", "currency"],
    },
    annotations: READ_ONLY,
  },

  {
    name: "list_model_deprecations",
    title: "List announced model retirements",
    description:
      "List models with an upstream-announced retirement date, soonest first. Use this to check whether " +
      "a model a user depends on is being retired, or to avoid recommending one that is.",
    inputSchema: {
      type: "object",
      properties: {
        provider: { type: "string", description: "Optional provider slug to filter by." },
        limit: { type: "integer", minimum: 1, maximum: 200, default: 50 },
      },
      additionalProperties: false,
    },
    outputSchema: {
      type: "object",
      properties: {
        deprecations: { type: "array", items: { type: "object" } },
        returned: { type: "integer" },
        matched: { type: "integer" },
      },
      required: ["deprecations", "returned", "matched"],
    },
    annotations: READ_ONLY,
  },
];

export const TOOLS_BY_NAME = new Map(TOOLS.map((tool) => [tool.name, tool]));

type CatalogEntry = CatalogRates & { mode?: string | null; deprecation_date?: string | null };

/** A tool failure the model can act on — reported in-band, not as a protocol error. */
function toolError(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

function ok(text: string, structured: unknown): ToolResult {
  return { content: [{ type: "text", text }], structuredContent: structured };
}

function money(value: number): string {
  if (value === 0) return "$0";
  if (value < 0.01) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(2)}`;
}

function toRow(name: string, entry: CatalogEntry) {
  return {
    model: name,
    provider: entry.provider ?? "unknown",
    input: entry.input ?? null,
    output: entry.output ?? null,
    cached_input: entry.cached_input ?? null,
    cache_write: entry.cache_write ?? null,
    mode: entry.mode ?? null,
    deprecation_date: entry.deprecation_date ?? null,
  };
}

const CATALOG_UNAVAILABLE =
  "The AgentCost pricing catalogue is temporarily unreachable. The upstream host wakes from idle in about a minute — retry shortly.";

async function loadCatalog(): Promise<Record<string, CatalogEntry> | null> {
  const payload = await fetchRawCatalog();
  return (payload?.pricing as Record<string, CatalogEntry> | undefined) ?? null;
}

function clampLimit(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(200, Math.max(1, Math.floor(value)));
}

export async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<ToolResult> {
  switch (name) {
    case "list_models":
      return listModels(args);
    case "get_model_pricing":
      return getModelPricing(args);
    case "estimate_cost":
      return estimateCost(args);
    case "list_model_deprecations":
      return listDeprecations(args);
    default:
      return toolError(`Unknown tool: ${name}`);
  }
}

async function listModels(args: Record<string, unknown>): Promise<ToolResult> {
  const catalog = await loadCatalog();
  if (!catalog) return toolError(CATALOG_UNAVAILABLE);

  const provider = typeof args.provider === "string" ? args.provider.toLowerCase() : null;
  const query = typeof args.query === "string" ? args.query.toLowerCase() : null;
  const limit = clampLimit(args.limit, 25);

  const matched = Object.entries(catalog)
    .filter(([modelName, entry]) => {
      if (provider && (entry.provider ?? "").toLowerCase() !== provider) return false;
      if (query && !modelName.toLowerCase().includes(query)) return false;
      return true;
    })
    .map(([modelName, entry]) => toRow(modelName, entry))
    // Cheapest input first: the usual reason to list models is to find a cheaper one.
    .sort((a, b) => (a.input ?? Infinity) - (b.input ?? Infinity));

  const models = matched.slice(0, limit);

  if (models.length === 0) {
    return toolError(
      `No models matched${provider ? ` provider '${provider}'` : ""}${query ? ` query '${query}'` : ""}. ` +
        "Try a broader query, or omit the provider filter to search the whole catalogue.",
    );
  }

  const lines = models.map(
    (row) =>
      `${row.model} (${row.provider}) — in ${money(row.input ?? 0)}/1k, out ${money(row.output ?? 0)}/1k` +
      (row.deprecation_date ? ` — retiring ${row.deprecation_date}` : ""),
  );

  const header =
    matched.length > models.length
      ? `${models.length} of ${matched.length} matching models, cheapest input first:`
      : `${models.length} matching models, cheapest input first:`;

  return ok([header, ...lines].join("\n"), {
    models,
    returned: models.length,
    matched: matched.length,
  });
}

async function getModelPricing(args: Record<string, unknown>): Promise<ToolResult> {
  const model = typeof args.model === "string" ? args.model.trim() : "";
  if (!model) return toolError('The "model" argument is required and must be a non-empty string.');

  const catalog = await loadCatalog();
  if (!catalog) return toolError(CATALOG_UNAVAILABLE);

  const match = resolveModel(catalog, model);
  if (!match) {
    return toolError(
      `"${model}" is not in the AgentCost catalogue. Use list_models with a query to find the right name — ` +
        "catalogue names match the provider's own identifier, e.g. gpt-4o or claude-sonnet-4-6.",
    );
  }

  const row = toRow(match.name, match.rates as CatalogEntry);
  const structured = { ...row, matched_to: match.name };

  const text = [
    `${match.name} (${row.provider})`,
    `  input        ${money(row.input ?? 0)} per 1,000 tokens`,
    `  output       ${money(row.output ?? 0)} per 1,000 tokens`,
    `  cached input ${row.cached_input === null ? "not published — cached tokens bill at the full input rate" : `${money(row.cached_input)} per 1,000 tokens`}`,
    row.deprecation_date ? `  retiring     ${row.deprecation_date}` : null,
    match.name !== model ? `  (resolved from "${model}")` : null,
  ]
    .filter(Boolean)
    .join("\n");

  return ok(text, structured);
}

async function estimateCost(args: Record<string, unknown>): Promise<ToolResult> {
  let parsed;
  try {
    parsed = parseEstimateRequest(args);
  } catch (caught) {
    if (caught instanceof EstimateInputError) return toolError(caught.message);
    throw caught;
  }

  const catalog = await loadCatalog();
  if (!catalog) return toolError(CATALOG_UNAVAILABLE);

  const match = resolveModel(catalog, parsed.model);
  if (!match) {
    return toolError(
      `"${parsed.model}" is not in the AgentCost catalogue, so it cannot be priced. ` +
        "Use list_models with a query to find the right name.",
    );
  }

  const answer = estimate(parsed, match.name, match.rates);

  const text = [
    `${money(answer.total_cost)} for ${answer.calls.toLocaleString("en-US")} call${answer.calls === 1 ? "" : "s"} to ${answer.matched_to}.`,
    "",
    `  per call     ${money(answer.cost_per_call.total)}`,
    `    input      ${money(answer.cost_per_call.input_cost)} (${answer.tokens.input.toLocaleString("en-US")} tokens @ ${money(answer.rates_per_1k.input)}/1k)`,
    `    output     ${money(answer.cost_per_call.output_cost)} (${answer.tokens.output.toLocaleString("en-US")} tokens @ ${money(answer.rates_per_1k.output)}/1k)`,
    answer.tokens.cached_input > 0
      ? `    cached     ${money(answer.cost_per_call.cached_input_cost)} (${answer.tokens.cached_input.toLocaleString("en-US")} tokens)`
      : null,
    answer.cached_billed_at_input_rate
      ? `\n  Note: ${answer.provider} publishes no cached-input rate, so cached tokens were billed at the full input rate.`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return ok(text, answer);
}

async function listDeprecations(args: Record<string, unknown>): Promise<ToolResult> {
  const catalog = await loadCatalog();
  if (!catalog) return toolError(CATALOG_UNAVAILABLE);

  const provider = typeof args.provider === "string" ? args.provider.toLowerCase() : null;
  const limit = clampLimit(args.limit, 50);

  const matched = Object.entries(catalog)
    .filter(([, entry]) => Boolean(entry.deprecation_date))
    .filter(([, entry]) => !provider || (entry.provider ?? "").toLowerCase() === provider)
    .map(([modelName, entry]) => toRow(modelName, entry))
    .sort((a, b) => String(a.deprecation_date).localeCompare(String(b.deprecation_date)));

  const deprecations = matched.slice(0, limit);

  if (deprecations.length === 0) {
    return ok(
      provider
        ? `No models from ${provider} have an announced retirement date.`
        : "No models in the catalogue have an announced retirement date.",
      { deprecations: [], returned: 0, matched: 0 },
    );
  }

  const lines = deprecations.map(
    (row) => `${row.deprecation_date}  ${row.model} (${row.provider})`,
  );

  return ok(
    [`${deprecations.length} of ${matched.length} models with announced retirement dates, soonest first:`, ...lines].join("\n"),
    { deprecations, returned: deprecations.length, matched: matched.length },
  );
}
