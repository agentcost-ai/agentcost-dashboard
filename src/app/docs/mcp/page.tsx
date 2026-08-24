import type { Metadata } from "next";
import Link from "next/link";

import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/mcp/tools";
import { SUPPORTED_VERSIONS } from "@/lib/mcp/protocol";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AgentCost MCP Server — Model Pricing Tools for AI Agents",
  description:
    "Connect any MCP client to the AgentCost MCP server and give your agent live LLM model pricing, cost estimation and deprecation lookups. Remote, no install, no credentials.",
  alternates: { canonical: `${SITE_URL}/docs/mcp` },
};

const ENDPOINT = `${SITE_URL}/api/mcp`;

const CLIENTS = [
  {
    name: "Claude Code",
    body: "Add the remote server from the terminal.",
    code: `claude mcp add --transport http agentcost ${ENDPOINT}`,
  },
  {
    name: "Claude Desktop and other config-file clients",
    body: "Add an entry under mcpServers in the client's config file.",
    code: `{
  "mcpServers": {
    "agentcost": {
      "type": "http",
      "url": "${ENDPOINT}"
    }
  }
}`,
  },
  {
    name: "Anything else",
    body: "Point any MCP client at the endpoint over Streamable HTTP. There is no install step, no API key and no OAuth flow.",
    code: ENDPOINT,
  },
];

export default function McpDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbList([
            { name: "AgentCost", path: "/" },
            { name: "Documentation", path: "/docs" },
            { name: "MCP Server", path: "/docs/mcp" },
          ]),
        )}
      />

      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
        MCP Server
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        AgentCost MCP server
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-400">
        Give your agent live LLM pricing as callable tools. It can look up what a
        model costs, compare models to find a cheaper one, estimate what a job
        will cost before running it, and check whether a model is being retired —
        without you writing an API client.
      </p>

      <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950/60 p-5">
        <p className="font-mono text-[12.5px] text-neutral-500">Endpoint</p>
        <p className="mt-2 font-mono text-[15px] text-sky-400">{ENDPOINT}</p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-neutral-400">
          Streamable HTTP. Public — no credentials, no sign-up. Protocol
          revisions {SUPPORTED_VERSIONS.join(", ")}, so both the current
          stateless revision and the older handshake era work.
        </p>
      </div>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-white">Connect</h2>
      <div className="space-y-4">
        {CLIENTS.map((client) => (
          <div
            key={client.name}
            className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-5"
          >
            <h3 className="text-[15px] font-semibold text-white">{client.name}</h3>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-400">
              {client.body}
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg border border-neutral-800 bg-black/40 p-4 font-mono text-[12.5px] leading-relaxed text-neutral-200">
{client.code}
            </pre>
          </div>
        ))}
      </div>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-white">Tools</h2>
      <div className="space-y-3">
        {TOOLS.map((tool) => {
          const schema = tool.inputSchema as {
            properties?: Record<string, { description?: string }>;
            required?: string[];
          };
          const required = new Set(schema.required ?? []);
          return (
            <div
              key={tool.name}
              className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-5"
            >
              <h3 className="font-mono text-[14px] font-semibold text-sky-400">
                {tool.name}
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-neutral-400">
                {tool.description}
              </p>
              <dl className="mt-3 space-y-1.5">
                {Object.entries(schema.properties ?? {}).map(([key, value]) => (
                  <div key={key} className="flex gap-2 text-[12.5px]">
                    <dt className="font-mono text-neutral-300">
                      {key}
                      {required.has(key) ? (
                        <span className="text-sky-400/70">*</span>
                      ) : null}
                    </dt>
                    <dd className="text-neutral-500">{value.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[12.5px] text-neutral-600">
        <span className="text-sky-400/70">*</span> required
      </p>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-white">
        What it does not do
      </h2>
      <p className="text-[14px] leading-relaxed text-neutral-400">
        These tools read the public pricing catalogue only. They cannot see your
        own spend, your projects or your budgets — that data needs an
        authenticated account and is reached through the{" "}
        <Link
          href="/docs/api"
          className="text-neutral-200 underline underline-offset-4 hover:text-white"
        >
          REST API
        </Link>
        . Nothing here writes anything, so every tool is safe to call
        speculatively.
      </p>

      <h2 className="mt-14 mb-4 text-xl font-semibold text-white">Verify it</h2>
      <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-black/40 p-4 font-mono text-[12.5px] leading-relaxed text-neutral-200">
{`curl -sX POST ${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "MCP-Protocol-Version: 2026-07-28" \\
  -H "Mcp-Method: tools/list" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`}
      </pre>

      <p className="mt-8 text-[14px] text-neutral-400">
        Related:{" "}
        <Link
          href="/docs/api"
          className="text-neutral-200 underline underline-offset-4 hover:text-white"
        >
          REST API reference
        </Link>{" "}
        ·{" "}
        <Link
          href="/docs/api-versioning"
          className="text-neutral-200 underline underline-offset-4 hover:text-white"
        >
          Versioning &amp; deprecation policy
        </Link>{" "}
        ·{" "}
        <a
          href="/openapi.json"
          className="text-neutral-200 underline underline-offset-4 hover:text-white"
        >
          OpenAPI spec
        </a>
      </p>
    </div>
  );
}
