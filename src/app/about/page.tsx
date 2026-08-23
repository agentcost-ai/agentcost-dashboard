import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CTASection } from "@/components/landing/CTASection";
import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import {
  ORGANIZATION_ID,
  breadcrumbList,
  jsonLd,
} from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "About AgentCost — Open-Source LLM Cost Observability",
  description:
    "AgentCost is an open-source LLM cost observability platform: a Python SDK, a FastAPI backend and a dashboard that attribute every model call to the agent that made it. Free hosted or self-hosted, MIT licensed.",
  alternates: { canonical: `${SITE_URL}/about` },
};

const WHAT_WE_BUILD = [
  {
    name: "The Python SDK",
    href: "/docs/sdk",
    body: "Published on PyPI as agentcost. Two lines of integration — an import and an init — and every OpenAI, Anthropic, Gemini and LangChain call is tracked. The SDK intercepts calls by patching the provider client, so existing code is not refactored. Token counting is local (tiktoken) and delivery is batched and asynchronous, so nothing sits in the path of your LLM call.",
  },
  {
    name: "The backend",
    href: "/docs/api",
    body: "A FastAPI service that ingests those events, prices them against a catalogue of 3,500+ models synced from LiteLLM, and exposes analytics over HTTP. Its full OpenAPI specification is published, and the model catalogue is readable by anyone with no credentials at all.",
  },
  {
    name: "The dashboard",
    href: "/pricing",
    body: "Spend broken down by agent, workflow, project and model. Budget guardrails with threshold alerts and an optional hard cap that rejects ingestion once a monthly budget is reached. Optimization recommendations derived from your own traffic, with effectiveness tracked after you apply them. Executive reports exportable as PDF or CSV over any date range.",
  },
  {
    name: "The CLI",
    href: "/docs/cli",
    body: "agentcost analyze reads a codebase, finds the LLM call sites, estimates the token load per run and reports cost risk — oversized prompts, repeated work, unbounded loops — before any of it reaches production.",
  },
];

export default function AboutPage() {
  const aboutLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About AgentCost",
    url: `${SITE_URL}/about`,
    description: metadata.description,
    mainEntity: { "@id": ORGANIZATION_ID },
  };

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(aboutLd)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbList([
            { name: "AgentCost", path: "/" },
            { name: "About", path: "/about" },
          ]),
        )}
      />
      <Navbar />

      <article className="mx-auto max-w-4xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
          About
        </p>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
          AgentCost
        </h1>
        <p className="mt-6 text-base leading-relaxed text-neutral-400 sm:text-lg">
          AgentCost is an LLM cost observability platform. It records every model
          call an application makes and attributes the cost to the agent,
          workflow and project responsible — so a team running multi-agent
          systems can see which part of the system is expensive, not just what
          the monthly provider invoice totals.
        </p>

        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-neutral-300">
          <p>
            Provider dashboards answer &ldquo;what did we spend?&rdquo;. They
            cannot answer &ldquo;which agent spent it, on which step, and would a
            cheaper model have done the same job?&rdquo; — because by the time a
            call reaches OpenAI or Anthropic, every trace of which part of your
            system made it is gone. AgentCost keeps that context at the call site
            and carries it through to the bill.
          </p>
          <p>
            That is the whole product thesis, and it is why the unit of analysis
            here is the agent and the workflow rather than the API key.
          </p>
        </div>

        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight text-white">
          What we build
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {WHAT_WE_BUILD.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-white/2 p-6 transition-colors hover:border-white/20 hover:bg-white/4"
            >
              <h3 className="text-[15px] font-semibold text-white">{item.name}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-400">
                {item.body}
              </p>
            </Link>
          ))}
        </div>

        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight text-white">
          How it is licensed
        </h2>
        <div className="space-y-4 text-[15px] leading-relaxed text-neutral-300">
          <p>
            The stack is MIT licensed and the hosted cloud is free. There are no
            tiers, no seat limits, no usage caps, and no feature held back for a
            paid plan. If you would rather not send events anywhere, run the same
            code yourself: the FastAPI backend and PostgreSQL start with Docker,
            and in that mode nothing leaves your environment and the software
            does not phone home.
          </p>
          <p>
            We publish the comparison pages that say where a competitor is the
            better answer, with each vendor&rsquo;s pricing read off their own
            page on a stated date — see{" "}
            <Link
              href="/compare/helicone"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              AgentCost vs Helicone
            </Link>
            ,{" "}
            <Link
              href="/compare/langfuse"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              vs Langfuse
            </Link>{" "}
            and{" "}
            <Link
              href="/compare/litellm"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              vs LiteLLM
            </Link>
            .
          </p>
        </div>

        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight text-white">
          Who builds it
        </h2>
        <div className="space-y-4 text-[15px] leading-relaxed text-neutral-300">
          <p>
            AgentCost was founded and is maintained by Kushagra Agrawal.
            Development happens in the open: the source lives at{" "}
            <a
              href="https://github.com/agentcost-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              github.com/agentcost-ai
            </a>{" "}
            and the SDK is released to{" "}
            <a
              href="https://pypi.org/project/agentcost/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              PyPI
            </a>
            .
          </p>
          <p>
            Questions, bug reports and security issues all reach us at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
            . There is more detail on{" "}
            <Link
              href="/contact"
              className="text-neutral-100 underline underline-offset-4 hover:text-white"
            >
              the contact page
            </Link>
            .
          </p>
        </div>
      </article>

      <CTASection />
      <Footer />
    </main>
  );
}
