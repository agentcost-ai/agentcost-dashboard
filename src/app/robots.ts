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
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
