"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  ReferenceDot,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { formatCurrency, formatNumber, cn, dayBucketDate } from "@/lib/utils";
import type { TimeSeriesPoint } from "@/lib/api";
import { ACCENT, ACCENT_SOFT, CHART_CHROME } from "@/lib/palette";

type Metric = "cost" | "calls" | "tokens";

const METRICS: {
  key: Metric;
  label: string;
  color: string;
  format: (v: number) => string;
}[] = [
  // One series is on screen at a time, so they share the page accent rather
  // than each bringing a hue of its own.
  { key: "cost", label: "Spend", color: ACCENT_SOFT, format: formatCurrency },
  { key: "calls", label: "Calls", color: ACCENT_SOFT, format: formatNumber },
  { key: "tokens", label: "Tokens", color: ACCENT_SOFT, format: formatNumber },
];

function axisTickFormat(metric: Metric, value: number): string {
  if (metric === "cost") {
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
    if (value >= 1) return `$${value.toFixed(0)}`;
    return value === 0 ? "$0" : `$${value.toFixed(2)}`;
  }
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
  return `${value}`;
}

interface TooltipPayloadEntry {
  payload?: TimeSeriesPoint & { label: string };
}

/** Dark glass tooltip showing all three metrics for the hovered point. */
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-xl border border-neutral-700 bg-neutral-900/95 backdrop-blur-md px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
        {point.label}
      </p>
      <div className="space-y-1.5">
        {METRICS.map((m) => (
          <div key={m.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-[12px] text-neutral-400">
              {m.label}
            </span>
            <span className="text-[12.5px] font-medium text-white tabular-nums">
              {m.format(point[m.key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MainTimeSeriesChartProps {
  data: TimeSeriesPoint[];
  /** Active range, e.g. "24h" — controls x-axis label format. */
  range: string;
}

/**
 * Full-width activity chart with a Spend / Calls / Tokens switcher, a dashed
 * period-average reference line, and a tooltip that always shows all three
 * metrics regardless of the selected series.
 */
export function MainTimeSeriesChart({ data, range }: MainTimeSeriesChartProps) {
  const [metric, setMetric] = useState<Metric>("cost");
  const active = METRICS.find((m) => m.key === metric)!;
  const hourly = range === "1h" || range === "24h";

  const formattedData = useMemo(
    () =>
      data.map((item) => {
        // Hour buckets read naturally in the viewer's zone; day buckets must
        // keep their UTC calendar date (see dayBucketDate).
        const d = hourly ? new Date(item.timestamp) : dayBucketDate(item.timestamp);
        return {
          ...item,
          label: format(d, hourly ? "MMM d, HH:mm" : "EEE, MMM d"),
          tick: format(d, hourly ? "HH:mm" : "MMM d"),
        };
      }),
    [data, hourly],
  );

  const average = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((s, d) => s + d[metric], 0) / data.length;
  }, [data, metric]);

  const maxValue = Math.max(...data.map((d) => d[metric]), 0);
  const peak = maxValue > 0 ? formattedData.find((d) => d[metric] === maxValue) : undefined;

  return (
    <div>
      {/* Metric switcher */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-5">
        <div className="flex items-center gap-1.5">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                metric === m.key
                  ? "bg-white text-[#0d0d14]"
                  : "border border-white/10 text-neutral-400 hover:border-white/25 hover:text-white",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-neutral-500">
          <span
            className="inline-block h-0 w-5 border-t border-dashed"
            style={{ borderColor: CHART_CHROME.referenceLine }}
          />
          period average
        </div>
      </div>

      <div className="h-52 min-w-0 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 10, right: 6, left: 6, bottom: 0 }}
          >
            <defs>
              <linearGradient id="mainChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                <stop offset="60%" stopColor={ACCENT} stopOpacity={0.07} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={CHART_CHROME.grid}
              vertical={false}
            />
            <XAxis
              dataKey="tick"
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_CHROME.axisTick, fontSize: 11 }}
              dy={10}
              minTickGap={32}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: CHART_CHROME.axisTick, fontSize: 11 }}
              domain={[0, maxValue > 0 ? maxValue * 1.22 : 1]}
              tickFormatter={(v) => axisTickFormat(metric, v as number)}
              width={56}
              tickCount={4}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: CHART_CHROME.cursorStroke,
                strokeDasharray: "4 4",
              }}
            />
            <ReferenceLine
              y={average}
              stroke={CHART_CHROME.referenceLine}
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="none"
              fill="url(#mainChartFill)"
              activeDot={false}
              tooltipType="none"
            />
            {/* Soft halo under the line, then the line itself */}
            <Line
              type="monotone"
              dataKey={metric}
              stroke={ACCENT}
              strokeWidth={9}
              strokeOpacity={0.3}
              strokeLinecap="round"
              dot={false}
              activeDot={false}
              tooltipType="none"
              style={{ filter: "blur(5px)" }}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={active.color}
              strokeWidth={2.25}
              strokeLinecap="round"
              dot={false}
              activeDot={{
                r: 5,
                fill: CHART_CHROME.dotStroke,
                stroke: active.color,
                strokeWidth: 2.5,
              }}
            />
            {peak && (
              <ReferenceDot
                x={peak.tick}
                y={peak[metric]}
                r={5}
                fill={CHART_CHROME.dotStroke}
                stroke={active.color}
                strokeWidth={2.5}
                label={{
                  value: `${active.format(peak[metric])} peak`,
                  position: "top",
                  offset: 12,
                  fill: "#e5e5e5",
                  fontSize: 11.5,
                }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
