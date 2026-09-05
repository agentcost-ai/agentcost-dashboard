import type { Metadata } from "next";
import {
  Code2,
  Braces,
  TerminalSquare,
  Database,
  Plug,
  ShieldCheck,
  GitBranch,
  FileJson,
  Bot,
  Server,
  Github,
} from "lucide-react";

import { SITE_URL } from "@/lib/site";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";
import {
  PageHeader,
  Section,
  CodeBlock,
  Card,
  CardGrid,
} from "@/components/docs/primitives";

export const metadata: Metadata = {
  title: "AgentCost Documentation — SDK, REST API, CLI & Model Catalog",
  description:
    "Every AgentCost developer resource in one index: the Python SDK, the REST API reference, the CLI, the model catalog with live pricing, the MCP server, the OpenAPI specification and the data privacy architecture.",
  alternates: { canonical: `${SITE_URL}/docs` },
};

export default function DocsIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbList([
            { name: "AgentCost", path: "/" },
            { name: "Documentation", path: "/docs" },
          ]),
        )}
      />

      <PageHeader eyebrow="Get started" title="Introduction">
        <p>AgentCost is cost observability for LLM agents.</p>
      </PageHeader>

      <p>To get started with AgentCost, you&apos;ll need:</p>
      <ol>
        <li>
          A free account with a project — an API key is created for you at{" "}
          <a href="/auth/register">sign-up</a>
        </li>
        <li>
          The Python SDK, installed with <code>pip install agentcost</code>
        </li>
      </ol>
      <p>
        Then every OpenAI, Anthropic, Gemini and LangChain call is priced and
        attributed to the agent, workflow and step that made it — without
        changing your code:
      </p>
      <ul>
        <li>
          <strong>Track:</strong> cost per call, per agent and per run, with
          token counts and latency
        </li>
        <li>
          <strong>Guard:</strong> monthly budgets, anomaly detection and
          per-agent tool guardrails
        </li>
        <li>
          <strong>Predict:</strong> price a codebase before it ships with the
          CLI
        </li>
      </ul>

      <Section id="quick-start" title="Quick start">
        <p>Two lines. Your existing calls are tracked without changes.</p>
        <CodeBlock
          language="python"
          code={`pip install agentcost

from agentcost import track_costs
track_costs.init(api_key="sk_your_project_key", project_id="your-project-uuid")`}
        />
      </Section>

      <Section id="guides" title="Guides">
        <p>Learn how to get AgentCost set up in your project.</p>
        <CardGrid>
          <Card href="/docs/sdk" icon={<Code2 size={22} strokeWidth={1.75} />} title="Python SDK" />
          <Card href="/docs/api" icon={<Braces size={22} strokeWidth={1.75} />} title="REST API reference" />
          <Card href="/docs/cli" icon={<TerminalSquare size={22} strokeWidth={1.75} />} title="CLI reference" />
          <Card href="/docs/models" icon={<Database size={22} strokeWidth={1.75} />} title="Model catalog" />
          <Card href="/docs/mcp" icon={<Plug size={22} strokeWidth={1.75} />} title="MCP server" />
          <Card href="/docs/privacy" icon={<ShieldCheck size={22} strokeWidth={1.75} />} title="Data & privacy" />
          <Card href="/docs/api-versioning" icon={<GitBranch size={22} strokeWidth={1.75} />} title="API versioning" />
        </CardGrid>
      </Section>

      <Section id="machine-readable" title="Machine-readable resources">
        <p>The same surface for agents and tooling.</p>
        <CardGrid>
          <Card href="/openapi.json" icon={<FileJson size={22} strokeWidth={1.75} />} title="OpenAPI 3.1 spec" external>
            Every operation typed, with a unique operationId. YAML mirror at
            /api/openapi.yaml.
          </Card>
          <Card href="/api/mcp" icon={<Bot size={22} strokeWidth={1.75} />} title="MCP endpoint" external>
            Streamable HTTP. Pricing capabilities as typed MCP tools for any
            client that speaks the protocol.
          </Card>
          <Card href="/api/v1" icon={<Server size={22} strokeWidth={1.75} />} title="Public API" external>
            Model pricing and cost estimation, cached and always awake. No
            credentials.
          </Card>
          <Card href="/llms.txt" icon={<FileJson size={22} strokeWidth={1.75} />} title="llms.txt" external>
            This site indexed for agents. Every page also answers to Accept:
            text/markdown.
          </Card>
        </CardGrid>
      </Section>

      <Section id="source" title="Packages and source">
        <CardGrid cols={2}>
          <Card href="https://pypi.org/project/agentcost/" icon={<Code2 size={22} strokeWidth={1.75} />} title="pypi.org/project/agentcost" external>
            The Python SDK and CLI, MIT licensed.
          </Card>
          <Card href="https://github.com/agentcost-ai" icon={<Github size={22} strokeWidth={1.75} />} title="github.com/agentcost-ai" external>
            SDK, backend and dashboard source.
          </Card>
        </CardGrid>
      </Section>
    </>
  );
}
