/**
 * API versioning and deprecation signalling.
 *
 * An agent will not build against a surface that can change without warning,
 * so the policy has to be machine-readable, not just written down somewhere.
 *
 * Two mechanisms, per the IETF deprecation-header draft and RFC 8594:
 *
 * - Every response carries `Link: <policy>; rel="deprecation"`. The draft
 *   allows that link relation on its own — it points at the policy, and does
 *   NOT assert that anything is deprecated.
 * - A retired endpoint additionally gets `Deprecation: @<unix-seconds>` (a
 *   Structured Fields Date) and `Sunset: <HTTP-date>`. The draft requires the
 *   sunset instant to be no earlier than the deprecation instant.
 *
 * Nothing is deprecated today. DEPRECATIONS is empty and the machinery is
 * here so the first retirement is a data change, not a code change.
 */

export const POLICY_URL = "https://agentcost.tech/docs/api-versioning";

/** How long a deprecated endpoint keeps working after the announcement. */
export const MINIMUM_NOTICE_DAYS = 180;

export type Deprecation = {
  /** Path as it appears under the API root, e.g. "/v1/pricing". */
  path: string;
  /** When the endpoint was announced as deprecated (ISO 8601). */
  deprecatedOn: string;
  /** When it stops working (ISO 8601). Never earlier than deprecatedOn. */
  sunsetOn: string;
  /** What to use instead. Surfaced to callers. */
  replacement?: string;
};

/** Currently deprecated endpoints. Empty: nothing has been retired yet. */
export const DEPRECATIONS: Deprecation[] = [];

export function findDeprecation(pathname: string): Deprecation | undefined {
  // The mirror serves /api/v1/... for the spec's /v1/... paths.
  const apiPath = pathname.replace(/^\/api/, "");
  return DEPRECATIONS.find((entry) => entry.path === apiPath);
}

/** Structured Fields Date: an "@" followed by whole seconds since the epoch. */
export function structuredDate(iso: string): string {
  return `@${Math.floor(new Date(iso).getTime() / 1000)}`;
}

/** RFC 8594 wants an HTTP-date, which is what toUTCString produces. */
export function httpDate(iso: string): string {
  return new Date(iso).toUTCString();
}

/**
 * Headers for a response. Always includes the policy link; adds the
 * deprecation and sunset instants only when the endpoint is actually retiring.
 */
export function deprecationHeaders(pathname: string): Record<string, string> {
  const headers: Record<string, string> = {
    Link: `<${POLICY_URL}>; rel="deprecation"; type="text/html"`,
  };

  const deprecation = findDeprecation(pathname);
  if (!deprecation) return headers;

  headers.Deprecation = structuredDate(deprecation.deprecatedOn);
  headers.Sunset = httpDate(deprecation.sunsetOn);
  if (deprecation.replacement) {
    headers.Link += `, <${deprecation.replacement}>; rel="successor-version"`;
  }
  return headers;
}
