import { ImageResponse } from "next/og";
import { getCatalog } from "@/lib/catalog";
import { SCENARIOS, featuredModels, formatUsd, runCost } from "@/lib/agent-cost";
import { C, Footer, Frame, Header, Kicker, OG_SIZE } from "@/lib/og/brand";
import { DISPLAY, MONO, ogFonts } from "@/lib/og/fonts";

// Share card for the calculator: the same 10-step agent priced per run on live
// rates, set as a plain table. The spread between the rows is the hook.
export const alt =
  "AI agent cost calculator: the same 10-step agent priced per run on today's major models";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 86400;

export default async function CalculatorOgImage() {
  const today = new Date().toISOString().slice(0, 10);
  const { models } = await getCatalog();
  const workload = SCENARIOS[1].workload;
  const rows = featuredModels(models, today)
    .map((m) => ({ name: m.model_name, total: runCost(workload, m).total }))
    .sort((a, b) => b.total - a.total);
  // The priciest, three spread through the middle, and the cheapest.
  const picks =
    rows.length >= 5
      ? [0, 0.25, 0.5, 0.75, 1].map((q) => rows[Math.round(q * (rows.length - 1))])
      : rows;

  return new ImageResponse(
    (
      <Frame>
        <Header url="agentcost.tech/ai-agent-cost-calculator" />
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 500 }}>
            <Kicker>Free calculator</Kicker>
            <div
              style={{
                display: "flex",
                marginTop: 18,
                fontFamily: DISPLAY,
                fontSize: 62,
                lineHeight: 1.06,
                letterSpacing: -1.3,
              }}
            >
              What does your AI agent cost per run?
            </div>
          </div>

          {picks.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", marginLeft: "auto", width: 470 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottom: `1px solid ${C.rule}`,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: 1.6,
                  color: C.faint,
                  textTransform: "uppercase",
                }}
              >
                <div style={{ display: "flex" }}>Same 10-step agent</div>
                <div style={{ display: "flex" }}>Per run</div>
              </div>
              {picks.map((row) => (
                <div
                  key={row.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    padding: "15px 0",
                    borderBottom: `1px solid ${C.rule}`,
                  }}
                >
                  <div style={{ display: "flex", fontFamily: MONO, fontSize: 20, color: C.muted }}>{row.name}</div>
                  <div style={{ display: "flex", fontSize: 26, fontWeight: 600, color: C.text }}>
                    {formatUsd(row.total)}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Footer left="Live pricing for every major model" right="Per run, per day, per month" />
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
