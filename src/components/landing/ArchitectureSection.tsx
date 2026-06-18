"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "Install the SDK",
    subtitle: "pip install agentcost",
    description:
      "A lightweight Python package. Add the import and call init() with your API key. Your existing LangChain code continues to work unchanged — the SDK intercepts calls transparently via monkey-patching.",
    highlight: "No wrappers, no decorators, no middleware.",
    code: `from agentcost import track_costs\n\ntrack_costs.init(api_key="ac_...")\n\n# That's it. Your code stays the same.`,
  },
  {
    id: "02",
    title: "Calls are captured",
    subtitle: "Automatic interception",
    description:
      "Every LLM invocation is intercepted in real-time. Token counts are calculated using tiktoken, costs are computed from a pricing database of 2,900+ models, and events are batched efficiently before sending.",
    highlight: "Adds <1ms overhead to your calls.",
    code: `# Behind the scenes:\n► gpt-4o     1,247 tokens   $0.0124\n► claude-3.5  2,105 tokens   $0.0189\n\n✓ Batched & sent asynchronously`,
  },
  {
    id: "03",
    title: "Data flows to your backend",
    subtitle: "FastAPI + PostgreSQL",
    description:
      "The self-hosted backend receives batched events, stores them in PostgreSQL, and runs analytics. It computes per-agent breakdowns, model comparisons, and cost optimization suggestions.",
    highlight: "Self-hosted. Your data never leaves your infra.",
    code: `# docker-compose up\n\n✓ FastAPI server ready\n✓ PostgreSQL connected\n✓ Analytics engine running`,
  },
  {
    id: "04",
    title: "See everything in the dashboard",
    subtitle: "Next.js analytics UI",
    description:
      "A full analytics dashboard shows cost trends over time, per-agent and per-model breakdowns, latency distributions, and optimization recommendations to reduce your spend.",
    highlight: "Actionable insights, not just charts.",
    code: `Dashboard:\n┌─ Costs:  $12.47 today  (-8%)\n├─ Tokens: 142k processed\n├─ Agents: 4 active\n└─ Optim:  3 suggestions`,
  },
];

const AUTO_ADVANCE_MS = 6000;

export function ArchitectureSection() {
  const [active, setActive] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const step = steps[active];

  // Start autoplay when section comes into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAutoPlaying(true);
        }
      },
      { threshold: 0.3 },
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setTimeout(() => {
      setActive((prev) => {
        const next = (prev + 1) % steps.length;
        setProgressKey((k) => k + 1);
        return next;
      });
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [active, isAutoPlaying, progressKey]);

  const handleStepClick = useCallback((i: number) => {
    setActive(i);
    setIsAutoPlaying(false);
    setProgressKey((k) => k + 1);
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <p className="text-xs font-mono text-emerald-400/80 uppercase tracking-[0.2em] mb-5">
            How it works
          </p>
          <h2 className="text-3xl sm:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight">
            From call to insight
            <br />
            <span className="text-neutral-500">in four steps.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Step selector tabs with progress bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => handleStepClick(i)}
                className={`group relative text-left px-5 py-4 rounded-xl border transition-all duration-300 overflow-hidden ${active === i
                    ? "border-white/12 bg-white/4"
                    : "border-white/4 bg-transparent hover:border-white/8 hover:bg-white/2"
                  }`}
              >
                {/* Auto-advance progress bar */}
                {active === i && isAutoPlaying && (
                  <motion.div
                    key={`progress-${progressKey}`}
                    className="absolute top-0 left-0 h-0.5 bg-linear-to-r from-sky-500/60 to-sky-400/20"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: AUTO_ADVANCE_MS / 1000,
                      ease: "linear",
                    }}
                  />
                )}

                {/* Active indicator */}
                {active === i && !isAutoPlaying && (
                  <motion.div
                    layoutId="step-indicator"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-sky-500/50 via-sky-400/30 to-transparent"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-mono transition-colors duration-200 ${active === i ? "text-sky-400" : "text-neutral-700"
                      }`}
                  >
                    {s.id}
                  </span>
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${active === i
                        ? "text-white"
                        : "text-neutral-500 group-hover:text-neutral-300"
                      }`}
                  >
                    {s.title}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Active step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Left — description */}
              <div className="rounded-2xl border border-white/6 bg-[#0b0b0d] p-8 flex flex-col justify-between">
                <div>
                  <p className="text-xs font-mono text-neutral-600 mb-3">
                    {step.subtitle}
                  </p>
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-neutral-500 leading-relaxed mb-6">
                    {step.description}
                  </p>
                  <p className="text-[14px] text-neutral-300 font-medium flex items-center gap-2">
                    <ChevronRight className="size-3.5 text-sky-400/70" />
                    {step.highlight}
                  </p>
                </div>

                {/* Step navigation */}
                {active < steps.length - 1 && (
                  <button
                    onClick={() => handleStepClick(active + 1)}
                    className="mt-8 self-start inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors"
                  >
                    Next: {steps[active + 1].title}
                    <ChevronRight className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Right — code/visual preview */}
              <div className="rounded-2xl border border-white/6 bg-[#0c0c0e] overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3 border-b border-white/4 bg-white/1.5">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]/80" />
                  </div>
                  <span className="ml-2 text-[11px] font-mono text-neutral-700">
                    step-{step.id}.sh
                  </span>
                </div>
                <pre className="p-6 font-mono text-[13px] leading-7 text-neutral-400 whitespace-pre overflow-x-auto">
                  {step.code}
                </pre>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
