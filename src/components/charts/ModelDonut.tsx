"use client";

import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import type { ModelStats } from "@/lib/api";

const COLORS = [
  "#38bdf8",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#818cf8",
  "#f472b6",
  "#2dd4bf",
];

interface ModelDonutProps {
  data: ModelStats[];
}

/**
 * Cost share by model: donut with the period total in the center and an
 * interactive legend — hovering either the segment or the legend row
 * highlights both (highlight state is owned here, not by Recharts, so the
 * center label and legend stay in sync).
 */
export function ModelDonut({ data }: ModelDonutProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const sorted = useMemo(
    () => [...data].sort((a, b) => b.total_cost - a.total_cost).slice(0, 6),
    [data],
  );
  const total = sorted.reduce((sum, item) => sum + item.total_cost, 0);

  const centered = activeIndex !== null ? sorted[activeIndex] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2">
      {/* Donut */}
      <div className="relative w-full sm:w-1/2 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sorted}
              dataKey="total_cost"
              nameKey="model"
              cx="50%"
              cy="50%"
              innerRadius={66}
              outerRadius={92}
              paddingAngle={3}
              cornerRadius={4}
              strokeWidth={0}
              isAnimationActive={false}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {sorted.map((_, index) => (
                <Cell
                  key={index}
                  fill={COLORS[index % COLORS.length]}
                  opacity={
                    activeIndex === null || activeIndex === index ? 1 : 0.3
                  }
                  style={{
                    transition: "opacity 0.2s ease",
                    outline: "none",
                    cursor: "pointer",
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1 max-w-28 truncate">
            {centered ? centered.model : "Total spend"}
          </span>
          <span className="text-[1.45rem] font-semibold tracking-tight text-white tabular-nums leading-none">
            {formatCurrency(centered ? centered.total_cost : total)}
          </span>
          {centered && total > 0 && (
            <span className="mt-1 text-[11.5px] text-neutral-500 tabular-nums">
              {((centered.total_cost / total) * 100).toFixed(1)}% of spend
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="w-full sm:w-1/2 space-y-1">
        {sorted.map((item, index) => {
          const share = total > 0 ? (item.total_cost / total) * 100 : 0;
          return (
            <button
              key={item.model}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={cn(
                "w-full flex items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
                activeIndex === index ? "bg-white/4" : "hover:bg-white/2",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-[3px] shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-medium text-neutral-200 font-mono truncate">
                    {item.model}
                  </p>
                  <p className="text-[11px] text-neutral-600 tabular-nums">
                    {formatNumber(item.total_calls)} calls
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12.5px] font-medium text-white tabular-nums">
                  {formatCurrency(item.total_cost)}
                </p>
                <p className="text-[11px] text-neutral-600 tabular-nums">
                  {share.toFixed(1)}%
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
