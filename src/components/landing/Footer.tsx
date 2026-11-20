"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Copy, Grid2x2Plus, Printer } from "lucide-react";
import { track } from "@/lib/analytics";
import { comparisons } from "@/lib/comparisons";
import { AnnotatedArrow } from "./AnnotatedArrow";

/* ─────────────────────────────────────────────
   Footer — the site prints a receipt for your
   visit. A thermal slip feeds out of a printer
   slot when the footer scrolls in, itemising
   this tab's session (time here, pages viewed)
   at $0.00, with a barcode made from the visit
   id and a torn edge. "Print again" re-feeds it.
   Nothing is stored or sent: the session numbers
   live in sessionStorage in this tab only.
   ───────────────────────────────────────────── */

const columns: Array<{ title: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    title: "Product",
    links: [
      // Root-anchored so they work from /pricing, /blog, etc.
      { label: "Features", href: "/#features" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Integration", href: "/#integration" },
      { label: "Privacy by design", href: "/#privacy" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/auth/login" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Python SDK", href: "/docs/sdk" },
      { label: "TypeScript SDK", href: "/docs/typescript" },
      { label: "API Reference", href: "/docs/api" },
      { label: "MCP Server", href: "/docs/mcp" },
      // A raw file, not an app route. llms.txt is deliberately not listed:
      // agents probe it by convention; it stays linked from /docs and the 404.
      { label: "OpenAPI Spec", href: "/openapi.json", external: true },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Model Catalog", href: "/docs/models" },
      { label: "AI Agent Cost Calculator", href: "/ai-agent-cost-calculator" },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      // Generated so a new comparison page is linked site-wide the moment it
      // exists: no crawl-orphan pages.
      ...comparisons.map((c) => ({ label: `vs ${c.competitor}`, href: `/compare/${c.slug}` })),
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "GitHub", href: "https://github.com/agentcost-ai", external: true },
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Data & Privacy Docs", href: "/docs/privacy" },
    ],
  },
];

const INSTALLS = [
  { id: "pip", cmd: "pip install agentcost" },
  { id: "npm", cmd: "npm install @agentcost/sdk" },
] as const;

/* ── Session, kept in this tab only ──────────────────────────────────── */

interface Visit {
  id: string;
  start: number;
  pages: number;
}

const VISIT_KEY = "agentcost_footer_visit";

function readVisit(): Visit {
  const fresh: Visit = {
    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
    start: Date.now(),
    pages: 1,
  };
  try {
    const raw = sessionStorage.getItem(VISIT_KEY);
    const prev = raw ? (JSON.parse(raw) as Partial<Visit>) : null;
    const visit: Visit =
      prev && typeof prev.id === "string" && typeof prev.start === "number" && typeof prev.pages === "number"
        ? { id: prev.id, start: prev.start, pages: prev.pages + 1 }
        : fresh;
    sessionStorage.setItem(VISIT_KEY, JSON.stringify(visit));
    return visit;
  } catch {
    return fresh;
  }
}

/** Seconds since `start`, ticking once a second. */
function useElapsed(start: number | null) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (start === null) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [start]);
  return start === null || now === null ? null : Math.max(0, Math.floor((now - start) / 1000));
}

const pad = (n: number) => String(n).padStart(2, "0");
const mmss = (s: number) => (s >= 3600 ? `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}` : `${pad(Math.floor(s / 60))}:${pad(s % 60)}`);

/** Barcode bars from a string: same id, same barcode. */
function bars(seed: string): number[] {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out: number[] = [];
  for (let i = 0; i < 42; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    out.push(1 + ((h >>> 0) % 3));
  }
  return out;
}

/* ── Receipt ─────────────────────────────────────────────────────────── */

function Line({ k, v, strong }: { k: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-baseline gap-2 ${strong ? "font-bold" : ""}`}>
      <span className="shrink-0">{k}</span>
      <span aria-hidden className="mb-[3px] flex-1 border-b border-dotted border-neutral-900/30" />
      <span className="shrink-0 tabular-nums">{v}</span>
    </div>
  );
}

function Rule({ double }: { double?: boolean }) {
  return <div aria-hidden className={`my-2.5 border-t border-neutral-900/35 ${double ? "border-double border-t-[3px]" : "border-dashed"}`} />;
}

function Receipt() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });
  const reduced = useReducedMotion();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [printKey, setPrintKey] = useState(0);
  const elapsed = useElapsed(visit?.start ?? null);

  // Read after mount (sessionStorage is client-only); cancelled on unmount so
  // a development double-mount does not count the page twice.
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisit(readVisit()));
    return () => cancelAnimationFrame(id);
  }, []);

  const stamp = useMemo(() => {
    if (!visit) return { date: "", time: "" };
    const d = new Date(visit.start);
    return {
      date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
  }, [visit]);

  const code = useMemo(() => bars(visit?.id ?? "AGENTCOST"), [visit?.id]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[340px]">
      {/* Printer slot */}
      <div className="relative z-20 h-5 rounded-full border border-white/10 bg-gradient-to-b from-[#1b1b20] to-[#0d0d10] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-x-5 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-black" />
        <span className="absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]" aria-hidden />
      </div>

      {/* Paper, fed down from under the slot */}
      <div className="relative -mt-2.5 overflow-hidden px-3 pb-4">
        <motion.div
          key={printKey}
          initial={reduced ? false : { y: "-100%" }}
          animate={inView ? { y: "0%" } : undefined}
          transition={{ duration: 1.6, ease: "linear" }}
          className="relative"
        >
          <div
            className="relative bg-[#f4f1ea] px-5 pb-5 pt-6 font-mono text-[11.5px] leading-[1.55] text-neutral-900 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.7)]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(0,0,0,0.018) 0 1px, transparent 1px 3px)",
            }}
          >
            <div className="flex flex-col items-center text-center">
              <span className="flex items-center gap-1.5 text-[15px] font-bold tracking-tight">
                <Grid2x2Plus className="size-4" strokeWidth={2.4} aria-hidden />
                AGENTCOST
              </span>
              <span className="mt-0.5 text-[10.5px] uppercase tracking-[0.18em] text-neutral-600">
                LLM cost observability
              </span>
            </div>

            <Rule double />
            <Line k={`VISIT #${visit?.id ?? "------"}`} v={stamp.date || "--"} />
            <Line k="PRINTED" v={stamp.time || "--:--"} />
            <Rule />

            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-[0.14em] text-neutral-600">
              <span>Item</span>
              <span>Cost</span>
            </div>
            <Line k={`Time on site ${elapsed === null ? "--:--" : mmss(elapsed)}`} v="$0.00" />
            <Line k={`Pages viewed ×${visit?.pages ?? 1}`} v="$0.00" />
            <Line k="Models priced ×3,500+" v="$0.00" />
            <Line k="Prompts collected ×0" v="$0.00" />
            <Line k="Seats, tiers, limits" v="none" />
            <Rule />
            <Line k="SUBTOTAL" v="$0.00" />
            <Line k="PLAN" v="Free forever" />
            <Line k="LICENSE" v="MIT" />
            <Rule double />
            <div className="flex items-baseline justify-between text-[15px] font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">$0.00</span>
            </div>

            <div className="mt-4 flex h-11 items-stretch justify-center gap-[2px]" aria-hidden>
              {code.map((w, i) => (
                <span key={i} className={i % 2 ? "bg-transparent" : "bg-neutral-900"} style={{ width: w }} />
              ))}
            </div>
            <p className="mt-1.5 text-center text-[10px] tracking-[0.3em] text-neutral-600">
              AC-{visit?.id ?? "------"}
            </p>
            <p className="mt-3 text-center text-[10.5px] uppercase tracking-[0.12em]">
              * every token, accounted for *
            </p>
          </div>

          {/* Torn edge */}
          <div
            aria-hidden
            className="h-3 w-full"
            style={{
              background:
                "linear-gradient(-45deg, transparent 6px, #f4f1ea 0) 0 0 / 12px 12px repeat-x, linear-gradient(45deg, transparent 6px, #f4f1ea 0) 0 0 / 12px 12px repeat-x",
            }}
          />
        </motion.div>
      </div>

      <button
        type="button"
        onClick={() => setPrintKey((k) => k + 1)}
        className="mx-auto mt-1 flex items-center gap-1.5 rounded-full border border-white/8 px-3 py-1 text-[11px] text-neutral-500 transition-colors hover:border-white/20 hover:text-neutral-200"
      >
        <Printer className="size-3" aria-hidden />
        Print again
      </button>

      {inView && (
        <AnnotatedArrow
          label="your receipt for this visit"
          dir="right"
          delay={1.4}
          className="absolute -left-48 top-24 hidden -rotate-6 xl:flex"
        />
      )}
    </div>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────── */

export function Footer() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (id: string, cmd: string) => {
    navigator.clipboard?.writeText(cmd).then(
      () => {
        setCopied(id);
        track("sdk_install_started", { location: "footer", language: id === "pip" ? "python" : "typescript" });
        setTimeout(() => setCopied((c) => (c === id ? null : c)), 1800);
      },
      () => undefined,
    );
  };

  return (
    <footer className="relative overflow-hidden border-t border-white/6 bg-[#07070a]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/30 to-transparent"
      />
      <div className="mx-auto grid max-w-7xl gap-14 px-4 pb-10 pt-16 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16 lg:px-8">
        <div className="min-w-0">
          <h2 className="max-w-[16ch] text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-[2.6rem]">
            Every token, accounted for.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-6 text-neutral-400">
            Open-source LLM cost tracking for Python and TypeScript. Free in the cloud, or
            self-host the whole stack.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/auth/register"
              onClick={() => track("click_signup", { location: "footer" })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[14px] font-medium text-neutral-950 transition-colors hover:bg-neutral-200"
            >
              Start tracking free
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            {INSTALLS.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => copy(i.id, i.cmd)}
                aria-label={`Copy: ${i.cmd}`}
                className="group inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 font-mono text-[12.5px] text-neutral-300 transition-colors hover:border-white/20"
              >
                <span className="text-neutral-600">$</span>
                {i.cmd}
                {copied === i.id ? (
                  <Check className="size-3.5 text-emerald-400" aria-hidden />
                ) : (
                  <Copy className="size-3.5 text-neutral-600 group-hover:text-neutral-300" aria-hidden />
                )}
              </button>
            ))}
          </div>
          <span className="sr-only" role="status" aria-live="polite">
            {copied ? "Copied to clipboard" : ""}
          </span>

          <nav aria-label="Footer" className="mt-14 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-500">
                  {col.title}
                </p>
                <ul className="space-y-2.5">
                  {col.links.map((link) => {
                    const cls =
                      "group inline-flex items-center gap-1 text-[14px] text-neutral-400 transition-colors hover:text-white";
                    const arrow = (
                      <ArrowUpRight
                        className="size-3 -translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                        aria-hidden
                      />
                    );
                    return (
                      <li key={link.label}>
                        {link.external ? (
                          <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                            {link.label}
                            {arrow}
                          </a>
                        ) : (
                          <Link href={link.href} className={cls}>
                            {link.label}
                            {arrow}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <Receipt />
      </div>

      <div className="border-t border-white/6">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-[12px] text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span>© {new Date().getFullYear()} AgentCost</span>
            <span aria-hidden className="size-1 rounded-full bg-neutral-700" />
            <a
              href="https://github.com/agentcost-ai/agentcost-sdk/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-neutral-200"
            >
              MIT License
            </a>
            <span aria-hidden className="size-1 rounded-full bg-neutral-700" />
            <a
              href="https://github.com/agentcost-ai"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("github_clicked", { location: "footer" })}
              className="hover:text-neutral-200"
            >
              GitHub
            </a>
          </div>
          {/* Google Preferred Sources deeplink: a plain link, not Google's
              publisher.js button, so no third-party script runs on every page. */}
          <a
            href="https://www.google.com/preferences/source?q=agentcost.tech"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => track("preferred_source_clicked", { location: "footer" })}
            className="inline-flex w-fit items-center gap-1.5 hover:text-neutral-200"
          >
            <svg aria-hidden className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.5 5.8 21.2l1.6-7L2 9.5l7.1-.6z" />
            </svg>
            Add AgentCost as a preferred source on Google
          </a>
        </div>
      </div>
    </footer>
  );
}
