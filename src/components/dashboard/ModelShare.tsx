"use client";

import { useMemo, useState } from "react";
import { cn, formatNumber } from "@/lib/utils";
import type { ModelStats } from "@/lib/api";
import { seriesColor } from "@/lib/palette";
import { usd } from "@/components/dashboard/OverviewPanels";

/* ─────────────────────────────────────────────
   Cost by model as a segmented ring inside a
   tick dial. Pointing at a segment or its row
   lifts it and moves its numbers to the centre.
   ───────────────────────────────────────────── */

const SIZE = 240;
const R = 86;
const STROKE = 16;
const CIRC = 2 * Math.PI * R;
const GAP = 5;
/** Past this many models the tail folds into "Other" so every slice stays legible. */
const MAX_SLICES = 6;

type Slice = { model: string; cost: number; calls: number; share: number; color: string };

export function ModelShare({ data }: { data: ModelStats[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const { slices, total } = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.total_cost - a.total_cost);
    const head = sorted.slice(0, MAX_SLICES);
    const tail = sorted.slice(MAX_SLICES);
    const rows = head.map((m) => ({ model: m.model, cost: m.total_cost, calls: m.total_calls }));
    if (tail.length > 0) {
      rows.push({
        model: `Other (${tail.length})`,
        cost: tail.reduce((s, m) => s + m.total_cost, 0),
        calls: tail.reduce((s, m) => s + m.total_calls, 0),
      });
    }
    const sum = rows.reduce((s, r) => s + r.cost, 0);
    return {
      total: sum,
      slices: rows.map<Slice>((r, i) => ({
        ...r,
        share: sum > 0 ? r.cost / sum : 0,
        color: seriesColor(i),
      })),
    };
  }, [data]);

  const active = hovered !== null ? slices[hovered] : null;
  // Start offsets, accumulated along the ring.
  const offsets = slices.map((_, i) => slices.slice(0, i).reduce((s, x) => s + x.share * CIRC, 0));

  return (
    <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" role="img" aria-label="Cost share by model">
          {/* Dial: fine ticks, heavier every tenth of the ring */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R + 22}
            fill="none"
            stroke="rgba(255,255,255,0.13)"
            strokeWidth={5}
            strokeDasharray={`1 ${(2 * Math.PI * (R + 22)) / 100 - 1}`}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R + 22}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={9}
            strokeDasharray={`1.5 ${(2 * Math.PI * (R + 22)) / 10 - 1.5}`}
          />
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={STROKE} />

          {slices.map((s, i) => {
            const length = Math.max(s.share * CIRC - GAP, 1.5);
            const lifted = hovered === i;
            return (
              <circle
                key={s.model}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={lifted ? STROKE + 6 : STROKE}
                strokeDasharray={`${length} ${CIRC - length}`}
                strokeDashoffset={-(offsets[i] + GAP / 2)}
                opacity={hovered === null || lifted ? 1 : 0.28}
                style={{
                  filter: `drop-shadow(0 0 ${lifted ? 10 : 5}px ${s.color}${lifted ? "cc" : "66"})`,
                  transition: "stroke-width 180ms ease-out, opacity 180ms ease-out",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="max-w-[8.5rem] truncate font-mono text-[11px] text-neutral-500">
            {active ? active.model : "all models"}
          </p>
          <p className="mt-1 text-[1.65rem] font-light leading-none tracking-tight text-white tabular-nums">
            {usd(active ? active.cost : total)}
          </p>
          <p className="mt-1.5 text-[11.5px] tabular-nums text-neutral-500">
            {active ? `${(active.share * 100).toFixed(1)}% of spend` : `${slices.length} in use`}
          </p>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1">
        {slices.map((s, i) => (
          <li
            key={s.model}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={cn(
              "rounded-xl px-3 py-2.5 transition-colors duration-150",
              hovered === i ? "bg-white/5" : hovered !== null && "opacity-50",
            )}
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color, boxShadow: `0 0 8px ${s.color}` }}
                  aria-hidden
                />
                <span className="truncate font-mono text-[12.5px] text-neutral-200">{s.model}</span>
              </span>
              <span className="shrink-0 text-[13px] font-medium tabular-nums text-white">{usd(s.cost)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3 pl-[18px]">
              <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/6">
                <span
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${s.share * 100}%`, backgroundColor: s.color }}
                />
              </span>
              <span className="shrink-0 whitespace-nowrap text-right text-[11px] tabular-nums text-neutral-500">
                {(s.share * 100).toFixed(1)}% · {formatNumber(s.calls)} calls
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
