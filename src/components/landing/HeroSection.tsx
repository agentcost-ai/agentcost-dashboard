"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { CommandCenterDemo } from "./CommandCenterDemo";
import { FeatureAnnouncement } from "./FeatureAnnouncement";
import { AnnotatedArrow } from "./AnnotatedArrow";



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
      <div className="relative z-10 mx-auto max-w-7xl px-6 w-full flex flex-col items-center">

        {/* What's-new announcement (reusable on every release) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-9"
        >
          <FeatureAnnouncement
            badge="New"
            href="/blog/executive-cost-and-usage-reports"
          >
            Turn your AI spend into board-ready reports
          </FeatureAnnouncement>
          <AnnotatedArrow
            label="just shipped!"
            dir="left"
            delay={0.5}
            className="absolute left-full top-1/2 ml-3 hidden -translate-y-1/2 lg:flex"
          />
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
          Know exactly what your{" "}
          <span className="relative inline-block">
            <span className="relative z-10 bg-linear-to-r from-sky-300 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI&nbsp;agents
            </span>
            <span className="absolute -bottom-1 left-0 right-0 h-px bg-linear-to-r from-sky-400/50 via-cyan-400/20 to-transparent" />
          </span>{" "}
          cost.
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="text-[17px] sm:text-lg text-neutral-400 text-center max-w-2xl leading-relaxed mb-10"
        >
          Open-source cost tracking for LLM applications.{" "}
          <span className="text-neutral-200 font-medium">Two lines of Python.</span>{" "}
          Self-hosted. 2,900+ models supported.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="flex flex-wrap items-center justify-center gap-3 mb-20"
        >
          <Link
            href="/auth/register"
            className="group relative inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-[#0a0a0b] bg-white hover:bg-neutral-100 rounded-full transition-all duration-200 shadow-[0_1px_32px_rgba(255,255,255,0.15)]"
          >
            Get Started — Free
            <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
          <span className="relative">
            <Link
              href="/demo?src=hero"
              className="group inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-sky-300 hover:text-sky-200 border border-sky-500/30 hover:border-sky-400/50 rounded-full transition-all duration-200 hover:bg-sky-500/5"
            >
              <Play className="size-3.5 fill-current" />
              Try Live Demo
              <span className="text-[11px] font-mono text-sky-500/70 group-hover:text-sky-400/80">
                no signup
              </span>
            </Link>
            <AnnotatedArrow
              label="fully interactive!"
              dir="up"
              delay={0.85}
              className="absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 lg:flex"
            />
          </span>
          <Link
            href="/docs/sdk"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-medium text-neutral-400 hover:text-white border border-white/8 hover:border-white/15 rounded-full transition-all duration-200 hover:bg-white/2"
          >
            Documentation
          </Link>
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
