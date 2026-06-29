import type { MetadataRoute } from "next";
import { blogPosts, changelogEntries } from "@/lib/content";

const BASE_URL = "https://agentcost.tech";

// Freshest content date across blog posts + changelog (ISO strings sort
// lexically), used as lastmod for evergreen pages so it advances whenever
// meaningful content ships — no hard-coded date to forget to bump.
const LATEST_CONTENT_DATE =
  [...blogPosts.map((p) => p.publishedAt), ...changelogEntries.map((c) => c.date)]
    .sort()
    .at(-1) ?? "2026-06-28";

/**
 * Served at /sitemap.xml. Enumerates every public, indexable route plus all
 * blog posts (pulled from content.ts, so new posts appear automatically).
 * Auth-gated app pages are intentionally excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastmod = LATEST_CONTENT_DATE;

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: lastmod, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE_URL}/docs/sdk`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/docs/api`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/docs/models`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/blog`, lastModified: lastmod, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/changelog`, lastModified: lastmod, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/demo`, lastModified: lastmod, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/terms`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, lastModified: lastmod, changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...blogRoutes];
}
