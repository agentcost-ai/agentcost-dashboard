import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  if (value == null || isNaN(value)) return "$0.00";
  if (value === 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(6)}`;
  if (value < 1) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(2)}`;
}

export function formatNumber(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return "0";
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}

export function formatLatency(ms: number): string {
  // Zero is not a fast call: it is how the API reports that none of the calls
  // carried a latency, as with a coding agent read from its session log.
  if (!ms || ms <= 0) return "—";
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatPercentage(value: number): string {
  // Backend returns percentage value directly (e.g., 99.5 for 99.5%)
  if (value == null || isNaN(value)) return "0.0%";
  return `${value.toFixed(1)}%`;
}

export function dayBucketDate(iso: string): Date {
  // A day key ("2026-08-03"), or a bucket at UTC midnight (the API without
  // X-Timezone-Offset, and the demo data), names a calendar date: build it
  // from the date alone, or new Date() would show the previous day west of UTC.
  // Any other instant is the viewer's own midnight -- the API cuts days on the
  // offset the dashboard sends -- and reading its date in UTC would show the
  // previous day east of UTC.
  if (iso.length === 10 || /T00:00:00(\.0+)?(Z|[+-]00:?00)$/.test(iso)) {
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const instant = new Date(iso);
  return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
}

/**
 * The series with an empty point for every hour or day in [start, end] that
 * had no calls, so a quiet stretch reads as zero instead of a line drawn
 * straight across it. Buckets are matched on the viewer's clock.
 */
export function fillTimeSeries<
  T extends { timestamp: string; cost: number; calls: number; tokens: number },
>(points: T[], start: string, end: string, granularity: "hour" | "day"): T[] {
  const keyOf = (d: Date) =>
    granularity === "hour"
      ? `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
      : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const bucketOf = (iso: string) =>
    granularity === "hour" ? new Date(iso) : dayBucketDate(iso);

  const byKey = new Map(points.map((p) => [keyOf(bucketOf(p.timestamp)), p]));
  const cursor = new Date(start);
  if (granularity === "hour") cursor.setMinutes(0, 0, 0);
  else cursor.setHours(0, 0, 0, 0);
  const last = new Date(Math.min(new Date(end).getTime(), Date.now()));

  const filled: T[] = [];
  let matched = 0;
  // A guard against a malformed window: a 90-day hourly series is 2,160 points.
  for (let i = 0; cursor <= last && i < 2200; i++) {
    const existing = byKey.get(keyOf(cursor));
    if (existing) matched++;
    filled.push(
      existing ??
        ({ timestamp: cursor.toISOString(), cost: 0, calls: 0, tokens: 0, subscription_cost: 0 } as unknown as T),
    );
    if (granularity === "hour") cursor.setHours(cursor.getHours() + 1);
    else cursor.setDate(cursor.getDate() + 1);
  }
  // Never drop a point the API returned: if any fell outside the buckets
  // computed here, show the series as it came.
  return matched === points.length && byKey.size === points.length ? filled : points;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeTime(date: string | Date): string {
  let utcDate: Date;

  if (typeof date === "string") {
    // If it's already a UTC timestamp (ends with Z), parse it as UTC
    if (date.endsWith("Z") || date.includes("+")) {
      utcDate = new Date(date);
    } else {
      // If no timezone info, assume it's UTC and add Z
      utcDate = new Date(date + "Z");
    }
  } else {
    utcDate = date;
  }

  const now = new Date();
  const diffMs = now.getTime() - utcDate.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

/**
 * Parse API error responses into user-friendly messages.
 * Handles various error formats including:
 * - 422 validation errors (array format)
 * - Simple string detail format
 * - Generic HTTP status codes
 */
export function parseApiError(err: unknown): string {
  if (err instanceof Error) {
    const message = err.message;

    // Handle 422 validation errors (array format)
    const validationMatch = message.match(/{"detail":\[(.+)\]}/);
    if (validationMatch) {
      try {
        const fullJson = JSON.parse(
          message.match(/{"detail":\[.+\]}/)?.[0] || "{}",
        );
        if (fullJson.detail && Array.isArray(fullJson.detail)) {
          // Extract readable messages from validation errors
          const messages = fullJson.detail.map(
            (e: { msg?: string; ctx?: { reason?: string } }) => {
              if (e.ctx?.reason) return e.ctx.reason;
              if (e.msg)
                return e.msg.replace(
                  /^value is not a valid email address: /,
                  "",
                );
              return "Invalid input";
            },
          );
          return messages.join(". ");
        }
      } catch {
        // Fall through to other parsing methods
      }
    }

    // Handle simple string detail format
    const detailMatch = message.match(/{"detail":"([^"]+)"}/);
    if (detailMatch) {
      const detail = detailMatch[1];
      // Provide user-friendly messages for common errors
      if (detail.includes("don't have access")) {
        return "You don't have access to this project.";
      }
      if (detail.includes("Invalid or expired token")) {
        return "Your session has expired. This usually happens after 7 days of inactivity. Please log out and log back in.";
      }
      if (detail.includes("Email not verified")) {
        return "Please verify your email address before logging in.";
      }
      if (detail.includes("Invalid email or password")) {
        return "Invalid email or password. Please try again.";
      }
      return detail;
    }

    if (message.includes("401")) {
      return "Your session has expired. This usually happens after 7 days of inactivity. Please log out and log back in.";
    }
    if (message.includes("403")) {
      return "You don't have permission to perform this action.";
    }

    // Remove API Error prefix and status codes for cleaner display
    const cleanMessage = message
      .replace(/^API Error:\s*/i, "")
      .replace(
        /^\d{3}\s+(Bad Request|Unauthorized|Forbidden|Not Found|Unprocessable Content|Unprocessable Entity)\s*-\s*/i,
        "",
      )
      .replace(/^{"detail":"(.+)"}$/i, "$1");

    return cleanMessage || message;
  }
  return "An unexpected error occurred. Please try again.";
}
