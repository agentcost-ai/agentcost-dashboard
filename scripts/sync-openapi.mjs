#!/usr/bin/env node
/**
 * Regenerate the published OpenAPI spec from the backend's own spec.
 *
 *   node scripts/sync-openapi.mjs                        # from the live API
 *   node scripts/sync-openapi.mjs --from http://localhost:8000
 *
 * Writes public/openapi.json and public/openapi.yaml, which are served at
 * /openapi.json and (via a rewrite) /api/openapi.yaml.
 *
 * The backend spec is the source of truth for every operation. This script only
 * adds what the backend cannot know: which host actually serves each path, and
 * the one endpoint that exists solely on the website mirror.
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const ORIGIN_SERVER = {
  url: "https://api.agentcost.tech",
  description: "AgentCost API (origin). Sleeps when idle; a cold request can take ~60s.",
};

const MIRROR_SERVER = {
  url: "https://agentcost.tech/api",
  description:
    "Cached mirror on the website. Serves the public read endpoints and the cost estimator, and does not sleep.",
};

/**
 * Paths the website mirror actually serves. Anything not listed gets a
 * path-level `servers` override pinning it to the origin, so the spec never
 * claims an operation is available somewhere it is not.
 */
const MIRRORED_PATHS = new Set([
  "/v1/health",
  "/v1/pricing",
  "/v1/pricing/{model_name}",
  "/v1/pricing/deprecations",
  "/v1/pricing/sync/status",
]);

/** Paths served ONLY by the mirror. */
const MIRROR_ONLY_PATHS = new Set(["/v1/estimate"]);

const TOKEN_COUNT_SCHEMA = (description) => ({
  type: "integer",
  format: "int64",
  minimum: 0,
  maximum: 100000000,
  default: 0,
  description,
});

/** The estimator, which is computed on the website from the cached catalogue. */
const ESTIMATE_PATH = {
  servers: [MIRROR_SERVER],
  post: {
    tags: ["Pricing"],
    operationId: "pricing_estimate_cost",
    summary: "Estimate the cost of a call",
    description:
      "Estimate what a model call will cost before making it, from the current public catalogue. " +
      "Rates are per 1,000 tokens in USD. Cached input tokens are billed at the provider's cached " +
      "rate when one is published and at the full input rate when it is not — `cached_billed_at_input_rate` " +
      "reports which happened. Multiply a single call out to a whole job with `calls`. " +
      "No credentials required.",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/EstimateRequest" },
          examples: {
            singleCall: {
              summary: "One call to gpt-4o",
              value: { model: "gpt-4o", input_tokens: 12000, output_tokens: 800 },
            },
            wholeJob: {
              summary: "1,000 runs of the same step, with a warm prompt cache",
              value: {
                model: "claude-sonnet-4-6",
                input_tokens: 2000,
                output_tokens: 400,
                cached_input_tokens: 18000,
                calls: 1000,
              },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "The estimate, with the rates and catalogue entry it was based on.",
        content: {
          "application/json": { schema: { $ref: "#/components/schemas/Estimate" } },
        },
      },
      404: {
        description: "The model is not in the catalogue.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      422: {
        description: "The request body failed validation.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
      503: {
        description: "The catalogue is temporarily unreachable.",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
      },
    },
  },
};

const EXTRA_SCHEMAS = {
  ApiError: {
    type: "object",
    title: "ApiError",
    description:
      "The error envelope every AgentCost endpoint returns. `error.code` is stable and safe to branch on; " +
      "`detail` repeats the message as a plain string for clients that read that field.",
    required: ["error", "detail"],
    properties: {
      error: {
        type: "object",
        required: ["code", "message", "hint", "status"],
        properties: {
          code: {
            type: "string",
            description: "Stable machine-readable code, e.g. not_found, validation_error, rate_limited.",
          },
          message: { type: "string", description: "What went wrong." },
          hint: { type: "string", description: "What to do about it." },
          status: { type: "integer", description: "The HTTP status, repeated in the body." },
          docs: { type: "string", format: "uri", description: "Where the endpoint is documented." },
          fields: {
            type: "array",
            description: "Present on validation errors: the fields that failed and why.",
            items: {
              type: "object",
              properties: {
                field: { type: "string" },
                message: { type: "string" },
                type: { type: "string" },
              },
            },
          },
        },
      },
      detail: { type: "string", description: "The same message as a plain string." },
    },
  },

  EstimateRequest: {
    type: "object",
    title: "EstimateRequest",
    required: ["model", "input_tokens", "output_tokens"],
    properties: {
      model: {
        type: "string",
        minLength: 1,
        description:
          "Model name as the provider spells it, e.g. gpt-4o or claude-sonnet-4-6. Resolved against the catalogue exactly, then case-insensitively, then by provider-prefixed suffix.",
      },
      input_tokens: TOKEN_COUNT_SCHEMA("Prompt tokens sent per call."),
      output_tokens: TOKEN_COUNT_SCHEMA("Completion tokens returned per call."),
      cached_input_tokens: TOKEN_COUNT_SCHEMA(
        "Prompt tokens served from the provider's cache per call.",
      ),
      cache_write_tokens: TOKEN_COUNT_SCHEMA("Tokens written into the prompt cache per call."),
      calls: {
        type: "integer",
        format: "int64",
        minimum: 1,
        maximum: 10000000,
        default: 1,
        description: "How many identical calls to price. Multiplies the per-call cost.",
      },
    },
  },

  Estimate: {
    type: "object",
    title: "Estimate",
    required: ["model", "matched_to", "provider", "total_cost", "currency"],
    properties: {
      model: { type: "string", description: "The model name as requested." },
      matched_to: { type: "string", description: "The catalogue entry it resolved to." },
      provider: { type: "string", description: "Provider slug for the matched entry." },
      calls: { type: "integer", description: "Number of calls priced." },
      tokens: {
        type: "object",
        description: "Token counts used, echoed back.",
        properties: {
          input: { type: "integer" },
          output: { type: "integer" },
          cached_input: { type: "integer" },
          cache_write: { type: "integer" },
          total: { type: "integer" },
        },
      },
      rates_per_1k: {
        type: "object",
        description: "USD per 1,000 tokens. Null means the provider publishes no such rate.",
        properties: {
          input: { type: "number" },
          output: { type: "number" },
          cached_input: { type: ["number", "null"] },
          cache_write: { type: ["number", "null"] },
        },
      },
      cost_per_call: {
        type: "object",
        description: "USD cost of a single call, broken down.",
        properties: {
          input_cost: { type: "number" },
          output_cost: { type: "number" },
          cached_input_cost: { type: "number" },
          cache_write_cost: { type: "number" },
          total: { type: "number" },
        },
      },
      total_cost: { type: "number", description: "cost_per_call.total multiplied by calls, in USD." },
      currency: { type: "string", enum: ["USD"] },
      cached_billed_at_input_rate: {
        type: "boolean",
        description:
          "True when cached tokens were billed at the full input rate because the provider publishes no cached rate.",
      },
    },
  },
};

function parseArgs(argv) {
  const from = argv.indexOf("--from");
  return {
    from:
      from >= 0 && argv[from + 1]
        ? argv[from + 1].replace(/\/+$/, "")
        : (process.env.AGENTCOST_API_URL ?? "https://api.agentcost.tech"),
  };
}

async function fetchSpec(origin) {
  // The origin sleeps; a single attempt loses the race on a cold start.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(`${origin}/openapi.json`, {
        signal: AbortSignal.timeout(90_000),
      });
      if (response.ok) return await response.json();
      console.warn(`  attempt ${attempt}: HTTP ${response.status}`);
    } catch (error) {
      console.warn(`  attempt ${attempt}: ${error.message}`);
    }
  }
  throw new Error(`Could not fetch ${origin}/openapi.json after 3 attempts.`);
}

function transform(spec) {
  const out = structuredClone(spec);

  out.servers = [ORIGIN_SERVER, MIRROR_SERVER];

  out.info = {
    ...out.info,
    title: "AgentCost API",
    "x-mirror": MIRROR_SERVER.url,
  };

  // Pin every non-mirrored path to the origin so the two root servers are not a
  // claim that the mirror serves all 140 operations.
  for (const [pathname, item] of Object.entries(out.paths)) {
    if (!MIRRORED_PATHS.has(pathname)) item.servers = [ORIGIN_SERVER];
  }

  for (const pathname of MIRRORED_PATHS) {
    if (!(pathname in out.paths)) {
      throw new Error(
        `MIRRORED_PATHS lists ${pathname}, which the backend spec does not define. ` +
          `Update the list or the mirror route handlers.`,
      );
    }
  }

  out.paths["/v1/estimate"] = ESTIMATE_PATH;
  out.components = out.components ?? {};
  out.components.schemas = { ...(out.components.schemas ?? {}), ...EXTRA_SCHEMAS };

  // Document the shared error envelope on every operation that can fail, so a
  // function-calling client knows what a non-2xx body looks like.
  const errorResponse = (description) => ({
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
  });

  for (const [pathname, item] of Object.entries(out.paths)) {
    if (MIRROR_ONLY_PATHS.has(pathname)) continue;
    for (const [method, operation] of Object.entries(item)) {
      if (!["get", "post", "put", "patch", "delete"].includes(method)) continue;
      operation.responses = operation.responses ?? {};
      if (operation.responses["422"]) {
        operation.responses["422"] = errorResponse("Request validation failed.");
      }
      if (operation.security?.length) {
        operation.responses["401"] = errorResponse("Missing or invalid credentials.");
      }
      operation.responses["429"] = errorResponse("Rate limit exceeded. See the Retry-After header.");
    }
  }

  return out;
}

/** Minimal block-style YAML for JSON-compatible data. Scalars are JSON-quoted, which is valid YAML 1.2. */
function toYaml(value, indent = 0) {
  const pad = "  ".repeat(indent);

  if (value === null) return "null";
  if (typeof value !== "object") return JSON.stringify(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    return value
      .map((item) => {
        const rendered = toYaml(item, indent + 1);
        return typeof item === "object" && item !== null
          ? `${pad}- ${rendered.trimStart()}`
          : `${pad}- ${rendered}`;
      })
      .join("\n");
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return "{}";

  return entries
    .map(([key, item]) => {
      const quotedKey = JSON.stringify(String(key));
      if (item === null || typeof item !== "object") {
        return `${pad}${quotedKey}: ${toYaml(item)}`;
      }
      if (Array.isArray(item) && item.length === 0) return `${pad}${quotedKey}: []`;
      if (!Array.isArray(item) && Object.keys(item).length === 0) return `${pad}${quotedKey}: {}`;
      return `${pad}${quotedKey}:\n${toYaml(item, indent + 1)}`;
    })
    .join("\n");
}

async function main() {
  const { from } = parseArgs(process.argv.slice(2));
  console.log(`Fetching ${from}/openapi.json ...`);

  const spec = transform(await fetchSpec(from));

  const operations = Object.values(spec.paths).flatMap((item) =>
    Object.entries(item).filter(([method]) =>
      ["get", "post", "put", "patch", "delete"].includes(method),
    ),
  );

  const jsonPath = path.join(ROOT, "public", "openapi.json");
  const yamlPath = path.join(ROOT, "public", "openapi.yaml");

  await writeFile(jsonPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
  await writeFile(yamlPath, `${toYaml(spec)}\n`, "utf8");

  console.log(`Wrote ${operations.length} operations across ${Object.keys(spec.paths).length} paths.`);
  console.log(`  ${path.relative(ROOT, jsonPath)}`);
  console.log(`  ${path.relative(ROOT, yamlPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
