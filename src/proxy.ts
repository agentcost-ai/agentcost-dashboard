import { NextResponse, type NextRequest } from "next/server";

import { negotiate } from "@/lib/http/accept";
import { errorBody } from "@/lib/http/api-response";

/**
 * Content negotiation for the public site.
 *
 * Two jobs:
 *
 * 1. Serve `text/markdown` when a client asks for it (acceptmarkdown.com), and
 *    put `Accept` in `Vary` on BOTH representations. Without the Vary, a CDN
 *    that cached the HTML variant first will hand it to an agent asking for
 *    markdown, and vice versa.
 * 2. Answer an unknown /api/v1/* path with the JSON error envelope instead of
 *    letting it fall through to the HTML 404 page.
 */

const HTML = "text/html";
const MARKDOWN = "text/markdown";

// Server preference order: HTML first, so */* and browser traffic are unchanged.
const SUPPORTED = [HTML, MARKDOWN] as const;

const VARY = "Accept, Accept-Encoding";

/** Paths under /api/v1 that a route handler actually serves. */
const API_ROUTES: readonly RegExp[] = [
  /^\/api\/v1$/,
  /^\/api\/v1\/health$/,
  /^\/api\/v1\/estimate$/,
  /^\/api\/v1\/pricing$/,
  /^\/api\/v1\/pricing\/deprecations$/,
  /^\/api\/v1\/pricing\/sync\/status$/,
  /^\/api\/v1\/pricing\/.+$/,
];

function isKnownApiRoute(pathname: string): boolean {
  return API_ROUTES.some((pattern) => pattern.test(pathname));
}

/** An App Router payload fetch rather than a document request. */
function isRscRequest(request: NextRequest, accept: string | null): boolean {
  return (
    request.headers.has("rsc") ||
    request.headers.has("next-router-prefetch") ||
    request.headers.has("next-router-state-tree") ||
    (accept?.includes("text/x-component") ?? false)
  );
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/v1")) {
    if (isKnownApiRoute(pathname)) return NextResponse.next();
    const body = errorBody(
      "not_found",
      `No API endpoint at ${pathname}.`,
      "The public endpoints are /api/v1/health, /api/v1/pricing, /api/v1/pricing/{model}, /api/v1/pricing/deprecations, /api/v1/pricing/sync/status and POST /api/v1/estimate. Full contract: https://agentcost.tech/openapi.json",
    );
    return NextResponse.json(body, {
      status: 404,
      headers: { "Cache-Control": "no-store", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Only GET/HEAD have two representations; a POST is not a page request.
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.next();
  }

  const accept = request.headers.get("accept");

  // Next's own client router fetches RSC payloads. Chrome sends Accept: */* for
  // those today, but the router also sends text/x-component -- which names
  // neither representation and would otherwise be answered with a 406, breaking
  // client-side navigation. Never negotiate an RSC request.
  if (isRscRequest(request, accept)) return NextResponse.next();
  const chosen = negotiate(accept, SUPPORTED);

  if (chosen === null) {
    // The client sent an Accept that positively excludes both representations.
    const body = errorBody(
      "not_acceptable",
      `This URL is available as ${SUPPORTED.join(" or ")}; the Accept header requested neither.`,
      "Retry with 'Accept: text/markdown' for markdown, or 'Accept: text/html' for the rendered page.",
    );
    return NextResponse.json(body, {
      status: 406,
      headers: { Vary: VARY, "Cache-Control": "no-store" },
    });
  }

  if (chosen === MARKDOWN) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/markdown${pathname === "/" ? "" : pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("Vary", VARY);
    return response;
  }

  // Vary is set here and in next.config.ts, but Next's page renderer appends its
  // own RSC Vary last and replaces the key, so an App Router HTML response ships
  // without `Accept` and there is no supported hook to change that (verified
  // against next 16.1.4, base-server.js setVaryHeader). It matters less than it
  // reads: the markdown branch above is a REWRITE, so the two representations
  // occupy different CDN cache keys and cannot be served for one another. The
  // markdown response itself does carry `Vary: Accept`.
  const response = NextResponse.next();
  response.headers.set("Vary", VARY);
  return response;
}

export const config = {
  matcher: [
    /*
     * Every path except Next internals, the API markdown handler itself, and the
     * static files that have exactly one representation. Keeping /api/v1 IN so
     * unknown API paths get a JSON 404 rather than the HTML page.
     */
    "/((?!_next/|api/markdown|favicon\\.ico|icon\\.svg|opengraph-image|robots\\.txt|sitemap\\.xml|llms\\.txt|llms-full\\.txt|openapi\\.json|openapi\\.yaml|.*\\.txt$).*)",
  ],
};
