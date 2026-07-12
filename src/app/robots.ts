import type { MetadataRoute } from "next";

const BASE_URL = "https://agentcost.tech";

/**
 * Served at /robots.txt. Allows all crawlers across public marketing/content
 * pages; only the authenticated app surface and auth flows are disallowed
 * (they redirect to login and carry no indexable content).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/account", "/settings", "/auth/"],
      },
    ],
    // No `host` directive: it's non-standard — GSC flags it "Rule ignored by
    // Googlebot". Host canonicalization is handled by the Vercel www redirect.
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
