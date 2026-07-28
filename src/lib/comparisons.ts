/**
 * Data for the /compare/* pages.
 *
 * RULE: every competitor claim here was read off that company's own public
 * pricing page on `verifiedOn` and is linked via `sourceUrl`. Never add a
 * competitor claim from memory — re-read their page and update `verifiedOn`.
 * Getting a rival's pricing wrong in public is both a credibility and a legal
 * problem, and these pages are the first thing their team will read.
 */

export type ComparisonRow = {
  feature: string;
  agentcost: string;
  competitor: string;
};

export type Comparison = {
  slug: string;
  competitor: string;
  title: string;
  description: string;
  /** One-liner describing what the competitor actually is, neutrally. */
  whatTheyAre: string;
  /** Short price summary used in contextual links (e.g. on /pricing). */
  priceHeadline: string;
  intro: string[];
  rows: ComparisonRow[];
  chooseThem: string[];
  chooseUs: string[];
  faqs: { q: string; a: string }[];
  sourceUrl: string;
  verifiedOn: string;
};

const VERIFIED = "2026-07-28";

export const comparisons: Comparison[] = [
  {
    slug: "helicone",
    competitor: "Helicone",
    title: "AgentCost vs Helicone",
    description:
      "An honest comparison of AgentCost and Helicone for LLM cost tracking — pricing, self-hosting, integration method, and which one fits your team.",
    whatTheyAre:
      "Helicone is an LLM observability and monitoring platform, offered as a hosted service with a free tier and paid plans.",
    priceHeadline: "Free tier, then $79/mo (Pro) and $799/mo (Team)",
    intro: [
      "Both AgentCost and Helicone answer the same underlying question: where is your LLM spend actually going? They differ mainly in how you integrate them and what you pay.",
      "Helicone is a hosted product with a generous free tier and paid plans that scale with usage. AgentCost is MIT-licensed, free at every level, and designed to run on your own infrastructure — you install a Python SDK and host the backend yourself.",
    ],
    rows: [
      {
        feature: "Price",
        agentcost: "Free — no tiers, no seat limits",
        competitor: "Hobby free; Pro $79/mo; Team $799/mo; Enterprise on request",
      },
      {
        feature: "Free tier limits",
        agentcost: "None — unlimited events, history, and users",
        competitor: "10,000 requests, 1 GB storage, 1 seat, 1 organization",
      },
      {
        feature: "License",
        agentcost: "MIT",
        competitor: "Describes itself as open source; license not stated on the pricing page",
      },
      {
        feature: "Self-hosting",
        agentcost: "The default — Docker, your infrastructure",
        competitor: "On-prem deployment listed under the Enterprise tier",
      },
      {
        feature: "Integration",
        agentcost: "Two lines of Python; no proxy, no base-URL change",
        competitor: "Typically routed through Helicone's gateway or SDK",
      },
      {
        feature: "Providers auto-instrumented",
        agentcost: "OpenAI, Anthropic, Gemini, LangChain",
        competitor: "Broad provider coverage via the gateway",
      },
      {
        feature: "Model pricing database",
        agentcost: "3,500+ models, synced from LiteLLM",
        competitor: "Maintained by Helicone",
      },
      {
        feature: "Maturity",
        agentcost: "Alpha — young project, small team",
        competitor: "Established product with SOC-2 and HIPAA on higher tiers",
      },
    ],
    chooseThem: [
      "You want a managed service with no infrastructure to run, and someone to call when it breaks.",
      "You need SOC-2 or HIPAA compliance, which Helicone offers on its Team tier.",
      "Your team is happy routing traffic through a hosted gateway.",
      "You want a product with a longer track record than AgentCost currently has.",
    ],
    chooseUs: [
      "You don't want request volume to determine your bill — AgentCost is free at any scale.",
      "Your data cannot leave your infrastructure. AgentCost self-hosts by default, with no telemetry.",
      "You'd rather not put a proxy in the path of every LLM call. AgentCost instruments the client libraries in-process instead.",
      "You want per-agent attribution in a multi-agent system as a first-class feature.",
    ],
    faqs: [
      {
        q: "Is AgentCost a drop-in replacement for Helicone?",
        a: "Not exactly. Helicone commonly sits in the request path as a gateway, while AgentCost instruments the provider SDKs in-process. If you rely on gateway-level features such as caching or request routing, AgentCost does not replace those.",
      },
      {
        q: "Is AgentCost really free, or is there a paid tier later?",
        a: "It is MIT-licensed and free, with no tiers, seat limits, or paywalled features. You self-host it, so your only cost is the infrastructure you already run.",
      },
      {
        q: "Can I run both?",
        a: "Yes. They instrument at different layers, so running AgentCost alongside a gateway is possible, though you would be recording the same calls twice.",
      },
    ],
    sourceUrl: "https://www.helicone.ai/pricing",
    verifiedOn: VERIFIED,
  },
  {
    slug: "langfuse",
    competitor: "Langfuse",
    title: "AgentCost vs Langfuse",
    description:
      "An honest comparison of AgentCost and Langfuse — pricing, self-hosting, tracing depth, and which tool fits your LLM cost tracking needs.",
    whatTheyAre:
      "Langfuse is an open-source LLM engineering platform covering tracing, evaluation, and prompt management, available both self-hosted and as a paid cloud service.",
    priceHeadline: "Free tier, then $29/mo (Core) up to $2,499/mo (Enterprise)",
    intro: [
      "Langfuse is the broader product. It covers tracing, evaluations, prompt management, and datasets — cost tracking is one part of a larger LLM engineering platform.",
      "AgentCost is deliberately narrower: it answers which agent spent what, across which models, and what to do about it. If you want a full evaluation and prompt-management stack, Langfuse does considerably more. If you want cost attribution without adopting a platform, AgentCost is smaller.",
    ],
    rows: [
      {
        feature: "Price (cloud)",
        agentcost: "No cloud tier — self-hosted and free",
        competitor: "Hobby free; Core $29/mo; Pro $199/mo; Enterprise $2,499/mo",
      },
      {
        feature: "Free tier limits",
        agentcost: "None — unlimited events and users",
        competitor: "50k units/month, 30 days data access, 2 users",
      },
      {
        feature: "Usage overage",
        agentcost: "Not applicable",
        competitor: "$8 per 100k units, decreasing at higher volume",
      },
      {
        feature: "Self-hosting",
        agentcost: "The default — Docker, your infrastructure",
        competitor: "Yes, free and open source, via Docker Compose or Kubernetes",
      },
      {
        feature: "Scope",
        agentcost: "Cost tracking and optimization",
        competitor: "Tracing, evaluations, prompt management, datasets",
      },
      {
        feature: "Integration",
        agentcost: "Two lines of Python, auto-instrumented",
        competitor: "SDK instrumentation, decorators, or OpenTelemetry",
      },
      {
        feature: "Model pricing database",
        agentcost: "3,500+ models, synced from LiteLLM",
        competitor: "Maintained by Langfuse",
      },
      {
        feature: "Maturity",
        agentcost: "Alpha — young project, small team",
        competitor: "Widely adopted, large community",
      },
    ],
    chooseThem: [
      "You need evaluations, prompt management, or dataset tooling as well as cost data.",
      "You want deep, span-level tracing of complex chains, not just cost attribution.",
      "You'd prefer a managed cloud option with a support relationship.",
      "You want a mature project with a large community behind it.",
    ],
    chooseUs: [
      "Cost is the actual problem you're solving, and you don't want to adopt a whole platform to solve it.",
      "You want setup measured in minutes: pip install, two lines, done.",
      "You want unlimited retention and users without a monthly bill.",
      "You want per-agent cost attribution and optimization suggestions specifically.",
    ],
    faqs: [
      {
        q: "Langfuse is also open source and self-hostable — what's different?",
        a: "Scope and setup cost. Langfuse is a full LLM engineering platform; AgentCost does cost observability only, with a two-line integration. If you need evaluations and prompt management, Langfuse is the better fit.",
      },
      {
        q: "Does AgentCost do tracing?",
        a: "It records every LLM call with model, tokens, cost, latency, and the agent responsible. It does not offer span-level tracing of arbitrary application logic the way a full tracing platform does.",
      },
      {
        q: "Can I use both together?",
        a: "Yes. They instrument independently, so you can run Langfuse for tracing and evaluation while AgentCost handles cost attribution.",
      },
    ],
    sourceUrl: "https://langfuse.com/pricing",
    verifiedOn: VERIFIED,
  },
  {
    slug: "litellm",
    competitor: "LiteLLM",
    title: "AgentCost vs LiteLLM",
    description:
      "AgentCost and LiteLLM solve different problems — one tracks LLM cost, the other routes LLM traffic. Here's how they compare and how they work together.",
    whatTheyAre:
      "LiteLLM is an open-source AI gateway and LLM proxy that gives you one interface across many providers, with routing, budgets, and rate limits.",
    priceHeadline: "Free Forever tier, Enterprise at custom pricing",
    intro: [
      "These two are often compared but they sit at different layers, and the honest answer is that they complement each other more than they compete.",
      "LiteLLM is a gateway: it normalizes 140+ providers behind one interface and handles routing, virtual keys, and rate limits. AgentCost is cost observability: it attributes spend to the agent that caused it. AgentCost's own pricing database is in fact synced from LiteLLM's — that's where the 3,500+ model prices come from.",
    ],
    rows: [
      {
        feature: "Primary purpose",
        agentcost: "Cost attribution and optimization",
        competitor: "Gateway and proxy — routing, keys, rate limits",
      },
      {
        feature: "Price",
        agentcost: "Free, MIT",
        competitor: "Free Forever tier; Enterprise at custom pricing",
      },
      {
        feature: "License",
        agentcost: "MIT",
        competitor: "MIT for the open-source gateway",
      },
      {
        feature: "Sits in the request path",
        agentcost: "No — instruments the SDK in-process",
        competitor: "Yes — traffic is routed through the proxy",
      },
      {
        feature: "Per-agent attribution",
        agentcost: "First-class, via a context manager",
        competitor: "Virtual keys, budgets, and teams",
      },
      {
        feature: "Provider coverage",
        agentcost: "OpenAI, Anthropic, Gemini, LangChain auto-instrumented",
        competitor: "140+ provider integrations",
      },
      {
        feature: "Enterprise extras",
        agentcost: "None — everything is included",
        competitor: "SSO, RBAC, audit logs, JWT auth, support SLAs",
      },
    ],
    chooseThem: [
      "You need one interface across many model providers.",
      "You want routing, load balancing, or failover between models.",
      "You want to enforce budgets and rate limits at the gateway before a call is ever made.",
      "You need virtual API keys per team or customer.",
    ],
    chooseUs: [
      "You already know which providers you're calling and just need to know what they cost you.",
      "You don't want a proxy hop added to every request.",
      "You want spend attributed per agent in a multi-agent system.",
      "You want cost dashboards and optimization suggestions rather than traffic control.",
    ],
    faqs: [
      {
        q: "Should I pick AgentCost or LiteLLM?",
        a: "Usually neither instead of the other. LiteLLM controls how calls are routed; AgentCost reports what those calls cost and which agent caused them. Many teams run a gateway and a cost tracker together.",
      },
      {
        q: "Does AgentCost work if my calls already go through LiteLLM?",
        a: "AgentCost instruments the OpenAI, Anthropic, Gemini, and LangChain client libraries in your process. If your application calls those SDKs, tracking works regardless of where the request is ultimately routed.",
      },
      {
        q: "Is AgentCost built on LiteLLM?",
        a: "No, but it uses LiteLLM's continuously updated model pricing database as the source for its 3,500+ model prices, which is why cost calculations stay current.",
      },
    ],
    sourceUrl: "https://www.litellm.ai/",
    verifiedOn: VERIFIED,
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return comparisons.find((c) => c.slug === slug);
}
