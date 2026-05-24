import type { Metadata } from "next";
import Link from "next/link";
import { blogPosts } from "@/lib/content";

export const metadata: Metadata = {
  title: "AgentCost Blog",
  description:
    "Product updates, engineering writeups, and practical guides for LLM cost optimization.",
  alternates: { canonical: "https://agentcost.tech/blog" },
};

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <p className="text-sm uppercase tracking-widest text-sky-400 mb-4">Blog</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Insights for building cost-efficient AI products
        </h1>
        <p className="text-neutral-400 text-lg max-w-3xl mb-12">
          Practical updates from the AgentCost team across product, engineering, and LLM economics.
        </p>

        <div className="space-y-6">
          {blogPosts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-white/10 bg-white/2 p-6 hover:border-white/20 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-3">
                <span className="rounded-full border border-white/15 px-2.5 py-1">{post.category}</span>
                <span>{post.publishedAt}</span>
                <span>{post.readTime}</span>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">{post.title}</h2>
              <p className="text-neutral-400 mb-5">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-sky-300 hover:text-sky-200 font-medium"
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
