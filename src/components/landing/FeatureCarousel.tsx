"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "framer-motion";
import {
  Workflow,
  Binary,
  TerminalSquare,
  Code2,
  Radio,
  Layers,
  Bell,
  Database,
  Lock,
  Check,
  X,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Capability carousel — a wheel of chips on the
   left drives a stack of product widgets on the
   right. Each widget is the product itself in
   miniature, animated in when it becomes active.
   ───────────────────────────────────────────── */

const PANE = "#111113";
const EASE = [0.22, 1, 0.36, 1] as const;

interface VisualProps {
  active: boolean;
}

/* ── Shared widget pieces ─────────────────────────────────────────────── */

function Frame({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="text-[13px] leading-5 text-neutral-400">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <span className="font-medium text-neutral-100">{title}</span>
        {meta && <span className="shrink-0 tabular-nums text-neutral-500">{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function Bar({
  pct,
  active,
  delay = 0,
  tone = "sky",
}: {
  pct: number;
  active: boolean;
  delay?: number;
  tone?: "sky" | "amber" | "white";
}) {
  const reduced = useReducedMotion();
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/7">
      <motion.div
        className={cn(
          "h-full rounded-full",
          tone === "amber" ? "bg-neutral-300" : tone === "white" ? "bg-white" : "bg-neutral-400",
        )}
        initial={false}
        animate={{ width: active ? `${pct}%` : "0%" }}
        transition={reduced ? { duration: 0 } : { duration: 0.9, ease: EASE, delay }}
      />
    </div>
  );
}

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "amber" | "sky";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "amber" && "border border-white/20 bg-white/5 text-white",
        tone === "sky" && "bg-white/10 text-white",
        tone === "neutral" && "bg-white/6 text-neutral-300",
      )}
    >
      {children}
    </span>
  );
}

/* ── 01 · Cost per run ─────────────────────────────────────────────────── */

const STEPS = [
  { name: "classify", pct: 4, cost: "$0.0008" },
  { name: "search_docs", pct: 62, cost: "$0.0209", flag: "2.4× per run · loop" },
  { name: "draft_reply", pct: 34, cost: "$0.0121" },
];

function RunCostVisual({ active }: VisualProps) {
  return (
    <Frame title="support-triage" meta="$0.0338 per run">
      <div className="space-y-3.5">
        {STEPS.map((s, i) => (
          <div key={s.name}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-neutral-300">{s.name}</span>
              <span className="tabular-nums text-white">{s.cost}</span>
            </div>
            <Bar pct={s.pct} active={active} delay={i * 0.08} tone={s.flag ? "white" : "sky"} />
            {s.flag && (
              <div className="mt-2">
                <Pill tone="amber">{s.flag}</Pill>
              </div>
            )}
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ── 02 · Model fit ────────────────────────────────────────────────────── */

const REPLY_LENGTHS = [96, 78, 48, 26, 14, 9, 6, 4, 3, 2, 2, 1];

function ModelFitVisual({ active }: VisualProps) {
  const reduced = useReducedMotion();
  return (
    <Frame title="sentiment-classifier" meta="165,000 calls · gpt-4o">
      <div className="mb-1 flex justify-between text-[11px] text-neutral-500">
        <span>Reply length</span>
        <span>tokens →</span>
      </div>
      <div className="flex h-16 items-end gap-1">
        {REPLY_LENGTHS.map((h, i) => (
          <motion.div
            key={i}
            className="flex-1 rounded-sm bg-neutral-300"
            initial={false}
            animate={{ height: active ? `${h}%` : "4%" }}
            transition={reduced ? { duration: 0 } : { duration: 0.7, ease: EASE, delay: i * 0.03 }}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 px-3 py-2">
          <p className="text-[11px] text-neutral-500">Longest reply</p>
          <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">14 tokens</p>
        </div>
        <div className="rounded-lg border border-white/10 px-3 py-2">
          <p className="text-[11px] text-neutral-500">Inputs repeating</p>
          <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-white">63%</p>
        </div>
      </div>
      <p className="mt-3 text-neutral-300">
        A classifier, not a model. <span className="text-white">−$135 / month</span> on a smaller one.
      </p>
    </Frame>
  );
}

/* ── 03 · Pre-deploy analysis ──────────────────────────────────────────── */

const FINDINGS = [
  { text: "Prompt files priced", value: "$0.011 / call", warn: false },
  { text: "Projected at 2,000 runs / day", value: "$2,640 / mo", warn: false },
  { text: "search_docs ran 2.0× per run", value: "high", warn: true },
  { text: "Identical call in 3 of 3 runs", value: "high", warn: true },
];

function PreDeployVisual({ active }: VisualProps) {
  const reduced = useReducedMotion();
  return (
    <Frame title="Pre-deploy check" meta="CI · pull request #412">
      <p className="mb-3 truncate font-mono text-[12px] text-neutral-500">
        $ agentcost analyze ./agent --runs-per-day 2000
      </p>
      <div className="divide-y divide-white/6">
        {FINDINGS.map((f, i) => (
          <motion.div
            key={f.text}
            className="flex items-center gap-3 py-2"
            initial={false}
            animate={{ opacity: active ? 1 : 0.25, x: active ? 0 : -6 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, delay: i * 0.1, ease: EASE }}
          >
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", f.warn ? "bg-white" : "bg-neutral-600")}
              aria-hidden
            />
            <span className="flex-1 text-neutral-300">{f.text}</span>
            <span className={cn("tabular-nums", f.warn ? "font-medium text-white" : "text-neutral-300")}>{f.value}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-neutral-500">Fails the build on a cost regression. Runs locally, sends nothing.</p>
    </Frame>
  );
}

/* ── 04 · Two lines, four SDKs ─────────────────────────────────────────── */

const PROVIDERS = ["OpenAI", "Anthropic", "Gemini", "LangChain"];
const PROVIDER_LINES: string[][] = [
  ["from openai import OpenAI", "client = OpenAI()", "client.chat.completions.create(...)"],
  ["from anthropic import Anthropic", "client = Anthropic()", "client.messages.create(...)"],
  ["from google import genai", "client = genai.Client()", "client.models.generate_content(...)"],
  ["from langchain_openai import ChatOpenAI", "llm = ChatOpenAI(model=\"gpt-4o\")", "llm.invoke(...)"],
];
const ADDED_LINES = ["from agentcost import track_costs", "track_costs.init(api_key=\"sk_...\")"];

function DiffLine({ n, added, children }: { n: number; added?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("flex items-center gap-3 px-3", added && "bg-white/6")}>
      <span className="w-4 shrink-0 text-right text-[11px] tabular-nums text-neutral-600">{n}</span>
      <span className={cn("w-2 shrink-0 text-center", added ? "text-white" : "text-transparent")}>+</span>
      <span className={cn("truncate", added ? "text-white" : "text-neutral-400")}>{children}</span>
    </div>
  );
}

function TwoLinesVisual({ active }: VisualProps) {
  const [tab, setTab] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTab((t) => (t + 1) % PROVIDERS.length), 1600);
    return () => clearInterval(id);
  }, [active]);
  return (
    <div className="text-[13px]">
      <div className="mb-3 flex gap-1.5">
        {PROVIDERS.map((p, i) => (
          <span
            key={p}
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150",
              i === tab ? "bg-white text-neutral-950" : "bg-white/6 text-neutral-400",
            )}
          >
            {p}
          </span>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10 bg-black/40">
        <div className="flex items-center justify-between border-b border-white/8 px-3 py-1.5 text-[11px]">
          <span className="text-neutral-300">agent.py</span>
          <span className="tabular-nums text-neutral-500">+2 lines · 0 changed</span>
        </div>
        <div className="py-2 font-mono text-[12.5px] leading-6">
          {ADDED_LINES.map((line, i) => (
            <DiffLine key={line} n={i + 1} added>
              {line}
            </DiffLine>
          ))}
          <DiffLine n={3}>&nbsp;</DiffLine>
          {PROVIDER_LINES[tab].map((line, i) => (
            <DiffLine key={line} n={i + 4}>
              {line}
            </DiffLine>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 05 · Streaming ────────────────────────────────────────────────────── */

const STREAM_TEXT =
  "The ticket describes a duplicate charge on the March invoice, so it belongs with billing rather than support.";

function StreamBody({ active }: VisualProps) {
  const reduced = useReducedMotion();
  // Typing state lives in a component that remounts on activation, so the
  // reset is an initial state rather than a setState inside an effect.
  const [chars, setChars] = useState(() => (reduced || !active ? (active ? STREAM_TEXT.length : 0) : 0));
  useEffect(() => {
    if (!active || reduced) return;
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(STREAM_TEXT.length, n + 2);
      setChars(n);
      if (n >= STREAM_TEXT.length) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [active, reduced]);

  const tokens = Math.round(chars / 4.2);
  const done = chars >= STREAM_TEXT.length;
  return (
    <>
      <div className="min-h-26 rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-[14px] leading-6 text-neutral-200">
        {STREAM_TEXT.slice(0, chars)}
        {!done && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white align-middle" />}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="tabular-nums text-neutral-300">
          <span className="text-white">{tokens}</span> output tokens
        </span>
        <span className="tabular-nums text-white">${(tokens * 0.00001).toFixed(4)}</span>
      </div>
      <p className="mt-1.5 text-neutral-500">
        {done ? "Counted at the final chunk — same accuracy as a blocking call." : "Counting as chunks arrive…"}
      </p>
    </>
  );
}

function StreamingVisual({ active }: VisualProps) {
  return (
    <Frame title="Streamed completion" meta="gpt-4o · stream=True">
      <StreamBody key={active ? "on" : "off"} active={active} />
    </Frame>
  );
}

/* ── 06 · Concurrency-safe ─────────────────────────────────────────────── */

const LANES = [
  { name: "triage", start: 0, width: 32, cost: "$0.012" },
  { name: "research", start: 8, width: 84, cost: "$0.041" },
  { name: "mailer", start: 58, width: 20, cost: "$0.003" },
];

function ConcurrencyVisual({ active }: VisualProps) {
  const reduced = useReducedMotion();
  return (
    <Frame title="One run, three agents in parallel" meta="$0.056 total">
      <div className="space-y-3">
        {LANES.map((l, i) => (
          <div key={l.name} className="flex items-center gap-3">
            <span className="w-16 shrink-0 text-neutral-300">{l.name}</span>
            <div className="relative h-5 flex-1 rounded bg-white/4">
              <motion.div
                className="absolute inset-y-0 rounded bg-neutral-300"
                style={{ left: `${l.start}%` }}
                initial={false}
                animate={{ width: active ? `${l.width}%` : "0%" }}
                transition={reduced ? { duration: 0 } : { duration: 0.8, ease: EASE, delay: i * 0.1 }}
              />
            </div>
            <span className="w-14 shrink-0 text-right tabular-nums text-white">{l.cost}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-[11px] text-neutral-500">
        <span>t = 0</span>
        <span>4.2 s</span>
      </div>
      <p className="mt-2 text-neutral-500">Attribution rides contextvars, so lanes never mix their spend.</p>
    </Frame>
  );
}

/* ── 07 · Budgets & guardrails ─────────────────────────────────────────── */

function Gauge({ pct, active }: { pct: number; active: boolean }) {
  const reduced = useReducedMotion();
  const r = 40;
  const c = Math.PI * r;
  return (
    <svg viewBox="0 0 100 58" className="w-28" aria-hidden>
      <path
        d="M10 50 A40 40 0 0 1 90 50"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <motion.path
        d="M10 50 A40 40 0 0 1 90 50"
        fill="none"
        stroke="#ffffff"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={false}
        animate={{ strokeDashoffset: active ? c * (1 - pct / 100) : c }}
        transition={reduced ? { duration: 0 } : { duration: 1, ease: EASE }}
      />
    </svg>
  );
}

function GuardrailVisual({ active }: VisualProps) {
  const reduced = useReducedMotion();
  return (
    <Frame title="Budget · September" meta="hard cap at 100%">
      <div className="flex items-center gap-5">
        <div className="relative">
          <Gauge pct={78} active={active} />
          <div className="absolute inset-x-0 bottom-0 text-center">
            <p className="text-[17px] font-semibold leading-none tabular-nums text-white">78%</p>
            <p className="mt-0.5 text-[11px] text-neutral-500">of $500</p>
          </div>
        </div>
        <div className="flex-1 space-y-1.5">
          <p className="text-neutral-300">$390 spent</p>
          <p className="text-neutral-500">Alerts at 50 · 80 · 100%</p>
        </div>
      </div>
      <motion.div
        className="mt-4 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5"
        initial={false}
        animate={{ opacity: active ? 1 : 0, y: active ? 0 : 8 }}
        transition={reduced ? { duration: 0 } : { duration: 0.45, delay: 0.5, ease: EASE }}
      >
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden />
          <span className="font-medium text-white">Guardrail breach</span>
          <span className="ml-auto text-[11px] text-neutral-500">just now</span>
        </div>
        <p className="mt-1 text-neutral-300">
          email-drafter called <span className="text-white">send_email</span> — a write tool on a read-only agent.
        </p>
        <p className="mt-1 text-[11px] text-neutral-500">Owners notified · webhook delivered</p>
      </motion.div>
    </Frame>
  );
}

/* ── 08 · 3,500+ models priced ─────────────────────────────────────────── */

const MODELS = [
  ["gpt-4o", "OpenAI", "$2.50", "$10.00"],
  ["claude-sonnet-4-5", "Anthropic", "$3.00", "$15.00"],
  ["gemini-2.5-pro", "Google", "$1.25", "$10.00"],
  ["deepseek-chat", "DeepSeek", "$0.27", "$1.10"],
];

function ModelsVisual({ active }: VisualProps) {
  const reduced = useReducedMotion();
  return (
    <Frame title="Model catalog" meta="synced 2 h ago">
      <div className="mb-1 grid grid-cols-[1fr_auto_auto] gap-x-4 text-[11px] text-neutral-500">
        <span>model</span>
        <span className="text-right">in / 1M</span>
        <span className="text-right">out / 1M</span>
      </div>
      <div className="divide-y divide-white/6">
        {MODELS.map(([m, p, i, o], idx) => (
          <motion.div
            key={m}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 py-2"
            initial={false}
            animate={{ opacity: active ? 1 : 0.25 }}
            transition={reduced ? { duration: 0 } : { duration: 0.4, delay: idx * 0.08 }}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="truncate text-neutral-200">{m}</span>
              <Pill>{p}</Pill>
            </span>
            <span className="text-right tabular-nums text-white">{i}</span>
            <span className="text-right tabular-nums text-white">{o}</span>
          </motion.div>
        ))}
      </div>
      <p className="mt-3 text-neutral-500">
        <span className="text-white">3,500+</span> models across 50+ providers. Released this week, priced this week.
      </p>
    </Frame>
  );
}

/* ── 09 · Metadata only ────────────────────────────────────────────────── */

const SENT = ["agent_name", "model", "tokens", "cost", "latency_ms"];
const NEVER = ["prompts", "completions", "files"];

function MetadataVisual({ active }: VisualProps) {
  const reduced = useReducedMotion();
  const node = "rounded-lg border border-white/10 px-3 py-2 text-center text-[12px] text-neutral-200";
  return (
    <Frame title="What leaves your process" meta="SHA-256 · one way">
      <div className="flex items-center gap-2">
        <div className={cn(node, "flex-1")}>Your app</div>
        <ArrowRight size={14} className="shrink-0 text-neutral-600" aria-hidden />
        <div className={cn(node, "flex-1 border-white/25")}>
          SDK
          <p className="text-[10px] text-neutral-500">hashes the prompt</p>
        </div>
        <ArrowRight size={14} className="shrink-0 text-neutral-600" aria-hidden />
        <div className={cn(node, "flex-1")}>AgentCost</div>
      </div>
      <motion.div
        className="mt-4 flex flex-wrap gap-1.5"
        initial={false}
        animate={{ opacity: active ? 1 : 0.3 }}
        transition={reduced ? { duration: 0 } : { duration: 0.5, delay: 0.3 }}
      >
        {SENT.map((k) => (
          <Pill key={k}>
            <Check size={11} className="text-white" aria-hidden />
            {k}
          </Pill>
        ))}
      </motion.div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-neutral-500">
        <X size={12} aria-hidden />
        <span className="text-[12px]">never sent:</span>
        {NEVER.map((k) => (
          <span key={k} className="text-[12px] text-neutral-400 line-through decoration-neutral-600">
            {k}
          </span>
        ))}
      </div>
      <p className="mt-3 text-neutral-500">MIT licensed. Self-host it and nothing leaves your network at all.</p>
    </Frame>
  );
}

/* ── Feature model ─────────────────────────────────────────────────────── */

interface Feature {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  visual: React.ComponentType<VisualProps>;
}

const FEATURES: Feature[] = [
  {
    id: "run-cost",
    label: "Cost per run",
    icon: Workflow,
    description: "What one run actually cost — per step, per tool, with loops flagged.",
    visual: RunCostVisual,
  },
  {
    id: "classifier",
    label: "Model fit",
    icon: Binary,
    description: "Which calls never needed a model, found from token counts alone.",
    visual: ModelFitVisual,
  },
  {
    id: "analyze",
    label: "Pre-deploy analysis",
    icon: TerminalSquare,
    description: "What the next version will cost, before it has spent anything.",
    visual: PreDeployVisual,
  },
  {
    id: "two-lines",
    label: "Two lines, four SDKs",
    icon: Code2,
    description: "OpenAI, Anthropic, Gemini and LangChain — no wrappers, no refactor.",
    visual: TwoLinesVisual,
  },
  {
    id: "streaming",
    label: "Streaming included",
    icon: Radio,
    description: "Streamed calls tracked as accurately as blocking ones, sync and async.",
    visual: StreamingVisual,
  },
  {
    id: "concurrency",
    label: "Concurrency-safe",
    icon: Layers,
    description: "Parallel pipelines never mix their spend — attribution rides contextvars.",
    visual: ConcurrencyVisual,
  },
  {
    id: "guardrails",
    label: "Budgets & guardrails",
    icon: Bell,
    description: "Monthly budgets, drift detection, and tool boundaries that alert on breach.",
    visual: GuardrailVisual,
  },
  {
    id: "models",
    label: "3,500+ models priced",
    icon: Database,
    description: "A model released this week is costed correctly this week.",
    visual: ModelsVisual,
  },
  {
    id: "metadata",
    label: "Metadata only",
    icon: Lock,
    description: "Token counts and timings on the wire — never your prompts.",
    visual: MetadataVisual,
  },
];

const AUTO_PLAY_INTERVAL = 4200;
const ITEM_HEIGHT = 60;

const wrap = (min: number, max: number, v: number) => {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
};

/* ── Carousel ──────────────────────────────────────────────────────────── */

export function FeatureCarousel() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const reducedMotion = useReducedMotion();

  const count = FEATURES.length;
  const current = ((step % count) + count) % count;

  const next = useCallback(() => setStep((s) => s + 1), []);

  const select = (index: number) => {
    const diff = (index - current + count) % count;
    if (diff > 0) setStep((s) => s + diff);
  };

  // Advance only while visible, not hovered, and motion is welcome.
  useEffect(() => {
    if (paused || !inView || reducedMotion) return;
    const id = setInterval(next, AUTO_PLAY_INTERVAL);
    return () => clearInterval(id);
  }, [next, paused, inView, reducedMotion]);

  const status = (index: number): "active" | "prev" | "next" | "hidden" => {
    let d = index - current;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    if (d === 0) return "active";
    if (d === -1) return "prev";
    if (d === 1) return "next";
    return "hidden";
  };

  const spring = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 90, damping: 22, mass: 1 };
  const cardSpring = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 260, damping: 25, mass: 0.8 };

  return (
    <div
      ref={rootRef}
      className="mx-auto w-full max-w-6xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="AgentCost capabilities"
    >
      <div className="relative flex min-h-[600px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0b] lg:aspect-video lg:flex-row lg:rounded-[2.5rem]">
        {/* Chip wheel */}
        <div
          className="relative z-30 flex min-h-[340px] w-full flex-col items-start justify-center overflow-hidden px-6 md:min-h-[420px] md:px-12 lg:h-full lg:w-[42%] lg:pl-14"
          style={{ backgroundColor: PANE }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-40 h-16 md:h-24"
            style={{ background: `linear-gradient(to bottom, ${PANE}, ${PANE}cc, transparent)` }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-40 h-16 md:h-24"
            style={{ background: `linear-gradient(to top, ${PANE}, ${PANE}cc, transparent)` }}
          />
          <div className="relative z-20 flex h-full w-full items-center justify-center lg:justify-start">
            {FEATURES.map((feature, index) => {
              const active = index === current;
              const distance = wrap(-(count / 2), count / 2, index - current);
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  style={{ height: ITEM_HEIGHT, width: "fit-content" }}
                  animate={{
                    y: distance * ITEM_HEIGHT,
                    opacity: Math.max(0, 1 - Math.abs(distance) * 0.28),
                  }}
                  transition={spring}
                  className="absolute flex items-center justify-start"
                >
                  <button
                    type="button"
                    onClick={() => select(index)}
                    aria-pressed={active}
                    tabIndex={Math.abs(distance) > 2 ? -1 : 0}
                    className={cn(
                      "group flex cursor-pointer items-center gap-3 rounded-full border px-5 py-3 text-left transition-colors duration-500 md:px-6",
                      active
                        ? "z-10 border-white bg-white text-neutral-950"
                        : "border-white/15 bg-transparent text-white/60 hover:border-white/40 hover:text-white",
                    )}
                  >
                    <Icon
                      size={17}
                      strokeWidth={2}
                      className={cn(
                        "shrink-0 transition-colors duration-500",
                        active ? "text-neutral-950" : "text-white/40 group-hover:text-white/80",
                      )}
                      aria-hidden
                    />
                    <span className="whitespace-nowrap text-[12.5px] font-medium uppercase tracking-[0.08em]">
                      {feature.label}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Card stack */}
        <div className="relative flex min-h-[600px] flex-1 items-center justify-center overflow-hidden border-t border-white/10 px-6 py-14 md:min-h-[600px] md:px-12 lg:h-full lg:border-l lg:border-t-0 lg:px-10 lg:py-12">
          <div className="relative flex min-h-[480px] w-full max-w-[400px] items-center justify-center sm:aspect-[7/8] sm:min-h-0">
            {FEATURES.map((feature, index) => {
              const s = status(index);
              const active = s === "active";
              const prev = s === "prev";
              const nxt = s === "next";
              const Visual = feature.visual;
              return (
                <motion.div
                  key={feature.id}
                  initial={false}
                  animate={{
                    x: active ? 0 : prev ? -90 : nxt ? 90 : 0,
                    scale: active ? 1 : prev || nxt ? 0.86 : 0.7,
                    opacity: active ? 1 : prev || nxt ? 0.35 : 0,
                    rotate: prev ? -3 : nxt ? 3 : 0,
                    zIndex: active ? 20 : prev || nxt ? 10 : 0,
                  }}
                  transition={cardSpring}
                  style={{ pointerEvents: active ? "auto" : "none" }}
                  className="absolute inset-0 origin-center overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0c0c0d]"
                  aria-hidden={!active}
                >
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/20" aria-hidden />
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 p-6 transition-all duration-700 md:p-7",
                      active ? "blur-0 grayscale-0" : "blur-[2px] grayscale",
                    )}
                  >
                    <Visual active={active} />
                  </div>

                  <AnimatePresence>
                    {active && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: reducedMotion ? 0 : 0.35 }}
                        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/75 to-transparent p-7 pt-24 md:p-8"
                      >
                        <span className="mb-3 w-fit rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-300">
                          {String(index + 1).padStart(2, "0")} · {feature.label}
                        </span>
                        <p className="text-[19px] font-medium leading-snug tracking-tight text-white md:text-[21px]">
                          {feature.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
