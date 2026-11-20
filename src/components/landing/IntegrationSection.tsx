"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Copy, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";

/* ─────────────────────────────────────────────
   Integration — pick a language and a framework,
   get the exact code. AgentCost's own lines are
   marked; everything else is the code you
   already have.
   ───────────────────────────────────────────── */

type Line = { t: string; add?: boolean };

interface Lang {
  id: "python" | "typescript";
  label: string;
  file: string;
  install: string;
  guide: string;
  head: Line[];
  frameworks: Array<{ id: string; label: string; lines: Line[] }>;
}

const LANGS: Lang[] = [
  {
    id: "python",
    label: "Python",
    file: "agent.py",
    install: "pip install agentcost",
    guide: "/docs/sdk",
    head: [
      { t: "from agentcost import track_costs", add: true },
      { t: 'track_costs.init(api_key="sk_...", project_id="your-project-uuid")', add: true },
    ],
    frameworks: [
      {
        id: "openai",
        label: "OpenAI",
        lines: [
          { t: "from openai import OpenAI" },
          { t: "client = OpenAI()" },
          { t: 'client.chat.completions.create(model="gpt-4o", messages=messages)' },
        ],
      },
      {
        id: "anthropic",
        label: "Anthropic",
        lines: [
          { t: "from anthropic import Anthropic" },
          { t: "client = Anthropic()" },
          { t: 'client.messages.create(model="claude-sonnet-4-5", max_tokens=1024, messages=messages)' },
        ],
      },
      {
        id: "gemini",
        label: "Gemini",
        lines: [
          { t: "from google import genai" },
          { t: "client = genai.Client()" },
          { t: 'client.models.generate_content(model="gemini-2.5-flash", contents=prompt)' },
        ],
      },
      {
        id: "langchain",
        label: "LangChain",
        lines: [
          { t: "from langchain_openai import ChatOpenAI" },
          { t: 'llm = ChatOpenAI(model="gpt-4o")' },
          { t: "llm.invoke(prompt)" },
        ],
      },
    ],
  },
  {
    id: "typescript",
    label: "TypeScript",
    file: "agent.ts",
    install: "npm install @agentcost/sdk",
    guide: "/docs/typescript",
    head: [
      { t: 'import * as agentcost from "@agentcost/sdk";', add: true },
      { t: 'agentcost.init({ apiKey: "sk_...", projectId: "your-project-uuid" });', add: true },
    ],
    frameworks: [
      {
        id: "openai",
        label: "OpenAI",
        lines: [
          { t: 'import OpenAI from "openai";' },
          { t: "const client = agentcost.instrumentOpenAI(new OpenAI());", add: true },
          { t: 'await client.chat.completions.create({ model: "gpt-4o", messages });' },
        ],
      },
      {
        id: "anthropic",
        label: "Anthropic",
        lines: [
          { t: 'import Anthropic from "@anthropic-ai/sdk";' },
          { t: "const client = agentcost.instrumentAnthropic(new Anthropic());", add: true },
          { t: 'await client.messages.create({ model: "claude-sonnet-4-5", max_tokens: 1024, messages });' },
        ],
      },
      {
        id: "gemini",
        label: "Google Gen AI",
        lines: [
          { t: 'import { GoogleGenAI } from "@google/genai";' },
          { t: "const ai = agentcost.instrumentGoogleGenAI(new GoogleGenAI({ apiKey }));", add: true },
          { t: 'await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });' },
        ],
      },
      {
        id: "langchain",
        label: "LangChain.js",
        lines: [
          { t: 'import { ChatOpenAI } from "@langchain/openai";' },
          { t: 'const llm = new ChatOpenAI({ model: "gpt-4o", callbacks: [agentcost.agentcostCallbacks()] });', add: true },
          { t: "await llm.invoke(prompt);" },
        ],
      },
      {
        id: "vercel",
        label: "Vercel AI SDK",
        lines: [
          { t: 'import { generateText, wrapLanguageModel } from "ai";' },
          { t: 'import { openai } from "@ai-sdk/openai";' },
          { t: 'const model = wrapLanguageModel({ model: openai("gpt-4o"), middleware: agentcost.agentcostMiddleware() });', add: true },
          { t: "await generateText({ model, prompt });" },
        ],
      },
    ],
  },
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
      },
      () => undefined,
    );
  };
  return { copied, copy };
}

function CopyLabel({ done }: { done: boolean }) {
  return done ? (
    <>
      <Check className="size-3.5 text-emerald-400" aria-hidden />
      <span className="text-emerald-400">Copied</span>
    </>
  ) : (
    <>
      <Copy className="size-3.5" aria-hidden />
      Copy
    </>
  );
}

export function IntegrationSection() {
  const reduced = useReducedMotion();
  const [langId, setLangId] = useState<Lang["id"]>("python");
  const [fwByLang, setFwByLang] = useState<Record<Lang["id"], string>>({ python: "openai", typescript: "openai" });
  const { copied, copy } = useCopy();

  const lang = LANGS.find((l) => l.id === langId) ?? LANGS[0];
  const fw = lang.frameworks.find((f) => f.id === fwByLang[langId]) ?? lang.frameworks[0];
  const lines: Line[] = [...lang.head, { t: "" }, ...fw.lines];
  const added = lines.filter((l) => l.add).length;
  const code = lines.map((l) => l.t).join("\n");

  return (
    <section id="integration" className="relative py-16 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          {/* Left — the pitch */}
          <div className="min-w-0 lg:pt-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">Integration</p>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
              Your stack,
              <br />
              <span className="text-neutral-500">a few lines.</span>
            </h2>
            <p className="mt-5 max-w-md text-[16px] leading-7 text-neutral-400">
              No proxy in front of your provider and no base-URL change. Pick your language and
              framework: the highlighted lines are all you add.
            </p>

            <dl className="mt-8 grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/8 bg-white/8 text-center">
              {[
                ["2", "SDKs"],
                ["5", "frameworks"],
                ["0", "prompts sent"],
              ].map(([n, label]) => (
                <div key={label} className="bg-[#0a0a0b] px-3 py-4">
                  <dt className="sr-only">{label}</dt>
                  <dd className="text-2xl font-semibold tabular-nums text-white">{n}</dd>
                  <dd className="mt-0.5 text-[12px] text-neutral-500">{label}</dd>
                </div>
              ))}
            </dl>

            <p className="mt-8 max-w-md border-l border-white/10 pl-4 text-[14px] leading-6 text-neutral-400">
              Using Claude Code, Codex or Antigravity? No code at all:{" "}
              <code className="font-mono text-[12.5px] text-neutral-200">agentcost connect claude-code</code>{" "}
              tracks every session and can block what your guardrails forbid.{" "}
              <Link href="/docs/coding-agents" className="whitespace-nowrap text-sky-400 hover:text-sky-300">
                Coding agents →
              </Link>
            </p>
          </div>

          {/* Right — the picker and the code */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div role="tablist" aria-label="Language" className="inline-flex rounded-lg border border-white/8 bg-white/[0.03] p-1">
                {LANGS.map((l) => (
                  <button
                    key={l.id}
                    role="tab"
                    type="button"
                    aria-selected={l.id === langId}
                    onClick={() => setLangId(l.id)}
                    className={cn(
                      "rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                      l.id === langId ? "bg-white text-neutral-950" : "text-neutral-400 hover:text-white",
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  copy("install", lang.install);
                  track("sdk_install_started", { location: "landing", language: lang.id });
                }}
                className="group inline-flex items-center gap-2.5 rounded-lg border border-white/8 bg-black/40 py-1.5 pl-3 pr-2 font-mono text-[12.5px] text-neutral-300 transition-colors hover:border-white/16"
                aria-label={`Copy: ${lang.install}`}
              >
                <span className="text-neutral-600">$</span>
                {lang.install}
                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-sans text-[11px] text-neutral-500 group-hover:text-neutral-300">
                  <CopyLabel done={copied === "install"} />
                </span>
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Framework">
              {lang.frameworks.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  type="button"
                  aria-selected={f.id === fw.id}
                  onClick={() => setFwByLang((m) => ({ ...m, [langId]: f.id }))}
                  className={cn(
                    "rounded-full border px-3 py-1 text-[12px] transition-colors",
                    f.id === fw.id
                      ? "border-sky-400/40 bg-sky-400/10 text-sky-200"
                      : "border-white/8 text-neutral-400 hover:border-white/16 hover:text-neutral-200",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0e] shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/6 bg-white/[0.02] px-4 py-2.5">
                <div className="flex items-center gap-3 text-[12px]">
                  <span className="font-mono text-neutral-300">{lang.file}</span>
                  <span className="tabular-nums text-emerald-400/80">+{added} lines</span>
                </div>
                <button
                  type="button"
                  onClick={() => copy("code", code)}
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
                >
                  <CopyLabel done={copied === "code"} />
                </button>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`${langId}-${fw.id}`}
                  initial={reduced ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -4 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-x-auto py-4 font-mono text-[12.5px] leading-7"
                >
                  {lines.map((l, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex w-fit min-w-full whitespace-pre pr-5",
                        l.add ? "bg-emerald-400/[0.06] text-emerald-100" : "text-neutral-400",
                      )}
                    >
                      <span className="w-10 shrink-0 select-none pr-3 text-right text-[11px] tabular-nums text-neutral-700">
                        {i + 1}
                      </span>
                      <span className={cn("w-4 shrink-0 select-none", l.add ? "text-emerald-400" : "text-transparent")}>
                        +
                      </span>
                      {l.t || " "}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            <Link
              href={lang.guide}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-neutral-400 transition-colors hover:text-white"
            >
              Full {lang.label} guide: agents, workflows, streaming
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
