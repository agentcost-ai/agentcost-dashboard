"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MetricDelta } from "@/lib/api";

interface DeltaBadgeProps {
  delta: MetricDelta;
  /** When true, an increase is bad news (cost, latency) → red. */
  upIsBad?: boolean;
  className?: string;
  /** Append " vs prev" style suffix. */
  suffix?: string;
}

/**
 * Period-over-period change chip: arrow + signed percent. The arrow always
 * reflects the actual direction; color reflects good/bad via `upIsBad`.
 */
export function DeltaBadge({ delta, upIsBad = false, className, suffix }: DeltaBadgeProps) {
  const color =
    delta.direction === "neutral"
      ? "text-neutral-500"
      : (delta.direction === "up") === upIsBad
        ? "text-red-500"
        : "text-emerald-500";

  const Icon =
    delta.direction === "up"
      ? TrendingUp
      : delta.direction === "down"
        ? TrendingDown
        : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium tabular-nums",
        color,
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {delta.direction === "neutral"
        ? "flat"
        : `${Math.abs(delta.change_percent).toFixed(1)}%`}
      {suffix && <span className="text-neutral-500 font-normal">{suffix}</span>}
    </span>
  );
}
