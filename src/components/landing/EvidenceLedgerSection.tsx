import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    line: "The overnight bill that became AgentCost. Spend down 44% two weeks after we could see per-agent cost.",
    source: "Read the story",
    href: "https://dev.to/kushagra125/launching-agentcost-14lf",
  },
  {
    who: "Microsoft — Copilot",
    figure: <span className="text-white">−$20 / user / mo</span>,
    line: "Reported losses under flat pricing, with some users costing $80 a month, until the WSJ ran the numbers.",
    source: "The Register",
    href: "https://www.theregister.com/2023/10/11/github_ai_copilot_microsoft/",
    external: true,
  },
  {
    who: "Uber — engineering",
    figure: <span className="text-white">Built a gateway</span>,
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
    figure: <span className="text-white">90% under $30 / day</span>,
    line: "The average looks safe. The overruns live in the tail an average never shows.",
    source: "Weilliptic",
    href: "https://weilliptic.ai/blog/ai-coding-spend-governance-a-framework-for-engineering-and-finance-leaders/",
    external: true,
  },
];

/* ─────────────────────────────────────────────
   Evidence ledger: five sourced rows, set as a
   literal ledger — one row per source, hairline
   rules, no boxes.
   ───────────────────────────────────────────── */
export function EvidenceLedgerSection() {
  return (
    <section className="py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">
            The blind spot, on the record
          </p>
          <span className="hidden font-mono text-[11px] text-neutral-600 sm:block">
            every figure sourced
          </span>
        </div>

        <div className="mt-8 border-t border-white/6">
          {LEDGER.map((row) => (
            <a
              key={row.who}
              href={row.href}
              rel={row.external ? "noopener nofollow" : "noopener"}
              target={row.external ? "_blank" : undefined}
              className="group grid gap-x-8 gap-y-1.5 border-b border-white/6 py-5 sm:grid-cols-[176px_240px_minmax(0,1fr)_auto] sm:items-baseline"
            >
              <span className={cn("text-[12.5px]", row.ours ? "text-sky-300" : "text-neutral-500")}>
                {row.who}
              </span>
              <span className="text-[22px] font-semibold leading-none tracking-tight tabular-nums">
                {row.figure}
              </span>
              <span className="text-[14px] leading-snug text-neutral-400">{row.line}</span>
              <span className="inline-flex items-center gap-1 text-[12px] text-neutral-500 transition-colors group-hover:text-white sm:justify-self-end">
                {row.source}
                <ArrowUpRight
                  className="size-3 transition-transform duration-200 group-hover:translate-x-px group-hover:-translate-y-px"
                  aria-hidden
                />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
