import { describe, expect, it } from "vitest";

import { config } from "@/proxy";

/**
 * Next compiles the matcher as an anchored regex over the pathname. Rebuild it
 * the same way so the exclusions are tested as written, not as remembered.
 */
const matcher = new RegExp(`^${config.matcher[0]}$`);
const proxied = (pathname: string) => matcher.test(pathname);

describe("proxy matcher", () => {
  it("never negotiates static images, so image-only Accept headers get the file", () => {
    for (const path of [
      "/hero/agents-1600.webp",
      "/logo.png",
      "/icon-192.png",
      "/apple-touch-icon.png",
      "/icon.svg",
      "/favicon.ico",
      "/opengraph-image",
      "/blog/some-post/opengraph-image",
      "/compare/helicone/opengraph-image",
      "/ai-agent-cost-calculator/opengraph-image",
    ]) {
      expect(proxied(path), path).toBe(false);
    }
  });

  it("still negotiates pages", () => {
    for (const path of ["/", "/docs", "/blog/some-post", "/compare/helicone", "/ai-agent-cost-calculator"]) {
      expect(proxied(path), path).toBe(true);
    }
  });

  it("still rate limits API paths, including model ids that contain dots", () => {
    for (const path of ["/api/v1/pricing", "/api/v1/pricing/gpt-4.1", "/api/mcp"]) {
      expect(proxied(path), path).toBe(true);
    }
  });
});
