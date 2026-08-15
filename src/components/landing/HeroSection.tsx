"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, Play } from "lucide-react";
import { track } from "@/lib/analytics";
import { CommandCenterDemo } from "./CommandCenterDemo";
import { FeatureAnnouncement } from "./FeatureAnnouncement";
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

/* Every figure and claim here is sourced — the link on each row is the
   receipt. Do not add a row without one. */
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
    line: "The overnight bill that became AgentCost — spend down 44% two weeks after we could see per-agent cost.",
    source: "Read the story",
    href: "https://dev.to/kushagra125/launching-agentcost-14lf",
  },
  {
    who: "Microsoft — Copilot",
    figure: <span className="text-white">−$20/user/mo</span>,
    line: "Reported losses under flat pricing — some users cost $80/mo — until the WSJ ran the numbers.",
    source: "The Register",
    href: "https://www.theregister.com/2023/10/11/github_ai_copilot_microsoft/",
    external: true,
  },
  {
    who: "Uber — engineering",
    figure: <span className="text-white">built a gateway</span>,
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
    figure: <span className="text-white">90% under $30/day</span>,
    line: "The average looks safe — the overruns live in the tail an average never shows.",
    source: "Weilliptic",
    href: "https://weilliptic.ai/blog/ai-coding-spend-governance-a-framework-for-engineering-and-finance-leaders/",
    external: true,
  },
];



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
      className="relative min-h-screen flex flex-col pt-32 pb-20 overflow-hidden"
    >
      {/* ── Background layers ── */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Aurora gradient blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-200 h-125 bg-sky-600/10 rounded-full blur-[120px] animate-aurora-1" />
        <div className="absolute top-[20%] right-[-10%] w-150 h-150 bg-indigo-500/5 rounded-full blur-[130px] animate-aurora-2" />

        {/* Radial vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0a0a0b_80%)]" />
      </motion.div>

      {/* Grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-1 opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">

        {/* What's-new announcement (reusable on every release) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-9"
        >
          <FeatureAnnouncement
            badge="MIT"
            href="https://github.com/agentcost-ai"
          >
            Open source — star AgentCost on GitHub
          </FeatureAnnouncement>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.7,
            delay: 0.1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-center text-white leading-[1.08] mb-8 max-w-4xl"
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
            entire site contains the word "AgentCost". Preflight resets
            headings to inherit, so this renders identically to the old <p>. */}
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-[17px] sm:text-lg font-normal text-neutral-400 text-center max-w-2xl leading-relaxed mb-10"
        >
          AgentCost traces every LLM call back to the agent that made it —
          OpenAI, Anthropic, Gemini, LangChain, 3,500+ models.{" "}
          <span className="text-neutral-200 font-medium">Two lines of Python.</span>{" "}
          Free hosted cloud — or self-host the MIT code.
        </motion.h2>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex flex-col sm:flex-row sm:flex-wrap w-full sm:w-auto items-center justify-center gap-3 mb-8"
        >
          <span className="relative w-full sm:w-auto">
            <Link
              href="/auth/register"
              onClick={() => track("click_signup", { location: "hero" })}
              className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium text-[#0a0a0b] bg-white hover:bg-neutral-100 rounded-full transition-all duration-200 shadow-[0_1px_32px_rgba(255,255,255,0.15)]"
            >
              Get Started — Free
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            {/* Sits beside the button so it never collides with the proof line
                below the CTA row. */}
            <AnnotatedArrow
              label="no credit card!"
              dir="right"
              delay={0.85}
              className="absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 lg:flex"
            />
          </span>
          <Link
            href="/demo?src=hero"
            className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium text-sky-300 hover:text-sky-200 border border-sky-500/30 hover:border-sky-400/50 rounded-full transition-all duration-200 hover:bg-sky-500/5"
          >
            <Play className="size-3.5 fill-current" />
            Try the Live Demo
            <span className="text-[11px] font-mono text-sky-500/70">
              no signup
            </span>
          </Link>
          <Link
            href="/docs/sdk"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3.5 text-sm font-medium text-neutral-400 hover:text-white border border-white/8 hover:border-white/15 rounded-full transition-all duration-200 hover:bg-white/2"
          >
            Documentation
          </Link>
        </motion.div>

        {/* Evidence ledger — the product's own idiom used as proof. Five
            costed line items: our incident first, then the industry record
            that says it isn't just us. Every row carries a name, a number
            and a source; none of it is invented. */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mb-16 w-full max-w-4xl"
        >
          <div className="overflow-hidden rounded-xl border border-white/8 bg-white/2">
            <div className="flex items-baseline justify-between border-b border-white/8 px-5 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                The blind spot, on the record
              </span>
              <span className="hidden font-mono text-[11px] text-neutral-600 sm:block">
                5 line items · sourced
              </span>
            </div>
            <div className="divide-y divide-white/6">
              {LEDGER.map((row) => (
                <div
                  key={row.who}
                  className={`gap-x-4 gap-y-1 px-5 py-3 sm:grid sm:grid-cols-[minmax(0,10rem)_minmax(0,9rem)_1fr_auto] sm:items-baseline ${
                    row.ours ? "border-l-2 border-l-sky-400 bg-sky-400/4" : ""
                  }`}
                >
                  <span className={`block text-[13px] ${row.ours ? "text-neutral-200" : "text-neutral-400"}`}>
                    {row.who}
                  </span>
                  <span className="block whitespace-nowrap font-mono text-[13px] font-medium">
                    {row.figure}
                  </span>
                  <span className="block text-[13px] leading-snug text-neutral-500">
                    {row.line}
                  </span>
                  <a
                    href={row.href}
                    rel={row.external ? "noopener nofollow" : "noopener"}
                    target={row.external ? "_blank" : undefined}
                    className="group mt-1 inline-flex items-center gap-1 whitespace-nowrap text-[12px] text-neutral-600 transition-colors hover:text-white sm:mt-0"
                  >
                    {row.source}
                    <ArrowUpRight className="size-3 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px" aria-hidden />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Command Center Demo ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 1,
            delay: 0.4,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full relative z-20"
        >
          <CommandCenterDemo />
        </motion.div>



      </div>
    </section>
  );
}
