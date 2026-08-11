"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, TerminalSquare, ShieldCheck } from "lucide-react";

const INSTALL = "pip install agentcost";

const ANALYZE = `agentcost analyze ./agent --model gpt-4o --runs-per-day 2000`;

const RECORD = `import json
from agentcost import track_costs

track_costs.init(local_mode=True)      # nothing leaves your process

with track_costs.workflow("support-triage"):
    run_agent(sample_request)          # one representative run

track_costs.flush()
json.dump(track_costs.get_local_events(), open("run.json", "w"))`;

const PROJECT = `agentcost analyze ./agent --events run.json --runs-per-day 2000`;

const CI = `agentcost analyze ./agent --events run.json --fail-on high`;

function CopyLine({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && <p className="mb-1.5 text-xs text-neutral-500">{label}</p>}
      <div className="group relative rounded-lg border border-white/6 bg-black/30">
        <pre className="overflow-x-auto p-3 pr-11 text-xs leading-relaxed text-neutral-300">
          <code>{code}</code>
        </pre>
        <button
          onClick={copy}
          aria-label={`Copy: ${label ?? "command"}`}
          className="absolute right-2 top-2 rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
        >
          {copied ? (
            <Check size={13} className="text-emerald-400" />
          ) : (
            <Copy size={13} />
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * The Workflows page reports what already happened. This is the counterpart:
 * the same questions asked before a deploy, from the command line.
 */
export function PreDeploymentCard({ compact = false }: { compact?: boolean }) {
  return (
    <div className="px-4 py-5 sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-neutral-300">
          <TerminalSquare size={17} aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            Check the next version before you ship it
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Everything above is what your agent already spent.{" "}
            <code className="text-neutral-300">agentcost analyze</code> answers
            the same questions about a version that has not run in production
            yet — what a run will cost, which step dominates it, and where it
            loops.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4 sm:ml-12">
        <CopyLine code={INSTALL} label="1. Install the CLI (ships with the SDK)" />
        <CopyLine
          code={ANALYZE}
          label="2. Price the prompt and skill files your agent sends every call"
        />

        {!compact && (
          <>
            <CopyLine
              code={RECORD}
              label="3. Record one representative run locally"
            />
            <CopyLine
              code={PROJECT}
              label="4. Project that run to production volume"
            />
            <CopyLine
              code={CI}
              label="In CI — exits non-zero on a high-severity finding"
            />
          </>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 sm:ml-12">
        <span className="inline-flex items-center gap-2 text-xs text-neutral-500">
          <ShieldCheck size={13} className="text-emerald-400" aria-hidden />
          Runs locally — no network call, nothing transmitted
        </span>
        <Link
          href="/docs/cli"
          className="text-xs text-primary-400 underline underline-offset-2 hover:text-primary-300"
        >
          Full CLI reference
        </Link>
      </div>
    </div>
  );
}
