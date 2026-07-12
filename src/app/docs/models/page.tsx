import type { Metadata } from "next";
import ModelCatalogContent from "./content";

export const metadata: Metadata = {
  title: "Model Catalog — Supported LLMs & Live Pricing",
  description:
    "Browse and search every model AgentCost supports, with live per-token pricing across OpenAI, Anthropic, Google, and more.",
  alternates: { canonical: "https://agentcost.tech/docs/models" },
};

export default function ModelCatalogPage() {
  return <ModelCatalogContent />;
}
