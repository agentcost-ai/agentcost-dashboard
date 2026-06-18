/**
 * Demo mode state + lightweight usage tracking.
 *
 * The demo itself is fully client-side (see demoApi.ts) and works even if
 * the backend is unreachable. Tracking pings are fire-and-forget so the
 * admin panel can report demo adoption and demo→signup conversion.
 */

const DEMO_FLAG_KEY = "agentcost_demo_mode";
const DEMO_SESSION_KEY = "agentcost_demo_session_id";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type DemoTrackEvent =
  | "demo_start"
  | "page_view"
  | "signup_click"
  | "signup_completed"
  | "demo_exit";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_FLAG_KEY) === "true";
}

/**
 * The demo session id outlives demo mode itself (it is NOT cleared on exit)
 * so a signup that happens after leaving the demo still attributes back to
 * the originating demo session.
 */
export function getDemoSessionId(): string {
  let id = localStorage.getItem(DEMO_SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEMO_SESSION_KEY, id);
  }
  return id;
}

export function enterDemoMode(source?: string | null): void {
  localStorage.setItem(DEMO_FLAG_KEY, "true");
  trackDemo("demo_start", { source: source || "direct" });
}

export function exitDemoMode(track = true): void {
  if (!isDemoMode()) return;
  if (track) trackDemo("demo_exit");
  localStorage.removeItem(DEMO_FLAG_KEY);
}

/** Fire-and-forget tracking ping. Never throws, never blocks the UI. */
export function trackDemo(
  event: DemoTrackEvent,
  extra?: { page?: string; source?: string },
): void {
  if (typeof window === "undefined") return;
  try {
    const payload = JSON.stringify({
      session_id: getDemoSessionId(),
      event_type: event,
      page: extra?.page ?? null,
      source: extra?.source ?? null,
      referrer: document.referrer || null,
    });
    // keepalive lets the ping survive page navigations (e.g. signup_click).
    fetch(`${API_URL}/v1/demo/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never break the demo.
  }
}
