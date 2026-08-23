import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // The OpenAPI spec is published at both paths agent tooling looks for.
      // Served from public/ rather than public/api/ so a static file can never
      // shadow (or be shadowed by) the /api route handlers.
      { source: "/api/openapi.yaml", destination: "/openapi.yaml" },
      { source: "/api/openapi.json", destination: "/openapi.json" },
    ];
  },
  async headers() {
    return [
      {
        // Auth-gated app routes render only a spinner for crawlers and would
        // otherwise be indexed with the homepage's title (they export no
        // metadata). /demo is a client-side redirect into robots-blocked
        // /dashboard. Served as a header (NOT robots.txt disallow) so Google
        // can actually see the noindex.
        source: "/(agents|events|models|reports|optimizations|feedback|demo)",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        // Every public page has two representations (HTML and Markdown, chosen
        // in proxy.ts), so a shared cache should key on Accept.
        //
        // Best-effort: under `next start` this lands on static files but NOT on
        // App Router page renders, because base-server.js setVaryHeader writes
        // the RSC Vary last and replaces the key. Vercel applies routing-layer
        // headers at a different point, so it may stick there -- re-check with
        // scripts/verify-agent-endpoints.mjs after a deploy. The markdown branch
        // is a rewrite either way, so the two variants never share a cache key.
        // Excluding /_next/ keeps build assets from being cache-fragmented.
        source: "/((?!_next/).*)",
        headers: [{ key: "Vary", value: "Accept" }],
      },
      {
        // The published spec is meant to be fetched cross-origin by agent
        // tooling, and re-fetched rarely.
        source: "/openapi.:ext(json|yaml)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
