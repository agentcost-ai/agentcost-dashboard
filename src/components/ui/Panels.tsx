"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Dashboard page furniture: one quiet vocabulary
   for stats, sections and settings rows so pages
   read as one product rather than a card grid.
   ───────────────────────────────────────────── */

export interface StatItem {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  /** Colour the value: status only, never decoration. */
  tone?: "default" | "bad" | "good";
}

/** A single bordered band of stat cells, divided by hairlines. */
export function StatBand({ items, className }: { items: StatItem[]; className?: string }) {
  return (
    <div
      className={cn(
        // Hairlines come from the 1px gap over a faint background.
        "grid gap-px overflow-hidden rounded-xl border border-white/8 bg-white/6 sm:grid-cols-2",
        items.length === 3 && "lg:grid-cols-3",
        items.length >= 4 && "lg:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-[#0c0c0e] px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1.5 text-[1.55rem] font-semibold leading-none tracking-tight tabular-nums",
              item.tone === "bad"
                ? "text-red-300"
                : item.tone === "good"
                  ? "text-emerald-300"
                  : "text-white",
            )}
          >
            {item.value}
          </p>
          {item.sub && <p className="mt-2 text-[12.5px] text-neutral-500">{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/** Bordered section with a titled header and an optional action slot. */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  id,
  tone,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "danger";
}) {
  return (
    <section
      id={id}
      className={cn(
        "overflow-hidden rounded-xl border bg-white/2 scroll-mt-24",
        tone === "danger" ? "border-red-900/40" : "border-white/8",
        className,
      )}
    >
      <header className="flex flex-col gap-3 border-b border-white/6 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-white">{title}</h2>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-neutral-500">
              {description}
            </p>
          )}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      {children}
    </section>
  );
}

/** Label on the left, control on the right; stacks on small screens. */
export function SettingRow({
  label,
  description,
  children,
  align = "center",
}: {
  label: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  align?: "center" | "start";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-white/6 px-5 py-4 last:border-b-0 sm:flex-row sm:justify-between sm:gap-8",
        align === "center" ? "sm:items-center" : "sm:items-start",
      )}
    >
      <div className="min-w-0 sm:w-64 sm:shrink-0">
        <p className="text-[13.5px] font-medium text-neutral-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-neutral-500">{description}</p>
        )}
      </div>
      <div className="min-w-0 flex-1 sm:flex sm:justify-end">{children}</div>
    </div>
  );
}

/* Form controls in the same voice. */

export const fieldClass =
  "h-10 w-full rounded-lg border border-white/10 bg-black/30 px-3 text-[13.5px] text-white placeholder:text-neutral-600 transition-colors focus:border-white/30 focus:outline-none disabled:opacity-50";

export const monoFieldClass = cn(fieldClass, "font-mono text-[13px]");

export const buttonPrimary =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-3.5 text-[13px] font-medium text-neutral-900 transition-colors hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondary =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 text-[13px] font-medium text-neutral-200 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50";

export const buttonDanger =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-500/40 px-3.5 text-[13px] font-medium text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "border-white bg-white" : "border-white/15 bg-white/10",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
          checked ? "left-5.5 bg-neutral-900" : "left-0.75 bg-neutral-300",
        )}
      />
    </button>
  );
}

/** Segmented control for a handful of nominal options. */
export function Segmented<T extends string | null>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-lg border border-white/8 bg-white/2 p-0.5"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "cursor-pointer rounded-md px-2.5 py-1 text-[12.5px] font-medium transition-colors",
              active ? "bg-white text-neutral-900" : "text-neutral-400 hover:text-white",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
