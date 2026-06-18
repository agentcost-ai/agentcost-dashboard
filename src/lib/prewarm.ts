/**
 * Backend pre-warming for sleep-prone hosts (e.g. Render free tier, which
 * spins the service down after inactivity and takes 30–60s to cold start).
 *
 * Strategy: instead of an always-on keep-alive (which would burn the host's
 * limited free hours on nobody), we wake the backend ONLY when a real human
 * is browsing and is plausibly heading toward an action that needs it —
 * landing pages, the demo, and auth. By signup time the service is already
 * warm, so the cold start is invisible. When no one is around, the backend
 * is left to sleep and no hours are spent.
 *
 * The ping is fire-and-forget against the public /health endpoint and is
 * throttled per browser so route changes don't hammer it.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PREWARM_TS_KEY = "agentcost_prewarm_ts";

// A cold-started service stays up ~15 min after a request. Re-pinging every
// ~4 min while someone is actively browsing keeps it warm through a whole
// session without redundant calls.
const THROTTLE_MS = 4 * 60 * 1000;

/**
 * Wake the backend if it might be asleep.
 *
 * @param force  Bypass the throttle. Use on high-intent actions (clicking
 *               "Create account") where we want it hot immediately.
 */
export function prewarmBackend(force = false): void {
  if (typeof window === "undefined") return;
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(PREWARM_TS_KEY) || 0);
    if (!force && now - last < THROTTLE_MS) return;
    sessionStorage.setItem(PREWARM_TS_KEY, String(now));

    // keepalive lets the ping survive a navigation (e.g. fired on a CTA click
    // that immediately routes to /auth/register).
    fetch(`${API_URL}/v1/health`, {
      method: "GET",
      cache: "no-store",
      keepalive: true,
    }).catch(() => {
      // Backend asleep/unreachable — the request itself is what wakes it, so
      // a failed/slow response here is expected and harmless.
    });
  } catch {
    // Pre-warming must never affect the page.
  }
}
