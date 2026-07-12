import type { Metadata } from "next";
import ApiDocsContent from "./content";

export const metadata: Metadata = {
  title: "REST API Reference — Endpoints & Authentication",
  description:
    "Complete REST API documentation for the AgentCost backend — authentication, projects, team management, events, and health endpoints.",
  alternates: { canonical: "https://agentcost.tech/docs/api" },
};

export default function ApiDocsPage() {
  return <ApiDocsContent />;
}
