import type { MetadataRoute } from "next";

const BASE_URL = "https://agentcost.tech";

/**
 * Served at /robots.txt. Everything is crawlable on purpose.
 *
 * The app and auth pages used to be disallowed here, but a robots.txt block
 * stops Google from ever reading their noindex, so a linked-to /dashboard could
 * still be indexed as a bare URL ("Indexed, though blocked by robots.txt").
 * They are kept out of the index by `robots` metadata instead, set once in
 * app/(dashboard)/layout.tsx and app/auth/layout.tsx. Google: "For the noindex
 * rule to be effective, the page or resource must not be blocked by a
 * robots.txt file."
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /api stays crawlable too: /api/openapi.json and /api/v1 are published
        // for agent tooling, and JSON is not indexed as a page anyway.
        allow: "/",
      },
    ],
    // No `host` directive: it's non-standard — GSC flags it "Rule ignored by
    // Googlebot". Host canonicalization is handled by the Vercel www redirect.
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
