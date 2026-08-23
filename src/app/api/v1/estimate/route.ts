import { fetchRawCatalog } from "@/lib/catalog";
import {
  EstimateInputError,
  estimate,
  parseEstimateRequest,
  resolveModel,
} from "@/lib/estimate";
import { jsonError, jsonOk } from "@/lib/http/api-response";

/**
 * POST /api/v1/estimate — what a call will cost, before you make it.
 *
 * Computed here from the day-cached catalogue rather than proxied, so it answers
 * immediately and works even while the origin host is asleep. This is the one
 * endpoint that is served only from agentcost.tech; the spec marks it as such.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(
      "bad_request",
      "Request body is not valid JSON.",
      'Send Content-Type: application/json with a body like {"model": "gpt-4o", "input_tokens": 12000, "output_tokens": 800}.',
    );
  }

  let parsed;
  try {
    parsed = parseEstimateRequest(body);
  } catch (error) {
    if (error instanceof EstimateInputError) {
      return jsonError(
        "validation_error",
        error.message,
        'Required: "model" (string), "input_tokens" and "output_tokens" (non-negative numbers). Optional: "cached_input_tokens", "cache_write_tokens", "calls".',
      );
    }
    throw error;
  }

  const catalog = await fetchRawCatalog();
  if (!catalog?.pricing) {
    return jsonError(
      "service_unavailable",
      "The pricing catalogue is temporarily unreachable, so no estimate can be produced.",
      "The upstream host wakes from idle in about a minute. Retry after the Retry-After interval.",
      { "Retry-After": "60" },
    );
  }

  const matched = resolveModel(catalog.pricing, parsed.model);
  if (!matched) {
    return jsonError(
      "not_found",
      `"${parsed.model}" is not in the model catalogue.`,
      "Browse the catalogue at https://agentcost.tech/api/v1/pricing, or filter it with ?provider=. Model names match the provider's own identifier, e.g. gpt-4o or claude-sonnet-4-6.",
    );
  }

  return jsonOk(estimate(parsed, matched.name, matched.rates), { maxAge: 3600 });
}
