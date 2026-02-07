/**
 * API configuration and client for AgentCost backend
 */

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

export interface ModelStats {
  model: string;
  total_calls: number;
  total_cost: number;
  total_tokens: number;
  avg_latency_ms: number;
  input_tokens: number;
  output_tokens: number;
}

export interface TimeSeriesPoint {
  timestamp: string;
  cost: number;
  calls: number;
  tokens: number;
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

// Get config from localStorage (client-side only)
function getStoredConfig(): {
  apiKey: string;
  baseUrl: string;
  authToken: string | null;
} {
  if (typeof window === "undefined") {
    return { apiKey: "", baseUrl: DEFAULT_API_BASE_URL, authToken: null };
  }

  try {
    const saved = localStorage.getItem("agentcost_config");
    const authToken = localStorage.getItem("access_token");

    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        apiKey: parsed.apiKey || process.env.NEXT_PUBLIC_API_KEY || "",
        baseUrl: parsed.baseUrl || DEFAULT_API_BASE_URL,
        authToken,
      };
    }

    return {
      apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
      baseUrl: DEFAULT_API_BASE_URL,
      authToken,
    };
  } catch {
    // Ignore parse errors
  }

  return {
    apiKey: process.env.NEXT_PUBLIC_API_KEY || "",
    baseUrl: DEFAULT_API_BASE_URL,
    authToken: null,
  };
}

class ApiClient {
  private getConfig() {
    return getStoredConfig();
  }

  /**
   * Determine the type of authentication needed for an endpoint
   * - 'api_key': Analytics, events, optimizations (project-level access)
   * - 'jwt': Auth endpoints, project creation (user-level access)
   * - 'none': Public endpoints like health
   */
  private getAuthType(endpoint: string): "api_key" | "jwt" | "none" {
    // Public endpoints
    if (endpoint.includes("/health")) {
      return "none";
    }
    // Auth endpoints always use JWT
    if (endpoint.includes("/auth/")) {
      return "jwt";
    }
    // Feedback endpoints use JWT (optional for list/submit)
    if (endpoint.startsWith("/v1/feedback")) {
      return "jwt";
    }
    // Attachment endpoints use JWT
    if (endpoint.startsWith("/v1/attachments")) {
      return "jwt";
    }
    // Project creation uses JWT (to associate with user)
    if (endpoint === "/v1/projects" || endpoint.startsWith("/v1/projects?")) {
      return "jwt";
    }
    // Member management and invitations use JWT
    if (
      endpoint.includes("/members") ||
      endpoint.includes("/invitations") ||
      endpoint.includes("/leave")
    ) {
      return "jwt";
    }
    // Project deletion uses API key (project-level auth)
    if (endpoint.match(/\/v1\/projects\/[^/]+$/) && !endpoint.includes("/me")) {
      return "api_key";
    }
    // Analytics, events, optimizations, and project info use API key
    return "api_key";
  }

  private async tryRefreshToken(): Promise<boolean> {
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
    authOverride?: "api_key" | "jwt" | "none",
    retryOnUnauthorized = true,
  ): Promise<T> {
    const { apiKey, baseUrl, authToken } = this.getConfig();
    const authType = authOverride ?? this.getAuthType(endpoint);

    // Build authorization header based on auth type
    let authHeader = "";
    if (authType === "api_key" && apiKey) {
      authHeader = `Bearer ${apiKey}`;
    } else if (authType === "jwt" && authToken) {
      authHeader = `Bearer ${authToken}`;
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(authHeader && { Authorization: authHeader }),
        ...options.headers,
      },
    });

    // Handle 401 with token refresh for JWT auth
    if (response.status === 401 && authType === "jwt" && retryOnUnauthorized) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        // Retry the request with new token
        return this.request<T>(endpoint, options, authOverride, false);
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `API Error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
      );
    }

    // Handle 204 No Content responses
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

  async getModelStats(
    range: string = "7d",
    limit: number = 10,
  ): Promise<ModelStats[]> {
    return this.request(`/v1/analytics/models?range=${range}&limit=${limit}`);
  }

  async getTimeSeries(range: string = "7d"): Promise<TimeSeriesPoint[]> {
    return this.request(`/v1/analytics/timeseries?range=${range}`);
  }

  async getEvents(limit: number = 100, offset: number = 0): Promise<Event[]> {
    return this.request(`/v1/events?limit=${limit}&offset=${offset}`);
  }

  async getEventCount(): Promise<{ count: number }> {
    return this.request("/v1/events/count");
  }

  async getProject(): Promise<ProjectInfo> {
    return this.request("/v1/projects/me");
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

  async getFullAnalytics(range: string = "7d"): Promise<{
    overview: AnalyticsOverview;
    agents: AgentStats[];
    models: ModelStats[];
    timeseries: TimeSeriesPoint[];
  }> {
    return this.request(`/v1/analytics/full?range=${range}`);
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    const { apiKey } = this.getConfig();
    return !!apiKey && apiKey.length > 0;
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
