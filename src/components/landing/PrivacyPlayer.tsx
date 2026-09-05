"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Privacy player — one event, presented the way
   a record is. The cover shows the journey a
   prompt takes (measured, hashed, sent as
   metadata); the tracks are the fields on the
   wire, each opening into where it comes from;
   "+" is everything that never leaves.
   Every line mirrors /docs/privacy.
   ───────────────────────────────────────────── */

interface Field {
  name: string;
  type: string;
  example: string;
  note: string;
  detail: string;
  caveat?: string;
}

const FIELDS: Field[] = [
  {
    name: "agent_name",
    type: "string",
    example: "\"support-triage\"",
    note: "The label you pass to track_costs.agent()",
    detail: "A name you choose in code. Nothing is inferred from your prompts, files or repository.",
  },
  {
    name: "model",
    type: "string",
    example: "\"claude-sonnet-4\"",
    note: "Model identifier, e.g. claude-sonnet-4",
    detail: "The identifier the provider returns for the call. It is what the price lookup keys on.",
  },
  {
    name: "input_tokens",
    type: "int",
    example: "1284",
    note: "Reported by the provider, or counted with tiktoken",
    detail: "A count of the prompt, never the prompt. When the provider does not report usage, the SDK counts locally with tiktoken and discards the text.",
  },
  {
    name: "output_tokens",
    type: "int",
    example: "312",
    note: "Reported by the provider, or counted with tiktoken",
    detail: "A count of the completion, never the completion. Streamed calls are counted at the final chunk.",
  },
  {
    name: "total_tokens",
    type: "int",
    example: "1596",
    note: "Sum of the two above",
    detail: "Kept on the event so the dashboard never has to recompute it.",
  },
  {
    name: "cost",
    type: "float",
    example: "0.008532",
    note: "Computed locally from the pricing table",
    detail: "Priced in your process from the synced model table, then sent as a number in USD.",
  },
  {
    name: "latency_ms",
    type: "int",
    example: "1840",
    note: "Wall-clock duration of the call",
    detail: "Measured around the provider call. It says how long, not what.",
  },
  {
    name: "timestamp",
    type: "ISO 8601",
    example: "\"2026-09-04T09:14:22Z\"",
    note: "UTC time the call completed",
    detail: "Buckets the call into the day and hour you see on charts.",
  },
  {
    name: "success",
    type: "bool",
    example: "true",
    note: "Whether the call raised",
    detail: "True unless the provider SDK threw. This is what success rate is built from.",
  },
  {
    name: "error",
    type: "string | null",
    example: "null",
    note: "The provider exception message",
    detail: "Set only when a call fails, so the failure is visible on the dashboard.",
    caveat:
      "Some provider errors — content-policy rejections in particular — can quote part of the input in their message. If that matters for your workload, use local mode or self-host.",
  },
  {
    name: "input_hash",
    type: "SHA-256 hex",
    example: "\"9f2c4a7e…\"",
    note: "One-way digest of the prompt, never the prompt",
    detail: "Computed locally for duplicate detection. The prompt is hashed and discarded; only the digest travels.",
    caveat:
      "A digest is irreversible, but not a secret if the input is guessable: anyone who can enumerate a small set of candidate prompts can confirm a match. For long or unique prompts that is infeasible. We would rather state the limit than imply hashing is absolute.",
  },
  {
    name: "streaming",
    type: "bool",
    example: "false",
    note: "Present only on streamed calls",
    detail: "Marks that usage was assembled from a stream rather than a single response.",
  },
  {
    name: "metadata",
    type: "object",
    example: "{ \"user_id\": \"u_8f3\" }",
    note: "Only what you explicitly attach",
    detail: "Keys you attach yourself, sent verbatim. Attach identifiers such as user_id or session_id — not content.",
  },
];

const NEVER_SENT = [
  "Prompt and message text",
  "Model completions and responses",
  "System prompts and instructions",
  "Tool definitions, tool arguments, tool results",
  "Reasoning and thinking blocks",
  "Skill files, config files, or any file on disk",
  "Your LLM provider API keys",
  "Embeddings, documents, or retrieval context",
];

const DIGEST = "9f2c4a7e0b31d6e88c15af9027b4c3d1";
const EASE = [0.22, 1, 0.36, 1] as const;

function GradientBlur({ className }: { className?: string }) {
  return (
    <div className={cn("gradient-blur", className)} aria-hidden>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} />
      ))}
    </div>
  );
}

function Dot() {
  return <span className="h-1 w-1 rounded-full bg-neutral-600" aria-hidden />;
}

/** True while the element's content is taller than the element. */
function useOverflows<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, overflows };
}

function Scrollable({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { ref, overflows } = useOverflows<HTMLDivElement>();
  return (
    <div ref={ref} className={cn("relative", className)}>
      {children}
      {overflows && <GradientBlur className="h-16" />}
    </div>
  );
}

/* ── Cover: the journey a prompt takes ────────────────────────────────── */

const STAGE_MS = 2200;

function Cover({ paused }: { paused: boolean }) {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(reduced ? 2 : 0);
  const [typed, setTyped] = useState(reduced ? DIGEST.length : 0);

  // Advance the story: prompt measured → hashed → sent as metadata, then loop.
  useEffect(() => {
    if (reduced || paused) return;
    const id = setInterval(() => setStage((s) => (s + 1) % 3), STAGE_MS);
    return () => clearInterval(id);
  }, [reduced, paused]);

  // Type the digest whenever the hash stage begins.
  useEffect(() => {
    if (reduced) return;
    if (stage !== 1) return;
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(DIGEST.length, n + 2);
      setTyped(n);
      if (n >= DIGEST.length) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [stage, reduced]);

  const lit = (i: number) => stage >= i;

  return (
    <div className="relative m-4 overflow-hidden rounded-[1.4rem] border border-white/8 bg-[#0a0a0b]">
      <div
        className="pointer-events-none absolute -inset-12"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 20%, rgba(255,255,255,0.13), rgba(255,255,255,0.03) 45%, transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative px-6 py-6">
        <div className="flex items-baseline justify-between text-[11px] uppercase tracking-[0.14em] text-neutral-500">
          <span>One call, end to end</span>
          <span>{reduced ? "" : ["measuring", "hashing", "sending"][stage]}</span>
        </div>

        <ol className="relative mt-5 space-y-5">
          {/* rail */}
          <span className="absolute left-[7px] top-2 bottom-2 w-px bg-white/10" aria-hidden />

          {/* 1 · prompt stays home */}
          <li className="relative pl-7">
            <span className={cn("absolute left-1 top-1.5 h-2 w-2 rounded-full transition-all duration-500", lit(0) ? "bg-white" : "bg-neutral-700", stage === 0 && "shadow-[0_0_12px_rgba(255,255,255,0.9)]")} />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-neutral-200">Your prompt</span>
              <span className="text-[12px] tabular-nums text-neutral-400">1,284 tokens · counted locally</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1" aria-label="Prompt text, never transmitted">
              {[14, 9, 18, 6, 12, 22, 8, 15, 10, 19].map((w, i) => (
                <span
                  key={i}
                  className="h-2 rounded-sm bg-neutral-600/70 blur-[2px]"
                  style={{ width: `${w * 4}px` }}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11.5px] text-neutral-500">Stays in your process. Never on the wire.</p>
          </li>

          {/* 2 · hashed */}
          <li className="relative pl-7">
            <span className={cn("absolute left-1 top-1.5 h-2 w-2 rounded-full transition-all duration-500", lit(1) ? "bg-white" : "bg-neutral-700", stage === 1 && "shadow-[0_0_12px_rgba(255,255,255,0.9)]")} />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-neutral-200">sha256(prompt)</span>
              <span className="text-[12px] text-neutral-400">one way</span>
            </div>
            <p className="mt-1.5 truncate font-mono text-[12.5px] text-white">
              {DIGEST.slice(0, typed)}
              {typed < DIGEST.length && !reduced && (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-white align-middle" />
              )}
            </p>
          </li>

          {/* 3 · sent */}
          <li className="relative pl-7">
            <span className={cn("absolute left-1 top-1.5 h-2 w-2 rounded-full transition-all duration-500", lit(2) ? "bg-white" : "bg-neutral-700", stage === 2 && "shadow-[0_0_12px_rgba(255,255,255,0.9)]")} />
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-neutral-200">Event</span>
              <span className="text-[12px] text-neutral-400">POST /v1/events/batch</span>
            </div>
            <motion.div
              className="mt-2 flex flex-wrap gap-1.5"
              animate={{ opacity: lit(2) ? 1 : 0.35 }}
              transition={{ duration: 0.4 }}
            >
              {["agent_name", "model", "tokens", "cost", "latency_ms", "input_hash"].map((k) => (
                <span key={k} className="rounded-full border border-white/12 px-2 py-0.5 font-mono text-[11px] text-neutral-200">
                  {k}
                </span>
              ))}
            </motion.div>
          </li>
        </ol>
      </div>
    </div>
  );
}

/* ── Player ──────────────────────────────────────────────────────────── */

export function PrivacyPlayer() {
  const reduced = useReducedMotion();
  const [openField, setOpenField] = useState<Field | null>(null);
  const [neverOpen, setNeverOpen] = useState(false);
  const rowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const [sheetFrom, setSheetFrom] = useState(0);

  const dimmed = openField !== null || neverOpen;

  const openRow = useCallback((field: Field) => {
    const row = rowRefs.current[field.name];
    const card = cardRef.current;
    if (row && card) {
      setSheetFrom(row.getBoundingClientRect().top - card.getBoundingClientRect().top);
    }
    setOpenField(field);
  }, []);

  useEffect(() => {
    if (!dimmed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenField(null);
        setNeverOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dimmed]);

  const spring = reduced
    ? { duration: 0 }
    : { type: "spring" as const, stiffness: 320, damping: 32, mass: 0.9 };

  return (
    <LayoutGroup>
      <div
        ref={cardRef}
        className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0c0c0d] text-[14px] text-neutral-300 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
      >
        {/* Main content — recedes while a sheet is open */}
        <motion.div
          animate={{
            scale: dimmed ? 0.97 : 1,
            opacity: dimmed ? 0.4 : 1,
            filter: dimmed ? "blur(6px)" : "blur(0px)",
          }}
          transition={reduced ? { duration: 0 } : { duration: 0.45, ease: EASE }}
          aria-hidden={dimmed}
        >
          <Cover paused={dimmed} />

          <div className="px-6 pb-4">
            <h3 className="text-[22px] font-semibold leading-tight tracking-tight text-white">
              What leaves your process
            </h3>
            <div className="mt-2 flex items-center gap-2.5 text-[12.5px] text-neutral-500">
              <span>Metadata only</span>
              <Dot />
              <span>{FIELDS.length} fields</span>
              <Dot />
              <span>Tap a field</span>
            </div>
          </div>

          <div className="relative">
            <ul className="border-t border-white/8 px-2 pb-20 pt-1">
              {FIELDS.map((f) => (
                <li key={f.name}>
                  <motion.button
                    layoutId={`row-${f.name}`}
                    type="button"
                    ref={(el) => {
                      rowRefs.current[f.name] = el;
                    }}
                    onClick={() => openRow(f)}
                    className="group flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-[9px] text-left transition-colors hover:bg-white/5"
                    aria-haspopup="dialog"
                  >
                    <span className="font-medium text-white">{f.name}</span>
                    <span className="ml-auto truncate font-mono text-[12px] text-neutral-500 group-hover:text-neutral-300">
                      {f.example}
                    </span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 text-neutral-700 transition-colors group-hover:text-neutral-300"
                      aria-hidden
                    />
                  </motion.button>
                </li>
              ))}
            </ul>
            <GradientBlur className="h-24" />
          </div>
        </motion.div>

        {/* "+" — what never leaves (hidden while a sheet is open) */}
        {!dimmed && (
          <>
            <button
              type="button"
              onClick={() => setNeverOpen(true)}
              aria-label="What is never sent"
              className="absolute bottom-5 left-5 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/70 text-white backdrop-blur transition-colors hover:border-white/40"
            >
              <Plus size={18} aria-hidden />
            </button>
            <span className="pointer-events-none absolute bottom-[26px] left-[72px] z-30 text-[12.5px] text-neutral-400">
              What is never sent
            </span>
          </>
        )}

        {/* Field sheet — grows out of the tapped row */}
        <AnimatePresence>
          {openField && (
            <motion.div
              key={openField.name}
              role="dialog"
              aria-label={openField.name}
              initial={{ y: reduced ? 0 : sheetFrom - 300, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={spring}
              className="absolute inset-x-3 bottom-3 z-20 overflow-hidden rounded-[1.5rem] border border-white/12 bg-[#101012]/95 backdrop-blur-xl"
            >
              <motion.div
                layoutId={`row-${openField.name}`}
                className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="font-medium text-white">{openField.name}</p>
                  <p className="truncate font-mono text-[12px] text-neutral-500">
                    {openField.type} · {openField.example}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenField(null)}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-white/40"
                >
                  <Plus size={16} className="rotate-45" aria-hidden />
                </button>
              </motion.div>
              <Scrollable className="max-h-[280px] overflow-y-auto px-5 pb-5 pt-4">
                <p className="text-[15px] leading-6 text-white">{openField.note}.</p>
                <p className="mt-3 leading-6 text-neutral-300">{openField.detail}</p>
                {openField.caveat && (
                  <div className="mt-4 rounded-xl border border-white/10 bg-white/4 px-4 py-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                      An honest caveat
                    </p>
                    <p className="mt-1.5 leading-6 text-neutral-300">{openField.caveat}</p>
                  </div>
                )}
                <Link
                  href="/docs/privacy#transmitted"
                  className="mt-4 inline-flex items-center gap-1 text-[12.5px] text-neutral-400 transition-colors hover:text-white"
                >
                  Documented with the SDK line that builds it
                  <ArrowUpRight size={12} aria-hidden />
                </Link>
              </Scrollable>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Never-sent sheet */}
        <AnimatePresence>
          {neverOpen && (
            <motion.div
              role="dialog"
              aria-label="What is never sent"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={spring}
              className="absolute inset-x-0 bottom-0 z-20 max-h-[94%] overflow-hidden rounded-t-[2rem] border-t border-white/12 bg-[#101012]"
            >
              <div className="relative overflow-hidden px-6 pb-4 pt-6">
                <div
                  className="pointer-events-none absolute -inset-10"
                  style={{
                    background:
                      "radial-gradient(55% 45% at 30% 30%, rgba(255,255,255,0.12), transparent 70%)",
                  }}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-4">
                  <h3 className="text-[22px] font-semibold leading-tight tracking-tight text-white">
                    Never on the wire
                  </h3>
                  <button
                    type="button"
                    onClick={() => setNeverOpen(false)}
                    aria-label="Close"
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:border-white/40"
                  >
                    <Plus size={16} className="rotate-45" aria-hidden />
                  </button>
                </div>
                <div className="relative mt-2 flex items-center gap-2.5 text-[12.5px] text-neutral-500">
                  <span>Not by default</span>
                  <Dot />
                  <span>Not behind a setting</span>
                </div>
              </div>
              <Scrollable className="max-h-[360px] overflow-y-auto px-6 pb-8 pt-2">
                <ul className="divide-y divide-white/6 border-y border-white/8">
                  {NEVER_SENT.map((item, i) => (
                    <motion.li
                      key={item}
                      className="flex items-center justify-between gap-4 py-2.5"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={reduced ? { duration: 0 } : { delay: 0.08 + i * 0.04, duration: 0.3 }}
                    >
                      <span className="text-neutral-200">{item}</span>
                      <span className="shrink-0 text-[12.5px] text-neutral-600">never</span>
                    </motion.li>
                  ))}
                </ul>
                <p className="mt-4 leading-6 text-neutral-300">
                  There is no configuration in which prompt content is transmitted,
                  because the SDK never puts it on the wire in the first place. For
                  zero egress, local mode keeps everything in your process and the
                  MIT stack self-hosts with Docker.
                </p>
                <Link
                  href="/docs/privacy"
                  className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-white transition-colors hover:text-neutral-300"
                >
                  Read the data contract
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </Scrollable>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
