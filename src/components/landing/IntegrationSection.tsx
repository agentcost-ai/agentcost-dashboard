"use client";

import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

const codeLines = [
    { text: "from agentcost import track_costs", highlight: true },
    { text: "" },
    { text: "# Initialize tracking — that's it", dim: true },
    {
        text: 'track_costs.init(api_key="ac_...", project_id="my-app")',
        highlight: true,
    },
    { text: "" },
    { text: "# Your existing code works unchanged", dim: true },
    { text: "from langchain_openai import ChatOpenAI" },
    { text: "" },
    { text: 'llm = ChatOpenAI(model="gpt-4o")' },
    { text: 'response = llm.invoke("Analyze this data...")' },
    { text: "# ↑ Automatically tracked: tokens, cost, latency", dim: true },
];

export function IntegrationSection() {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const code = codeLines
            .filter((l) => !l.dim)
            .map((l) => l.text)
            .filter(Boolean)
            .join("\n");
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section id="integration" className="relative py-28">
            <div className="mx-auto max-w-7xl px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left — Copy */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <p className="text-sm font-medium text-emerald-400 uppercase tracking-widest mb-4">
                            Integration
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
                            Two lines.{" "}
                            <span className="text-neutral-500">That&apos;s it.</span>
                        </h2>
                        <p className="text-neutral-400 text-lg leading-relaxed mb-8 max-w-md">
                            No wrappers, no decorators, no middleware. AgentCost uses
                            lightweight interception to instrument OpenAI, Anthropic,
                            and LangChain calls transparently. Your code stays clean.
                        </p>

                        <div className="space-y-5">
                            {[
                                {
                                    step: "01",
                                    title: "Install the SDK",
                                    desc: "pip install agentcost",
                                },
                                {
                                    step: "02",
                                    title: "Add two lines",
                                    desc: "import + init — done",
                                },
                                {
                                    step: "03",
                                    title: "See your costs",
                                    desc: "Open the dashboard at localhost:3000",
                                },
                            ].map((s) => (
                                <div
                                    key={s.step}
                                    className="flex items-start gap-4 group"
                                >
                                    <span className="shrink-0 w-8 h-8 rounded-lg bg-white/4 border border-white/8 flex items-center justify-center text-xs font-mono text-neutral-500 group-hover:text-sky-400 group-hover:border-sky-400/20 transition-colors">
                                        {s.step}
                                    </span>
                                    <div>
                                        <p className="text-sm font-medium text-white">{s.title}</p>
                                        <p className="text-sm text-neutral-500 font-mono">
                                            {s.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right — Code block */}
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.97 }}
                        whileInView={{ opacity: 1, y: 0, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="relative rounded-2xl border border-white/8 bg-[#0c0c0e] overflow-hidden shadow-2xl shadow-black/40">
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/6 bg-white/2">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <span className="w-3 h-3 rounded-full bg-red-500/70" />
                                        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                                        <span className="w-3 h-3 rounded-full bg-green-500/70" />
                                    </div>
                                    <span className="ml-3 text-xs text-neutral-500 font-mono">
                                        my_agent.py
                                    </span>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-neutral-500 hover:text-neutral-300 hover:bg-white/5 transition-all"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="size-3.5 text-emerald-400" />
                                            <span className="text-emerald-400">Copied</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="size-3.5" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Code */}
                            <div className="p-5 font-mono text-[13px] leading-7 overflow-x-auto">
                                {codeLines.map((line, i) => (
                                    <div
                                        key={i}
                                        className={`${line.highlight
                                                ? "text-sky-300 bg-sky-400/5 -mx-5 px-5 border-l-2 border-sky-400/40"
                                                : line.dim
                                                    ? "text-neutral-600"
                                                    : "text-neutral-300"
                                            }`}
                                    >
                                        {line.text || "\u00A0"}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
