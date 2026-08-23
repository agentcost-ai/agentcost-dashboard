import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { notFoundMarkdown } from "@/lib/agent-content";

/**
 * The 404 page.
 *
 * Two audiences. People get the links; agents get the same recovery block as
 * literal markdown, rendered into the page rather than hidden, because a probe
 * with a default Accept header still needs a body it can parse. Clients that
 * negotiate `Accept: text/markdown` get a real text/markdown 404 instead — see
 * middleware.ts and app/api/markdown.
 */

const RECOVERY_LINKS = [
  { href: "/docs", label: "Documentation", note: "SDK, REST API, CLI, model catalogue" },
  { href: "/docs/models", label: "Model catalogue", note: "Every supported model with live pricing" },
  { href: "/pricing", label: "Pricing", note: "Free — hosted or self-hosted" },
  { href: "/blog", label: "Blog", note: "Guides and product notes" },
  { href: "/about", label: "About", note: "What AgentCost is and who builds it" },
  { href: "/contact", label: "Contact", note: "How to reach us" },
];

const MACHINE_READABLE = [
  { href: "/sitemap.xml", label: "/sitemap.xml" },
  { href: "/llms.txt", label: "/llms.txt" },
  { href: "/openapi.json", label: "/openapi.json" },
  { href: "/api/v1/pricing", label: "/api/v1/pricing" },
];

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <Navbar />

      <section className="mx-auto max-w-4xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
          404
        </p>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
          That page does not exist
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
          The URL you asked for is not part of this site. Nothing is broken — here
          is everything that is.
        </p>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {RECOVERY_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-2xl border border-white/10 bg-white/2 p-5 transition-colors hover:border-white/20 hover:bg-white/4"
            >
              <span className="flex items-center gap-2 text-[15px] font-semibold text-white">
                {link.label}
                <ArrowRight className="h-3.5 w-3.5 text-neutral-600 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-400" />
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-neutral-500">
                {link.note}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/2 p-6">
          <h2 className="text-lg font-semibold text-white">For agents</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-neutral-400">
            The same recovery information as markdown. Every page on this site
            also answers to{" "}
            <code className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[12.5px] text-neutral-200">
              Accept: text/markdown
            </code>
            , including this one.
          </p>
          <pre className="mt-5 overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-5 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-neutral-300">
            {notFoundMarkdown()}
          </pre>
          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
            {MACHINE_READABLE.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="font-mono text-[12.5px] text-neutral-500 underline underline-offset-4 hover:text-neutral-300"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Footer />
    </main>
  );
}
