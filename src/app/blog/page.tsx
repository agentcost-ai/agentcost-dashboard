import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { blogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "AgentCost Blog",
  description:
    "Product updates, engineering writeups, and practical guides for LLM cost optimization.",
  alternates: { canonical: "https://agentcost.tech/blog" },
};

export default function BlogPage() {
  const [featured, ...rest] = blogPosts;

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-20">
        {/* Back to home */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm text-neutral-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to home
        </Link>

        <p className="mb-4 text-sm uppercase tracking-widest text-sky-400">Blog</p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Insights for building cost-efficient AI products
        </h1>
        <p className="mb-12 max-w-3xl text-lg text-neutral-400">
          Practical updates from the AgentCost team across product, engineering, and LLM economics.
        </p>

        {/* Featured (latest) post */}
        {featured && (
          <Link
            href={`/blog/${featured.slug}`}
            className="group mb-6 block overflow-hidden rounded-2xl border border-white/10 bg-white/2 p-8 transition-colors hover:border-sky-500/30"
          >
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
              <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 font-medium text-sky-300">
                Latest
              </span>
              <span className="rounded-full border border-white/15 px-2.5 py-1 text-neutral-400">
                {featured.category}
              </span>
              <span className="text-neutral-400">{featured.publishedAt}</span>
              <span className="text-neutral-400">{featured.readTime}</span>
            </div>
            <h2 className="mb-2 text-3xl font-semibold tracking-tight text-white">
              {featured.title}
            </h2>
            <p className="mb-5 max-w-3xl text-neutral-400">{featured.excerpt}</p>
            <span className="inline-flex items-center gap-1.5 font-medium text-sky-300 group-hover:text-sky-200">
              Read article
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        )}

        {/* Remaining posts */}
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/2 p-6 transition-colors hover:border-white/20"
            >
              <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                <span className="rounded-full border border-white/15 px-2.5 py-1">{post.category}</span>
                <span>{post.publishedAt}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">{post.title}</h2>
              <p className="mb-5 flex-1 text-sm text-neutral-400">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="font-medium text-sky-300 hover:text-sky-200"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
