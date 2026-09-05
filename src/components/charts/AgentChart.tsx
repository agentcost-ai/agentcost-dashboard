"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import {
  CATEGORICAL,
  CHART_CHROME,
  TOOLTIP_CONTENT_STYLE,
} from "@/lib/palette";

interface AgentChartProps {
  data: Array<{
    agent_name: string;
    total_cost: number;
    total_calls: number;
  }>;
}

export function AgentChart({ data }: AgentChartProps) {
  const sortedData = [...data]
    .sort((a, b) => b.total_cost - a.total_cost)
    .slice(0, 8);

  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_CHROME.axisTick, fontSize: 12 }}
            tickFormatter={(value) => `$${value}`}
          />
          <YAxis
            type="category"
            dataKey="agent_name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: CHART_CHROME.axisTick, fontSize: 12 }}
            width={100}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            formatter={(value) => {
              if (typeof value === "number") {
                return [formatCurrency(value), "Cost"];
              }
              return [value, "Calls"];
            }}
            cursor={{ fill: CHART_CHROME.cursorFill }}
          />
          {/* One measure, nominal categories — a single hue; the axis labels
              carry identity and bar length carries the value. */}
          <Bar
            dataKey="total_cost"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            fill={CATEGORICAL[0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
