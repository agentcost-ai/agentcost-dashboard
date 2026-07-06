/**
 * Thin wrapper around GA4's gtag for funnel events (see layout.tsx for the
 * tag itself). Safe to call anywhere: no-ops during SSR, when gtag hasn't
 * loaded (ad blockers), or if GA is down — analytics must never break the app.
 *
 * Funnel events used across the site:
 *   demo_opened          { src }        — /demo entered (src = hero|navbar|...)
 *   click_signup         { location }   — any "Get started" CTA clicked
 *   signup_started       { method }     — registration form submitted
 *   signup_completed     { method }     — account created (email | google)
 *   github_clicked       { location }   — outbound click to the GitHub repo
 *   sdk_install_started  { location }   — pip-install command copied
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(
  event: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
  } catch {
    // Never let analytics interfere with the page.
  }
}
