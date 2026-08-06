"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  api,
  getStoredApiKeyForProject,
  getFallbackProjectKey,
} from "@/lib/api";
import { track } from "@/lib/analytics";
import { OpenAIImportModal } from "@/components/onboarding/OpenAIImportModal";
import {
  Terminal,
  ArrowRight,
  Check,
  Copy,
  KeyRound,
  Settings,
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

/** Small copy button used on the onboarding code blocks. */
function CopyButton({
  text,
  onCopied,
}: {
  text: string;
  onCopied?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    onCopied?.();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-400 hover:text-white transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={12} className="text-green-400" />
      ) : (
        <Copy size={12} />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * Get-started screen shown when no project/API key is configured yet.
 *
 * Uses the user's ACTUAL stored API key and project UUID (auto-stored at
 * project creation) so the snippet is genuinely copy-paste-run — no manual
 * "paste your key into settings" step exists anymore.
 */
export function OnboardingScreen() {
  const [importOpen, setImportOpen] = useState(false);
  const [credentials, setCredentials] = useState<{
    apiKey: string;
    projectId: string;
  }>({ apiKey: "", projectId: "" });
  const viewTracked = useRef(false);

  useEffect(() => {
    if (!viewTracked.current) {
      viewTracked.current = true;
      track("onboarding_viewed");
    }

    const readCredentials = () => {
      const activeId = api.getActiveProjectId();
      if (activeId) {
        setCredentials({
          projectId: activeId,
          apiKey: getStoredApiKeyForProject(activeId),
        });
      } else {
        const fallback = getFallbackProjectKey();
        setCredentials({
          projectId: fallback.projectId,
          apiKey: fallback.apiKey,
        });
      }
    };
    readCredentials();
    window.addEventListener("agentcost_config_updated", readCredentials);
    window.addEventListener("agentcost_active_project_changed", readCredentials);
    return () => {
      window.removeEventListener("agentcost_config_updated", readCredentials);
      window.removeEventListener(
        "agentcost_active_project_changed",
        readCredentials,
      );
    };
  }, []);

  const hasCredentials = !!credentials.apiKey && !!credentials.projectId;
  const pipCommand = "pip install agentcost";
  const initSnippet = `from agentcost import track_costs\n\ntrack_costs.init(\n    api_key="${credentials.apiKey || "your_api_key"}",\n    project_id="${credentials.projectId || "your_project_uuid"}"\n)`;

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="max-w-4xl w-full px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            You&apos;re in. Two ways to see your costs:
          </h1>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Connect your app for live tracking, or import your existing OpenAI
            spend in under a minute.
          </p>
        </div>

        {/* The two paths */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Path 1 — SDK */}
          <div className="rounded-2xl bg-neutral-800/50 border border-neutral-700/50 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400">
                <Terminal size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Track your app (2 lines of Python)
              </h2>
            </div>

            {/* pip install */}
            <div className="rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden mb-3">
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
                <span className="text-xs text-neutral-500 font-mono">
                  shell
                </span>
                <CopyButton
                  text={pipCommand}
                  onCopied={() =>
                    track("sdk_install_started", { location: "onboarding" })
                  }
                />
              </div>
              <pre className="p-3 text-sm overflow-x-auto">
                <code className="text-neutral-300">{pipCommand}</code>
              </pre>
            </div>

            {/* init snippet with the user's real credentials */}
            <div className="rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800">
                <span className="text-xs text-neutral-500 font-mono">
                  main.py
                </span>
                <CopyButton
                  text={initSnippet}
                  onCopied={() => track("api_key_copied")}
                />
              </div>
              <pre className="p-3 text-sm overflow-x-auto">
                <code className="text-neutral-300">
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-blue-400">agentcost</span>{" "}
                  <span className="text-purple-400">import</span> track_costs
                  {"\n\n"}
                  track_costs.<span className="text-yellow-300">init</span>(
                  {"\n"}
                  {"    "}api_key=
                  <span className="text-green-400 break-all">
                    &quot;{credentials.apiKey || "your_api_key"}&quot;
                  </span>
                  ,{"\n"}
                  {"    "}project_id=
                  <span className="text-green-400 break-all">
                    &quot;{credentials.projectId || "your_project_uuid"}&quot;
                  </span>
                  {"\n"})
                </code>
              </pre>
            </div>

            {hasCredentials ? (
              <p className="mt-3 text-sm text-neutral-400">
                That&apos;s your real API key and project ID — events appear
                here within seconds of your first LLM call.
              </p>
            ) : (
              <p className="mt-3 text-sm text-neutral-400">
                No project in this browser yet.{" "}
                <Link
                  href="/settings?new=1"
                  className="inline-flex items-center gap-1 text-primary-400 hover:text-primary-300 underline"
                >
                  <Settings size={13} />
                  Create one in Settings
                </Link>{" "}
                and the snippet fills in automatically.
              </p>
            )}
          </div>

          {/* Path 2 — OpenAI import */}
          <div className="rounded-2xl bg-neutral-800/50 border border-neutral-700/50 p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                <KeyRound size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Import your OpenAI or Anthropic spend (60 seconds, no code)
              </h2>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed flex-1">
              Paste an OpenAI Admin key and see what you actually spent over the
              last 30 days — total plus a daily breakdown. We fetch it once,
              render it here, and never store the key.
            </p>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              Import spend
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-neutral-500 text-sm mt-8">
          Or{" "}
          <Link
            href="/demo?src=onboarding"
            className="text-primary-400 hover:text-primary-300 underline"
          >
            explore the dashboard with sample data
          </Link>{" "}
          first. Questions? See the{" "}
          <Link
            href="/docs/sdk"
            className="text-primary-400 hover:text-primary-300 underline"
          >
            SDK Documentation
          </Link>
          .
        </p>
      </div>

      <OpenAIImportModal
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
      />
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
