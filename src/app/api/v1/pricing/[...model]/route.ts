import {
  CATALOG_REVALIDATE_SECONDS,
  PRICING_API,
  fetchJson,
  fetchRawCatalog,
} from "@/lib/catalog";
import { jsonError, jsonOk } from "@/lib/http/api-response";

/**
 * GET /api/v1/pricing/{model_name} — rates for one model.
 *
 * Catch-all segment because model names contain slashes
 * ("meta-llama/Llama-3-70b-chat-hf").
 *
 * An exact hit is answered from the day-cached catalogue, which is one upstream
 * fetch shared by every model lookup rather than one per model. A miss falls
 * through to the origin, which resolves fuzzily against the full catalogue --
 * the same resolver event ingestion bills with. Either way the payload is the
 * shape GET /v1/pricing/{model_name} returns.
 */

export const revalidate = 86400;

type UpstreamEntry = {
  input?: number;
  output?: number;
  provider?: string;
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ model: string[] }> },
) {
  const { model } = await params;
  const modelName = (model ?? []).join("/");

  if (!modelName) {
    return jsonError(
      "bad_request",
      "No model name given.",
      "Call /api/v1/pricing/{model_name}, e.g. /api/v1/pricing/gpt-4o. The whole catalogue is at /api/v1/pricing.",
    );
  }

  const catalog = await fetchRawCatalog();
  const exact = catalog?.pricing?.[modelName] as UpstreamEntry | undefined;

  if (exact) {
    return jsonOk(
      {
        model: modelName,
        matched_to: modelName,
        input: exact.input ?? 0,
        output: exact.output ?? 0,
        provider: exact.provider ?? "unknown",
        source: "database",
      },
      { maxAge: CATALOG_REVALIDATE_SECONDS },
    );
  }

  const resolved = await fetchJson<Record<string, unknown>>(
    `${PRICING_API}/v1/pricing/${encodeURIComponent(modelName)}`,
    2,
  );

  if (!resolved) {
    return jsonError(
      "service_unavailable",
      `Could not resolve pricing for "${modelName}".`,
      "The upstream host wakes from idle in about a minute. Retry after the Retry-After interval, or fetch the whole catalogue from /api/v1/pricing.",
      { "Retry-After": "60" },
    );
  }

  return jsonOk(resolved, { maxAge: CATALOG_REVALIDATE_SECONDS });
}
