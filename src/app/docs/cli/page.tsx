import type { Metadata } from "next";
import CliDocsContent from "./content";

export const metadata: Metadata = {
  title: "CLI Reference — agentcost analyze",
  description:
    "Estimate what an LLM agent will cost before deploying it. Full reference for agentcost analyze: flags, findings, exit codes, and CI usage. Runs entirely offline — it reads your prompt and skill files and transmits nothing.",
  alternates: { canonical: "https://agentcost.tech/docs/cli" },
  openGraph: {
    title: "CLI Reference — agentcost analyze",
    description:
      "Price your prompt files, project a test run to production volume, and fail CI on a cost regression. Runs locally, transmits nothing.",
    url: "https://agentcost.tech/docs/cli",
    type: "article",
  },
};

export default function CliDocsPage() {
  return <CliDocsContent />;
}
