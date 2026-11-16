import type { MetadataRoute } from "next";
import { blogPosts, changelogEntries } from "@/lib/content";
import { comparisons } from "@/lib/comparisons";

const BASE_URL = "https://agentcost.tech";

// Freshest content date across blog posts + changelog (ISO strings sort
// lexically). It is the true last change for /blog and /changelog only.
//
// Evergreen pages (home, docs, legal) carry NO lastmod. They used to share this
// date, which made every page claim to change whenever a post shipped. Google
// uses lastmod only "if it's consistently and verifiably accurate", so uniformly
// wrong dates teach it to ignore the field sitewide -- including the accurate
// dates on blog posts. Omitting it is allowed; a fake one is worse than none.
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
    { url: `${BASE_URL}/`, changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE_URL}/pricing`, changeFrequency: "monthly", priority: 0.9 },
    // Rates on this page refresh daily from the live catalogue (ISR).
    { url: `${BASE_URL}/ai-agent-cost-calculator`, lastModified: new Date().toISOString().slice(0, 10), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/docs`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/docs/sdk`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/docs/api`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/docs/models`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/docs/cli`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/docs/mcp`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/docs/coding-agents`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/docs/api-versioning`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/docs/privacy`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: lastmod, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/changelog`, lastModified: lastmod, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${BASE_URL}/contact`, changeFrequency: "yearly", priority: 0.6 },
    // /demo is intentionally absent: it's a client-side redirect into the
    // noindexed app (a "soft redirect") and is noindexed via header in
    // next.config.ts — a sitemap must never list noindexed URLs.
    { url: `${BASE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Comparison pages are added from lib/comparisons.ts, so a new competitor
  // page enters the sitemap automatically — no separate step to forget.
  const compareRoutes: MetadataRoute.Sitemap = comparisons.map((c) => ({
    url: `${BASE_URL}/compare/${c.slug}`,
    lastModified: c.verifiedOn,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes, ...compareRoutes];
}
