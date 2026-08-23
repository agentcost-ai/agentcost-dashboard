import { findAgentPage, notFoundMarkdown } from "@/lib/agent-content";

/**
 * The markdown representation of a public page.
 *
 * Reached only by rewrite from middleware.ts when a request negotiated
 * `text/markdown`; nothing links here directly. Unknown paths answer 404 with
 * the recovery block rather than an empty body, so an agent that followed a
 * dead link is told where to look next.
 */

export const revalidate = 3600;

const HEADERS = {
  "Content-Type": "text/markdown; charset=utf-8",
  // Same Vary the HTML variant carries -- without it a CDN can serve one
  // representation to a client that asked for the other.
  Vary: "Accept, Accept-Encoding",
  "Access-Control-Allow-Origin": "*",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await params;
  const pathname = `/${(slug ?? []).join("/")}`;

  const page = findAgentPage(pathname);
  if (!page) {
    return new Response(notFoundMarkdown(pathname), {
      status: 404,
      headers: { ...HEADERS, "Cache-Control": "no-store" },
    });
  }

  return new Response(page.markdown, {
    status: 200,
    headers: {
      ...HEADERS,
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
