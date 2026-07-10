"use client";

import { useState } from "react";
import {
    CheckCircle2,
    Copy,
    Check,
    ArrowRight,
    ExternalLink,
    Clock,
    TrendingDown,
    Code,
    Database,
    AlertCircle,
    Timer,
    Zap,
    X,
} from "lucide-react";
import { Recommendation } from "@/lib/api";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface ImplementationModalProps {
    isOpen: boolean;
    onClose: () => void;
    recommendation: Recommendation | null;
}

interface ActionStep {
    title: string;
    description: string;
    code?: string;
    language?: string;
}

function generateImplementationSteps(rec: Recommendation): ActionStep[] {
    const steps: ActionStep[] = [];

    switch (rec.type) {
        case "model_downgrade":
            if (rec.model && rec.alternative_model) {
                steps.push({
                    title: "Update your agent configuration",
                    description: `Change the model parameter from "${rec.model}" to "${rec.alternative_model}" in your agent code.`,
                    code: `# Before
model = "${rec.model}"

# After
model = "${rec.alternative_model}"`,
                    language: "python",
                });

                steps.push({
                    title: "Test with sample prompts",
                    description: `Run a few test calls with "${rec.alternative_model}" to verify output quality meets your requirements before full rollout.`,
                });

                steps.push({
                    title: "Monitor performance",
                    description: `After switching, monitor the "${rec.agent_name || "agent"}" agent's success rate and output quality in AgentCost for the next few days.`,
                });
            }
            break;

        case "caching":
            steps.push({
                title: "Identify cacheable patterns",
                description: `The "${rec.agent_name || "agent"}" agent has repeated queries that can be cached. Implement a cache layer for identical inputs.`,
                code: `from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_llm_call(prompt_hash: str):
    # Your LLM call here
    return response`,
                language: "python",
            });

            steps.push({
                title: "Set appropriate TTL",
                description: "Choose a cache expiration time based on how often your data changes. For static data, longer TTLs save more.",
            });

            steps.push({
                title: "Track cache hit rate",
                description: "Monitor your cache hit rate to measure effectiveness. Aim for 30%+ hit rate for meaningful savings.",
            });
            break;

        case "error_reduction":
            steps.push({
                title: "Analyze error patterns",
                description: `Review the errors from "${rec.agent_name || "agent"}" agent to identify common failure modes.`,
            });

            steps.push({
                title: "Add retry logic",
                description: "Implement exponential backoff for transient errors to avoid wasted calls.",
                code: `import tenacity

@tenacity.retry(
    stop=tenacity.stop_after_attempt(3),
    wait=tenacity.wait_exponential(min=1, max=10)
)
def resilient_llm_call(prompt):
    return llm.call(prompt)`,
                language: "python",
            });

            steps.push({
                title: "Validate inputs",
                description: "Add input validation to catch malformed requests before they reach the LLM.",
            });
            break;

        case "anomaly_alert":
            steps.push({
                title: "Investigate the spike",
                description: "Check recent changes in your agent code or traffic patterns that might explain the anomaly.",
            });

            steps.push({
                title: "Set up alerts",
                description: "Configure cost alerts to catch future anomalies before they impact your budget.",
            });

            steps.push({
                title: "Review agent logic",
                description: `Check if "${rec.agent_name || "agent"}" has any loops or recursive calls that could cause excessive API usage.`,
            });
            break;

        case "latency":
            steps.push({
                title: "Optimize prompts",
                description: `Reduce prompt length for "${rec.agent_name || "agent"}" by removing unnecessary context or using more concise instructions.`,
            });

            steps.push({
                title: "Consider streaming",
                description: "Use streaming responses for better perceived performance in user-facing applications.",
                code: `# Enable streaming for faster first-token
response = await client.chat.completions.create(
    model="${rec.model || "gpt-4"}",
    messages=messages,
    stream=True
)`,
                language: "python",
            });

            steps.push({
                title: "Batch when possible",
                description: "Group multiple small requests into batches to reduce per-call overhead.",
            });
            break;

        default:
            steps.push({
                title: "Review the recommendation",
                description: rec.description || "Follow the action items in the recommendation to implement this optimization.",
            });
    }

    return steps;
}

/**
 * Get tracking info text based on recommendation type
 */
function getTrackingInfo(rec: Recommendation): string {
    const savingsText = formatCurrency(rec.estimated_monthly_savings);

    switch (rec.type) {
        case "model_downgrade":
            return `We'll compare your costs before and after the model switch to verify the estimated ${savingsText}/month savings.`;
        case "caching":
            return `Track your cache hit rate and compare monthly costs to measure actual savings against the ${savingsText}/month estimate.`;
        case "error_reduction":
            return `Monitor error rates over the next 30 days to measure the impact on wasted spend.`;
        default:
            return `We'll track your usage patterns to measure the effectiveness of this optimization.`;
    }
}

/**
 * Copy to clipboard with feedback
 */
function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors"
        >
            {copied ? (
                <>
                    <Check size={12} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                </>
            ) : (
                <>
                    <Copy size={12} />
                    <span>Copy</span>
                </>
            )}
        </button>
    );
}

/**
 * Get icon for recommendation type
 */
function getTypeIcon(type: string) {
    switch (type) {
        case "model_downgrade":
            return <Code size={20} className="text-blue-400" />;
        case "caching":
            return <Database size={20} className="text-purple-400" />;
        case "error_reduction":
            return <AlertCircle size={20} className="text-red-400" />;
        case "anomaly_alert":
            return <Zap size={20} className="text-amber-400" />;
        case "latency":
            return <Timer size={20} className="text-cyan-400" />;
        default:
            return <CheckCircle2 size={20} className="text-emerald-400" />;
    }
}

/**
 * Modal shown after user clicks "Implement" on a recommendation.
 * Provides dynamic, context-aware guidance on how to complete the optimization.
 */
export function ImplementationModal({
    isOpen,
    onClose,
    recommendation,
}: ImplementationModalProps) {
    if (!isOpen || !recommendation) return null;

    const steps = generateImplementationSteps(recommendation);
    const trackingInfo = getTrackingInfo(recommendation);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-neutral-900 shadow-2xl border border-neutral-700">
                {/* Header */}
                <div className="sticky top-0 bg-neutral-900 border-b border-neutral-800 p-4 sm:p-6 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-900/30">
                            <CheckCircle2 size={24} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Recommendation Marked as Implemented
                            </h2>
                            <p className="text-sm text-neutral-400">
                                Follow these steps to complete the optimization
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 text-neutral-400 hover:text-white transition-colors p-1"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-6">
                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-neutral-800/50 border border-neutral-700">
                        {getTypeIcon(recommendation.type)}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-white">{recommendation.title}</h3>
                            {recommendation.model && recommendation.alternative_model && (
                                <p className="text-sm text-neutral-400 mt-1 wrap-break-word">
                                    <span className="text-neutral-500">{recommendation.model}</span>
                                    <ArrowRight size={12} className="inline mx-2 text-emerald-400" />
                                    <span className="text-emerald-400">{recommendation.alternative_model}</span>
                                </p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-semibold text-emerald-400">
                                {formatCurrency(recommendation.estimated_monthly_savings)}
                            </p>
                            <p className="text-xs text-neutral-500">est. monthly savings</p>
                        </div>
                    </div>

                    {/* Steps */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
                            Implementation Steps
                        </h3>

                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className="relative pl-8 pb-4 border-l-2 border-neutral-700 last:border-l-0"
                            >
                                {/* Step number */}
                                <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-neutral-800 border-2 border-neutral-600 flex items-center justify-center">
                                    <span className="text-xs font-medium text-neutral-300">{idx + 1}</span>
                                </div>

                                {/* Step content */}
                                <div className="ml-4">
                                    <h4 className="font-medium text-white">{step.title}</h4>
                                    <p className="mt-1 text-sm text-neutral-400">{step.description}</p>

                                    {step.code && (
                                        <div className="mt-3 relative">
                                            <div className="absolute top-2 right-2">
                                                <CopyButton text={step.code} />
                                            </div>
                                            <pre className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 text-sm overflow-x-auto">
                                                <code className="text-neutral-300">{step.code}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tracking Info */}
                    <div className="p-4 rounded-lg bg-blue-950/30 border border-blue-900/50">
                        <div className="flex items-start gap-3">
                            <TrendingDown size={18} className="mt-0.5 text-blue-400 shrink-0" />
                            <div>
                                <h4 className="font-medium text-blue-400">Savings Tracking</h4>
                                <p className="mt-1 text-sm text-neutral-400">{trackingInfo}</p>
                            </div>
                        </div>
                    </div>

                    {/* Documentation link */}
                    {recommendation.type === "model_downgrade" && (
                        <a
                            href="https://platform.openai.com/docs/models"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                        >
                            <ExternalLink size={14} />
                            View model capabilities documentation
                        </a>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-neutral-900 border-t border-neutral-800 p-4 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
