import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";

/**
 * Server wrapper so auth pages carry their own metadata (the shell is a client
 * component). Transactional pages -- password reset, email verification, the
 * OAuth callback -- are noindexed here; /auth/login and /auth/register opt back
 * in from their own layouts, because "agentcost login" is a real query and a
 * login sitelink is what a returning user wants.
 */
export const metadata: Metadata = {
  // An object, not a string: a plain string here would reset the root
  // "%s | AgentCost" template for login and register below.
  title: { default: "Account", template: "%s | AgentCost" },
  robots: { index: false, follow: true },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
