"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

/* ─────────────────────────────────────────────
   Animated counter — counts up on scroll into view
   ───────────────────────────────────────────── */

function AnimatedCounter({
  target,
  suffix = "",
  prefix = "",
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ─────────────────────────────────────────────
   Stats data
   ───────────────────────────────────────────── */

const stats = [
  {
    value: 2900,
    suffix: "+",
    label: "models tracked",
    detail: "OpenAI · Anthropic · Google · Mistral · and 50+ providers",
    accent: "from-sky-400/20 via-sky-400/5 to-transparent",
  },
  {
    value: 1,
    prefix: "<",
    suffix: "ms",
    label: "overhead added",
    detail: "Async batching ensures your agents never slow down",
    accent: "from-emerald-400/20 via-emerald-400/5 to-transparent",
  },
  {
    value: 100,
    suffix: "%",
    label: "self-hosted",
    detail: "Your data never leaves your infrastructure. No telemetry.",
    accent: "from-violet-400/20 via-violet-400/5 to-transparent",
  },
];

export function MetricsSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.6], ["0%", "100%"]);

  return (
    <section
      id="metrics"
      ref={containerRef}
      className="relative py-32 border-y border-white/3"
    >
      <div className="mx-auto max-w-5xl px-6">
        {/* Vertical scroll-driven line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 overflow-hidden hidden lg:block">
          <motion.div
            style={{ height: lineHeight }}
            className="w-full bg-linear-to-b from-sky-500/40 via-sky-500/20 to-transparent"
          />
        </div>

        {/* Stats — editorial staggered layout */}
        <div className="space-y-24 lg:space-y-32">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={`relative flex flex-col ${i % 2 === 0
                  ? "lg:items-start lg:text-left"
                  : "lg:items-end lg:text-right"
                } items-center text-center`}
            >
              {/* Big number with counter animation */}
              <span className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tighter text-white/90 font-mono leading-none mb-4">
                {stat.prefix && <span>{stat.prefix}</span>}
                <AnimatedCounter target={stat.value} />
                {stat.suffix && <span>{stat.suffix}</span>}
              </span>

              {/* Label */}
              <span className="text-lg sm:text-xl text-neutral-400 font-medium mb-2">
                {stat.label}
              </span>

              {/* Detail line */}
              <span className="text-sm text-neutral-600 max-w-md">
                {stat.detail}
              </span>

              {/* Accent gradient line */}
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{
                  delay: 0.3,
                  duration: 0.8,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`mt-6 h-px w-32 bg-linear-to-r ${stat.accent} origin-center`}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
