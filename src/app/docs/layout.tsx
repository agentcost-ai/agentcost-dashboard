"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Compass, Braces, Grid2x2Plus } from "lucide-react";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { DocsShell } from "@/components/docs/DocsShell";

const TABS = [
  { label: "Documentation", href: "/docs", icon: BookOpen, match: (p: string) => p === "/docs" || (p.startsWith("/docs/") && !["/docs/api", "/docs/sdk"].includes(p)) },
  { label: "Guides", href: "/docs/sdk", icon: Compass, match: (p: string) => p === "/docs/sdk" },
  { label: "API Reference", href: "/docs/api", icon: Braces, match: (p: string) => p === "/docs/api" },
];

/**
 * Documentation layout: reference-site shell (tab bar, sidebar panel,
 * on-this-page navigation, pager) around every /docs/* page.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0a0a0b]/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[90rem] items-center gap-6 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold text-white">
            <Grid2x2Plus size={20} className="text-sky-400" aria-hidden />
            AgentCost
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Documentation sections">
            {TABS.map(({ label, href, icon: Icon, match }) => {
              const active = match(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-[14px] transition-colors",
                    active ? "font-medium text-white" : "text-neutral-400 hover:text-white",
                  )}
                >
                  <Icon size={16} strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3 text-[14px]">
            <Link
              href="/auth/login"
              className="rounded-md border border-white/10 px-3 py-1.5 text-neutral-200 transition-colors hover:border-white/25 hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              onClick={() => track("click_signup", { location: "docs" })}
              className="px-1 font-medium text-white transition-colors hover:text-neutral-300"
            >
              Get Started
            </Link>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto px-4 pb-2.5 text-[14px] md:hidden" aria-label="Documentation sections">
          {TABS.map(({ label, href, match }) => (
            <Link
              key={href}
              href={href}
              className={cn("shrink-0", match(pathname) ? "font-medium text-white" : "text-neutral-400")}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="py-4">
        <DocsShell>{children}</DocsShell>
      </div>
    </div>
  );
}
