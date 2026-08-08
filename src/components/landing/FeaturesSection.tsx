"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { Activity, Code2, Layers, Zap, BarChart3, Shield } from "lucide-react";

/* ─────────────────────────────────────────────
   SpotlightCard — cursor-following radial glow
   ───────────────────────────────────────────── */

function SpotlightCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative rounded-2xl border border-white/6 bg-[#0b0b0d] overflow-hidden transition-colors duration-500 hover:border-white/12 ${className}`}
    >
      {/* Cursor-following spotlight gradient */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl transition-opacity duration-500"
        style={{
          opacity: hovering ? 1 : 0,
          background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(14,165,233,0.06), transparent 40%)`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────
   Animated live cost feed
   ───────────────────────────────────────────── */

const liveFeedData = [
  {
    agent: "research-bot",
    model: "gpt-4o",
    cost: "$0.0124",
    time: "2.1s",
    dot: "bg-sky-400/60",
  },
  {
    agent: "writer",
    model: "claude-3.5",
    cost: "$0.0189",
    time: "1.8s",
    dot: "bg-violet-400/60",
  },
  {
    agent: "code-gen",
    model: "gpt-4o-mini",
    cost: "$0.0008",
    time: "0.4s",
    dot: "bg-emerald-400/60",
  },
  {
    agent: "router",
    model: "gpt-4o-mini",
    cost: "$0.0003",
    time: "0.2s",
    dot: "bg-amber-400/60",
  },
  {
    agent: "reviewer",
    model: "gpt-4o",
    cost: "$0.0098",
    time: "1.6s",
    dot: "bg-rose-400/60",
  },
];

function LiveCostFeed() {
  const [visibleItems, setVisibleItems] = useState(0);

  useEffect(() => {
    if (visibleItems >= liveFeedData.length) return;
    const timer = setTimeout(() => setVisibleItems((v) => v + 1), 400);
    return () => clearTimeout(timer);
  }, [visibleItems]);

  return (
    <div className="rounded-xl bg-black/30 border border-white/4 overflow-hidden">
      {/* Feed header */}
      <div className="px-3.5 py-2.5 border-b border-white/3 flex items-center justify-between">
        <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-wider">
          Live Feed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] text-neutral-700 font-mono">
            streaming
          </span>
        </span>
      </div>

      {/* Feed rows */}
      <div className="divide-y divide-white/2">
        {liveFeedData.slice(0, visibleItems).map((item) => (
          <motion.div
            key={item.agent}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="px-3.5 py-2 flex items-center text-[11px] font-mono"
          >
            <span
              className={`w-1 h-1 rounded-full ${item.dot} mr-2 shrink-0`}
            />
            <span className="text-neutral-500 flex-1 truncate">
              {item.agent}
            </span>
            <span className="text-neutral-700 w-18 text-right hidden sm:block">
              {item.model}
            </span>
            <span className="text-neutral-700 w-10 text-right ml-3">
              {item.time}
            </span>
            <span className="text-sky-400/60 w-16 text-right ml-2">
              {item.cost}
            </span>
          </motion.div>
        ))}
        {visibleItems < liveFeedData.length && (
          <div className="px-3.5 py-2 flex items-center gap-1.5">
            <span className="inline-block w-1 h-3 bg-sky-400/40 animate-pulse rounded-sm" />
            <span className="text-[10px] text-neutral-700 font-mono">
              awaiting...
            </span>
          </div>
        )}
      </div>

      {/* Total ticker */}
      {visibleItems === liveFeedData.length && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="px-3.5 py-2.5 border-t border-white/4 flex items-center justify-between text-[11px] font-mono"
        >
          <span className="text-neutral-600">5 events</span>
          <span className="text-emerald-400/60">$0.0422 total</span>
        </motion.div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Mini animated area chart for analytics card
   ───────────────────────────────────────────── */

function MiniChart() {
  return (
    <div className="mt-4 rounded-lg bg-black/20 border border-white/3 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-mono text-neutral-700 uppercase tracking-wider">
          7-day cost
        </span>
        <span className="text-[9px] font-mono text-emerald-400/50">-23%</span>
      </div>
      <svg
        viewBox="0 0 200 40"
        className="w-full h-8"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="miniChartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(244,63,94,0.12)" />
            <stop offset="100%" stopColor="rgba(244,63,94,0)" />
          </linearGradient>
        </defs>
        <path
          d="M 0 30 C 15 28, 25 12, 40 10 C 55 8, 65 18, 80 20 C 95 22, 105 14, 120 16 C 135 18, 145 24, 160 22 C 175 20, 185 28, 200 26 L 200 40 L 0 40 Z"
          fill="url(#miniChartGrad)"
        />
        <path
          d="M 0 30 C 15 28, 25 12, 40 10 C 55 8, 65 18, 80 20 C 95 22, 105 14, 120 16 C 135 18, 145 24, 160 22 C 175 20, 185 28, 200 26"
          fill="none"
          stroke="rgba(244,63,94,0.4)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Features Section — Premium bento with spotlight
   ───────────────────────────────────────────── */

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 sm:py-32">
      {/* Subtle grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.008]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "180px 180px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ── Section header ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-xl mb-16"
        >
          <p className="text-xs font-mono text-sky-400/80 uppercase tracking-[0.2em] mb-5">
            Capabilities
          </p>
          <h2 className="text-3xl sm:text-[2.75rem] font-bold text-white leading-[1.15] tracking-tight">
            Everything you need to
            <br />
            <span className="text-neutral-500">control AI spend.</span>
          </h2>
        </motion.div>

        {/* ── Row 1: Two hero cards ── */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* Real-time tracking with live feed */}
          <SpotlightCard>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-sky-500/10 border border-sky-500/10">
                  <Activity className="size-4 text-sky-400/80" />
                </div>
                <p className="text-xs font-mono text-sky-400/60 uppercase tracking-widest">
                  Real-Time Tracking
                </p>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 leading-snug">
                See every dollar
                <br />
                as it&apos;s spent.
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-8 max-w-sm">
                Every LLM call is captured the moment it completes.
                Token counts, costs, and latency are recorded
                and available in your dashboard in real time.
              </p>
              <LiveCostFeed />
            </div>
          </SpotlightCard>

          {/* Zero code changes with highlighted code */}
          <SpotlightCard delay={0.06}>
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/10">
                  <Code2 className="size-4 text-emerald-400/80" />
                </div>
                <p className="text-xs font-mono text-emerald-400/60 uppercase tracking-widest">
                  Integration
                </p>
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3 leading-snug">
                Two lines of code.
                <br />
                Zero refactoring.
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-8 max-w-sm">
                The SDK intercepts LLM calls transparently. No wrappers,
                no decorators. Your agents, chains, and prompts stay
                exactly as they are.
              </p>

              {/* Code snippet with line numbers */}
              <div className="rounded-xl bg-black/30 border border-white/4 overflow-hidden">
                <div className="px-3.5 py-2 border-b border-white/3 flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/6" />
                    <span className="w-2 h-2 rounded-full bg-white/6" />
                    <span className="w-2 h-2 rounded-full bg-white/6" />
                  </div>
                  <span className="text-[10px] font-mono text-neutral-700 ml-1">
                    my_agent.py
                  </span>
                </div>
                <div className="p-4 font-mono text-[12px] leading-7 overflow-x-auto whitespace-nowrap">
                  <div className="flex items-start gap-3">
                    <span className="select-none text-neutral-800 w-4 text-right text-[10px] leading-7 shrink-0">
                      1
                    </span>
                    <div>
                      <span className="text-emerald-400/60">from</span>
                      <span className="text-neutral-400"> agentcost </span>
                      <span className="text-emerald-400/60">import</span>
                      <span className="text-neutral-400"> track_costs</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="select-none text-neutral-800 w-4 text-right text-[10px] leading-7 shrink-0">
                      2
                    </span>
                    <div>
                      <span className="text-neutral-400">track_costs</span>
                      <span className="text-neutral-600">.</span>
                      <span className="text-amber-400/70">init</span>
                      <span className="text-neutral-600">(</span>
                      <span className="text-neutral-400">api_key</span>
                      <span className="text-neutral-600">=</span>
                      <span className="text-sky-400/60">
                        &quot;sk_...&quot;
                      </span>
                      <span className="text-neutral-600">, </span>
                      <span className="text-neutral-400">project_id</span>
                      <span className="text-neutral-600">=</span>
                      <span className="text-sky-400/60">
                        &quot;6b3f2e1d-9c4a-4f8e-b2d7-3a5c8e9f0a1b&quot;
                      </span>
                      <span className="text-neutral-600">)</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mt-1">
                    <span className="select-none text-neutral-800 w-4 text-right text-[10px] leading-7 shrink-0">
                      3
                    </span>
                    <span className="text-neutral-700">
                      # that&apos;s it — your code stays unchanged
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="select-none text-neutral-800 w-4 text-right text-[10px] leading-7 shrink-0">
                      4
                    </span>
                    <span className="text-neutral-400">&nbsp;</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="select-none text-neutral-800 w-4 text-right text-[10px] leading-7 shrink-0">
                      5
                    </span>
                    <div>
                      <span className="text-neutral-700">
                        # your existing LangChain code
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="select-none text-neutral-800 w-4 text-right text-[10px] leading-7 shrink-0">
                      6
                    </span>
                    <div>
                      <span className="text-emerald-400/60">from</span>
                      <span className="text-neutral-400">
                        {" "}
                        langchain_openai{" "}
                      </span>
                      <span className="text-emerald-400/60">import</span>
                      <span className="text-neutral-400"> ChatOpenAI</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="select-none text-neutral-800 w-4 text-right text-[10px] leading-7 shrink-0">
                      7
                    </span>
                    <div>
                      <span className="text-neutral-400">llm </span>
                      <span className="text-neutral-600">= </span>
                      <span className="text-neutral-400">ChatOpenAI</span>
                      <span className="text-neutral-600">(</span>
                      <span className="text-neutral-400">model</span>
                      <span className="text-neutral-600">=</span>
                      <span className="text-sky-400/60">
                        &quot;gpt-4o&quot;
                      </span>
                      <span className="text-neutral-600">)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* ── Row 2: Four compact cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Layers,
              iconBg: "bg-violet-500/10",
              iconBorder: "border-violet-500/10",
              iconColor: "text-violet-400/80",
              label: "Multi-Agent",
              labelColor: "text-violet-400/60",
              title: "Per-agent cost isolation",
              desc: "Attribute spend to individual agents via async-safe context variables. Concurrent pipelines stay fully isolated.",
              visual: (
                <div className="mt-5 space-y-2">
                  {[
                    {
                      name: "planner",
                      cost: "$4.21",
                      pct: 38,
                      color: "bg-violet-400/50",
                    },
                    {
                      name: "executor",
                      cost: "$5.82",
                      pct: 53,
                      color: "bg-violet-400/30",
                    },
                    {
                      name: "reviewer",
                      cost: "$1.03",
                      pct: 9,
                      color: "bg-violet-400/15",
                    },
                  ].map((a) => (
                    <div
                      key={a.name}
                      className="flex items-center gap-2.5 text-[10px] font-mono"
                    >
                      <span className="text-neutral-500 w-14 truncate">
                        {a.name}
                      </span>
                      <div className="flex-1 h-1 bg-white/3 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${a.color} rounded-full`}
                          style={{ width: `${a.pct}%` }}
                        />
                      </div>
                      <span className="text-neutral-600 w-10 text-right">
                        {a.cost}
                      </span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              icon: Zap,
              iconBg: "bg-amber-500/10",
              iconBorder: "border-amber-500/10",
              iconColor: "text-amber-400/80",
              label: "Anomaly Detection",
              labelColor: "text-amber-400/60",
              title: "Statistical cost baselines",
              desc: "Z-score analysis flags spend deviations across cost, latency, and error rate with configurable severity thresholds.",
              visual: (
                <div className="mt-5 rounded-lg bg-black/20 border border-white/3 p-3">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                    <span className="text-[10px] font-mono text-amber-400/60 uppercase tracking-wider">
                      Alert triggered
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Baseline</span>
                      <span className="text-neutral-500">$0.012/call</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Observed</span>
                      <span className="text-amber-400/70">$0.087/call</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Z-score</span>
                      <span className="text-red-400/60">+3.2σ</span>
                    </div>
                  </div>
                </div>
              ),
            },
            {
              icon: BarChart3,
              iconBg: "bg-rose-500/10",
              iconBorder: "border-rose-500/10",
              iconColor: "text-rose-400/80",
              label: "Streaming",
              labelColor: "text-rose-400/60",
              title: "Native stream() support",
              desc: "Chunks are accumulated transparently. Token counts and costs are recorded atomically after stream completion.",
              visual: <MiniChart />,
            },
            {
              icon: Shield,
              iconBg: "bg-cyan-500/10",
              iconBorder: "border-cyan-500/10",
              iconColor: "text-cyan-400/80",
              label: "Optimization",
              labelColor: "text-cyan-400/60",
              title: "Actionable cost reduction",
              desc: "SHA-256 prompt hashing surfaces duplicate queries. Model-swap analysis quantifies potential savings.",
              visual: (
                <div className="mt-5 rounded-lg bg-black/20 border border-white/3 p-3 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-600">Duplicate queries</span>
                    <span className="text-cyan-400/60 font-medium">34%</span>
                  </div>
                  <div className="h-px bg-white/4" />
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-600">Projected savings</span>
                    <span className="text-emerald-400/60 font-medium">
                      $214/mo
                    </span>
                  </div>
                  <div className="h-px bg-white/4" />
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-600">Model swaps</span>
                    <span className="text-sky-400/60 font-medium">
                      3 suggested
                    </span>
                  </div>
                </div>
              ),
            },
          ].map((card, i) => (
            <SpotlightCard key={card.label} delay={i * 0.05}>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`p-1.5 rounded-md ${card.iconBg} border ${card.iconBorder}`}
                  >
                    <card.icon className={`size-3.5 ${card.iconColor}`} />
                  </div>
                  <p
                    className={`text-xs font-mono ${card.labelColor} uppercase tracking-widest`}
                  >
                    {card.label}
                  </p>
                </div>
                <h3 className="text-[15px] font-semibold text-white mb-2 leading-snug">
                  {card.title}
                </h3>
                <p className="text-[13px] text-neutral-600 leading-relaxed">
                  {card.desc}
                </p>
                {card.visual}
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
