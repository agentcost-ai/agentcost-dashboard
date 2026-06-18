"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    Terminal,
    CheckCircle2,
    Copy,
    ChevronRight,
} from "lucide-react";

/* ─────────────────────────────────────────────
   CONSTANTS & DATA
   ───────────────────────────────────────────── */
const INSTALL_CMD = "pip install agentcost";

const SETUP_CODE = `from agentcost import track_costs
import openai

# Initialize with one line
track_costs.init(api_key="ac_kp...")

# Use your LLM as usual
client = openai.OpenAI()
response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Analyze this..."}]
)`;

/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */


export function CommandCenterDemo() {
    const [copied, setCopied] = useState(false);

    const copyCode = () => {
        navigator.clipboard.writeText(SETUP_CODE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* ─── Window Frame ─── */}
            <div className="relative bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/5">

                {/* Window Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/2">
                    {/* Traffic Lights */}
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                    </div>

                    {/* Title */}
                    <div className="flex items-center gap-2 text-xs font-medium text-neutral-300">
                        <Terminal className="size-3.5" />
                        Quick Start
                    </div>

                    {/* Right spacer for centering */}
                    <div className="w-16" />
                </div>

                {/* ─── Content Area ─── */}
                <div className="relative min-h-105 bg-[#0a0a0b]">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className="p-6 md:p-8 font-mono text-sm"
                    >
                        <div className="space-y-6">
                            {/* Step 1: Install */}
                            <div>
                                <div className="flex items-center gap-2 text-neutral-500 mb-2">
                                    <ChevronRight className="size-4" />
                                    <span>1. Install</span>
                                </div>
                                <div className="flex items-center justify-between bg-black/40 border border-white/5 p-4 rounded-lg">
                                    <code className="text-sky-300">
                                        <span className="text-neutral-600 mr-1">$</span> {INSTALL_CMD}
                                    </code>
                                    <CheckCircle2 className="size-4 text-emerald-500/60" />
                                </div>
                            </div>

                            {/* Step 2: Code */}
                            <div>
                                <div className="flex items-center justify-between text-neutral-500 mb-2">
                                    <div className="flex items-center gap-2">
                                        <ChevronRight className="size-4" />
                                        <span>2. Add two lines to your code</span>
                                    </div>
                                    <button
                                        onClick={copyCode}
                                        className="flex items-center gap-1 text-xs hover:text-white transition-colors"
                                    >
                                        {copied ? <CheckCircle2 className="size-3" /> : <Copy className="size-3" />}
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                                <div className="relative bg-[#1e1e1e] border border-white/5 rounded-lg overflow-hidden">
                                    <pre className="text-neutral-300 leading-7 text-[13px]">
                                        <code>
                                            <div className="border-l-2 border-emerald-400/40 pl-3 ml-1 py-0.5">
                                                <span className="text-purple-400">from</span> <span className="text-sky-300">agentcost</span> <span className="text-purple-400">import</span> <span className="text-sky-300">track_costs</span>
                                            </div>
                                            <div className="px-4 py-0.5">
                                                <span className="text-purple-400">import</span> openai
                                            </div>
                                            <div className="px-4 py-0.5">
                                                <span className="text-neutral-600">&nbsp;</span>
                                            </div>
                                            <div className="px-4 py-0.5">
                                                <span className="text-neutral-500"># Initialize</span>
                                            </div>
                                            <div className="border-l-2 border-emerald-400/40 pl-3 ml-1 py-0.5">
                                                <span className="text-yellow-300">track_costs</span>.<span className="text-blue-300">init</span>(api_key=<span className="text-green-400">&quot;ac_kp...&quot;</span>)
                                            </div>
                                            <div className="px-4 py-0.5">
                                                <span className="text-neutral-600">&nbsp;</span>
                                            </div>
                                            <div className="px-4 py-0.5">
                                                <span className="text-neutral-500"># Use your LLM as usual — calls are tracked automatically</span>
                                            </div>
                                            <div className="px-4 py-0.5">
                                                client = openai.<span className="text-blue-300">OpenAI</span>()
                                            </div>
                                            <div className="px-4 py-0.5">
                                                response = client.chat.completions.<span className="text-blue-300">create</span>(
                                            </div>
                                            <div className="px-4 py-0.5">
                                                {"    "}model=<span className="text-green-400">&quot;gpt-4o&quot;</span>,
                                            </div>
                                            <div className="px-4 py-0.5">
                                                {"    "}messages=[...]
                                            </div>
                                            <div className="px-4 py-0.5">
                                                )
                                            </div>
                                        </code>
                                    </pre>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

            </div>

            {/* Decorative Glow */}
            <div className="absolute -inset-10 bg-linear-to-r from-sky-600/20 via-blue-600/20 to-cyan-600/15 blur-3xl opacity-30 -z-10 rounded-full" />
        </div>
    );
}
