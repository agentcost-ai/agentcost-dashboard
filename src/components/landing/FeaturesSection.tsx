"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FEATURES, type Feature } from "./capability-visuals";

/* ─────────────────────────────────────────────
   Capabilities — a bento grid. Every capability
   is visible at once, each card carrying the
   product itself in miniature (capability-visuals),
   animated in as the card scrolls into view.
   ───────────────────────────────────────────── */

/** Card order and width on the 12-column grid, row by row. */
const LAYOUT: Array<{ id: string; span: string }> = [
  { id: "run-cost", span: "lg:col-span-7" },
  { id: "guardrails", span: "lg:col-span-5" },
  { id: "classifier", span: "lg:col-span-4" },
  { id: "analyze", span: "lg:col-span-4" },
  { id: "models", span: "lg:col-span-4" },
  { id: "two-lines", span: "lg:col-span-5" },
  { id: "concurrency", span: "lg:col-span-4" },
  { id: "streaming", span: "lg:col-span-3" },
];

const BY_ID = new Map(FEATURES.map((f) => [f.id, f]));

function CapabilityCard({ feature, span, index }: { feature: Feature; span: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduced = useReducedMotion();
  const Icon = feature.icon;
  const Visual = feature.visual;

  // Spotlight that follows the pointer; written to CSS variables so hovering
  // never re-renders the animated visual inside.
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: (index % 3) * 0.06 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0e0e10] p-6",
        "transition-colors duration-300 hover:border-white/16",
        span,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(420px circle at var(--mx, 50%) var(--my, 0%), rgba(56,189,248,0.07), transparent 60%)",
        }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
          <span className="flex size-6 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-sky-400">
            <Icon size={13} strokeWidth={2} aria-hidden />
          </span>
          {feature.label}
        </div>
        <h3 className="mt-3 text-[17px] font-medium leading-snug text-white">{feature.description}</h3>
      </div>

      <div className="relative mt-6 flex-1 rounded-xl border border-white/6 bg-black/30 p-4">
        <Visual active={inView} />
      </div>
    </motion.div>
  );
}

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">Capabilities</p>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
              Your invoice says what you spent.
              <br />
              <span className="text-neutral-500">It never says what you spent it on.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-6 text-neutral-400 lg:pb-1.5">
            What AgentCost tells you that a token total cannot, for what already ran and for what
            you are about to ship.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-12">
          {LAYOUT.map(({ id, span }, i) => {
            const feature = BY_ID.get(id);
            return feature ? <CapabilityCard key={id} feature={feature} span={span} index={i} /> : null;
          })}
        </div>
      </div>
    </section>
  );
}
