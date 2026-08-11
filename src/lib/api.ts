/**
 * API configuration and client for AgentCost backend
 */

import { isDemoMode } from "@/lib/demo/demo";
import { resolveDemoRequest } from "@/lib/demo/demoApi";

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface AnalyticsOverview {
  total_cost: number;
  total_calls: number;
  total_tokens: number;
  total_input_tokens: number;
  total_output_tokens: number;
  avg_cost_per_call: number;
  avg_tokens_per_call: number;
  avg_latency_ms: number;
  success_rate: number;
}

export interface AgentStats {
  agent_name: string;
  total_calls: number;
  total_cost: number;
  total_tokens: number;
  avg_latency_ms: number;
  success_rate: number;
}

export interface WorkflowStats {
  workflow: string;
  runs: number;
  total_cost: number;
  avg_cost_per_run: number;
  max_cost_per_run: number;
  total_tokens: number;
  total_calls: number;
  avg_calls_per_run: number;
  avg_steps_per_run: number;
  max_depth: number;
  success_rate: number;
}

export interface StepStats {
  workflow: string | null;
  step_name: string;
  calls: number;
  runs: number;
  /** Above 1 means the step ran more than once inside a single run. */
  calls_per_run: number;
  total_cost: number;
  cost_per_run: number;
  total_tokens: number;
  avg_latency_ms: number;
  success_rate: number;
}

export interface ToolStats {
  tool_name: string;
  calls: number;
  runs: number;
  total_cost: number;
  total_tokens: number;
  avg_latency_ms: number;
}

export interface RepeatedWorkFinding {
  trace_id: string;
  workflow: string | null;
  step_name: string | null;
  model: string;
  input_hash: string;
  occurrences: number;
  spend: number;
  /** Cost of the repeats beyond the first — what a correct run would save. */
  wasted_cost: number;
  first_seen: string | null;
}

export interface OutcomeStats {
  workflow: string | null;
  runs: number;
  succeeded: number;
  failed: number;
  /** Runs that never called track_costs.outcome(). */
  unknown: number;
  total_cost: number;
  cost_on_success: number;
  cost_on_failure: number;
  /** Total spend divided by successes — failures are charged to the wins. */
  cost_per_success: number | null;
  success_rate: number | null;
}

export interface CostBucket {
  lower: number;
  upper: number;
  count: number;
  /** Server-marked so every client draws the same tail. */
  is_tail: boolean;
}

export interface RunCostDistribution {
  workflow: string | null;
  runs: number;
  /** True when the window exceeded the server's row cap. */
  truncated: boolean;
  total_cost: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  tail_runs: number;
  /** Lowest cost among the top 5% of runs, by rank. */
  tail_threshold: number;
  /** Share of the workflow's spend held by those runs. */
  tail_share_percent: number;
  /** p99 / p50 — how much worse the bad runs are than the typical one. */
  tail_ratio: number | null;
  histogram: CostBucket[];
}

export interface TraceSummary {
  trace_id: string;
  workflow: string | null;
  calls: number;
  total_cost: number;
  total_tokens: number;
  max_depth: number;
  failed_calls: number;
  started_at: string | null;
  duration_ms: number | null;
}

export interface ModelStats {
  model: string;
  total_calls: number;
  total_cost: number;
  total_tokens: number;
  avg_latency_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_share?: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  cost: number;
  calls: number;
  tokens: number;
}

// ── Executive Report ──────────────────────────────────────────────────────

export interface MetricDelta {
  current: number;
  previous: number;
  change_percent: number;
  direction: "up" | "down" | "neutral";
}

export interface ReportSummary {
  cost: MetricDelta;
  calls: MetricDelta;
  tokens: MetricDelta;
  success_rate: MetricDelta;
  avg_latency_ms: MetricDelta;
  blended_cost_per_1k: number;
  in_out_ratio: number;
}

export interface LatencyPercentiles {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  sample_size: number;
  approximate: boolean;
}

export interface ModelEfficiency {
  model: string;
  cost_per_1k: number;
  in_out_ratio: number;
}

export interface TokenEfficiency {
  blended_cost_per_1k: number;
  in_out_ratio: number;
  total_input_tokens: number;
  total_output_tokens: number;
  by_model: ModelEfficiency[];
}

export interface ParetoInfo {
  top_count: number;
  top_share: number;
  total_models: number;
}

export interface CadenceBucket {
  label: string;
  index: number;
  calls: number;
  cost: number;
}

export interface UsageCadence {
  busiest_day: string | null;
  busiest_hour: string | null;
  by_dow: CadenceBucket[];
  by_hour: CadenceBucket[];
}

export interface ErrorBreakdownRow {
  model: string;
  total_calls: number;
  error_count: number;
  error_rate: number;
}

export interface TopError {
  error: string;
  count: number;
}

export interface RunRateProjection {
  daily_avg_cost: number;
  projected_monthly_cost: number;
  window_days: number;
}

export interface ReportBudgetStatus {
  enabled: boolean;
  budget: number | null;
  current_spend: number;
  projected_spend: number;
  utilization_percent: number | null;
  currency: string;
  fx_rate: number;
  mode: string;
}

export interface SavingsRollup {
  total_potential_savings_monthly: number;
  total_potential_savings_percent: number;
  suggestion_count: number;
  high_priority_count: number;
  top_suggestions: OptimizationSuggestion[];
}

export interface ExecutiveReport {
  generated_at: string;
  range_label: string;
  period_start: string;
  period_end: string;
  previous_period_start: string;
  previous_period_end: string;
  is_custom_range: boolean;
  project_name: string;
  currency: string;
  summary: ReportSummary;
  overview: AnalyticsOverview;
  timeseries: TimeSeriesPoint[];
  models: ModelStats[];
  model_pareto: ParetoInfo;
  agents: AgentStats[];
  agent_cost_share: Record<string, number>;
  latency: LatencyPercentiles;
  efficiency: TokenEfficiency;
  errors: ErrorBreakdownRow[];
  top_errors: TopError[];
  cadence: UsageCadence;
  run_rate: RunRateProjection;
  budget: ReportBudgetStatus;
  savings: SavingsRollup;
}

export interface Event {
  id: string;
  project_id: string;
  agent_name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
  latency_ms: number;
  timestamp: string;
  success: boolean;
  error: string | null;
  /** Null for calls made outside a workflow(). */
  trace_id?: string | null;
  workflow?: string | null;
  step_name?: string | null;
  tool_name?: string | null;
}

export interface OptimizationSuggestion {
  type: string;
  title: string;
  description: string;
  estimated_savings_monthly: number | null;
  estimated_savings_percent: number;
  priority: "high" | "medium" | "low";
  action_items: string[];
  agent_name?: string | null;
  model?: string | null;
  alternative_model?: string | null;
  metrics?: {
    current_calls?: number;
    current_monthly_cost?: number;
    avg_output_tokens?: number;
    avg_input_tokens?: number;
    savings_percentage?: number;
    quality_impact?: string | null;
    duplicate_rate?: number;
    error_rate?: number;
    z_score?: number;
    // non_llm_candidate
    calls?: number;
    distinct_inputs?: number;
    repeat_rate?: number;
    max_output_tokens?: number;
    window_cost?: number;
    /** True when the saving is this line's whole cost, not a modelled delta. */
    savings_is_ceiling?: boolean;
    savings_estimated?: boolean;
    coverage_days?: number | null;
    capability_requirements?: {
      requires_vision?: "true" | "false" | "unknown";
      requires_function_calling?: "true" | "false" | "unknown";
      requires_json_mode?: "true" | "false" | "unknown";
    };
    // Confidence data for "Proven" vs "Suggested" badge
    source?: "learned" | "dynamic" | null;
    confidence_score?: number | null;
    times_implemented?: number | null;
    savings_accuracy?: number | null;
  };
}

export interface OptimizationSummary {
  total_potential_savings_monthly: number;
  total_potential_savings_percent: number;
  current_monthly_spend?: number;
  suggestion_count: number;
  high_priority_count: number;
  by_type?: Record<string, { count: number; savings: number }>;
  effectiveness?: {
    total_recommendations: number;
    implemented: number;
    dismissed: number;
    pending: number;
    expired: number;
    implementation_rate: number;
    estimated_savings_total: number;
    actual_savings_total: number;
    accuracy_percent: number;
  };
  suggestions: OptimizationSuggestion[];
  // Empty state context
  has_data?: boolean;
  has_baselines?: boolean;
  event_count?: number;
  empty_reason?:
    | "no_data"
    | "insufficient_data"
    | "no_baselines"
    | "optimized"
    | null;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  agent_name?: string | null;
  model?: string | null;
  alternative_model?: string | null;
  estimated_monthly_savings: number;
  estimated_savings_percent: number;
  created_at: string;
  expires_at: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
  api_key: string | null;
  key_prefix?: string | null;
  created_at: string;
  is_active: boolean;
  monthly_budget_usd?: number | null;
  budget_enforcement_mode?: "off" | "warn" | "hard_cap";
  budget_alert_thresholds?: number[] | null;
}

export type BudgetCurrency = "USD" | "INR";

export interface ProjectBudgetSettings {
  project_id: string;
  monthly_budget_usd: number | null;
  budget_enforcement_mode: "off" | "warn" | "hard_cap";
  budget_alert_thresholds: number[];
  current_month_spend: number;
  current_month_spend_usd: number;
  utilization_percent: number | null;
  period_key: string;
  budget_currency: BudgetCurrency;
  fx_rate: number;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  role: "admin" | "member" | "viewer";
  is_owner: boolean;
  is_pending: boolean;
  created_at: string | null;
}

export interface ProjectMember {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  role: "admin" | "member" | "viewer";
  is_owner: boolean;
  is_pending: boolean;
  invited_at: string | null;
  accepted_at: string | null;
}

export interface PendingInvitation {
  project_id: string;
  project_name: string;
  role: "admin" | "member" | "viewer";
  invited_by: { name: string | null; email: string } | null;
  invited_at: string;
}

export type FeedbackType =
  | "feature_request"
  | "bug_report"
  | "model_request"
  | "general"
  | "security_report"
  | "performance_issue";

export type FeedbackStatus =
  | "open"
  | "under_review"
  | "needs_info"
  | "in_progress"
  | "completed"
  | "shipped"
  | "rejected"
  | "duplicate";

export type FeedbackPriority = "low" | "medium" | "high" | "critical";

export interface FeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  upvotes: number;
  user_has_upvoted: boolean;
  model_name?: string | null;
  model_provider?: string | null;
  admin_response?: string | null;
  created_at: string;
  updated_at: string;
  comment_count: number;
  user_name?: string | null;
  metadata?: Record<string, unknown> | null;
  attachments?: AttachmentMeta[] | null;
  environment?: string | null;
  is_confidential?: boolean;
}

export interface FeedbackListResponse {
  items: FeedbackItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface FeedbackSummaryResponse {
  total: number;
  by_type: Record<string, number>;
  by_status: Record<string, number>;
}

export interface FeedbackComment {
  id: string;
  user_name?: string | null;
  comment: string;
  is_admin: boolean;
  created_at: string;
}

export interface AttachmentMeta {
  id: string;
  name: string;
  stored_name: string;
  type: string;
  size: number;
  storage: string;
  path: string;
}

export interface AttachmentLimits {
  max_file_size: number;
  max_files_per_feedback: number;
  allowed_extensions: string[];
  allowed_mime_types: string[];
}

export type NotificationSeverity = "info" | "warning" | "critical";

export interface NotificationItem {
  id: string;
  type: string;
  severity: NotificationSeverity;
  title: string;
  body: string | null;
  link: string | null;
  project_id: string | null;
  payload: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  total: number;
  unread_count: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  auth_provider: string;
  user_number: number | null;
  milestone_badge: string | null;
}

export interface SessionInfo {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  last_used_at: string;
  expires_at: string;
  is_current: boolean;
}

// ── Stored config (localStorage: "agentcost_config") ───────────────────────
// v1 held a single { apiKey, projectId } pair, which meant switching projects
// could silently authenticate requests with ANOTHER project's key. v2 keeps a
// per-project key map plus the owning user id, so keys survive logout but
// never cross projects or accounts. v1 fields are still read (and mirrored on
// write) for back-compat with older bundles in other tabs.
type RawStoredConfig = {
  apiKeys?: Record<string, string>; // v2: projectId -> apiKey
  ownerUserId?: string; // v2: which account these keys belong to
  apiKey?: string; // v1: single key…
  projectId?: string; // …saved for this project
  baseUrl?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
};

function readRawConfig(): RawStoredConfig {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("agentcost_config") || "{}");
  } catch {
    return {};
  }
}

function writeRawConfig(cfg: RawStoredConfig): void {
  localStorage.setItem("agentcost_config", JSON.stringify(cfg));
  window.dispatchEvent(new Event("agentcost_config_updated"));
}

/** Resolve the key stored for one project. A v1 single key only counts when
 *  it was saved for that same project. Returns "" when nothing is stored. */
export function getStoredApiKeyForProject(projectId: string | null): string {
  if (!projectId) return "";
  const cfg = readRawConfig();
  if (cfg.apiKeys?.[projectId]) return cfg.apiKeys[projectId];
  if (cfg.projectId === projectId && cfg.apiKey) return cfg.apiKey;
  return "";
}

/** Fold a v1 single-key pair into the v2 map so overwriting the v1 mirror
 *  never destroys the browser's only copy of another project's key. */
function adoptLegacyKey(cfg: RawStoredConfig): void {
  if (cfg.apiKey && cfg.projectId && !cfg.apiKeys?.[cfg.projectId]) {
    cfg.apiKeys = { ...cfg.apiKeys, [cfg.projectId]: cfg.apiKey };
  }
}

/** Legacy fallback for when no active/JWT project is resolved: the v1 pair,
 *  or the sole map entry. Keeps SDK-only setups working. */
export function getFallbackProjectKey(): {
  projectId: string;
  apiKey: string;
} {
  const cfg = readRawConfig();
  if (cfg.projectId && cfg.apiKey) {
    return { projectId: cfg.projectId, apiKey: cfg.apiKey };
  }
  const entries = Object.entries(cfg.apiKeys ?? {});
  if (entries.length === 1) {
    return { projectId: entries[0][0], apiKey: entries[0][1] };
  }
  return { projectId: "", apiKey: "" };
}

/** Store a project's API key, remembering which account it belongs to. */
export function storeProjectApiKey(
  projectId: string,
  apiKey: string,
  ownerUserId?: string,
): void {
  const cfg = readRawConfig();
  adoptLegacyKey(cfg);
  cfg.apiKeys = { ...cfg.apiKeys, [projectId]: apiKey };
  // Mirror to the v1 fields so an older bundle in another tab keeps working.
  cfg.apiKey = apiKey;
  cfg.projectId = projectId;
  if (ownerUserId) cfg.ownerUserId = ownerUserId;
  writeRawConfig(cfg);
}

/** Drop a single project's key (e.g. after the project is deleted). */
export function removeStoredProjectApiKey(projectId: string): void {
  const cfg = readRawConfig();
  adoptLegacyKey(cfg);
  if (cfg.apiKeys) delete cfg.apiKeys[projectId];
  if (cfg.projectId === projectId) {
    delete cfg.apiKey;
    delete cfg.projectId;
  }
  writeRawConfig(cfg);
}

/**
 * Keep stored keys scoped to the signed-in account. Called on login/session
 * restore: adopts pre-v2 configs that have no owner (the old code cleared the
 * config on logout, so an existing one can only belong to the signed-in user)
 * and wipes all keys when a DIFFERENT account signs in on this browser.
 */
export function reconcileStoredConfigOwner(userId: string): void {
  const cfg = readRawConfig();
  const hasKeys = !!cfg.apiKey || Object.keys(cfg.apiKeys ?? {}).length > 0;
  if (!hasKeys && !cfg.ownerUserId) return;
  if (!cfg.ownerUserId) {
    adoptLegacyKey(cfg);
    cfg.ownerUserId = userId;
    writeRawConfig(cfg);
    return;
  }
  if (cfg.ownerUserId !== userId) {
    writeRawConfig({
      autoRefresh: cfg.autoRefresh,
      refreshInterval: cfg.refreshInterval,
      baseUrl: cfg.baseUrl,
      ownerUserId: userId,
    });
    localStorage.removeItem("agentcost_active_project_id");
    window.dispatchEvent(new Event("agentcost_active_project_changed"));
  }
}

// Get config from localStorage (client-side only)
function getStoredConfig(): {
  apiKey: string;
  baseUrl: string;
  authToken: string | null;
  activeProjectId: string | null;
} {
  if (typeof window === "undefined") {
    return {
      apiKey: "",
      baseUrl: DEFAULT_API_BASE_URL,
      authToken: null,
      activeProjectId: null,
    };
  }

  try {
    const saved = localStorage.getItem("agentcost_config");
    const authToken = localStorage.getItem("access_token");
    const storedActiveId =
      localStorage.getItem("agentcost_active_project_id") || null;

    if (saved) {
      const parsed = JSON.parse(saved) as RawStoredConfig;
      const activeProjectId = storedActiveId || parsed.projectId || null;
      // Only authenticate with a key that belongs to the active project —
      // a v1 key saved for a different project must NOT be used (it would
      // silently serve that other project's data). With no active project
      // at all (legacy SDK-only setups), fall back to the v1 key.
      const projectKey = activeProjectId
        ? (parsed.apiKeys?.[activeProjectId] ??
          (parsed.projectId === activeProjectId ? (parsed.apiKey ?? "") : ""))
        : (parsed.apiKey ?? "");
      return {
        apiKey: projectKey || process.env.NEXT_PUBLIC_API_KEY || "",
        baseUrl: parsed.baseUrl || DEFAULT_API_BASE_URL,
        authToken,
        activeProjectId,
      };
    }

    return {
      apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
      baseUrl: DEFAULT_API_BASE_URL,
      authToken,
      activeProjectId: storedActiveId,
    };
  } catch {
    // Ignore parse errors
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
    baseUrl: DEFAULT_API_BASE_URL,
    authToken: null,
    activeProjectId: null,
  };
}

class ApiClient {
  private getConfig() {
    return getStoredConfig();
  }

  /**
   * Determine the type of authentication needed for an endpoint.
   *
   * - 'project': Project-scoped data (analytics, events, optimizations). The
   *   backend accepts EITHER an SDK API key OR a JWT + ``project_id``. We
   *   prefer the API key when one is configured so existing users see no
   *   behavior change; team members with no API key fall through to the JWT
   *   path with the active project automatically injected as ``project_id``.
   * - 'jwt': User-level access (auth, feedback, projects list/create, members,
   *   notifications, attachments).
   * - 'none': Public endpoints like /health.
   */
  private getAuthType(
    endpoint: string,
  ): "project" | "jwt" | "none" {
    if (endpoint.includes("/health")) return "none";
    if (endpoint.includes("/auth/")) return "jwt";
    if (endpoint.startsWith("/v1/feedback")) return "jwt";
    if (endpoint.startsWith("/v1/attachments")) return "jwt";
    if (endpoint.startsWith("/v1/notifications")) return "jwt";

    // /v1/projects collection — list (GET) and create (POST) both JWT.
    if (endpoint === "/v1/projects" || endpoint.startsWith("/v1/projects?")) {
      return "jwt";
    }
    // Member/invitation subroutes are JWT.
    if (
      endpoint.includes("/members") ||
      endpoint.includes("/invitations") ||
      endpoint.includes("/leave") ||
      endpoint.includes("/budget") ||
      endpoint.includes("/api-key/rotate")
    ) {
      return "jwt";
    }
    // /v1/projects/{id} (and variants like /me) — JWT for member-driven flows.
    if (endpoint.match(/\/v1\/projects\/[^/?]+($|\?)/) && !endpoint.includes("/me")) {
      return "jwt";
    }

    // Project-scoped read endpoints: dual-auth (API key OR JWT+project_id).
    return "project";
  }

  // token refresh mutex to prevent concurrent refresh storms
  private refreshPromise: Promise<boolean> | null = null;

  private async tryRefreshToken(): Promise<boolean> {
    // If a refresh is already in flight, piggyback on it
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._doRefreshToken();
    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _doRefreshToken(): Promise<boolean> {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;

    try {
      const { baseUrl } = this.getConfig();
      const response = await fetch(`${baseUrl}/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        // Notify AuthContext of token refresh
        window.dispatchEvent(
          new CustomEvent("tokens-refreshed", {
            detail: {
              access_token: data.access_token,
              refresh_token: data.refresh_token,
            },
          }),
        );
        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
    }

    // Notify AuthContext that refresh failed - should trigger logout
    window.dispatchEvent(new CustomEvent("token-refresh-failed"));
    return false;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    authOverride?: "api_key" | "jwt" | "none" | "project",
    retryOnUnauthorized = true,
  ): Promise<T> {
    // Demo mode: serve everything from the client-side demo dataset. No
    // network, no auth — the demo works even if the backend is down.
    if (typeof window !== "undefined" && isDemoMode()) {
      return resolveDemoRequest<T>(endpoint, options);
    }

    const { apiKey, baseUrl, authToken, activeProjectId } = this.getConfig();
    const authType = authOverride ?? this.getAuthType(endpoint);

    // Resolve the effective auth path for "project" mode:
    //   - apiKey present  -> use the API key (back-compat / SDK / solo users)
    //   - no apiKey + JWT -> JWT path; we'll inject ?project_id= below
    const effectiveAuth: "api_key" | "jwt" | "none" =
      authType === "project"
        ? apiKey
          ? "api_key"
          : "jwt"
        : (authType as "api_key" | "jwt" | "none");

    let resolvedEndpoint = endpoint;
    if (authType === "project" && effectiveAuth === "jwt") {
      if (!activeProjectId) {
        throw new Error(
          "API Error: 400 Bad Request - No active project selected. Open Settings to pick or create a project.",
        );
      }
      if (!authToken) {
        throw new Error(
          "API Error: 401 Unauthorized - Not signed in.",
        );
      }
      const separator = resolvedEndpoint.includes("?") ? "&" : "?";
      // Don't overwrite a project_id already in the URL.
      if (!/[?&]project_id=/.test(resolvedEndpoint)) {
        resolvedEndpoint = `${resolvedEndpoint}${separator}project_id=${encodeURIComponent(activeProjectId)}`;
      }
    }

    // Build authorization header based on effective auth type
    let authHeader = "";
    if (effectiveAuth === "api_key" && apiKey) {
      authHeader = `Bearer ${apiKey}`;
    } else if (effectiveAuth === "jwt" && authToken) {
      authHeader = `Bearer ${authToken}`;
    }

    const response = await fetch(`${baseUrl}${resolvedEndpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
        ...options.headers,
      },
    });

    // Handle 401 with token refresh for JWT auth (covers both pure JWT and
    // "project" mode that fell through to JWT).
    if (
      response.status === 401 &&
      effectiveAuth === "jwt" &&
      retryOnUnauthorized
    ) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, authOverride, false);
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      );
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async getHealth(): Promise<{
    status: string;
    version: string;
    timestamp: string;
  }> {
    return this.request("/v1/health");
  }

  async getOverview(range: string = "7d"): Promise<AnalyticsOverview> {
    return this.request(`/v1/analytics/overview?range=${range}`);
  }

  async getAgentStats(
    range: string = "7d",
    limit: number = 10,
  ): Promise<AgentStats[]> {
    return this.request(`/v1/analytics/agents?range=${range}&limit=${limit}`);
  }

  // ── Trace analytics ──────────────────────────────────────────────────
  // Demo mode answers unmapped endpoints with {}, so every list here is
  // coerced: an object would otherwise reach .map() in the page and throw.

  async getWorkflowStats(
    range: string = "7d",
    limit: number = 20,
  ): Promise<WorkflowStats[]> {
    const data = await this.request<WorkflowStats[]>(
      `/v1/analytics/workflows?range=${range}&limit=${limit}`,
    );
    return Array.isArray(data) ? data : [];
  }

  async getStepStats(
    range: string = "7d",
    workflow?: string,
    limit: number = 50,
  ): Promise<StepStats[]> {
    const scope = workflow ? `&workflow=${encodeURIComponent(workflow)}` : "";
    const data = await this.request<StepStats[]>(
      `/v1/analytics/workflows/steps?range=${range}&limit=${limit}${scope}`,
    );
    return Array.isArray(data) ? data : [];
  }

  async getToolStats(
    range: string = "7d",
    limit: number = 50,
  ): Promise<ToolStats[]> {
    const data = await this.request<ToolStats[]>(
      `/v1/analytics/workflows/tools?range=${range}&limit=${limit}`,
    );
    return Array.isArray(data) ? data : [];
  }

  async getRepeatedWork(
    range: string = "7d",
    limit: number = 25,
  ): Promise<RepeatedWorkFinding[]> {
    const data = await this.request<RepeatedWorkFinding[]>(
      `/v1/analytics/workflows/repeated-work?range=${range}&limit=${limit}`,
    );
    return Array.isArray(data) ? data : [];
  }

  async getOutcomeStats(
    range: string = "7d",
    limit: number = 20,
  ): Promise<OutcomeStats[]> {
    const data = await this.request<OutcomeStats[]>(
      `/v1/analytics/workflows/outcomes?range=${range}&limit=${limit}`,
    );
    return Array.isArray(data) ? data : [];
  }

  async getRunCostDistribution(
    range: string = "7d",
    workflow?: string,
    buckets: number = 24,
  ): Promise<RunCostDistribution | null> {
    const scope = workflow ? `&workflow=${encodeURIComponent(workflow)}` : "";
    const data = await this.request<RunCostDistribution | null>(
      `/v1/analytics/workflows/distribution?range=${range}&buckets=${buckets}${scope}`,
    );
    // Demo mode answers unmapped endpoints with {}, and the chart reads
    // .histogram — treat anything without one as "no distribution".
    return data && Array.isArray(data.histogram) ? data : null;
  }

  async getTraces(
    range: string = "7d",
    workflow?: string,
    limit: number = 50,
  ): Promise<TraceSummary[]> {
    const scope = workflow ? `&workflow=${encodeURIComponent(workflow)}` : "";
    const data = await this.request<TraceSummary[]>(
      `/v1/analytics/traces?range=${range}&limit=${limit}${scope}`,
    );
    return Array.isArray(data) ? data : [];
  }

  async getModelStats(
    range: string = "7d",
    limit: number = 10,
  ): Promise<ModelStats[]> {
    return this.request(`/v1/analytics/models?range=${range}&limit=${limit}`);
  }

  async getTimeSeries(range: string = "7d"): Promise<TimeSeriesPoint[]> {
    return this.request(`/v1/analytics/timeseries?range=${range}`);
  }

  /**
   * Fetch the composite Executive Cost & Usage Report. Pass either a preset
   * `range` (incl. "mtd") or an explicit `start`/`end` custom window.
   */
  async getExecutiveReport(opts: {
    range?: string;
    start?: string;
    end?: string;
    topN?: number;
  } = {}): Promise<ExecutiveReport> {
    const p = new URLSearchParams();
    if (opts.start && opts.end) {
      p.set("start", opts.start);
      p.set("end", opts.end);
    } else {
      p.set("range", opts.range ?? "30d");
    }
    p.set("top_n", String(opts.topN ?? 10));
    return this.request(`/v1/analytics/report?${p.toString()}`);
  }

  async getEvents(
    limit: number = 100,
    offset: number = 0,
    agentName?: string,
    model?: string,
  ): Promise<Event[]> {
    const params = new URLSearchParams();
    params.set("limit", limit.toString());
    params.set("offset", offset.toString());
    if (agentName) params.set("agent_name", agentName);
    if (model) params.set("model", model);
    return this.request(`/v1/events?${params.toString()}`);
  }

  async getEventCount(): Promise<{ count: number }> {
    return this.request("/v1/events/count");
  }

  async getProject(): Promise<ProjectInfo> {
    return this.request("/v1/projects/me");
  }

  /**
   * List all projects the authenticated user can access (owned + member).
   * Used by the project switcher and onboarding.
   */
  async listMyProjects(): Promise<ProjectListItem[]> {
    return this.request("/v1/projects", {}, "jwt");
  }

  /**
   * Fetch a single project by id. Works for members without the project's
   * raw API key — the dual-auth backend dependency reads project_id from
   * the URL path and validates JWT + permission.
   */
  async getProjectById(projectId: string): Promise<ProjectInfo> {
    return this.request(`/v1/projects/${projectId}`, {}, "jwt");
  }

  async createProject(
    name: string,
    description?: string,
  ): Promise<ProjectInfo> {
    return this.request("/v1/projects", {
      method: "POST",
      body: JSON.stringify({ name, description }),
    });
  }

  async deleteProject(projectId: string): Promise<{ status: string }> {
    return this.request(`/v1/projects/${projectId}`, {
      method: "DELETE",
    });
  }

  async rotateProjectApiKey(projectId: string): Promise<{
    status: string;
    project_id: string;
    api_key: string;
    key_prefix?: string | null;
    message: string;
  }> {
    return this.request(
      `/v1/projects/${projectId}/api-key/rotate`,
      { method: "POST" },
      "jwt",
    );
  }

  /**
   * Fetch the current cached USD -> target FX rate. Used by the budget UI
   * to preview the conversion the moment a user picks a currency.
   */
  async getFxRate(
    target: BudgetCurrency,
  ): Promise<{ base: "USD"; target: string; rate: number; source: string }> {
    return this.request(
      `/v1/currency/rate?target=${encodeURIComponent(target)}`,
      {},
      "jwt",
    );
  }

  async getProjectBudget(projectId: string): Promise<ProjectBudgetSettings> {
    return this.request(`/v1/projects/${projectId}/budget`, {}, "jwt");
  }

  async updateProjectBudget(
    projectId: string,
    payload: {
      monthly_budget_usd: number | null;
      budget_enforcement_mode: "off" | "warn" | "hard_cap";
      budget_alert_thresholds: number[];
      budget_currency: BudgetCurrency;
    },
  ): Promise<ProjectBudgetSettings> {
    return this.request(
      `/v1/projects/${projectId}/budget`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      "jwt",
    );
  }

  async getOptimizations(): Promise<OptimizationSuggestion[]> {
    return this.request("/v1/optimizations");
  }

  async generateOptimizationRecommendations(): Promise<
    OptimizationSuggestion[]
  > {
    return this.request("/v1/optimizations/recommendations/generate", {
      method: "POST",
    });
  }

  async getOptimizationSummary(): Promise<OptimizationSummary> {
    return this.request("/v1/optimizations/summary");
  }

  async getPendingRecommendations(): Promise<Recommendation[]> {
    return this.request("/v1/optimizations/recommendations");
  }

  async markRecommendationImplemented(recommendationId: string): Promise<{
    status: string;
    recommendation_id: string;
    implemented_at: string;
  }> {
    return this.request(
      `/v1/optimizations/recommendations/${recommendationId}/implement`,
      { method: "POST" },
    );
  }

  async dismissRecommendation(
    recommendationId: string,
    feedback?: string,
  ): Promise<{
    status: string;
    recommendation_id: string;
    dismissed_at: string;
  }> {
    return this.request(
      `/v1/optimizations/recommendations/${recommendationId}/dismiss`,
      {
        method: "POST",
        body: JSON.stringify({ feedback: feedback || null }),
      },
    );
  }

  async getRecommendationEffectiveness(): Promise<{
    total_recommendations: number;
    implemented: number;
    dismissed: number;
    pending: number;
    expired: number;
    implementation_rate: number;
    total_estimated_savings: number;
    total_actual_savings: number;
    savings_accuracy: number;
  }> {
    return this.request("/v1/optimizations/recommendations/effectiveness");
  }

  // Member Management Methods
  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await this.request<{
      members: ProjectMember[];
      total: number;
    }>(`/v1/projects/${projectId}/members`, {}, "jwt");
    return response.members;
  }

  async inviteMember(
    projectId: string,
    email: string,
    role: "admin" | "member" | "viewer",
  ): Promise<{ status: string; message: string }> {
    return this.request(
      `/v1/projects/${projectId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ email, role }),
      },
      "jwt",
    );
  }

  async updateMemberRole(
    projectId: string,
    userId: string,
    role: "admin" | "member" | "viewer",
  ): Promise<{ status: string; message: string }> {
    return this.request(
      `/v1/projects/${projectId}/members/${userId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
      "jwt",
    );
  }

  async removeMember(projectId: string, userId: string): Promise<null> {
    return this.request(
      `/v1/projects/${projectId}/members/${userId}`,
      {
        method: "DELETE",
      },
      "jwt",
    );
  }

  async leaveProject(projectId: string): Promise<{ status: string }> {
    return this.request(
      `/v1/projects/${projectId}/leave`,
      {
        method: "POST",
      },
      "jwt",
    );
  }

  async getPendingInvitations(): Promise<PendingInvitation[]> {
    const response = await this.request<{
      invitations: PendingInvitation[];
      total: number;
    }>("/v1/projects/invitations/pending", {}, "jwt");
    return response.invitations;
  }

  async acceptInvitation(projectId: string): Promise<{ status: string }> {
    return this.request(
      `/v1/projects/${projectId}/invitations/accept`,
      {
        method: "POST",
      },
      "jwt",
    );
  }

  async declineInvitation(projectId: string): Promise<{ status: string }> {
    return this.request(
      `/v1/projects/${projectId}/invitations/decline`,
      {
        method: "POST",
      },
      "jwt",
    );
  }

  async listFeedback(params: {
    type?: FeedbackType | "all";
    status?: FeedbackStatus | "all";
    priority?: FeedbackPriority | "all";
    sortBy?: "recent" | "popular" | "oldest";
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<FeedbackListResponse> {
    const searchParams = new URLSearchParams();

    if (params.type && params.type !== "all") {
      searchParams.set("type", params.type);
    }
    if (params.status && params.status !== "all") {
      searchParams.set("status", params.status);
    }
    if (params.priority && params.priority !== "all") {
      searchParams.set("priority", params.priority);
    }
    if (params.sortBy) {
      searchParams.set("sort_by", params.sortBy);
    }
    if (params.search && params.search.trim().length > 0) {
      searchParams.set("search", params.search.trim());
    }
    if (params.limit) {
      searchParams.set("limit", params.limit.toString());
    }
    if (params.offset) {
      searchParams.set("offset", params.offset.toString());
    }

    const queryString = searchParams.toString();
    const endpoint = queryString
      ? `/v1/feedback?${queryString}`
      : "/v1/feedback";

    return this.request(endpoint, {}, "jwt");
  }

  async getFeedbackSummary(): Promise<FeedbackSummaryResponse> {
    return this.request("/v1/feedback/summary", {}, "jwt");
  }

  async createFeedback(payload: {
    type: FeedbackType;
    title: string;
    description: string;
    model_name?: string | null;
    model_provider?: string | null;
    user_email?: string | null;
    user_name?: string | null;
    metadata?: Record<string, unknown> | null;
    attachments?: AttachmentMeta[] | null;
    environment?: string | null;
  }): Promise<{ id: string; message: string }> {
    return this.request(
      "/v1/feedback",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "jwt",
    );
  }

  async toggleFeedbackUpvote(
    feedbackId: string,
  ): Promise<{ action: "added" | "removed"; upvotes: number }> {
    return this.request(
      `/v1/feedback/${feedbackId}/upvote`,
      { method: "POST" },
      "jwt",
    );
  }

  async getFeedbackComments(
    feedbackId: string,
  ): Promise<{ items: FeedbackComment[]; total: number }> {
    return this.request(`/v1/feedback/${feedbackId}/comments`, {}, "jwt");
  }

  async addFeedbackComment(
    feedbackId: string,
    payload: { comment: string; user_name?: string | null },
  ): Promise<{ message: string }> {
    return this.request(
      `/v1/feedback/${feedbackId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      "jwt",
    );
  }

  // ── Attachment methods ──────────────────────────────────────────────────

  async uploadAttachment(file: File): Promise<AttachmentMeta> {
    // Uploads bypass request(), so demo mode is handled here directly.
    if (typeof window !== "undefined" && isDemoMode()) {
      return resolveDemoRequest<AttachmentMeta>("/v1/attachments", {
        method: "POST",
      });
    }

    const { baseUrl, authToken } = this.getConfig();

    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const response = await fetch(`${baseUrl}/v1/attachments`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (response.status === 401 && authToken) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const { authToken: newToken } = this.getConfig();
        const retryHeaders: Record<string, string> = {};
        if (newToken) retryHeaders["Authorization"] = `Bearer ${newToken}`;
        const retry = await fetch(`${baseUrl}/v1/attachments`, {
          method: "POST",
          headers: retryHeaders,
          body: formData,
        });
        if (!retry.ok) {
          const text = await retry.text().catch(() => "");
          throw new Error(`Upload failed: ${retry.status} ${text}`);
        }
        return retry.json();
      }
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`Upload failed: ${response.status} ${text}`);
    }

    return response.json();
  }

  getAttachmentUrl(storedName: string): string {
    const { baseUrl } = this.getConfig();
    return `${baseUrl}/v1/attachments/${storedName}`;
  }

  async getAttachmentLimits(): Promise<AttachmentLimits> {
    return this.request("/v1/attachments/config/limits", {}, "jwt");
  }

  // ── User Account & Profile methods ─────────────────────────────────────

  async getProfile(): Promise<UserProfile> {
    return this.request("/v1/auth/me", {}, "jwt");
  }

  async updateProfile(data: {
    name?: string | null;
    avatar_url?: string | null;
  }): Promise<UserProfile> {
    return this.request(
      "/v1/auth/me",
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      "jwt",
    );
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<null> {
    return this.request(
      "/v1/auth/password/change",
      {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      },
      "jwt",
    );
  }

  async getSessions(): Promise<{
    sessions: SessionInfo[];
    total: number;
  }> {
    return this.request("/v1/auth/sessions", {}, "jwt");
  }

  async revokeSession(sessionId: string): Promise<null> {
    return this.request(
      `/v1/auth/sessions/${sessionId}`,
      { method: "DELETE" },
      "jwt",
    );
  }

  async logoutAll(): Promise<null> {
    return this.request("/v1/auth/logout-all", { method: "POST" }, "jwt");
  }

  // ── Notifications ──────────────────────────────────────────────────────

  async listNotifications(params?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    if (params?.unreadOnly) searchParams.set("unread_only", "true");
    const query = searchParams.toString();
    const endpoint = query
      ? `/v1/notifications?${query}`
      : "/v1/notifications";
    return this.request(endpoint, {}, "jwt");
  }

  async getUnreadNotificationCount(): Promise<{ unread_count: number }> {
    return this.request("/v1/notifications/unread-count", {}, "jwt");
  }

  async markNotificationRead(notificationId: string): Promise<null> {
    return this.request(
      `/v1/notifications/${notificationId}/read`,
      { method: "POST" },
      "jwt",
    );
  }

  async markAllNotificationsRead(): Promise<{ unread_count: number }> {
    return this.request(
      "/v1/notifications/read-all",
      { method: "POST" },
      "jwt",
    );
  }

  async resendVerification(email: string): Promise<null> {
    return this.request(
      "/v1/auth/resend-verification",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      "jwt",
    );
  }

  async updateProject(
    projectId: string,
    data: { name?: string; description?: string },
  ): Promise<ProjectInfo> {
    return this.request(
      `/v1/projects/${projectId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      "jwt",
    );
  }

  // ── Analytics (full) ─────────────────────────────────────────────────

  async getFullAnalytics(range: string = "7d"): Promise<{
    overview: AnalyticsOverview;
    agents: AgentStats[];
    models: ModelStats[];
    timeseries: TimeSeriesPoint[];
  }> {
    // Backend /v1/analytics/full expects `days` as an integer, not `range`
    const daysMap: Record<string, number> = {
      "1h": 1,
      "24h": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };
    const days = daysMap[range] ?? 7;
    return this.request(`/v1/analytics/full?days=${days}`);
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    if (typeof window !== "undefined" && isDemoMode()) return true;
    const { apiKey } = this.getConfig();
    return !!apiKey && apiKey.length > 0;
  }

  /**
   * Whether project-scoped requests can run right now — either via API key
   * (legacy / SDK) or via JWT + an active project id (team-member path).
   */
  hasProjectAccess(): boolean {
    if (typeof window !== "undefined" && isDemoMode()) return true;
    const { apiKey, authToken } = this.getConfig();
    if (apiKey && apiKey.length > 0) return true;
    // Sanitized getter: a leftover demo id counts as "no project selected".
    return !!(authToken && this.getActiveProjectId());
  }

  /**
   * Get / set the active project (used by the project switcher).
   * Setting null clears it.
   */
  getActiveProjectId(): string | null {
    if (typeof window !== "undefined" && isDemoMode()) return "demo-project";
    const id = this.getConfig().activeProjectId;
    // A demo leftover must never reach the real backend — it guarantees 403s.
    return id === "demo-project" ? null : id;
  }

  setActiveProjectId(projectId: string | null): void {
    if (typeof window === "undefined") return;
    if (projectId) {
      localStorage.setItem("agentcost_active_project_id", projectId);
    } else {
      localStorage.removeItem("agentcost_active_project_id");
    }
    window.dispatchEvent(new Event("agentcost_active_project_changed"));
  }

  /**
   * Get the current configuration
   */
  getConfiguration(): {
    apiKey: string;
    baseUrl: string;
    authToken: string | null;
  } {
    return this.getConfig();
  }
}

export const api = new ApiClient();
