"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, ArrowRight } from "lucide-react";
import Link from "next/link";

const faqs = [
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
                a: "AgentCost supports pricing for 2,900+ models across 30+ providers including OpenAI (GPT-4, GPT-4o, o1), Anthropic (Claude 3/4), Google (Gemini), Mistral, DeepSeek, Groq, Cohere, Together AI, AWS Bedrock, Azure OpenAI, and many more. Pricing data is synced from LiteLLM's continuously updated database.",
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
                a: "Costs are calculated in real-time using the formula: (input_tokens × input_price) + (output_tokens × output_price). Token counts come from tiktoken (OpenAI's tokenizer), and pricing data for 2,900+ models is maintained via LiteLLM's pricing database which you can sync at any time.",
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

function FAQItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-white/4 last:border-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-6 py-5 text-left group"
            >
                <span
                    className={`text-[15px] transition-colors duration-200 ${open ? "text-white" : "text-neutral-300 group-hover:text-white"
                        }`}
                >
                    {q}
                </span>
                <span className="shrink-0">
                    {open ? (
                        <Minus className="size-4 text-neutral-500" />
                    ) : (
                        <Plus className="size-4 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                    )}
                </span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="text-[14px] text-neutral-500 leading-relaxed pb-5 pr-10">
                            {a}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export function FAQSection() {
    return (
      <section id="faq" className="relative py-32 border-t border-white/3">
        <div className="mx-auto max-w-3xl px-6">
          {/* Centered header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-16"
          >
            <p className="text-xs font-mono text-sky-400/80 uppercase tracking-[0.2em] mb-5">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Frequently asked questions
            </h2>
          </motion.div>

          {/* Categorized accordions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-10"
          >
            {faqs.map((group) => (
              <div key={group.category}>
                <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest mb-4">
                  {group.category}
                </p>
                <div className="rounded-xl border border-white/6 bg-[#0b0b0d]/50 px-6">
                  {group.questions.map((faq) => (
                    <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                  ))}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Bottom help line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-12 text-center"
          >
            <p className="text-sm text-neutral-600">
              Have another question?{" "}
              <Link
                href="/docs/sdk"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Read the docs
              </Link>
              {" · "}
              <a
                href="https://github.com/agentcost-ai/agentcost-sdk/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white transition-colors"
              >
                Open a GitHub issue
                <ArrowRight className="inline size-3 ml-1" />
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    );
}
