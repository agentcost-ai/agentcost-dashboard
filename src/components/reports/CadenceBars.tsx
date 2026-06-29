"use client";

import { cn, formatNumber } from "@/lib/utils";
import type { CadenceBucket } from "@/lib/api";

interface CadenceBarsProps {
  data: CadenceBucket[];
  /** Bucket label to emphasize (the busiest one). */
  busiestLabel?: string | null;
  /** Tailwind background class for the bar fill (single hue). */
  color?: string;
  labelWidth?: string;
}

/**
 * Flat single-hue horizontal bars for a small set of buckets (day-of-week,
 * hour-of-day). Normalized to the busiest bucket; the peak bucket is rendered
 * at full opacity, the rest dimmed.
 */
export function CadenceBars({
  data,
  busiestLabel,
  color = "bg-sky-500",
  labelWidth = "w-16",
}: CadenceBarsProps) {
  const max = Math.max(...data.map((d) => d.calls), 1);
  return (
    <div className="space-y-1.5">
      {data.map((b) => {
        const isPeak = b.label === busiestLabel;
        return (
          <div key={b.index} className="flex items-center gap-3">
            <span
              className={cn(
                "shrink-0 text-[11.5px] tabular-nums",
                labelWidth,
                isPeak ? "text-neutral-300" : "text-neutral-500",
              )}
            >
              {b.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
              <div
                className={cn("h-full rounded-full", color)}
                style={{
                  width: `${(b.calls / max) * 100}%`,
                  opacity: isPeak ? 1 : 0.5,
                }}
              />
            </div>
            <span className="w-14 shrink-0 text-right text-[11.5px] text-neutral-500 tabular-nums">
              {formatNumber(b.calls)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
