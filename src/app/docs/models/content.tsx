"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, ChevronDown, ChevronUp, Loader2, Zap, Calendar, CalendarClock, Cpu, Copy, Check, X } from "lucide-react";
import { PageHeader } from "@/components/docs/primitives";
import { FilterMenu } from "@/components/docs/FilterMenu";

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


/** Days from today to an ISO date; negative when it has passed. */
function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00Z`).getTime();
  return Math.round((target - Date.now()) / 86_400_000);
}

function retirementLabel(isoDate: string): string {
  const d = daysUntil(isoDate);
  if (d < 0) return "passed";
  if (d === 0) return "today";
  if (d < 30) return `in ${d} day${d === 1 ? "" : "s"}`;
  const months = Math.round(d / 30);
  return `in ${months} month${months === 1 ? "" : "s"}`;
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
  const [retiringOnly, setRetiringOnly] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);

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

    // Only models with a provider-announced retirement date
    if (retiringOnly) {
      result = result.filter((m) => m.deprecation_date);
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
    retiringOnly,
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
  }, [searchQuery, selectedProvider, selectedMode, retiringOnly]);

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
    <>
        <PageHeader eyebrow="Catalog" title="Model catalog">
          <p>Every model AgentCost can bill, with live per-token pricing and announced retirement dates.</p>
        </PageHeader>

        {/* Stats Cards */}
        <div className="mb-10 grid grid-cols-2 gap-6 border-t border-white/8 pt-5 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
              <Cpu size={14} />
              Total Models
            </div>
            <div className="text-xl font-semibold text-white tabular-nums">
              {(syncStatus?.total_models || models.length).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
              <Zap size={14} />
              Providers
            </div>
            <div className="text-xl font-semibold text-white tabular-nums">{providerCount}</div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
              <CalendarClock size={14} />
              Announced Retirements
            </div>
            <div className="text-xl font-semibold text-white tabular-nums">
              {upcomingRetirements.length.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
              <Calendar size={14} />
              Last Updated
            </div>
            <div className="text-xl font-semibold text-white tabular-nums">
              {formatDate(syncStatus?.last_updated || null)}
            </div>
          </div>
        </div>

        {/* Announced retirements — dates synced from providers via LiteLLM */}
        {upcomingRetirements.length > 0 && (
          <section className="mb-10">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-semibold text-white">Announced retirements</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Dates published by the providers, earliest first. Plan migrations before a model
                  disappears from your bill.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRetiringOnly(true);
                  setSelectedProvider("All Providers");
                  setSearchQuery("");
                  requestAnimationFrame(() =>
                    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
                  );
                }}
                className="cursor-pointer rounded-md border border-white/10 px-3 py-1.5 text-[13px] text-neutral-200 transition-colors hover:border-white/30 hover:text-white"
              >
                Filter the catalog to all {upcomingRetirements.length.toLocaleString()} &darr;
              </button>
            </div>
            <div className="docs-table-wrap border-t border-white/8">
              <table>
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Provider</th>
                    <th>Retires on</th>
                    <th className="text-right">When</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingRetirements
                    .filter((m) => daysUntil(m.deprecation_date as string) >= 0)
                    .slice(0, 6)
                    .map((m) => (
                      <tr key={m.model_name}>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSearchQuery(m.model_name)}
                            className="cursor-pointer font-mono text-[13px] text-neutral-100 hover:underline"
                            title="Show in the catalog"
                          >
                            {m.model_name}
                          </button>
                        </td>
                        <td className="text-neutral-400">{m.provider}</td>
                        <td className="tabular-nums text-neutral-200">{formatDate(m.deprecation_date)}</td>
                        <td className="text-right tabular-nums text-neutral-400">
                          {retirementLabel(m.deprecation_date as string)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Filters */}
        <div ref={catalogRef} className="mb-6 scroll-mt-24">
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-md bg-white/3 border border-white/8 text-white placeholder-neutral-600 focus:outline-none focus:border-white/25"
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

            <FilterMenu
              label="Provider"
              value={selectedProvider}
              options={providers}
              onChange={setSelectedProvider}
              format={(p) => (p === "All Providers" ? p : p.charAt(0).toUpperCase() + p.slice(1))}
              searchable
              className="w-44"
            />

            <button
              type="button"
              onClick={() => setRetiringOnly((v) => !v)}
              aria-pressed={retiringOnly}
              className={`cursor-pointer rounded-md border px-3.5 py-2.5 text-[14px] transition-colors ${
                retiringOnly
                  ? "border-white bg-white text-neutral-950"
                  : "border-white/8 bg-white/3 text-neutral-300 hover:border-white/25"
              }`}
              title="Only models with an announced retirement date"
            >
              Retiring
            </button>

            {/* Type (mode): from the catalogue mode field; hidden until the
                catalogue carries mode data */}
            {modes.length > 0 && (
              <FilterMenu
                label="Type"
                value={selectedMode}
                options={modes}
                onChange={setSelectedMode}
                format={(m) => (m === "All Types" ? m : m.charAt(0).toUpperCase() + m.slice(1).replace(/_/g, " "))}
                className="w-40"
              />
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
            <span>
              Showing <span className="text-neutral-200">{filteredModels.length.toLocaleString()}</span>
              {retiringOnly && " retiring"} of {models.length.toLocaleString()} models
              {selectedProvider !== "All Providers" && (
                <> from <span className="text-neutral-200">{selectedProvider}</span></>
              )}
              {selectedMode !== "All Types" && (
                <> &middot; <span className="text-neutral-200">{selectedMode.replace(/_/g, " ")}</span></>
              )}
              {searchQuery && (
                <> matching &ldquo;<span className="text-neutral-200">{searchQuery}</span>&rdquo;</>
              )}
            </span>
            {(selectedProvider !== "All Providers" || selectedMode !== "All Types" || retiringOnly || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedProvider("All Providers");
                  setSelectedMode("All Types");
                  setRetiringOnly(false);
                  setSearchQuery("");
                }}
                className="cursor-pointer text-neutral-300 underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"
              >
                Clear filters
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
            <Loader2 size={32} className="animate-spin text-neutral-400" />
          </div>
        ) : (
          <>
            {/* Models Table */}
            <div className="border-t border-white/8">
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
                        className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"
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
                    <tr className="border-b border-white/10">
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
                        className="border-b border-white/6 transition-colors hover:bg-white/2 group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-[13px] text-neutral-100">
                              {model.model_name}
                            </code>
                            {model.deprecation_date && (
                              <span
                                className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-neutral-400"
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
                                <Check size={14} className="text-neutral-200" />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setSelectedProvider(model.provider)}
                            className={`inline-block px-2 py-1 rounded text-xs font-medium border hover:opacity-80 transition-opacity ${"border-white/10 text-neutral-300"}`}
                            title={`Filter by ${model.provider}`}
                          >
                            {model.provider}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-200">
                          {formatPrice(model.input)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-blue-400">
                          {formatPrice(model.output)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-neutral-300">
                          {model.cached_input != null ? (
                            formatPrice(model.cached_input)
                          ) : (
                            <span className="text-neutral-600">—</span>
                          )}
                        </td>
                        {modes.length > 0 && (
                          <td className="py-3 px-4">
                            {model.mode ? (
                              <span className="inline-block rounded border border-white/10 px-2 py-0.5 text-xs text-neutral-400">
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
                    className="rounded-md border border-white/10 px-3 py-1 text-neutral-300 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded-md border border-white/10 px-3 py-1 text-neutral-300 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
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
                    className="rounded-md border border-white/10 px-3 py-1 text-neutral-300 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-white/10 px-3 py-1 text-neutral-300 transition-colors hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Attribution */}
        <div className="mt-8 border-t border-white/8 pt-6 text-center text-sm text-neutral-500">
          <p>
            Pricing data sourced from{" "}
            <a
              href="https://github.com/BerriAI/litellm"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline decoration-white/30 underline-offset-2 hover:decoration-white"
            >
              LiteLLM
            </a>
            . Prices are per 1,000 tokens in USD.
          </p>
        </div>
    </>
  );
}
