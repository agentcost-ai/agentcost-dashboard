/**
 * Demo mode API resolver.
 *
 * In demo mode the ApiClient routes every request here instead of the
 * network. Reads are served from the deterministic demo dataset; writes are
 * blocked and converted into a signup prompt (the conversion moment) via a
 * window event that DemoSignupModal listens for.
 */

import {
  demoOverview,
  demoAgentStats,
  demoModelStats,
  demoTimeSeries,
  demoEvents,
  demoEventCount,
  demoOptimizationSuggestions,
  demoOptimizationSummary,
  demoExecutiveReport,
  demoRecommendations,
  demoProject,
  demoProjectList,
  demoBudget,
  demoMembers,
  demoProfile,
  demoSessions,
  demoNotifications,
} from "./demoData";

export const DEMO_SIGNUP_PROMPT_EVENT = "demo-signup-prompt";

/** Human-readable label for the action the visitor tried to perform. */
function describeAction(endpoint: string, method: string): string {
  if (endpoint.includes("/optimizations")) return "act on optimizations";
  if (endpoint.includes("/members")) return "invite your team";
  if (endpoint.includes("/budget")) return "set budgets and alerts";
  if (endpoint.includes("/api-key")) return "manage API keys";
  if (endpoint.includes("/feedback")) return "submit feedback";
  if (endpoint.includes("/projects") && method === "POST")
    return "create a project";
  if (endpoint.includes("/projects") && method === "DELETE")
    return "manage projects";
  if (endpoint.includes("/auth/")) return "manage your account";
  return "save changes";
}

/** Open the conversion modal and abort the write with a friendly error. */
function blockWrite(endpoint: string, method: string): never {
  const action = describeAction(endpoint, method);
  window.dispatchEvent(
    new CustomEvent(DEMO_SIGNUP_PROMPT_EVENT, { detail: { action } }),
  );
  throw new Error(
    "Demo mode is read-only — create a free account to " + action + ".",
  );
}

function param(endpoint: string, key: string): string | null {
  const queryIndex = endpoint.indexOf("?");
  if (queryIndex === -1) return null;
  return new URLSearchParams(endpoint.slice(queryIndex + 1)).get(key);
}

// In-memory read state so "mark as read" feels alive within the session.
const readNotificationIds = new Set<string>();

function notificationsWithReadState() {
  const base = demoNotifications();
  const items = base.items.map((n) =>
    readNotificationIds.has(n.id)
      ? { ...n, is_read: true, read_at: new Date().toISOString() }
      : n,
  );
  const unread = items.filter((n) => !n.is_read).length;
  return { items, total: items.length, unread_count: unread };
}

/** Small artificial latency so loading states render naturally. */
function delay(): Promise<void> {
  return new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
}

export async function resolveDemoRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  await delay();
  const method = (options.method || "GET").toUpperCase();
  const path = endpoint.split("?")[0];

  // ── Writes that are allowed to "work" in-session ──
  if (method === "POST" && /^\/v1\/notifications\/[^/]+\/read$/.test(path)) {
    readNotificationIds.add(path.split("/")[3]);
    return null as T;
  }
  if (method === "POST" && path === "/v1/notifications/read-all") {
    demoNotifications().items.forEach((n) => readNotificationIds.add(n.id));
    return { unread_count: 0 } as T;
  }

  // ── Everything else mutating → conversion prompt ──
  if (method !== "GET") {
    blockWrite(endpoint, method);
  }

  // ── Reads ──
  if (path === "/v1/health") {
    return {
      status: "ok",
      version: "demo",
      timestamp: new Date().toISOString(),
    } as T;
  }

  if (path === "/v1/analytics/overview") {
    return demoOverview(param(endpoint, "range") ?? "7d") as T;
  }
  if (path === "/v1/analytics/agents") {
    return demoAgentStats(
      param(endpoint, "range") ?? "7d",
      Number(param(endpoint, "limit") ?? 10),
    ) as T;
  }
  if (path === "/v1/analytics/models") {
    return demoModelStats(
      param(endpoint, "range") ?? "7d",
      Number(param(endpoint, "limit") ?? 10),
    ) as T;
  }
  if (path === "/v1/analytics/timeseries") {
    return demoTimeSeries(param(endpoint, "range") ?? "7d") as T;
  }
  if (path === "/v1/analytics/report") {
    return demoExecutiveReport({
      range: param(endpoint, "range") ?? undefined,
      start: param(endpoint, "start") ?? undefined,
      end: param(endpoint, "end") ?? undefined,
      topN: Number(param(endpoint, "top_n") ?? 10),
    }) as T;
  }
  if (path === "/v1/analytics/full") {
    const days = Number(param(endpoint, "days") ?? 7);
    const range = days >= 90 ? "90d" : days >= 30 ? "30d" : days >= 7 ? "7d" : "24h";
    return {
      overview: demoOverview(range),
      agents: demoAgentStats(range, 10),
      models: demoModelStats(range, 10),
      timeseries: demoTimeSeries(range),
    } as T;
  }

  if (path === "/v1/events/count") {
    return { count: demoEventCount() } as T;
  }
  if (path === "/v1/events") {
    const limit = Number(param(endpoint, "limit") ?? 100);
    const offset = Number(param(endpoint, "offset") ?? 0);
    const agentName = param(endpoint, "agent_name");
    const model = param(endpoint, "model");
    let events = demoEvents();
    if (agentName) events = events.filter((e) => e.agent_name === agentName);
    if (model) events = events.filter((e) => e.model === model);
    return events.slice(offset, offset + limit) as T;
  }

  if (path === "/v1/optimizations") {
    return demoOptimizationSuggestions() as T;
  }
  if (path === "/v1/optimizations/summary") {
    return demoOptimizationSummary() as T;
  }
  if (path === "/v1/optimizations/recommendations") {
    return demoRecommendations() as T;
  }
  if (path === "/v1/optimizations/recommendations/effectiveness") {
    const e = demoOptimizationSummary().effectiveness!;
    return {
      total_recommendations: e.total_recommendations,
      implemented: e.implemented,
      dismissed: e.dismissed,
      pending: e.pending,
      expired: e.expired,
      implementation_rate: e.implementation_rate,
      total_estimated_savings: e.estimated_savings_total,
      total_actual_savings: e.actual_savings_total,
      savings_accuracy: e.accuracy_percent,
    } as T;
  }

  if (path === "/v1/projects/me") {
    return demoProject() as T;
  }
  if (path === "/v1/projects") {
    return demoProjectList() as T;
  }
  if (path === "/v1/projects/invitations/pending") {
    return { invitations: [], total: 0 } as T;
  }
  if (/^\/v1\/projects\/[^/]+\/budget$/.test(path)) {
    return demoBudget() as T;
  }
  if (/^\/v1\/projects\/[^/]+\/members$/.test(path)) {
    const members = demoMembers();
    return { members, total: members.length } as T;
  }
  if (/^\/v1\/projects\/[^/]+$/.test(path)) {
    return demoProject() as T;
  }

  if (path === "/v1/currency/rate") {
    return {
      base: "USD",
      target: param(endpoint, "target") ?? "USD",
      rate: 1,
      source: "demo",
    } as T;
  }

  if (path === "/v1/auth/me") {
    return demoProfile() as T;
  }
  if (path === "/v1/auth/sessions") {
    return demoSessions() as T;
  }

  if (path === "/v1/notifications") {
    return notificationsWithReadState() as T;
  }
  if (path === "/v1/notifications/unread-count") {
    return { unread_count: notificationsWithReadState().unread_count } as T;
  }

  if (path === "/v1/feedback") {
    return { items: [], total: 0, limit: 50, offset: 0 } as T;
  }
  if (path === "/v1/feedback/summary") {
    return { total: 0, by_type: {}, by_status: {} } as T;
  }
  if (path === "/v1/attachments/config/limits") {
    return {
      max_file_size: 5 * 1024 * 1024,
      max_files_per_feedback: 3,
      allowed_extensions: [".png", ".jpg", ".jpeg", ".pdf", ".txt"],
      allowed_mime_types: ["image/png", "image/jpeg", "application/pdf", "text/plain"],
    } as T;
  }

  // Unknown read endpoint — return an empty object rather than erroring so
  // future pages degrade gracefully in demo mode.
  console.warn(`[demo] Unhandled demo endpoint: ${method} ${endpoint}`);
  return {} as T;
}
