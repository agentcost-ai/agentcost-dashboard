import { ImageResponse } from "next/og";

// Site-wide social/preview card (1200×630). Next auto-injects this as the
// default og:image / twitter:image across pages.
export const alt =
  "AgentCost — Real-time LLM cost tracking for OpenAI, Anthropic & LangChain";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0a0a0b",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            AC
          </div>
          <div
            style={{
              marginLeft: 22,
              color: "#fff",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            AgentCost
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#38bdf8",
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: "uppercase",
              marginBottom: 18,
            }}
          >
            LLM Cost Observability
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Track every dollar your
          </div>
          <div
            style={{
              color: "#a3a3a3",
              fontSize: 72,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            AI agents spend.
          </div>
        </div>

        {/* Chips */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {["2,900+ models", "OpenAI · Anthropic · LangChain", "Free & MIT"].map(
            (label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid #262626",
                  backgroundColor: "#111113",
                  color: "#d4d4d4",
                  fontSize: 24,
                  padding: "12px 22px",
                  borderRadius: 999,
                  marginRight: 16,
                }}
              >
                {label}
              </div>
            ),
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
