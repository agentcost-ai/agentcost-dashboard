"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Code2, ScanLine, Send, Receipt, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   How it works — one call followed through the
   pipeline. Four stations on a track; a packet
   travels between them and each station shows
   the call's state at that point.
   Numbers are consistent: 1,247 in + 312 out on
   gpt-4o at $2.50 / $10 per 1M = $0.0062.
   ───────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const;
const ADVANCE_MS = 2600;

interface Station {
  title: string;
  body: string;
  icon: LucideIcon;
  card: React.ReactNode;
}

function Row({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-neutral-500">{k}</span>
      <span className={cn("truncate tabular-nums", strong ? "font-medium text-white" : "text-neutral-200")}>{v}</span>
    </div>
  );
}

const STATIONS: Station[] = [
  {
    title: "Your code calls a model",
    body: "Unchanged. Python is patched in-process; in TypeScript you wrap the client once.",
    icon: Code2,
    card: (
      <div className="font-mono text-[11.5px] leading-5">
        <p className="text-neutral-500">with agent(&quot;researcher&quot;):</p>
        <p className="pl-3 text-neutral-200">client.chat.completions</p>
        <p className="pl-3 text-neutral-200">  .create(model=&quot;gpt-4o&quot;, …)</p>
      </div>
    ),
  },
  {
    title: "The SDK reads the usage",
    body: "Off the response the provider already returned, plus the agent and step it ran under.",
    icon: ScanLine,
    card: (
      <div className="space-y-1 text-[12px]">
        <Row k="model" v="gpt-4o" />
        <Row k="tokens" v="1,247 in · 312 out" />
        <Row k="agent" v="researcher" />
        <p className="pt-1 text-[11px] text-neutral-500">
          <span className="line-through decoration-neutral-600">prompt</span>{" "}
          <span className="line-through decoration-neutral-600">reply</span> stay in your process
        </p>
      </div>
    ),
  },
  {
    title: "Sent in the background",
    body: "Batched off your request path. A retry resends the same ids, so nothing is counted twice.",
    icon: Send,
    card: (
      <div className="space-y-1 text-[12px]">
        <Row k="POST" v="/v1/events/batch" />
        <Row k="batch" v="10 events" />
        <Row k="event_id" v="9f1c…a04e" />
        <p className="pt-1 text-[11px] text-neutral-500">Sent off your call&apos;s path</p>
      </div>
    ),
  },
  {
    title: "Priced and attributed",
    body: "Priced from a catalogue of 3,500+ models and rolled up by agent, job, run and step.",
    icon: Receipt,
    card: (
      <div className="text-[12px]">
        <div className="flex items-baseline justify-between">
          <span className="text-neutral-500">cost</span>
          <span className="text-[17px] font-semibold tabular-nums text-white">$0.0062</span>
        </div>
        <p className="mt-1.5 truncate text-neutral-300">
          researcher <span className="text-neutral-600">›</span> nightly-report{" "}
          <span className="text-neutral-600">›</span> draft
        </p>
      </div>
    ),
  },
];

export function ArchitectureSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!inView || paused || reduced) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STATIONS.length), ADVANCE_MS);
    return () => clearInterval(id);
  }, [inView, paused, reduced]);

  // Packet position along the track, as a fraction of its length.
  const at = active / (STATIONS.length - 1);

  return (
    <section id="how-it-works" className="relative py-20 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">How it works</p>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
            Follow one call
            <br />
            <span className="text-neutral-500">from your code to your dashboard.</span>
          </h2>
        </div>

        <div
          ref={ref}
          className="relative mt-16"
          onPointerEnter={() => setPaused(true)}
          onPointerLeave={() => setPaused(false)}
        >
          {/* Track: horizontal on desktop, vertical on small screens. */}
          <div aria-hidden className="absolute left-[12.5%] right-[12.5%] top-[22px] hidden h-px bg-white/10 lg:block">
            <motion.div
              className="h-full origin-left bg-gradient-to-r from-sky-400/70 to-sky-400/20"
              initial={false}
              animate={{ scaleX: at }}
              transition={reduced ? { duration: 0 } : { duration: 0.8, ease: EASE }}
            />
            <motion.span
              className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_14px_4px_rgba(56,189,248,0.45)]"
              initial={false}
              animate={{ left: `${at * 100}%` }}
              transition={reduced ? { duration: 0 } : { duration: 0.8, ease: EASE }}
            />
          </div>
          <div aria-hidden className="absolute bottom-6 left-[22px] top-6 w-px bg-white/10 lg:hidden" />

          <ol className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-5">
            {STATIONS.map((s, i) => {
              const Icon = s.icon;
              const on = i === active;
              const done = i < active;
              return (
                <li key={s.title} className="relative pl-14 lg:pl-0">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={on ? "step" : undefined}
                    className="group flex w-full flex-col text-left lg:items-center lg:text-center"
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-0 flex size-11 items-center justify-center rounded-full border bg-[#0a0a0b] transition-colors duration-300 lg:relative",
                        on
                          ? "border-sky-400/60 text-sky-300"
                          : done
                            ? "border-white/20 text-neutral-300"
                            : "border-white/10 text-neutral-500 group-hover:text-neutral-300",
                      )}
                    >
                      <Icon size={17} strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="text-[11px] font-medium tabular-nums text-neutral-500 lg:mt-5">
                      0{i + 1}
                    </span>
                    <span
                      className={cn(
                        "mt-1 text-[15px] font-medium transition-colors duration-300",
                        on ? "text-white" : "text-neutral-300",
                      )}
                    >
                      {s.title}
                    </span>
                    <span className="mt-2 max-w-[30ch] text-[13.5px] leading-6 text-neutral-500">{s.body}</span>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      opacity: on ? 1 : 0.6,
                      y: on ? 0 : 4,
                      borderColor: on ? "rgba(56,189,248,0.35)" : "rgba(255,255,255,0.07)",
                    }}
                    transition={reduced ? { duration: 0 } : { duration: 0.45, ease: EASE }}
                    className="mt-5 rounded-xl border bg-[#0e0e10] p-4 text-left"
                  >
                    {s.card}
                  </motion.div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
