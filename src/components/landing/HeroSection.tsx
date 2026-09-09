"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────────────────────────
   Hero. The headline asks; the product answers.
   The only visual is a real capture of the
   Agents page in demo mode (public/hero/*),
   re-exported whenever that page changes.
   ───────────────────────────────────────────── */
export function HeroSection() {
  const reduced = useReducedMotion();
  const rise = (delay: number, y = 18) => ({
    initial: { opacity: 0, y: reduced ? 0 : y },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0 : 0.9, delay: reduced ? 0 : delay, ease: EASE },
  });

  return (
    <section className="relative overflow-hidden pt-36 lg:pt-48">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-6 lg:px-8">
        <h1 className="font-display max-w-[22ch] text-[2.4rem] font-normal leading-[1.02] tracking-[-0.02em] text-white sm:text-[3.6rem] lg:text-[4.5rem] xl:text-[5.25rem]">
          <motion.span {...rise(0.05)} className="block">
            Your AI bill spiked.
          </motion.span>
          <motion.span {...rise(0.13)} className="block">
            Which agent did it?
          </motion.span>
        </h1>

        {/* h2, not p: the only heading on the site carrying the brand name,
            so it has to stay in the document outline. */}
        <motion.h2
          {...rise(0.3, 12)}
          className="mt-7 max-w-[46ch] text-[17px] font-normal leading-7 text-neutral-400 sm:text-lg"
        >
          AgentCost traces every LLM call to the agent that made it. Two lines of
          Python, 3,500+ models, MIT licensed.
        </motion.h2>

        <motion.div
          {...rise(0.38, 12)}
          className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-5"
        >
          <div className="flex items-center gap-7">
            <Link
              href="/auth/register"
              onClick={() => track("click_signup", { location: "hero" })}
              className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-medium text-[#0a0a0b] transition-colors hover:bg-neutral-200"
            >
              Start free
            </Link>
            <Link
              href="/demo?src=hero"
              className="group inline-flex items-center gap-1.5 text-sm font-medium text-neutral-300 transition-colors hover:text-white"
            >
              See the live demo
              <ArrowRight
                className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>

          <Link
            href="/docs/api#guardrails"
            onClick={() => track("announcement_clicked", { feature: "guardrails", location: "hero" })}
            className="group inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <span className="font-medium text-neutral-200">New</span>
            <span className="sm:hidden">Guardrails</span>
            <span className="hidden sm:inline">Guardrails: per-agent limits on tools, models and runs</span>
            <ArrowRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
        </motion.div>

        <motion.div {...rise(0.48, 28)} className="relative mt-16 lg:mt-20">
          <div className="max-h-[320px] overflow-hidden rounded-t-[10px] border border-b-0 border-white/10 bg-[#0b0b0d] sm:max-h-[440px] lg:max-h-[560px] xl:max-h-[620px]">
            <img
              src="/hero/agents-1600.webp"
              srcSet="/hero/agents-1600.webp 1600w, /hero/agents-3200.webp 3200w"
              sizes="(min-width: 1280px) 1216px, 100vw"
              width={1600}
              height={750}
              alt="AgentCost Agents page: seven agents ranked by spend over the last 7 days, support-triage-agent first at 24.8%"
              fetchPriority="high"
              decoding="async"
              className="hidden w-full sm:block"
            />
            <img
              src="/hero/agents-mobile.webp"
              width={358}
              height={687}
              alt="AgentCost Agents page: seven agents ranked by spend, support-triage-agent first at 24.8%"
              fetchPriority="high"
              decoding="async"
              className="w-full sm:hidden"
            />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-[#0a0a0b] to-transparent"
          />
        </motion.div>
      </div>
    </section>
  );
}
