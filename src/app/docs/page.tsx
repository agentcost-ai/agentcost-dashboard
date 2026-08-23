import type { Metadata } from "next";
import Link from "next/link";

import { API_URL, SITE_URL } from "@/lib/site";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AgentCost Documentation — SDK, REST API, CLI & Model Catalog",
  description:
    "Every AgentCost developer resource in one index: the Python SDK, the REST API reference, the CLI, the model catalog with live pricing, the OpenAPI specification and the data privacy architecture.",
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
    href: "/api/v1",
    title: "Public API",
    body: "Model pricing and cost estimation, cached and always awake. No credentials, no sign-up, no rate-limit negotiation.",
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
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbList([
            { name: "AgentCost", path: "/" },
            { name: "Documentation", path: "/docs" },
          ]),
        )}
      />

      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
        Documentation
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        AgentCost documentation
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-400">
        AgentCost tracks what your LLM calls cost and attributes each one to the
        agent, workflow and project that made it. Start with the SDK if you are
        instrumenting an application, the REST API if you are integrating
        directly, or the OpenAPI specification if you are an agent.
      </p>

      <div className="mt-10 rounded-xl border border-neutral-800 bg-neutral-950/60 p-5">
        <p className="font-mono text-[12.5px] text-neutral-500">Quick start</p>
        <pre className="mt-3 overflow-x-auto font-mono text-[13px] leading-relaxed text-neutral-200">
{`pip install agentcost

import agentcost
agentcost.init(api_key="sk_your_project_key")`}
        </pre>
      </div>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-white">Guides</h2>
      <div className="space-y-3">
        {GUIDES.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="block rounded-xl border border-neutral-800 bg-neutral-950/40 p-5 transition-colors hover:border-neutral-700 hover:bg-neutral-950/70"
          >
            <h3 className="text-[15px] font-semibold text-white">{guide.title}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-400">
              {guide.body}
            </p>
          </Link>
        ))}
      </div>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-white">
        Machine-readable resources
      </h2>
      <div className="space-y-3">
        {MACHINE_READABLE.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="block rounded-xl border border-neutral-800 bg-neutral-950/40 p-5 transition-colors hover:border-neutral-700 hover:bg-neutral-950/70"
          >
            <h3 className="text-[15px] font-semibold text-white">
              {item.title}{" "}
              <span className="font-mono text-[12.5px] font-normal text-neutral-500">
                {item.href}
              </span>
            </h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-400">
              {item.body}
            </p>
          </a>
        ))}
      </div>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-white">
        Packages and source
      </h2>
      <ul className="space-y-2 text-[14px] text-neutral-400">
        <li>
          Python package:{" "}
          <a
            href="https://pypi.org/project/agentcost/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-200 underline underline-offset-4 hover:text-white"
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
            className="text-neutral-200 underline underline-offset-4 hover:text-white"
          >
            github.com/agentcost-ai
          </a>
        </li>
        <li>
          API origin:{" "}
          <span className="font-mono text-[13px] text-neutral-500">{API_URL}</span>{" "}
          — sleeps when idle, so prefer{" "}
          <span className="font-mono text-[13px] text-neutral-500">
            {SITE_URL}/api/v1
          </span>
        </li>
      </ul>
    </div>
  );
}
