import { PageHeader, Section, SubSection, CodeBlock, Callout } from "@/components/docs/primitives";

export default function TypeScriptDocsContent() {
  return (
    <>
      <PageHeader eyebrow="TypeScript SDK" title={<>TypeScript / JavaScript SDK</>}>
        <p>
          Track OpenAI, Anthropic, Google Gen AI, LangChain.js and Vercel AI SDK
          calls from Node.js, attributed to the agent, job and step that made
          them.
        </p>
      </PageHeader>

      <Section id="installation" title="Installation">
        <CodeBlock code="npm install @agentcost/sdk" language="bash" />
        <p>
          Node.js 18 or later. ESM and CommonJS, with types. No runtime
          dependencies: provider SDKs are optional peer dependencies. Server-side
          only; never ship your AgentCost API key to a browser.
        </p>
      </Section>

      <Section id="quick-start" title="Quick start">
        <p>Initialise once, then wrap each client you want tracked:</p>
        <CodeBlock
          language="typescript"
          code={`import OpenAI from "openai";
import * as agentcost from "@agentcost/sdk";

// Reads AGENTCOST_API_KEY and AGENTCOST_PROJECT_ID from the environment.
agentcost.init();

const client = agentcost.instrumentOpenAI(new OpenAI());

await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});`}
        />
        <p>
          Your calls, responses and errors are unchanged. Events are sent in the
          background in batches. Short-lived scripts and serverless functions
          should flush before they exit:
        </p>
        <CodeBlock
          language="typescript"
          code={`await agentcost.flush();     // or: ctx.waitUntil(agentcost.flush())
await agentcost.shutdown();  // flush and stop, at process end`}
        />
      </Section>

      <Section id="integrations" title="Integrations">
        <SubSection id="openai" title="OpenAI">
          <CodeBlock
            language="typescript"
            code={`const client = agentcost.instrumentOpenAI(new OpenAI());
// also AzureOpenAI, and any OpenAI-compatible base URL:
const viaGateway = agentcost.instrumentOpenAI(new OpenAI({ baseURL: "https://your-gateway.example/v1", apiKey }));`}
          />
          <p>
            Tracks <code>chat.completions</code>, <code>responses</code>, legacy{" "}
            <code>completions</code> and <code>embeddings</code>: awaited,
            streamed, <code>withResponse()</code>, and the helpers built on them
            (<code>parse()</code>, <code>stream()</code>, <code>runTools()</code>).
            Streamed chat calls get <code>stream_options.include_usage</code> so
            usage is reported; if an endpoint refuses it, the call is resent once
            exactly as written. Tested with <code>openai</code> 4, 5, 6 and 7.
          </p>
        </SubSection>

        <SubSection id="anthropic" title="Anthropic">
          <CodeBlock
            language="typescript"
            code={`import Anthropic from "@anthropic-ai/sdk";
const anthropic = agentcost.instrumentAnthropic(new Anthropic());`}
          />
          <p>
            Tracks <code>messages.create</code> and <code>beta.messages.create</code>,
            streamed or not, and <code>messages.stream()</code>. Cache reads are
            counted as cached input; cache writes are priced at the cache-write
            rate.
          </p>
        </SubSection>

        <SubSection id="google" title="Google Gen AI (Gemini)">
          <CodeBlock
            language="typescript"
            code={`import { GoogleGenAI } from "@google/genai";
const ai = agentcost.instrumentGoogleGenAI(new GoogleGenAI({ apiKey }));`}
          />
          <p>
            Tracks <code>models.generateContent</code>,{" "}
            <code>models.generateContentStream</code> and chats. Thinking tokens
            are counted as output, as Gemini bills them.
          </p>
        </SubSection>

        <SubSection id="langchain" title="LangChain.js / LangGraph">
          <CodeBlock
            language="typescript"
            code={`import { ChatOpenAI } from "@langchain/openai";
const model = new ChatOpenAI({ model: "gpt-4o", callbacks: [agentcost.agentcostCallbacks()] });`}
          />
          <p>
            Works with any LangChain chat model. Do not also instrument the
            provider client LangChain uses internally, or calls are counted twice.
          </p>
        </SubSection>

        <SubSection id="vercel-ai" title="Vercel AI SDK">
          <CodeBlock
            language="typescript"
            code={`import { wrapLanguageModel, generateText } from "ai";
import { openai } from "@ai-sdk/openai";

const model = wrapLanguageModel({ model: openai("gpt-4o"), middleware: agentcost.agentcostMiddleware() });
await generateText({ model, prompt: "Hello!" });`}
          />
          <p>
            Works with any AI SDK provider; each model request is one event.
            Embedding models use <code>agentcostEmbeddingMiddleware()</code> with{" "}
            <code>wrapEmbeddingModel</code> (AI SDK 6+).
          </p>
        </SubSection>
      </Section>

      <Section id="attribution" title="Agents, jobs and steps">
        <CodeBlock
          language="typescript"
          code={`await agentcost.agent("researcher", () =>
  agentcost.workflow("nightly-report", async (traceId) => {  // one run = one trace
    await agentcost.step("draft", () => client.chat.completions.create({ ... }));
    await agentcost.tool("web_search", () => search(query));
    agentcost.outcome(true, "published");
  }),
);

await agentcost.metadata({ customer_id: "c_42" }, () => client.chat.completions.create({ ... }));`}
        />
        <p>
          Each function takes a callback and returns its result. Context follows
          async calls, so concurrent requests never share attribution, and a
          stream is attributed to where it was created. These map to the same
          fields as the Python SDK: <code>agent_name</code>, <code>workflow</code>,{" "}
          <code>trace_id</code>, <code>step_name</code>, <code>tool_name</code>.
        </p>
      </Section>

      <Section id="gateways" title="Gateways and proxies">
        <p>
          A client pointed at an OpenAI-compatible gateway, proxy or
          self-hosted endpoint is tracked like any other. Each event also
          records, in <code>metadata</code>:
        </p>
        <ul>
          <li>
            <code>gateway_host</code>: the base URL&apos;s host (never the path),
            when it is not the provider&apos;s own
          </li>
          <li>
            <code>response_model</code>: the model the endpoint said it served.
            The requested <code>model</code> stays the priced field.
          </li>
          <li>
            <code>response_id</code>: the endpoint&apos;s id for the call, to match
            it against the gateway&apos;s own console
          </li>
        </ul>
        <p>
          AgentCost prices each call from its own model catalogue and the token
          counts the endpoint reports, so a gateway that bills with its own rates
          will show a different total.
        </p>
      </Section>

      <Section id="event-fields" title="What is recorded">
        <p>
          Per call: the requested model, input, output, cached and cache-write
          tokens, latency, success, the attribution above, and an{" "}
          <code>event_id</code> so a resent batch is never counted twice. In{" "}
          <code>metadata</code>:
        </p>
        <ul>
          <li>
            <code>usage_source</code>: <code>response</code> (counts from the
            endpoint), <code>missing</code> (none arrived; the zeros are
            placeholders, not zero usage) or <code>estimated</code> (LangChain&apos;s
            own estimate)
          </li>
          <li>
            <code>_ac_caps</code>: what the call needed (vision, tools,
            structured output), as booleans and counts only
          </li>
          <li>your own <code>metadata()</code> and <code>globalMetadata</code> keys</li>
        </ul>
        <Callout title="Never sent">
          <p>
            Prompts, completions, tool definitions or arguments, images, API keys,
            or error message text. Failed calls carry only the error class, HTTP
            status and error code.
          </p>
        </Callout>
      </Section>

      <Section id="configuration" title="Configuration">
        <CodeBlock
          language="typescript"
          code={`agentcost.init({
  apiKey,              // default: AGENTCOST_API_KEY
  projectId,           // default: AGENTCOST_PROJECT_ID (the project UUID)
  baseUrl,             // default: AGENTCOST_API_URL or https://api.agentcost.tech
  enabled: true,       // false: keep the instrumentation, record nothing
  batchSize: 10,       // max 100
  flushIntervalMs: 5000,
  defaultAgentName: "default",
  globalMetadata: { env: "prod" },
  localMode: false,    // keep events in memory (getLocalEvents()), send nothing
  onError: (msg) => console.warn(msg), // delivery problems; never contains content
});`}
        />
        <p>
          Network errors, timeouts, 429 and 5xx responses keep the batch and
          retry it with the same event ids. Other 4xx responses (a wrong key or
          project) drop it with a warning. Tracking never throws into your code.
        </p>
      </Section>

      <Section id="limitations" title="Not tracked">
        <ul>
          <li>OpenAI images, audio, moderation, realtime and the Assistants API.</li>
          <li>Google Gen AI embeddings, image and video generation, and the Live API.</li>
          <li>
            <code>asResponse()</code> returns the raw HTTP response, so its usage
            cannot be read; the call is recorded with{" "}
            <code>usage_source: &quot;missing&quot;</code>.
          </li>
          <li>
            Bun, Deno and edge runtimes are not tested yet; the package needs{" "}
            <code>node:async_hooks</code>.
          </li>
        </ul>
        <p>
          Source, changelog and issues:{" "}
          <a href="https://github.com/agentcost-ai/agentcost-js" target="_blank" rel="noopener noreferrer">
            github.com/agentcost-ai/agentcost-js
          </a>
          . Package:{" "}
          <a href="https://www.npmjs.com/package/@agentcost/sdk" target="_blank" rel="noopener noreferrer">
            npmjs.com/package/@agentcost/sdk
          </a>
          .
        </p>
      </Section>
    </>
  );
}
