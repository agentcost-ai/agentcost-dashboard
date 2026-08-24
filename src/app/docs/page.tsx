import type { Metadata } from "next";
import Link from "next/link";

import { API_URL, SITE_URL } from "@/lib/site";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AgentCost Documentation — SDK, REST API, CLI & Model Catalog",
  description:
    "Every AgentCost developer resource in one index: the Python SDK, the REST API reference, the CLI, the model catalog with live pricing, the MCP server, the OpenAPI specification and the data privacy architecture.",
  alternates: { canonical: `${SITE_URL}/docs` },
};

const GUIDES = [
  {
    href: "/docs/sdk",
    title: "AgentCost Python SDK",
    body: "Install, initialise with two lines, and track every OpenAI, Anthropic, Gemini and LangChain call without changing your code. Covers configuration, agent tagging, workflows, streaming, local mode, event structure and troubleshooting.",
  },
  {
    href: "/docs/api",
    title: "AgentCost REST API reference",
    body: "Authentication, ingestion, analytics, projects and budgets, endpoint by endpoint — plus the public pricing endpoints that need no credentials and the structured error envelope every failure returns.",
  },
  {
    href: "/docs/cli",
    title: "AgentCost CLI reference",
    body: "agentcost analyze estimates the cost risk in a codebase before it ships: oversized prompts, repeated work inside a run, unbounded loops. Flags, output formats and CI usage.",
  },
  {
    href: "/docs/models",
    title: "AgentCost model catalog",
    body: "Every model AgentCost can bill, with live per-1,000-token input, output and cached rates across OpenAI, Anthropic, Google, AWS, Azure and 50+ other providers, plus announced retirement dates.",
  },
  {
    href: "/docs/mcp",
    title: "AgentCost MCP server",
    body: "Connect any MCP client and give your agent live model pricing, cost estimation and retirement lookups as callable tools. Remote endpoint, no install, no credentials.",
  },
  {
    href: "/docs/api-versioning",
    title: "AgentCost API versioning & deprecation policy",
    body: "How the API is versioned, how retirements are signalled with Deprecation and Sunset headers, and the minimum notice before any endpoint stops working.",
  },
  {
    href: "/docs/privacy",
    title: "AgentCost data & privacy architecture",
    body: "Field by field: what the SDK transmits, what it never collects, what is hashed, how hosted and local mode differ, how long data is retained, and how to verify all of it yourself.",
  },
];

const MACHINE_READABLE = [
  {
    href: "/openapi.json",
    title: "OpenAPI 3.1 specification",
    body: "The complete AgentCost API surface: every operation typed, with a unique operationId and a description. YAML mirror at /api/openapi.yaml.",
  },
  {
    href: "/api/mcp",
    title: "MCP endpoint",
    body: "Streamable HTTP. The same pricing capabilities as typed MCP tools, for any client that speaks the protocol.",
  },
  {
    href: "/api/v1",
    title: "Public API",
    body: "Model pricing and cost estimation, cached and always awake. No credentials, no sign-up.",
  },
  {
    href: "/llms.txt",
    title: "llms.txt",
    body: "This site indexed for agents, in the llmstxt.org format, including when-to-use guidance. Every page also answers to Accept: text/markdown.",
  },
  {
    href: "/llms-full.txt",
    title: "llms-full.txt",
    body: "Every public page concatenated into a single markdown document.",
  },
];

export default function DocsIndexPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-8 pt-4 sm:px-6 lg:px-8">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(
            breadcrumbList([
              { name: "AgentCost", path: "/" },
              { name: "Documentation", path: "/docs" },
            ]),
          )}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Documentation</h1>
          <p className="mt-2 text-neutral-400">
            AgentCost tracks what your LLM calls cost and attributes each one to
            the agent, workflow and project that made it. Start with the SDK if
            you are instrumenting an application, the REST API if you are
            integrating directly, or the MCP server if you are an agent.
          </p>
        </div>

        <div className="mb-12 rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Quick start
          </h3>
          <pre className="overflow-x-auto font-mono text-[13px] leading-relaxed text-neutral-200">
{`pip install agentcost

import agentcost
agentcost.init(api_key="sk_your_project_key")`}
          </pre>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">Guides</h2>
          <div className="space-y-4">
            {GUIDES.map((guide) => (
              <Link
                key={guide.href}
                href={guide.href}
                className="block rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-6 transition-colors hover:border-neutral-600 hover:bg-neutral-800/60"
              >
                <h3 className="font-semibold text-white">{guide.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                  {guide.body}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">
            Machine-readable resources
          </h2>
          <div className="space-y-4">
            {MACHINE_READABLE.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-6 transition-colors hover:border-neutral-600 hover:bg-neutral-800/60"
              >
                <h3 className="font-semibold text-white">
                  {item.title}{" "}
                  <span className="font-mono text-[13px] font-normal text-sky-400">
                    {item.href}
                  </span>
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                  {item.body}
                </p>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-xl font-semibold text-white">
            Packages and source
          </h2>
          <ul className="space-y-2 text-sm text-neutral-400">
            <li>
              Python package:{" "}
              <a
                href="https://pypi.org/project/agentcost/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 transition-colors hover:text-sky-300"
              >
                pypi.org/project/agentcost
              </a>
            </li>
            <li>
              Source (MIT):{" "}
              <a
                href="https://github.com/agentcost-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 transition-colors hover:text-sky-300"
              >
                github.com/agentcost-ai
              </a>
            </li>
            <li>
              API origin:{" "}
              <span className="font-mono text-[13px] text-neutral-500">
                {API_URL}
              </span>{" "}
              — sleeps when idle, so prefer{" "}
              <span className="font-mono text-[13px] text-neutral-500">
                {SITE_URL}/api/v1
              </span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
