import { CATALOG_REVALIDATE_SECONDS, PRICING_API, fetchJson, warmUpstream } from "@/lib/catalog";
import { jsonError, jsonOk } from "@/lib/http/api-response";

/**
 * GET /api/v1/pricing — the public model catalogue.
 *
 * Wire-identical mirror of GET /v1/pricing on the API origin. It exists because
 * the origin runs on a host that sleeps when idle: a cold request there can take
 * ~60s, which is long enough that an agent gives up. Vercel caches this for a
 * day, so callers here get an answer immediately.
 */

export const revalidate = 86400;

export async function GET(request: Request) {
  const provider = new URL(request.url).searchParams.get("provider");

  await warmUpstream();
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  const payload = await fetchJson<Record<string, unknown>>(
    `${PRICING_API}/v1/pricing${query}`,
    3,
  );

  if (!payload) {
    return jsonError(
      "service_unavailable",
      "The pricing catalogue is temporarily unreachable.",
      "The upstream host wakes from idle in about a minute. Retry after the Retry-After interval, or call https://api.agentcost.tech/v1/pricing directly.",
      { "Retry-After": "60" },
    );
  }

  return jsonOk(payload, { maxAge: CATALOG_REVALIDATE_SECONDS });
}
