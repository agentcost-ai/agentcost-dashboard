import type { Metadata } from "next";
import ModelCatalogContent from "./content";
import { getCatalog } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Model Catalog — Supported LLMs & Live Pricing",
  description:
    "Browse and search every model AgentCost supports, with live per-token pricing across OpenAI, Anthropic, Google, and more.",
  alternates: { canonical: "https://agentcost.tech/docs/models" },
};

// Rebuild at most once a day: the catalog is fetched on the SERVER so every
// model name and price lands in the crawlable HTML. Previously this page
// fetched client-side, so search engines indexed an empty shell.
// Literal, not the shared CATALOG_REVALIDATE_SECONDS: Next requires segment
// config exports to be statically analysable. Keep the two in step.
export const revalidate = 86400;

export default async function ModelCatalogPage() {
  const { models, syncStatus } = await getCatalog();

  return (
    <ModelCatalogContent
      initialModels={models}
      initialSyncStatus={syncStatus}
    />
  );
}
