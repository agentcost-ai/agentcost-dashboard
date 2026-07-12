import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // External links (incl. PyPI) point at /docs, which has no page of its own.
      { source: "/docs", destination: "/docs/sdk", permanent: true },
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
    ];
  },
};

export default nextConfig;
