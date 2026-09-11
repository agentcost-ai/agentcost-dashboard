"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/site";
import { track } from "@/lib/analytics";

interface CopyEmailProps {
  location: string;
  className?: string;
  /** Label shown before copying; defaults to the address itself. */
  children?: ReactNode;
  /** Show the copy/check icon after the label. */
  icon?: boolean;
}

/** Copies the contact address; falls back to mailto: where the clipboard is unavailable. */
export function CopyEmail({ location, className, children, icon = false }: CopyEmailProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      track("email_copied", { location });
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  }

  const Icon = copied ? Check : Copy;

  return (
    <>
      {/* A live region outside the button: an aria-label would mask the text change. */}
      <span className="sr-only" role="status">
        {copied ? `${CONTACT_EMAIL} copied to clipboard` : ""}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${CONTACT_EMAIL}`}
        className={`cursor-pointer ${className ?? ""}`}
      >
        {children ? (
          copied ? "Copied" : children
        ) : (
          // The address stays put; "Copied" floats above it so the sentence never reflows.
          <span className="relative">
            {CONTACT_EMAIL}
            {copied ? (
              <span className="pointer-events-none absolute left-1/2 -top-7 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[11px] font-medium leading-4 text-[#0a0a0b] no-underline">
                Copied
              </span>
            ) : null}
          </span>
        )}
        {icon ? <Icon className="size-3.5" aria-hidden /> : null}
      </button>
    </>
  );
}
