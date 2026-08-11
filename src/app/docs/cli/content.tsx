"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Copy,
  Check,
  TerminalSquare,
  FileSearch,
  Play,
  ListChecks,
  GitBranch,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute right-3 top-3 rounded-md bg-neutral-700/50 p-2 transition-colors hover:bg-neutral-600/50"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} className="text-neutral-400" />
      )}
    </button>
  );
}

function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative rounded-lg border border-neutral-700/50 bg-neutral-800/50">
      <div className="flex items-center justify-between border-b border-neutral-700/50 px-4 py-2">
        <span className="text-xs font-medium uppercase text-neutral-500">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="text-neutral-300">{code}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-900/30 text-primary-400">
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="min-w-0 space-y-4 sm:ml-13">{children}</div>
    </section>
  );
}

const FLAGS: Array<{ flag: string; value: string; note: string }> = [
  {
    flag: "--model",
    value: "string",
    note: "Model to price against. Default gpt-4o. Also selects the context window used to judge oversized files.",
  },
  {
    flag: "--events",
    value: "path",
    note: "Events from a local-mode run — a JSON array or JSONL. Enables the cost-per-run half of the report.",
  },
  {
    flag: "--runs-per-day",
    value: "int",
    note: "Expected production volume. Adds a projected monthly cost.",
  },
  {
    flag: "--pattern",
    value: "glob",
    note: "File pattern to include; repeatable. Replaces the defaults below.",
  },
  {
    flag: "--json",
    value: "path",
    note: "Also write the full report as JSON, for diffing between builds.",
  },
  {
    flag: "--fail-on",
    value: "high | medium | low",
    note: "Exit 1 if any finding is at or above this severity. Use in CI.",
  },
];

const FINDINGS: Array<{
  code: string;
  severity: string;
  meaning: string;
}> = [
  {
    code: "step_loops",
    severity: "high",
    meaning:
      "A step ran two or more times per run. In production this multiplies with volume.",
  },
  {
    code: "repeated_call",
    severity: "high",
    meaning:
      "The same input was sent more than once inside a single run. Everything after the first is avoidable.",
  },
  {
    code: "oversized_file",
    severity: "high",
    meaning:
      "One file occupies 25% or more of the model's context window, leaving little room for conversation and retrieval.",
  },
  {
    code: "context_overflow",
    severity: "high",
    meaning: "The files together exceed the context window outright.",
  },
  {
    code: "duplicate_content",
    severity: "medium",
    meaning:
      "Two or more files are byte-identical once whitespace is normalised. Sending both pays twice.",
  },
  {
    code: "failed_calls",
    severity: "medium",
    meaning: "Calls failed during the recorded run.",
  },
  {
    code: "deep_nesting",
    severity: "medium",
    meaning:
      "Calls nested four or more levels deep, which is where runaway recursion usually begins.",
  },
  {
    code: "not_instrumented",
    severity: "low",
    meaning:
      "The recorded run had no workflow(), so every call was treated as one run. Per-step figures are unavailable.",
  },
];

export default function CliDocsContent() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-8 pt-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">CLI Reference</h1>
          <p className="mt-2 text-neutral-400">
            <code className="text-primary-300">agentcost analyze</code> — what an
            agent will cost, and where it will misbehave, before it has spent
            anything.
          </p>
        </div>

        {/* Summary */}
        <div className="mb-12 rounded-lg border border-primary-700/40 bg-primary-900/20 p-5">
          <p className="leading-relaxed text-neutral-300">
            The dashboard reports what your agent already spent. This command
            asks the same questions about a version that has not run in
            production yet: what one run will cost, which step dominates it,
            and where it loops.
          </p>
          <p className="mt-3 leading-relaxed text-neutral-300">
            It runs entirely on your machine. It reads your prompt and skill
            files and it never transmits them — no network call is made, and no
            file content outlives the token count taken from it.
          </p>
        </div>

        <div className="space-y-12">
          <Section id="install" title="Install" icon={TerminalSquare}>
            <p className="leading-relaxed text-neutral-300">
              The CLI ships with the SDK. Installing the package registers the{" "}
              <code className="text-primary-300">agentcost</code> command.
            </p>
            <CodeBlock code={`pip install agentcost\nagentcost --version`} />
          </Section>

          <Section id="files" title="Analysing your files" icon={FileSearch}>
            <p className="leading-relaxed text-neutral-300">
              Point it at the directory holding your system prompt and skill
              files. It token-counts each one and prices what they cost on every
              single call — the fixed toll your agent pays before it does any
              work.
            </p>
            <CodeBlock code={`agentcost analyze ./agent --model gpt-4o`} />
            <p className="leading-relaxed text-neutral-300">
              By default it reads{" "}
              <code className="text-primary-300">
                *.md *.txt *.prompt *.tmpl *.j2 *.jinja *.jinja2
              </code>{" "}
              and skips vendored directories such as{" "}
              <code className="text-neutral-400">node_modules</code>,{" "}
              <code className="text-neutral-400">.git</code> and{" "}
              <code className="text-neutral-400">.venv</code>. Override with{" "}
              <code className="text-primary-300">--pattern</code>:
            </p>
            <CodeBlock
              code={`agentcost analyze ./agent --pattern "*.md" --pattern "*.yaml"`}
            />
          </Section>

          <Section id="run" title="Analysing a test run" icon={Play}>
            <p className="leading-relaxed text-neutral-300">
              For a cost-per-run figure, record one representative run in local
              mode. Local mode opens no socket and needs no API key, so this
              works before you have an account.
            </p>
            <CodeBlock
              language="python"
              code={`import json
from agentcost import track_costs

track_costs.init(local_mode=True)

with track_costs.workflow("support-triage"):
    with track_costs.step("classify"):
        ...
    with track_costs.tool("search_docs"):
        ...

track_costs.flush()
json.dump(track_costs.get_local_events(), open("run.json", "w"))`}
            />
            <p className="leading-relaxed text-neutral-300">
              Then hand the recording to the analyser, with the volume you
              expect in production:
            </p>
            <CodeBlock
              code={`agentcost analyze ./agent --events run.json --runs-per-day 2000`}
            />
            <div className="rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-4">
              <p className="text-sm leading-relaxed text-neutral-400">
                Instrumenting with{" "}
                <code className="text-primary-300">workflow()</code> and{" "}
                <code className="text-primary-300">step()</code> is optional. An
                uninstrumented recording still yields a cost per run — it just
                cannot break that cost down per step, and the report says so.
              </p>
            </div>
          </Section>

          <Section id="report" title="Reading the report" icon={ListChecks}>
            <CodeBlock
              language="text"
              code={`AgentCost pre-deployment analysis
==================================

Prompt and skill files  (gpt-4o)
  3 file(s), 8,163 tokens, $0.020407 per call just to send them
       7,201 tok   5.6% ctx  system.md
         481 tok   0.4% ctx  skills/escalate.md
         481 tok   0.4% ctx  skills/refund.md

Test run
  3 run(s), 4.0 calls per run, $0.044000 per run (worst $0.044000)
    $  0.022000  50.0%   2.0 calls  search_docs
    $  0.020000  45.5%   1.0 calls  draft_reply
    $  0.002000   4.5%   1.0 calls  classify

Projected at 2,000 runs/day: $2,640.00 per month

Findings (3)
  [  high] Step 'search_docs' ran 2.0 times per run; a loop or retry will
           multiply this in production
  [  high] 3 of 3 run(s) made the same call more than once (worst: 2x)
  [medium] 2 files have identical content; sending both pays twice

Nothing in this report was transmitted anywhere.`}
            />
            <p className="leading-relaxed text-neutral-300">
              The percentage beside each step is its share of one run, so the
              step to optimise is the one at the top rather than the one that
              looks slowest.
            </p>
          </Section>

          <Section id="findings" title="Every finding it can raise" icon={ListChecks}>
            <div className="overflow-x-auto rounded-lg border border-neutral-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700/50 bg-neutral-800/50">
                    <th className="px-4 py-2.5 text-left font-medium text-neutral-300">
                      Code
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral-300">
                      Severity
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral-300">
                      What it means
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FINDINGS.map((row) => (
                    <tr
                      key={row.code}
                      className="border-b border-neutral-800 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-primary-300">
                        {row.code}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <span
                          className={
                            row.severity === "high"
                              ? "text-amber-400"
                              : row.severity === "medium"
                                ? "text-neutral-300"
                                : "text-neutral-500"
                          }
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-neutral-400">
                        {row.meaning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm leading-relaxed text-neutral-400">
              Findings are ordered most severe first, and each carries a{" "}
              <code className="text-primary-300">detail</code> object in the
              JSON output with the specific paths, counts and trace ids behind
              it.
            </p>
          </Section>

          <Section id="flags" title="All flags" icon={SlidersHorizontal}>
            <div className="overflow-x-auto rounded-lg border border-neutral-700/50">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700/50 bg-neutral-800/50">
                    <th className="px-4 py-2.5 text-left font-medium text-neutral-300">
                      Flag
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral-300">
                      Value
                    </th>
                    <th className="px-4 py-2.5 text-left font-medium text-neutral-300">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {FLAGS.map((row) => (
                    <tr
                      key={row.flag}
                      className="border-b border-neutral-800 last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-primary-300">
                        {row.flag}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-neutral-500">
                        {row.value}
                      </td>
                      <td className="px-4 py-2.5 text-neutral-400">
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-neutral-400">
              At least one of a path or{" "}
              <code className="text-primary-300">--events</code> is required.
            </p>
          </Section>

          <Section id="ci" title="Using it in CI" icon={GitBranch}>
            <p className="leading-relaxed text-neutral-300">
              <code className="text-primary-300">--fail-on</code> turns the
              report into a gate. Exit codes:{" "}
              <code className="text-neutral-400">0</code> clean,{" "}
              <code className="text-neutral-400">1</code> a finding met the
              threshold, <code className="text-neutral-400">2</code> the events
              file could not be read.
            </p>
            <CodeBlock
              language="yaml"
              code={`- name: Agent cost check
  run: |
    pip install agentcost
    python tests/record_agent_run.py        # writes run.json in local mode
    agentcost analyze ./agent \\
      --events run.json \\
      --runs-per-day 2000 \\
      --json cost-report.json \\
      --fail-on high`}
            />
            <p className="leading-relaxed text-neutral-300">
              Keep <code className="text-primary-300">cost-report.json</code> as
              a build artifact and diff it between branches to see cost move
              before it reaches production.
            </p>
          </Section>

          <Section id="privacy" title="What it reads, and what it sends" icon={ShieldCheck}>
            <p className="leading-relaxed text-neutral-300">
              The analyser reads your prompt and skill files. That is more than
              the SDK ever touches, which is why it runs where the files already
              are and sends nothing.
            </p>
            <ul className="space-y-2.5">
              {[
                "No network call is made — there is no endpoint to disable.",
                "No API key or account is needed.",
                "File content is token-counted and hashed for duplicate detection, then goes out of scope. Only counts and paths reach the report.",
                "The JSON report is written where you ask and nowhere else.",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2.5">
                  <Check
                    size={16}
                    className="mt-0.5 shrink-0 text-green-400"
                    aria-hidden
                  />
                  <span className="text-sm leading-relaxed text-neutral-300">
                    {line}
                  </span>
                </li>
              ))}
            </ul>
            <p className="leading-relaxed text-neutral-300">
              The full data model is on the{" "}
              <Link
                href="/docs/privacy"
                className="text-primary-400 underline underline-offset-2 hover:text-primary-300"
              >
                Data &amp; Privacy Architecture
              </Link>{" "}
              page.
            </p>
          </Section>
        </div>

        <div className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-neutral-800 pt-8 text-sm">
          <Link
            href="/docs/sdk"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            SDK Documentation
          </Link>
          <Link
            href="/docs/api"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            API Reference
          </Link>
          <Link
            href="/docs/privacy"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            Privacy Architecture
          </Link>
        </div>
      </div>
    </div>
  );
}
