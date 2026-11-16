import { ImageResponse } from "next/og";
import { C, Chip, Frame, Header, OG_SIZE, SpikeBars } from "@/lib/og/brand";
import { DISPLAY, MONO, ogFonts } from "@/lib/og/fonts";

// Site-wide share card. Next injects it as og:image and twitter:image on every
// page without its own. Built to make someone click: a spend chart with one
// spike, a cost on the callout, and the agent's name redacted. The headline
// asks the question the redaction withholds.
export const alt =
  "AgentCost: a daily LLM spend chart with one huge spike and the responsible agent's name redacted, under the question: Your AI bill spiked. Which agent did it?";
export const size = OG_SIZE;
export const contentType = "image/png";

const BARS = [28, 34, 26, 38, 32, 41, 31, 36, 33, 39, 35, 214, 44, 29];

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <Frame>
        <Header right="agentcost.tech" />

        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          {/* Left: the question */}
          <div style={{ display: "flex", flexDirection: "column", width: 590 }}>
            <div
              style={{
                display: "flex",
                fontFamily: MONO,
                fontSize: 19,
                color: C.amber,
                letterSpacing: 1,
                marginBottom: 22,
              }}
            >
              ▲ +1,840% · TUESDAY 03:14 AM
            </div>
            <div style={{ display: "flex", fontFamily: DISPLAY, fontSize: 60, lineHeight: 1.08, letterSpacing: -1.2 }}>
              Your AI bill spiked.
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: DISPLAY,
                fontSize: 60,
                lineHeight: 1.08,
                letterSpacing: -1.2,
                color: C.sky,
              }}
            >
              Which agent did it?
            </div>
            <div style={{ display: "flex", marginTop: 24, fontSize: 23, lineHeight: 1.4, color: C.muted, maxWidth: 520 }}>
              AgentCost traces every LLM call to the agent that made it.
            </div>
          </div>

          {/* Right: the evidence */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginLeft: "auto",
              width: 470,
              height: 372,
              padding: "24px 26px 22px",
              borderRadius: 22,
              border: `1px solid ${C.border}`,
              backgroundColor: "rgba(13,13,17,0.92)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ display: "flex", fontFamily: MONO, fontSize: 15, color: C.faint, letterSpacing: 1 }}>
                DAILY LLM SPEND
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <div style={{ display: "flex", fontSize: 34, fontWeight: 600 }}>$4,212</div>
                <div style={{ display: "flex", marginLeft: 10, fontSize: 18, color: C.amber }}>▲ 1,840%</div>
              </div>
            </div>

            <div style={{ display: "flex", position: "relative", flex: 1, alignItems: "flex-end", marginTop: 14 }}>
              <SpikeBars bars={BARS} barWidth={24} gap={7.5} />

              {/* Callout pointing at the spike, agent redacted */}
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 40,
                  display: "flex",
                  flexDirection: "column",
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(251,191,36,0.45)",
                  backgroundColor: "rgba(20,16,8,0.96)",
                }}
              >
                <div style={{ display: "flex", fontFamily: MONO, fontSize: 15, color: C.muted }}>
                  $3,880 in 41 min · 2,941 calls
                </div>
                <div style={{ display: "flex", alignItems: "center", marginTop: 10 }}>
                  <div style={{ display: "flex", fontFamily: MONO, fontSize: 17, color: C.text }}>agent:</div>
                  <div
                    style={{
                      display: "flex",
                      marginLeft: 10,
                      width: 150,
                      height: 20,
                      borderRadius: 4,
                      backgroundImage:
                        "repeating-linear-gradient(135deg, #e5e5e5 0px, #e5e5e5 6px, #a3a3a3 6px, #a3a3a3 12px)",
                    }}
                  />
                  <div style={{ display: "flex", marginLeft: 10, fontSize: 22, color: C.amber, fontWeight: 600 }}>
                    ?
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Chip>Open source · MIT</Chip>
          <Chip>OpenAI · Anthropic · Gemini · LangChain</Chip>
          <Chip>2 lines of Python</Chip>
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
