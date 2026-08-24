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
    name: "Claude Desktop, Cursor, Windsurf and other config-file clients",
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
    name: "Anything else that speaks MCP",
    body: "Point any MCP client at the endpoint over Streamable HTTP. No install step, no API key, no OAuth flow.",
    code: ENDPOINT,
  },
];

export default function McpDocsPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="mx-auto max-w-4xl px-4 py-8 pt-4 sm:px-6 lg:px-8">
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">MCP Server</h1>
          <p className="mt-2 text-neutral-400">
            Give your agent live LLM pricing as callable tools — look up what a
            model costs, compare models to find a cheaper one, estimate a job
            before running it, and check what is being retired.
          </p>
        </div>

        <div className="mb-12 rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Endpoint
          </h3>
          <p className="font-mono text-[15px] text-sky-400">{ENDPOINT}</p>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Streamable HTTP. Public — no credentials, no sign-up. Protocol
            revisions {SUPPORTED_VERSIONS.join(", ")}, so both the current
            stateless revision and the older handshake era work.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">Connect</h2>
          <div className="space-y-4">
            {CLIENTS.map((client) => (
              <div
                key={client.name}
                className="rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-6"
              >
                <h3 className="font-semibold text-white">{client.name}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                  {client.body}
                </p>
                <pre className="mt-4 overflow-x-auto rounded-lg border border-neutral-700/50 bg-neutral-950 p-4 font-mono text-[13px] leading-relaxed text-neutral-200">
{client.code}
                </pre>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">Tools</h2>
          <div className="space-y-4">
            {TOOLS.map((tool) => {
              const schema = tool.inputSchema as {
                properties?: Record<string, { description?: string }>;
                required?: string[];
              };
              const required = new Set(schema.required ?? []);
              return (
                <div
                  key={tool.name}
                  className="rounded-lg border border-neutral-700/50 bg-neutral-800/30 p-6"
                >
                  <h3 className="font-mono text-[15px] font-semibold text-sky-400">
                    {tool.name}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
                    {tool.description}
                  </p>
                  <dl className="mt-4 space-y-2 border-t border-neutral-700/50 pt-4">
                    {Object.entries(schema.properties ?? {}).map(([key, value]) => (
                      <div key={key} className="flex flex-wrap gap-x-3 text-[13px]">
                        <dt className="font-mono text-neutral-300">
                          {key}
                          {required.has(key) ? (
                            <span className="text-sky-400/70">*</span>
                          ) : null}
                        </dt>
                        <dd className="flex-1 text-neutral-500">{value.description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[13px] text-neutral-500">
            <span className="text-sky-400/70">*</span> required
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">
            What it does not do
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            These tools read the public pricing catalogue only. They cannot see
            your own spend, projects or budgets — that needs an authenticated
            account and the{" "}
            <Link
              href="/docs/api"
              className="text-sky-400 transition-colors hover:text-sky-300"
            >
              REST API
            </Link>
            . Nothing here writes anything, so every tool is safe to call
            speculatively.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-xl font-semibold text-white">Verify it</h2>
          <pre className="overflow-x-auto rounded-lg border border-neutral-700/50 bg-neutral-950 p-4 font-mono text-[13px] leading-relaxed text-neutral-200">
{`curl -sX POST ${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "MCP-Protocol-Version: 2026-07-28" \\
  -H "Mcp-Method: tools/list" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`}
          </pre>
        </section>

        <p className="text-sm text-neutral-400">
          Related:{" "}
          <Link
            href="/docs/api"
            className="text-sky-400 transition-colors hover:text-sky-300"
          >
            REST API reference
          </Link>{" "}
          ·{" "}
          <Link
            href="/docs/api-versioning"
            className="text-sky-400 transition-colors hover:text-sky-300"
          >
            Versioning &amp; deprecation policy
          </Link>{" "}
          ·{" "}
          <a
            href="/openapi.json"
            className="text-sky-400 transition-colors hover:text-sky-300"
          >
            OpenAPI spec
          </a>
        </p>
      </div>
    </div>
  );
}
