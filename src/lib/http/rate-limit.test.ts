import { beforeEach, describe, expect, it } from "vitest";

import {
  LIMIT,
  POLICY,
  WINDOW_SECONDS,
  clientKey,
  consume,
  rateLimitHeaders,
  resetRateLimiter,
} from "./rate-limit";

const T0 = 1_700_000_000_000;

beforeEach(() => resetRateLimiter());

describe("consume", () => {
  it("allows the first request and counts it", () => {
    const result = consume("1.2.3.4", T0);
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(LIMIT);
    expect(result.remaining).toBe(LIMIT - 1);
    expect(result.reset).toBe(WINDOW_SECONDS);
  });

  it("counts down to zero and then refuses", () => {
    for (let i = 0; i < LIMIT; i++) {
      expect(consume("a", T0).allowed, `request ${i + 1}`).toBe(true);
    }
    const overflow = consume("a", T0);
    expect(overflow.allowed).toBe(false);
    expect(overflow.remaining).toBe(0);
  });

  it("never reports negative remaining once over the limit", () => {
    for (let i = 0; i < LIMIT + 25; i++) consume("a", T0);
    expect(consume("a", T0).remaining).toBe(0);
  });

  it("keeps clients in separate buckets", () => {
    for (let i = 0; i < LIMIT; i++) consume("noisy", T0);
    expect(consume("noisy", T0).allowed).toBe(false);
    expect(consume("quiet", T0).allowed).toBe(true);
  });

  it("counts down reset as the window elapses", () => {
    expect(consume("a", T0).reset).toBe(WINDOW_SECONDS);
    expect(consume("a", T0 + 30_000).reset).toBe(WINDOW_SECONDS - 30);
  });

  it("starts a fresh window once the old one expires", () => {
    for (let i = 0; i < LIMIT + 5; i++) consume("a", T0);
    expect(consume("a", T0).allowed).toBe(false);

    const next = consume("a", T0 + WINDOW_SECONDS * 1000 + 1);
    expect(next.allowed).toBe(true);
    expect(next.remaining).toBe(LIMIT - 1);
    expect(next.reset).toBe(WINDOW_SECONDS);
  });
});

describe("clientKey", () => {
  it("takes the first hop from x-forwarded-for, which is the real client", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18" });
    expect(clientKey(headers)).toBe("203.0.113.9");
  });

  it("trims whitespace", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "  203.0.113.9 " }))).toBe(
      "203.0.113.9",
    );
  });

  it("falls back to x-real-ip, then to a shared bucket", () => {
    expect(clientKey(new Headers({ "x-real-ip": "198.51.100.4" }))).toBe("198.51.100.4");
    // A shared bucket, not "no limit" — an unidentifiable caller is exactly the
    // one you least want to leave unbounded.
    expect(clientKey(new Headers())).toBe("unknown");
  });

  it("ignores an empty forwarded header", () => {
    expect(clientKey(new Headers({ "x-forwarded-for": "" }))).toBe("unknown");
  });
});

describe("rateLimitHeaders", () => {
  const headers = rateLimitHeaders(consume("a", T0));

  it("emits the current IETF draft syntax", () => {
    // RateLimit-Policy: "public";q=120;w=60
    expect(headers["RateLimit-Policy"]).toBe(`"${POLICY}";q=${LIMIT};w=${WINDOW_SECONDS}`);
    // RateLimit: "public";r=119;t=60
    expect(headers.RateLimit).toBe(`"${POLICY}";r=${LIMIT - 1};t=${WINDOW_SECONDS}`);
  });

  it("also emits the earlier triple that most clients read", () => {
    expect(headers["RateLimit-Limit"]).toBe(String(LIMIT));
    expect(headers["RateLimit-Remaining"]).toBe(String(LIMIT - 1));
    expect(headers["RateLimit-Reset"]).toBe(String(WINDOW_SECONDS));
  });

  it("keeps the policy and the limit in agreement", () => {
    expect(headers["RateLimit-Policy"]).toContain(`q=${headers["RateLimit-Limit"]}`);
  });
});
