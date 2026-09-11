"use client";

import type { ReactNode } from "react";
import { BOOKING_URL } from "@/lib/site";
import { track } from "@/lib/analytics";

interface BookingLinkProps {
  /** Where on the site the link lives, for the booking_clicked event. */
  location: string;
  className?: string;
  children: ReactNode;
}

/** Outbound link to the Cal.com page. Renders nothing until BOOKING_URL is set. */
export function BookingLink({ location, className, children }: BookingLinkProps) {
  if (!BOOKING_URL) return null;
  return (
    <a
      href={BOOKING_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("booking_clicked", { location })}
      className={className}
    >
      {children}
    </a>
  );
}
