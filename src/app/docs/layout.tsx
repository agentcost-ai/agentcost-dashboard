"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { track } from "@/lib/analytics";

const DOCS_NAV = [
  { href: "/docs/sdk", label: "SDK" },
  { href: "/docs/api", label: "API" },
  { href: "/docs/models", label: "Models" },
];

/**
 * Docs Layout - Full screen documentation without sidebar
 * This overrides the parent layout for /docs/* pages.
 *
 * The nav links out to the public site (home/pricing/blog) and across sibling
 * docs pages — docs must never be a crawl dead-end (the old version linked
 * only to "/" and the robots-blocked "/settings").
 */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="docs-layout fixed inset-0 z-50 bg-neutral-900 overflow-auto">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <Home size={16} />
            <span>AgentCost</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-sm">
            {DOCS_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors ${
                  pathname === item.href
                    ? "text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <span className="h-4 w-px bg-neutral-800" aria-hidden />
            <Link
              href="/pricing"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              className="hidden sm:inline text-neutral-400 hover:text-white transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/auth/register"
              onClick={() => track("click_signup", { location: "docs" })}
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-neutral-900 hover:bg-neutral-200 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>
      {/* Content */}
      <div className="pb-12">{children}</div>
    </div>
  );
}
