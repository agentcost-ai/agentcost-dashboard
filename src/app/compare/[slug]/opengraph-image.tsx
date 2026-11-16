import { ImageResponse } from "next/og";
import { comparisons, getComparison } from "@/lib/comparisons";
import { C, Chip, Frame, Header, Mark, OG_SIZE } from "@/lib/og/brand";
import { DISPLAY, MONO, ogFonts } from "@/lib/og/fonts";

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
        <Header right="agentcost.tech/compare" />
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", fontFamily: MONO, fontSize: 19, color: C.sky, letterSpacing: 2 }}>
            LLM COST TRACKING · HONEST COMPARISON
          </div>
          <div style={{ display: "flex", alignItems: "center", marginTop: 26 }}>
            <Mark size={78} />
            <div style={{ display: "flex", marginLeft: 22, fontFamily: DISPLAY, fontSize: 92, letterSpacing: -2 }}>
              AgentCost
            </div>
            <div style={{ display: "flex", margin: "0 30px", fontFamily: DISPLAY, fontSize: 64, color: C.faint }}>
              vs
            </div>
            <div style={{ display: "flex", fontFamily: DISPLAY, fontSize: 92, letterSpacing: -2, color: C.muted }}>
              {competitor}
            </div>
          </div>
          <div style={{ display: "flex", marginTop: 26, fontSize: 25, color: C.muted, maxWidth: 940, lineHeight: 1.4 }}>
            {"Pricing, self-hosting and integration side by side, from each product's own public pages."}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Chip>AgentCost: free, MIT licensed</Chip>
          {c ? <Chip>{`Verified ${c.verifiedOn}`}</Chip> : null}
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
