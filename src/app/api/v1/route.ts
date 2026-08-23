import { jsonOk } from "@/lib/http/api-response";
import { API_URL, SITE_URL } from "@/lib/site";

/** GET /api/v1 — banner listing the public endpoints, so a bare probe is useful. */

export const dynamic = "force-static";

export async function GET() {
  return jsonOk(
    {
      name: "AgentCost public API",
      description:
        "Model pricing and cost estimation. No credentials required for any endpoint listed here.",
      openapi: `${SITE_URL}/openapi.json`,
      docs: `${SITE_URL}/docs/api`,
      origin: API_URL,
      endpoints: {
        health: `GET ${SITE_URL}/api/v1/health`,
        catalog: `GET ${SITE_URL}/api/v1/pricing`,
        model: `GET ${SITE_URL}/api/v1/pricing/{model_name}`,
        deprecations: `GET ${SITE_URL}/api/v1/pricing/deprecations`,
        catalog_status: `GET ${SITE_URL}/api/v1/pricing/sync/status`,
        estimate: `POST ${SITE_URL}/api/v1/estimate`,
      },
    },
    { maxAge: 3600 },
  );
}
