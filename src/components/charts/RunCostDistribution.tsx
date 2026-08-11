"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type { RunCostDistribution as Distribution } from "@/lib/api";

/**
 * Two colours, both doing a job: one hue for the body of the distribution and
 * a reserved status hue for the tail. Validated against the card surface
 * (#0f0f11) for the dark-mode lightness band, chroma floor, CVD separation
 * (ΔE 23.4 protan / 28.6 tritan), the normal-vision floor (30.6) and 3:1
 * contrast. Do not swap these for lighter steps without re-validating —
 * primary-400 and amber-400 both fail the dark-mode lightness band.
 */
const BODY = "#0284c7";
const TAIL = "#d97706";

/** Costs here run from cents to fractions of a cent, so no fixed precision works. */
function formatCost(value: number): string {
  if (value === 0) return "$0";
  if (value >= 100) return `$${value.toFixed(0)}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  if (value >= 0.0001) return `$${value.toFixed(5)}`;
  return `$${value.toExponential(1)}`;
}

interface Bucket {
  lower: number;
  upper: number;
  count: number;
  is_tail: boolean;
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Bucket }>;
}) {
  const bucket = active ? payload?.[0]?.payload : undefined;
  if (!bucket) return null;

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 px-3 py-2 shadow-xl backdrop-blur-sm">
      <p className="text-xs text-neutral-400">
        {formatCost(bucket.lower)} – {formatCost(bucket.upper)} per run
      </p>
      <p className="mt-0.5 text-sm font-semibold text-white">
        {formatNumber(bucket.count)} run{bucket.count === 1 ? "" : "s"}
      </p>
      {bucket.is_tail && (
        <p className="mt-1 text-xs text-amber-400">In the most expensive 5%</p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-white tabular-nums">
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

  const buckets = useMemo(() => data?.histogram ?? [], [data]);
  // Only a handful of ticks: 24 currency labels would collide at any width.
  const tickInterval = Math.max(0, Math.ceil(buckets.length / 6) - 1);

  if (!data || buckets.length === 0) return null;

  const spread = data.tail_ratio;

  return (
    <div>
      {/* Header + workflow picker */}
      <div className="flex flex-col gap-3 border-b border-white/6 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold tracking-tight text-white">
            What one run actually costs
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Every run in the window, not just the average — the average is the
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
                  "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors " +
                  (w === selected
                    ? "bg-white/10 text-white"
                    : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200")
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
            <span className="font-semibold text-amber-400">
              {formatNumber(data.tail_runs)} run
              {data.tail_runs === 1 ? "" : "s"}
            </span>{" "}
            of {formatNumber(data.runs)} consume{" "}
            <span className="font-semibold text-amber-400">
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
            className="h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: BODY }}
            aria-hidden
          />
          Typical runs
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-neutral-400">
          <span
            className="h-2.5 w-2.5 rounded-sm"
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

      {/* Chart */}
      <div className="h-64 w-full px-2 pb-4 sm:px-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 16, right: 16, bottom: 8, left: 4 }}
            barCategoryGap={2}
          >
            <CartesianGrid
              horizontal
              vertical={false}
              stroke="#262626"
              strokeWidth={1}
            />
            <XAxis
              dataKey="lower"
              tickFormatter={formatCost}
              interval={tickInterval}
              tick={{ fill: "#737373", fontSize: 11 }}
              axisLine={{ stroke: "#262626" }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tickFormatter={formatNumber}
              tick={{ fill: "#737373", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <ReferenceLine
              x={
                buckets.reduce((best, b) =>
                  Math.abs(b.lower - data.p50) < Math.abs(best.lower - data.p50)
                    ? b
                    : best,
                ).lower
              }
              stroke="#a3a3a3"
              strokeWidth={1}
              label={{
                value: "median",
                position: "top",
                fill: "#a3a3a3",
                fontSize: 10,
              }}
            />
            {/* Animation off: a 24-bar grow-in adds nothing to a static
                distribution, and it leaves the bars at zero height in
                headless renders (screenshots, PDF export, print). */}
            <Bar
              dataKey="count"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            >
              {buckets.map((b, i) => (
                <Cell key={i} fill={b.is_tail ? TAIL : BODY} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table view — nothing in the chart is gated behind colour or hover */}
      {showTable && (
        <div className="max-h-56 overflow-auto border-t border-white/6">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-neutral-900">
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
                        b.is_tail ? "text-amber-400" : "text-neutral-500"
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
