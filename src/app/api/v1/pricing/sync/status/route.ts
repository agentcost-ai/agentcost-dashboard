import { CATALOG_REVALIDATE_SECONDS, PRICING_API, fetchJson, warmUpstream } from "@/lib/catalog";
import { jsonError, jsonOk } from "@/lib/http/api-response";

/** GET /api/v1/pricing/sync/status — catalogue size, freshness and composition. */

export const revalidate = 86400;

export async function GET() {
  await warmUpstream();
  const payload = await fetchJson<Record<string, unknown>>(
    `${PRICING_API}/v1/pricing/sync/status`,
    3,
  );

  if (!payload) {
    return jsonError(
      "service_unavailable",
      "The catalogue status is temporarily unreachable.",
      "The upstream host wakes from idle in about a minute. Retry after the Retry-After interval.",
      { "Retry-After": "60" },
    );
  }

  return jsonOk(payload, { maxAge: CATALOG_REVALIDATE_SECONDS });
}
