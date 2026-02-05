"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, MetricCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  api,
  OptimizationSuggestion,
  OptimizationSummary,
  Recommendation,
} from "@/lib/api";
import { formatCurrency, formatPercentage, parseApiError } from "@/lib/utils";
import {
  Zap,
  TrendingDown,
  DollarSign,
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

// Priority badge colors
function PriorityBadge({ priority }: { priority: string }) {
  const config = {
    high: { color: "red", label: "High Priority" },
    medium: { color: "yellow", label: "Medium Priority" },
    low: { color: "green", label: "Low Priority" },
  }[priority] || { color: "gray", label: priority };

  return (
    <Badge variant={config.color as "red" | "yellow" | "green" | "gray"}>
      {config.label}
    </Badge>
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
    model_downgrade: <Cpu size={20} className="text-blue-400" />,
    caching: <Database size={20} className="text-purple-400" />,
    prompt_optimization: <Lightbulb size={20} className="text-yellow-400" />,
    batching: <RefreshCw size={20} className="text-green-400" />,
    token_reduction: <TrendingDown size={20} className="text-orange-400" />,
    error_reduction: <XCircle size={20} className="text-red-400" />,
    anomaly_alert: <AlertCircle size={20} className="text-amber-400" />,
    latency: <Timer size={20} className="text-cyan-400" />,
  };
  return icons[type] || <Zap size={20} className="text-gray-400" />;
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
    ["model_downgrade", "caching", "error_reduction"].includes(
      suggestion.type,
    ) && estimatedMonthlySavings !== null;

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
    <Card className="hover:border-neutral-700 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-neutral-800">
          <OptimizationTypeIcon type={suggestion.type} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-white">{suggestion.title}</h3>
              <p className="mt-1 text-sm text-neutral-400 line-clamp-2">
                {suggestion.description}
              </p>
            </div>
            <PriorityBadge priority={suggestion.priority} />
          </div>

          {/* Savings and Model Info */}
          <div className="mt-4 flex flex-wrap items-center gap-6">
            {showMonetary && (
              <div>
                <span className="text-xs text-neutral-500 uppercase">
                  Est. Monthly Savings
                </span>
                <p className="text-lg font-semibold text-emerald-400">
                  {formatCurrency(estimatedMonthlySavings ?? 0)}
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
                  <span className="text-xs text-neutral-500 uppercase">
                    Savings
                  </span>
                  <p className="text-sm text-neutral-400">
                    Insufficient data to estimate
                  </p>
                </div>
              )}
            {secondaryMetric && (
              <div>
                <span className="text-xs text-neutral-500 uppercase">
                  {secondaryMetric.label}
                </span>
                <p className="text-lg font-semibold text-emerald-400">
                  {secondaryMetric.value}
                </p>
              </div>
            )}
            {suggestion.agent_name && (
              <div>
                <span className="text-xs text-neutral-500 uppercase">
                  Agent
                </span>
                <p className="text-sm font-mono text-white">
                  {suggestion.agent_name}
                </p>
              </div>
            )}
            {/* Show model switch info for model_downgrade */}
            {suggestion.type === "model_downgrade" &&
              suggestion.model &&
              suggestion.alternative_model && (
                <div>
                  <span className="text-xs text-neutral-500 uppercase">
                    Switch Model
                  </span>
                  <p className="text-sm text-white">
                    <span className="text-neutral-400">{suggestion.model}</span>
                    <ArrowRight
                      size={14}
                      className="inline mx-1 text-emerald-400"
                    />
                    <span className="text-emerald-400 font-medium">
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
              {suggestion.metrics?.quality_impact && (
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
            suggestion.metrics?.quality_impact && (
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
                className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
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
            <div className="mt-4 flex items-center gap-3 pt-4 border-t border-neutral-800">
              <button
                onClick={() => onImplement(recommendation)}
                disabled={isActioning}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                Implement
              </button>
              <button
                onClick={() => onDismiss(recommendation.id)}
                disabled={isActioning}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-700 text-neutral-300 text-sm font-medium hover:bg-neutral-600 transition-colors disabled:opacity-50"
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

export default function OptimizationsPage() {
  const { isConfigured } = useApiConfiguration();
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
    if (!api.isConfigured()) {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Cost Optimizations
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            AI-powered recommendations to reduce your LLM costs
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 text-white text-sm hover:bg-neutral-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
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
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
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

      {/* Summary Cards */}
      {!loading && summary && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Potential Monthly Savings"
            value={formatCurrency(summary.total_potential_savings_monthly || 0)}
            subtitle="If all suggestions applied"
            icon={<DollarSign size={20} />}
          />
          <MetricCard
            title="Savings Percentage"
            value={formatPercentage(
              summary.total_potential_savings_percent || 0,
            )}
            subtitle={`Of ${formatCurrency(summary.current_monthly_spend || 0)}/mo spend`}
            icon={<TrendingDown size={20} />}
          />
          <MetricCard
            title="Total Suggestions"
            value={(summary.suggestion_count || 0).toString()}
            subtitle={`${summary.high_priority_count || 0} high priority`}
            icon={<Lightbulb size={20} />}
          />
          <MetricCard
            title="Pending Actions"
            value={recommendations.length.toString()}
            subtitle={
              recommendations.length === 0
                ? "All reviewed!"
                : "Awaiting your decision"
            }
            icon={
              recommendations.length === 0 ? (
                <CheckCircle2 size={20} />
              ) : (
                <Clock size={20} />
              )
            }
          />
        </div>
      )}

      {/* Effectiveness Stats */}
      {!loading &&
        summary?.effectiveness &&
        summary.effectiveness.total_recommendations > 0 && (
          <Card className="border-neutral-700">
            <h3 className="font-medium text-white mb-3">
              Recommendation Effectiveness
            </h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <span className="text-neutral-500">Total:</span>{" "}
                <span className="text-white">
                  {summary.effectiveness.total_recommendations}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Implemented:</span>{" "}
                <span className="text-emerald-400">
                  {summary.effectiveness.implemented}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Dismissed:</span>{" "}
                <span className="text-red-400">
                  {summary.effectiveness.dismissed}
                </span>
              </div>
              <div>
                <span className="text-neutral-500">Implementation Rate:</span>{" "}
                <span className="text-blue-400">
                  {formatPercentage(summary.effectiveness.implementation_rate)}
                </span>
              </div>
            </div>
          </Card>
        )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 w-24 rounded bg-neutral-700" />
              <div className="mt-2 h-8 w-32 rounded bg-neutral-700" />
            </Card>
          ))}
        </div>
      )}

      {/* No Suggestions State - Context-aware messaging */}
      {!loading && suggestions.length === 0 && !error && summary && (
        <>
          {/* No Data - No events yet */}
          {summary.empty_reason === "no_data" && (
            <Card className="border-blue-900/50 bg-blue-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900/30">
                  <Database size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-400">
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
            <Card className="border-yellow-900/50 bg-yellow-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-900/30">
                  <Clock size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-400">
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
            <Card className="border-yellow-900/50 bg-yellow-950/20">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-900/30">
                  <TrendingDown size={24} className="text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-400">
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/30">
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-900/30">
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
      {highPriority.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <AlertTriangle size={18} className="text-red-400" />
            High Priority ({highPriority.length})
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
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <Clock size={18} className="text-yellow-400" />
            Medium Priority ({mediumPriority.length})
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
          <h2 className="mb-4 flex items-center gap-2 text-lg font-medium text-white">
            <Lightbulb size={18} className="text-green-400" />
            Low Priority ({lowPriority.length})
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

      {/* Info Card */}
      <Card className="border-blue-900/50 bg-blue-950/10">
        <div className="flex items-start gap-4">
          <Zap size={20} className="mt-0.5 shrink-0 text-blue-400" />
          <div>
            <h3 className="font-medium text-blue-400">
              How Optimization Suggestions Work
            </h3>
            <p className="mt-1 text-sm text-neutral-400">
              AgentCost analyzes your LLM usage patterns over the last 30 days
              to identify cost-saving opportunities:
            </p>
            <ul className="mt-3 space-y-1 text-sm text-neutral-400">
              <li className="flex items-center gap-2">
                <Cpu size={14} className="text-blue-400" />
                <span>
                  <strong>Model Downgrades:</strong> Suggests cheaper models for
                  simple tasks
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Database size={14} className="text-purple-400" />
                <span>
                  <strong>Caching:</strong> Identifies repeated queries that can
                  be cached
                </span>
              </li>
              <li className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-400" />
                <span>
                  <strong>Anomaly Alerts:</strong> Detects unusual spending
                  spikes
                </span>
              </li>
              <li className="flex items-center gap-2">
                <XCircle size={14} className="text-red-400" />
                <span>
                  <strong>Error Patterns:</strong> Highlights agents with high
                  failure rates
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Timer size={14} className="text-cyan-400" />
                <span>
                  <strong>Latency Issues:</strong> Flags slow calls that may
                  benefit from optimization
                </span>
              </li>
            </ul>
            <p className="mt-3 text-sm text-neutral-500 flex items-start gap-2">
              <Lightbulb
                size={14}
                className="mt-0.5 shrink-0 text-yellow-400"
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
