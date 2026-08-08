import type { Metadata } from "next";
import PrivacyArchitectureContent from "./content";

export const metadata: Metadata = {
  title: "Data & Privacy Architecture — What AgentCost Collects",
  description:
    "Exactly what the AgentCost SDK transmits and what never leaves your process. Metadata-only by design: token counts, cost, and latency — never prompts, completions, system instructions, or files. Includes local mode, self-hosting, retention, and how to verify it in source.",
  alternates: { canonical: "https://agentcost.tech/docs/privacy" },
  openGraph: {
    title: "Data & Privacy Architecture — AgentCost",
    description:
      "Metadata-only LLM cost tracking. See the complete event schema, what is never collected, and how to verify both in open source.",
    url: "https://agentcost.tech/docs/privacy",
    type: "article",
  },
};

export default function PrivacyArchitecturePage() {
  return <PrivacyArchitectureContent />;
}
