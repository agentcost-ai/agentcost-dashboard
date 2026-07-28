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
async function fetchJson(url: string, attempts: number): Promise<any | null> {
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

  const pricing = await fetchJson(`${PRICING_API}/v1/pricing`, 3);
  const status = await fetchJson(`${PRICING_API}/v1/pricing/sync/status`, 2);

  const models: ModelPricing[] = Object.entries(
    (pricing?.pricing ?? {}) as Record<
      string,
      { input?: number; output?: number; provider?: string }
    >,
  ).map(([model_name, p]) => ({
    model_name,
    input: p.input ?? 0,
    output: p.output ?? 0,
    provider: p.provider ?? "unknown",
  }));

  const syncStatus: SyncStatus | null = status
    ? {
        total_models: status.total_models ?? models.length,
        last_updated: status.last_updated ?? null,
        models_by_provider: status.models_by_provider ?? {},
      }
    : null;

  return { models, syncStatus };
}

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

/**
 * Server-rendered, provider-grouped index of EVERY model with its per-1K
 * token prices. The interactive table above it paginates to 50 rows, so this
 * is what actually gives crawlers the full long-tail surface ("<model> price
 * per token"). Deliberately compact markup — it's ~3,500 entries.
 */
function FullModelIndex({ models }: { models: ModelPricing[] }) {
  const byProvider = new Map<string, ModelPricing[]>();
  for (const m of models) {
    const list = byProvider.get(m.provider) ?? [];
    list.push(m);
    byProvider.set(m.provider, list);
  }
  const providers = [...byProvider.keys()].sort();

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <h2 className="text-xl font-semibold text-white mb-2">
        Complete AgentCost model and pricing index
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        Every model AgentCost tracks, grouped by provider, with input and output
        cost per 1,000 tokens in USD.
      </p>
      <div className="space-y-6">
        {providers.map((provider) => (
          <div key={provider}>
            <h3 className="text-sm font-medium text-neutral-300 mb-1.5 capitalize">
              {provider} — {byProvider.get(provider)!.length} models
            </h3>
            <p className="text-[12.5px] leading-6 text-neutral-500 wrap-break-word">
              {byProvider
                .get(provider)!
                .sort((a, b) => a.model_name.localeCompare(b.model_name))
                .map(
                  (m) =>
                    `${m.model_name} (in ${formatPrice(m.input)} / out ${formatPrice(m.output)})`,
                )
                .join(" · ")}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ModelCatalogPage() {
  const { models, syncStatus } = await getCatalog();

  return (
    <>
      <ModelCatalogContent
        initialModels={models}
        initialSyncStatus={syncStatus}
      />
      {models.length > 0 && <FullModelIndex models={models} />}
    </>
  );
}
