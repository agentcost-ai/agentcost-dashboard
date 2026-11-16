import { ImageResponse } from "next/og";
import { blogPosts } from "@/lib/content";
import { C, Footer, Frame, Header, Kicker, OG_SIZE } from "@/lib/og/brand";
import { DISPLAY, ogFonts } from "@/lib/og/fonts";

// Per-post share card: the post's own title, set like a journal page.
export const alt = "AgentCost blog post";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default async function BlogOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogPosts.find((item) => item.slug === slug);
  const title = post?.title ?? "The AgentCost blog";
  // Long titles step down so they never run past three lines.
  const fontSize = title.length > 72 ? 56 : title.length > 46 ? 64 : 74;

  return new ImageResponse(
    (
      <Frame>
        <Header url="agentcost.tech/blog" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <Kicker>{post?.category ?? "Blog"}</Kicker>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              maxWidth: 1056,
              fontFamily: DISPLAY,
              fontSize,
              lineHeight: 1.08,
              letterSpacing: -1.2,
              color: C.text,
              // Even line lengths: no single word stranded on the last line.
              textWrap: "balance",
            }}
          >
            {title}
          </div>
        </div>
        <Footer
          left={post ? formatDate(post.publishedAt) : "agentcost.tech/blog"}
          right={post?.readTime}
        />
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
