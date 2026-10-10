"use client";

import { useMemo, useState } from "react";
import { cn, formatNumber } from "@/lib/utils";
import type { RunCostDistribution as Distribution } from "@/lib/api";
import { ACCENT_SOFT } from "@/lib/palette";

/**
 * Two tones, both doing a job: lavender for the body of the distribution and
 * red for the tail. The tail is also labelled and marked underneath, so the
 * split never rests on colour alone.
 */
const BODY = ACCENT_SOFT;
const TAIL = "#fca5a5";

/** Costs here run from cents to fractions of a cent, so no fixed precision works. */
function formatCost(value: number): string {
  if (value === 0) return "$0";
  if (value >= 100) return `$${value.toFixed(0)}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  if (value >= 0.0001) return `$${value.toFixed(5)}`;
  return `$${value.toExponential(1)}`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11.5px] text-neutral-500">{label}</p>
      <p className="mt-1 text-[1.35rem] font-light leading-none tracking-tight text-white tabular-nums">
        {value}
      </p>
    </div>
  );
}

export function RunCostDistribution({
  data,
  workflows,
  selected,
  onSelect,
}: {
  data: Distribution | null;
  workflows: string[];
  selected: string | null;
  onSelect: (workflow: string) => void;
}) {
  const [showTable, setShowTable] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const buckets = useMemo(() => data?.histogram ?? [], [data]);
  if (!data || buckets.length === 0) return null;

  const spread = data.tail_ratio;
  const peakCount = Math.max(...buckets.map((b) => b.count), 1);
  const medianIndex = buckets.reduce(
    (best, b, i) =>
      Math.abs(b.lower - data.p50) < Math.abs(buckets[best].lower - data.p50) ? i : best,
    0,
  );
  const firstTail = buckets.findIndex((b) => b.is_tail);
  // Five labels, each read off the band standing above it: the bands are not
  // equally wide (the last one holds the whole tail), so interpolating between
  // the ends would mislabel the middle.
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(
    (f) => buckets[Math.round(f * (buckets.length - 1))].lower,
  );

  return (
    <div>
      {/* Header + workflow picker */}
      <div className="flex flex-col gap-3 border-b border-white/6 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h3 className="text-[1.35rem] font-light tracking-tight text-white">
            What one run actually costs
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Every run in the window, not just the average. The average is the
            statistic that hides the runs worth finding.
          </p>
        </div>
        {workflows.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {workflows.map((w) => (
              <button
                key={w}
                onClick={() => onSelect(w)}
                className={
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                  (w === selected
                    ? "bg-white text-[#0d0d14]"
                    : "border border-white/10 text-neutral-400 hover:border-white/25 hover:text-white")
                }
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The finding, stated in words before the chart repeats it in pixels */}
      {data.tail_share_percent > 0 && (
        <div className="px-4 pt-4 sm:px-6">
          <p className="text-sm text-neutral-300">
            The most expensive{" "}
            <span className="font-medium text-red-300">
              {formatNumber(data.tail_runs)} run
              {data.tail_runs === 1 ? "" : "s"}
            </span>{" "}
            of {formatNumber(data.runs)} consume{" "}
            <span className="font-medium text-red-300">
              {data.tail_share_percent}%
            </span>{" "}
            of this workflow&apos;s spend
            {spread && spread > 1 ? (
              <>
                , and the worst run costs{" "}
                <span className="font-semibold text-white">{spread}×</span> the
                typical one
              </>
            ) : null}
            .
          </p>
        </div>
      )}

      {/* Percentiles carry the values the chart does not label */}
      <div className="grid grid-cols-2 gap-4 px-4 py-4 sm:grid-cols-4 sm:px-6">
        <Stat label="Median run" value={formatCost(data.p50)} />
        <Stat label="p95" value={formatCost(data.p95)} />
        <Stat label="p99" value={formatCost(data.p99)} />
        <Stat label="Most expensive" value={formatCost(data.max)} />
      </div>

      {/* Legend: two colours carry meaning, so identity is never colour-alone */}
      <div className="flex flex-wrap items-center gap-4 px-4 pb-2 sm:px-6">
        <span className="inline-flex items-center gap-2 text-xs text-neutral-400">
          <span
            className="h-2.5 w-1.5 rounded-full"
            style={{ backgroundColor: BODY }}
            aria-hidden
          />
          Typical runs
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-neutral-400">
          <span
            className="h-2.5 w-1.5 rounded-full"
            style={{ backgroundColor: TAIL }}
            aria-hidden
          />
          Most expensive 5%
        </span>
        <button
          onClick={() => setShowTable((v) => !v)}
          className="ml-auto text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
        >
          {showTable ? "Hide data" : "Show data"}
        </button>
      </div>

      {/* Chart: one capsule per cost band. The tail is red and labelled, the
          median is marked, and pointing at a capsule reads out its band. */}
      <div className="px-4 pb-5 pt-10 sm:px-6" onMouseLeave={() => setHovered(null)}>
        <div className="flex h-56 items-end">
          {buckets.map((b, i) => {
            const isMedian = i === medianIndex;
            const lit = hovered === null ? true : hovered === i;
            const label =
              hovered === i
                ? `${formatCost(b.lower)} to ${formatCost(b.upper)} · ${formatNumber(b.count)} run${b.count === 1 ? "" : "s"}`
                : hovered === null && isMedian
                  ? `median ${formatCost(data.p50)}`
                  : hovered === null && i === firstTail
                    ? `top 5% · ${formatNumber(data.tail_runs)} runs`
                    : null;
            return (
              <div
                key={i}
                className="group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                onMouseEnter={() => setHovered(i)}
              >
                <div
                  className="relative w-[7px] rounded-full transition-opacity duration-150 sm:w-[9px]"
                  style={{
                    height: `${Math.max((b.count / peakCount) * 100, 2.5)}%`,
                    opacity: lit ? 1 : 0.3,
                    background: b.is_tail
                      ? `linear-gradient(to top, ${TAIL}55, ${TAIL})`
                      : isMedian
                        ? "#ffffff"
                        : `linear-gradient(to top, ${BODY}40, ${BODY})`,
                    boxShadow: b.is_tail
                      ? `0 0 16px ${TAIL}66`
                      : isMedian
                        ? "0 0 16px rgba(255,255,255,0.45)"
                        : undefined,
                  }}
                >
                  {label && (
                    <span
                      className={cn(
                        "pointer-events-none absolute bottom-full z-10 mb-2.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium tabular-nums",
                        b.is_tail ? "bg-red-300 text-[#1a0808]" : "bg-white text-[#0d0d14]",
                        i < buckets.length * 0.2
                          ? "left-0"
                          : i > buckets.length * 0.8
                            ? "right-0"
                            : "left-1/2 -translate-x-1/2",
                      )}
                    >
                      {label}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2.5 size-[5px] rounded-full",
                    b.is_tail ? "bg-red-300" : isMedian ? "bg-white" : "bg-white/15",
                  )}
                  aria-hidden
                />
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex justify-between text-[11px] tabular-nums text-neutral-600">
          {ticks.map((value, i) => (
            <span key={i}>{formatCost(value)}</span>
          ))}
        </div>
        <p className="mt-1 text-center text-[11px] text-neutral-600">cost of one run</p>
      </div>

      {/* Table view — nothing in the chart is gated behind colour or hover */}
      {showTable && (
        <div className="max-h-56 overflow-auto border-t border-white/6">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#131317]">
              <tr className="border-b border-white/6">
                <th className="px-4 py-2 text-left font-medium text-neutral-400 sm:px-6">
                  Cost per run
                </th>
                <th className="px-4 py-2 text-right font-medium text-neutral-400 sm:px-6">
                  Runs
                </th>
                <th className="px-4 py-2 text-right font-medium text-neutral-400 sm:px-6">
                  Band
                </th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((b, i) => (
                <tr key={i} className="border-b border-white/4 last:border-0">
                  <td className="px-4 py-1.5 text-neutral-300 tabular-nums sm:px-6">
                    {formatCost(b.lower)} – {formatCost(b.upper)}
                  </td>
                  <td className="px-4 py-1.5 text-right text-neutral-300 tabular-nums sm:px-6">
                    {formatNumber(b.count)}
                  </td>
                  <td className="px-4 py-1.5 text-right sm:px-6">
                    <span
                      className={
                        b.is_tail ? "text-red-300" : "text-neutral-500"
                      }
                    >
                      {b.is_tail ? "Top 5%" : "Typical"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.truncated && (
        <p className="px-4 pb-4 text-xs text-neutral-500 sm:px-6">
          Computed over the most recent {formatNumber(data.runs)} runs in this
          window.
        </p>
      )}
    </div>
  );
}
