import { ImageResponse } from "next/og";
import { comparisons, getComparison } from "@/lib/comparisons";
import { C, Footer, Frame, Header, Kicker, OG_SIZE } from "@/lib/og/brand";
import { DISPLAY, ogFonts } from "@/lib/og/fonts";

// Per-comparison share card. Names only, no competitor logos.
export const alt = "AgentCost comparison";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export default async function CompareOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  const competitor = c?.competitor ?? "the alternatives";

  return new ImageResponse(
    (
      <Frame>
        <Header url={`agentcost.tech/compare/${slug}`} />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <Kicker>Comparison</Kicker>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 18,
              fontFamily: DISPLAY,
              fontSize: 96,
              letterSpacing: -2.4,
              lineHeight: 1,
            }}
          >
            <div style={{ display: "flex", color: C.text }}>AgentCost</div>
            <div style={{ display: "flex", margin: "0 28px", fontSize: 60, color: C.faint }}>vs</div>
            <div style={{ display: "flex", color: C.dim }}>{competitor}</div>
          </div>
          <div style={{ display: "flex", marginTop: 30, maxWidth: 900, fontSize: 26, lineHeight: 1.45, color: C.muted }}>
            Pricing, self-hosting and integration for LLM cost tracking, from each product&apos;s own public pages.
          </div>
        </div>
        <Footer left="AgentCost is free and MIT licensed" right={c ? `Checked ${c.verifiedOn}` : undefined} />
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
