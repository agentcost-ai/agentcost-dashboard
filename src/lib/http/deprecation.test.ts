import { describe, expect, it } from "vitest";

import {
  DEPRECATIONS,
  MINIMUM_NOTICE_DAYS,
  POLICY_URL,
  deprecationHeaders,
  findDeprecation,
  httpDate,
  structuredDate,
} from "./deprecation";

describe("the policy link", () => {
  it("is on every response, and does not assert that anything is deprecated", () => {
    const headers = deprecationHeaders("/api/v1/pricing");
    expect(headers.Link).toBe(
      `<${POLICY_URL}>; rel="deprecation"; type="text/html"`,
    );
    expect(headers).not.toHaveProperty("Deprecation");
    expect(headers).not.toHaveProperty("Sunset");
  });

  it("points at a page on our own domain", () => {
    expect(POLICY_URL.startsWith("https://agentcost.tech/")).toBe(true);
  });
});

describe("date formats", () => {
  it("renders Deprecation as a Structured Fields Date", () => {
    // "@" plus whole seconds since the epoch. Derived rather than hardcoded so
    // the test states the rule instead of a magic number.
    const seconds = Date.UTC(2026, 6, 1) / 1000;
    expect(structuredDate("2026-07-01T00:00:00Z")).toBe(`@${seconds}`);
    expect(structuredDate("2026-07-01T00:00:00Z")).toMatch(/^@\d+$/);
  });

  it("truncates sub-second precision rather than emitting a fraction", () => {
    expect(structuredDate("2026-07-01T00:00:00.900Z")).toBe(
      structuredDate("2026-07-01T00:00:00Z"),
    );
  });

  it("renders Sunset as an HTTP-date, per RFC 8594", () => {
    expect(httpDate("2026-07-01T00:00:00Z")).toBe("Wed, 01 Jul 2026 00:00:00 GMT");
  });
});

describe("a deprecated endpoint", () => {
  const entry = {
    path: "/v1/legacy",
    deprecatedOn: "2026-01-01T00:00:00Z",
    sunsetOn: "2026-07-01T00:00:00Z",
    replacement: "https://api.agentcost.tech/v2/legacy",
  };

  it("emits Deprecation, Sunset and a successor link", () => {
    DEPRECATIONS.push(entry);
    try {
      const headers = deprecationHeaders("/api/v1/legacy");
      expect(headers.Deprecation).toBe(structuredDate(entry.deprecatedOn));
      expect(headers.Sunset).toBe(httpDate(entry.sunsetOn));
      expect(headers.Link).toContain('rel="successor-version"');
      expect(headers.Link).toContain('rel="deprecation"');
    } finally {
      DEPRECATIONS.length = 0;
    }
  });

  it("matches the mirror path against the spec path", () => {
    DEPRECATIONS.push(entry);
    try {
      // The mirror serves /api/v1/... for the spec's /v1/... paths.
      expect(findDeprecation("/api/v1/legacy")).toBeDefined();
      expect(findDeprecation("/v1/legacy")).toBeDefined();
      expect(findDeprecation("/api/v1/pricing")).toBeUndefined();
    } finally {
      DEPRECATIONS.length = 0;
    }
  });
});

describe("the published policy", () => {
  it("promises a notice period long enough to migrate", () => {
    expect(MINIMUM_NOTICE_DAYS).toBeGreaterThanOrEqual(90);
  });

  it("never sunsets earlier than it deprecates", () => {
    for (const entry of DEPRECATIONS) {
      expect(
        new Date(entry.sunsetOn).getTime() - new Date(entry.deprecatedOn).getTime(),
        entry.path,
      ).toBeGreaterThanOrEqual(0);
    }
  });

  it("gives every listed deprecation at least the promised notice", () => {
    const dayMs = 86_400_000;
    for (const entry of DEPRECATIONS) {
      const days =
        (new Date(entry.sunsetOn).getTime() - new Date(entry.deprecatedOn).getTime()) / dayMs;
      expect(days, entry.path).toBeGreaterThanOrEqual(MINIMUM_NOTICE_DAYS);
    }
  });
});
