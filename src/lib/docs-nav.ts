/**
 * The documentation tree: one entry per page, in reading order, with the
 * in-page sections the sidebar and prev/next navigation are built from.
 * Endpoint anchors follow endpointId().
 */

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface DocsNavItem {
  id: string;
  label: string;
  method?: Method;
}

export interface DocsPage {
  href: string;
  label: string;
  sections: DocsNavItem[];
}

export function endpointId(method: string, path: string): string {
  return `${method}-${path}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const ep = (method: Method, path: string, label: string): DocsNavItem => ({
  id: endpointId(method, path),
  label,
  method,
});

export const DOCS_PAGES: DocsPage[] = [
  {
    href: "/docs",
    label: "Overview",
    sections: [
      { id: "quick-start", label: "Quick start" },
      { id: "guides", label: "Guides" },
      { id: "machine-readable", label: "Machine-readable" },
      { id: "source", label: "Packages and source" },
    ],
  },
  {
    href: "/docs/sdk",
    label: "SDK",
    sections: [
      { id: "installation", label: "Installation" },
      { id: "quick-start", label: "Quick start" },
      { id: "configuration", label: "Configuration" },
      { id: "agent-tagging", label: "Agent tagging" },
      { id: "workflows", label: "Workflows & steps" },
      { id: "external-correlation", label: "External correlation" },
      { id: "pre-deployment", label: "Pre-deployment analysis" },
      { id: "metadata", label: "Metadata" },
      { id: "local-mode", label: "Local mode" },
      { id: "streaming", label: "Streaming" },
      { id: "supported-models", label: "Supported models" },
      { id: "event-structure", label: "Event structure" },
      { id: "shutdown", label: "Graceful shutdown" },
      { id: "error-handling", label: "Error handling" },
      { id: "best-practices", label: "Best practices" },
      { id: "troubleshooting", label: "Troubleshooting" },
    ],
  },
  {
    href: "/docs/api",
    label: "API",
    sections: [
      { id: "authentication", label: "Authentication" },
      { id: "user-auth", label: "Login & registration" },
      ep("POST", "/v1/auth/register", "Register"),
      ep("POST", "/v1/auth/login", "Login"),
      ep("POST", "/v1/auth/refresh", "Refresh token"),
      ep("POST", "/v1/auth/logout", "Logout"),
      { id: "health", label: "Health" },
      ep("GET", "/v1/health", "Health check"),
      { id: "projects", label: "Projects" },
      ep("POST", "/v1/projects", "Create project"),
      ep("GET", "/v1/projects/me", "Current project"),
      ep("GET", "/v1/projects/{id}", "Retrieve project"),
      ep("PATCH", "/v1/projects/{project_id}", "Update project"),
      ep("DELETE", "/v1/projects/{project_id}", "Delete project"),
      ep("POST", "/v1/projects/{project_id}/api-key/rotate", "Rotate API key"),
      { id: "team", label: "Team" },
      ep("GET", "/v1/projects/{project_id}/members", "List members"),
      ep("POST", "/v1/projects/{project_id}/members", "Invite member"),
      ep("GET", "/v1/projects/invitations/pending", "Pending invitations"),
      ep("POST", "/v1/projects/{project_id}/invitations/accept", "Accept invitation"),
      ep("POST", "/v1/projects/{project_id}/invitations/decline", "Decline invitation"),
      ep("PATCH", "/v1/projects/{project_id}/members/{user_id}", "Change role"),
      ep("DELETE", "/v1/projects/{project_id}/members/{user_id}", "Remove member"),
      ep("POST", "/v1/projects/{project_id}/leave", "Leave project"),
      { id: "events", label: "Events" },
      ep("POST", "/v1/events/batch", "Ingest events"),
      ep("GET", "/v1/events", "List events"),
      { id: "analytics", label: "Analytics" },
      ep("GET", "/v1/analytics/overview", "Overview"),
      ep("GET", "/v1/analytics/agents", "By agent"),
      ep("GET", "/v1/analytics/agents/summary", "Agent summaries"),
      ep("GET", "/v1/analytics/agents/{agent_name}", "Agent detail"),
      ep("GET", "/v1/analytics/models", "By model"),
      ep("GET", "/v1/analytics/timeseries", "Time series"),
      ep("GET", "/v1/analytics/full", "Full analytics"),
      ep("GET", "/v1/analytics/by/{dimension}", "By dimension"),
      ep("GET", "/v1/analytics/cache", "Cache analysis"),
      { id: "workflows", label: "Workflows & traces" },
      ep("GET", "/v1/analytics/workflows", "Workflows"),
      ep("GET", "/v1/analytics/workflows/steps", "Steps"),
      ep("GET", "/v1/analytics/workflows/tools", "Tools"),
      ep("GET", "/v1/analytics/workflows/repeated-work", "Repeated work"),
      ep("GET", "/v1/analytics/workflows/outcomes", "Outcomes"),
      ep("GET", "/v1/analytics/workflows/distribution", "Cost distribution"),
      ep("GET", "/v1/analytics/traces", "List traces"),
      ep("GET", "/v1/analytics/traces/{trace_id}", "Retrieve trace"),
      { id: "guardrails", label: "Guardrails" },
      ep("GET", "/v1/guardrails", "List guardrails"),
      ep("GET", "/v1/guardrails/compliance", "Compliance"),
      ep("PUT", "/v1/projects/{project_id}/guardrails", "Upsert guardrail"),
      ep("DELETE", "/v1/projects/{project_id}/guardrails/{agent_name}", "Delete guardrail"),
      ep("PUT", "/v1/projects/{project_id}/guardrails/tool-tags", "Tag tool access"),
      ep("DELETE", "/v1/projects/{project_id}/guardrails/tool-tags/{tool_name}", "Remove tool tag"),
      { id: "optimizations", label: "Optimizations" },
      ep("GET", "/v1/optimizations", "Suggestions"),
      ep("GET", "/v1/optimizations/summary", "Summary"),
      { id: "errors", label: "Error handling" },
      { id: "rate-limiting", label: "Rate limiting" },
      { id: "sdks", label: "SDKs & libraries" },
      { id: "webhooks", label: "Webhooks" },
      ep("PUT", "/v1/projects/{project_id}/webhook", "Configure webhook"),
      ep("POST", "/v1/projects/{project_id}/webhook/test", "Test webhook"),
      { id: "egress", label: "Budget state & metrics" },
      ep("GET", "/v1/projects/{project_id}/budget-state", "Budget state"),
      ep("GET", "/v1/metrics", "Prometheus metrics"),
      ep("POST", "/v1/pricing/import", "Import pricing"),
      { id: "versioning", label: "API versioning" },
    ],
  },
  {
    href: "/docs/cli",
    label: "CLI",
    sections: [
      { id: "install", label: "Install" },
      { id: "files", label: "Analysing your files" },
      { id: "run", label: "Analysing a test run" },
      { id: "report", label: "Reading the report" },
      { id: "findings", label: "Findings" },
      { id: "flags", label: "Flags" },
      { id: "ci", label: "CI usage" },
      { id: "privacy", label: "What it reads and sends" },
    ],
  },
  {
    href: "/docs/models",
    label: "Models",
    sections: [],
  },
  {
    href: "/docs/mcp",
    label: "MCP",
    sections: [
      { id: "connect", label: "Connect" },
      { id: "tools", label: "Tools" },
      { id: "what-it-does-not-do", label: "What it does not do" },
      { id: "verify-it", label: "Verify it" },
    ],
  },
  {
    href: "/docs/api-versioning",
    label: "Versioning",
    sections: [
      { id: "versioning", label: "Versioning" },
      { id: "how-a-deprecation-is-signalled", label: "How a deprecation is signalled" },
      { id: "notice-period", label: "Notice period" },
      { id: "currently-deprecated", label: "Currently deprecated" },
      { id: "model-deprecations-are-a-different-thing", label: "Model deprecations" },
    ],
  },
  {
    href: "/docs/privacy",
    label: "Privacy",
    sections: [
      { id: "transmitted", label: "What the SDK transmits" },
      { id: "hashing", label: "How prompts are handled" },
      { id: "modes", label: "Deployment modes" },
      { id: "credentials", label: "Credentials and secrets" },
      { id: "retention", label: "Retention and deletion" },
      { id: "verify", label: "Verify it yourself" },
      { id: "contact", label: "Open questions" },
    ],
  },
];

export function adjacentPages(pathname: string): {
  prev?: DocsPage;
  next?: DocsPage;
} {
  const i = DOCS_PAGES.findIndex((p) => p.href === pathname);
  if (i === -1) return {};
  return { prev: DOCS_PAGES[i - 1], next: DOCS_PAGES[i + 1] };
}
