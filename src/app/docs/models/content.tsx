"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Database,
  Zap,
  Calendar,
  CalendarClock,
  Cpu,
  Copy,
  Check,
  X,
} from "lucide-react";

interface ModelPricing {
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

interface SyncStatus {
  total_models: number;
  last_updated: string | null;
  models_by_provider: Record<string, number>;
}

type SortField =
  | "model_name"
  | "provider"
  | "input"
  | "output"
  | "cached_input";
type SortDirection = "asc" | "desc";

function formatPrice(price: number): string {
  if (price === 0) return "Free";
  if (price < 0.0001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function getProviderColor(provider: string): string {
  const colors: Record<string, string> = {
    openai: "bg-green-900/30 text-green-400 border-green-700/50",
    anthropic: "bg-orange-900/30 text-orange-400 border-orange-700/50",
    google: "bg-blue-900/30 text-blue-400 border-blue-700/50",
    groq: "bg-purple-900/30 text-purple-400 border-purple-700/50",
    deepseek: "bg-cyan-900/30 text-cyan-400 border-cyan-700/50",
    cohere: "bg-red-900/30 text-red-400 border-red-700/50",
    mistral: "bg-yellow-900/30 text-yellow-400 border-yellow-700/50",
    together: "bg-pink-900/30 text-pink-400 border-pink-700/50",
    aws: "bg-amber-900/30 text-amber-400 border-amber-700/50",
    azure: "bg-sky-900/30 text-sky-400 border-sky-700/50",
    fireworks: "bg-rose-900/30 text-rose-400 border-rose-700/50",
    novita: "bg-indigo-900/30 text-indigo-400 border-indigo-700/50",
    xai: "bg-slate-900/30 text-slate-400 border-slate-700/50",
    vercel: "bg-zinc-900/30 text-zinc-400 border-zinc-700/50",
    replicate: "bg-fuchsia-900/30 text-fuchsia-400 border-fuchsia-700/50",
    perplexity: "bg-teal-900/30 text-teal-400 border-teal-700/50",
  };
  return (
    colors[provider.toLowerCase()] ||
    "bg-neutral-800/50 text-neutral-400 border-neutral-700/50"
  );
}

function formatDate(isoString: string | null): string {
  if (!isoString) return "Never";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface ModelsPageProps {
  /** Catalog fetched on the server (page.tsx) so it ships in crawlable HTML. */
  initialModels?: ModelPricing[];
  initialSyncStatus?: SyncStatus | null;
}

export default function ModelsPage({
  initialModels = [],
  initialSyncStatus = null,
}: ModelsPageProps) {
  const hasServerData = initialModels.length > 0;

  const [models, setModels] = useState<ModelPricing[]>(initialModels);
  const [providers, setProviders] = useState<string[]>(() =>
    initialSyncStatus?.models_by_provider
      ? [
          "All Providers",
          ...Object.keys(initialSyncStatus.models_by_provider).sort(),
        ]
      : ["All Providers"],
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(
    initialSyncStatus,
  );
  const [loading, setLoading] = useState(!hasServerData);
  const [error, setError] = useState<string | null>(null);
  const [copiedModel, setCopiedModel] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("All Providers");
  const [selectedMode, setSelectedMode] = useState("All Types");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("model_name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Copy model name to clipboard
  const copyModelName = useCallback((modelName: string) => {
    navigator.clipboard.writeText(modelName);
    setCopiedModel(modelName);
    setTimeout(() => setCopiedModel(null), 2000);
  }, []);

  useEffect(() => {
    // Server already supplied the catalog (the normal path) — don't refetch.
    // The client fetch stays as a fallback for when the build-time request to
    // the pricing API failed.
    if (hasServerData) return;
    fetchModels();
    fetchSyncStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchModels() {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/v1/pricing`);
      if (!response.ok) throw new Error("Failed to fetch models");
      const data = await response.json();

      // Transform the pricing dict to array format
      const pricingDict: Record<
        string,
        {
          input?: number;
          output?: number;
          provider?: string;
          cached_input?: number | null;
          mode?: string | null;
          deprecation_date?: string | null;
        }
      > = data.pricing || {};
      const modelsArray: ModelPricing[] = Object.entries(pricingDict).map(
        ([model_name, pricing]) => ({
          model_name,
          input: pricing.input || 0,
          output: pricing.output || 0,
          provider: pricing.provider || "unknown",
          cached_input: pricing.cached_input ?? null,
          mode: pricing.mode ?? null,
          deprecation_date: pricing.deprecation_date ?? null,
        }),
      );

      setModels(modelsArray);
      setError(null);
    } catch (err) {
      setError("Failed to load models. Make sure the backend is running.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSyncStatus() {
    try {
      const response = await fetch(`${apiUrl}/v1/pricing/sync/status`);
      if (response.ok) {
        const data = await response.json();
        setSyncStatus({
          total_models: data.total_models || 0,
          last_updated: data.last_updated || null,
          models_by_provider: data.models_by_provider || {},
        });

        // Build providers list dynamically from API response
        if (data.models_by_provider) {
          const providerNames = Object.keys(data.models_by_provider).sort();
          setProviders(["All Providers", ...providerNames]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  }

  // Filtering and sorting
  const filteredModels = useMemo(() => {
    let result = [...models];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.model_name.toLowerCase().includes(query) ||
          m.provider.toLowerCase().includes(query),
      );
    }

    // Provider filter
    if (selectedProvider !== "All Providers") {
      result = result.filter(
        (m) => m.provider.toLowerCase() === selectedProvider.toLowerCase(),
      );
    }

    // Mode filter ("unknown" groups rows the catalogue has no mode for)
    if (selectedMode !== "All Types") {
      result = result.filter(
        (m) => (m.mode ?? "unknown") === selectedMode.toLowerCase(),
      );
    }

    // Sorting (null cached rates sort below any published rate)
    result.sort((a, b) => {
      let aVal: string | number = a[sortField] ?? -1;
      let bVal: string | number = b[sortField] ?? -1;

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    models,
    searchQuery,
    selectedProvider,
    selectedMode,
    sortField,
    sortDirection,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredModels.length / itemsPerPage);
  const paginatedModels = filteredModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedProvider, selectedMode]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp size={14} className="inline ml-1" />
    ) : (
      <ChevronDown size={14} className="inline ml-1" />
    );
  }

  // Stats
  const providerCount = useMemo(() => {
    const set = new Set(models.map((m) => m.provider));
    return set.size;
  }, [models]);

  // Model types present in the catalogue (chat, embedding, ...). Empty until
  // the backend ships `mode` — the filter hides itself rather than offering a
  // dropdown whose only entry is "Unknown". "unknown" appears as an option
  // only alongside real types, for rows the catalogue has no mode for.
  const modes = useMemo(() => {
    const known = new Set<string>();
    let hasUnknown = false;
    for (const m of models) {
      if (m.mode) known.add(m.mode);
      else hasUnknown = true;
    }
    if (known.size === 0) return [];
    const list = [...known].sort();
    if (hasUnknown) list.push("unknown");
    return ["All Types", ...list];
  }, [models]);

  // Models with an upstream-announced retirement date, soonest first.
  // Also served raw at /v1/pricing/deprecations for API consumers.
  const upcomingRetirements = useMemo(
    () =>
      models
        .filter((m) => m.deprecation_date)
        .sort((a, b) =>
          (a.deprecation_date as string) < (b.deprecation_date as string)
            ? -1
            : 1,
        ),
    [models],
  );

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pt-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="text-primary-400" />
            Model Catalog
          </h1>
          <p className="mt-2 text-neutral-400">
            Browse and search all supported models with live pricing
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <Cpu size={14} />
              Total Models
            </div>
            <div className="text-2xl font-bold text-white">
              {(syncStatus?.total_models || models.length).toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <Zap size={14} />
              Providers
            </div>
            <div className="text-2xl font-bold text-white">{providerCount}</div>
          </div>
          <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <CalendarClock size={14} />
              Announced Retirements
            </div>
            <div className="text-2xl font-bold text-white">
              {upcomingRetirements.length.toLocaleString()}
            </div>
          </div>
          <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
            <div className="flex items-center gap-2 text-neutral-400 text-sm mb-1">
              <Calendar size={14} />
              Last Updated
            </div>
            <div className="text-lg font-bold text-white">
              {formatDate(syncStatus?.last_updated || null)}
            </div>
          </div>
        </div>

        {/* Upcoming retirements — deprecation dates synced from LiteLLM */}
        {upcomingRetirements.length > 0 && (
          <div className="rounded-lg bg-amber-950/20 border border-amber-800/30 p-4 mb-8">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-3">
              <CalendarClock size={14} />
              Upcoming model retirements
              <span className="text-amber-500/60 font-normal">
                — dates announced by providers
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {upcomingRetirements.slice(0, 8).map((m) => (
                <button
                  key={m.model_name}
                  onClick={() => setSearchQuery(m.model_name)}
                  title="Show in table"
                  className="shrink-0 rounded-full border border-amber-700/40 bg-amber-900/20 px-3 py-1.5 text-xs text-amber-200/90 hover:border-amber-500/60 hover:text-amber-100 transition-colors"
                >
                  <code className="font-mono">{m.model_name}</code>
                  <span className="ml-2 text-amber-500/80">
                    {formatDate(m.deprecation_date)}
                  </span>
                </button>
              ))}
              {upcomingRetirements.length > 8 && (
                <span className="shrink-0 self-center px-2 text-xs text-amber-500/70">
                  +{upcomingRetirements.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-62.5">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                />
                <input
                  type="text"
                  placeholder="Search by model name or provider (e.g., gpt-4, claude, anthropic)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Provider dropdown - now dynamic */}
            <div className="relative">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="pl-4 pr-8 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-primary-500 appearance-none cursor-pointer min-w-40"
              >
                {providers.map((p) => (
                  <option key={p} value={p}>
                    {p === "All Providers"
                      ? p
                      : p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
              />
            </div>

            {/* Type (mode) dropdown — from LiteLLM's `mode` field; hidden
                until the catalogue carries mode data */}
            {modes.length > 0 && (
              <div className="relative">
                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="pl-4 pr-8 py-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-primary-500 appearance-none cursor-pointer min-w-36"
                >
                  {modes.map((m) => (
                    <option key={m} value={m}>
                      {m === "All Types"
                        ? m
                        : m.charAt(0).toUpperCase() +
                          m.slice(1).replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
                />
              </div>
            )}
          </div>

          <div className="mt-3 text-sm text-neutral-500">
            Showing {filteredModels.length.toLocaleString()} of{" "}
            {models.length.toLocaleString()} models
            {(selectedProvider !== "All Providers" ||
              selectedMode !== "All Types") && (
              <button
                onClick={() => {
                  setSelectedProvider("All Providers");
                  setSelectedMode("All Types");
                }}
                className="ml-2 text-primary-400 hover:text-primary-300"
              >
                (clear filters)
              </button>
            )}
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700/50 p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-primary-400" />
          </div>
        ) : (
          <>
            {/* Models Table */}
            <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 overflow-hidden">
              {paginatedModels.length === 0 ? (
                /* Empty state lives outside the scrollable table so it centers
                   in the visible viewport on mobile instead of the table's
                   min-width. */
                <div className="py-12 px-4 text-center text-neutral-500">
                  <div className="flex flex-col items-center gap-3">
                    <Search size={32} className="text-neutral-600" />
                    <p className="text-lg">No models found</p>
                    <p className="text-sm">
                      Try adjusting your search or{" "}
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedProvider("All Providers");
                        }}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        clear all filters
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
              <div className="overflow-x-auto max-w-full">
                <table className="w-full min-w-190 text-sm">
                  <thead>
                    <tr className="border-b border-neutral-700 bg-neutral-800/50">
                      <th
                        className="text-left py-3 px-4 text-neutral-400 font-medium cursor-pointer hover:text-neutral-200"
                        onClick={() => handleSort("model_name")}
                      >
                        Model Name
                        <SortIcon field="model_name" />
                      </th>
                      <th
                        className="text-left py-3 px-4 text-neutral-400 font-medium cursor-pointer hover:text-neutral-200"
                        onClick={() => handleSort("provider")}
                      >
                        Provider
                        <SortIcon field="provider" />
                      </th>
                      <th
                        className="text-right py-3 px-4 text-neutral-400 font-medium cursor-pointer hover:text-neutral-200"
                        onClick={() => handleSort("input")}
                      >
                        Input / 1K
                        <SortIcon field="input" />
                      </th>
                      <th
                        className="text-right py-3 px-4 text-neutral-400 font-medium cursor-pointer hover:text-neutral-200"
                        onClick={() => handleSort("output")}
                      >
                        Output / 1K
                        <SortIcon field="output" />
                      </th>
                      <th
                        className="text-right py-3 px-4 text-neutral-400 font-medium cursor-pointer hover:text-neutral-200"
                        onClick={() => handleSort("cached_input")}
                        title="Prompt-cache read rate, where the provider publishes one"
                      >
                        Cached In / 1K
                        <SortIcon field="cached_input" />
                      </th>
                      {modes.length > 0 && (
                        <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                          Type
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="text-neutral-300">
                    {paginatedModels.map((model) => (
                      <tr
                        key={model.model_name}
                        className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm text-white bg-neutral-800 px-2 py-0.5 rounded">
                              {model.model_name}
                            </code>
                            {model.deprecation_date && (
                              <span
                                className="shrink-0 rounded-full border border-amber-700/40 bg-amber-900/20 px-2 py-0.5 text-[11px] text-amber-300/90"
                                title="Provider-announced retirement date"
                              >
                                retires {formatDate(model.deprecation_date)}
                              </span>
                            )}
                            <button
                              onClick={() => copyModelName(model.model_name)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-500 hover:text-neutral-300"
                              title="Copy model name"
                            >
                              {copiedModel === model.model_name ? (
                                <Check size={14} className="text-green-400" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedProvider(model.provider)}
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border hover:opacity-80 transition-opacity ${getProviderColor(
                              model.provider,
                            )}`}
                            title={`Filter by ${model.provider}`}
                          >
                            {model.provider}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-green-400">
                          {formatPrice(model.input)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-400">
                          {formatPrice(model.output)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sky-400/90">
                          {model.cached_input != null ? (
                            formatPrice(model.cached_input)
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                        {modes.length > 0 && (
                          <td className="py-3 px-4">
                            {model.mode ? (
                              <span className="inline-block rounded px-2 py-1 text-xs text-neutral-400 border border-neutral-700/60 bg-neutral-800/40">
                                {model.mode.replace(/_/g, " ")}
                              </span>
                            ) : (
                              <span className="text-neutral-600 text-xs">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4">
                <div className="text-sm text-neutral-500">
                  Page {currentPage} of {totalPages} (
                  {filteredModels.length.toLocaleString()} results)
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-neutral-400">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Attribution */}
        <div className="mt-8 pt-6 border-t border-neutral-800 text-center text-sm text-neutral-500">
          <p>
            Pricing data sourced from{" "}
            <a
              href="https://github.com/BerriAI/litellm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-400 hover:underline"
            >
              LiteLLM
            </a>
            . Prices are per 1,000 tokens in USD.
          </p>
        </div>
      </div>
    </div>
  );
}
