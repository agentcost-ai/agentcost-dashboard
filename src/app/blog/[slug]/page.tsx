import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts } from "@/lib/content";
import { SITE_URL } from "@/lib/site";
import { LOGO, ORGANIZATION_ID, breadcrumbList, jsonLd } from "@/lib/structured-data";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

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
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `${SITE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      type: "article",
      url: `${SITE_URL}/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      section: post.category,
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

  const url = `${SITE_URL}/blog/${post.slug}`;
  // Author and publisher point at the site-wide Organization node (same @id,
  // rendered by the root layout) instead of restating a detached copy of it.
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: [`${SITE_URL}/opengraph-image`],
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    articleSection: post.category,
    inLanguage: "en",
    author: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "AgentCost", url: SITE_URL },
    publisher: { "@type": "Organization", "@id": ORGANIZATION_ID, name: "AgentCost", logo: LOGO },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
  const crumbs = breadcrumbList([
    { name: "AgentCost", path: "/" },
    { name: "Blog", path: "/blog" },
    { name: post.title, path: `/blog/${post.slug}` },
  ]);
  const related = blogPosts.filter((item) => item.slug !== post.slug).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(articleLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
      <Navbar />
      <article className="mx-auto max-w-3xl px-4 pt-32 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <Link href="/blog" className="text-sm text-sky-300 hover:text-sky-200">
          ← Back to blog
        </Link>

        <header className="mt-6 mb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-400 mb-4">
            <span className="rounded-full border border-white/15 px-2.5 py-1">{post.category}</span>
            <span>{post.publishedAt}</span>
            <span>{post.readTime}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-4 sm:text-4xl">{post.title}</h1>
          <p className="text-lg text-neutral-400">{post.excerpt}</p>
        </header>

        <div className="space-y-5 text-neutral-300 leading-7 sm:leading-8 wrap-break-word">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {related.length > 0 && (
          <aside className="mt-16 border-t border-white/10 pt-10">
            <h2 className="mb-5 text-lg font-semibold text-white">More from the AgentCost blog</h2>
            <ul className="space-y-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`} className="text-sky-300 hover:text-sky-200">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </article>
      <Footer />
    </main>
  );
}
