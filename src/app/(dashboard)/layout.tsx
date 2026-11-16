import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/DashboardShell";

/**
 * Server wrapper so every app route carries metadata. The shell is a client
 * component and cannot export any, so before this each route here was served
 * with the homepage's title and, for any route missing from the X-Robots-Tag
 * list in next.config.ts (/guardrails, /workflows), no noindex at all: a
 * crawlable duplicate of the homepage. Setting robots here covers every route
 * added to this group later, with nothing to keep in step.
 */
export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | AgentCost" },
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
