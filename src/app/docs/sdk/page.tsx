import type { Metadata } from "next";
import SdkDocsContent from "./content";

export const metadata: Metadata = {
  title: "SDK Documentation — Python Setup & Quick Start",
  description:
    "Complete guide to integrating AgentCost into your OpenAI, Anthropic, Gemini, and LangChain applications — installation, quick start, configuration, and supported models.",
  alternates: { canonical: "https://agentcost.tech/docs/sdk" },
};

export default function SdkDocsPage() {
  return <SdkDocsContent />;
}
