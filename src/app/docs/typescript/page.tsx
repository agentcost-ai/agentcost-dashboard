import type { Metadata } from "next";
import TypeScriptDocsContent from "./content";

export const metadata: Metadata = {
  title: "TypeScript SDK: Track LLM Cost in Node.js",
  description:
    "Install @agentcost/sdk and track OpenAI, Anthropic, Google Gen AI, LangChain.js and Vercel AI SDK calls per agent, job and step. ESM and CommonJS, Node.js 18+.",
  alternates: { canonical: "https://agentcost.tech/docs/typescript" },
};

export default function TypeScriptDocsPage() {
  return <TypeScriptDocsContent />;
}
