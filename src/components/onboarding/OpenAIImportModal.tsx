"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { X, KeyRound, Loader2, ExternalLink } from "lucide-react";
import {
  fetchProviderCosts,
  SpendCostsResult,
  SpendProvider,
  SPEND_PROVIDERS,
} from "@/lib/integrations";
import { formatCurrency } from "@/lib/utils";
import { track } from "@/lib/analytics";

interface OpenAIImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Same series color the dashboard uses for spend (flat fill, no gradients).
const SPEND_COLOR = "#38bdf8";

function dayLabel(date: string): string {
  try {
    return format(new Date(`${date}T00:00:00`), "MMM d");
  } catch {
    return date;
  }
}

function ImportTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: { date: string; amountUsd: number } }[];
}) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 px-3 py-2 shadow-xl">
      <p className="text-[11px] text-neutral-500">{dayLabel(point.date)}</p>
      <p className="text-[13px] font-medium text-white tabular-nums">
        {formatCurrency(point.amountUsd)}
      </p>
    </div>
  );
}

/**
 * Import last-30-days provider spend (OpenAI or Anthropic) via the backend
 * proxy and render it inline. The admin key is sent once and never stored.
 */
export function OpenAIImportModal({ isOpen, onClose }: OpenAIImportModalProps) {
  const [provider, setProvider] = useState<SpendProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SpendCostsResult | null>(null);

  if (!isOpen) return null;

  const meta = SPEND_PROVIDERS[provider];

  const handleClose = () => {
    setProvider("openai");
    setApiKey("");
    setError(null);
    setResult(null);
    setIsLoading(false);
    onClose();
  };

  const switchProvider = (next: SpendProvider) => {
    if (next === provider || isLoading) return;
    setProvider(next);
    setApiKey("");
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    track(`${provider}_import_started`);
    try {
      const data = await fetchProviderCosts(provider, apiKey.trim(), 30);
      setResult(data);
      track(`${provider}_import_succeeded`, {
        total_usd: Math.round(data.totalUsd),
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Import failed. Please try again.",
      );
      track(`${provider}_import_failed`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl bg-neutral-900 shadow-2xl border border-neutral-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800">
              <KeyRound size={18} className="text-sky-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">
                Import your {meta.label} spend
              </h3>
              <p className="text-xs text-neutral-500">
                Last 30 days, no code required
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!result ? (
            <>
              <div
                className="mb-3 inline-flex rounded-lg border border-neutral-700 bg-neutral-800/60 p-0.5"
                role="tablist"
                aria-label="Provider"
              >
                {(Object.keys(SPEND_PROVIDERS) as SpendProvider[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="tab"
                    aria-selected={provider === p}
                    onClick={() => switchProvider(p)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      provider === p
                        ? "bg-neutral-700 text-white"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {SPEND_PROVIDERS[p].label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-neutral-400 mb-3">
                Paste an {meta.keyName} (
                <a
                  href={meta.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1"
                >
                  {meta.consoleLabel}
                  <ExternalLink size={11} />
                </a>
                ). We fetch your last 30 days of spend, render it here, and
                never store the key.
              </p>
              <form onSubmit={handleSubmit}>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`${meta.keyPrefix}...`}
                  autoComplete="off"
                  className="w-full rounded-lg bg-neutral-800 border border-neutral-600 px-3 py-2 text-white text-sm font-mono placeholder-neutral-500 focus:border-sky-500 focus:outline-none"
                  disabled={isLoading}
                />
                {error && (
                  <p
                    role="alert"
                    className="mt-3 text-sm text-red-400 wrap-break-word"
                  >
                    {error}
                  </p>
                )}
                <div className="mt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !apiKey.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-500 transition-colors disabled:opacity-50"
                  >
                    {isLoading && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    {isLoading ? "Fetching..." : "Fetch my spend"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              <p className="text-sm text-neutral-400">
                You spent{" "}
                <span className="text-lg font-semibold text-white tabular-nums">
                  {formatCurrency(result.totalUsd)}
                </span>{" "}
                in the last 30 days.
              </p>
              <div className="mt-4 h-48">
                {result.days.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={result.days}
                      margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                    >
                      <XAxis
                        dataKey="date"
                        tickFormatter={dayLabel}
                        tick={{ fill: "#737373", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        minTickGap={28}
                      />
                      <YAxis
                        tickFormatter={(v: number) =>
                          v >= 1 ? `$${v.toFixed(0)}` : `$${v.toFixed(2)}`
                        }
                        tick={{ fill: "#737373", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <Tooltip
                        content={<ImportTooltip />}
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      />
                      <Bar
                        dataKey="amountUsd"
                        fill={SPEND_COLOR}
                        radius={[2, 2, 0, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                    No daily breakdown returned for this period.
                  </div>
                )}
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                This is a one-time snapshot from {meta.label}&apos;s billing
                API. Add the 2-line SDK snippet to track every call — per
                agent, per model, live.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-neutral-700 text-white text-sm font-medium hover:bg-neutral-600 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
