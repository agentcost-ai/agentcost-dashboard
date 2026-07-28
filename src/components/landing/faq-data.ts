// Shared between FAQSection (interactive accordion) and app/page.tsx
// (FAQPage JSON-LD) — keep questions/answers in one place so the structured
// data can never drift from the visible copy.
export const faqs = [
    {
        category: "Getting Started",
        questions: [
            {
                q: "How long does it take to set up AgentCost?",
                a: "Under two minutes. Install the Python SDK with pip, add two lines to your application (import + init), and start the backend with Docker. Your existing LangChain code works completely unchanged — no refactoring needed.",
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
                a: "Near-zero. The SDK uses async batching to accumulate events and send them in bulk, so individual LLM calls see less than 1ms of additional latency. Token counting is done locally using tiktoken, and cost calculation is a simple lookup — neither blocks your application.",
            },
            {
                q: "Is AgentCost self-hosted? Where does my data go?",
                a: "Fully self-hosted. You deploy the FastAPI backend and PostgreSQL database on your own infrastructure using Docker. No data is sent to any external service — everything stays within your environment. There is no telemetry or phone-home behavior.",
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
                a: "Yes. AgentCost is fully open-source under the MIT License. You can use it commercially, modify it, and deploy it on your own infrastructure at no cost. There are no usage limits, tiers, or premium features hidden behind a paywall.",
            },
            {
                q: "What's the tech stack?",
                a: "Backend: Python with FastAPI, async SQLAlchemy, and PostgreSQL. Frontend: Next.js with React, Tailwind CSS, Recharts, and Framer Motion. SDK: Python package using tiktoken for token counting and httpx for async HTTP. Everything is containerized with Docker.",
            },
        ],
    },
];
