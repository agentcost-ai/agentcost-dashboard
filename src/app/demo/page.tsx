import type { Metadata } from "next";
import DemoRedirect from "./content";

export const metadata: Metadata = {
  title: "Live Demo: A 60-Second Guided Tour, No Signup",
  description:
    "Take a 60-second guided tour of AgentCost in your browser, on sample data: find the agent behind a spike, what a run costs, and what to change. No signup or API key.",
  alternates: { canonical: "https://agentcost.tech/demo" },
};

export default function DemoPage() {
  return <DemoRedirect />;
}
