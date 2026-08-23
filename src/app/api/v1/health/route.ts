import { fetchJson, PRICING_API } from "@/lib/catalog";
import { jsonOk } from "@/lib/http/api-response";

/**
 * GET /api/v1/health — status of this API.
 *
 * Deliberately does NOT proxy the origin's health check: this endpoint has to be
 * fast and always answer, and the origin sleeps. It reports the origin's last
 * known state from the cached catalogue instead, so a caller can tell whether a
 * slow first pricing request is likely.
 */

export const revalidate = 300;

export async function GET() {
  const status = await fetchJson<{ total_models?: number; last_updated?: string | null }>(
    `${PRICING_API}/v1/pricing/sync/status`,
    1,
  );

  return jsonOk(
    {
      status: "ok",
      service: "agentcost-public-api",
      origin: PRICING_API,
      catalog: {
        reachable: status !== null,
        total_models: status?.total_models ?? null,
        last_updated: status?.last_updated ?? null,
      },
      docs: "https://agentcost.tech/openapi.json",
    },
    { maxAge: 300 },
  );
}
