"use client";

import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

/**
 * Docs Layout - Full screen documentation without sidebar
 * This overrides the parent layout for /docs/* pages
 */
export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="docs-layout fixed inset-0 z-50 bg-neutral-900 overflow-auto">
      {/* Top navigation bar */}
      <nav className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur border-b border-neutral-800 px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Settings</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
          >
            <Home size={16} />
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>
      {/* Content */}
      <div className="pb-12">{children}</div>
    </div>
  );
}
