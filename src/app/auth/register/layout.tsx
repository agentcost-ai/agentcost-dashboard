import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a Free Account",
  description:
    "Create a free AgentCost account: a project and API key are set up for you, then two lines of Python or TypeScript start tracking LLM cost per agent.",
  alternates: { canonical: "/auth/register" },
  robots: { index: true, follow: true },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
