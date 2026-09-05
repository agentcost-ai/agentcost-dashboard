/**
 * Chart color system — the single source of truth for data-viz color.
 * The slot ORDER is the colorblind-safety mechanism, not cosmetics: this
 * ordering was enumerated and validated (dataviz six checks) against the card
 * surface #0f0f11 and the white print page — worst adjacent CVD ΔE 14.1,
 * normal-vision floor 16.2, every slot ≥3:1 on both surfaces. Assign slots in
 * sequence, never cycle; more than 8 categories fold into "Other".
 * Re-run the validator before changing any hex or the order.
 */

export const CATEGORICAL = [
  "#0284c7", // 1 sky-600
  "#059669", // 2 emerald-600
  "#8b5cf6", // 3 violet-500
  "#d97706", // 4 amber-600
  "#ec4899", // 5 pink-500
  "#ea580c", // 6 orange-600
  "#6366f1", // 7 indigo-500
  "#0d9488", // 8 teal-600
] as const;

/** Slot lookup without cycling — callers must cap series at 8 (fold to "Other"). */
export function seriesColor(index: number): string {
  return CATEGORICAL[Math.min(index, CATEGORICAL.length - 1)];
}

/** One color per top-level metric, everywhere it appears (charts, sparklines, KPis). */
export const METRIC_COLORS = {
  cost: CATEGORICAL[0],
  calls: CATEGORICAL[1],
  tokens: CATEGORICAL[2],
} as const;

/** Status steps for marks/text on the dark surface. Reserved meaning — never "series 4". */
export const STATUS = {
  good: "#34d399", // emerald-400
  warning: "#fbbf24", // amber-400
  critical: "#f87171", // red-400
} as const;

/** Axis, grid, and cursor chrome — the neutral ramp, matching bg-neutral-950 pages. */
export const CHART_CHROME = {
  grid: "#262626", // neutral-800
  axisLine: "#262626",
  axisTick: "#737373", // neutral-500
  referenceLine: "#525252", // neutral-600
  referenceLabel: "#a3a3a3", // neutral-400
  cursorFill: "rgba(255,255,255,0.04)",
  cursorStroke: "rgba(255,255,255,0.15)",
  /** Ring color for active dots — the page background, so dots read as punched out. */
  dotStroke: "#0a0a0b",
} as const;

/** contentStyle for recharts' default <Tooltip> — neutral-900 glass, neutral-700 border. */
export const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "rgba(23, 23, 23, 0.97)",
  border: "1px solid #404040",
  borderRadius: "8px",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
} as const;

export const TOOLTIP_LABEL_STYLE = { color: "#a3a3a3", marginBottom: 4 } as const;
export const TOOLTIP_ITEM_STYLE = { color: "#fafafa" } as const;
