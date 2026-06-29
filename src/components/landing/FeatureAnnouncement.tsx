"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface FeatureAnnouncementProps {
  /** Short tag, e.g. "New" or "Just shipped". */
  badge?: string;
  /** The announcement copy. */
  children: React.ReactNode;
  /** Where the pill links to. */
  href: string;
  className?: string;
}

/**
 * Reusable "what's new" pill for the landing hero. Drop it in with a fresh
 * label + href on each release — single-hue sky, flat fills.
 */
export function FeatureAnnouncement({
  badge = "New",
  children,
  href,
  className,
}: FeatureAnnouncementProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2.5 rounded-full border border-sky-500/25 bg-sky-500/[0.06] py-1.5 pl-1.5 pr-4 text-[13px] backdrop-blur-sm transition-colors duration-200 hover:border-sky-400/40 hover:bg-sky-500/10",
        className,
      )}
    >
      <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-sky-300">
        {badge}
      </span>
      <span className="text-neutral-300 transition-colors group-hover:text-white">
        {children}
      </span>
    </Link>
  );
}
