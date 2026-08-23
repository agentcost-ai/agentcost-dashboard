import { llmsTxt } from "@/lib/agent-content";

/**
 * /llms.txt in the llmstxt.org format. Generated from the same page registry the
 * markdown responses are served from, so a new page cannot be missing from it.
 */

export const dynamic = "force-static";

export async function GET() {
  return new Response(llmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
