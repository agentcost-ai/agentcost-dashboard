"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Sparkline } from "./Sparkline";

export interface Delta {
  /** Percent change vs the first half of the selected window. */
  value: number;
  direction: "up" | "down" | "neutral";
}

interface HeroStatCardProps {
  label: string;
  value: string;
  sub?: string | ReactNode;
  icon: ReactNode;
  /** Kept for callers; the icon is always drawn in the neutral chip. */
  iconClassName?: string;
  delta?: Delta;
  /**
   * Whether an upward delta is bad news (costs) or good news (success rate).
   * Controls the red/green coloring only — never the arrow direction.
   */
  upIsBad?: boolean;
  sparkline?: { data: number[]; color: string };
}

export function HeroStatCard({
  label,
  value,
  sub,
  icon,
  delta,
  upIsBad = false,
  sparkline,
}: HeroStatCardProps) {
  const deltaColor =
    !delta || delta.direction === "neutral"
      ? "text-neutral-500"
      : (delta.direction === "up") === upIsBad
        ? "text-red-400"
        : "text-emerald-400";

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/8 bg-[#131317] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-colors duration-300 hover:border-white/16">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-full border border-white/10 text-neutral-400">
              {icon}
            </span>
            <span className="text-[12px] text-neutral-500">{label}</span>
          </div>

          <p className="text-[2rem] font-light leading-none tracking-[-0.02em] text-white tabular-nums">
            {value}
          </p>

          <div className="mt-2.5 flex items-center gap-2.5 text-[12.5px]">
            {delta && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 font-medium tabular-nums",
                  deltaColor,
                )}
              >
                {delta.direction === "up" ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : delta.direction === "down" ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                {delta.direction === "neutral"
                  ? "flat"
                  : `${delta.value.toFixed(1)}%`}
              </span>
            )}
            {sub && <span className="text-neutral-500 truncate">{sub}</span>}
          </div>
        </div>

        {sparkline && sparkline.data.length > 1 && (
          <Sparkline
            data={sparkline.data}
            color={sparkline.color}
            width={96}
            height={34}
            className="mt-1 shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}
