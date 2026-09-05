"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { formatCurrency, dayBucketDate } from "@/lib/utils";
import {
  METRIC_COLORS,
  CHART_CHROME,
  TOOLTIP_CONTENT_STYLE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_ITEM_STYLE,
} from "@/lib/palette";

interface CostChartProps {
  data: Array<{
    timestamp: string;
    cost: number;
    calls: number;
  }>;
}

export function CostChart({ data }: CostChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: format(dayBucketDate(item.timestamp), "MMM d"),
    formattedCost: formatCurrency(item.cost),
  }));

  // Calculate Y-axis domain with proper handling for small/zero values
  const maxCost = Math.max(...data.map((d) => d.cost), 0);
  const yDomain: [number, number] = [0, maxCost > 0 ? maxCost * 1.1 : 1];

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={formattedData}
          margin={{ top: 10, right: 10, left: 5, bottom: 0 }}
        >
          <defs>
            <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={METRIC_COLORS.cost} stopOpacity={0.3} />
              <stop offset="100%" stopColor={METRIC_COLORS.cost} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_CHROME.grid}
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_CHROME.axisTick, fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_CHROME.axisTick, fontSize: 11 }}
            domain={yDomain}
            tickFormatter={(value) => {
              if (value === 0) return "$0";
              if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
              if (value >= 1) return `$${value.toFixed(0)}`;
              if (value >= 0.01) return `$${value.toFixed(2)}`;
              return `$${value.toFixed(4)}`;
            }}
            width={55}
            tickCount={5}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={(value) => [formatCurrency(value as number), "Cost"]}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke={METRIC_COLORS.cost}
            strokeWidth={2}
            fill="url(#costGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
