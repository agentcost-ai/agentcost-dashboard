"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

export function CTASection() {
  return (
    <section className="relative py-20 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative text-center"
        >
          {/* Ambient glow behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 bg-sky-500/4 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-75 h-37.5 bg-indigo-500/3 rounded-full blur-[80px] pointer-events-none" />

          {/* Concentric rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-125 h-125 rounded-full border border-white/3" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-175 h-175 rounded-full border border-white/3" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-225 h-225 rounded-full border border-white/3" />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-275 h-275 rounded-full border border-white/3" />
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.1] mb-6">
              Stop guessing.
              <br />
              <span className="text-neutral-500">Start tracking.</span>
            </h2>

            <p className="text-neutral-500 text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
              Set up in under two minutes. Self-host on your infrastructure. No
              credit card, no vendor lock-in.
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth/register"
                onClick={() =>
                  track("click_signup", { location: "cta_section" })
                }
                className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium text-[#0a0a0b] bg-white hover:bg-neutral-100 rounded-xl transition-all duration-200 shadow-[0_1px_32px_rgba(255,255,255,0.08)]"
              >
                Create Free Account
                <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <a
                href="https://github.com/agentcost-ai/agentcost-sdk"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  track("github_clicked", { location: "cta_section" })
                }
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-7 py-3.5 text-sm font-medium text-neutral-400 hover:text-white border border-white/8 hover:border-white/15 rounded-xl transition-all duration-200 hover:bg-white/2"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Star on GitHub
              </a>
            </div>

            {/* Micro detail */}
            <p className="mt-8 text-xs text-neutral-700 font-mono tracking-wide">
              MIT License · Docker-ready · No telemetry
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
