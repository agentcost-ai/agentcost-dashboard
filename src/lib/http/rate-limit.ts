/**
 * Rate limiting for the public API, with the headers an agent needs to
 * self-throttle instead of discovering the limit by hitting it.
 *
 * Two header generations are emitted because clients are split between them:
 * the current IETF draft (`RateLimit-Policy` / `RateLimit`, quoted policy name
 * with q/w/r/t parameters) and the widely-implemented earlier triple
 * (`RateLimit-Limit` / `-Remaining` / `-Reset`).
 *
 * Honest about the store: counters live in memory per edge isolate, so the
 * ceiling is per-isolate rather than global. That makes this a courtesy signal
 * and a runaway-client backstop, not a billing-grade quota — which is the usual
 * shape of an edge limiter, and the origin enforces its own limit underneath.
 */

/** Policy name, surfaced in the header so a client can tell policies apart. */
export const POLICY = "public";

/** Requests allowed per window, per client. */
export const LIMIT = 120;

/** Window length in seconds. */
export const WINDOW_SECONDS = 60;

/** Stop the map growing without bound when many clients appear briefly. */
const MAX_TRACKED_CLIENTS = 10_000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Seconds until the window resets. */
  reset: number;
};

/** Reset all counters. Test seam. */
export function resetRateLimiter(): void {
  buckets.clear();
}

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Record one request against `key` and report the remaining quota.
 *
 * `now` is injected so the window arithmetic is testable without faking timers.
 */
export function consume(key: string, now: number = Date.now()): RateLimitResult {
  let bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    // A fresh window. Prune here rather than on a timer: this is the only
    // moment we know some windows have certainly expired.
    if (buckets.size >= MAX_TRACKED_CLIENTS) prune(now);
    bucket = { count: 0, resetAt: now + WINDOW_SECONDS * 1000 };
    buckets.set(key, bucket);
  }

  bucket.count += 1;

  const reset = Math.max(0, Math.ceil((bucket.resetAt - now) / 1000));
  const remaining = Math.max(0, LIMIT - bucket.count);

  return { allowed: bucket.count <= LIMIT, limit: LIMIT, remaining, reset };
}

/**
 * Identify the caller. Vercel puts the real client first in x-forwarded-for;
 * everything after it is proxy hops. Falls back to a shared bucket rather than
 * to no limit at all.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** The headers to attach to every public API response. */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    // Current IETF draft form.
    "RateLimit-Policy": `"${POLICY}";q=${result.limit};w=${WINDOW_SECONDS}`,
    RateLimit: `"${POLICY}";r=${result.remaining};t=${result.reset}`,
    // Earlier triple, still what most clients and scanners read.
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(result.reset),
  };
}
