"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { cn, dayBucketDate } from "@/lib/utils";
import type { AgentSummary } from "@/lib/api";
import { seriesColor } from "@/lib/palette";
import { usd, Change } from "@/components/dashboard/OverviewPanels";

/* ─────────────────────────────────────────────
   Who spent it, day by day. One column per day,
   one block per agent, so the day the bill
   jumped shows which block grew. Point at a day
   for its breakdown, or at an agent to follow
   it across the window.
   ───────────────────────────────────────────── */

/** Agents past this fold into "Other" so the blocks stay tall enough to read. */
const MAX_SERIES = 8;

type Series = { name: string; href: string | null; color: string; total: number; change: number | null; byDay: number[] };

export function AgentDayStack({ agents }: { agents: AgentSummary[] }) {
  const [day, setDay] = useState<number | null>(null);
  const [agent, setAgent] = useState<number | null>(null);

  const { days, series, totals, max } = useMemo(() => {
    const keys = [...new Set(agents.flatMap((a) => a.daily.map((d) => d.day)))].sort();
    const ranked = [...agents].sort((a, b) => b.total_cost - a.total_cost);
    const costOn = (a: AgentSummary, key: string) => a.daily.find((d) => d.day === key)?.cost ?? 0;

    const rows: Series[] = ranked.slice(0, MAX_SERIES).map((a, i) => ({
      name: a.agent_name,
      href: `/agents/${encodeURIComponent(a.agent_name)}`,
      color: seriesColor(i),
      total: a.total_cost,
      change: a.cost_change_percent,
      byDay: keys.map((k) => costOn(a, k)),
    }));
    const rest = ranked.slice(MAX_SERIES);
    if (rest.length > 0) {
      rows.push({
        name: `Other (${rest.length})`,
        href: null,
        color: "#52525b",
        total: rest.reduce((s, a) => s + a.total_cost, 0),
        change: null,
        byDay: keys.map((k) => rest.reduce((s, a) => s + costOn(a, k), 0)),
      });
    }
    const dayTotals = keys.map((_, d) => rows.reduce((s, r) => s + r.byDay[d], 0));
    return { days: keys, series: rows, totals: dayTotals, max: Math.max(...dayTotals, 0) };
  }, [agents]);

  if (days.length === 0 || max === 0) {
    return <div className="flex h-60 items-center justify-center text-neutral-500">No daily data in this window</div>;
  }

  const peakDay = totals.indexOf(max);
  const shown = day ?? peakDay;
  const leader = series.reduce((best, s) => (s.byDay[shown] > best.byDay[shown] ? s : best), series[0]);

  return (
    <div>
      {/* Readout for the pointed-at day; the peak day until one is chosen */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="text-[12px] text-neutral-500">
            {format(dayBucketDate(days[shown]), "EEEE, MMM d")}
            {day === null && <span className="ml-2 rounded-full bg-white/6 px-2 py-0.5 text-[11px] text-neutral-300">peak day</span>}
          </p>
          <p className="mt-1 text-[1.9rem] font-light leading-none tracking-tight text-white tabular-nums">
            {usd(totals[shown])}
          </p>
        </div>
        <p className="text-right text-[12.5px] text-neutral-400">
          <span className="mr-1.5 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: leader.color }} />
          <span className="text-neutral-200">{leader.name}</span> led with {usd(leader.byDay[shown])}
          <span className="text-neutral-600"> · {((leader.byDay[shown] / totals[shown]) * 100).toFixed(0)}%</span>
        </p>
      </div>

      <div className="mt-6 flex h-52 items-end gap-2 sm:gap-3" onMouseLeave={() => setDay(null)}>
        {days.map((key, d) => {
          const lit = day === null || day === d;
          return (
            <div
              key={key}
              className="group flex h-full min-w-0 flex-1 flex-col justify-end"
              onMouseEnter={() => setDay(d)}
            >
              <div
                className={cn(
                  "flex flex-col-reverse gap-[3px] rounded-xl p-[3px] transition-[opacity,background-color] duration-150",
                  day === d ? "bg-white/6" : "bg-transparent",
                  !lit && "opacity-35",
                )}
                style={{ height: `${Math.max((totals[d] / max) * 100, 3)}%` }}
              >
                {series.map((s, i) =>
                  s.byDay[d] > 0 ? (
                    <span
                      key={s.name}
                      className="min-h-[3px] rounded-[5px] transition-opacity duration-150"
                      style={{
                        flexGrow: s.byDay[d],
                        flexBasis: 0,
                        backgroundColor: s.color,
                        opacity: agent === null || agent === i ? 1 : 0.18,
                        boxShadow: agent === i ? `0 0 14px ${s.color}aa` : undefined,
                      }}
                    />
                  ) : null,
                )}
              </div>
              <p
                className={cn(
                  "mt-2.5 truncate text-center text-[11px] tabular-nums transition-colors",
                  shown === d ? "text-neutral-200" : "text-neutral-600",
                )}
              >
                {format(dayBucketDate(key), "MMM d")}
              </p>
            </div>
          );
        })}
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-0.5 border-t border-white/6 pt-4 sm:grid-cols-2" onMouseLeave={() => setAgent(null)}>
        {series.map((s, i) => {
          const row = (
            <>
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-[3px]" style={{ backgroundColor: s.color }} aria-hidden />
                <span className="truncate text-[12.5px] text-neutral-200">{s.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-[12.5px] tabular-nums text-neutral-400">
                  {usd(day === null ? s.total : s.byDay[shown])}
                </span>
                {day === null && s.href && <Change percent={s.change} />}
              </span>
            </>
          );
          const className = cn(
            "flex items-center justify-between gap-3 rounded-lg px-2.5 py-1.5 transition-colors",
            agent === i ? "bg-white/5" : agent !== null && "opacity-50",
          );
          return (
            <li key={s.name} onMouseEnter={() => setAgent(i)}>
              {s.href ? (
                <Link href={s.href} className={className}>
                  {row}
                </Link>
              ) : (
                <div className={className}>{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
