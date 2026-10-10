"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/**
 * Guided walkthrough of the demo workspace.
 *
 * A visitor arriving from the landing page used to land on a full dashboard
 * with no idea where to look. The tour dims and blurs everything except one
 * region at a time and explains it, following the question the landing page
 * asks: the bill went up, which agent did it?
 *
 * Progress lives in sessionStorage so it survives the full-page navigation
 * out of /demo and a refresh, and so a finished or skipped tour stays quiet
 * for the rest of the tab's life. The demo banner can restart it.
 */

const STORAGE_KEY = "agentcost_demo_tour";
export const DEMO_TOUR_START_EVENT = "agentcost_demo_tour_start";

type Step = {
  /** Route the step lives on. Omitted for the opening and closing cards. */
  path?: string;
  /** Element id of the region to spotlight. */
  target?: string;
  /** One word for the stop, shown on the route strip. */
  label: string;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    label: "Start",
    title: "NovaDesk's AI bill went up. Find out why.",
    body: "This is sample data from NovaDesk, a fictional AI support company running seven agents. Five stops show how AgentCost answers the question.",
  },
  {
    path: "/dashboard",
    target: "tour-spend",
    label: "Total",
    title: "Start with the total",
    body: "What the period cost, the change against the previous window, and the monthly run rate. A total tells you the bill moved. It does not tell you who moved it.",
  },
  {
    path: "/agents",
    target: "tour-agents",
    label: "Agents",
    title: "Every agent, ranked by spend",
    body: "Each row shows the change against the previous window and one computed signal, such as a retry loop or a classifier running on an expensive model. This is where a spike gets a name.",
  },
  {
    path: "/workflows",
    target: "tour-run-cost",
    label: "Runs",
    title: "What a single run really costs",
    body: "An average hides the runs worth finding. This chart shows the full spread and calls out the most expensive 5% of runs and their share of spend.",
  },
  {
    path: "/guardrails",
    target: "tour-guardrails",
    label: "Limits",
    title: "Did each agent stay inside its limits?",
    body: "Declare which tools and models an agent may use and what one run may cost. Breaches come first, with the tool, model or run that crossed the line.",
  },
  {
    path: "/optimizations",
    target: "tour-savings",
    label: "Fixes",
    title: "What to change, and what it saves",
    body: "Recommendations come from patterns in the usage itself, such as a simple task running on an expensive model, each with an estimated monthly saving.",
  },
  {
    label: "Done",
    title: "That is the whole loop.",
    body: "A total, the agent behind it, what a run costs, whether it stayed in bounds, and what to change. Yours takes two lines of Python.",
  },
];

const LAST = STEPS.length - 1;
/** The spotlight stops, without the opening and closing cards. */
const STOPS = STEPS.slice(1, LAST);
/** Clearance for the sticky mobile top bar plus breathing room. */
const TOP_OFFSET = 88;
const PAD = 8;
const CARD_WIDTH = 440;
/** Space kept free under the spotlight so the card always fits. */
const CARD_RESERVE = 330;

const PRIMARY =
  "inline-flex items-center rounded-full bg-white px-6 py-3 text-[13.5px] font-medium text-[#0a0a0b] transition-colors hover:bg-neutral-200";

type Box = { top: number; left: number; width: number; height: number; vw: number; vh: number };

function readStoredStep(): number | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored === null) return 0;
  const parsed = Number.parseInt(stored, 10);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= LAST ? parsed : null;
}

/** True until the tour has been finished or skipped in this tab. */
export function isDemoTourActive(): boolean {
  return readStoredStep() !== null;
}

function sameBox(a: Box | null, b: Box | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.top === b.top && a.left === b.left && a.width === b.width &&
    a.height === b.height && a.vw === b.vw && a.vh === b.vh
  );
}

export function DemoTour({ hasParkedSession }: { hasParkedSession: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  // Lazy init keeps sessionStorage out of SSR; this only mounts in demo mode,
  // after the client-side auth check.
  const [step, setStep] = useState<number | null>(readStoredStep);
  const [measured, setMeasured] = useState<{ step: number; box: Box | null } | null>(null);
  const [fallback, setFallback] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const current = step === null ? null : STEPS[step];
  const onRoute = !current?.path || pathname === current.path;
  const box = measured && measured.step === step && onRoute ? measured.box : null;

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, step === null ? "done" : String(step));
  }, [step]);

  // Restart from the demo banner.
  useEffect(() => {
    const restart = () => {
      track("demo_tour", { action: "restart" });
      setStep(0);
    };
    window.addEventListener(DEMO_TOUR_START_EVENT, restart);
    return () => window.removeEventListener(DEMO_TOUR_START_EVENT, restart);
  }, []);

  // If a step's region has not shown up after a moment, show the card anyway.
  useEffect(() => {
    if (step === null) return;
    const timer = window.setTimeout(() => setFallback(step), 1800);
    return () => window.clearTimeout(timer);
  }, [step]);

  // The page behind the tour holds still: the tour does the scrolling.
  useEffect(() => {
    if (step === null) return;
    const hold = (e: Event) => e.preventDefault();
    window.addEventListener("wheel", hold, { passive: false });
    window.addEventListener("touchmove", hold, { passive: false });
    return () => {
      window.removeEventListener("wheel", hold);
      window.removeEventListener("touchmove", hold);
    };
  }, [step]);

  // Each step owns a route.
  useEffect(() => {
    if (current?.path && pathname !== current.path) router.push(current.path);
  }, [current, pathname, router]);

  // Follow the target. Pages fetch their data after mount, so the region may
  // not exist yet and can move as content above it loads: poll rather than
  // measure once.
  useEffect(() => {
    if (step === null || !current?.target || !onRoute) return;
    const target = current.target;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scrolled = false;

    const measure = () => {
      const el = document.getElementById(target);
      const r = el?.getBoundingClientRect();
      let next: Box | null = null;
      if (r && r.width > 0 && r.height > 0) {
        if (!scrolled) {
          scrolled = true;
          window.scrollTo({
            top: window.scrollY + r.top - TOP_OFFSET,
            behavior: smooth ? "smooth" : "auto",
          });
        }
        next = {
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
          vw: window.innerWidth,
          vh: window.innerHeight,
        };
      }
      setMeasured((prev) =>
        prev && prev.step === step && sameBox(prev.box, next) ? prev : { step, box: next },
      );
    };

    const timer = window.setInterval(measure, 120);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
    };
  }, [step, current, onRoute]);

  const close = useCallback(
    (action: "skip" | "finish") => {
      track("demo_tour", { action, step: step ?? -1 });
      setStep(null);
    },
    [step],
  );

  const go = useCallback(
    (delta: 1 | -1) => {
      if (step === null) return;
      const next = step + delta;
      if (next < 0) return;
      if (next > LAST) return close("finish");
      track("demo_tour", { action: "step", step: next });
      // The closing card is itself the signup ask; don't follow it with the
      // explored-a-few-pages nudge (see DemoExperience).
      if (next === LAST) sessionStorage.setItem("agentcost_demo_nudged", "true");
      setStep(next);
    },
    [step, close],
  );

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(step === LAST ? "finish" : "skip");
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, close, go]);

  if (step === null || !current) return null;

  // Spotlight: the target padded, kept on screen, and capped in height so a
  // long table still leaves room for the card underneath.
  let hole: { top: number; left: number; width: number; height: number } | null = null;
  let cardStyle: React.CSSProperties | undefined;
  if (box) {
    const top = Math.max(box.top - PAD, 8);
    const maxHeight = Math.max(140, box.vh - top - CARD_RESERVE);
    const bottom = Math.min(box.top + box.height + PAD, top + maxHeight, box.vh - 8);
    const left = Math.max(box.left - PAD, 8);
    const right = Math.min(box.left + box.width + PAD, box.vw - 8);
    if (bottom > top && right > left) {
      hole = { top, left, width: right - left, height: bottom - top };
      const width = Math.min(CARD_WIDTH, box.vw - 32);
      cardStyle = {
        position: "fixed",
        width,
        // Under the spotlight; on a very short viewport it rides up over it
        // rather than falling off the bottom edge.
        top: Math.max(8, Math.min(bottom + 16, box.vh - CARD_RESERVE)),
        left: Math.min(Math.max(left, 16), box.vw - width - 16),
      };
    }
  }

  const shade = "fixed bg-[#050507]/75 backdrop-blur-[3px]";
  const isIntro = step === 0;
  const isEnd = step === LAST;
  // A spotlight step waits for its region so the card does not appear in the
  // middle of the screen and then jump; the fallback covers a region that
  // never renders.
  const showCard = !current.target || hole !== null || fallback === step;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="demo-tour-title" className="print:hidden">
      {hole ? (
        <>
          <div className={`${shade} inset-x-0 top-0 z-60`} style={{ height: hole.top }} />
          <div className={`${shade} inset-x-0 bottom-0 z-60`} style={{ top: hole.top + hole.height }} />
          <div
            className={`${shade} left-0 z-60`}
            style={{ top: hole.top, height: hole.height, width: hole.left }}
          />
          <div
            className={`${shade} right-0 z-60`}
            style={{ top: hole.top, height: hole.height, left: hole.left + hole.width }}
          />
          {/* The lit region is for reading: clicks would navigate away from
              the step the card is describing. */}
          <div
            className="fixed z-60 rounded-2xl ring-1 ring-white/45"
            style={{ top: hole.top, left: hole.left, width: hole.width, height: hole.height }}
          />
        </>
      ) : (
        <div className={`${shade} inset-0 z-60`} />
      )}

      {showCard && (
        <div
          className={
            hole
              ? "z-61"
              : "fixed left-1/2 top-1/2 z-61 w-[calc(100%-2rem)] max-w-[33rem] -translate-x-1/2 -translate-y-1/2"
          }
          style={hole ? cardStyle : undefined}
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduced ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "rounded-[22px] border border-white/10 bg-[#0c0c0f] shadow-[0_32px_80px_rgba(0,0,0,0.7)]",
              isIntro || isEnd ? "px-8 pb-7 pt-8 sm:px-10 sm:pb-8 sm:pt-10" : "px-7 pb-6 pt-6",
            )}
          >
            {/* Where you are, in words: the route is the progress bar */}
            <div className="flex items-baseline justify-between gap-6">
              <ol className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12px]">
                {STOPS.map((stop, i) => {
                  const here = !isIntro && !isEnd && i === step - 1;
                  const passed = isEnd || (!isIntro && i < step - 1);
                  return (
                    <li
                      key={stop.label}
                      aria-current={here ? "step" : undefined}
                      className={cn(
                        "transition-colors",
                        here ? "text-white" : passed ? "text-neutral-400" : "text-neutral-600",
                      )}
                    >
                      <span className={cn("mr-1.5 font-mono text-[10.5px]", here ? "text-neutral-400" : "text-neutral-700")}>
                        {i + 1}
                      </span>
                      {stop.label}
                    </li>
                  );
                })}
              </ol>
              <button
                type="button"
                onClick={() => close(isEnd ? "finish" : "skip")}
                className="shrink-0 text-[12px] text-neutral-500 underline-offset-4 transition-colors hover:text-white hover:underline"
              >
                {isEnd ? "Close" : "Skip"}
              </button>
            </div>

            <h2
              id="demo-tour-title"
              className={cn(
                "font-display font-normal tracking-[-0.01em] text-white",
                isIntro || isEnd
                  ? "mt-9 text-[2.25rem] leading-[1.08] sm:text-[2.6rem]"
                  : "mt-6 text-[1.75rem] leading-[1.15]",
              )}
            >
              {current.title}
            </h2>
            <p
              className={cn(
                "leading-relaxed text-neutral-400",
                isIntro || isEnd ? "mt-4 max-w-[40ch] text-[15px]" : "mt-3 text-[14px]",
              )}
            >
              {current.body}
            </p>

            <div className={cn("flex items-center justify-between gap-4", isIntro || isEnd ? "mt-10" : "mt-7")}>
              {isIntro ? (
                <span className="font-handwriting -rotate-2 text-[20px] leading-none text-neutral-400">
                  takes about a minute
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="text-[13px] text-neutral-500 underline-offset-4 transition-colors hover:text-white hover:underline"
                >
                  Back
                </button>
              )}

              <div className="flex items-center gap-5">
                {isEnd ? (
                  <>
                    {!hasParkedSession && (
                      <button
                        type="button"
                        onClick={() => close("finish")}
                        className="text-[13px] text-neutral-400 underline-offset-4 transition-colors hover:text-white hover:underline"
                      >
                        Keep exploring
                      </button>
                    )}
                    {hasParkedSession ? (
                      <button type="button" onClick={() => close("finish")} className={PRIMARY}>
                        Keep exploring
                      </button>
                    ) : (
                      <Link
                        href="/auth/register?from=demo"
                        onClick={() => track("click_signup", { location: "demo_tour" })}
                        className={PRIMARY}
                      >
                        Start free
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    <span className="hidden text-[12px] text-neutral-600 sm:inline" aria-hidden>
                      or press →
                    </span>
                    <button key={step} type="button" autoFocus onClick={() => go(1)} className={PRIMARY}>
                      {isIntro ? "Show me" : step === LAST - 1 ? "Finish" : "Next"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
