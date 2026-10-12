import type { Metadata } from "next";
import Link from "next/link";

import { SITE_URL } from "@/lib/site";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";
import { Callout, CodeBlock, PageHeader, Section } from "@/components/docs/primitives";

export const metadata: Metadata = {
  title: "Track Claude Code, Codex and Antigravity Costs with AgentCost",
  description:
    "See what Claude Code, Codex and Antigravity sessions cost per session, model, tool and developer, and enforce tool, per-run and budget guardrails before a call runs. One command per machine, or OpenTelemetry for a whole organisation.",
  alternates: { canonical: `${SITE_URL}/docs/coding-agents` },
};

const API = "https://api.agentcost.tech";

const CONNECT = `pip install agentcost

agentcost sync --dry-run                       # look first: no key, nothing sent
agentcost connect claude-code --api-key sk_your_project_api_key
agentcost connect codex
agentcost connect antigravity`;

const ENFORCE = `agentcost connect claude-code --enforce`;

const CLAUDE_OTEL = `{
  "env": {
    "CLAUDE_CODE_ENABLE_TELEMETRY": "1",
    "OTEL_LOGS_EXPORTER": "otlp",
    "OTEL_METRICS_EXPORTER": "none",
    "OTEL_EXPORTER_OTLP_PROTOCOL": "http/json",
    "OTEL_EXPORTER_OTLP_ENDPOINT": "${API}/v1/otlp",
    "OTEL_EXPORTER_OTLP_HEADERS": "Authorization=Bearer sk_your_project_api_key",
    "OTEL_RESOURCE_ATTRIBUTES": "agentcost.billing=subscription"
  }
}`;

const CODEX_OTEL = `[otel]
exporter = { otlp-http = {
  endpoint = "${API}/v1/otlp/v1/logs",
  protocol = "json",
  headers = { "Authorization" = "Bearer sk_your_project_api_key" }
}}`;

const MCP = `claude mcp add --transport http agentcost ${SITE_URL}/api/mcp \\
  --header "Authorization: Bearer sk_your_project_api_key"`;

const SUPPORT: [string, string, string, string][] = [
  ["Cost per session, model and developer", "Yes", "Yes", "Estimated"],
  ["Cost per tool", "Yes", "Yes", "No"],
  ["Subagents as their own agents", "Yes", "When the log names them", "No"],
  ["Syncs by itself after every turn", "Yes", "Yes, once the hook is trusted", "With another agent, or on a schedule"],
  ["OpenTelemetry, nothing installed", "Yes", "Yes", "No"],
  ["Tool and model boundaries enforced", "Yes", "Yes", "No"],
  ["Per-run limits and budget enforced", "Yes", "Yes", "No"],
];

const ENFORCED: [string, string][] = [
  ["Allowed tools", "A tool that is not on the list is refused."],
  ["Read-only", "A tool tagged as writing is refused."],
  ["Allowed models", "Tool calls and prompts are refused while the session is on a model that is not on the list."],
  ["Max tool calls per run", "Further tool calls in that session are refused."],
  ["Max cost per run", "Further tool calls and prompts in that session are refused."],
  ["Monthly budget, hard cap", "New prompts are refused once it is spent. Metered usage only, never a subscription."],
];

export default function CodingAgentsDocsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbList([
            { name: "AgentCost", path: "/" },
            { name: "Documentation", path: "/docs" },
            { name: "Coding agents", path: "/docs/coding-agents" },
          ]),
        )}
      />

      <PageHeader eyebrow="Coding agents" title={<>Claude Code, Codex and Antigravity</>}>
        <p>
          Coding agents already record every model call they make. AgentCost reads
          that record, so their sessions show up next to the rest of your LLM spend
          with no instrumentation, and your guardrails can stop a call before it
          runs instead of reporting it afterwards.
        </p>
      </PageHeader>

      <Section id="connect" title="Connect a machine">
        <p>
          One command per agent, once per machine. It imports the last 30 days and
          installs a hook, so each finished turn is sent as it happens, from any
          folder, in the terminal, the IDE extension or the desktop app.
        </p>
        <CodeBlock code={CONNECT} />
        <p>
          Codex asks you to trust a new hook: open Codex and run <code>/hooks</code>{" "}
          once. Antigravity has no hooks, so its usage is sent whenever another
          connected agent syncs, or when you run <code>agentcost sync</code> on a
          schedule.
        </p>
      </Section>

      <Section id="what-you-get" title="What you get">
        <p>
          A session is a run. Open one to see every call in it, or group spend by
          model, tool, subagent, session or developer.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-white/10 text-neutral-400">
                <th className="py-2 pr-4 font-normal"> </th>
                <th className="py-2 pr-4 font-normal">Claude Code</th>
                <th className="py-2 pr-4 font-normal">Codex</th>
                <th className="py-2 font-normal">Antigravity</th>
              </tr>
            </thead>
            <tbody>
              {SUPPORT.map(([what, claude, codex, antigravity]) => (
                <tr key={what} className="border-b border-white/6">
                  <td className="py-2 pr-4 text-neutral-200">{what}</td>
                  <td className="py-2 pr-4">{claude}</td>
                  <td className="py-2 pr-4">{codex}</td>
                  <td className="py-2">{antigravity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Callout tone="note">
          Antigravity publishes no usage export. Its figures are read from an
          undocumented local format and priced from the model name it records, so
          treat them as estimates. Conversations from before June 2026 are
          encrypted and cannot be read.
        </Callout>
      </Section>

      <Section id="subscriptions" title="Subscriptions are not spend">
        <p>
          On a Claude or ChatGPT plan, or in Antigravity, nothing is billed per
          token. Those calls are still priced, so you can see what the usage is
          worth at API rates, but each one is marked{" "}
          <code>billing: subscription</code> and is left out of your budget, its
          alerts and its hard cap. The overview shows the two apart. Usage on an API
          key is metered and counts as spend.
        </p>
      </Section>

      <Section id="enforce" title="Enforce guardrails">
        <p>
          Add <code>--enforce</code> and a second hook, the gate, runs before every
          tool call and every prompt. It refuses what the project does not allow
          and tells the agent why.
        </p>
        <CodeBlock code={ENFORCE} />
        <p>
          It enforces the guardrail you declare for the agent named{" "}
          <code>claude-code</code> or <code>codex</code> on the{" "}
          <Link href="/guardrails">Guardrails</Link> page. A subagent answers to{" "}
          <code>claude-code/&lt;type&gt;</code> if you declare one, and to the main
          agent otherwise.
        </p>
        <dl className="space-y-2 pt-2">
          {ENFORCED.map(([boundary, effect]) => (
            <div key={boundary} className="flex flex-wrap gap-x-3 text-[13.5px]">
              <dt className="w-52 text-neutral-200">{boundary}</dt>
              <dd className="flex-1">{effect}</dd>
            </div>
          ))}
        </dl>
        <p>
          The gate never calls the network. It decides from a policy the sync keeps
          current and from the session&apos;s own log, adds about a fifth of a second
          to a tool call, and applies a changed guardrail from the next turn. When
          it cannot decide, it allows the call.
        </p>
      </Section>

      <Section id="opentelemetry" title="A whole organisation, with nothing installed">
        <p>
          Claude Code and Codex can export their own telemetry. Point it at
          AgentCost from managed settings and every session reports in, including
          ones that run in the cloud and leave no local log. Only the per-call usage
          records are read; prompts, tool results and everything else in the export
          are discarded unread.
        </p>
        <CodeBlock code={CLAUDE_OTEL} language="json" title="Claude Code: settings.json" />
        <CodeBlock code={CODEX_OTEL} language="toml" title="Codex: config.toml" />
        <p>
          State how the usage is paid for with{" "}
          <code>agentcost.billing=subscription</code> or <code>api</code>; Claude
          Code does not say, and unstated usage counts as metered. A machine that
          reports both ways is counted once. This path tracks only: enforcement needs
          the hook.
        </p>
      </Section>

      <Section id="ask-the-agent" title="Let the agent read its own spend">
        <p>
          Add the <Link href="/docs/mcp">MCP server</Link> with your project key and
          the agent can check the budget, or what a run cost, before it starts
          something expensive.
        </p>
        <CodeBlock code={MCP} />
      </Section>

      <Section id="what-leaves-the-machine" title="What leaves the machine">
        <p>
          Token counts, model, tool names, session id and timestamps. Prompts,
          replies, tool arguments and tool output are never sent or kept. The working
          folder&apos;s name and git branch are sent only if you pass{" "}
          <code>--include-repo</code>, and never the path or the remote URL.
        </p>
      </Section>

      <p>
        Related: <Link href="/docs/cli">CLI reference</Link> ·{" "}
        <Link href="/docs/mcp">MCP server</Link> ·{" "}
        <Link href="/docs/privacy">Data &amp; privacy</Link>
      </p>
    </>
  );
}
