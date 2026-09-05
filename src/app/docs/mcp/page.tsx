import type { Metadata } from "next";
import Link from "next/link";

import { SITE_URL } from "@/lib/site";
import { TOOLS } from "@/lib/mcp/tools";
import { SUPPORTED_VERSIONS } from "@/lib/mcp/protocol";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";
import { PageHeader, Section } from "@/components/docs/primitives";

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
    <>
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

        <PageHeader eyebrow="MCP server" title={<>MCP Server</>}>
        <p>Give your agent live LLM pricing as callable tools — look up what a
            model costs, compare models to find a cheaper one, estimate a job
            before running it, and check what is being retired.</p>
      </PageHeader>

        <div className="docs-panel mb-12">
          <h3>
            Endpoint
          </h3>
          <p className="font-mono">{ENDPOINT}</p>
          <p>
            Streamable HTTP. Public — no credentials, no sign-up. Protocol
            revisions {SUPPORTED_VERSIONS.join(", ")}, so both the current
            stateless revision and the older handshake era work.
          </p>
        </div>

        <Section id="connect" title="Connect">
          <div className="space-y-4">
            {CLIENTS.map((client) => (
              <div
                key={client.name}
                className="border-t border-white/8 pt-5"
              >
                <h3 className="text-white">{client.name}</h3>
                <p>
                  {client.body}
                </p>
                <pre className="mt-4 overflow-x-auto rounded-lg border border-white/8 bg-[#0c0c0e] p-4 font-mono text-[13px] leading-6 text-neutral-200">
{client.code}
                </pre>
              </div>
            ))}
          </div>
        </Section>

        <Section id="tools" title="Tools">
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
                  className="border-t border-white/8 pt-5"
                >
                  <h3 className="font-mono">
                    {tool.name}
                  </h3>
                  <p>
                    {tool.description}
                  </p>
                  <dl className="space-y-2 pt-4">
                    {Object.entries(schema.properties ?? {}).map(([key, value]) => (
                      <div key={key} className="flex flex-wrap gap-x-3 text-[13px]">
                        <dt className="font-mono">
                          {key}
                          {required.has(key) ? (
                            <span className="text-sky-400/70">*</span>
                          ) : null}
                        </dt>
                        <dd className="flex-1">{value.description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
          <p>
            <span className="text-sky-400/70">*</span> required
          </p>
        </Section>

        <Section id="what-it-does-not-do" title="What it does not do">
          <p>
            These tools read the public pricing catalogue only. They cannot see
            your own spend, projects or budgets — that needs an authenticated
            account and the{" "}
            <Link
              href="/docs/api"
             
            >
              REST API
            </Link>
            . Nothing here writes anything, so every tool is safe to call
            speculatively.
          </p>
        </Section>

        <Section id="verify-it" title="Verify it">
          <pre className="overflow-x-auto rounded-lg border border-white/8 bg-[#0c0c0e] p-4 font-mono text-[13px] leading-6 text-neutral-200">
{`curl -sX POST ${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "MCP-Protocol-Version: 2026-07-28" \\
  -H "Mcp-Method: tools/list" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'`}
          </pre>
        </Section>

        <p>
          Related:{" "}
          <Link
            href="/docs/api"
           
          >
            REST API reference
          </Link>{" "}
          ·{" "}
          <Link
            href="/docs/api-versioning"
           
          >
            Versioning &amp; deprecation policy
          </Link>{" "}
          ·{" "}
          <a
            href="/openapi.json"
           
          >
            OpenAPI spec
          </a>
        </p>
    </>
  );
}
