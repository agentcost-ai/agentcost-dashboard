"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AnnotatedArrowProps {
  /** Handwritten note. */
  label: string;
  /** Which way the arrow points (toward the thing being annotated). */
  dir?: "left" | "up";
  className?: string;
  labelClassName?: string;
  /** Seconds to wait before the draw-in starts (sync with the hero entrance). */
  delay?: number;
}

/**
 * Hand-drawn annotation — a sketched arrow that draws itself in, plus a
 * handwritten note (Caveat). Our signature flourish for pointing at things on
 * the landing page. Decorative, so pointer-events-none and aria-hidden;
 * position it with `className` relative to whatever it annotates. The draw-in
 * plays once on mount (i.e. on each page load).
 */
export function AnnotatedArrow({
  label,
  dir = "left",
  className,
  labelClassName,
  delay = 0.4,
}: AnnotatedArrowProps) {
  // Per-stroke draw-in (curve first, arrowhead just after).
  const stroke = (i: number) => ({
    initial: { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 1 },
    transition: {
      pathLength: { duration: 0.55, delay: delay + i * 0.18, ease: "easeInOut" as const },
      opacity: { duration: 0.01, delay: delay + i * 0.18 },
    },
  });

  const note = (
    <motion.span
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: delay + 0.5 }}
      className={cn(
        "font-handwriting whitespace-nowrap text-[21px] leading-none text-sky-300/90",
        labelClassName,
      )}
    >
      {label}
    </motion.span>
  );

  if (dir === "up") {
    return (
      <div
        aria-hidden
        className={cn(
          "pointer-events-none flex select-none flex-col items-center gap-1",
          className,
        )}
      >
        <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
          <motion.path
            d="M19 37 C 15 26, 23 17, 19 5"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            className="text-sky-400/80"
            {...stroke(0)}
          />
          <motion.path
            d="M13 11 L 19 4 L 25 11"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-sky-400/80"
            {...stroke(1)}
          />
        </svg>
        <span className="-rotate-2">{note}</span>
      </div>
    );
  }

  // dir === "left": arrow points left, note sits to the right.
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none flex select-none items-center gap-1.5",
        className,
      )}
    >
      <svg width="50" height="28" viewBox="0 0 50 28" fill="none">
        <motion.path
          d="M48 7 C 31 2, 15 7, 5 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="text-sky-400/80"
          {...stroke(0)}
        />
        <motion.path
          d="M4 6 L 3 17 L 13 15"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-sky-400/80"
          {...stroke(1)}
        />
      </svg>
      <span className="-rotate-3">{note}</span>
    </div>
  );
}
