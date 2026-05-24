"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Settings,
  Key,
  ArrowRight,
  Zap,
  BarChart3,
  DollarSign,
  LineChart,
  Shield,
  Clock,
  CheckCircle2,
} from "lucide-react";

/**
 * Hook to check whether project-scoped requests can succeed right now.
 *
 * Returns true when EITHER:
 *  - an SDK API key is configured (legacy / SDK / solo path), OR
 *  - the user is signed in AND has an active project selected (team path
 *    for invited members who don't have the project's raw API key).
 */
export function useApiConfiguration() {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const recheck = () => setIsConfigured(api.hasProjectAccess());
    recheck();

    const handleStorageChange = (e: StorageEvent) => {
      if (
        e.key === "agentcost_config" ||
        e.key === "agentcost_active_project_id" ||
        e.key === "access_token"
      ) {
        recheck();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("agentcost_config_updated", recheck);
    window.addEventListener("agentcost_active_project_changed", recheck);
    window.addEventListener("tokens-refreshed", recheck);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("agentcost_config_updated", recheck);
      window.removeEventListener("agentcost_active_project_changed", recheck);
      window.removeEventListener("tokens-refreshed", recheck);
    };
  }, []);

  const recheckConfiguration = () => setIsConfigured(api.hasProjectAccess());

  return { isConfigured, recheckConfiguration };
}

/**
 * Feature card for onboarding
 */
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-800/30 border border-neutral-700/50 hover:border-neutral-600/50 transition-colors">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10">
        <Icon className="w-5 h-5 text-primary-400" />
      </div>
      <div>
        <h3 className="font-medium text-white">{title}</h3>
        <p className="text-sm text-neutral-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

/**
 * Step indicator for setup guide
 */
function SetupStep({
  number,
  title,
  description,
  isLast = false,
}: {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-white font-semibold text-sm">
          {number}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-linear-to-b from-primary-500 to-neutral-700 mt-2" />
        )}
      </div>
      <div className={!isLast ? "pb-6" : ""}>
        <h4 className="font-medium text-white">{title}</h4>
        <p className="text-sm text-neutral-400 mt-1">{description}</p>
      </div>
    </div>
  );
}

/**
 * Professional onboarding component shown when API key is not configured
 */
export function OnboardingScreen() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="max-w-4xl w-full px-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Animated Logo */}
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary-500/20 rounded-2xl blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-primary-500 to-primary-700 shadow-lg mx-auto">
              <span className="text-2xl font-bold text-white">AC</span>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to AgentCost
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
            The complete observability platform for your AI agents. Track costs,
            optimize performance, and gain insights into every LLM call.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <FeatureCard
            icon={DollarSign}
            title="Cost Tracking"
            description="Real-time cost monitoring for every API call across all your agents and models."
          />
          <FeatureCard
            icon={BarChart3}
            title="Rich Analytics"
            description="Detailed breakdowns by agent, model, and time period with beautiful visualizations."
          />
          <FeatureCard
            icon={Zap}
            title="Smart Optimizations"
            description="AI-powered suggestions to reduce costs without sacrificing quality."
          />
        </div>

        {/* Main Card */}
        <div className="bg-neutral-800/50 rounded-2xl border border-neutral-700/50 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left Side - Setup Guide */}
            <div className="p-8 border-b lg:border-b-0 lg:border-r border-neutral-700/50">
              <div className="flex items-center gap-2 text-primary-400 text-sm font-medium mb-4">
                <Clock className="w-4 h-4" />
                <span>Takes less than 2 minutes</span>
              </div>

              <h2 className="text-2xl font-bold text-white mb-6">
                Quick Setup Guide
              </h2>

              <div className="space-y-0">
                <SetupStep
                  number={1}
                  title="Create a Project"
                  description="Go to Settings and create a new project for your application."
                />
                <SetupStep
                  number={2}
                  title="Copy Your API Key"
                  description="Your unique API key will be shown once. Save it securely!"
                />
                <SetupStep
                  number={3}
                  title="Save Configuration"
                  description="Paste the API key in the settings page and click Save."
                />
                <SetupStep
                  number={4}
                  title="Integrate the SDK"
                  description="Add 2 lines of code to start tracking your LLM costs."
                  isLast
                />
              </div>
            </div>

            {/* Right Side - CTA and Code Preview */}
            <div className="p-8 bg-neutral-900/50">
              <h3 className="text-lg font-semibold text-white mb-4">
                Ready to get started?
              </h3>

              <Link
                href="/settings"
                className="flex items-center justify-center gap-3 w-full bg-linear-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 mb-6"
              >
                <Settings className="w-5 h-5" />
                <span>Go to Settings</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              {/* Code Preview */}
              <div className="rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border-b border-neutral-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                  </div>
                  <span className="text-xs text-neutral-500 font-mono ml-2">
                    main.py
                  </span>
                </div>
                <pre className="p-4 text-sm overflow-x-auto">
                  <code className="text-neutral-300">
                    <span className="text-purple-400">import</span> agentcost
                    {"\n"}
                    {"\n"}
                    <span className="text-neutral-500">
                      # Initialize with your API key
                    </span>
                    {"\n"}
                    agentcost.<span className="text-yellow-300">init</span>
                    (api_key=
                    <span className="text-green-400">
                      &quot;sk_your_key&quot;
                    </span>
                    ){"\n"}
                    {"\n"}
                    <span className="text-neutral-500">
                      # Your OpenAI, Anthropic, and LangChain calls are now tracked!
                    </span>
                  </code>
                </pre>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 pt-6 border-t border-neutral-700/50">
                <div className="flex items-center gap-4 text-sm text-neutral-400">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Open Source</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>Lightweight SDK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-neutral-500 text-sm mt-8">
          Need help? Check out our{" "}
          <Link
            href="/docs/sdk"
            className="text-primary-400 hover:text-primary-300 underline"
          >
            SDK Documentation
          </Link>{" "}
          or{" "}
          <Link
            href="/docs/api"
            className="text-primary-400 hover:text-primary-300 underline"
          >
            API Reference
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * Loading spinner component
 */
export function LoadingSpinner() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse" />
        <div className="relative animate-spin rounded-full h-10 w-10 border-2 border-neutral-700 border-t-primary-500"></div>
      </div>
    </div>
  );
}
