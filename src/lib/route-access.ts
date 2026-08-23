/**
 * Which routes the client-side auth guard should bounce to /auth/login.
 *
 * Pure and separate from AuthContext so the classification is testable — this
 * is the logic that decides whether a visitor sees a page or a login screen.
 */

/** Public marketing, docs and legal routes. Anything in sitemap.ts belongs here. */
export const PUBLIC_ROUTES = [
  "/", // Landing page is public
  "/demo", // Demo entry point — sets demo mode then redirects to dashboard
  "/pricing",
  "/blog",
  "/changelog",
  "/compare", // Competitor comparison pages — these exist to be found by
  // strangers via search, so they must never bounce to login.
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/accept-policies",
  "/docs",
  "/about", // Trust-anchor pages — strangers and AI agents check these before
  "/contact", // recommending us, so they must never bounce to login.
  "/terms",
  "/privacy",
];

/**
 * Routes that require a signed-in user: every segment of the (dashboard) group.
 *
 * The guard used to be deny-by-default — anything absent from PUBLIC_ROUTES was
 * treated as protected — so an unknown URL bounced to /auth/login instead of
 * rendering the 404 page. Keep this list in step with src/app/(dashboard)/; a
 * route missing from it renders that group's spinner rather than redirecting,
 * and the API is the real access control either way.
 */
export const PROTECTED_ROUTES = [
  "/account",
  "/agents",
  "/dashboard",
  "/events",
  "/feedback",
  "/models",
  "/optimizations",
  "/reports",
  "/settings",
  "/workflows",
];

/** Auth pages a signed-in user should be redirected away from. */
export const AUTH_ONLY_ROUTES = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

export function isPublicRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/") return true;
  return PUBLIC_ROUTES.some(
    (route) => route !== "/" && pathname.startsWith(route),
  );
}

export function isProtectedRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

export function isAuthOnlyRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route));
}

/** True when an anonymous visitor on this path should be sent to sign in. */
export function shouldRedirectToLogin(
  pathname: string | null | undefined,
): boolean {
  return !isPublicRoute(pathname) && isProtectedRoute(pathname);
}
