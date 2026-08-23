/**
 * Server-side access to the public model catalogue.
 *
 * Extracted from app/docs/models/page.tsx so the page and the public API
 * handlers under /api/v1 share one implementation — including the cold-start
 * retry, which exists because the API host sleeps when idle and the first
 * request after that can take ~60s.
 */

/** How long a fetched catalogue stays valid. Also the ISR window for /docs/models. */
export const CATALOG_REVALIDATE_SECONDS = 86_400;

// Public, unauthenticated endpoint. Hard-coded rather than read from
// NEXT_PUBLIC_API_URL because that points at localhost in local envs, which
// would silently produce an empty catalog in a production build.
export const PRICING_API =
  process.env.PRICING_API_URL ?? "https://api.agentcost.tech";

export interface ModelPricing {
  model_name: string;
  input: number;
  output: number;
  provider: string;
  /** Per-1k cached-input rate; null when the provider publishes none. */
  cached_input: number | null;
  /** chat / embedding / image_generation / ... ; null = unknown. */
  mode: string | null;
  /** Upstream-announced retirement date (YYYY-MM-DD); null = none. */
  deprecation_date: string | null;
}

export interface SyncStatus {
  total_models: number;
  last_updated: string | null;
  models_by_provider: Record<string, number>;
}

type RawPricing = {
  pricing?: Record<
    string,
    {
      input?: number;
      output?: number;
      provider?: string;
      cached_input?: number | null;
      cache_write?: number | null;
      mode?: string | null;
      deprecation_date?: string | null;
      updated_at?: string | null;
    }
  >;
  source?: string;
  last_updated?: string | null;
};

/**
 * The API host sleeps when idle, and the first request after that can take
 * ~60s. A single short-timeout fetch therefore loses the race during a cold
 * Vercel build and the catalog ships EMPTY — which is exactly what happened on
 * the first deploy. So: wake the host with a cheap call, then retry the real
 * one. Never throws; an empty result just means the caller degrades.
 */
export async function fetchJson<T = unknown>(
  url: string,
  attempts: number,
): Promise<T | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(90_000),
        next: { revalidate: CATALOG_REVALIDATE_SECONDS },
      });
      if (res.ok) return (await res.json()) as T;
    } catch {
      // cold start / transient — fall through to the next attempt
    }
  }
  return null;
}

/** Wake the API host so the next (larger) request isn't the one paying the cold start. */
export async function warmUpstream(): Promise<void> {
  await fetchJson(`${PRICING_API}/v1/health`, 2);
}

/** The raw upstream catalogue payload, wire-identical to GET /v1/pricing. */
export async function fetchRawCatalog(
  provider?: string | null,
): Promise<RawPricing | null> {
  await warmUpstream();
  const query = provider ? `?provider=${encodeURIComponent(provider)}` : "";
  return fetchJson<RawPricing>(`${PRICING_API}/v1/pricing${query}`, 3);
}

export async function getCatalog(): Promise<{
  models: ModelPricing[];
  syncStatus: SyncStatus | null;
}> {
  const pricing = await fetchRawCatalog();
  const status = await fetchJson<Partial<SyncStatus>>(
    `${PRICING_API}/v1/pricing/sync/status`,
    2,
  );

  const models: ModelPricing[] = Object.entries(pricing?.pricing ?? {}).map(
    ([model_name, p]) => ({
      model_name,
      input: p.input ?? 0,
      output: p.output ?? 0,
      provider: p.provider ?? "unknown",
      cached_input: p.cached_input ?? null,
      mode: p.mode ?? null,
      deprecation_date: p.deprecation_date ?? null,
    }),
  );

  const syncStatus: SyncStatus | null = status
    ? {
        total_models: status.total_models ?? models.length,
        last_updated: status.last_updated ?? null,
        models_by_provider: status.models_by_provider ?? {},
      }
    : null;

  return { models, syncStatus };
}
