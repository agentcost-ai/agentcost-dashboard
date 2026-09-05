"use client";

import Link from "next/link";
import { Trash2, TriangleAlert, Check, X } from "lucide-react";
import { PageHeader, Section, CodeBlock } from "@/components/docs/primitives";

const SDK_REPO =
  "https://github.com/agentcost-ai/agentcost-sdk/blob/main/agentcost";
const BACKEND_REPO =
  "https://github.com/agentcost-ai/agentcost-backend/blob/main/app";

/** Every field the SDK puts on the wire, straight from `_build_event`. */
const TRANSMITTED_FIELDS: Array<{
  field: string;
  type: string;
  note: string;
}> = [
  { field: "agent_name", type: "string", note: "The label you pass to track_costs.agent()" },
  { field: "model", type: "string", note: "Model identifier, e.g. claude-sonnet-4" },
  { field: "input_tokens", type: "int", note: "Reported by the provider, or counted with tiktoken" },
  { field: "output_tokens", type: "int", note: "Reported by the provider, or counted with tiktoken" },
  { field: "total_tokens", type: "int", note: "Sum of the two above" },
  { field: "cost", type: "float", note: "Computed locally from the pricing table" },
  { field: "latency_ms", type: "int", note: "Wall-clock duration of the call" },
  { field: "timestamp", type: "ISO 8601", note: "UTC time the call completed" },
  { field: "success", type: "bool", note: "Whether the call raised" },
  { field: "error", type: "string | null", note: "The provider exception message — see the caveat below" },
  { field: "input_hash", type: "SHA-256 hex", note: "One-way digest of the prompt, never the prompt" },
  { field: "streaming", type: "bool", note: "Present only on streamed calls" },
  { field: "metadata", type: "object", note: "Only what you explicitly attach — see below" },
];

/**
 * Added by workflow()/step()/tool(); tool() alone adds only tool_name.
 * Listed apart from the table above
 * because these are the only transmitted values a developer writes by hand.
 */
const TRACE_FIELDS: Array<{ field: string; type: string; note: string }> = [
  { field: "trace_id", type: "random hex", note: "Generated per run; means nothing outside your project" },
  { field: "span_id", type: "random hex", note: "Generated per call" },
  { field: "parent_span_id", type: "random hex", note: "Which span this call sits under" },
  { field: "workflow", type: "string", note: "The name you pass to workflow()" },
  { field: "step_name", type: "string", note: "The name you pass to step() or tool()" },
  { field: "tool_name", type: "string", note: "The name you pass to tool()" },
  { field: "step_index", type: "int", note: "Ordinal of the step within the run" },
  { field: "depth", type: "int", note: "How deeply the call was nested" },
];

/** Sent once per run, only if the run calls track_costs.outcome(). */
const OUTCOME_FIELDS: Array<{ field: string; type: string; note: string }> = [
  { field: "trace_id", type: "random hex", note: "Which run this outcome belongs to" },
  { field: "workflow", type: "string", note: "The name you passed to workflow()" },
  { field: "success", type: "bool", note: "Whether you called it a success" },
  { field: "label", type: "string", note: "Optional label you choose, e.g. \"resolved\"" },
];

const NOT_COLLECTED = [
  "Prompt and message text",
  "Model completions and responses",
  "System prompts and instructions",
  "Tool definitions, tool arguments, tool results",
  "Reasoning and thinking blocks",
  "Skill files, config files, or any file on disk",
  "Your LLM provider API keys",
  "Embeddings, documents, or retrieval context",
];

export default function PrivacyArchitectureContent() {
  return (
    <>
        <PageHeader eyebrow="Data & privacy" title={<>Data &amp; Privacy Architecture</>}>
        <p>Exactly what AgentCost collects, what never leaves your process, and
            how to verify both yourself.</p>
        <p>
            This is the engineering companion to our{" "}
            <Link
              href="/privacy"
             
            >
              Privacy Policy
            </Link>
            . The policy states our commitments; this page shows the code that
            implements them.
          </p>
      </PageHeader>

        {/* The short answer */}
        <div className="docs-panel mb-12">
          <p className="text-neutral-200">
            The short answer
          </p>
          <p>
            AgentCost is a metadata-only tracker. The SDK sends token counts,
            model names, cost, latency, timing, and — if you ask for it — the
            shape of a multi-step run. It does not send your prompts, your
            completions, your system instructions, or your files — not by
            default, and not behind a setting. There is no configuration in
            which prompt content is transmitted, because the SDK never puts it
            on the wire in the first place.
          </p>
          <p>
            If that is still more than you want to share, two stronger options
            exist: <span className="text-white font-medium">local mode</span>,
            where nothing leaves your process at all, and{" "}
            <span className="text-white font-medium">self-hosting</span>, where
            you run the entire platform.
          </p>
        </div>

        <div>
          {/* 1. What is transmitted */}
          <Section id="transmitted" title="What the SDK transmits">
            <p>
              One event is emitted per LLM call. Events are batched and sent to
              a single endpoint —{" "}
              <code>
                POST /v1/events/batch
              </code>{" "}
              — alongside your project ID and API key. That endpoint is the
              SDK&apos;s only network egress. The complete event schema is:
            </p>

            <div className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="font-medium">
                      Field
                    </th>
                    <th className="font-medium">
                      Type
                    </th>
                    <th className="font-medium">
                      What it holds
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TRANSMITTED_FIELDS.map((row) => (
                    <tr
                      key={row.field}
                      className="border-b border-neutral-800 last:border-0"
                    >
                      <td className="font-mono whitespace-nowrap">
                        {row.field}
                      </td>
                      <td className="text-neutral-500 whitespace-nowrap">
                        {row.type}
                      </td>
                      <td>
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              If you group a multi-step run with{" "}
              <code>workflow()</code>,{" "}
              <code>step()</code> or{" "}
              <code>tool()</code>, each event also
              carries where it sat in that run. A <code>tool()</code> used
              outside a <code>workflow()</code> sends <code>tool_name</code>{" "}
              alone. Instrument nothing and none of these fields are sent at
              all:
            </p>

            <div className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="font-medium">
                      Field
                    </th>
                    <th className="font-medium">
                      Type
                    </th>
                    <th className="font-medium">
                      What it holds
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {TRACE_FIELDS.map((row) => (
                    <tr
                      key={row.field}
                      className="border-b border-neutral-800 last:border-0"
                    >
                      <td className="font-mono whitespace-nowrap">
                        {row.field}
                      </td>
                      <td className="text-neutral-500 whitespace-nowrap">
                        {row.type}
                      </td>
                      <td>
                        {row.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              Calling <code>outcome()</code> adds
              one more record per run — not per call — carrying only this:
            </p>

            <div className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="font-medium">
                      Field
                    </th>
                    <th className="font-medium">
                      Type
                    </th>
                    <th className="font-medium">
                      What it holds
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {OUTCOME_FIELDS.map((row) => (
                    <tr
                      key={row.field}
                      className="border-b border-neutral-800 last:border-0"
                    >
                      <td className="font-mono whitespace-nowrap">
                        {row.field}
                      </td>
                      <td className="text-neutral-500 whitespace-nowrap">
                        {row.type}
                      </td>
                      <td>{row.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p>
              Those three tables are the entire payload. The ids are random and
              carry no meaning outside your project. The only free text is{" "}
              <code>error</code>, the{" "}
              <code>metadata</code> you attach, and
              the workflow, step, tool and outcome-label names you write
              yourself — all documented below.
            </p>
          </Section>

          {/* 2. What is never collected */}
          <Section
            id="never-collected"
            title="What never leaves your process"
          >
            <p>
              The SDK intercepts your provider client to read token usage off
              the response object. It reads the request in memory to count
              tokens and compute a hash, then discards it. None of the following
              is transmitted, logged, or stored:
            </p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {NOT_COLLECTED.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <X
                    size={16}
                    className="mt-1 shrink-0 text-neutral-600"
                    aria-hidden
                  />
                  <span className="text-neutral-300 text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <p>
              Your provider API keys are a special case: the SDK wraps the
              client&apos;s method, not its credentials. It never reads, stores,
              or transmits the key you authenticate to OpenAI, Anthropic, or
              Google with.
            </p>
            <p>
              No LLM sits in the path of your data on our side either.
              Optimization recommendations are produced by deterministic
              analysis over your own usage statistics — there is no model call,
              and consequently nothing to leak into one.
            </p>
          </Section>

          {/* 3. Prompt hashing */}
          <Section id="hashing" title="How prompts are handled">
            <p>
              To detect repeated calls — the signal behind caching
              recommendations — the SDK needs to know when two prompts are
              identical, without knowing what they say. It normalizes the
              request text, takes a SHA-256 digest, and transmits only the
              digest. The text itself never leaves the function.
            </p>
            <CodeBlock
              language="python"
              code={`# agentcost/anthropic_interceptor.py
def _hash_input(text: str) -> str:
    normalized = " ".join(text.split()).lower().strip()
    return hashlib.sha256(normalized.encode()).hexdigest()`}
            />
            <p>
              Hashing is one-way: the digest cannot be reversed into the prompt.
              We want to be precise about the limit of that guarantee, though.
            </p>
            <div className="docs-panel docs-panel--warning">
              <div className="flex items-start gap-2.5">
                <TriangleAlert
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-400"
                  aria-hidden
                />
                <div className="space-y-2">
                  <p className="text-neutral-200">
                    An honest caveat about hashes
                  </p>
                  <p>
                    A SHA-256 digest is irreversible, but it is not a secret if
                    the input is guessable. Anyone who can enumerate a small
                    space of candidate prompts can confirm a match by hashing
                    them. For long or unique prompts this is infeasible; for a
                    short prompt drawn from a known set, a hash confirms
                    membership.
                  </p>
                  <p>
                    We think this is the right trade for duplicate detection,
                    and we would rather state the limit than imply hashing is
                    absolute. If your prompts are short and drawn from a
                    predictable set, use local mode or self-host.
                  </p>
                </div>
              </div>
            </div>
          </Section>

          {/* 4. Fields you control */}
          <Section
            id="your-fields"
            title="The fields carrying content you control"
          >
            <p>
              Three things you write can reach us as free text. All are worth
              understanding before you deploy.
            </p>

            <div className="docs-panel space-y-2">
              <h3 className="text-white font-mono">
                metadata
              </h3>
              <p>
                Whatever you attach through{" "}
                <code>track_costs.metadata()</code>{" "}
                is transmitted verbatim. This is the one place you can send us
                sensitive data, and it is entirely under your control. Use
                opaque identifiers rather than personal information.
              </p>
              <CodeBlock
                language="python"
                code={`# Good — opaque identifiers
with track_costs.metadata(user_id="u_8fc21a", tenant="acme"):
    llm.invoke(prompt)

# Avoid — personal data in metadata
with track_costs.metadata(email="person@example.com"):
    llm.invoke(prompt)`}
              />
            </div>

            <div className="docs-panel space-y-2">
              <h3 className="text-white font-mono">error</h3>
              <p>
                When a call fails, the SDK records the provider&apos;s exception
                message so failures show up in your dashboard. That string comes
                from the provider SDK, not from us. Most provider errors are
                generic — rate limits, timeouts, auth failures — but some
                classes of error, content-policy rejections in particular, can
                quote a fragment of the offending input back to you. If that
                matters for your workload, local mode and self-hosting both keep
                the string on your infrastructure.
              </p>
            </div>

            <div className="docs-panel space-y-2">
              <h3 className="text-white font-mono">
                workflow, step_name, tool_name, label
              </h3>
              <p>
                These are labels you write, and we would rather point out what
                they can reveal than let you discover it later. They describe
                nothing about your data, but they do describe your
                architecture: a step called{" "}
                <code>
                  screen_applicant_credit_risk
                </code>{" "}
                tells us more about your product than any token count ever
                will. That may be entirely fine — most teams name steps after
                obvious engineering stages — but it is a deliberate choice
                rather than an accident, so it belongs on this page.
              </p>
              <p>
                Name steps after what the code does rather than what the
                business is doing, and nothing sensitive travels. Or skip the
                trace API entirely: none of these fields exist on your events
                unless you open a{" "}
                <code>workflow()</code>.
              </p>
            </div>
          </Section>

          {/* 5. Deployment modes */}
          <Section id="modes" title="Three deployment modes">
            <p>
              Pick the one matching your risk tolerance. All three run the same
              SDK and produce the same analytics.
            </p>

            <div className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="font-medium">
                      Mode
                    </th>
                    <th className="font-medium">
                      Leaves your network
                    </th>
                    <th className="font-medium">
                      Setup
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-white whitespace-nowrap">
                      Cloud
                    </td>
                    <td>
                      Metadata events only
                    </td>
                    <td>
                      API key + project ID
                    </td>
                  </tr>
                  <tr>
                    <td className="text-white whitespace-nowrap">
                      Local mode
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <Check size={14} aria-hidden /> Nothing
                      </span>
                    </td>
                    <td>
                      <code>local_mode=True</code>
                    </td>
                  </tr>
                  <tr>
                    <td className="text-white whitespace-nowrap">
                      Self-hosted
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-emerald-400">
                        <Check size={14} aria-hidden /> Nothing
                      </span>
                    </td>
                    <td>
                      Point the SDK at your own backend
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              In local mode the HTTP client is replaced with an in-process stub.
              No API key is required, no socket is opened, and events stay
              retrievable in memory:
            </p>
            <CodeBlock
              language="python"
              code={`from agentcost import track_costs

track_costs.init(local_mode=True)

# ... run your agent ...

events = track_costs.get_local_events()   # never left the process`}
            />
            <p>
              For self-hosting, set{" "}
              <code>AGENTCOST_API_URL</code> (or
              pass <code>base_url</code>) to your
              own deployment. The backend is open source and ships with a
              Dockerfile and compose file.
            </p>
          </Section>

          {/* 6. Credentials */}
          <Section id="credentials" title="Credentials and secrets">
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-1 shrink-0 text-neutral-400" aria-hidden />
                <span className="text-neutral-300 text-sm leading-relaxed">
                  <span className="text-white">AgentCost API keys</span> are
                  stored as SHA-256 digests. The plaintext key is shown once at
                  creation and never persisted, so a database disclosure does
                  not yield usable keys.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-1 shrink-0 text-neutral-400" aria-hidden />
                <span className="text-neutral-300 text-sm leading-relaxed">
                  <span className="text-white">Account passwords</span> are
                  hashed with bcrypt through passlib, with per-password salting
                  and deliberate slowness against offline cracking.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-1 shrink-0 text-neutral-400" aria-hidden />
                <span className="text-neutral-300 text-sm leading-relaxed">
                  <span className="text-white">LLM provider keys</span> are
                  never read by the SDK. It wraps the method on your client
                  object; the credential stays where you configured it.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="mt-1 shrink-0 text-neutral-400" aria-hidden />
                <span className="text-neutral-300 text-sm leading-relaxed">
                  <span className="text-white">Transport</span> is HTTPS to{" "}
                  <code>api.agentcost.tech</code>,
                  authenticated with a bearer token scoped to a single project.
                </span>
              </li>
            </ul>
          </Section>

          {/* 7. Retention */}
          <Section id="retention" title="Retention and deletion" icon={Trash2}>
            <p>
              While your account is active, usage events are retained
              indefinitely. This is deliberate: cost trends, baselines, and
              anomaly detection are only meaningful against long history, and
              truncating it would silently degrade the product. Events hold no
              prompt content, so what accumulates is a numeric time series.
            </p>
            <p>
              Deleting your account starts a{" "}
              <span className="text-white">7-day grace period</span>, after
              which a scheduled job hard-deletes your data. Deletion is
              explicit rather than reliant on database cascades — the purge
              removes events, daily aggregates, optimization recommendations,
              project baselines, input pattern caches, pending invitations, and
              the projects themselves, then revokes every active session.
            </p>
            <p>
              Self-hosted deployments set their own retention: the data is in
              your database and never reaches ours.
            </p>
          </Section>

          {/* 8. Verify it */}
          <Section id="verify" title="Verify this yourself">
            <p>
              Every claim on this page is checkable against source. The SDK and
              backend are both open source under the MIT license. The files that
              matter:
            </p>
            <ul className="space-y-2.5">
              <li>
                <a
                  href={`${SDK_REPO}/anthropic_interceptor.py`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono"
                >
                  anthropic_interceptor.py
                </a>{" "}
                — see <code>_build_event</code> for
                the complete transmitted payload. The OpenAI, Gemini, and
                LangChain interceptors build the identical shape.
              </li>
              <li>
                <a
                  href={`${SDK_REPO}/http_client.py`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono"
                >
                  http_client.py
                </a>{" "}
                — the only place the SDK opens a socket.
              </li>
              <li>
                <a
                  href={`${SDK_REPO}/trace.py`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono"
                >
                  trace.py
                </a>{" "}
                — every trace field, and the fact that outside a{" "}
                <code>workflow()</code> only <code>tool_name</code> is produced.
              </li>
              <li>
                <a
                  href={`${SDK_REPO}/tracker.py`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono"
                >
                  tracker.py
                </a>{" "}
                — local mode swapping the HTTP client for an in-process stub.
              </li>
              <li>
                <a
                  href={`${BACKEND_REPO}/services/admin_service.py`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono"
                >
                  admin_service.py
                </a>{" "}
                — <code>delete_user_permanently</code>,
                the deletion path described above.
              </li>
            </ul>
            <p>
              You can also watch the wire directly. Run your agent against a
              local proxy, or start in local mode and inspect{" "}
              <code>get_local_events()</code> — the
              structure is the same one that would have been transmitted.
            </p>
          </Section>

          {/* Contact */}
          <Section id="contact" title="Questions we have not answered">
            <p>
              If you are evaluating AgentCost against a security review and need
              something this page does not cover, ask. We would rather answer a
              hard question directly than have you infer the answer.
            </p>
            <p>
              Email{" "}
              <a
                href="mailto:hello@agentcost.tech"
               
              >
                hello@agentcost.tech
              </a>{" "}
              or open an issue on the{" "}
              <a
                href="https://github.com/agentcost-ai/agentcost-sdk"
                target="_blank"
                rel="noopener noreferrer"
               
              >
                SDK repository
              </a>
              .
            </p>
          </Section>
        </div>

        {/* Footer nav */}
        <div className="mt-16 pt-8 border-t border-neutral-800 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link
            href="/docs/sdk"
           
          >
            SDK Documentation
          </Link>
          <Link
            href="/privacy"
           
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms"
           
          >
            Terms of Service
          </Link>
        </div>
    </>
  );
}
