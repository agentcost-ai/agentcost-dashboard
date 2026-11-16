import { ImageResponse } from "next/og";
import { blogPosts } from "@/lib/content";
import { C, Frame, Header, OG_SIZE, SpikeBars } from "@/lib/og/brand";
import { DISPLAY, MONO, ogFonts } from "@/lib/og/fonts";

// Per-post share card: the post's own title, so a shared link says what it is.
export const alt = "AgentCost blog post";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export default async function BlogOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  const title = post?.title ?? "The AgentCost blog";
  // Long titles step down so they never run past three lines.
  const fontSize = title.length > 70 ? 54 : title.length > 45 ? 62 : 72;

  return new ImageResponse(
    (
      <Frame>
        <Header right="agentcost.tech/blog" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", fontFamily: MONO, fontSize: 19, color: C.sky, letterSpacing: 2 }}>
            {`${(post?.category ?? "Blog").toUpperCase()}${post ? ` · ${post.readTime.toUpperCase()}` : ""}`}
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 22,
              maxWidth: 1000,
              fontFamily: DISPLAY,
              fontSize,
              lineHeight: 1.08,
              letterSpacing: -1.2,
            }}
          >
            {title}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 22, color: C.muted }}>
            Open-source LLM cost tracking, per agent.
          </div>
          <SpikeBars bars={[14, 18, 13, 20, 16, 22, 17, 19, 74, 21]} barWidth={12} gap={6} />
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
