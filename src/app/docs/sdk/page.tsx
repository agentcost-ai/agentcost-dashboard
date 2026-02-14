"use client";

import {
  Copy,
  Check,
  Code,
  Zap,
  Box,
  Settings,
  Terminal,
  Layers,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-3 right-3 p-2 rounded-md bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} className="text-neutral-400" />
      )}
    </button>
  );
}

function CodeBlock({
  code,
  language = "python",
}: {
  code: string;
  language?: string;
}) {
  return (
    <div className="relative rounded-lg bg-neutral-800/50 border border-neutral-700/50">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-700/50">
        <span className="text-xs font-medium text-neutral-500 uppercase">
          {language}
        </span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="text-neutral-300">{code}</code>
      </pre>
    </div>
  );
}

function Section({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-900/30 text-primary-400">
          <Icon size={20} />
        </div>
        <h2 className="text-xl font-semibold text-white">{title}</h2>
      </div>
      <div className="ml-13 space-y-4">{children}</div>
    </section>
  );
}

export default function SDKDocsPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="mx-auto max-w-4xl px-6 py-8 pt-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">SDK Documentation</h1>
          <p className="mt-2 text-neutral-400">
            Complete guide to integrating AgentCost into your LangChain
            applications
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 rounded-lg bg-neutral-800/30 border border-neutral-700/50 p-6">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            Contents
          </h3>
          <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href="#installation"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Installation
            </a>
            <a
              href="#quick-start"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Quick Start
            </a>
            <a
              href="#configuration"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Configuration
            </a>
            <a
              href="#supported-models"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Supported Models
            </a>
            <a
              href="#agent-tagging"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Agent Tagging
            </a>
            <a
              href="#metadata"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Metadata
            </a>
            <a
              href="#local-mode"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Local Mode
            </a>
            <a
              href="#streaming"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Streaming Support
            </a>
            <a
              href="#event-structure"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Event Structure
            </a>
            <a
              href="#shutdown"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Graceful Shutdown
            </a>
            <a
              href="#error-handling"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Error Handling
            </a>
            <a
              href="#best-practices"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Best Practices
            </a>
            <a
              href="#troubleshooting"
              className="block text-primary-400 hover:text-primary-300 transition-colors"
            >
              Troubleshooting
            </a>
          </nav>
        </div>

        {/* Content */}
        <div className="space-y-12">
          <Section id="installation" title="Installation" icon={Terminal}>
            <p className="text-neutral-300">
              Install the AgentCost SDK using pip:
            </p>
            <CodeBlock code="pip install agentcost" language="bash" />
            <p className="text-neutral-300">Or install from source:</p>
            <CodeBlock
              code={`cd agentcost-sdk
pip install -e .`}
              language="bash"
            />
          </Section>

          <Section id="quick-start" title="Quick Start" icon={Zap}>
            <p className="text-neutral-300">
              Add just two lines of code to start tracking LLM costs:
            </p>
            <CodeBlock
              code={`from agentcost import track_costs

# Initialize tracking
track_costs.init(
    api_key="your_api_key",
    project_id="my-project"
)

# Your existing code works unchanged
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4")
response = llm.invoke("Hello, world!")  # Automatically tracked`}
            />
            <div className="rounded-lg bg-blue-900/20 border border-blue-700/50 p-4">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> The SDK uses monkey patching to intercept
                LangChain calls. Your existing code requires no modifications.
              </p>
            </div>
            <div className="rounded-lg bg-yellow-900/20 border border-yellow-700/50 p-4 mt-4">
              <p className="text-yellow-300 text-sm">
                <strong>Security:</strong> API keys are shown once on creation.
                Store them securely and rotate keys from the dashboard if
                needed.
              </p>
            </div>
          </Section>

          <Section id="configuration" title="Configuration" icon={Settings}>
            <p className="text-neutral-300">
              The SDK supports extensive configuration options:
            </p>
            <CodeBlock
              code={`track_costs.init(
    # Required for cloud mode
    api_key="sk_...",
    project_id="my-project",

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
            <h4 className="text-lg font-medium text-white mt-6">
              Configuration Options
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                      Parameter
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                      Type
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                      Default
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-mono text-primary-400">
                      api_key
                    </td>
                    <td className="py-3 px-4">str</td>
                    <td className="py-3 px-4">None</td>
                    <td className="py-3 px-4">Your project API key</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-mono text-primary-400">
                      project_id
                    </td>
                    <td className="py-3 px-4">str</td>
                    <td className="py-3 px-4">None</td>
                    <td className="py-3 px-4">Your project identifier</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-mono text-primary-400">
                      batch_size
                    </td>
                    <td className="py-3 px-4">int</td>
                    <td className="py-3 px-4">10</td>
                    <td className="py-3 px-4">Events before auto-flush</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-mono text-primary-400">
                      flush_interval
                    </td>
                    <td className="py-3 px-4">float</td>
                    <td className="py-3 px-4">5.0</td>
                    <td className="py-3 px-4">Seconds between flushes</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-mono text-primary-400">
                      local_mode
                    </td>
                    <td className="py-3 px-4">bool</td>
                    <td className="py-3 px-4">False</td>
                    <td className="py-3 px-4">Store events locally only</td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-mono text-primary-400">
                      debug
                    </td>
                    <td className="py-3 px-4">bool</td>
                    <td className="py-3 px-4">False</td>
                    <td className="py-3 px-4">Enable debug logging</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="agent-tagging" title="Agent Tagging" icon={Layers}>
            <p className="text-neutral-300">
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
            <p className="text-neutral-300 mt-4">
              Agent names appear in your dashboard, allowing you to track costs
              per agent and identify which parts of your system are most
              expensive.
            </p>
          </Section>

          <Section id="metadata" title="Metadata" icon={Box}>
            <p className="text-neutral-300">
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

          <Section id="local-mode" title="Local Mode" icon={Code}>
            <p className="text-neutral-300">Test without running a backend:</p>
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

          <Section id="streaming" title="Streaming Support" icon={Zap}>
            <p className="text-neutral-300">
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
            icon={BookOpen}
          >
            <p className="text-neutral-300">
              AgentCost supports over{" "}
              <strong className="text-white">1,900+ models</strong> from all
              major providers. Pricing is automatically synced from{" "}
              <a
                href="https://github.com/BerriAI/litellm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 underline"
              >
                LiteLLM&apos;s
              </a>{" "}
              comprehensive pricing database, ensuring you always have accurate,
              up-to-date cost information.
            </p>

            <div className="rounded-lg bg-primary-900/20 border border-primary-700/50 p-4 mt-4 mb-6">
              <p className="text-primary-300 text-sm flex items-center gap-2">
                <BookOpen size={16} />
                <span>
                  <strong>View all models:</strong>{" "}
                  <a
                    href="/docs/models"
                    className="underline hover:text-primary-200"
                  >
                    Browse the complete model catalog
                  </a>{" "}
                  with search, filtering, and live pricing.
                </span>
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                      Provider
                    </th>
                    <th className="text-left py-3 px-4 text-neutral-400 font-medium">
                      Examples
                    </th>
                  </tr>
                </thead>
                <tbody className="text-neutral-300">
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">OpenAI</td>
                    <td className="py-3 px-4">
                      gpt-4, gpt-4-turbo, gpt-4o, gpt-4o-mini, gpt-3.5-turbo,
                      o1, o1-mini, o1-preview
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">Anthropic</td>
                    <td className="py-3 px-4">
                      claude-3-opus, claude-3-sonnet, claude-3-haiku,
                      claude-3.5-sonnet, claude-3.5-haiku, claude-4-opus
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">Google</td>
                    <td className="py-3 px-4">
                      gemini-pro, gemini-1.5-pro, gemini-1.5-flash,
                      gemini-2.0-flash
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">Groq</td>
                    <td className="py-3 px-4">
                      llama-3.1-8b, llama-3.1-70b, llama-3.3-70b, mixtral-8x7b
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">DeepSeek</td>
                    <td className="py-3 px-4">
                      deepseek-chat, deepseek-coder, deepseek-reasoner
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">Cohere</td>
                    <td className="py-3 px-4">
                      command, command-r, command-r-plus
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">Mistral</td>
                    <td className="py-3 px-4">
                      mistral-small, mistral-medium, mistral-large
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">Together AI</td>
                    <td className="py-3 px-4">
                      meta-llama/Llama-3-70b, Qwen models, Phi models
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">AWS Bedrock</td>
                    <td className="py-3 px-4">
                      All Bedrock-hosted models (Claude, Titan, Llama)
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">Azure OpenAI</td>
                    <td className="py-3 px-4">
                      All Azure-hosted OpenAI models
                    </td>
                  </tr>
                  <tr className="border-b border-neutral-800">
                    <td className="py-3 px-4 font-medium">30+ More</td>
                    <td className="py-3 px-4">
                      Replicate, Fireworks, Anyscale, Perplexity, etc.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-neutral-400 text-sm mt-4">
              For custom or private models, you can provide custom pricing via
              the <code className="text-primary-400">custom_pricing</code>{" "}
              parameter. The SDK also fetches the latest pricing from the
              backend automatically.
            </p>
          </Section>

          {/* Event Structure */}
          <Section id="event-structure" title="Event Structure" icon={Code}>
            <p className="text-neutral-300">Each tracked event contains:</p>
            <CodeBlock
              language="json"
              code={`{
  "agent_name": "my-agent",
  "model": "gpt-4",
  "input_tokens": 150,
  "output_tokens": 80,
  "total_tokens": 230,
  "cost": 0.0093,
  "latency_ms": 1234,
  "timestamp": "2024-01-23T10:30:45.123Z",
  "success": true,
  "error": null,
  "streaming": false,
  "metadata": {"conversation_id": "conv_456"}
}`}
            />
          </Section>

          {/* Graceful Shutdown */}
          <Section id="shutdown" title="Graceful Shutdown" icon={Settings}>
            <p className="text-neutral-300">
              Ensure all events are sent before your application exits:
            </p>
            <CodeBlock
              code={`# Send pending events
track_costs.flush()

# Full shutdown
track_costs.shutdown()`}
            />
            <div className="rounded-lg bg-blue-900/20 border border-blue-700/50 p-4 mt-4">
              <p className="text-blue-300 text-sm">
                <strong>Tip:</strong> Use Python&apos;s{" "}
                <code className="bg-blue-900/30 px-1 rounded">atexit</code>{" "}
                module to automatically call{" "}
                <code className="bg-blue-900/30 px-1 rounded">shutdown()</code>{" "}
                when your application exits.
              </p>
            </div>
          </Section>

          {/* Error Handling */}
          <Section id="error-handling" title="Error Handling" icon={Terminal}>
            <p className="text-neutral-300">
              The SDK is designed to never interfere with your application. All
              tracking operations are:
            </p>
            <ul className="list-disc list-inside text-neutral-300 space-y-2 mt-4 ml-4">
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
track_costs.init(api_key="...", debug=True)  # Logs errors to console`}
            />
          </Section>

          {/* Best Practices */}
          <Section id="best-practices" title="Best Practices" icon={BookOpen}>
            <div className="space-y-6">
              <div>
                <h4 className="text-white font-medium mb-2">
                  1. Initialize Early
                </h4>
                <p className="text-neutral-400 text-sm mb-3">
                  Call{" "}
                  <code className="text-primary-400">track_costs.init()</code>{" "}
                  before creating any LLM instances:
                </p>
                <CodeBlock
                  code={`# Correct: Initialize before importing LLM
from agentcost import track_costs
track_costs.init(api_key="sk_...")

from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4")

# Wrong: LLM created before initialization
from langchain_openai import ChatOpenAI
llm = ChatOpenAI(model="gpt-4")

from agentcost import track_costs
track_costs.init(api_key="sk_...")  # Too late!`}
                />
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">
                  2. Use Agent Context Managers
                </h4>
                <p className="text-neutral-400 text-sm mb-3">
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
                <h4 className="text-white font-medium mb-2">
                  3. Environment Variables
                </h4>
                <p className="text-neutral-400 text-sm mb-3">
                  Store sensitive configuration in environment variables:
                </p>
                <CodeBlock
                  code={`import os
from agentcost import track_costs

track_costs.init(
    api_key=os.environ["AGENTCOST_API_KEY"],
    base_url=os.environ.get("AGENTCOST_URL", "https://api.agentcost.tech"),
    debug=os.environ.get("DEBUG", "false").lower() == "true"
)`}
                />
              </div>

              <div>
                <h4 className="text-white font-medium mb-2">
                  4. Graceful Shutdown
                </h4>
                <p className="text-neutral-400 text-sm mb-3">
                  Always flush events before your application exits:
                </p>
                <CodeBlock
                  code={`import atexit
from agentcost import track_costs

track_costs.init(api_key="sk_...")

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
          <Section id="troubleshooting" title="Troubleshooting" icon={Terminal}>
            <div className="space-y-4">
              <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
                <h4 className="text-white font-medium mb-2">
                  Events not appearing in dashboard
                </h4>
                <ul className="list-disc list-inside text-neutral-400 text-sm space-y-1">
                  <li>
                    Ensure{" "}
                    <code className="text-primary-400">track_costs.init()</code>{" "}
                    is called before LLM usage
                  </li>
                  <li>Check your API key is correct</li>
                  <li>
                    Enable <code className="text-primary-400">debug=True</code>{" "}
                    to see error messages
                  </li>
                  <li>
                    Call{" "}
                    <code className="text-primary-400">
                      track_costs.flush()
                    </code>{" "}
                    to force send events
                  </li>
                </ul>
              </div>

              <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
                <h4 className="text-white font-medium mb-2">
                  Token counts seem wrong
                </h4>
                <ul className="list-disc list-inside text-neutral-400 text-sm space-y-1">
                  <li>The SDK uses tiktoken for accurate counting</li>
                  <li>
                    Make sure tiktoken is installed:{" "}
                    <code className="text-primary-400">
                      pip install tiktoken
                    </code>
                  </li>
                  <li>Some models may use different tokenizers</li>
                </ul>
              </div>

              <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
                <h4 className="text-white font-medium mb-2">
                  Connection errors
                </h4>
                <ul className="list-disc list-inside text-neutral-400 text-sm space-y-1">
                  <li>
                    Verify your{" "}
                    <code className="text-primary-400">base_url</code> is
                    correct
                  </li>
                  <li>Check that the backend is running and accessible</li>
                  <li>Look for firewall or proxy issues</li>
                </ul>
              </div>

              <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 p-4">
                <h4 className="text-white font-medium mb-2">Getting support</h4>
                <p className="text-neutral-400 text-sm">
                  If you&apos;re still having issues, check our{" "}
                  <a
                    href="https://github.com/agentcost/agentcost/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300"
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
          <div className="flex items-center justify-between">
            <a
              href="/settings"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Back to Settings
            </a>
            <a
              href="/docs/api"
              className="text-primary-400 hover:text-primary-300 transition-colors"
            >
              API Reference →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
