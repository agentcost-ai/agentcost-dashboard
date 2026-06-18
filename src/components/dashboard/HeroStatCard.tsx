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
  /** Tailwind classes for the icon tile, e.g. "bg-sky-500/10 text-sky-400". */
  iconClassName: string;
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
  iconClassName,
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
    <div className="group relative overflow-hidden rounded-2xl border border-white/6 bg-linear-to-b from-white/[0.035] to-white/[0.012] p-5 transition-colors duration-300 hover:border-white/12">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                iconClassName,
              )}
            >
              {icon}
            </div>
            <span className="text-[12px] font-medium uppercase tracking-[0.08em] text-neutral-500">
              {label}
            </span>
          </div>

          <p className="text-[1.7rem] leading-none font-semibold tracking-tight text-white tabular-nums">
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
