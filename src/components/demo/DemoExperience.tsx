"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  ArrowRight,
  LogOut,
  TrendingDown,
  Github,
  Terminal,
  Layers,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { trackDemo } from "@/lib/demo/demo";
import { prewarmBackend } from "@/lib/prewarm";
import { DEMO_SIGNUP_PROMPT_EVENT } from "@/lib/demo/demoApi";
import { demoOptimizationSummary } from "@/lib/demo/demoData";

/**
 * Everything the demo visitor sees on top of the normal dashboard:
 *
 * - A floating banner that labels the data as a demo and keeps a signup CTA
 *   one click away on every page.
 * - A conversion modal that opens when the visitor tries any write action
 *   (blocked by demoApi) or after they've explored a few pages — the two
 *   highest-intent moments to ask for the signup.
 *
 * Mounted once in the dashboard layout; renders nothing outside demo mode.
 */
export function DemoExperience() {
  const { isDemo, logout } = useAuth();
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<string | null>(null);
  const visitedPages = useRef(new Set<string>());

  // The savings number shown in the modal comes from the same dataset the
  // visitor has been looking at — specific beats generic.
  const savings = useMemo(() => {
    const summary = demoOptimizationSummary();
    return {
      monthly: Math.round(summary.total_potential_savings_monthly),
      percent: Math.round(summary.total_potential_savings_percent),
    };
  }, []);

  // Track page views; after the 4th distinct page, nudge once per session.
  useEffect(() => {
    if (!isDemo || !pathname) return;
    if (!visitedPages.current.has(pathname)) {
      visitedPages.current.add(pathname);
      trackDemo("page_view", { page: pathname });

      const nudged = sessionStorage.getItem("agentcost_demo_nudged");
      if (visitedPages.current.size >= 4 && !nudged) {
        sessionStorage.setItem("agentcost_demo_nudged", "true");
        setModalAction(null);
        setModalOpen(true);
      }
    }
  }, [isDemo, pathname]);

  // Open the conversion modal whenever demoApi blocks a write.
  useEffect(() => {
    if (!isDemo) return;
    const handler = (event: globalThis.Event) => {
      const detail = (event as CustomEvent<{ action?: string }>).detail;
      setModalAction(detail?.action ?? null);
      setModalOpen(true);
    };
    window.addEventListener(DEMO_SIGNUP_PROMPT_EVENT, handler);
    return () => window.removeEventListener(DEMO_SIGNUP_PROMPT_EVENT, handler);
  }, [isDemo]);

  // Close on Escape.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const handleSignupClick = useCallback(() => {
    trackDemo("signup_click", { page: pathname ?? undefined });
    // Strongest intent signal — make sure the backend is hot before the
    // register page makes its first real API call.
    prewarmBackend(true);
  }, [pathname]);

  if (!isDemo) return null;

  return (
    <>
      {/* ── Floating demo banner ── */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 rounded-2xl border border-sky-500/25 bg-[#0d1420]/95 backdrop-blur-md shadow-[0_8px_40px_rgba(2,132,199,0.18)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <p className="text-[13px] text-neutral-300 truncate">
              You&apos;re exploring{" "}
              <span className="text-white font-medium">sample data</span> — this
              could be your AI spend.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/auth/register?from=demo"
              onClick={handleSignupClick}
              className="group inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-[#0a0a0b] bg-white hover:bg-neutral-100 rounded-full transition-colors"
            >
              Create free account
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              title="Exit demo"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] text-neutral-500 hover:text-white rounded-full border border-white/8 hover:border-white/15 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Exit
            </button>
          </div>
        </div>
      </div>

      {/* ── Conversion modal ── */}
      <AnimatePresence>
        {modalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-105 overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c10] shadow-[0_24px_80px_rgba(0,0,0,0.6)]"
            >
              {/* Aurora header */}
              <div className="relative px-8 pt-9 pb-7 overflow-hidden">
                <div
                  className="absolute inset-0 pointer-events-none"
                  aria-hidden
                >
                  <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-105 h-55 bg-sky-500/15 rounded-full blur-[80px]" />
                  <div className="absolute -top-12 right-0 w-55 h-40 bg-indigo-500/10 rounded-full blur-[70px]" />
                  <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                      backgroundImage:
                        "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                      backgroundSize: "22px 22px",
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Close"
                  className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 rounded-full border border-emerald-500/20 bg-emerald-500/8">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11.5px] font-medium text-emerald-300 tracking-wide">
                      Found in this demo
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2.5 mb-1.5">
                    <span className="text-[2.6rem] leading-none font-bold tracking-tight text-white tabular-nums">
                      ${savings.monthly.toLocaleString()}
                    </span>
                    <span className="text-sm text-neutral-400 font-medium">
                      /month in savings
                    </span>
                  </div>
                  <p className="text-[13px] text-neutral-500">
                    {savings.percent}% of NovaDesk&apos;s LLM spend, recovered
                    by four changes.
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className="px-8 pb-8 pt-6 border-t border-white/6">
                <h2 className="text-lg font-semibold text-white tracking-tight mb-1.5">
                  {modalAction
                    ? `Ready to ${modalAction}?`
                    : "Now see what's hiding in your spend."}
                </h2>
                <p className="text-[13.5px] text-neutral-400 leading-relaxed mb-6">
                  {modalAction
                    ? "The demo is read-only. On your own data, this takes one click — and connecting takes two lines of Python."
                    : "Connect your agents with two lines of Python and this dashboard fills with your real costs, live."}
                </p>

                {/* Proof chips */}
                <div className="grid grid-cols-3 gap-2 mb-7">
                  {[
                    { icon: Terminal, top: "2 lines", bottom: "to integrate" },
                    { icon: Layers, top: "2,900+", bottom: "models tracked" },
                    { icon: Github, top: "MIT", bottom: "open source" },
                  ].map(({ icon: Icon, top, bottom }) => (
                    <div
                      key={top}
                      className="flex flex-col items-center gap-1 rounded-xl border border-white/6 bg-white/2 px-2 py-3"
                    >
                      <Icon className="w-4 h-4 text-neutral-500 mb-0.5" />
                      <span className="text-[13px] font-semibold text-white leading-none">
                        {top}
                      </span>
                      <span className="text-[10.5px] text-neutral-500 leading-none">
                        {bottom}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/auth/register?from=demo"
                  onClick={handleSignupClick}
                  className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#0a0a0b] bg-white hover:bg-neutral-100 rounded-2xl transition-all duration-200 shadow-[0_1px_24px_rgba(255,255,255,0.12)]"
                >
                  Start tracking free
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[11.5px] text-neutral-600">
                    No credit card · Self-host forever
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="text-[12px] text-neutral-500 hover:text-neutral-300 transition-colors underline-offset-4 hover:underline"
                  >
                    Keep exploring
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
