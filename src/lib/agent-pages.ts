/**
 * Markdown for the public pages whose content is inline TSX with no markdown
 * source. Everything here restates a claim the site already makes — see
 * components/landing/faq-data.ts, lib/comparisons.ts and the docs pages.
 *
 * Pages backed by data modules (blog, changelog, comparisons) are NOT here:
 * those are rendered from the data in agent-content.ts so they cannot drift.
 */

import type { AgentSection } from "@/lib/agent-content";
import { API_URL, CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export type HandAuthoredPage = {
  route: string;
  title: string;
  description: string;
  section: AgentSection;
  body: string;
};

export const handAuthoredPages: HandAuthoredPage[] = [
  {
    route: "/",
    title: "AgentCost — LLM cost tracking for agents",
    description:
      "Track OpenAI, Anthropic, Gemini and LangChain spend in real time, attributed to the agent that caused it. Free hosted cloud, MIT-licensed stack.",
    section: "Product",
    body: `AgentCost records every LLM call your application makes — model, tokens, cost,
latency and status — and attributes it to the agent, workflow and project that
caused it. It answers the question a provider dashboard cannot: which part of my
system is expensive, and what would be cheaper?

## Quick start

Install the Python SDK and add two lines. Existing LangChain, OpenAI and
Anthropic code runs unchanged — the SDK intercepts calls by monkey-patching the
provider client, so there is no refactoring.

\`\`\`bash
pip install agentcost
\`\`\`

\`\`\`python
import agentcost
agentcost.init(api_key="sk_your_project_key")
\`\`\`

## What it gives you

- **Per-agent attribution** — wrap a block with \`track_costs.agent("planner")\` and every call inside it is billed to that agent.
- **Workflow and trace analysis** — step costs, repeated work and per-run totals across multi-step agents.
- **Budget guardrails** — monthly project budgets with threshold alerts, and an optional hard cap that rejects ingestion with a 429 once the budget is reached.
- **Guardrail compliance** — declare per agent whether it is read-only and which tools it may call; the dashboard reports breaches per agent from observed tool usage and alerts on them, kept separate from success rate.
- **Optimization recommendations** — cheaper-model suggestions and caching opportunities derived from your own traffic, with effectiveness tracked after you apply them.
- **Executive reports** — a board-ready PDF or CSV over any date range.
- **A public model catalogue** — 3,500+ models across 50+ providers with per-1k input, output and cached rates, synced from LiteLLM.

## Cost

Free. The hosted cloud has no tiers, seat limits or usage caps, and the whole
stack is MIT-licensed, so you can self-host the FastAPI backend and PostgreSQL
on your own infrastructure instead. In self-hosted mode nothing leaves your
environment and there is no telemetry or phone-home behaviour.

## Stack

Backend: Python, FastAPI, async SQLAlchemy, PostgreSQL. Frontend: Next.js,
React, Tailwind CSS. SDK: Python, using tiktoken for token counting and httpx
for async delivery.`,
  },

  {
    route: "/pricing",
    title: "AgentCost Pricing",
    description:
      "Free at every level — no tiers, no seat limits, no usage caps — plus an MIT-licensed stack you can self-host.",
    section: "Product",
    body: `AgentCost is free.

- **Hosted cloud** — sign up and use it. No usage limits, no tiers, and no premium features behind a paywall. Events are stored at ${API_URL}, and you can delete your data or your account at any time.
- **Self-hosted** — the same stack is MIT-licensed. Run the FastAPI backend and PostgreSQL with Docker on your own infrastructure. Nothing leaves your environment and there is no telemetry.

There is no paid plan, and no feature is gated on payment.

If you are weighing AgentCost against a paid platform, the side-by-side pages at
${SITE_URL}/compare cover Helicone, Langfuse and LiteLLM, with each vendor's
pricing read off their own page on a stated date.`,
  },

  {
    route: "/docs",
    title: "AgentCost Documentation",
    description:
      "Index of every AgentCost developer resource: SDK, REST API, CLI, model catalogue, OpenAPI spec and privacy architecture.",
    section: "Documentation",
    body: `## SDK and tooling

- [AgentCost Python SDK](${SITE_URL}/docs/sdk) — install, quick start, configuration, agent tagging, workflows, streaming, local mode.
- [AgentCost CLI reference](${SITE_URL}/docs/cli) — \`agentcost analyze\`, pre-deployment cost estimates, CI usage.
- [AgentCost REST API reference](${SITE_URL}/docs/api) — authentication, endpoints, error format.
- [AgentCost model catalogue](${SITE_URL}/docs/models) — every supported model with live per-token pricing.
- [AgentCost data and privacy architecture](${SITE_URL}/docs/privacy) — exactly what the SDK transmits and what it never collects.

## Machine-readable

- [AgentCost OpenAPI 3.1 specification](${SITE_URL}/openapi.json) — the full API surface. YAML at ${SITE_URL}/api/openapi.yaml.
- [llms.txt](${SITE_URL}/llms.txt) — this site, indexed for agents.
- [llms-full.txt](${SITE_URL}/llms-full.txt) — every public page as one markdown document.
- Public API: ${SITE_URL}/api/v1 (cached mirror) and ${API_URL} (origin).

## Packages

- PyPI: https://pypi.org/project/agentcost/
- GitHub: https://github.com/agentcost-ai`,
  },

  {
    route: "/docs/sdk",
    title: "AgentCost Python SDK",
    description:
      "Install the SDK, initialise it with two lines, and every OpenAI, Anthropic, Gemini and LangChain call is tracked without changing your code.",
    section: "Documentation",
    body: `## Install

\`\`\`bash
pip install agentcost
\`\`\`

## Initialise

\`\`\`python
import agentcost
agentcost.init(api_key="sk_your_project_key")
\`\`\`

That is the whole integration. The SDK monkey-patches the provider clients, so
existing OpenAI, Anthropic, Gemini and LangChain code is tracked unchanged.

## Attribute costs to an agent

\`\`\`python
with agentcost.track_costs.agent("research-agent"):
    result = llm.invoke(prompt)
\`\`\`

Every call inside the block is attributed to \`research-agent\`, and the dashboard
breaks spend down per agent.

## How it behaves

- **Non-blocking.** Events are batched and delivered asynchronously, so delivery never sits in the path of your LLM call.
- **Local token counting.** Token counts come from tiktoken and cost is a catalogue lookup — neither blocks your application.
- **Local mode.** The SDK can record to disk instead of sending anywhere, for evaluation or air-gapped environments.
- **Workflows and traces.** Multi-step agents can tag workflow and step names, so per-run cost, repeated work and step latency become reportable.

Full reference — configuration, streaming, external correlation, metadata,
event structure, shutdown, error handling and troubleshooting — is at
${SITE_URL}/docs/sdk.`,
  },

  {
    route: "/docs/api",
    title: "AgentCost REST API",
    description:
      "The AgentCost HTTP API: public model pricing with no credentials, plus authenticated ingestion and analytics. OpenAPI 3.1 spec published.",
    section: "API for agents",
    body: `Origin: ${API_URL}. A cached mirror of the public read endpoints is served from
${SITE_URL}/api/v1 — same paths, same payloads — and the mirror does not sleep,
so it is the better choice for an agent.

Machine-readable specification: ${SITE_URL}/openapi.json (YAML at
${SITE_URL}/api/openapi.yaml).

## Public — no credentials required

- \`GET /v1/health\` — service status and version.
- \`GET /v1/pricing\` — the whole catalogue keyed by model name, with per-1k input, output, cached-input and cache-write rates, provider, modality and any announced retirement date. Optional \`?provider=\` filter.
- \`GET /v1/pricing/{model_name}\` — rates for one model, resolved the same way ingestion resolves them (exact, then deterministic fuzzy). An unknown model returns zeros with \`source: "fallback"\` rather than a 404.
- \`GET /v1/pricing/deprecations\` — active models with an announced retirement date, soonest first.
- \`GET /v1/pricing/sync/status\` — catalogue size, freshness and per-provider counts.
- \`POST /api/v1/estimate\` — cost estimate for a model and a token count. Mirror only.

## Estimate a call before you make it

\`\`\`bash
curl -X POST ${SITE_URL}/api/v1/estimate -H "Content-Type: application/json" -d '{"model": "gpt-4o", "input_tokens": 12000, "output_tokens": 800}'
\`\`\`

Returns the input, output and total cost in USD, the rates used, and the
catalogue entry the model name resolved to.

## Authenticated

Ingestion (\`POST /v1/events/batch\`), analytics, projects, budgets and
optimizations need either a project API key (\`Authorization: Bearer sk_...\`) or
a session token plus a \`project_id\` query parameter.

## Errors

Every error returns JSON with a machine-readable envelope:

\`\`\`json
{
  "error": {
    "code": "not_found",
    "message": "human-readable statement of what went wrong",
    "hint": "what to do next",
    "status": 404,
    "docs": "${SITE_URL}/docs/api"
  },
  "detail": "same message, kept for existing clients"
}
\`\`\`

Full endpoint-by-endpoint reference: ${SITE_URL}/docs/api`,
  },

  {
    route: "/docs/cli",
    title: "AgentCost CLI",
    description:
      "Analyse a codebase for LLM cost risk before you deploy it, from the command line or in CI.",
    section: "Documentation",
    body: `The CLI ships with the SDK.

\`\`\`bash
pip install agentcost
agentcost analyze
\`\`\`

\`agentcost analyze\` reads your source, finds the LLM call sites, estimates the
token load per run and reports findings — oversized prompts, repeated work
inside a single run, unbounded loops and failure-prone steps — before any of it
costs money in production.

Full flag reference, output formats, CI usage and the privacy note (analysis is
local; source is not uploaded) are at ${SITE_URL}/docs/cli.

Run \`agentcost\` with no arguments for every command. The others track coding
agents and do send usage:

| Command | Purpose |
|---|---|
| \`agentcost sync --dry-run\` | Show what coding-agent usage would be sent. No key, nothing sent. |
| \`agentcost connect <agent>\` | Track \`claude-code\`, \`codex\` or \`antigravity\` on this machine. \`--enforce\` also blocks calls that break the project's guardrails or budget. |
| \`agentcost status\` | What is connected, whether hooks are in place, what is waiting. |
| \`agentcost sync\` | Send what is new now. The hook does this after every turn. |
| \`agentcost disconnect <agent>\` | Remove the hook. Data already sent stays. |`,
  },

  {
    route: "/docs/coding-agents",
    title: "Track and Govern Claude Code, Codex and Antigravity with AgentCost",
    description:
      "Cost per session, model, tool and developer for coding agents, with guardrails that block a call before it runs. One command per machine, or OpenTelemetry for an organisation.",
    section: "Documentation",
    body: `Coding agents already record every model call they make. AgentCost reads that
record, so their sessions appear next to the rest of your LLM spend with no
instrumentation.

## Connect a machine

\`\`\`bash
pip install agentcost
agentcost sync --dry-run                      # look first: no key, nothing sent
agentcost connect claude-code --api-key sk_your_project_api_key
agentcost connect codex
agentcost connect antigravity
\`\`\`

\`connect\` imports the last 30 days and installs a hook in the tool's own
settings, so each finished turn is sent as it happens, from any folder. It is
per machine. Codex asks you to trust the hook: run \`/hooks\` in Codex once.
Antigravity has no hooks; it is synced whenever another connected agent syncs,
or when \`agentcost sync\` runs on a schedule.

A session is a run (\`trace_id\`). The workflow is \`claude-code\`, \`codex\` or
\`antigravity\`. A subagent is its own agent, \`claude-code/<type>\`. \`tool_name\`
is the tool the call invoked.

| | Claude Code | Codex | Antigravity |
|---|---|---|---|
| Cost per session, model, developer | Yes | Yes | Estimated |
| Cost per tool | Yes | Yes | No |
| Syncs after every turn | Yes | Yes, once the hook is trusted | With another agent, or scheduled |
| OpenTelemetry, nothing installed | Yes | Yes | No |
| Tool and model boundaries enforced | Yes | Yes | No |
| Per-run limits and budget enforced | Yes | Yes | No |

Antigravity publishes no usage export. Its figures come from an undocumented
local format and are marked \`estimated\`.

## Subscriptions are not spend

On a Claude or ChatGPT plan, or in Antigravity, nothing is billed per token.
Those calls are priced at API rates and marked \`billing: subscription\`. They
are shown, and reported separately as \`subscription_cost\`, but never count
against the budget, its alerts or its hard cap. Usage on an API key is metered
and does count. A provider API key is not needed to track a subscription.

## Enforce guardrails

\`\`\`bash
agentcost connect claude-code --enforce
\`\`\`

Adds a gate that runs before every tool call and prompt and refuses what the
project's guardrail for the agent \`claude-code\` or \`codex\` does not allow:

- allowed tools, read-only and allowed models
- max tool calls per run, max cost per run
- a spent monthly budget in hard-cap mode, for metered usage only

Codex tools are named as its hooks name them: the shell is \`Bash\`, file edits
are \`apply_patch\`.

The gate makes no network call. It decides from a policy the sync keeps current
(\`GET /v1/guardrails/policy\`) and from the session's own log, adds about 0.2s
to a tool call, and allows the call whenever it cannot decide. Without
\`--enforce\`, breaches are alerted, not blocked.

## A whole organisation: OpenTelemetry

Claude Code and Codex can export telemetry straight to AgentCost, with nothing
installed, including sessions that run in the cloud:

\`\`\`bash
CLAUDE_CODE_ENABLE_TELEMETRY=1
OTEL_LOGS_EXPORTER=otlp
OTEL_METRICS_EXPORTER=none
OTEL_EXPORTER_OTLP_PROTOCOL=http/json
OTEL_EXPORTER_OTLP_ENDPOINT=${API_URL}/v1/otlp
OTEL_EXPORTER_OTLP_HEADERS="Authorization=Bearer sk_your_project_api_key"
OTEL_RESOURCE_ATTRIBUTES="agentcost.billing=subscription"
\`\`\`

Only the per-call usage records are read; the rest of the export is discarded
unread. A machine that reports both ways is counted once. This path tracks
only; enforcement needs the hook.

## What leaves the machine

Token counts, model, tool names, session id and timestamps. Prompts, replies,
tool arguments and tool output are never sent or kept. The working folder's name and git
branch only with \`--include-repo\`; never the path or remote URL. Chat titles
(session names) only with \`--session-names\`, since a title summarises what
was asked.

Full page: ${SITE_URL}/docs/coding-agents`,
  },

  {
    route: "/docs/models",
    title: "AgentCost Model Catalogue",
    description:
      "Every model AgentCost can bill, with live per-token pricing across OpenAI, Anthropic, Google, AWS, Azure and 50+ other providers.",
    section: "Documentation",
    body: `The catalogue covers 3,500+ models across 50+ providers and is synced from
LiteLLM's continuously updated pricing database. Each entry carries the per-1,000
token input and output rate, the cached-input and cache-write rates where the
provider publishes them, the modality (chat, embedding, image generation, and so
on) and any upstream-announced retirement date.

The browsable table is at ${SITE_URL}/docs/models.

To read it programmatically — which is what you want if you are an agent:

\`\`\`bash
curl ${SITE_URL}/api/v1/pricing
curl ${SITE_URL}/api/v1/pricing/gpt-4o
curl ${SITE_URL}/api/v1/pricing/deprecations
\`\`\`

No credentials required. Schema: ${SITE_URL}/openapi.json`,
  },

  {
    route: "/docs/mcp",
    title: "AgentCost MCP Server",
    description:
      "A remote MCP server giving any agent live LLM model pricing, cost estimation and retirement lookups as callable tools, plus your own project's spend when you supply its API key. No install.",
    section: "API for agents",
    body: `Endpoint: ${SITE_URL}/api/mcp (Streamable HTTP)

The pricing tools are public: no credentials, no sign-up, no OAuth. The account
tools need your project API key. Serves both the current stateless MCP revision
(2026-07-28) and the older handshake era, so any client works.

## Connect

Claude Code:

\`\`\`bash
claude mcp add --transport http agentcost ${SITE_URL}/api/mcp
\`\`\`

Config-file clients (Claude Desktop and similar):

\`\`\`json
{ "mcpServers": { "agentcost": { "type": "http", "url": "${SITE_URL}/api/mcp" } } }
\`\`\`

To read your own spend, send the project API key as a bearer token:

\`\`\`bash
claude mcp add --transport http agentcost ${SITE_URL}/api/mcp --header "Authorization: Bearer sk_your_project_api_key"
\`\`\`

## Tools

- **list_models** — search the catalogue by provider and/or name substring, sorted cheapest-input-first. Use it to compare model costs or find a cheaper alternative.
- **get_model_pricing** — per-1,000-token input, output, cached-input and cache-write rates for one named model. Resolves exact, then case-insensitive, then provider-prefixed suffix.
- **estimate_cost** — dollars for a model and a token count, before you spend them. Multiply a single call out to a whole job with \`calls\`.
- **list_model_deprecations** — models with an upstream-announced retirement date, soonest first.

With a project API key:

- **get_spend_overview** — total spend, calls, tokens and success rate for your project over a window.
- **get_spend_breakdown** — spend grouped by agent, model, workflow, tool, user or session, most expensive first.
- **get_budget_state** — month-to-date spend against the budget, what is left and when the period ends.
- **get_run_cost** — every call in one run, by trace id, with the cost of each and how the run ended.

Every tool is read-only, so they are safe to call speculatively. The account
tools are scoped to the key's project and return an error saying how to supply
a key when none is sent. Changing budgets, projects or members needs the REST API.

Full reference: ${SITE_URL}/docs/mcp`,
  },

  {
    route: "/docs/api-versioning",
    title: "AgentCost API Versioning & Deprecation Policy",
    description:
      "How the AgentCost API is versioned, how retirements are signalled with Deprecation and Sunset headers, and the minimum notice before an endpoint stops working.",
    section: "API for agents",
    body: `The API is versioned in the URL path — every endpoint lives under \`/v1/\`,
on both \`${API_URL}/v1/…\` and the cached mirror at \`${SITE_URL}/api/v1/…\`.

Within a version, changes are additive only: new endpoints, new optional request
fields, new response fields. Existing field names keep their meaning and type.
Anything that would break a working client means a new version path. Ignore
response fields you do not recognise.

## How a retirement is announced

Every API response carries a link to the policy:

\`\`\`
Link: <${SITE_URL}/docs/api-versioning>; rel="deprecation"; type="text/html"
\`\`\`

That link alone does NOT mean anything is deprecated. When an endpoint is
actually retiring, its responses additionally carry:

- \`Deprecation\` — a Structured Fields Date (\`@\` plus whole seconds since the epoch) marking when it was announced. The endpoint still works.
- \`Sunset\` — an HTTP-date (RFC 8594) marking when it stops working. Never earlier than the deprecation instant.
- A \`rel="successor-version"\` link to the replacement, where there is one.

Minimum 180 days between the two dates on any public endpoint. The headers are
the notice — no subscription needed.

**Currently deprecated: nothing.** No \`/v1/\` endpoint is deprecated or
scheduled for retirement, so no response carries those headers today.

Provider *model* retirements are a separate feed:
\`GET ${SITE_URL}/api/v1/pricing/deprecations\`.

Full policy: ${SITE_URL}/docs/api-versioning`,
  },

  {
    route: "/docs/privacy",
    title: "AgentCost Data and Privacy Architecture",
    description:
      "Exactly which fields the SDK transmits, which it never collects, and how to verify that yourself.",
    section: "Documentation",
    body: `A field-by-field account of what the SDK sends and what it does not, covering:
what is transmitted with each event, what is never collected, the hashing applied
to fields used for de-duplication, the custom fields you control, hosted versus
local mode, credential handling, retention, how to verify the above yourself, and
how to get in touch about data handling.

The full document is at ${SITE_URL}/docs/privacy. The legal privacy policy is a
separate document at ${SITE_URL}/privacy.`,
  },

  {
    route: "/about",
    title: "About AgentCost",
    description:
      "AgentCost is an open-source LLM cost observability platform, free hosted or self-hosted, built by Kushagra Agrawal.",
    section: "Company",
    body: `AgentCost is an LLM cost observability platform. It records every model call an
application makes and attributes the cost to the agent, workflow and project
responsible — so a team running multi-agent systems can see which part of the
system is expensive, not just what the monthly provider invoice totals.

## What we build

- A Python SDK, published on PyPI as \`agentcost\`, that tracks OpenAI, Anthropic, Gemini and LangChain calls after a two-line integration.
- A FastAPI backend that ingests those events, prices them against a catalogue of 3,500+ models synced from LiteLLM, and exposes analytics over HTTP.
- A Next.js dashboard for spend breakdowns, budget guardrails, optimization recommendations and executive reporting.
- A command-line analyser, \`agentcost analyze\`, that estimates cost risk in a codebase before it ships.

## How it is licensed

The stack is MIT-licensed and the hosted cloud is free — no tiers, no seat
limits, no usage caps, and no feature held back for a paid plan. You can run the
same code on your own infrastructure with Docker instead; in that mode nothing
leaves your environment and the software does not phone home.

## Who builds it

AgentCost was founded and is maintained by Kushagra Agrawal. Development happens
in the open at https://github.com/agentcost-ai, and the SDK is released to PyPI
at https://pypi.org/project/agentcost/.

## Contact

${CONTACT_EMAIL} — see ${SITE_URL}/contact.`,
  },

  {
    route: "/contact",
    title: "Contact AgentCost",
    description:
      "How to reach AgentCost about support, security, data handling, partnerships and press.",
    section: "Company",
    body: `**Email:** ${CONTACT_EMAIL} — the fastest route for anything.

## What to send where

- **Support and setup questions** — ${CONTACT_EMAIL}, or open an issue at https://github.com/agentcost-ai.
- **Bug reports and feature requests** — GitHub issues are best. There is also a public feedback board inside the dashboard.
- **Security reports** — ${CONTACT_EMAIL}. Please include reproduction steps, and do not open a public issue first.
- **Data handling, deletion and privacy** — ${CONTACT_EMAIL}. What the SDK collects is documented at ${SITE_URL}/docs/privacy, and the policy is at ${SITE_URL}/privacy.
- **Press and partnerships** — ${CONTACT_EMAIL}.

## For agents

If you are an agent acting on someone's behalf, you do not need to contact
anyone to use the public API. The model catalogue and the cost estimator are
open at ${SITE_URL}/api/v1, and the specification is at ${SITE_URL}/openapi.json.

## Company

AgentCost, founded by Kushagra Agrawal.
Source: https://github.com/agentcost-ai
Package: https://pypi.org/project/agentcost/`,
  },

  {
    route: "/terms",
    title: "AgentCost Terms of Service",
    description:
      "The terms governing use of the AgentCost hosted service and website.",
    section: "Legal",
    body: `The operative document is the HTML page at ${SITE_URL}/terms. It covers
acceptance of terms, description of the service, account registration and
security, acceptable use, the MIT licence position on the open-source code,
intellectual property, disclaimers and limitation of liability, termination,
changes to the terms, and how to contact us (${CONTACT_EMAIL}).

This markdown entry is a pointer, not a substitute.`,
  },

  {
    route: "/privacy",
    title: "AgentCost Privacy Policy",
    description:
      "What personal data the AgentCost hosted service collects, why, and how to have it deleted.",
    section: "Legal",
    body: `The operative document is the HTML page at ${SITE_URL}/privacy. It covers the
information collected, how it is used, storage and security, sharing and
disclosure, data retention, your rights including deletion, cookies and
analytics, children's privacy, international transfers, changes to the policy,
and how to contact us (${CONTACT_EMAIL}).

The technical companion — the exact fields the SDK transmits and the fields it
never collects — is at ${SITE_URL}/docs/privacy.

This markdown entry is a pointer, not a substitute.`,
  },
];
