"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import {
  formatCurrency,
  formatNumber,
  formatLatency,
  cn,
} from "@/lib/utils";
import type { AgentStats } from "@/lib/api";

interface AgentRankListProps {
  data: AgentStats[];
  limit?: number;
}

/**
 * Cost ranking of agents as animated horizontal bars, with per-agent calls,
 * success rate and latency inline. Reads better than a bar chart for ranked
 * comparisons and gives each row room for operational detail.
 */
export function AgentRankList({ data, limit = 7 }: AgentRankListProps) {
  const ranked = useMemo(
    () =>
      [...data].sort((a, b) => b.total_cost - a.total_cost).slice(0, limit),
    [data, limit],
  );
  const maxCost = ranked[0]?.total_cost ?? 0;
  const totalCost = data.reduce((s, a) => s + a.total_cost, 0);

  return (
    <div className="space-y-1">
      {ranked.map((agent, index) => {
        const widthPct = maxCost > 0 ? (agent.total_cost / maxCost) * 100 : 0;
        const sharePct =
          totalCost > 0 ? (agent.total_cost / totalCost) * 100 : 0;
        const healthy = agent.success_rate >= 97;

        return (
          <div
            key={agent.agent_name}
            className="group rounded-xl px-3 py-2.5 -mx-1 transition-colors duration-150 hover:bg-white/2"
          >
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 text-[11px] font-mono text-neutral-600 tabular-nums shrink-0">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[13px] font-medium text-neutral-200 truncate">
                  {agent.agent_name}
                </span>
              </div>
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="text-[13px] font-semibold text-white tabular-nums">
                  {formatCurrency(agent.total_cost)}
                </span>
                <span className="text-[11px] text-neutral-600 tabular-nums">
                  {sharePct.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pl-[30px]">
              {/* Bar */}
              <div className="relative h-1.5 flex-1 rounded-full bg-white/4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{
                    duration: 0.7,
                    delay: index * 0.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-y-0 left-0 rounded-full bg-sky-500"
                />
              </div>

              {/* Operational detail */}
              <div className="flex items-center gap-3 text-[11px] text-neutral-600 tabular-nums shrink-0">
                <span>{formatNumber(agent.total_calls)} calls</span>
                <span
                  className={cn(
                    "flex items-center gap-1",
                    healthy ? "text-neutral-600" : "text-amber-400/90",
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      healthy ? "bg-emerald-500" : "bg-amber-400",
                    )}
                  />
                  {agent.success_rate.toFixed(1)}%
                </span>
                <span className="hidden xl:inline">
                  {formatLatency(agent.avg_latency_ms)}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <Link
        href="/agents"
        className="mt-2 inline-flex items-center gap-1 px-3 text-[12px] font-medium text-neutral-500 hover:text-sky-400 transition-colors"
      >
        All agents
        <ArrowUpRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
