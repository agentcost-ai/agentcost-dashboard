"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A dark, keyboard-navigable replacement for <select>: the native popup is
 * white on Windows/Chrome and ignores the page's theme. Long lists get a
 * type-to-filter field.
 */
export function FilterMenu({
  value,
  options,
  onChange,
  label,
  format = (v) => v,
  searchable,
  className,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  /** Accessible name for the control. */
  label: string;
  /** Display transform for option values. */
  format?: (value: string) => string;
  /** Show a filter field inside the menu (for long lists). */
  searchable?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => (q ? options.filter((o) => format(o).toLowerCase().includes(q)) : options),
    [options, q, format],
  );

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  const openMenu = () => {
    setQuery("");
    setCursor(Math.max(0, options.indexOf(value)));
    setOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, visible.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Home") {
      e.preventDefault();
      setCursor(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setCursor(visible.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (visible[cursor]) choose(visible[cursor]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openMenu();
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between gap-3 rounded-md border bg-white/3 py-2.5 pl-4 pr-3 text-left text-[14px] text-white transition-colors",
          open ? "border-white/25" : "border-white/8 hover:border-white/20",
        )}
      >
        <span className="truncate">{format(value)}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-neutral-500 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>

      {open && (
        <div
          className="absolute left-0 z-40 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-lg border border-white/10 bg-[#0e0e10] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)]"
          onKeyDown={onKeyDown}
        >
          {searchable && (
            <label className="flex items-center gap-2 border-b border-white/8 px-3">
              <Search size={13} className="text-neutral-500" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setCursor(0);
                }}
                placeholder="Type to filter"
                className="h-9 w-full bg-transparent text-[13px] text-white outline-none placeholder:text-neutral-600"
                aria-label={`Filter ${label.toLowerCase()}`}
              />
            </label>
          )}
          <ul
            ref={listRef}
            id={`${id}-list`}
            role="listbox"
            aria-label={label}
            tabIndex={searchable ? -1 : 0}
            className="max-h-64 overflow-y-auto p-1 outline-none"
          >
            {visible.length === 0 && (
              <li className="px-3 py-3 text-[13px] text-neutral-500">No matches</li>
            )}
            {visible.map((o, i) => {
              const selected = o === value;
              return (
                <li
                  key={o}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => choose(o)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-[13.5px]",
                    i === cursor ? "bg-white/8 text-white" : "text-neutral-300",
                  )}
                >
                  <span className="truncate">{format(o)}</span>
                  {selected && <Check size={14} className="shrink-0 text-white" aria-hidden />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
