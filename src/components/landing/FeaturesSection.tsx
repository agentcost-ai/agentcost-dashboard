"use client";

import {
  Workflow,
  TerminalSquare,
  Binary,
  Code2,
  Radio,
  Layers,
  Bell,
  Lock,
} from "lucide-react";

/* ─────────────────────────────────────────────
   Primary capabilities — the three questions
   ───────────────────────────────────────────── */

function StepBar({
  name,
  cost,
  pct,
  flagged,
}: {
  name: string;
  cost: string;
  pct: number;
  flagged?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-[12px] text-neutral-400">
        {name}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-white/6">
        <div
          className={`h-full rounded-sm ${flagged ? "bg-amber-400" : "bg-sky-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-18 shrink-0 text-right font-mono text-[12px] text-neutral-300">
        {cost}
      </span>
    </div>
  );
}

function WorkflowVisual() {
  return (
    <div className="rounded-lg border border-white/8 bg-black/40 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[11px] uppercase tracking-wider text-neutral-500">
          support-triage
        </span>
        <span className="font-mono text-[12px] text-neutral-400">
          $0.0338 / run
        </span>
      </div>
      <div className="space-y-2">
        <StepBar name="classify" cost="$0.0008" pct={4} />
        <StepBar name="search_docs" cost="$0.0209" pct={62} flagged />
        <StepBar name="draft_reply" cost="$0.0121" pct={34} />
      </div>
      <p className="mt-3 border-t border-white/6 pt-3 text-[12px] text-amber-400">
        search_docs ran 2.4&times; per run — a loop, not a caching problem
      </p>
    </div>
  );
}

function ClassifierVisual() {
  return (
    <div className="rounded-lg border border-white/8 bg-black/40 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-white">
            sentiment-classifier
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">
            165,000 calls to gpt-4o
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-emerald-400/12 px-2 py-1 font-mono text-[12px] text-emerald-400">
          -$135/mo
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/6 pt-3">
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
            Longest reply
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] text-neutral-200">
            14 tokens
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wider text-neutral-500">
            Inputs repeating
          </dt>
          <dd className="mt-0.5 font-mono text-[13px] text-neutral-200">63%</dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] text-neutral-400">
        Never wrote prose, and the input set is bounded. That is a classifier,
        not a model.
      </p>
    </div>
  );
}

function AnalyzerVisual() {
  return (
    <div className="rounded-lg border border-white/8 bg-black/40 p-4 font-mono text-[12px] leading-relaxed">
      <p className="text-neutral-500">
        <span className="select-none text-neutral-600">$ </span>
        agentcost analyze ./agent --runs-per-day 2000
      </p>
      <p className="mt-3 text-neutral-300">
        3 runs &middot; 4.0 calls/run &middot;{" "}
        <span className="text-white">$0.044</span> per run
      </p>
      <p className="mt-1 text-neutral-300">
        Projected: <span className="text-white">$2,640.00</span> / month
      </p>
      <p className="mt-3 text-amber-400">
        [high] step &lsquo;search_docs&rsquo; ran 2.0&times; per run
      </p>
      <p className="mt-1 text-amber-400">
        [high] 3 of 3 runs repeated an identical call
      </p>
    </div>
  );
}

const PRIMARY = [
  {
    index: "01",
    icon: Workflow,
    question: "What did one run actually cost?",
    body: "Your bill shows tokens. It cannot tell you whether $0.04 was a three-step pipeline or one step retried twice. Wrap a run and AgentCost reports cost per run, per step and per tool — and flags the same call being made twice inside one run, which is a loop rather than something a cache would fix.",
    visual: <WorkflowVisual />,
  },
  {
    index: "02",
    icon: Binary,
    question: "Which of these calls needed a model at all?",
    body: "An agent whose replies are always a few tokens long, over inputs that keep repeating, is doing classification — work a smaller model or a lookup does for a fraction of the price. AgentCost finds those workloads from token counts alone, without ever reading a prompt.",
    visual: <ClassifierVisual />,
  },
  {
    index: "03",
    icon: TerminalSquare,
    question: "What will the next version cost?",
    body: "Run one command before you deploy. It prices the prompt and skill files your agent sends on every call, projects a local test run to production volume, and fails your CI on a cost regression. It runs entirely on your machine and transmits nothing.",
    visual: <AnalyzerVisual />,
  },
];

const SUPPORTING = [
  {
    icon: Code2,
    title: "Two lines, four SDKs",
    body: "Intercepts OpenAI, Anthropic, Gemini and LangChain. No wrappers, no decorators, no refactor.",
  },
  {
    icon: Radio,
    title: "Streaming included",
    body: "Streamed calls are tracked with the same accuracy as blocking ones, sync and async alike.",
  },
  {
    icon: Layers,
    title: "Concurrency-safe attribution",
    body: "Agent, workflow and step context ride contextvars, so parallel pipelines never mix their spend.",
  },
  {
    icon: Bell,
    title: "Budgets and anomalies",
    body: "Monthly budgets with threshold alerts, and detection when an agent's spend leaves its own baseline.",
  },
  {
    icon: Binary,
    title: "3,500+ models priced",
    body: "Pricing syncs continuously, so a model released this week is costed correctly this week.",
  },
  {
    icon: Lock,
    title: "Metadata only, MIT licensed",
    body: "Token counts and timings — never your prompts. Run it locally or self-host the whole stack.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">
            Capabilities
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
            Your invoice says what you spent.
            <br />
            <span className="text-neutral-400">
              It never says what you spent it on.
            </span>
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-neutral-400">
            AgentCost answers the three questions a token total cannot — for
            what already ran, and for what you are about to ship.
          </p>
        </div>

        {/* Primary capabilities */}
        <div className="mt-14 space-y-4">
          {PRIMARY.map(({ index, icon: Icon, question, body, visual }) => (
            <div
              key={index}
              className="rounded-xl border border-white/8 bg-[#0b0b0d] p-6 transition-colors hover:border-white/14 sm:p-8"
            >
              <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)] lg:items-center lg:gap-12">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[13px] text-neutral-600">
                      {index}
                    </span>
                    <span className="h-px w-6 bg-white/12" aria-hidden />
                    <Icon size={16} className="text-sky-400" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold leading-snug tracking-tight text-white sm:text-2xl">
                    {question}
                  </h3>
                  <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-neutral-400">
                    {body}
                  </p>
                </div>
                <div className="min-w-0">{visual}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Supporting capabilities */}
        <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-3">
          {SUPPORTING.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-[#0b0b0d] p-6">
              <Icon size={16} className="text-neutral-400" aria-hidden />
              <h4 className="mt-3 text-[15px] font-semibold text-white">
                {title}
              </h4>
              <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-400">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
