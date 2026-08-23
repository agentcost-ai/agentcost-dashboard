import { describe, expect, it } from "vitest";

import {
  agentPages,
  findAgentPage,
  llmsFullTxt,
  llmsTxt,
  normalizeRoute,
  notFoundMarkdown,
} from "./agent-content";
import { comparisons } from "./comparisons";
import { blogPosts } from "./content";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "./site";

const pages = agentPages();
const routes = new Set(pages.map((p) => p.route));

describe("the registry", () => {
  it("covers every URL in the sitemap", () => {
    const sitemapRoutes = sitemap().map((entry) =>
      normalizeRoute(entry.url.replace(SITE_URL, "")),
    );
    const missing = sitemapRoutes.filter((route) => !routes.has(route));
    expect(missing).toEqual([]);
  });

  it("has no duplicate routes", () => {
    expect(pages.length).toBe(routes.size);
  });

  it("renders every blog post and comparison from its data module", () => {
    for (const post of blogPosts) {
      const entry = findAgentPage(`/blog/${post.slug}`);
      expect(entry, post.slug).toBeDefined();
      // Rendered from content.ts, so the markdown cannot drift from the page.
      expect(entry?.markdown).toContain(post.content[0]);
    }
    for (const comparison of comparisons) {
      const entry = findAgentPage(`/compare/${comparison.slug}`);
      expect(entry, comparison.slug).toBeDefined();
      expect(entry?.markdown).toContain(comparison.whatTheyAre);
      expect(entry?.markdown).toContain(comparison.verifiedOn);
    }
  });

  it("gives every page an H1, a blockquote summary and a canonical link", () => {
    for (const entry of pages) {
      expect(entry.markdown.startsWith(`# ${entry.title}`), entry.route).toBe(true);
      expect(entry.markdown, entry.route).toContain(`> ${entry.description}`);
      expect(entry.markdown, entry.route).toContain(
        `Canonical HTML: ${SITE_URL}${entry.route}`,
      );
    }
  });

  it("normalises trailing slashes when looking a page up", () => {
    expect(normalizeRoute("/docs/")).toBe("/docs");
    expect(normalizeRoute("/")).toBe("/");
    expect(normalizeRoute("")).toBe("/");
    expect(findAgentPage("/docs/sdk/")?.route).toBe("/docs/sdk");
  });

  it("does not resolve an unknown path", () => {
    expect(findAgentPage("/nope")).toBeUndefined();
  });
});

describe("llms.txt", () => {
  const text = llmsTxt();

  it("follows the llmstxt.org shape: H1, then a blockquote summary", () => {
    const lines = text.split("\n");
    expect(lines[0]).toBe("# AgentCost");
    expect(lines[1]).toBe("");
    expect(lines[2].startsWith("> ")).toBe(true);
  });

  it("carries the when-to-use guidance an agent needs to decide relevance", () => {
    expect(text).toContain("## When to use AgentCost");
    // Named jobs paired with the endpoint to call, not marketing copy.
    expect(text).toContain("/api/v1/estimate");
    expect(text).toContain("/api/v1/pricing");
    // And says plainly what we are NOT for.
    expect(text).toMatch(/Do not reach for AgentCost/);
  });

  it("lists every registry page exactly once", () => {
    for (const entry of pages) {
      const url = `${SITE_URL}${entry.route === "/" ? "/" : entry.route}`;
      const occurrences = text.split(`](${url})`).length - 1;
      expect(occurrences, entry.route).toBe(1);
    }
  });

  it("only links to routes that exist", () => {
    const linked = [...text.matchAll(/\]\((https:\/\/agentcost\.tech[^)]*)\)/g)].map(
      (match) => match[1],
    );
    const known = new Set([
      ...[...routes].map((r) => `${SITE_URL}${r}`),
      `${SITE_URL}/openapi.json`,
      `${SITE_URL}/llms-full.txt`,
      `${SITE_URL}/sitemap.xml`,
    ]);
    const unknown = linked.filter((url) => !known.has(url));
    expect(unknown).toEqual([]);
  });

  it("points at the OpenAPI spec and the SDK package", () => {
    expect(text).toContain(`${SITE_URL}/openapi.json`);
    expect(text).toContain("https://pypi.org/project/agentcost/");
  });
});

describe("llms-full.txt", () => {
  it("includes every page's markdown", () => {
    const full = llmsFullTxt();
    for (const entry of pages) {
      expect(full, entry.route).toContain(`# ${entry.title}`);
    }
  });
});

describe("the 404 recovery block", () => {
  it("points at the sitemap, llms.txt, the docs index and the spec", () => {
    const text = notFoundMarkdown();
    expect(text.startsWith("# 404")).toBe(true);
    expect(text).toContain(`${SITE_URL}/sitemap.xml`);
    expect(text).toContain(`${SITE_URL}/llms.txt`);
    expect(text).toContain(`${SITE_URL}/docs`);
    expect(text).toContain(`${SITE_URL}/openapi.json`);
  });

  it("names the path that was missed, when one is given", () => {
    expect(notFoundMarkdown("/does-not-exist")).toContain("/does-not-exist");
  });
});
