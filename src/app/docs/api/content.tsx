"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { PageHeader, Section, CodeBlock, Endpoint, Callout } from "@/components/docs/primitives";

/** Resolved on the client, where window.location is the source of truth. */
function readApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl.replace(/\/$/, ""); // Remove trailing slash
  return `${window.location.protocol}//${window.location.hostname}:8000`;
}

/** The URL never changes after load, so there is nothing to subscribe to. */
const subscribeToNothing = () => () => {};

/**
 * Get the API base URL dynamically.
 *
 * Server-rendered as "" and filled in on the client. useSyncExternalStore --
 * rather than an effect that setStates on mount -- is what keeps the two
 * renders from disagreeing during hydration without a cascading re-render.
 */
function useApiBaseUrl() {
  return useSyncExternalStore(
    subscribeToNothing,
    readApiBaseUrl,
    () => "",
  );
}

export default function APIReferencePage() {
  const apiBaseUrl = useApiBaseUrl();

  return (
    <>
        <PageHeader eyebrow="REST API" title={<>API Reference</>}>
        <p>Complete REST API documentation for the AgentCost backend</p>
      </PageHeader>

        {/* Base URL */}
        <div className="docs-panel mb-12">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">Base URL</p>
          <code className="text-[15px] text-white">{apiBaseUrl || "https://api.agentcost.tech"}</code>
          <p>
            All API endpoints are relative to this base URL
          </p>
        </div>

        {/* Authentication */}
        <Section id="authentication" title="Authentication">
          <p>
            AgentCost uses two types of authentication:
          </p>
          <div className="docs-table-wrap">
            <table className="min-w-140">
              <thead>
                <tr>
                  <th className="font-medium">
                    Type
                  </th>
                  <th className="font-medium">
                    Used For
                  </th>
                  <th className="font-medium">
                    Header
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-medium text-white">API Key</td>
                  <td>SDK tracking, analytics, events</td>
                  <td>
                    <code>
                      Authorization: Bearer sk_xxx
                    </code>
                  </td>
                </tr>
                <tr>
                  <td className="font-medium text-white">
                    JWT Token
                  </td>
                  <td>
                    Dashboard, user actions, team management
                  </td>
                  <td>
                    <code>
                      Authorization: Bearer eyJ...
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock
            code={`# Using API Key (for SDK/tracking)
curl -H "Authorization: Bearer sk_your_project_api_key" \\
  YOUR_API_URL/v1/analytics/overview

# Using JWT Token (for user actions)
curl -H "Authorization: Bearer your_jwt_token" \\
  YOUR_API_URL/v1/projects/{project_id}/members`}
          />
          <div className="docs-panel docs-panel--warning mt-4">
            <p>
              <strong>Security:</strong> API keys provide project-level access
              for your SDK. JWT tokens are user-specific and expire after 1
              hour, but are automatically refreshed.
            </p>
          </div>
        </Section>

        {/* User Authentication */}
        <Section id="user-auth" title="User Login & Registration">
          <p>
            These endpoints handle user account creation and authentication.
            After login, you receive a JWT token to use with protected
            endpoints.
          </p>

          <Endpoint
            method="POST"
            path="/v1/auth/register"
            description="Create a new user account"
            auth={false}
          >
            <p>Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "email": "user@example.com",
  "password": "your_secure_password",
  "name": "John Doe"
}`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false
  },
  "verification_email_sent": true,
  "default_project": {
    "id": "123e4567-e89b-42d3-a456-426614174000",
    "name": "My First Project",
    "api_key": "sk_live_xxxxxxxxxxxx"
  }
}`}
            />
            <div className="docs-panel mt-3">
              <p>
                Registration signs you in immediately — the response carries
                the same tokens as login. A verification email is sent in the
                background; verify whenever convenient. The default
                project&apos;s{" "}
                <code>api_key</code> is
                shown only this once — store it securely.
              </p>
            </div>
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/auth/login"
            description="Authenticate and get access tokens"
            auth={false}
          >
            <p>Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "email": "user@example.com",
  "password": "your_password",
  "remember_me": true
}`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/auth/refresh"
            description="Get a new access token using refresh token"
            auth={false}
          >
            <p>Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "refresh_token": "your_refresh_token"
}`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/auth/logout"
            description="Invalidate current session"
          >
            <p>
              Response (204 No Content)
            </p>
            <p>
              Session is invalidated. The access token will no longer be valid.
            </p>
          </Endpoint>
        </Section>

        {/* Health */}
        <Section id="health" title="Health Check">
          <Endpoint
            method="GET"
            path="/v1/health"
            description="Check if the backend is running and healthy"
            auth={false}
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2024-01-23T10:30:45.123Z"
}`}
            />
          </Endpoint>
        </Section>

        {/* Projects */}
        <Section id="projects" title="Projects">
          <Endpoint
            method="POST"
            path="/v1/projects"
            description="Create a new project and get an API key"
            auth={false}
          >
            <p>Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "name": "my-project",
  "description": "Optional project description"
}`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "id": "proj_abc123",
  "name": "my-project",
  "description": "Optional project description",
  "api_key": "sk_live_xxxxxxxxxxxx",
  "key_prefix": "sk_live_",
  "is_active": true,
  "created_at": "2024-01-23T10:30:45.123Z",
  "updated_at": "2024-01-23T10:30:45.123Z",
  "owner_id": "usr_abc123",
  "warning": "Save this API key now! It cannot be retrieved later."
}`}
            />
            <div className="docs-panel docs-panel--warning mt-3">
              <p>
                <strong>Important:</strong> The API key is shown only once on
                creation. Store it securely and use rotation to generate a new
                one later.
              </p>
            </div>
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/projects/me"
            description="Get the current project (API key auth)"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "id": "proj_abc123",
  "name": "my-project",
  "description": "Optional project description",
  "api_key": null,
  "key_prefix": null,
  "is_active": true,
  "created_at": "2024-01-23T10:30:45.123Z",
  "updated_at": "2024-01-23T10:30:45.123Z"
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/projects/{id}"
            description="Get project details by ID"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "id": "proj_abc123",
  "name": "my-project",
  "description": "Optional project description",
  "api_key": null,
  "key_prefix": null,
  "is_active": true,
  "created_at": "2024-01-23T10:30:45.123Z"
}`}
            />
            <p>
              API keys are write-only and are never returned in read endpoints.
            </p>
          </Endpoint>

          <Endpoint
            method="PATCH"
            path="/v1/projects/{project_id}"
            description="Update project settings"
          >
            <p>Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "name": "Updated project name",
  "description": "Updated description",
  "is_active": true
}`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "id": "proj_abc123",
  "name": "Updated project name",
  "description": "Updated description",
  "api_key": null,
  "key_prefix": null,
  "is_active": true,
  "created_at": "2024-01-23T10:30:45.123Z"
}`}
            />
          </Endpoint>

          <Endpoint
            method="DELETE"
            path="/v1/projects/{project_id}"
            description="Delete a project"
          >
            <p>Response (200 OK)</p>
            <CodeBlock language="json" code={`{ "status": "deleted" }`} />
            <div className="docs-panel docs-panel--warning mt-3">
              <p>
                <strong>Warning:</strong> Deleting a project removes all
                associated events and analytics.
              </p>
            </div>
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/projects/{project_id}/api-key/rotate"
            description="Rotate the project API key (Admin only, JWT auth)"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "status": "ok",
  "project_id": "proj_abc123",
  "api_key": "sk_live_xxxxxxxxxxxx",
  "key_prefix": "sk_live_",
  "message": "Save this API key now. It cannot be retrieved later."
}`}
            />
          </Endpoint>
        </Section>

        {/* Team Management */}
        <Section id="team" title="Team Management">
          <p>
            Manage team members and their access to your project. All team
            endpoints require JWT authentication.
          </p>

          <div className="overflow-x-auto max-w-full mb-6">
            <table className="min-w-120">
              <thead>
                <tr>
                  <th className="font-medium">
                    Role
                  </th>
                  <th className="font-medium">
                    Permissions
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-neutral-300">
                      Admin
                    </span>
                  </td>
                  <td>
                    Full access: invite/remove members, change roles, delete
                    project
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[11px] text-neutral-300">
                      Member
                    </span>
                  </td>
                  <td>
                    View analytics, create events, export data
                  </td>
                </tr>
                <tr>
                  <td>
                    <span className="px-2 py-0.5 rounded text-xs bg-neutral-700 text-neutral-300 border border-neutral-600">
                      Viewer
                    </span>
                  </td>
                  <td>
                    Read-only access to analytics and events
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <Endpoint
            method="GET"
            path="/v1/projects/{project_id}/members"
            description="List all members of a project"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "members": [
    {
      "id": "mem_123",
      "user_id": "usr_abc",
      "email": "admin@example.com",
      "name": "John Doe",
      "role": "admin",
      "is_owner": true,
      "is_pending": false,
      "accepted_at": "2024-01-20T10:00:00Z"
    },
    {
      "id": "mem_456",
      "user_id": "usr_def",
      "email": "viewer@example.com",
      "name": "Jane Smith",
      "role": "viewer",
      "is_owner": false,
      "is_pending": false,
      "accepted_at": "2024-01-22T15:30:00Z"
    }
  ],
  "total": 2
}`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/projects/{project_id}/members"
            description="Invite a user to the project (Admin only)"
          >
            <p>Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "email": "newmember@example.com",
  "role": "member"
}`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "message": "Invitation sent to newmember@example.com",
  "membership_id": "mem_789",
  "role": "member"
}`}
            />
            <div className="docs-panel mt-3">
              <p>
                An invitation email is sent to the user. They must accept it to
                join the project.
              </p>
            </div>
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/projects/invitations/pending"
            description="Get your pending project invitations"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "invitations": [
    {
      "project_id": "proj_abc123",
      "project_name": "My Project",
      "role": "member",
      "invited_by": {
        "name": "John Doe",
        "email": "john@example.com"
      },
      "invited_at": "2024-01-23T10:30:45.123Z"
    }
  ],
  "total": 1
}`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/projects/{project_id}/invitations/accept"
            description="Accept a project invitation"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "status": "accepted",
  "project_id": "proj_abc123",
  "role": "member"
}`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/projects/{project_id}/invitations/decline"
            description="Decline a project invitation"
          >
            <p>
              Response (204 No Content)
            </p>
          </Endpoint>

          <Endpoint
            method="PATCH"
            path="/v1/projects/{project_id}/members/{user_id}"
            description="Update a member's role (Admin only)"
          >
            <p>Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "role": "admin"
}`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "status": "updated",
  "new_role": "admin"
}`}
            />
          </Endpoint>

          <Endpoint
            method="DELETE"
            path="/v1/projects/{project_id}/members/{user_id}"
            description="Remove a member from the project (Admin only)"
          >
            <p>
              Response (204 No Content)
            </p>
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/projects/{project_id}/leave"
            description="Leave a project voluntarily"
          >
            <p>
              Response (204 No Content)
            </p>
            <div className="docs-panel docs-panel--warning mt-3">
              <p>
                Project owners cannot leave. They must transfer ownership or
                delete the project.
              </p>
            </div>
          </Endpoint>
        </Section>

        {/* Events */}
        <Section id="events" title="Events">
          <Endpoint
            method="POST"
            path="/v1/events/batch"
            description="Ingest a batch of LLM call events (used by SDK)"
          >
            <p>
              Try it from your terminal — this one command ingests a sample
              event and lights up your dashboard:
            </p>
            <CodeBlock
              code={`curl -X POST "${apiBaseUrl || "https://api.agentcost.tech"}/v1/events/batch" \\
  -H "Authorization: Bearer sk_your_project_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_id": "123e4567-e89b-42d3-a456-426614174000",
    "events": [
      {
        "agent_name": "my-first-agent",
        "model": "gpt-4o-mini",
        "input_tokens": 150,
        "output_tokens": 80,
        "latency_ms": 1234,
        "timestamp": "2026-08-04T10:30:45Z",
        "success": true
      }
    ]
  }'`}
            />
            <div className="docs-panel mt-3 mb-4">
              <p>
                <code>project_id</code>{" "}
                is your project&apos;s <strong>UUID</strong> from Settings (not
                its name) and must match the API key&apos;s project — a
                mismatch returns 403.{" "}
                <code>
                  total_tokens
                </code>{" "}
                and <code>cost</code>{" "}
                are optional; the server derives and prices them for you.
              </p>
            </div>
            <p>
              Full request body — every field beyond the required four
              (agent_name, model, input_tokens, output_tokens, plus timestamp)
              is optional:
            </p>
            <CodeBlock
              language="json"
              code={`{
  "project_id": "proj_abc123",
  "events": [
    {
      "agent_name": "router-agent",
      "model": "gpt-4o",
      "input_tokens": 1500,
      "output_tokens": 80,
      "cached_tokens": 1200,
      "cache_write_tokens": 0,
      "latency_ms": 1234,
      "timestamp": "2026-08-15T10:30:45.123Z",
      "success": true,
      "event_id": "delivery-42",
      "trace_id": "0532f9c4-a022-4e98-a543-d8e17c5b90a6",
      "metadata": {"user_id": "alice@example.com", "session_id": "run-7f3a"}
    }
  ],
  "outcomes": [
    {"trace_id": "0532f9c4-a022-4e98-a543-d8e17c5b90a6", "success": true}
  ]
}`}
            />
            <div className="docs-panel mt-3">
              <ul className="space-y-1.5">
                <li>
                  <code>cached_tokens</code>{" "}
                  is the part of <code>input_tokens</code>{" "}
                  served from the provider&apos;s prompt cache — it changes cost
                  materially on cache-heavy workloads and is priced at real
                  cache rates.
                </li>
                <li>
                  <code>event_id</code>{" "}
                  makes delivery idempotent: a replay returns 200 with{" "}
                  <code>events_duplicate</code>{" "}
                  incremented and stores nothing, even under concurrent retries.
                </li>
                <li>
                  <code>trace_id</code>{" "}
                  accepts up to 64 characters, so UUIDs minted by an external
                  orchestrator fit. <code>outcomes</code>{" "}
                  may be sent with an empty <code>events</code>{" "}
                  list — a run denied by a policy layer still gets its ending recorded.
                </li>
                <li>
                  <code>metadata.user_id</code>{" "}
                  and <code>metadata.session_id</code>{" "}
                  become indexed analytics dimensions — see{" "}
                  <a href="#analytics" className="underline">Analytics</a>.
                </li>
              </ul>
            </div>
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "status": "ok",
  "events_stored": 1,
  "events_received": 1,
  "events_rejected": 0,
  "events_duplicate": 0,
  "outcomes_recorded": 1,
  "rejected": [],
  "timestamp": "2026-08-15T10:30:46.001Z"
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/events"
            description="Get recent events for the authenticated project"
          >
            <p>Query Parameters:</p>
            <div className="docs-table-wrap">
              <table className="min-w-140">
                <thead>
                  <tr>
                    <th className="font-medium">
                      Parameter
                    </th>
                    <th className="font-medium">
                      Type
                    </th>
                    <th className="font-medium">
                      Default
                    </th>
                    <th className="font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono">
                      limit
                    </td>
                    <td>int</td>
                    <td>100</td>
                    <td>Maximum events to return</td>
                  </tr>
                  <tr>
                    <td className="font-mono">
                      offset
                    </td>
                    <td>int</td>
                    <td>0</td>
                    <td>Number of events to skip</td>
                  </tr>
                  <tr>
                    <td className="font-mono">
                      agent_name
                    </td>
                    <td>str</td>
                    <td>-</td>
                    <td>Filter by agent name</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Endpoint>
        </Section>

        {/* Analytics */}
        <Section id="analytics" title="Analytics">
          <Endpoint
            method="GET"
            path="/v1/analytics/overview"
            description="Get cost overview for the project"
          >
            <p>Query Parameters:</p>
            <div className="docs-table-wrap">
              <table className="min-w-120">
                <thead>
                  <tr>
                    <th className="font-medium">
                      Parameter
                    </th>
                    <th className="font-medium">
                      Type
                    </th>
                    <th className="font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono">
                      range
                    </td>
                    <td>str</td>
                    <td>Time range: 24h, 7d, 30d, 90d</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "total_cost": 45.32,
  "total_calls": 2150,
  "total_tokens": 1250000,
  "avg_cost_per_call": 0.021,
  "avg_latency_ms": 850.5,
  "success_rate": 99.5,
  "period_start": "2024-01-16T00:00:00Z",
  "period_end": "2024-01-23T00:00:00Z"
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/agents"
            description="Get per-agent cost breakdown"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "agent_name": "router-agent",
    "total_calls": 850,
    "total_tokens": 425000,
    "total_cost": 18.50,
    "avg_latency_ms": 750,
    "success_rate": 99.8
  },
  {
    "agent_name": "technical-agent",
    "total_calls": 650,
    "total_tokens": 520000,
    "total_cost": 15.20,
    "avg_latency_ms": 920,
    "success_rate": 99.2
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/models"
            description="Get per-model cost breakdown"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "model": "gpt-4",
    "total_calls": 500,
    "total_tokens": 300000,
    "input_tokens": 180000,
    "output_tokens": 120000,
    "total_cost": 25.50,
    "cost_share": 56.3
  },
  {
    "model": "gpt-3.5-turbo",
    "total_calls": 1200,
    "total_tokens": 600000,
    "input_tokens": 400000,
    "output_tokens": 200000,
    "total_cost": 8.40,
    "cost_share": 18.5
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/timeseries"
            description="Get time series data for charting"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "timestamp": "2024-01-23T00:00:00Z",
    "cost": 5.32,
    "calls": 245,
    "tokens": 125000
  },
  {
    "timestamp": "2024-01-23T01:00:00Z",
    "cost": 4.85,
    "calls": 220,
    "tokens": 115000
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/full"
            description="Get complete analytics response (overview + agents + models + timeseries)"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "overview": { ... },
  "agents": [ ... ],
  "models": [ ... ],
  "timeseries": [ ... ]
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/by/{dimension}"
            description="Cost and volume grouped by user, session, workflow, tool, model or agent"
          >
            <p>
              <code>user</code> and{" "}
              <code>session</code> read the{" "}
              <code>user_id</code> /{" "}
              <code>session_id</code> keys from
              event metadata — this is what answers{" "}
              <em>what is each developer costing us</em>. Events with no value
              for the dimension are excluded, not bucketed under a placeholder.
            </p>
            <CodeBlock
              code={`curl -H "Authorization: Bearer sk_your_project_api_key" \\
  "${apiBaseUrl || "https://api.agentcost.tech"}/v1/analytics/by/user?range=30d"`}
            />
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "key": "alice@example.com",
    "total_calls": 4210,
    "total_tokens": 9812004,
    "total_cost": 412.86,
    "avg_latency_ms": 1180.4,
    "success_rate": 99.2
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/cache"
            description="Prompt-cache hit rate and savings for a window, in USD"
          >
            <p>
              Savings are measured against billing every cached token at the
              model&apos;s full input rate; a model with no published cache
              rate contributes zero, exactly as ingest prices it.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "total_input_tokens": 48120044,
  "cached_tokens": 34350211,
  "cache_write_tokens": 1204110,
  "cache_hit_rate": 71.4,
  "events_with_cache": 18744,
  "read_savings": 212.4,
  "write_premium": 18.05,
  "net_savings": 194.35
}`}
            />
          </Endpoint>
        </Section>

        {/* Workflows & traces */}
        <Section id="workflows" title="Workflows &amp; Traces">
          <p>
            Cost attributed to the shape of a run rather than to the model that
            served it. These endpoints read only events carrying trace
            structure, which the SDK adds when you use{" "}
            <code>workflow()</code>,{" "}
            <code>step()</code> and{" "}
            <code>tool()</code>. Calls made outside
            a workflow are absent here by design, and remain visible under
            Analytics. Every endpoint accepts{" "}
            <code>range</code> (1h, 24h, 7d, 30d,
            90d).
          </p>

          <Endpoint
            method="GET"
            path="/v1/analytics/workflows"
            description="Cost per workflow, including the average cost of a single run"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "workflow": "support-triage",
    "runs": 9500,
    "total_cost": 321.47,
    "avg_cost_per_run": 0.0338,
    "max_cost_per_run": 0.0879,
    "total_calls": 41800,
    "avg_calls_per_run": 4.4,
    "avg_steps_per_run": 3,
    "max_depth": 2,
    "success_rate": 98.7
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/workflows/steps"
            description="Cost per step. calls_per_run above 1 indicates retries or a loop"
          >
            <p>
              Optional <code>workflow</code> query
              parameter restricts the result to one workflow.
            </p>
            <CodeBlock
              language="json"
              code={`[
  {
    "workflow": "support-triage",
    "step_name": "search_docs",
    "calls": 23400,
    "runs": 9500,
    "calls_per_run": 2.4,
    "cost_per_run": 0.0209,
    "total_cost": 203.18,
    "avg_latency_ms": 1250,
    "success_rate": 96.9
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/workflows/tools"
            description="LLM spend incurred while a named tool was running"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "tool_name": "search_docs",
    "calls": 23400,
    "runs": 9500,
    "total_cost": 203.18,
    "total_tokens": 51000000,
    "avg_latency_ms": 1250
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/workflows/repeated-work"
            description="Identical calls repeated within a single run, and what they cost"
          >
            <p>
              Distinct from the cross-run duplication the caching analyzer
              reports: that argues for a cache, this usually means the control
              flow is looping.{" "}
              <code>wasted_cost</code> covers every
              occurrence beyond the first.
            </p>
            <CodeBlock
              language="json"
              code={`[
  {
    "trace_id": "9f2c41a0b7d3e5f1",
    "workflow": "support-triage",
    "step_name": "search_docs",
    "model": "gpt-4o",
    "occurrences": 4,
    "spend": 0.0435,
    "wasted_cost": 0.0326,
    "first_seen": "2026-08-11T09:14:22Z"
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/workflows/outcomes"
            description="Cost per completed outcome, charging failed runs to the successes"
          >
            <p>
              Populated only for runs that called{" "}
              <code>track_costs.outcome()</code>.
              Runs that declared nothing are counted as{" "}
              <code>unknown</code> rather than as
              failures.
            </p>
            <CodeBlock
              language="json"
              code={`[
  {
    "workflow": "support-triage",
    "runs": 9500,
    "succeeded": 8645,
    "failed": 684,
    "unknown": 171,
    "cost_on_success": 292.20,
    "cost_on_failure": 23.12,
    "cost_per_success": 0.0365,
    "success_rate": 92.67
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/workflows/distribution"
            description="Distribution of cost per run, with percentiles and the tail's share of spend"
          >
            <p>
              Computed over every run in the window rather than a top-N slice.
              Defaults to the highest-spend workflow; pass{" "}
              <code>workflow</code> to choose one,
              and <code>buckets</code> (6-60) to
              set the resolution. The final histogram bucket is the tail, marked{" "}
              <code>is_tail</code>.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "workflow": "support-triage",
  "runs": 9500,
  "truncated": false,
  "p50": 0.035,
  "p95": 0.045,
  "p99": 0.156,
  "max": 0.182,
  "tail_runs": 476,
  "tail_threshold": 0.0461,
  "tail_share_percent": 14.8,
  "tail_ratio": 4.5,
  "histogram": [
    { "lower": 0.022, "upper": 0.0228, "count": 12, "is_tail": false }
  ]
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/traces"
            description="Individual runs, most expensive first"
          >
            <p>
              Optional <code>workflow</code>{" "}
              parameter. Use the returned{" "}
              <code>trace_id</code> with the
              endpoint below.
            </p>
            <CodeBlock
              language="json"
              code={`[
  {
    "trace_id": "9f2c41a0b7d3e5f1",
    "workflow": "support-triage",
    "calls": 11,
    "total_cost": 0.0879,
    "max_depth": 2,
    "failed_calls": 0,
    "started_at": "2026-08-11T09:14:20Z",
    "duration_ms": 7420
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/analytics/traces/{trace_id}"
            description="Every span of one run, ordered as it executed"
          >
            <p>
              Spans are returned flat with parent ids rather than pre-nested, so
              a span whose parent never arrived cannot break the response.
              Returns 404 if the trace does not belong to your project.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "trace_id": "9f2c41a0b7d3e5f1",
  "workflow": "support-triage",
  "total_cost": 0.0879,
  "total_calls": 11,
  "max_depth": 2,
  "duration_ms": 7420,
  "spans": [
    {
      "span_id": "1b40a23d06f0401f",
      "parent_span_id": null,
      "step_name": "classify",
      "tool_name": null,
      "step_index": 0,
      "depth": 1,
      "model": "gpt-4o",
      "cost": 0.00082,
      "latency_ms": 340,
      "success": true
    }
  ]
}`}
            />
          </Endpoint>
        </Section>

        {/* Guardrails */}
        <Section id="guardrails" title="Guardrails">
          <p>
            A declared boundary per agent, judged against observed usage. Four
            boundaries, each optional: permitted tools, read-only, permitted
            models, and per-run limits on tool calls and cost. This is a
            separate concept from success rate: success measures whether a call
            raised an error, compliance measures whether an agent stayed inside
            the boundary you declared. Tool boundaries only see calls instrumented
            with <code>track_costs.tool(...)</code> and per-run limits only see
            calls inside <code>track_costs.workflow()</code>, so every verdict is
            reported alongside instrumentation coverage. Model boundaries see
            every call.
          </p>

          <Endpoint
            method="GET"
            path="/v1/guardrails"
            description="Declared guardrails for every agent in the project"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "id": "6f0e2a44-9c1b-4d2f-8a3e-1b2c3d4e5f60",
    "agent_name": "research-agent",
    "allowed_tools": ["web_search"],
    "read_only": true,
    "allowed_models": null,
    "max_tool_calls_per_run": 8,
    "max_cost_per_run_usd": null,
    "enabled": true,
    "created_at": "2026-08-12T09:14:22Z",
    "updated_at": "2026-08-30T16:02:10Z"
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/guardrails/compliance"
            description="Observed tool usage judged against each agent's declared guardrail"
          >
            <p>
              Accepts <code>range</code> (1h, 24h, 7d, 30d, 90d). A breach is{" "}
              <code>{"{kind, subject, count, limit, observed, last_seen}"}</code>:{" "}
              <code>subject</code> is the tool, the model, or for per-run kinds
              the worst run&apos;s <code>trace_id</code>; <code>count</code> is
              breaching calls, or runs over the limit. Kinds:{" "}
              <code>undeclared_tool</code>, <code>write_in_readonly</code>,{" "}
              <code>undeclared_model</code>, <code>tool_calls_over_limit</code>{" "}
              and <code>run_cost_over_limit</code>. Tools a read-only agent used
              that carry no read/write tag are listed in{" "}
              <code>unknown_access_tools</code> rather than silently judged
              either way. Each agent also carries the detail behind the verdict:{" "}
              <code>tool_usage</code> and <code>model_usage</code> (calls, cost,
              tag, whether permitted), <code>run_stats</code> (p50, p95 and max
              tool calls and cost per run, so a limit can be set from observed
              behaviour) and <code>breach_series</code> (breaching calls or runs
              per day).
            </p>
            <CodeBlock
              language="json"
              code={`{
  "agents": [
    {
      "agent_name": "email-drafter",
      "status": "breach",
      "read_only": true,
      "allowed_tools": null,
      "allowed_models": null,
      "max_tool_calls_per_run": null,
      "max_cost_per_run_usd": null,
      "total_calls": 15000,
      "total_cost": 4.33,
      "tracked_tool_calls": 120,
      "runs_seen": 0,
      "observed_tools": ["send_email"],
      "observed_models": ["gpt-4o"],
      "tool_usage": [
        { "tool_name": "send_email", "calls": 120, "last_seen": "2026-09-01T18:44:03Z", "access": "write", "breach_kind": "write_in_readonly" }
      ],
      "model_usage": [
        { "model": "gpt-4o", "calls": 15000, "cost": 4.33, "permitted": true }
      ],
      "run_stats": null,
      "breach_series": [
        { "day": "2026-09-01", "count": 120 }
      ],
      "breaches": [
        {
          "kind": "write_in_readonly",
          "subject": "send_email",
          "count": 120,
          "limit": null,
          "observed": null,
          "last_seen": "2026-09-01T18:44:03Z"
        }
      ],
      "unknown_access_tools": []
    },
    {
      "agent_name": "research-agent",
      "status": "breach",
      "read_only": true,
      "allowed_tools": ["web_search"],
      "allowed_models": null,
      "max_tool_calls_per_run": 8,
      "max_cost_per_run_usd": null,
      "total_calls": 2600,
      "total_cost": 137.92,
      "tracked_tool_calls": 2210,
      "runs_seen": 442,
      "observed_tools": ["web_search"],
      "observed_models": ["claude-sonnet-4"],
      "tool_usage": [
        { "tool_name": "web_search", "calls": 2210, "last_seen": "2026-09-01T09:02:41Z", "access": "read", "breach_kind": null }
      ],
      "model_usage": [
        { "model": "claude-sonnet-4", "calls": 2600, "cost": 137.92, "permitted": true }
      ],
      "run_stats": {
        "runs": 442, "p50_tool_calls": 5, "p95_tool_calls": 11, "max_tool_calls": 14,
        "p50_cost": 0.27, "p95_cost": 0.59, "max_cost": 0.76
      },
      "breach_series": [
        { "day": "2026-08-30", "count": 9 },
        { "day": "2026-09-01", "count": 15 }
      ],
      "breaches": [
        {
          "kind": "tool_calls_over_limit",
          "subject": "7c1e4b0a9d2f48e6b3a5c7d9e1f2a3b4",
          "count": 24,
          "limit": 8,
          "observed": 14,
          "last_seen": "2026-09-01T09:02:41Z"
        }
      ],
      "unknown_access_tools": []
    }
  ],
  "tool_tags": [
    { "tool_name": "send_email", "access": "write" },
    { "tool_name": "web_search", "access": "read" }
  ],
  "start_time": "2026-08-26T00:00:00Z",
  "end_time": "2026-09-02T00:00:00Z",
  "total_calls": 98400,
  "tool_tracked_calls": 26100
}`}
            />
          </Endpoint>

          <Callout title="Breaches are alerted at ingest">
            <p>
              When a batch contains a breaching tool call, owners and admins
              receive an in-app notification and the project webhook (if
              configured) receives a <code>guardrail.breach</code> event
              signed like budget alerts. One alert per agent, subject and kind
              per hour. Per-run limits are judged on the run&apos;s stored totals,
              so a run that crosses its limit across several batches still
              alerts.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "project_id": "6f0e2a44-9c1b-4d2f-8a3e-1b2c3d4e5f60",
  "agent_name": "email-drafter",
  "kind": "write_in_readonly",
  "subject": "send_email",
  "count": 3,
  "limit": null,
  "observed": null,
  "observed_at": "2026-09-02T18:44:03Z"
}`}
            />
          </Callout>

          <Endpoint
            method="PUT"
            path="/v1/projects/{project_id}/guardrails"
            description="Create or replace the guardrail for one agent (member session, EDIT_PROJECT)"
          >
            <p>
              Every field is optional and <code>null</code> means unbounded.{" "}
              <code>allowed_tools</code> and <code>allowed_models</code>:{" "}
              <code>null</code> permits any, <code>[]</code> permits none.{" "}
              <code>max_tool_calls_per_run</code> (integer, at least 1) and{" "}
              <code>max_cost_per_run_usd</code> (positive) are judged over calls
              that share a <code>trace_id</code>. The SDK&apos;s project API key
              cannot call this — the credential being judged must not be able to
              rewrite the policy it is judged against.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "agent_name": "research-agent",
  "allowed_tools": ["web_search"],
  "read_only": true,
  "allowed_models": ["claude-sonnet-4"],
  "max_tool_calls_per_run": 8,
  "max_cost_per_run_usd": 0.25,
  "enabled": true
}`}
            />
          </Endpoint>

          <Endpoint
            method="DELETE"
            path="/v1/projects/{project_id}/guardrails/{agent_name}"
            description="Remove the guardrail for one agent (member session, EDIT_PROJECT)"
          />

          <Endpoint
            method="PUT"
            path="/v1/projects/{project_id}/guardrails/tool-tags"
            description="Tag a tool name as read or write (member session, EDIT_PROJECT)"
          >
            <CodeBlock
              language="json"
              code={`{ "tool_name": "send_email", "access": "write" }`}
            />
          </Endpoint>

          <Endpoint
            method="DELETE"
            path="/v1/projects/{project_id}/guardrails/tool-tags/{tool_name}"
            description="Remove a tool's read/write tag (member session, EDIT_PROJECT)"
          />
        </Section>

        {/* Optimizations */}
        <Section id="optimizations" title="Optimizations">
          <Endpoint
            method="GET"
            path="/v1/optimizations"
            description="Get AI-powered cost optimization suggestions"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`[
  {
    "type": "model_downgrade",
    "title": "Switch router-agent from gpt-4 to gpt-3.5-turbo",
    "description": "Agent 'router-agent' uses gpt-4 but generates only 50 tokens on average.",
    "estimated_savings_monthly": 45.50,
    "estimated_savings_percent": 95.0,
    "priority": "high",
    "action_items": [
      "Review prompts and outputs",
      "Test with gpt-3.5-turbo",
      "Update model configuration"
    ]
  }
]`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/optimizations/summary"
            description="Get summary of potential savings"
          >
            <p>Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "total_potential_savings_monthly": 125.50,
  "total_potential_savings_percent": 35.2,
  "suggestion_count": 5,
  "high_priority_count": 2
}`}
            />
          </Endpoint>
        </Section>

        {/* Error Handling */}
        <Section id="errors" title="Error Handling">
          <p>
            The API uses standard HTTP status codes. Error responses include a
            message explaining what went wrong:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "detail": "Invalid API key"
}`}
          />
          <div className="overflow-x-auto max-w-full mt-4">
            <table className="min-w-100">
              <thead>
                <tr>
                  <th className="font-medium">
                    Status Code
                  </th>
                  <th className="font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono">200</td>
                  <td>Success</td>
                </tr>
                <tr>
                  <td className="font-mono">201</td>
                  <td>Created</td>
                </tr>
                <tr>
                  <td className="font-mono">400</td>
                  <td>Bad Request - Invalid input</td>
                </tr>
                <tr>
                  <td className="font-mono">401</td>
                  <td>
                    Unauthorized - Invalid or missing API key
                  </td>
                </tr>
                <tr>
                  <td className="font-mono">404</td>
                  <td>
                    Not Found - Resource does not exist
                  </td>
                </tr>
                <tr>
                  <td className="font-mono text-orange-400">429</td>
                  <td>
                    Too Many Requests - Rate limit exceeded
                  </td>
                </tr>
                <tr>
                  <td className="font-mono">500</td>
                  <td>Internal Server Error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Rate Limiting */}
        <Section id="rate-limiting" title="Rate Limiting">
          <p>
            The API enforces rate limiting to ensure fair usage and protect the
            service. Rate limits are applied per API key or IP address.
          </p>
          <div className="docs-panel mb-4">
            <p>
              <strong className="text-white">Default limits:</strong> 100
              requests per minute
            </p>
          </div>
          <p>
            Rate limit headers are included in all API responses:
          </p>
          <CodeBlock
            language="http"
            code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 45`}
          />
          <p>
            When rate limited, you&apos;ll receive a 429 response:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "detail": "Rate limit exceeded. Please slow down.",
  "retry_after": 45,
  "limit": 100,
  "period": "60 seconds"
}`}
          />
          <div className="docs-panel mt-4">
            <p>
              <strong>Tip:</strong> The SDK automatically handles rate limiting
              with built-in batching and retry logic. You typically don&apos;t
              need to worry about rate limits when using the SDK.
            </p>
          </div>
        </Section>

        {/* SDKs & Libraries */}
        <Section id="sdks" title="SDKs & Libraries">
          <p>
            Official SDK for integrating AgentCost into your applications:
          </p>
          <div className="docs-panel">
            <p className="font-medium text-neutral-200">Python SDK</p>
            <p>For OpenAI, Anthropic, Gemini, and LangChain applications</p>
            <CodeBlock language="bash" code="pip install agentcost" />
            <div className="mt-4">
              <a
                href="/docs/sdk"
                target="_blank"
                rel="noopener noreferrer"
               
              >
                View SDK Documentation →
              </a>
            </div>
          </div>
          <div className="docs-panel docs-panel--warning mt-4">
            <p>
              <strong>Coming Soon:</strong> JavaScript/TypeScript SDK, Go SDK,
              and REST client libraries for other languages.
            </p>
          </div>
        </Section>

        {/* Webhooks (Coming Soon) */}
        <Section id="webhooks" title="Webhooks">
          <p>
            Budget threshold crossings are pushed to your endpoint as they
            happen, signed so the receiver can verify origin and freshness.
            Delivery is best-effort and never delays event ingestion — poll{" "}
            <a href="#egress">
              budget-state
            </a>{" "}
            as the reliable channel.
          </p>

          <Endpoint
            method="PUT"
            path="/v1/projects/{project_id}/webhook"
            description="Configure the webhook (requires project-edit permission)"
          >
            <CodeBlock
              language="json"
              code={`{"url": "https://your-endpoint.example/agentcost", "secret": "whsec_..."}`}
            />
            <div className="docs-panel mt-3">
              <p>
                HTTPS required. <code>{`{"url": null}`}</code>{" "}
                disables the hook and clears the secret. When rotating a
                secret, restate the URL — a secret without a URL is rejected.
                The secret is write-only: GET on the same path returns the URL
                and whether a secret is set, never the secret itself.
              </p>
            </div>
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/projects/{project_id}/webhook/test"
            description="Send a signed sample delivery to verify the wiring"
          >
            <p>
              Same payload shape and signature scheme as a live delivery; the
              event type is <code>webhook.test</code>.
              Returns whether the endpoint accepted it and the status code.
            </p>
          </Endpoint>

          <div className="docs-panel">
            <h4 className="text-white">Verifying a delivery</h4>
            <p>
              Each POST carries <code>X-AgentCost-Signature</code>{" "}
              = HMAC-SHA256 over{" "}
              <code>{"{timestamp}.{body}"}</code>{" "}
              with your secret, and{" "}
              <code>X-AgentCost-Timestamp</code>.
              Reject stale timestamps before comparing digests — the timestamp
              is inside the signed string, so a captured delivery cannot be
              replayed with a fresh header.
            </p>
            <CodeBlock
              language="python"
              code={`import hashlib, hmac

def verify(secret: str, timestamp: str, body: str, signature: str) -> bool:
    expected = hmac.new(
        secret.encode(), f"{timestamp}.{body}".encode(), hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)`}
            />
            <p>
              Delivery rules: only a 2xx counts as delivered; redirects are not
              followed; non-public destination addresses are refused
              (self-hosted installs posting to internal listeners set{" "}
              <code>WEBHOOK_ALLOW_PRIVATE_URLS=true</code>).
            </p>
          </div>
        </Section>

        {/* Budget state & Prometheus */}
        <Section id="egress" title="Budget State &amp; Metrics">
          <Endpoint
            method="GET"
            path="/v1/projects/{project_id}/budget-state"
            description="Compact budget position for machine consumers (project API key auth)"
          >
            <p>
              Side-effect-free and shaped for polling: an enforcement point
              reads it every 15–60s and holds the answer as cached state.{" "}
              <code>as_of</code> and{" "}
              <code>period_ends_at</code> let a
              consumer reason about staleness and time remaining.
            </p>
            <CodeBlock
              language="json"
              code={`{
  "project_id": "proj_abc123",
  "enabled": true,
  "mode": "warn",
  "currency": "USD",
  "budget": 500.0,
  "spend_mtd": 390.0,
  "remaining": 110.0,
  "utilization_percent": 78.0,
  "thresholds_crossed": [50, 75],
  "exhausted": false,
  "period_ends_at": "2026-09-01T00:00:00+00:00",
  "as_of": "2026-08-15T10:30:45+00:00"
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/metrics"
            description="Prometheus exposition of the project's cost metrics"
          >
            <p>
              Windowed gauges (not monotonic counters — use{" "}
              <code>max_over_time</code>, not{" "}
              <code>rate()</code>):{" "}
              <code>agentcost_calls</code>,{" "}
              <code>agentcost_cost_usd</code>,{" "}
              <code>agentcost_tokens</code>,{" "}
              <code>agentcost_cached_tokens</code>,{" "}
              <code>agentcost_errors</code>, per-model
              and per-agent cost, plus budget utilization and remaining when a
              budget is set.
            </p>
            <CodeBlock
              language="yaml"
              code={`scrape_configs:
  - job_name: agentcost
    metrics_path: /v1/metrics
    authorization:
      credentials: <project_api_key>
    static_configs:
      - targets: ['api.agentcost.tech']`}
            />
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/pricing/import"
            description="Load the pricing catalogue from an uploaded LiteLLM bundle (admin only)"
          >
            <p>
              For air-gapped and egress-restricted deployments: fetch{" "}
              <code>
                model_prices_and_context_window.json
              </code>{" "}
              on a connected machine, review it, and upload it verbatim. Same
              parsing and sanity bounds as the network sync.
            </p>
          </Endpoint>
        </Section>

        {/* Versioning */}
        <Section id="versioning" title="API Versioning">
          <p>
            The API uses URL path versioning. The current version is{" "}
            <code>
              v1
            </code>
            .
          </p>
          <div className="docs-panel">
            <div className="docs-table-wrap">
              <table className="min-w-105">
              <thead>
                <tr>
                  <th className="font-medium">
                    Version
                  </th>
                  <th className="font-medium">
                    Status
                  </th>
                  <th className="font-medium">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-mono">v1</td>
                  <td>
                    <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-700/50">
                      Current
                    </span>
                  </td>
                  <td>
                    Stable, recommended for production
                  </td>
                </tr>
              </tbody>
              </table>
            </div>
          </div>
          <p>
            We follow semantic versioning. Breaking changes will result in a new
            major version. Deprecated endpoints will be announced at least 6
            months before removal.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <a
              href="/docs/sdk"
             
            >
              ← SDK Documentation
            </a>
            <div className="flex items-center gap-4">
              <Link
                href="/"
               
              >
                Home
              </Link>
              <Link
                href="/auth/register"
               
              >
                Get started free
              </Link>
            </div>
          </div>
        </div>
    </>
  );
}
