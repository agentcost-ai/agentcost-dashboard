"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { TimeRangeSelector } from "@/components/layout/TimeRangeSelector";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { HeroStatCard } from "@/components/dashboard/HeroStatCard";
import { api, ModelStats } from "@/lib/api";
import { formatCurrency, formatNumber, formatLatency } from "@/lib/utils";
import { Cpu, DollarSign, Zap, Scale, Database } from "lucide-react";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";

/** Best-effort provider tag from the model id — purely cosmetic. */
function providerOf(model: string): { name: string; className: string } {
  const m = model.toLowerCase();
  if (m.includes("gpt") || m.startsWith("o1") || m.startsWith("o3"))
    return { name: "OpenAI", className: "bg-emerald-400" };
  if (m.includes("claude")) return { name: "Anthropic", className: "bg-orange-400" };
  if (m.includes("gemini")) return { name: "Google", className: "bg-sky-400" };
  if (m.includes("llama")) return { name: "Meta", className: "bg-blue-400" };
  if (m.includes("mistral") || m.includes("mixtral"))
    return { name: "Mistral", className: "bg-amber-400" };
  if (m.includes("deepseek")) return { name: "DeepSeek", className: "bg-indigo-400" };
  return { name: "Other", className: "bg-neutral-500" };
}

export default function ModelsPage() {
  const { isConfigured } = useApiConfiguration();
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelStats[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!api.isConfigured()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await api.getModelStats(timeRange, 50);
        setModels(data);
        setShowOnboarding(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch data";
        if (
          errorMessage.includes("401") ||
          errorMessage.includes("Invalid API key")
        ) {
          setShowOnboarding(true);
          setError(null);
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [timeRange]);

  const summary = useMemo(() => {
    const totalCost = models.reduce((sum, m) => sum + m.total_cost, 0);
    const totalTokens = models.reduce((sum, m) => sum + m.total_tokens, 0);
    const totalCalls = models.reduce((sum, m) => sum + m.total_calls, 0);
    const totalInput = models.reduce((sum, m) => sum + m.input_tokens, 0);
    const totalOutput = models.reduce((sum, m) => sum + m.output_tokens, 0);
    const sorted = [...models].sort((a, b) => b.total_cost - a.total_cost);
    return {
      totalCost,
      totalTokens,
      totalCalls,
      totalInput,
      totalOutput,
      sorted,
      topModel: sorted[0] ?? null,
    };
  }, [models]);

  // Show onboarding if not configured or invalid API key
  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Models
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Usage and cost breakdown by LLM model
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/docs/models"
            className="flex items-center gap-2 rounded-lg border border-white/6 px-4 py-2 text-[13px] font-medium text-neutral-300 hover:text-white hover:border-white/12 transition-colors"
          >
            <Database size={14} />
            Supported Models
          </Link>
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-900/50 bg-red-950/20">
          <p className="text-red-400">{error}</p>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HeroStatCard
          label="Models in Use"
          value={String(models.length)}
          sub={
            summary.topModel
              ? `Top spend: ${summary.topModel.model}`
              : undefined
          }
          icon={<Cpu size={15} />}
          iconClassName="bg-violet-500/10 text-violet-400"
        />
        <HeroStatCard
          label="Total Spend"
          value={formatCurrency(summary.totalCost)}
          sub={
            summary.totalCalls > 0
              ? `${formatCurrency(summary.totalCost / summary.totalCalls)} / call blended`
              : undefined
          }
          icon={<DollarSign size={15} />}
          iconClassName="bg-emerald-500/10 text-emerald-400"
        />
        <HeroStatCard
          label="Total Tokens"
          value={formatNumber(summary.totalTokens)}
          sub={`${formatNumber(summary.totalInput)} in · ${formatNumber(summary.totalOutput)} out`}
          icon={<Zap size={15} />}
          iconClassName="bg-amber-500/10 text-amber-400"
        />
        <HeroStatCard
          label="Cost / 1K Tokens"
          value={
            summary.totalTokens > 0
              ? formatCurrency((summary.totalCost / summary.totalTokens) * 1000)
              : "—"
          }
          sub="Blended across models"
          icon={<Scale size={15} />}
          iconClassName="bg-sky-500/10 text-sky-400"
        />
      </div>

      {/* Models Table */}
      <Card padding="none">
        <div className="border-b border-white/6 px-6 py-4">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            Model Usage
          </h3>
          <p className="text-[12.5px] text-neutral-500 mt-0.5">
            Ranked by spend in the selected window
          </p>
        </div>
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={8} />
          </div>
        ) : models.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="w-44">Cost Share</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Cost / 1K Tok</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="w-40">Token Split</TableHead>
                <TableHead className="text-right">Latency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.sorted.map((model) => {
                const share =
                  summary.totalCost > 0
                    ? (model.total_cost / summary.totalCost) * 100
                    : 0;
                const inShare =
                  model.total_tokens > 0
                    ? (model.input_tokens / model.total_tokens) * 100
                    : 0;
                const provider = providerOf(model.model);
                return (
                  <TableRow key={model.model}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${provider.className}`}
                          title={provider.name}
                        />
                        <div className="min-w-0">
                          <p className="font-mono font-medium text-white truncate">
                            {model.model}
                          </p>
                          <p className="text-[11px] text-neutral-600">
                            {provider.name}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-1.5 w-24 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                        <span className="text-[11.5px] text-neutral-500 tabular-nums">
                          {share.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-white">
                      {formatCurrency(model.total_cost)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-400">
                      {model.total_tokens > 0
                        ? formatCurrency(
                            (model.total_cost / model.total_tokens) * 1000,
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatNumber(model.total_calls)}
                    </TableCell>
                    <TableCell>
                      <div
                        className="flex h-1.5 w-32 rounded-full overflow-hidden bg-white/5"
                        title={`${formatNumber(model.input_tokens)} input / ${formatNumber(model.output_tokens)} output`}
                      >
                        <div
                          className="h-full bg-sky-500/80"
                          style={{ width: `${inShare}%` }}
                        />
                        <div
                          className="h-full bg-amber-400/80"
                          style={{ width: `${100 - inShare}%` }}
                        />
                      </div>
                      <p className="mt-1 text-[10.5px] text-neutral-600 tabular-nums">
                        {formatNumber(model.input_tokens)} in ·{" "}
                        {formatNumber(model.output_tokens)} out
                      </p>
                    </TableCell>
                    <TableCell className="text-right font-mono text-neutral-300">
                      {formatLatency(model.avg_latency_ms)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="flex h-64 items-center justify-center text-neutral-500">
            No model data available
          </div>
        )}
      </Card>
    </div>
  );
}
