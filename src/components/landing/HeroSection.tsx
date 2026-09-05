"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { AnnouncementCard } from "./AnnouncementCard";
import { AnnotatedArrow } from "./AnnotatedArrow";

type LedgerRow = {
  who: string;
  figure: ReactNode;
  line: string;
  source: string;
  href: string;
  external?: boolean;
  ours?: boolean;
};

/* Every figure and claim here is sourced — the link on each cell is the
   receipt. Do not add a cell without one. */
const LEDGER: LedgerRow[] = [
  {
    ours: true,
    who: "Us — one retry loop",
    figure: (
      <>
        <span className="text-white">$800</span>
        <span className="text-neutral-600"> → </span>
        <span className="text-emerald-400">−44%</span>
      </>
    ),
    line: "The overnight bill that became AgentCost. Spend down 44% two weeks after we could see per-agent cost.",
    source: "Read the story",
    href: "https://dev.to/kushagra125/launching-agentcost-14lf",
  },
  {
    who: "Microsoft — Copilot",
    figure: <span className="text-white">−$20 / user / mo</span>,
    line: "Reported losses under flat pricing, with some users costing $80 a month, until the WSJ ran the numbers.",
    source: "The Register",
    href: "https://www.theregister.com/2023/10/11/github_ai_copilot_microsoft/",
    external: true,
  },
  {
    who: "Uber — engineering",
    figure: <span className="text-white">Built a gateway</span>,
    line: "LLM cost attribution took a dedicated internal service between every team and every model.",
    source: "Uber Engineering",
    href: "https://www.uber.com/blog/genai-gateway/",
    external: true,
  },
  {
    who: "Gartner — forecasts",
    figure: <span className="text-white">500–1,000%</span>,
    line: "The error range on GenAI cost estimates made without usage visibility.",
    source: "Gartner",
    href: "https://www.gartner.com/en/articles/ai-value",
    external: true,
  },
  {
    who: "Claude Code — developers",
    figure: <span className="text-white">90% under $30 / day</span>,
    line: "The average looks safe. The overruns live in the tail an average never shows.",
    source: "Weilliptic",
    href: "https://weilliptic.ai/blog/ai-coding-spend-governance-a-framework-for-engineering-and-finance-leaders/",
    external: true,
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────────────────────────
   Hero Section
   ───────────────────────────────────────────── */
export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-screen flex-col overflow-hidden pb-20 pt-28 lg:pt-36"
    >
      {/* ── Background layers ── */}
      <motion.div style={{ y: bgY }} className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute top-0 left-1/2 h-125 w-200 -translate-x-1/2 rounded-full bg-sky-600/10 blur-[120px] animate-aurora-1" />
        <div className="absolute top-[20%] right-[-10%] h-150 w-150 rounded-full bg-indigo-500/5 blur-[130px] animate-aurora-2" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0b_80%)]" />
      </motion.div>

      {/* Grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-1 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Headline + CTAs on the left, release announcement on the right.
            The announcement is a card, not a pill, so it gets a column of
            its own instead of pushing the headline down the page. */}
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-16">
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
              className="text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
            >
              Your AI bill spiked.{" "}
              <span className="relative inline-block">
                {/* Single-family gradient only (sky→sky): cross-color fades are
                    banned as an AI-slop fingerprint in this codebase. */}
                <span className="relative z-10 bg-linear-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">
                  Which&nbsp;agent
                </span>
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-linear-to-r from-sky-400/50 via-sky-400/20 to-transparent" />
              </span>{" "}
              did it?
            </motion.h1>

            {/* Subtext — an h2 (not a p) so the site's primary brand-bearing
                heading exists in the document outline: no other heading on the
                entire site contains the word "AgentCost". */}
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
              className="mx-auto mt-7 max-w-2xl text-[17px] font-normal leading-relaxed text-neutral-400 sm:text-lg lg:mx-0"
            >
              AgentCost traces every LLM call back to the agent that made it —
              OpenAI, Anthropic, Gemini, LangChain, 3,500+ models.{" "}
              <span className="font-medium text-neutral-200">Two lines of Python.</span>{" "}
              Free hosted cloud — or self-host the MIT code.
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
              className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start"
            >
              <span className="relative w-full sm:w-auto">
                <Link
                  href="/auth/register"
                  onClick={() => track("click_signup", { location: "hero" })}
                  className="group relative inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-[#0a0a0b] shadow-[0_1px_32px_rgba(255,255,255,0.15)] transition-all duration-200 hover:bg-neutral-100 sm:w-auto"
                >
                  Get Started — Free
                  <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
                {/* Sits in the page gutter to the left of the button,
                    pointing at it. Needs the wide gutter, so xl and up. */}
                <AnnotatedArrow
                  label="no credit card!"
                  dir="right"
                  delay={0.85}
                  className="absolute right-full top-1/2 mr-1 hidden -translate-y-1/2 gap-1 min-[1440px]:flex [&_svg]:h-5 [&_svg]:w-9"
                  labelClassName="block w-16 whitespace-normal text-right text-[17px] leading-[0.95]"
                />
              </span>
              <Link
                href="/demo?src=hero"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-sky-500/30 px-6 py-3.5 text-sm font-medium text-sky-300 transition-all duration-200 hover:border-sky-400/50 hover:bg-sky-500/5 hover:text-sky-200 sm:w-auto"
              >
                <Play className="size-3.5 fill-current" />
                Try the Live Demo
                <span className="font-mono text-[11px] text-sky-500/70">no signup</span>
              </Link>
              <Link
                href="/docs/sdk"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/8 px-6 py-3.5 text-sm font-medium text-neutral-400 transition-all duration-200 hover:border-white/15 hover:bg-white/2 hover:text-white sm:w-auto"
              >
                Documentation
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: EASE }}
            className="flex justify-center lg:justify-end"
          >
            <AnnouncementCard
              title="AgentCost Guardrails"
              tag="New"
              description="Declare which tools and models each agent may use, and how much a run may do. Every breach shows up per agent, the moment it happens."
              buttonText="See how it works"
              buttonHref="/docs/api#guardrails"
              feature="guardrails"
              className="lg:max-w-md"
            />
          </motion.div>
        </div>

        {/* Evidence — five sourced figures set as one typographic row: no
            boxes, no rule, no eyebrow; the number, the story and the receipt. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease: EASE }}
          className="mt-24 lg:mt-28"
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
              The blind spot, on the record
            </span>
            <span className="hidden font-mono text-[11px] text-neutral-600 sm:block">
              every figure sourced
            </span>
          </div>
          <div className="mt-8 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
            {LEDGER.map((row) => (
              <a
                key={row.who}
                href={row.href}
                rel={row.external ? "noopener nofollow" : "noopener"}
                target={row.external ? "_blank" : undefined}
                className="group flex flex-col"
              >
                <span
                  className={cn(
                    "text-[12.5px]",
                    row.ours ? "text-sky-300" : "text-neutral-500",
                  )}
                >
                  {row.who}
                </span>
                <span className="mt-3 text-[26px] font-semibold leading-none tracking-tight tabular-nums sm:text-[28px]">
                  {row.figure}
                </span>
                <span className="mt-4 flex-1 text-[13.5px] leading-snug text-neutral-400">
                  {row.line}
                </span>
                <span className="mt-4 inline-flex items-center gap-1 text-[12px] text-neutral-500 transition-colors group-hover:text-white">
                  {row.source}
                  <ArrowUpRight
                    className="size-3 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px"
                    aria-hidden
                  />
                </span>
              </a>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
