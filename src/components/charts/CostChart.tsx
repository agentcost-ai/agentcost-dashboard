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
import { formatCurrency } from "@/lib/utils";

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
    date: format(new Date(item.timestamp), "MMM d"),
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
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#374151"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 12 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
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
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
            labelStyle={{ color: "#9ca3af", marginBottom: 4 }}
            itemStyle={{ color: "#fff" }}
            formatter={(value) => [formatCurrency(value as number), "Cost"]}
          />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#costGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
