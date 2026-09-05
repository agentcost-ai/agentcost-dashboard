"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";

import { PageHeader, Section, CodeBlock } from "@/components/docs/primitives";

export default function SDKDocsPage() {
  return (
    <>
        <PageHeader eyebrow="Python SDK" title={<>SDK Documentation</>}>
        <p>Complete guide to integrating AgentCost into your OpenAI, Anthropic,
            Gemini, and LangChain applications</p>
      </PageHeader>

        {/* Content */}
        <div>
          <Section id="installation" title="Installation">
            <p>
              Install the AgentCost SDK using pip:
            </p>
            <CodeBlock code="pip install agentcost" language="bash" />
            <p>Or install from source:</p>
            <CodeBlock
              code={`cd agentcost-sdk
pip install -e .`}
              language="bash"
            />
          </Section>

          <Section id="quick-start" title="Quick Start">
            <p>
              Add just two lines of code to start tracking LLM costs:
            </p>
            <CodeBlock
              code={`from agentcost import track_costs

# Initialize tracking
track_costs.init(
    api_key="sk_...",  # Settings → your project → API Key
    project_id="123e4567-e89b-42d3-a456-426614174000"  # Settings → your project → UUID
)

# OpenAI — automatically tracked
from openai import OpenAI
client = OpenAI()
response = client.chat.completions.create(model="gpt-4o", messages=[{"role": "user", "content": "Hello!"}])

# Anthropic — automatically tracked
from anthropic import Anthropic
client = Anthropic()
message = client.messages.create(model="claude-3-5-sonnet-20241022", max_tokens=100, messages=[{"role": "user", "content": "Hello!"}])

# Gemini — automatically tracked (Google Gen AI SDK)
from google import genai
client = genai.Client()
response = client.models.generate_content(model="gemini-2.5-flash", contents="Hello!")

# LangChain — automatically tracked
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4")
response = llm.invoke("Hello, world!")  # Automatically tracked`}
            />
            <div className="docs-panel">
              <p>
                <strong>Note:</strong> The SDK uses monkey patching to intercept
                OpenAI, Anthropic, Gemini, and LangChain calls. Your existing code
                requires no modifications.
              </p>
            </div>
            <div className="docs-panel docs-panel--warning mt-4">
              <p>
                <strong>Security:</strong> API keys are shown once on creation.
                Store them securely and rotate keys from the dashboard if
                needed.
              </p>
            </div>

            <h4 className="text-lg text-white">
              Verify it worked
            </h4>
            <p>
              Force-send any pending events, then check your dashboard — your
              first calls should appear within seconds:
            </p>
            <CodeBlock
              code={`# Push any batched events to the backend immediately
track_costs.flush()

# Now open your dashboard — the calls above should be there.`}
            />
            <div className="docs-panel docs-panel--warning">
              <p>
                <strong>Nothing showing up?</strong> If your{" "}
                <code>api_key</code>{" "}
                and{" "}
                <code>
                  project_id
                </code>{" "}
                don&apos;t match (e.g. the project name was used instead of its
                UUID), the backend returns 403 and the SDK emits a{" "}
                <code>
                  RuntimeWarning
                </code>{" "}
                plus an error on the{" "}
                <code>agentcost</code>{" "}
                logger. Check your console output.
              </p>
            </div>
          </Section>

          <Section id="configuration" title="Configuration">
            <p>
              The SDK supports extensive configuration options:
            </p>
            <CodeBlock
              code={`track_costs.init(
    # Required for cloud mode
    api_key="sk_...",
    project_id="123e4567-e89b-42d3-a456-426614174000",  # project UUID, not its name

    # Optional settings
    base_url="https://api.agentcost.tech",  # Your backend URL
    batch_size=10,                          # Events before auto-flush
    flush_interval=5.0,                     # Seconds between flushes
    debug=True,                             # Enable debug logging
    default_agent_name="my-agent",          # Default agent tag
    local_mode=False,                       # Store locally (no backend)
    enabled=True,                           # Enable/disable tracking

    # Custom pricing (overrides defaults)
    custom_pricing={
        "my-custom-model": {"input": 0.001, "output": 0.002}
    },

    # Global metadata (attached to all events)
    global_metadata={
        "environment": "production",
        "version": "1.0.0"
    }
)`}
            />
            <h4 className="text-lg text-white">
              Configuration Options
            </h4>
            <div className="docs-table-wrap">
              <table className="min-w-150">
                <thead>
                  <tr>
                    <th className="font-medium">
                      Parameter
                    </th>
                    <th className="font-medium">
                      Type
                    </th>
                    <th className="font-medium">
                      Default
                    </th>
                    <th className="font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-mono">
                      api_key
                    </td>
                    <td>str</td>
                    <td>None</td>
                    <td>Your project API key</td>
                  </tr>
                  <tr>
                    <td className="font-mono">
                      project_id
                    </td>
                    <td>str</td>
                    <td>None</td>
                    <td>
                      Your project&apos;s UUID (Settings → your project), not
                      its name
                    </td>
                  </tr>
                  <tr>
                    <td className="font-mono">
                      batch_size
                    </td>
                    <td>int</td>
                    <td>10</td>
                    <td>Events before auto-flush</td>
                  </tr>
                  <tr>
                    <td className="font-mono">
                      flush_interval
                    </td>
                    <td>float</td>
                    <td>5.0</td>
                    <td>Seconds between flushes</td>
                  </tr>
                  <tr>
                    <td className="font-mono">
                      local_mode
                    </td>
                    <td>bool</td>
                    <td>False</td>
                    <td>Store events locally only</td>
                  </tr>
                  <tr>
                    <td className="font-mono">
                      debug
                    </td>
                    <td>bool</td>
                    <td>False</td>
                    <td>Enable debug logging</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="agent-tagging" title="Agent Tagging">
            <p>
              Tag LLM calls by agent for granular analytics:
            </p>
            <CodeBlock
              code={`# Option 1: Set default agent
track_costs.set_agent_name("router-agent")

# Option 2: Context manager (recommended)
with track_costs.agent("technical-agent"):
    llm.invoke("How do I fix this bug?")  # Tagged as "technical-agent"

with track_costs.agent("billing-agent"):
    llm.invoke("What's my balance?")  # Tagged as "billing-agent"`}
            />
            <p>
              Agent names appear in your dashboard, allowing you to track costs
              per agent and identify which parts of your system are most
              expensive.
            </p>
          </Section>

          <Section id="workflows" title="Workflows & Steps">
            <p>
              Agent tagging answers <em>which agent</em> spent the money.
              Wrapping a multi-step run answers <em>what one run costs</em>,
              which step inside it is expensive, and whether the agent is
              looping:
            </p>
            <CodeBlock
              code={`with track_costs.workflow("support-triage"):

    with track_costs.step("classify"):
        llm.invoke("Which queue does this belong in?")

    with track_costs.tool("search_docs"):
        llm.invoke("Summarise these results")

    with track_costs.step("draft_reply"):
        llm.invoke("Write the response")`}
            />
            <p>
              Every call inside shares one trace id and records the step it
              belongs to, its parent, and how deeply it was nested. Steps nest
              freely, and a sub-agent that opens its own{" "}
              <code>workflow()</code> stays part of
              the caller&apos;s run rather than starting a second one.
            </p>
            <p>
              This unlocks the Workflows page in your dashboard: cost per run
              rather than per call, cost per step and per tool, and detection of
              the same call being made twice inside a single run — which is
              usually a loop rather than something a cache would fix.
            </p>
            <p>
              Tool names also feed the Guardrails page: declare which tools an
              agent may call (and whether it is read-only), which models it may
              use, and how many tool calls or how much cost a single{" "}
              <code>workflow()</code> run may reach, and observed usage is judged
              against that boundary. This is deliberately separate from success
              rate — a failed call on a permitted tool is not a breach, and a
              successful call on a forbidden one is. From SDK 0.2.2, <code>tool()</code> records
              the tool name with or without a workflow around it; only
              uninstrumented calls are invisible, so the page reports coverage
              next to every verdict.
            </p>
            <p>
              Mark how a run ended and you also get cost per completed outcome,
              which charges failed runs to the successes they were paid for:
            </p>
            <CodeBlock
              code={`with track_costs.workflow("support-triage"):
    ticket = handle(request)
    track_costs.outcome(ticket.resolved, label=ticket.status)`}
            />
            <div className="docs-panel mt-4">
              <p>
                Entirely optional and entirely additive. Without a{" "}
                <code>workflow()</code> your events
                are exactly what they were before, and{" "}
                <code>step()</code> outside a
                workflow is a no-op — so instrumenting a shared helper never
                depends on how it gets called. Workflow, step and tool names are
                strings you write and they are transmitted as written; see the{" "}
                <Link
                  href="/docs/privacy"
                 
                >
                  privacy architecture
                </Link>{" "}
                page.
              </p>
            </div>
          </Section>

          <Section
            id="external-correlation"
            title="External Correlation"
          >
            <p>
              A process that wraps your agent — a policy layer, an
              orchestrator, a CI job — can join its own records to AgentCost
              cost data by exporting one variable. No code change in the agent:
              the SDK it already runs picks the id up from the environment and
              stamps it on every event.
            </p>
            <CodeBlock
              language="bash"
              code={`export AGENTCOST_TRACE_ID=0532f9c4-a022-4e98-a543-d8e17c5b90a6
export AGENTCOST_WORKFLOW=refactor-run   # optional, names the run`}
            />
            <p>
              Precedence is always: an explicit{" "}
              <code>
                workflow(&quot;name&quot;, trace_id=...)
              </code>{" "}
              argument, then an active <code>workflow()</code>,
              then the environment. Trace ids accept up to 64 characters, so
              UUIDs and ULIDs fit. Read the joined run back with{" "}
              <code>
                GET /v1/analytics/traces/{"{trace_id}"}
              </code>
              , and report how it ended — even with no events attached — via{" "}
              <code>outcomes</code> on the batch
              endpoint.
            </p>
          </Section>

          <Section
            id="pre-deployment"
            title="Pre-deployment Analysis"
          >
            <p>
              Estimate what an agent will cost, and find its loops, before it
              has spent anything. The analyser runs entirely on your machine:
            </p>
            <CodeBlock
              language="bash"
              code={`# What do the prompt and skill files cost on every call?
agentcost analyze ./agent --model gpt-4o

# Record a test run with local mode, then project it to production
agentcost analyze ./agent --events run.json --runs-per-day 2000`}
            />
            <p>
              Save a test run with local mode, where nothing leaves the process
              at all:
            </p>
            <CodeBlock
              code={`import json
from agentcost import track_costs

track_costs.init(local_mode=True)

with track_costs.workflow("support-triage"):
    ...   # run your agent once

track_costs.flush()
json.dump(track_costs.get_local_events(), open("run.json", "w"))`}
            />
            <p>
              The report gives cost per run, the share each step contributes, a
              projected monthly bill at your expected volume, and findings:
              steps that loop, identical calls repeated inside one run, prompt
              files eating the context window, and duplicated content across
              files.
            </p>
            <p>
              Every flag, every finding it can raise, and the CI exit codes are
              in the{" "}
              <Link
                href="/docs/cli"
               
              >
                CLI reference
              </Link>
              .
            </p>
            <div className="docs-panel mt-4">
              <p>
                This command reads your prompts and skill files, and it never
                transmits them. No network call is made, and no file content
                outlives the token count taken from it — see the{" "}
                <Link
                  href="/docs/privacy"
                 
                >
                  privacy architecture
                </Link>{" "}
                page.
              </p>
            </div>
          </Section>

          <Section id="metadata" title="Metadata">
            <p>
              Attach custom metadata for filtering and grouping:
            </p>
            <CodeBlock
              code={`# Persistent metadata (attached to all subsequent events)
track_costs.add_metadata("user_id", "user_123")
track_costs.add_metadata("tenant_id", "acme_corp")

# Temporary metadata (context manager)
with track_costs.metadata(conversation_id="conv_456", step="routing"):
    llm.invoke("Route this query")`}
            />
          </Section>

          <Section id="local-mode" title="Local Mode">
            <p>Test without running a backend:</p>
            <CodeBlock
              code={`track_costs.init(local_mode=True, debug=True)

# Make LLM calls
llm.invoke("Hello!")
llm.invoke("World!")

# Retrieve captured events
events = track_costs.get_local_events()
for event in events:
    print(f"Model: {event['model']}")
    print(f"Tokens: {event['total_tokens']}")
    print(f"Cost: \${event['cost']:.6f}")`}
            />
          </Section>

          <Section id="streaming" title="Streaming Support">
            <p>
              Streaming calls are automatically tracked:
            </p>
            <CodeBlock
              code={`# Sync streaming
for chunk in llm.stream("Tell me a story"):
    print(chunk.content, end="")
# Event recorded after stream completes

# Async streaming
async for chunk in llm.astream("Tell me a story"):
    print(chunk.content, end="")
# Event recorded after stream completes`}
            />
          </Section>

          <Section
            id="supported-models"
            title="Supported Models"
          >
            <p>
              AgentCost supports over{" "}
              <strong className="text-white">3,500+ models</strong> from all
              major providers. Pricing is automatically synced from{" "}
              <a
                href="https://github.com/BerriAI/litellm"
                target="_blank"
                rel="noopener noreferrer"
               
              >
                LiteLLM&apos;s
              </a>{" "}
              comprehensive pricing database, ensuring you always have accurate,
              up-to-date cost information.
            </p>

            <div className="rounded-lg bg-primary-900/20 border border-primary-700/50 p-4 mt-4 mb-6">
              <p className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>
                  <strong>View all models:</strong>{" "}
                  <a
                    href="/docs/models"
                   
                  >
                    Browse the complete model catalog
                  </a>{" "}
                  with search, filtering, and live pricing.
                </span>
              </p>
            </div>

            <div className="docs-table-wrap">
              <table className="min-w-120">
                <thead>
                  <tr>
                    <th className="font-medium">
                      Provider
                    </th>
                    <th className="font-medium">
                      Examples
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-medium">OpenAI</td>
                    <td>
                      gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo,
                      o1, o1-mini, o1-preview
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Anthropic</td>
                    <td>
                      claude-3-opus, claude-3-sonnet, claude-3-haiku,
                      claude-3.5-sonnet, claude-3.5-haiku, claude-4-opus
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Google</td>
                    <td>
                      gemini-pro, gemini-1.5-pro, gemini-1.5-flash,
                      gemini-2.0-flash
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Groq</td>
                    <td>
                      llama-3.1-8b, llama-3.1-70b, llama-3.3-70b, mixtral-8x7b
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">DeepSeek</td>
                    <td>
                      deepseek-chat, deepseek-coder, deepseek-reasoner
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Cohere</td>
                    <td>
                      command, command-r, command-r-plus
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Mistral</td>
                    <td>
                      mistral-small, mistral-medium, mistral-large
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Together AI</td>
                    <td>
                      meta-llama/Llama-3-70b, Qwen models, Phi models
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">AWS Bedrock</td>
                    <td>
                      All Bedrock-hosted models (Claude, Titan, Llama)
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">Azure OpenAI</td>
                    <td>
                      All Azure-hosted OpenAI models
                    </td>
                  </tr>
                  <tr>
                    <td className="font-medium">50+ More</td>
                    <td>
                      Replicate, Fireworks, Anyscale, Perplexity, etc.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              For custom or private models, you can provide custom pricing via
              the <code>custom_pricing</code>{" "}
              parameter. The SDK also fetches the latest pricing from the
              backend automatically.
            </p>
          </Section>

          {/* Event Structure */}
          <Section id="event-structure" title="Event Structure">
            <p>Each tracked event contains:</p>
            <CodeBlock
              language="json"
              code={`{
  "agent_name": "my-agent",
  "model": "gpt-4o",
  "input_tokens": 1500,
  "output_tokens": 80,
  "total_tokens": 1580,
  "cached_tokens": 1200,
  "cost": 0.0031,
  "latency_ms": 1234,
  "timestamp": "2026-08-15T10:30:45.123Z",
  "success": true,
  "error": null,
  "streaming": false,
  "metadata": {"conversation_id": "conv_456"}
}`}
            />
            <div className="docs-panel mt-4">
              <p>
                <strong>Prompt-cache accounting:</strong>{" "}
                <code>cached_tokens</code>{" "}
                is the part of the prompt served from the provider&apos;s cache,
                read automatically off OpenAI, Anthropic and Gemini responses
                (Anthropic cache <em>writes</em> are reported separately as{" "}
                <code>cache_write_tokens</code>,
                since they bill at a premium). Cached tokens are priced at the
                provider&apos;s real cache-read rate — on cache-heavy agent
                workloads this is the difference between the right bill and one
                overstated several times over.
              </p>
            </div>
          </Section>

          {/* Graceful Shutdown */}
          <Section id="shutdown" title="Graceful Shutdown">
            <p>
              Ensure all events are sent before your application exits:
            </p>
            <CodeBlock
              code={`# Send pending events
track_costs.flush()

# Full shutdown
track_costs.shutdown()`}
            />
            <div className="docs-panel mt-4">
              <p>
                <strong>Tip:</strong> Use Python&apos;s{" "}
                <code>atexit</code>{" "}
                module to automatically call{" "}
                <code>shutdown()</code>{" "}
                when your application exits.
              </p>
            </div>
          </Section>

          {/* Error Handling */}
          <Section id="error-handling" title="Error Handling">
            <p>
              The SDK is designed to never interfere with your application. All
              tracking operations are:
            </p>
            <ul className="space-y-2 ml-4">
              <li>
                <strong className="text-white">Non-blocking:</strong> Events are
                batched and sent asynchronously
              </li>
              <li>
                <strong className="text-white">Fault-tolerant:</strong> Network
                failures are silently handled
              </li>
              <li>
                <strong className="text-white">Retry-enabled:</strong> Failed
                batches are retried with exponential backoff
              </li>
            </ul>
            <CodeBlock
              code={`# The SDK never throws exceptions to your code
try:
    response = llm.invoke("Hello!")  # This works even if tracking fails
except Exception as e:
    # This will only catch LLM errors, not tracking errors
    print(f"LLM error: {e}")

# To see tracking errors, enable debug mode
track_costs.init(
    api_key="sk_...",
    project_id="123e4567-e89b-42d3-a456-426614174000",
    debug=True,  # Logs errors to console
)`}
            />
          </Section>

          {/* Best Practices */}
          <Section id="best-practices" title="Best Practices">
            <div className="space-y-6">
              <div>
                <h4 className="text-white">
                  1. Initialize Early
                </h4>
                <p>
                  Call{" "}
                  <code>track_costs.init()</code>{" "}
                  before creating any LLM instances:
                </p>
                <CodeBlock
                  code={`# Correct: Initialize before importing LLM
from agentcost import track_costs
track_costs.init(
    api_key="sk_...",
    project_id="123e4567-e89b-42d3-a456-426614174000",
)

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4")

# Wrong: LLM created before initialization
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4")

from agentcost import track_costs
track_costs.init(
    api_key="sk_...",
    project_id="123e4567-e89b-42d3-a456-426614174000",
)  # Too late!`}
                />
              </div>

              <div>
                <h4 className="text-white">
                  2. Use Agent Context Managers
                </h4>
                <p>
                  Context managers ensure proper agent tagging even if
                  exceptions occur:
                </p>
                <CodeBlock
                  code={`# Recommended: Context manager
with track_costs.agent("router"):
    response = llm.invoke(query)

# Less safe: Manual setting
track_costs.set_agent_name("router")
response = llm.invoke(query)  # What if this throws?
track_costs.set_agent_name("default")  # Might not run`}
                />
              </div>

              <div>
                <h4 className="text-white">
                  3. Environment Variables
                </h4>
                <p>
                  Store sensitive configuration in environment variables:
                </p>
                <CodeBlock
                  code={`import os
from agentcost import track_costs

track_costs.init(
    api_key=os.environ["AGENTCOST_API_KEY"],       # sk_...
    project_id=os.environ["AGENTCOST_PROJECT_ID"], # project UUID
    base_url=os.environ.get("AGENTCOST_URL", "https://api.agentcost.tech"),
    debug=os.environ.get("DEBUG", "false").lower() == "true"
)`}
                />
              </div>

              <div>
                <h4 className="text-white">
                  4. Graceful Shutdown
                </h4>
                <p>
                  Always flush events before your application exits:
                </p>
                <CodeBlock
                  code={`import atexit
from agentcost import track_costs

track_costs.init(
    api_key="sk_...",
    project_id="123e4567-e89b-42d3-a456-426614174000",
)

# Register shutdown handler
atexit.register(track_costs.shutdown)

# Or in FastAPI/Flask
@app.on_event("shutdown")
async def shutdown_event():
    track_costs.shutdown()`}
                />
              </div>
            </div>
          </Section>

          {/* Troubleshooting */}
          <Section id="troubleshooting" title="Troubleshooting">
            <div className="space-y-4">
              <div className="docs-panel">
                <h4 className="text-white">
                  Events not appearing in dashboard
                </h4>
                <ul className="space-y-1">
                  <li>
                    <strong className="text-neutral-200">
                      #1 cause:
                    </strong>{" "}
                    <code>project_id</code> must
                    be the project <strong>UUID</strong> from Settings, not its
                    name — a mismatch returns 403 and the SDK logs an{" "}
                    <code>agentcost</code> error
                  </li>
                  <li>
                    Ensure{" "}
                    <code>track_costs.init()</code>{" "}
                    is called before LLM usage
                  </li>
                  <li>Check your API key is correct</li>
                  <li>
                    Enable <code>debug=True</code>{" "}
                    to see error messages
                  </li>
                  <li>
                    Call{" "}
                    <code>
                      track_costs.flush()
                    </code>{" "}
                    to force send events
                  </li>
                </ul>
              </div>

              <div className="docs-panel">
                <h4 className="text-white">
                  Token counts seem wrong
                </h4>
                <ul className="space-y-1">
                  <li>The SDK uses tiktoken for accurate counting</li>
                  <li>
                    Make sure tiktoken is installed:{" "}
                    <code>
                      pip install tiktoken
                    </code>
                  </li>
                  <li>Some models may use different tokenizers</li>
                </ul>
              </div>

              <div className="docs-panel">
                <h4 className="text-white">
                  Connection errors
                </h4>
                <ul className="space-y-1">
                  <li>
                    Verify your{" "}
                    <code>base_url</code> is
                    correct
                  </li>
                  <li>Check that the backend is running and accessible</li>
                  <li>Look for firewall or proxy issues</li>
                </ul>
              </div>

              <div className="docs-panel">
                <h4 className="text-white">Getting support</h4>
                <p>
                  If you&apos;re still having issues, check our{" "}
                  <a
                    href="https://github.com/agentcost-ai/agentcost-backend/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                   
                  >
                    GitHub Issues
                  </a>{" "}
                  or start a discussion.
                </p>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-neutral-800">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-center gap-4">
              <Link
                href="/"
               
              >
                ← Home
              </Link>
              <Link
                href="/auth/register"
               
              >
                Get started free
              </Link>
            </div>
            <a
              href="/docs/api"
             
            >
              API Reference →
            </a>
          </div>
        </div>
    </>
  );
}
