"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  SURFACE,
  usd,
  Money,
  Eyebrow,
  AccentPanel,
  PanelSkeleton,
} from "@/components/dashboard/OverviewPanels";
import { seriesColor } from "@/lib/palette";
import { useAuth } from "@/contexts/AuthContext";
import { trackDemo } from "@/lib/demo/demo";
import { demoOptimizationSummary } from "@/lib/demo/demoData";
import { track } from "@/lib/analytics";
import { prewarmBackend } from "@/lib/prewarm";
import { Badge } from "@/components/ui/Badge";
import {
  api,
  OptimizationSuggestion,
  OptimizationSummary,
  Recommendation,
} from "@/lib/api";
import { formatCurrency, formatPercentage, parseApiError, cn } from "@/lib/utils";
import {
  Zap,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Cpu,
  Database,
  Clock,
  RefreshCw,
  XCircle,
  Check,
  X,
  AlertCircle,
  Timer,
  Binary,
} from "lucide-react";
import {
  useApiConfiguration,
  OnboardingScreen,
  LoadingSpinner,
} from "@/hooks/useApiConfiguration";
import {
  ImplementationModal,
  FeedbackDialog,
} from "@/components/optimizations";

// An impact value outside these three has no label, and used to render as an
// empty pill.
const KNOWN_IMPACT = new Set(["minimal", "moderate", "significant"]);

// Priority badge colors
function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    high: { dot: "bg-red-400", label: "High priority" },
    medium: { dot: "bg-amber-300", label: "Medium priority" },
    low: { dot: "bg-emerald-400", label: "Low priority" },
  }[priority] || { dot: "bg-neutral-500", label: priority };

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 px-2.5 py-1 text-[11.5px] text-neutral-300">
      <span className={`size-1.5 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  );
}

/**
 * Confidence Badge - Shows "Learned" for alternatives with user outcomes
 * and "Price-based" for pricing-only suggestions.
 */
function ConfidenceBadge({
  source,
  confidenceScore,
  timesImplemented,
  savingsAccuracy,
}: {
  source?: "learned" | "dynamic" | null;
  confidenceScore?: number | null;
  timesImplemented?: number | null;
  savingsAccuracy?: number | null;
}) {
  if (source === "learned" && timesImplemented && timesImplemented > 0) {
    // Learned alternative - based on real implementations
    const confidencePercent = confidenceScore
      ? Math.round(confidenceScore * 100)
      : null;
    const accuracyText = savingsAccuracy
      ? `${savingsAccuracy.toFixed(0)}% accurate`
      : null;

    return (
      <Badge variant="green">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={12} />
          Learned
          {timesImplemented > 1 && (
            <span className="text-xs opacity-80">
              ({timesImplemented}x implemented)
            </span>
          )}
        </span>
        {(confidencePercent || accuracyText) && (
          <span className="ml-1 text-xs opacity-80">
            {confidencePercent && `${confidencePercent}% confidence`}
            {confidencePercent && accuracyText && " • "}
            {accuracyText}
          </span>
        )}
      </Badge>
    );
  }

  // Dynamic suggestion - cost-optimized
  return (
    <Badge variant="gray">
      <span className="flex items-center gap-1">
        <Lightbulb size={12} />
        Cost-optimized
      </span>
    </Badge>
  );
}

// Optimization type icons - expanded to include all types
function OptimizationTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    model_downgrade: <Cpu size={18} strokeWidth={1.75} className="text-indigo-200" />,
    caching: <Database size={18} strokeWidth={1.75} className="text-indigo-200" />,
    prompt_optimization: <Lightbulb size={18} strokeWidth={1.75} className="text-indigo-200" />,
    batching: <RefreshCw size={18} strokeWidth={1.75} className="text-indigo-200" />,
    token_reduction: <TrendingDown size={18} strokeWidth={1.75} className="text-indigo-200" />,
    error_reduction: <XCircle size={18} strokeWidth={1.75} className="text-indigo-200" />,
    anomaly_alert: <AlertCircle size={18} strokeWidth={1.75} className="text-indigo-200" />,
    latency: <Timer size={18} strokeWidth={1.75} className="text-indigo-200" />,
    non_llm_candidate: <Binary size={18} strokeWidth={1.75} className="text-indigo-200" />,
  };
  return icons[type] || <Zap size={18} strokeWidth={1.75} className="text-indigo-200" />;
}

// Single optimization card with action buttons
function OptimizationCard({
  suggestion,
  recommendation,
  onImplement,
  onDismiss,
  isActioning,
}: {
  suggestion: OptimizationSuggestion;
  recommendation?: Recommendation;
  onImplement?: (rec: Recommendation) => void;
  onDismiss?: (id: string) => void;
  isActioning?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const estimatedMonthlySavings = suggestion.estimated_savings_monthly;
  const showMonetary =
    [
      "model_downgrade",
      "caching",
      "error_reduction",
      "non_llm_candidate",
    ].includes(suggestion.type) && estimatedMonthlySavings !== null;

  const secondaryMetric = (() => {
    switch (suggestion.type) {
      case "model_downgrade":
        return {
          label: "Savings %",
          value: formatPercentage(suggestion.estimated_savings_percent),
        };
      case "caching":
        return {
          label: "Duplicate Rate",
          value: formatPercentage(
            suggestion.metrics?.duplicate_rate ??
              suggestion.estimated_savings_percent,
          ),
        };
      case "error_reduction":
        return {
          label: "Error Rate",
          value: formatPercentage(
            suggestion.metrics?.error_rate ??
              suggestion.estimated_savings_percent,
          ),
        };
      case "non_llm_candidate":
        return suggestion.metrics?.max_output_tokens != null
          ? {
              label: "Max output",
              value: `${suggestion.metrics.max_output_tokens} tok`,
            }
          : null;
      case "anomaly_alert":
      case "prompt_optimization":
        return suggestion.metrics?.z_score != null
          ? {
              label: "Deviation (σ)",
              value: suggestion.metrics.z_score.toFixed(1),
            }
          : null;
      default:
        return null;
    }
  })();

  return (
    <Card className="transition-colors hover:border-white/16">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-300/8">
          <OptimizationTypeIcon type={suggestion.type} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-[16px] font-medium tracking-tight text-white">{suggestion.title}</h3>
              <p className="mt-1 text-sm text-neutral-400 line-clamp-2">
                {suggestion.description}
              </p>
            </div>
            <span className="shrink-0">
              <PriorityBadge priority={suggestion.priority} />
            </span>
          </div>

          {/* Savings and Model Info */}
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            {showMonetary && (
              <div>
                <span className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                  Est. Monthly Savings
                </span>
                <p className="mt-0.5 text-[1.6rem] font-light leading-tight tracking-tight text-white">
                  <Money value={estimatedMonthlySavings ?? 0} />
                </p>
                {suggestion.metrics?.savings_estimated && (
                  <p className="text-xs text-neutral-500">Estimated</p>
                )}
              </div>
            )}
            {!showMonetary &&
              ["model_downgrade", "caching", "error_reduction"].includes(
                suggestion.type,
              ) && (
                <div>
                  <span className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                    Savings
                  </span>
                  <p className="text-sm text-neutral-400">
                    Insufficient data to estimate
                  </p>
                </div>
              )}
            {secondaryMetric && (
              <div>
                <span className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                  {secondaryMetric.label}
                </span>
                <p className="mt-0.5 text-[1.6rem] font-light leading-tight tracking-tight text-emerald-300 tabular-nums">
                  {secondaryMetric.value}
                </p>
              </div>
            )}
            {suggestion.agent_name && (
              <div>
                <span className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                  Agent
                </span>
                <p className="text-sm font-mono text-white break-all">
                  {suggestion.agent_name}
                </p>
              </div>
            )}
            {/* Show model switch info for model_downgrade */}
            {suggestion.type === "model_downgrade" &&
              suggestion.model &&
              suggestion.alternative_model && (
                <div>
                  <span className="text-[11px] uppercase tracking-[0.1em] text-neutral-500">
                    Switch Model
                  </span>
                  <p className="text-sm text-white wrap-break-word">
                    <span className="text-neutral-400">{suggestion.model}</span>
                    <ArrowRight
                      size={14}
                      className="inline mx-1 text-neutral-500"
                    />
                    <span className="font-medium text-indigo-200">
                      {suggestion.alternative_model}
                    </span>
                  </p>
                </div>
              )}
          </div>

          {/* Confidence and Quality Badges */}
          {suggestion.type === "model_downgrade" && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {/* Confidence Badge - Proven vs Suggested */}
              <ConfidenceBadge
                source={suggestion.metrics?.source}
                confidenceScore={suggestion.metrics?.confidence_score}
                timesImplemented={suggestion.metrics?.times_implemented}
                savingsAccuracy={suggestion.metrics?.savings_accuracy}
              />

              {suggestion.metrics?.capability_requirements &&
                (() => {
                  const caps = suggestion.metrics?.capability_requirements;
                  const unknownCaps = Object.entries(caps).filter(
                    ([, value]) => value === "unknown",
                  );
                  if (unknownCaps.length === 0) return null;
                  return <Badge variant="gray">Compatibility unknown</Badge>;
                })()}

              {/* Quality Impact Badge - only shown for learned alternatives */}
              {suggestion.metrics?.quality_impact &&
            KNOWN_IMPACT.has(suggestion.metrics.quality_impact) && (
                <Badge
                  variant={
                    suggestion.metrics.quality_impact === "minimal"
                      ? "green"
                      : suggestion.metrics.quality_impact === "moderate"
                        ? "yellow"
                        : "red"
                  }
                >
                  {suggestion.metrics.quality_impact === "minimal" && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} /> Minimal price delta
                    </span>
                  )}
                  {suggestion.metrics.quality_impact === "moderate" && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={12} /> Moderate price delta
                    </span>
                  )}
                  {suggestion.metrics.quality_impact === "significant" && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={12} /> Significant price delta
                    </span>
                  )}
                </Badge>
              )}
            </div>
          )}

          {/* Quality Impact Badge for non-model_downgrade types */}
          {suggestion.type !== "model_downgrade" &&
            suggestion.metrics?.quality_impact &&
            KNOWN_IMPACT.has(suggestion.metrics.quality_impact) && (
              <div className="mt-3">
                <Badge
                  variant={
                    suggestion.metrics.quality_impact === "minimal"
                      ? "green"
                      : suggestion.metrics.quality_impact === "moderate"
                        ? "yellow"
                        : "red"
                  }
                >
                  {suggestion.metrics.quality_impact === "minimal" && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={12} /> Minimal price delta
                    </span>
                  )}
                  {suggestion.metrics.quality_impact === "moderate" && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={12} /> Moderate price delta
                    </span>
                  )}
                  {suggestion.metrics.quality_impact === "significant" && (
                    <span className="flex items-center gap-1">
                      <AlertTriangle size={12} /> Significant price delta
                    </span>
                  )}
                </Badge>
              </div>
            )}

          {/* Action Items (Expandable) */}
          {suggestion.action_items && suggestion.action_items.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-[13px] text-neutral-400 transition-colors hover:text-white"
              >
                <ChevronRight
                  size={16}
                  className={`transform transition-transform ${expanded ? "rotate-90" : ""}`}
                />
                {expanded ? "Hide" : "Show"} Action Items (
                {suggestion.action_items.length})
              </button>

              {expanded && (
                <ul className="mt-3 space-y-2">
                  {suggestion.action_items.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowRight
                        size={14}
                        className="mt-0.5 shrink-0 text-neutral-500"
                      />
                      <span className="text-neutral-300">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {recommendation && onImplement && onDismiss && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-white/6 pt-4">
              <button
                onClick={() => onImplement(recommendation)}
                disabled={isActioning}
                className="flex items-center gap-2 rounded-xl bg-indigo-200 px-4 py-2.5 text-[13px] font-semibold text-[#0d0d14] transition-colors hover:bg-indigo-100 disabled:opacity-50"
              >
                <Check size={16} />
                Implement
              </button>
              <button
                onClick={() => onDismiss(recommendation.id)}
                disabled={isActioning}
                className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/4 px-4 py-2.5 text-[13px] text-neutral-300 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
              >
                <X size={16} />
                Dismiss
              </button>
              <span className="text-xs text-neutral-500 ml-auto">
                Expires{" "}
                {new Date(recommendation.expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Demo-only conversion CTA placed right after the optimization list — the
 * moment the "$/month savings" proof has just landed.
 */
function DemoOptimizationsCTA() {
  const demoSavings = useMemo(() => {
    const summary = demoOptimizationSummary();
    return {
      monthly: Math.round(summary.total_potential_savings_monthly),
      count: summary.suggestion_count,
    };
  }, []);

  const handleClick = () => {
    trackDemo("signup_click", { page: "/optimizations" });
    track("click_signup", { location: "demo_optimizations" });
    prewarmBackend(true);
  };

  return (
    <Card className="border-indigo-300/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-300/15 bg-indigo-300/8 text-indigo-200">
            <TrendingDown size={18} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-medium text-white">
              These {demoSavings.count} changes would save NovaDesk{" "}
              <span className="text-indigo-200">
                {formatCurrency(demoSavings.monthly)}/mo
              </span>
              .
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              See what&apos;s hiding in your spend. Connect your agents with two
              lines of Python.
            </p>
          </div>
        </div>
        <Link
          href="/auth/register?from=demo"
          onClick={handleClick}
          className="group shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-200 hover:bg-indigo-100 px-5 py-2.5 text-sm font-semibold text-[#0d0d14] transition-colors"
        >
          Create free account
          <ArrowRight
            size={15}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </Card>
  );
}

export default function OptimizationsPage() {
  const { isConfigured } = useApiConfiguration();
  const { isDemo } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [summary, setSummary] = useState<OptimizationSummary | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [dismissDialogId, setDismissDialogId] = useState<string | null>(null);
  const [implementedRecommendation, setImplementedRecommendation] =
    useState<Recommendation | null>(null);

  const fetchData = useCallback(async () => {
    if (!api.hasProjectAccess()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [suggestionsData, summaryData, recommendationsData] =
        await Promise.all([
          api.generateOptimizationRecommendations(),
          api.getOptimizationSummary(),
          api.getPendingRecommendations(),
        ]);
      setSuggestions(suggestionsData);
      setSummary(summaryData);
      setRecommendations(recommendationsData);
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Find matching recommendation for a suggestion
  const findRecommendation = (
    suggestion: OptimizationSuggestion,
  ): Recommendation | undefined => {
    return recommendations.find(
      (r) =>
        r.type === suggestion.type &&
        r.agent_name === suggestion.agent_name &&
        r.model === suggestion.model &&
        r.alternative_model === suggestion.alternative_model,
    );
  };

  // Handle implement action
  const handleImplement = async (recommendation: Recommendation) => {
    setIsActioning(true);
    try {
      await api.markRecommendationImplemented(recommendation.id);
      // Remove from local state
      setRecommendations((prev) =>
        prev.filter((r) => r.id !== recommendation.id),
      );
      // Show success message
      setSuccessMessage(
        `Marked as implemented! Estimated savings: ${formatCurrency(recommendation.estimated_monthly_savings)}/month`,
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      // Show implementation modal with guidance
      setImplementedRecommendation(recommendation);
    } catch (err) {
      console.error("Failed to mark as implemented:", err);
      setError(parseApiError(err));
    } finally {
      setIsActioning(false);
    }
  };

  // Handle dismiss action
  const handleDismiss = async (feedback: string) => {
    if (!dismissDialogId) return;

    setIsActioning(true);
    try {
      await api.dismissRecommendation(dismissDialogId, feedback);
      // Remove from local state
      setRecommendations((prev) =>
        prev.filter((r) => r.id !== dismissDialogId),
      );
      setDismissDialogId(null);
      // Show success message
      setSuccessMessage(
        "Recommendation dismissed. We'll learn from your feedback.",
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      // Refresh data
      await fetchData();
    } catch (err) {
      console.error("Failed to dismiss:", err);
      setError(parseApiError(err));
    } finally {
      setIsActioning(false);
    }
  };

  // Close implementation modal and refresh
  const handleCloseImplementationModal = async () => {
    setImplementedRecommendation(null);
    await fetchData();
  };

  // Show onboarding if not configured or invalid API key
  if (isConfigured === false || showOnboarding) return <OnboardingScreen />;
  if (isConfigured === null) return <LoadingSpinner />;

  // Group suggestions by priority
  const highPriority = suggestions.filter((s) => s.priority === "high");
  const mediumPriority = suggestions.filter((s) => s.priority === "medium");
  const lowPriority = suggestions.filter((s) => s.priority === "low");

  const monthlySpend = summary?.current_monthly_spend || 0;
  const slices = suggestions
    .filter((s) => (s.estimated_savings_monthly ?? 0) > 0)
    .sort((a, b) => (b.estimated_savings_monthly ?? 0) - (a.estimated_savings_monthly ?? 0))
    .slice(0, 8)
    .map((s, i) => ({
      key: `${s.type}-${s.agent_name}-${s.title}`,
      title: s.title,
      savings: s.estimated_savings_monthly ?? 0,
      color: seriesColor(i),
    }));
  const slicesTotal = slices.reduce((sum, s) => sum + s.savings, 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Optimizations
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            What to change, derived from your own usage. No model calls, no
            prompt content.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-white/6 px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:border-white/12 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-900/50 bg-red-950/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-400" size={20} />
            <div>
              <p className="text-red-400">{error}</p>
              <p className="mt-1 text-sm text-neutral-400">
                Make sure the backend is running and you have some event data.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Success Toast */}
      {successMessage && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300 sm:left-auto sm:right-6">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-900/90 border border-emerald-700 shadow-lg backdrop-blur-sm">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <p className="text-sm text-white">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-400 hover:text-white transition-colors ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* What is recoverable, and where it comes from */}
      {!loading && summary && (
        <div id="tour-savings" className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          <section className={cn(SURFACE, "p-5 sm:p-7")}>
            <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
              <div>
                <Eyebrow>Recoverable each month</Eyebrow>
                <div className="mt-2.5 flex flex-wrap items-end gap-x-4 gap-y-2">
                  <Money
                    value={summary.total_potential_savings_monthly || 0}
                    className="text-[3.25rem] font-light leading-none tracking-[-0.03em] text-white sm:text-[4rem]"
                  />
                  {monthlySpend > 0 && (
                    <span className="pb-1.5 text-[13px] text-neutral-500">
                      <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[12.5px] font-medium tabular-nums text-emerald-300">
                        {formatPercentage(summary.total_potential_savings_percent || 0)}
                      </span>{" "}
                      of {usd(monthlySpend)} a month
                    </span>
                  )}
                </div>
              </div>
              <dl className="flex gap-8 sm:gap-10">
                {[
                  ["Suggestions", String(summary.suggestion_count || 0), `${summary.high_priority_count || 0} high priority`],
                  [
                    "Pending",
                    String(recommendations.length),
                    recommendations.length === 0 ? "all reviewed" : "awaiting a decision",
                  ],
                  ...(summary.effectiveness && summary.effectiveness.total_recommendations > 0
                    ? [
                        [
                          "Acted on",
                          `${summary.effectiveness.implemented} of ${summary.effectiveness.total_recommendations}`,
                          `${summary.effectiveness.dismissed} dismissed`,
                        ],
                      ]
                    : []),
                ].map(([label, value, sub]) => (
                  <div key={label}>
                    <dt className="text-[11.5px] text-neutral-500">{label}</dt>
                    <dd className="mt-1 text-[17px] font-medium tabular-nums text-white">{value}</dd>
                    <dd className="mt-0.5 text-[11.5px] text-neutral-600">{sub}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The monthly bill as one bar: each change's slice lit, the rest
                is what the bill becomes. */}
            {slices.length > 0 && monthlySpend > 0 && (
              <div className="mt-8 border-t border-white/6 pt-6">
                <div className="flex items-baseline justify-between gap-4 text-[12px] text-neutral-500">
                  <span>Each change as a slice of the monthly bill</span>
                  <span className="tabular-nums">{usd(monthlySpend)}</span>
                </div>
                <div className="mt-3 flex h-4 gap-[3px]">
                  {slices.map((s) => (
                    <span
                      key={s.key}
                      title={`${s.title}: ${usd(s.savings)} a month`}
                      className="min-w-1.5 rounded-[5px]"
                      style={{
                        flexGrow: s.savings,
                        flexBasis: 0,
                        backgroundColor: s.color,
                        boxShadow: `0 0 14px ${s.color}80`,
                      }}
                    />
                  ))}
                  {monthlySpend > slicesTotal && (
                    <span
                      className="rounded-[5px] bg-white/8"
                      style={{ flexGrow: monthlySpend - slicesTotal, flexBasis: 0 }}
                    />
                  )}
                </div>
                <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                  {slices.map((s) => (
                    <li key={s.key} className="flex items-center justify-between gap-3 text-[12.5px]">
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: s.color }} aria-hidden />
                        <span className="truncate text-neutral-300">{s.title}</span>
                      </span>
                      <span className="shrink-0 tabular-nums text-neutral-400">{usd(s.savings)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="flex items-center gap-2.5">
                      <span className="size-2 shrink-0 rounded-[3px] bg-white/15" aria-hidden />
                      <span className="text-neutral-500">What the bill becomes</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-neutral-500">{usd(Math.max(monthlySpend - slicesTotal, 0))}</span>
                  </li>
                </ul>
              </div>
            )}
          </section>

          <AccentPanel>
            <p className="text-[1.5rem] font-light tracking-tight text-white">
              {monthlySpend > 0 ? "The bill after these changes" : "Share of spend recoverable"}
            </p>
            <p className="mt-3 text-[2.75rem] font-light leading-none tracking-[-0.03em] text-white">
              {monthlySpend > 0 ? (
                <Money value={Math.max(monthlySpend - (summary.total_potential_savings_monthly || 0), 0)} />
              ) : (
                formatPercentage(summary.total_potential_savings_percent || 0)
              )}
            </p>
            {monthlySpend > 0 && (
              <p className="mt-2 text-[13px] text-neutral-300">a month, down from {usd(monthlySpend)}</p>
            )}
            <p className="mt-4 max-w-[34ch] text-[13.5px] leading-relaxed text-neutral-400">
              If every suggestion below is applied. Each one is an estimate
              from your own usage, and you decide which to take.
            </p>
            <div className="mt-auto space-y-2.5 pt-10">
              <a
                href="#suggestions"
                className="group flex items-center justify-center gap-2 rounded-xl bg-indigo-100 px-4 py-3.5 text-[13.5px] font-semibold text-[#0d0d14] shadow-[0_8px_30px_rgba(30,27,75,0.35)] transition-colors hover:bg-white"
              >
                Review the changes
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-y-0.5 rotate-90" aria-hidden />
              </a>
              <Link
                href="/guardrails"
                className="flex items-center justify-center rounded-xl border border-white/25 bg-[#1e1b4b]/35 px-4 py-3.5 text-[13.5px] font-medium text-white backdrop-blur-md transition-colors hover:bg-[#1e1b4b]/50"
              >
                Set a limit per agent
              </Link>
            </div>
          </AccentPanel>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)]">
          <PanelSkeleton className="h-80" />
          <PanelSkeleton className="h-80" />
        </div>
      )}

      {/* No Suggestions State - Context-aware messaging */}
      {!loading && suggestions.length === 0 && !error && summary && (
        <>
          {/* No Data - No events yet */}
          {summary.empty_reason === "no_data" && (
            <Card className="border-sky-900/50 bg-sky-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-900/30">
                  <Database size={24} className="text-sky-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sky-400">
                    No usage data yet
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    Start sending LLM events to get personalized cost
                    optimization recommendations. Integrate the AgentCost SDK
                    into your application to begin tracking.
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Need help? Check the documentation for SDK integration
                    guides.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Insufficient Data - Some events but not enough for analysis */}
          {summary.empty_reason === "insufficient_data" && (
            <Card className="border-amber-900/50 bg-amber-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-900/30">
                  <Clock size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-400">
                    Gathering more data
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    You have {summary.event_count || 0} events so far. The
                    optimization engine needs at least 10 calls per agent/model
                    combination to generate meaningful recommendations.
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Keep using your LLM agents and check back soon!
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* No Baselines - Has data but baselines couldn't be computed */}
          {summary.empty_reason === "no_baselines" && (
            <Card className="border-amber-900/50 bg-amber-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-900/30">
                  <TrendingDown size={24} className="text-amber-400" />
                </div>
                <div>
                  <h3 className="font-medium text-amber-400">
                    Building usage baselines
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    You have {summary.event_count || 0} events, but each
                    agent/model needs at least 10 calls to establish statistical
                    baselines. Baselines enable anomaly detection and accurate
                    savings estimates.
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Focus usage on specific agents to build baselines faster.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Truly Optimized - Has data and baselines, no opportunities found */}
          {summary.empty_reason === "optimized" && (
            <Card className="border-emerald-900/50 bg-emerald-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-900/30">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-emerald-400">
                    Your setup is optimized!
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    No cost optimization opportunities found based on your
                    current usage patterns across {summary.event_count || 0}{" "}
                    analyzed events. Keep monitoring as your usage evolves.
                  </p>
                  <p className="mt-2 text-xs text-neutral-500">
                    Pro tip: As model prices change, new optimization
                    opportunities may appear.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Fallback for missing empty_reason */}
          {!summary.empty_reason && (
            <Card className="border-emerald-900/50 bg-emerald-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-900/30">
                  <CheckCircle2 size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-medium text-emerald-400">
                    Your setup is optimized!
                  </h3>
                  <p className="mt-1 text-sm text-neutral-400">
                    No cost optimization opportunities found based on your
                    current usage patterns. Keep monitoring as your usage grows.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* High Priority Suggestions */}
      <span id="suggestions" className="block scroll-mt-6" />
      {highPriority.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-3 text-[1.35rem] font-light tracking-tight text-white">
            <span className="size-2 rounded-full bg-red-400" aria-hidden />
            High priority
            <span className="rounded-full bg-white/6 px-2 py-0.5 text-[11.5px] font-normal text-neutral-300">
              {highPriority.length}
            </span>
          </h2>
          <div className="space-y-4">
            {highPriority.map((suggestion, idx) => (
              <OptimizationCard
                key={idx}
                suggestion={suggestion}
                recommendation={findRecommendation(suggestion)}
                onImplement={handleImplement}
                onDismiss={(id) => setDismissDialogId(id)}
                isActioning={isActioning}
              />
            ))}
          </div>
        </div>
      )}

      {/* Medium Priority Suggestions */}
      {mediumPriority.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-3 text-[1.35rem] font-light tracking-tight text-white">
            <span className="size-2 rounded-full bg-amber-400" aria-hidden />
            Medium priority
            <span className="rounded-full bg-white/6 px-2 py-0.5 text-[11.5px] font-normal text-neutral-300">
              {mediumPriority.length}
            </span>
          </h2>
          <div className="space-y-4">
            {mediumPriority.map((suggestion, idx) => (
              <OptimizationCard
                key={idx}
                suggestion={suggestion}
                recommendation={findRecommendation(suggestion)}
                onImplement={handleImplement}
                onDismiss={(id) => setDismissDialogId(id)}
                isActioning={isActioning}
              />
            ))}
          </div>
        </div>
      )}

      {/* Low Priority Suggestions */}
      {lowPriority.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-3 text-[1.35rem] font-light tracking-tight text-white">
            <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
            Low priority
            <span className="rounded-full bg-white/6 px-2 py-0.5 text-[11.5px] font-normal text-neutral-300">
              {lowPriority.length}
            </span>
          </h2>
          <div className="space-y-4">
            {lowPriority.map((suggestion, idx) => (
              <OptimizationCard
                key={idx}
                suggestion={suggestion}
                recommendation={findRecommendation(suggestion)}
                onImplement={handleImplement}
                onDismiss={(id) => setDismissDialogId(id)}
                isActioning={isActioning}
              />
            ))}
          </div>
        </div>
      )}

      {/* Demo conversion CTA — after the savings proof, demo mode only */}
      {isDemo && !loading && suggestions.length > 0 && <DemoOptimizationsCTA />}

      {/* Info Card */}
      <Card>
        <div className="flex items-start gap-4">
          <Zap size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-indigo-200" />
          <div>
            <h3 className="font-medium text-white">
              How Optimization Suggestions Work
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              AgentCost analyzes your LLM usage patterns over the last 30 days
              to identify cost-saving opportunities:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-neutral-400">
              <li className="flex items-center gap-2">
                <Cpu size={14} className="shrink-0 text-neutral-500" />
                <span>
                  <strong>Model Downgrades:</strong> Suggests cheaper models for
                  simple tasks
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Database size={14} className="shrink-0 text-neutral-500" />
                <span>
                  <strong>Caching:</strong> Identifies repeated queries that can
                  be cached
                </span>
              </li>
              <li className="flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-neutral-500" />
                <span>
                  <strong>Anomaly Alerts:</strong> Detects unusual spending
                  spikes
                </span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle size={14} className="shrink-0 text-neutral-500" />
                <span>
                  <strong>Error Patterns:</strong> Highlights agents with high
                  failure rates
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Timer size={14} className="shrink-0 text-neutral-500" />
                <span>
                  <strong>Latency Issues:</strong> Flags slow calls that may
                  benefit from optimization
                </span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-neutral-500 flex items-start gap-2">
              <Lightbulb
                size={14}
                className="mt-0.5 shrink-0 text-neutral-500"
              />
              <span>
                Your decisions help the system learn and provide better
                recommendations over time.
              </span>
            </p>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <FeedbackDialog
        isOpen={dismissDialogId !== null}
        onClose={() => setDismissDialogId(null)}
        onSubmit={handleDismiss}
        isLoading={isActioning}
      />

      <ImplementationModal
        isOpen={implementedRecommendation !== null}
        onClose={handleCloseImplementationModal}
        recommendation={implementedRecommendation}
      />
    </div>
  );
}
