import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/content";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    return { title: "Article Not Found" };
  }

  return {
    title: `${post.title} | AgentCost Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `https://agentcost.tech/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);

  if (!post) {
    notFound();
  }

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    articleSection: post.category,
    author: { "@type": "Organization", name: "AgentCost" },
    publisher: {
      "@type": "Organization",
      name: "AgentCost",
      logo: { "@type": "ImageObject", url: "https://agentcost.tech/icon.svg" },
    },
    mainEntityOfPage: `https://agentcost.tech/blog/${post.slug}`,
  };

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-20">
        <Link href="/blog" className="text-sm text-sky-300 hover:text-sky-200">
          ← Back to blog
        </Link>

        <header className="mt-6 mb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-4">
            <span className="rounded-full border border-white/15 px-2.5 py-1">{post.category}</span>
            <span>{post.publishedAt}</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">{post.title}</h1>
          <p className="text-lg text-neutral-400">{post.excerpt}</p>
        </header>

        <div className="space-y-5 text-neutral-300 leading-8">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </main>
  );
}
