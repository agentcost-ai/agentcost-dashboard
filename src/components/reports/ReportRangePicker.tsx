"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface ReportRange {
  range?: string;
  start?: string;
  end?: string;
}

const PRESETS = [
  { value: "24h", label: "24h" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "mtd", label: "MTD" },
];

interface ReportRangePickerProps {
  value: ReportRange;
  onChange: (v: ReportRange) => void;
}

/**
 * Range control for the report: preset chips + Month-to-date, plus a Custom
 * toggle that reveals two native date inputs. Emits either `{ range }` or
 * `{ start, end }` (ISO). No external date-picker dependency.
 */
export function ReportRangePicker({ value, onChange }: ReportRangePickerProps) {
  const isCustom = !!(value.start && value.end);
  const [customOpen, setCustomOpen] = useState(isCustom);
  const [start, setStart] = useState(value.start?.slice(0, 10) ?? "");
  const [end, setEnd] = useState(value.end?.slice(0, 10) ?? "");

  const inputClass =
    "rounded-lg border border-neutral-700 bg-neutral-800/60 px-3 py-1.5 text-[12.5px] text-neutral-200 [color-scheme:dark] focus:border-neutral-500 focus:outline-none";

  function applyCustom() {
    if (!start || !end) return;
    onChange({
      start: new Date(`${start}T00:00:00`).toISOString(),
      end: new Date(`${end}T23:59:59`).toISOString(),
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded-xl border border-white/6 bg-white/2 p-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              setCustomOpen(false);
              onChange({ range: p.value });
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
              !isCustom && value.range === p.value
                ? "bg-white/8 text-white"
                : "text-neutral-500 hover:text-neutral-300",
            )}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCustomOpen((o) => !o)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors",
            isCustom
              ? "bg-white/8 text-white"
              : "text-neutral-500 hover:text-neutral-300",
          )}
        >
          Custom
        </button>
      </div>

      {customOpen && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={start}
            max={end || undefined}
            onChange={(e) => setStart(e.target.value)}
            className={inputClass}
          />
          <span className="text-neutral-600">→</span>
          <input
            type="date"
            value={end}
            min={start || undefined}
            onChange={(e) => setEnd(e.target.value)}
            className={inputClass}
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!start || !end}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-[12.5px] font-medium text-neutral-200 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
