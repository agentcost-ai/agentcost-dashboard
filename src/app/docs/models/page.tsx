import type { Metadata } from "next";
import ModelCatalogContent from "./content";

export const metadata: Metadata = {
  title: "Model Catalog — Supported LLMs & Live Pricing",
  description:
    "Browse and search every model AgentCost supports, with live per-token pricing across OpenAI, Anthropic, Google, and more.",
  alternates: { canonical: "https://agentcost.tech/docs/models" },
};

// Rebuild at most once a day: the catalog is fetched on the SERVER so every
// model name and price lands in the crawlable HTML. Previously this page
// fetched client-side, so search engines indexed an empty shell.
export const revalidate = 86400;

// Public, unauthenticated endpoint. Hard-coded rather than read from
// NEXT_PUBLIC_API_URL because that points at localhost in local envs, which
// would silently produce an empty catalog in a production build.
const PRICING_API = process.env.PRICING_API_URL ?? "https://api.agentcost.tech";

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

/**
 * The API host sleeps when idle, and the first request after that can take
 * ~60s. A single short-timeout fetch therefore loses the race during a cold
 * Vercel build and the catalog ships EMPTY — which is exactly what happened on
 * the first deploy. So: wake the host with a cheap call, then retry the real
 * one. Never throws; an empty result just means the client component fetches.
 */
async function fetchJson<T = unknown>(
  url: string,
  attempts: number,
): Promise<T | null> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(90_000),
        next: { revalidate },
      });
      if (res.ok) return await res.json();
    } catch {
      // cold start / transient — fall through to the next attempt
    }
  }
  return null;
}

async function getCatalog(): Promise<{
  models: ModelPricing[];
  syncStatus: SyncStatus | null;
}> {
  // Warm the host first so the (much larger) pricing request isn't the one
  // paying the cold-start cost.
  await fetchJson(`${PRICING_API}/v1/health`, 2);

  const pricing = await fetchJson<{
    pricing?: Record<
      string,
      {
        input?: number;
        output?: number;
        provider?: string;
        cached_input?: number | null;
        mode?: string | null;
        deprecation_date?: string | null;
      }
    >;
  }>(`${PRICING_API}/v1/pricing`, 3);
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

export default async function ModelCatalogPage() {
  const { models, syncStatus } = await getCatalog();

  return (
    <ModelCatalogContent
      initialModels={models}
      initialSyncStatus={syncStatus}
    />
  );
}
