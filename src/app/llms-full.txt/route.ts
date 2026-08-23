import { llmsFullTxt } from "@/lib/agent-content";

/** Every public page's markdown in one document, for agents that want it all at once. */

export const dynamic = "force-static";

export async function GET() {
  return new Response(llmsFullTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
