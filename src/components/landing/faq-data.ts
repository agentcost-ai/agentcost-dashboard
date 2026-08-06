// Shared between FAQSection (interactive accordion) and app/page.tsx
// (FAQPage JSON-LD) — keep questions/answers in one place so the structured
// data can never drift from the visible copy.
export const faqs = [
    {
        category: "Getting Started",
        questions: [
            {
                q: "How long does it take to set up AgentCost?",
                a: "Under two minutes. Create a free account (a project with an API key is set up for you), install the Python SDK with pip, and add two lines to your application (import + init) — the free hosted cloud does the rest. Prefer to run everything yourself? The same MIT-licensed stack starts with Docker. Either way, your existing LangChain code works completely unchanged — no refactoring needed.",
            },
            {
                q: "Do I need to modify my existing LangChain code?",
                a: "No. AgentCost uses monkey-patching to transparently intercept LLM calls. You add two lines at the top of your application — an import and an init call — and every LLM invocation is automatically tracked. Your agents, chains, and prompts stay exactly as they are.",
            },
            {
                q: "What LLM providers and models are supported?",
                a: "AgentCost supports pricing for 3,500+ models across 50+ providers including OpenAI (GPT-4, GPT-4o, o1), Anthropic (Claude 3/4), Google (Gemini), Mistral, DeepSeek, Groq, Cohere, Together AI, AWS Bedrock, Azure OpenAI, and many more. Pricing data is synced from LiteLLM's continuously updated database.",
            },
        ],
    },
    {
        category: "Technical",
        questions: [
            {
                q: "What overhead does the SDK add to my LLM calls?",
                a: "Near-zero. The SDK uses async batching to accumulate events and send them in bulk, so delivery never blocks your LLM calls. Token counting is done locally using tiktoken, and cost calculation is a simple lookup — neither blocks your application.",
            },
            {
                q: "Is AgentCost hosted or self-hosted? Where does my data go?",
                a: "Both — you choose. By default you use the free hosted cloud: sign up, and your usage events are stored securely at api.agentcost.tech; you can delete your data or your account at any time. Because the whole stack is MIT-licensed, you can instead self-host the FastAPI backend and PostgreSQL database on your own infrastructure with Docker — in that mode, nothing leaves your environment and there is no telemetry or phone-home behavior.",
            },
            {
                q: "How are costs calculated?",
                a: "Costs are calculated in real-time using the formula: (input_tokens × input_price) + (output_tokens × output_price). Token counts come from tiktoken (OpenAI's tokenizer), and pricing data for 3,500+ models is maintained via LiteLLM's pricing database which you can sync at any time.",
            },
            {
                q: "Can I track costs per agent in a multi-agent system?",
                a: "Yes. Use the context manager with track_costs.agent('agent-name') to attribute all LLM calls within that block to a specific agent. The dashboard then shows per-agent breakdowns, comparisons, and optimization suggestions.",
            },
        ],
    },
    {
        category: "Pricing & License",
        questions: [
            {
                q: "Is AgentCost free?",
                a: "Yes. The hosted cloud — what you get when you sign up — is free, with no usage limits, tiers, or premium features hidden behind a paywall. The code is also fully open-source under the MIT License, so you can use it commercially, modify it, and deploy it on your own infrastructure at no cost.",
            },
            {
                q: "How does AgentCost compare to Helicone, Langfuse, or LiteLLM?",
                a: "Helicone and Langfuse are hosted platforms with free tiers and paid plans — Helicone from $79/month, Langfuse from $29/month — and Langfuse covers evaluations and prompt management as well as tracing. LiteLLM is a gateway that routes traffic rather than a cost tracker, and AgentCost actually sources its model pricing from LiteLLM's database. AgentCost is free at any scale — a free hosted cloud plus MIT-licensed code you can self-host — and focused only on attributing spend to the agent that caused it. There are detailed side-by-side comparisons at agentcost.tech/compare.",
            },
            {
                q: "What's the tech stack?",
                a: "Backend: Python with FastAPI, async SQLAlchemy, and PostgreSQL. Frontend: Next.js with React, Tailwind CSS, Recharts, and Framer Motion. SDK: Python package using tiktoken for token counting and httpx for async HTTP. Everything is containerized with Docker.",
            },
        ],
    },
];
