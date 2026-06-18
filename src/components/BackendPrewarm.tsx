"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { prewarmBackend } from "@/lib/prewarm";

/**
 * Mounted once at the app root. Fires a throttled backend wake-up on initial
 * load and on every route change, so the service is warm by the time a
 * visitor reaches a backend-dependent action (signup / login). The throttle
 * in prewarmBackend() keeps this to at most one ping every few minutes per
 * browser, so the host only burns hours while someone is genuinely active.
 */
export function BackendPrewarm() {
  const pathname = usePathname();

  useEffect(() => {
    prewarmBackend();
  }, [pathname]);

  return null;
}
