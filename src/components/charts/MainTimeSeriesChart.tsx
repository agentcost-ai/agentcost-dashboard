"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { TimeSeriesPoint } from "@/lib/api";

type Metric = "cost" | "calls" | "tokens";

const METRICS: {
  key: Metric;
  label: string;
  color: string;
  format: (v: number) => string;
}[] = [
  { key: "cost", label: "Spend", color: "#38bdf8", format: formatCurrency },
  { key: "calls", label: "Calls", color: "#a78bfa", format: formatNumber },
  { key: "tokens", label: "Tokens", color: "#fbbf24", format: formatNumber },
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
    <div className="rounded-xl border border-white/10 bg-[#101016]/95 backdrop-blur-md px-4 py-3 shadow-2xl">
      <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-2">
        {point.label}
      </p>
      <div className="space-y-1.5">
        {METRICS.map((m) => (
          <div key={m.key} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-[12px] text-neutral-400">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: m.color }}
              />
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
      data.map((item) => ({
        ...item,
        label: format(
          new Date(item.timestamp),
          hourly ? "MMM d, HH:mm" : "EEE, MMM d",
        ),
        tick: format(new Date(item.timestamp), hourly ? "HH:mm" : "MMM d"),
      })),
    [data, hourly],
  );

  const average = useMemo(() => {
    if (data.length === 0) return 0;
    return data.reduce((s, d) => s + d[metric], 0) / data.length;
  }, [data, metric]);

  const maxValue = Math.max(...data.map((d) => d[metric]), 0);

  return (
    <div>
      {/* Metric switcher */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-1 rounded-xl border border-white/6 bg-white/2 p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={cn(
                "px-3.5 py-1.5 text-[12.5px] font-medium rounded-lg transition-all duration-200",
                metric === m.key
                  ? "bg-white/8 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-300",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-neutral-500">
          <span
            className="inline-block h-0 w-5 border-t border-dashed"
            style={{ borderColor: "#525252" }}
          />
          period average
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={formattedData}
            margin={{ top: 10, right: 6, left: 6, bottom: 0 }}
          >
            <defs>
              <linearGradient id="mainChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={active.color} stopOpacity={0.28} />
                <stop offset="55%" stopColor={active.color} stopOpacity={0.06} />
                <stop offset="100%" stopColor={active.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="tick"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 11 }}
              dy={10}
              minTickGap={32}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#737373", fontSize: 11 }}
              domain={[0, maxValue > 0 ? maxValue * 1.12 : 1]}
              tickFormatter={(v) => axisTickFormat(metric, v as number)}
              width={56}
              tickCount={5}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{
                stroke: "rgba(255,255,255,0.15)",
                strokeDasharray: "4 4",
              }}
            />
            <ReferenceLine
              y={average}
              stroke="#525252"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={active.color}
              strokeWidth={2}
              fill="url(#mainChartFill)"
              activeDot={{
                r: 4,
                fill: active.color,
                stroke: "#0a0a0b",
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
