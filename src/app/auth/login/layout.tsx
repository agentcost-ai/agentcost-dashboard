import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in to AgentCost to see what every agent, model and run in your project costs. Email, Google or GitHub.",
  alternates: { canonical: "/auth/login" },
  robots: { index: true, follow: true },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
