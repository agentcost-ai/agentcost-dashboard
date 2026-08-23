import { describe, expect, it } from "vitest";

import sitemap from "@/app/sitemap";
import {
  PROTECTED_ROUTES,
  isAuthOnlyRoute,
  isProtectedRoute,
  isPublicRoute,
  shouldRedirectToLogin,
} from "./route-access";
import { SITE_URL } from "./site";

describe("public routes", () => {
  it("treats every URL in the sitemap as public", () => {
    // A page in the sitemap is one strangers and crawlers arrive on cold. If it
    // is not public here it bounces them to /auth/login, which is worse than a
    // 404 — it looks like the content is gated.
    const routes = sitemap().map((entry) => entry.url.replace(SITE_URL, "") || "/");
    const gated = routes.filter((route) => !isPublicRoute(route));
    expect(gated).toEqual([]);
  });

  it("covers the trust-anchor pages", () => {
    for (const route of ["/about", "/contact", "/privacy", "/terms", "/docs"]) {
      expect(isPublicRoute(route), route).toBe(true);
    }
  });

  it("covers nested docs, blog and comparison pages", () => {
    expect(isPublicRoute("/docs/sdk")).toBe(true);
    expect(isPublicRoute("/blog/budget-guardrails-for-llm-spend")).toBe(true);
    expect(isPublicRoute("/compare/helicone")).toBe(true);
  });
});

describe("protected routes", () => {
  it("still gates every dashboard segment", () => {
    for (const route of PROTECTED_ROUTES) {
      expect(isProtectedRoute(route), route).toBe(true);
      expect(shouldRedirectToLogin(route), route).toBe(true);
    }
  });

  it("gates nested segments too", () => {
    expect(shouldRedirectToLogin("/settings/team")).toBe(true);
    expect(shouldRedirectToLogin("/dashboard?range=30d")).toBe(true);
  });
});

describe("unknown routes", () => {
  it("does NOT bounce an unknown path to login", () => {
    // The regression this guards: deny-by-default meant every 404 rendered as
    // the login page for any client that runs JS, so the 404 page — and its
    // agent recovery block — was never actually seen.
    for (const route of [
      "/some-path-that-does-not-exist",
      "/docs/nope",
      "/blog/deleted-post",
      "/api-reference",
    ]) {
      expect(shouldRedirectToLogin(route), route).toBe(false);
    }
  });

  it("does not confuse /models (app) with /docs/models (public)", () => {
    expect(shouldRedirectToLogin("/models")).toBe(true);
    expect(shouldRedirectToLogin("/docs/models")).toBe(false);
  });
});

describe("auth-only routes", () => {
  it("lists the pages a signed-in user should be moved off", () => {
    expect(isAuthOnlyRoute("/auth/login")).toBe(true);
    expect(isAuthOnlyRoute("/auth/register")).toBe(true);
    // Verification must stay reachable while signed in — users are signed in
    // immediately after registering and still have to open the emailed link.
    expect(isAuthOnlyRoute("/auth/verify-email")).toBe(false);
    expect(isAuthOnlyRoute("/auth/accept-policies")).toBe(false);
  });
});

describe("null and empty paths", () => {
  it("never redirects on a missing pathname", () => {
    expect(shouldRedirectToLogin(null)).toBe(false);
    expect(shouldRedirectToLogin(undefined)).toBe(false);
    expect(shouldRedirectToLogin("")).toBe(false);
  });
});
