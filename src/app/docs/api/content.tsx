"use client";

import { Copy, Check, Code, Server, Database, Shield, Zap } from "lucide-react";
import { useState, useEffect } from "react";

// Get the API base URL dynamically
function useApiBaseUrl() {
  const [baseUrl, setBaseUrl] = useState<string>("");

  useEffect(() => {
    // Use the current origin for the API URL, or fall back to environment variable
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl) {
      setBaseUrl(envUrl.replace(/\/$/, "")); // Remove trailing slash
    } else {
      // Default to production API URL
      setBaseUrl(
        typeof window !== "undefined"
          ? `${window.location.protocol}//${window.location.hostname}:8000`
          : "https://api.agentcost.tech",
      );
    }
  }, []);

  return baseUrl;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 rounded-md bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} className="text-neutral-400" />
      )}
    </button>
  );
}

function CodeBlock({
  code,
  language = "bash",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative rounded-lg bg-neutral-800/50 border border-neutral-700/50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700/50">
        <span className="text-xs font-medium text-neutral-500 uppercase">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-neutral-300">{code}</code>
      </pre>
    </div>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-green-900/30 text-green-400 border-green-700/50",
    POST: "bg-blue-900/30 text-blue-400 border-blue-700/50",
    PUT: "bg-yellow-900/30 text-yellow-400 border-yellow-700/50",
    DELETE: "bg-red-900/30 text-red-400 border-red-700/50",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${colors[method] || colors.GET}`}
    >
      {method}
    </span>
  );
}

function Endpoint({
  method,
  path,
  description,
  auth = true,
  children,
}: {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 overflow-hidden">
      <div className="p-4 border-b border-neutral-700/50">
        <div className="flex items-center gap-3 mb-2">
          <MethodBadge method={method} />
          <code className="text-white font-mono">{path}</code>
          {auth && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-700/50">
              <Shield size={12} />
              Auth
            </span>
          )}
        </div>
        <p className="text-neutral-400 text-sm">{description}</p>
      </div>
      {children && <div className="p-4 bg-neutral-900/50">{children}</div>}
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-900/30 text-primary-400">
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function APIReferencePage() {
  const apiBaseUrl = useApiBaseUrl();

  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="mx-auto max-w-4xl px-6 py-8 pt-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">API Reference</h1>
          <p className="mt-2 text-neutral-400">
            Complete REST API documentation for the AgentCost backend
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            Contents
          </h3>
          <nav className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <a
              href="#authentication"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Authentication
            </a>
            <a
              href="#user-auth"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              User Login & Registration
            </a>
            <a
              href="#health"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Health Check
            </a>
            <a
              href="#projects"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Projects
            </a>
            <a
              href="#team"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Team Management
            </a>
            <a
              href="#events"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Events
            </a>
            <a
              href="#analytics"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Analytics
            </a>
            <a
              href="#optimizations"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Optimizations
            </a>
            <a
              href="#errors"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Error Handling
            </a>
            <a
              href="#rate-limiting"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Rate Limiting
            </a>
            <a
              href="#sdks"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              SDKs & Libraries
            </a>
            <a
              href="#webhooks"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              Webhooks
            </a>
            <a
              href="#versioning"
              className="text-primary-400 hover:text-primary-300 transition-colors text-sm"
            >
              API Versioning
            </a>
          </nav>
        </div>

        {/* Base URL */}
        <div className="mb-12 rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">
            Base URL
          </h3>
          <code className="text-primary-400 font-mono text-lg">
            {apiBaseUrl || "https://api.yourdomain.com"}
          </code>
          <p className="mt-2 text-sm text-neutral-500">
            All API endpoints are relative to this base URL
          </p>
        </div>

        {/* Authentication */}
        <Section id="authentication" title="Authentication" icon={Shield}>
          <p className="text-neutral-300 mb-4">
            AgentCost uses two types of authentication:
          </p>
          <div className="overflow-x-auto mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                    Type
                  </th>
                  <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                    Used For
                  </th>
                  <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                    Header
                  </th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                <tr className="border-b border-neutral-800">
                  <td className="py-2 px-3 font-medium text-white">API Key</td>
                  <td className="py-2 px-3">SDK tracking, analytics, events</td>
                  <td className="py-2 px-3">
                    <code className="text-primary-400">
                      Authorization: Bearer sk_xxx
                    </code>
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-2 px-3 font-medium text-white">
                    JWT Token
                  </td>
                  <td className="py-2 px-3">
                    Dashboard, user actions, team management
                  </td>
                  <td className="py-2 px-3">
                    <code className="text-primary-400">
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
          <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-4 mt-4">
            <p className="text-yellow-300 text-sm">
              <strong>Security:</strong> API keys provide project-level access
              for your SDK. JWT tokens are user-specific and expire after 1
              hour, but are automatically refreshed.
            </p>
          </div>
        </Section>

        {/* User Authentication */}
        <Section id="user-auth" title="User Login & Registration" icon={Shield}>
          <p className="text-neutral-300 mb-4">
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
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "email": "user@example.com",
  "password": "your_secure_password",
  "name": "John Doe"
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "email_verified": false
  }
}`}
            />
            <div className="rounded-lg bg-blue-900/20 border border-blue-700/50 p-3 mt-3">
              <p className="text-blue-300 text-sm">
                A verification email will be sent. Users must verify their email
                before logging in.
              </p>
            </div>
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/auth/login"
            description="Authenticate and get access tokens"
            auth={false}
          >
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "email": "user@example.com",
  "password": "your_password",
  "remember_me": true
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "refresh_token": "your_refresh_token"
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">
              Response (204 No Content)
            </p>
            <p className="text-neutral-400 text-sm">
              Session is invalidated. The access token will no longer be valid.
            </p>
          </Endpoint>
        </Section>

        {/* Health */}
        <Section id="health" title="Health Check" icon={Zap}>
          <Endpoint
            method="GET"
            path="/v1/health"
            description="Check if the backend is running and healthy"
            auth={false}
          >
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
        <Section id="projects" title="Projects" icon={Database}>
          <Endpoint
            method="POST"
            path="/v1/projects"
            description="Create a new project and get an API key"
            auth={false}
          >
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "name": "my-project",
  "description": "Optional project description"
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
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
            <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-3 mt-3">
              <p className="text-yellow-300 text-sm">
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-xs text-neutral-500 mt-2">
              API keys are write-only and are never returned in read endpoints.
            </p>
          </Endpoint>

          <Endpoint
            method="PATCH"
            path="/v1/projects/{project_id}"
            description="Update project settings"
          >
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "name": "Updated project name",
  "description": "Updated description",
  "is_active": true
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response (200 OK)</p>
            <CodeBlock language="json" code={`{ "status": "deleted" }`} />
            <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-3 mt-3">
              <p className="text-yellow-300 text-sm">
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
        <Section id="team" title="Team Management" icon={Shield}>
          <p className="text-neutral-300 mb-4">
            Manage team members and their access to your project. All team
            endpoints require JWT authentication.
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                    Role
                  </th>
                  <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                    Permissions
                  </th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                <tr className="border-b border-neutral-800">
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-amber-900/30 text-amber-400 border border-amber-700/50">
                      Admin
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    Full access: invite/remove members, change roles, delete
                    project
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-blue-900/30 text-blue-400 border border-blue-700/50">
                      Member
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    View analytics, create events, export data
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-2 px-3">
                    <span className="px-2 py-0.5 rounded text-xs bg-neutral-700 text-neutral-300 border border-neutral-600">
                      Viewer
                    </span>
                  </td>
                  <td className="py-2 px-3">
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "email": "newmember@example.com",
  "role": "member"
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "message": "Invitation sent to newmember@example.com",
  "membership_id": "mem_789",
  "role": "member"
}`}
            />
            <div className="rounded-lg bg-blue-900/20 border border-blue-700/50 p-3 mt-3">
              <p className="text-blue-300 text-sm">
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">
              Response (204 No Content)
            </p>
          </Endpoint>

          <Endpoint
            method="PATCH"
            path="/v1/projects/{project_id}/members/{user_id}"
            description="Update a member's role (Admin only)"
          >
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "role": "admin"
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">
              Response (204 No Content)
            </p>
          </Endpoint>

          <Endpoint
            method="POST"
            path="/v1/projects/{project_id}/leave"
            description="Leave a project voluntarily"
          >
            <p className="text-sm text-neutral-400 mb-2">
              Response (204 No Content)
            </p>
            <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-3 mt-3">
              <p className="text-yellow-300 text-sm">
                Project owners cannot leave. They must transfer ownership or
                delete the project.
              </p>
            </div>
          </Endpoint>
        </Section>

        {/* Events */}
        <Section id="events" title="Events" icon={Code}>
          <Endpoint
            method="POST"
            path="/v1/events/batch"
            description="Ingest a batch of LLM call events (used by SDK)"
          >
            <p className="text-sm text-neutral-400 mb-2">Request Body:</p>
            <CodeBlock
              language="json"
              code={`{
  "project_id": "proj_abc123",
  "events": [
    {
      "agent_name": "router-agent",
      "model": "gpt-4",
      "input_tokens": 150,
      "output_tokens": 80,
      "total_tokens": 230,
      "cost": 0.0093,
      "latency_ms": 1234,
      "timestamp": "2024-01-23T10:30:45.123Z",
      "success": true,
      "metadata": {"user_id": "user_123"}
    }
  ]
}`}
            />
            <p className="text-sm text-neutral-400 mb-2 mt-4">Response:</p>
            <CodeBlock
              language="json"
              code={`{
  "status": "ok",
  "inserted": 1
}`}
            />
          </Endpoint>

          <Endpoint
            method="GET"
            path="/v1/events"
            description="Get recent events for the authenticated project"
          >
            <p className="text-sm text-neutral-400 mb-2">Query Parameters:</p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                      Parameter
                    </th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                      Type
                    </th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                      Default
                    </th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">
                      limit
                    </td>
                    <td className="py-2 px-3">int</td>
                    <td className="py-2 px-3">100</td>
                    <td className="py-2 px-3">Maximum events to return</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">
                      offset
                    </td>
                    <td className="py-2 px-3">int</td>
                    <td className="py-2 px-3">0</td>
                    <td className="py-2 px-3">Number of events to skip</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">
                      agent_name
                    </td>
                    <td className="py-2 px-3">str</td>
                    <td className="py-2 px-3">-</td>
                    <td className="py-2 px-3">Filter by agent name</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Endpoint>
        </Section>

        {/* Analytics */}
        <Section id="analytics" title="Analytics" icon={Server}>
          <Endpoint
            method="GET"
            path="/v1/analytics/overview"
            description="Get cost overview for the project"
          >
            <p className="text-sm text-neutral-400 mb-2">Query Parameters:</p>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                      Parameter
                    </th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                      Type
                    </th>
                    <th className="text-left py-2 px-3 text-neutral-400 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  <tr className="border-b border-neutral-800">
                    <td className="py-2 px-3 font-mono text-primary-400">
                      range
                    </td>
                    <td className="py-2 px-3">str</td>
                    <td className="py-2 px-3">Time range: 24h, 7d, 30d, 90d</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
        </Section>

        {/* Optimizations */}
        <Section id="optimizations" title="Optimizations" icon={Zap}>
          <Endpoint
            method="GET"
            path="/v1/optimizations"
            description="Get AI-powered cost optimization suggestions"
          >
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
            <p className="text-sm text-neutral-400 mb-2">Response:</p>
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
        <Section id="errors" title="Error Handling" icon={Shield}>
          <p className="text-neutral-300 mb-4">
            The API uses standard HTTP status codes. Error responses include a
            message explaining what went wrong:
          </p>
          <CodeBlock
            language="json"
            code={`{
  "detail": "Invalid API key"
}`}
          />
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                    Status Code
                  </th>
                  <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                <tr className="border-b border-neutral-800">
                  <td className="py-3 px-4 font-mono text-green-400">200</td>
                  <td className="py-3 px-4">Success</td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3 px-4 font-mono text-green-400">201</td>
                  <td className="py-3 px-4">Created</td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3 px-4 font-mono text-yellow-400">400</td>
                  <td className="py-3 px-4">Bad Request - Invalid input</td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3 px-4 font-mono text-yellow-400">401</td>
                  <td className="py-3 px-4">
                    Unauthorized - Invalid or missing API key
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3 px-4 font-mono text-yellow-400">404</td>
                  <td className="py-3 px-4">
                    Not Found - Resource does not exist
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3 px-4 font-mono text-orange-400">429</td>
                  <td className="py-3 px-4">
                    Too Many Requests - Rate limit exceeded
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3 px-4 font-mono text-red-400">500</td>
                  <td className="py-3 px-4">Internal Server Error</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* Rate Limiting */}
        <Section id="rate-limiting" title="Rate Limiting" icon={Shield}>
          <p className="text-neutral-300 mb-4">
            The API enforces rate limiting to ensure fair usage and protect the
            service. Rate limits are applied per API key or IP address.
          </p>
          <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-4 mb-4">
            <p className="text-neutral-300">
              <strong className="text-white">Default limits:</strong> 100
              requests per minute
            </p>
          </div>
          <p className="text-neutral-300 mb-4">
            Rate limit headers are included in all API responses:
          </p>
          <CodeBlock
            language="http"
            code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 45`}
          />
          <p className="text-neutral-300 mt-4 mb-4">
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
          <div className="rounded-lg bg-blue-900/20 border border-blue-700/50 p-4 mt-4">
            <p className="text-blue-300 text-sm">
              <strong>Tip:</strong> The SDK automatically handles rate limiting
              with built-in batching and retry logic. You typically don&apos;t
              need to worry about rate limits when using the SDK.
            </p>
          </div>
        </Section>

        {/* SDKs & Libraries */}
        <Section id="sdks" title="SDKs & Libraries" icon={Code}>
          <p className="text-neutral-300 mb-4">
            Official SDK for integrating AgentCost into your applications:
          </p>
          <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/30 text-blue-400">
                <Code size={20} />
              </div>
              <div>
                <h4 className="font-medium text-white">Python SDK</h4>
                <p className="text-xs text-neutral-500">
                  For OpenAI, Anthropic, and LangChain applications
                </p>
              </div>
            </div>
            <CodeBlock language="bash" code="pip install agentcost" />
            <div className="mt-4">
              <a
                href="/docs/sdk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 text-sm"
              >
                View SDK Documentation →
              </a>
            </div>
          </div>
          <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-4 mt-4">
            <p className="text-yellow-300 text-sm">
              <strong>Coming Soon:</strong> JavaScript/TypeScript SDK, Go SDK,
              and REST client libraries for other languages.
            </p>
          </div>
        </Section>

        {/* Webhooks (Coming Soon) */}
        <Section id="webhooks" title="Webhooks" icon={Zap}>
          <p className="text-neutral-300 mb-4">
            Receive real-time notifications when events occur in your project.
          </p>
          <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-4">
            <h4 className="font-medium text-white mb-2">
              Planned Webhook Events
            </h4>
            <ul className="list-disc list-inside text-neutral-400 text-sm space-y-1">
              <li>
                <code className="text-primary-400">
                  cost.threshold.exceeded
                </code>{" "}
                - Daily cost limit exceeded
              </li>
              <li>
                <code className="text-primary-400">error.rate.high</code> -
                Error rate above threshold
              </li>
              <li>
                <code className="text-primary-400">latency.high</code> - Average
                latency above threshold
              </li>
              <li>
                <code className="text-primary-400">project.created</code> - New
                project created
              </li>
            </ul>
          </div>
          <div className="rounded-lg bg-blue-900/20 border border-blue-700/50 p-4 mt-4">
            <p className="text-blue-300 text-sm">
              <strong>Coming Soon:</strong> Webhooks are currently in
              development. Contact us if you need this feature for your use
              case.
            </p>
          </div>
        </Section>

        {/* Versioning */}
        <Section id="versioning" title="API Versioning" icon={Database}>
          <p className="text-neutral-300 mb-4">
            The API uses URL path versioning. The current version is{" "}
            <code className="text-primary-400 bg-neutral-800 px-1 rounded">
              v1
            </code>
            .
          </p>
          <div className="rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700">
                  <th className="text-left py-2 px-4 text-neutral-400 font-medium">
                    Version
                  </th>
                  <th className="text-left py-2 px-4 text-neutral-400 font-medium">
                    Status
                  </th>
                  <th className="text-left py-2 px-4 text-neutral-400 font-medium">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="text-neutral-300">
                <tr>
                  <td className="py-2 px-4 font-mono text-primary-400">v1</td>
                  <td className="py-2 px-4">
                    <span className="px-2 py-0.5 rounded text-xs bg-green-900/30 text-green-400 border border-green-700/50">
                      Current
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    Stable, recommended for production
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-neutral-400 text-sm mt-4">
            We follow semantic versioning. Breaking changes will result in a new
            major version. Deprecated endpoints will be announced at least 6
            months before removal.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <div className="flex items-center justify-between">
            <a
              href="/docs/sdk"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              ← SDK Documentation
            </a>
            <a
              href="/settings"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              Back to Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
