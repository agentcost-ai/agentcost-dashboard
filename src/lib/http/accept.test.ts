import { describe, expect, it } from "vitest";

import { negotiate, parseAccept } from "./accept";

const SUPPORTED = ["text/html", "text/markdown"] as const;

describe("parseAccept", () => {
  it("returns nothing for a missing or empty header", () => {
    expect(parseAccept(null)).toEqual([]);
    expect(parseAccept(undefined)).toEqual([]);
    expect(parseAccept("")).toEqual([]);
  });

  it("defaults q to 1 and orders by q descending", () => {
    const ranges = parseAccept("text/html;q=0.5, text/markdown");
    expect(ranges.map((r) => `${r.type}/${r.subtype}`)).toEqual([
      "text/markdown",
      "text/html",
    ]);
    expect(ranges[0].q).toBe(1);
    expect(ranges[1].q).toBe(0.5);
  });

  it("orders more specific ranges first when q ties", () => {
    const ranges = parseAccept("*/*, text/*, text/markdown");
    expect(ranges.map((r) => r.specificity)).toEqual([2, 1, 0]);
  });

  it("ignores a malformed q rather than treating it as zero", () => {
    expect(parseAccept("text/markdown;q=banana")[0].q).toBe(1);
  });

  it("clamps q into range and skips entries with no subtype", () => {
    expect(parseAccept("text/markdown;q=9")[0].q).toBe(1);
    expect(parseAccept("text/markdown;q=-3")[0].q).toBe(0);
    expect(parseAccept("garbage, text/html")).toHaveLength(1);
  });

  it("is case-insensitive and tolerates whitespace", () => {
    const ranges = parseAccept("  TEXT/Markdown ; Q=0.9 ");
    expect(ranges[0]).toMatchObject({ type: "text", subtype: "markdown", q: 0.9 });
  });
});

describe("negotiate", () => {
  it("serves HTML when no Accept header is sent", () => {
    expect(negotiate(null, SUPPORTED)).toBe("text/html");
    expect(negotiate("", SUPPORTED)).toBe("text/html");
  });

  it("serves HTML for a wildcard, so crawlers and curl are unaffected", () => {
    expect(negotiate("*/*", SUPPORTED)).toBe("text/html");
  });

  it("serves HTML for a browser's Accept header", () => {
    const browser =
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
    expect(negotiate(browser, SUPPORTED)).toBe("text/html");
  });

  it("serves markdown when it is asked for exactly", () => {
    expect(negotiate("text/markdown", SUPPORTED)).toBe("text/markdown");
  });

  it("honours q-values over server preference", () => {
    expect(negotiate("text/html;q=0.2, text/markdown;q=0.9", SUPPORTED)).toBe(
      "text/markdown",
    );
    expect(negotiate("text/html;q=0.9, text/markdown;q=0.2", SUPPORTED)).toBe(
      "text/html",
    );
  });

  it("treats q=0 as an explicit refusal", () => {
    expect(negotiate("text/html;q=0, text/markdown", SUPPORTED)).toBe("text/markdown");
    expect(negotiate("text/html;q=0, */*;q=0", SUPPORTED)).toBeNull();
  });

  it("prefers the more specific range when quality ties", () => {
    // */* and text/markdown both q=1: the exact match wins, so an agent that
    // names markdown gets markdown even alongside a wildcard.
    expect(negotiate("*/*, text/markdown", SUPPORTED)).toBe("text/markdown");
  });

  it("matches a type wildcard", () => {
    expect(negotiate("text/*", SUPPORTED)).toBe("text/html");
  });

  it("returns null only when the header excludes every representation", () => {
    expect(negotiate("application/pdf", SUPPORTED)).toBeNull();
    expect(negotiate("image/png, application/zip", SUPPORTED)).toBeNull();
  });

  it("returns null when nothing is supported", () => {
    expect(negotiate("text/html", [])).toBeNull();
  });
});
