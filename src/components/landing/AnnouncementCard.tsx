"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Release announcement for the landing hero.
   A bordered panel over a field of dashed tiles
   that light up one by one. Swap the props on
   each release.
   ───────────────────────────────────────────── */

interface AnnouncementCardProps {
  title: string;
  /** Short tag rendered beside the title, e.g. "New". */
  tag: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  /** GA label for the click, e.g. "guardrails". */
  feature: string;
  className?: string;
}

const ROWS = 12;
const COLUMNS = 30;
const TILE_W = 15;
const TILE_H = 16;
const DURATION_S = 14;

/* Seeded PRNG so server and client render identical delays — Math.random
   here would produce a hydration mismatch on every tile. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DELAYS: number[][] = (() => {
  const rand = mulberry32(2026);
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLUMNS }, () => rand() * DURATION_S),
  );
})();

function TilesBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 flex select-none flex-col overflow-hidden"
    >
      {DELAYS.map((row, r) => (
        <div
          key={r}
          className="flex shrink-0 border-b border-dashed border-white/10"
          style={{ height: TILE_H }}
        >
          {row.map((delay, c) => (
            <div
              key={c}
              className="relative shrink-0 border-r border-dashed border-white/10"
              style={{ width: TILE_W, height: TILE_H }}
            >
              <div
                className="announcement-tile absolute inset-0 bg-white/12"
                style={{ animationDelay: `${delay.toFixed(2)}s` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AnnouncementCard({
  title,
  tag,
  description,
  buttonText,
  buttonHref,
  feature,
  className,
}: AnnouncementCardProps) {
  return (
    <div
      className={cn(
        "relative flex w-full max-w-sm flex-col gap-6 overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0e]/80 px-7 py-5 text-left shadow-[0_24px_80px_-32px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <TilesBackground />

      <div className="relative z-20">
        <div>
          <h3 className="inline text-xl font-semibold tracking-tight text-neutral-100">
            {title}
          </h3>
          <span className="ml-2 inline-block rounded-sm border border-neutral-400 px-1 align-top text-[10px] font-medium uppercase leading-4 tracking-tight text-neutral-200">
            {tag}
          </span>
        </div>
        <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-400">
          {description}
        </p>
      </div>

      <Link
        href={buttonHref}
        onClick={() => track("announcement_clicked", { feature, location: "hero" })}
        className="group relative z-20 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/6 text-[14px] font-medium text-neutral-200 backdrop-blur-md transition-colors hover:border-white/20 hover:bg-white/12 hover:text-white"
      >
        {buttonText}
        <ArrowRight
          size={14}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  );
}
