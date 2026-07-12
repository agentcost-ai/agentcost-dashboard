import type { Metadata } from "next";
import DemoRedirect from "./content";

export const metadata: Metadata = {
  title: "Live Demo — Explore the Dashboard, No Signup",
  description:
    "Try AgentCost instantly in your browser — a live demo of the LLM cost dashboard with sample data. No signup or API key required.",
  alternates: { canonical: "https://agentcost.tech/demo" },
};

export default function DemoPage() {
  return <DemoRedirect />;
}
