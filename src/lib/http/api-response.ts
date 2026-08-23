/**
 * JSON envelope for the public API served from agentcost.tech.
 *
 * Deliberately the same shape the backend returns (app/utils/errors.py), so a
 * caller that handles one host handles the other: a machine-readable `code`,
 * a `message`, a `hint` saying what to do next, and a string `detail` kept for
 * clients that already read that field.
 */

export const API_DOCS_URL = "https://agentcost.tech/docs/api";

export type ApiErrorCode =
  | "bad_request"
  | "not_found"
  | "method_not_allowed"
  | "not_acceptable"
  | "unsupported_media_type"
  | "validation_error"
  | "upstream_error"
  | "service_unavailable"
  | "internal_error";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  bad_request: 400,
  not_found: 404,
  method_not_allowed: 405,
  not_acceptable: 406,
  unsupported_media_type: 415,
  validation_error: 422,
  upstream_error: 502,
  service_unavailable: 503,
  internal_error: 500,
};

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    hint: string;
    status: number;
    docs: string;
  };
  detail: string;
};

export function errorBody(
  code: ApiErrorCode,
  message: string,
  hint: string,
): ApiErrorBody {
  return {
    error: { code, message, hint, status: STATUS_BY_CODE[code], docs: API_DOCS_URL },
    detail: message,
  };
}

type JsonInit = {
  /** Seconds the CDN may serve this response for. */
  maxAge?: number;
  /** Seconds it may keep serving a stale copy while revalidating. */
  staleWhileRevalidate?: number;
  headers?: Record<string, string>;
};

function cacheControl({ maxAge, staleWhileRevalidate }: JsonInit): string {
  if (maxAge === undefined) return "no-store";
  const swr = staleWhileRevalidate ?? maxAge;
  return `public, max-age=0, s-maxage=${maxAge}, stale-while-revalidate=${swr}`;
}

export function jsonOk(data: unknown, init: JsonInit = {}): Response {
  return Response.json(data, {
    headers: {
      "Cache-Control": cacheControl(init),
      // Read cross-origin by design: this is the public surface.
      "Access-Control-Allow-Origin": "*",
      Vary: "Accept-Encoding",
      ...init.headers,
    },
  });
}

export function jsonError(
  code: ApiErrorCode,
  message: string,
  hint: string,
  headers: Record<string, string> = {},
): Response {
  const body = errorBody(code, message, hint);
  return Response.json(body, {
    status: body.error.status,
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      Vary: "Accept-Encoding",
      ...headers,
    },
  });
}
