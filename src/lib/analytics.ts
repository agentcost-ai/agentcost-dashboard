/**
 * Thin wrapper around GA4's gtag for funnel events (see layout.tsx for the
 * tag itself). Safe to call anywhere: no-ops during SSR, when gtag hasn't
 * loaded (ad blockers), or if GA is down — analytics must never break the app.
 *
 * Funnel events used across the site:
 *   demo_opened             { src }       — /demo entered (src = hero|navbar|...)
 *   click_signup            { location }  — any "Get started" CTA clicked
 *                                           (docs | demo_banner | demo_modal |
 *                                            demo_optimizations | ...)
 *   signup_started          { method }    — registration form submitted
 *   signup_completed        { method }    — account created (email|google|github)
 *   login_completed         { method }    — successful sign-in (email|google|github)
 *   email_verified                        — verification link succeeded
 *   onboarding_viewed                     — get-started screen shown
 *   api_key_copied                        — onboarding init snippet copied
 *   project_created                       — project created from settings
 *   first_data_seen                       — first non-demo events for a project
 *   openai_import_started                 — OpenAI spend import submitted
 *   openai_import_succeeded { total_usd } — import rendered (rounded total)
 *   openai_import_failed                  — import errored
 *   github_clicked          { location }  — outbound click to the GitHub repo
 *   sdk_install_started     { location }  — pip-install command copied
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
