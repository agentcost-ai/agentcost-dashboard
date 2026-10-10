"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { trackDemo } from "@/lib/demo/demo";
import { track } from "@/lib/analytics";
import { prewarmBackend } from "@/lib/prewarm";
import { DEMO_SIGNUP_PROMPT_EVENT } from "@/lib/demo/demoApi";
import { demoOptimizationSummary } from "@/lib/demo/demoData";
import { DemoTour, DEMO_TOUR_START_EVENT, isDemoTourActive } from "@/components/demo/DemoTour";

const BAR_PRIMARY =
  "inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[13px] font-medium text-[#0a0a0b] transition-colors hover:bg-neutral-200 sm:min-h-10";

const MODAL_PRIMARY =
  "inline-flex items-center rounded-full bg-white px-6 py-3 text-[13.5px] font-medium text-[#0a0a0b] transition-colors hover:bg-neutral-200";

/**
 * Everything the demo visitor sees on top of the normal dashboard:
 *
 * - A guided walkthrough (DemoTour) that opens on arrival, so nobody is
 *   left alone on a full dashboard.
 * - A floating banner that labels the data as a demo and keeps a signup CTA
 *   one click away on every page.
 * - A conversion modal that opens when the visitor tries any write action
 *   (blocked by demoApi) or after they've explored a few pages — the two
 *   highest-intent moments to ask for the signup.
 *
 * Mounted once in the dashboard layout; renders nothing outside demo mode.
 */
export function DemoExperience() {
  const { isDemo, exitDemo, hasParkedSession } = useAuth();
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
      count: summary.suggestion_count,
    };
  }, []);

  // Track page views; after the 4th distinct page, nudge once per session.
  useEffect(() => {
    if (!isDemo || !pathname) return;
    if (!visitedPages.current.has(pathname)) {
      visitedPages.current.add(pathname);
      trackDemo("page_view", { page: pathname });

      const nudged = sessionStorage.getItem("agentcost_demo_nudged");
      // The tour moves through pages itself; that is not exploring.
      if (visitedPages.current.size >= 4 && !nudged && !isDemoTourActive()) {
        sessionStorage.setItem("agentcost_demo_nudged", "true");
        // Defer one tick so we don't setState synchronously inside the effect.
        setTimeout(() => {
          setModalAction(null);
          setModalOpen(true);
        }, 0);
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

  const handleSignupClick = useCallback(
    (location: "demo_banner" | "demo_modal") => {
      trackDemo("signup_click", { page: pathname ?? undefined });
      // GA4 sees this too — the backend demo tracker alone left the GA
      // funnel blind to demo conversions.
      track("click_signup", { location });
      // Strongest intent signal — make sure the backend is hot before the
      // register page makes its first real API call.
      prewarmBackend(true);
    },
    [pathname],
  );

  if (!isDemo) return null;

  return (
    <>
      <DemoTour hasParkedSession={hasParkedSession} />

      {/* ── Floating demo bar (persistent: the signup route must never
          hide; the dashboard layout reserves bottom padding for it) ── */}
      <div className="fixed bottom-5 left-1/2 z-40 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 print:hidden">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-[26px] border border-white/10 bg-[#0c0c0f]/95 py-2 pl-6 pr-2 shadow-[0_18px_50px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <p className="text-[13px] text-neutral-400">
            <span className="text-white">Sample data</span>
            <span className="hidden sm:inline"> from NovaDesk, a made-up company</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(DEMO_TOUR_START_EVENT))}
              className="text-[13px] text-neutral-400 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              Replay tour
            </button>
            {!hasParkedSession && (
              <button
                type="button"
                onClick={exitDemo}
                className="text-[13px] text-neutral-400 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                Exit
              </button>
            )}
            {hasParkedSession ? (
              <button type="button" onClick={exitDemo} className={BAR_PRIMARY}>
                Back to my dashboard
              </button>
            ) : (
              <Link
                href="/auth/register?from=demo"
                onClick={() => handleSignupClick("demo_banner")}
                className={BAR_PRIMARY}
              >
                Start free
              </Link>
            )}
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
            aria-labelledby="demo-signup-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-[#050507]/75 backdrop-blur-[3px]"
              onClick={() => setModalOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative max-h-full w-full max-w-[31rem] overflow-y-auto rounded-[22px] border border-white/10 bg-[#0c0c0f] px-8 pb-7 pt-8 shadow-[0_32px_80px_rgba(0,0,0,0.7)] sm:px-10 sm:pb-8 sm:pt-9"
            >
              <div className="flex items-baseline justify-between gap-6">
                <p className="text-[12px] text-neutral-500">NovaDesk, sample data</p>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-[12px] text-neutral-500 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Close
                </button>
              </div>

              {/* The number the visitor has just been looking at, set as the
                  headline rather than a badge. */}
              <p className="mt-8 font-display text-[3.4rem] font-normal leading-none tracking-[-0.02em] text-white tabular-nums sm:text-[4rem]">
                ${savings.monthly.toLocaleString()}
                <span className="ml-2 font-sans text-[15px] tracking-normal text-neutral-500">a month</span>
              </p>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-400">
                is what NovaDesk could stop spending: {savings.percent}% of its
                bill, from {savings.count} changes.
              </p>

              <h2
                id="demo-signup-title"
                className="mt-9 font-display text-[1.75rem] font-normal leading-[1.15] tracking-[-0.01em] text-white"
              >
                {modalAction ? `To ${modalAction}, bring your own data.` : "Now find it in yours."}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-neutral-400">
                {modalAction
                  ? "The demo is read-only. On your own project this is one click, and connecting takes two lines of Python."
                  : "Connect your agents with two lines of Python, or paste an OpenAI or Anthropic admin key and see your last 30 days in about a minute."}
              </p>

              <dl className="mt-7 divide-y divide-white/8 border-y border-white/8 text-[13px]">
                {[
                  ["To integrate", "two lines of Python"],
                  ["Models priced", "3,500+"],
                  ["Cost", "free cloud, MIT if you self-host"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-6 py-2.5">
                    <dt className="text-neutral-500">{label}</dt>
                    <dd className="text-right text-neutral-200">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-[13px] text-neutral-500 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Keep exploring
                </button>
                {hasParkedSession ? (
                  <button type="button" onClick={exitDemo} className={MODAL_PRIMARY}>
                    Back to my dashboard
                  </button>
                ) : (
                  <Link
                    href="/auth/register?from=demo"
                    onClick={() => handleSignupClick("demo_modal")}
                    className={MODAL_PRIMARY}
                  >
                    Start free
                  </Link>
                )}
              </div>
              {!hasParkedSession && (
                <p className="mt-4 text-right text-[11.5px] text-neutral-600">No credit card.</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
