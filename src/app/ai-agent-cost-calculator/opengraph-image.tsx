import { ImageResponse } from "next/og";
import { getCatalog } from "@/lib/catalog";
import { SCENARIOS, featuredModels, formatUsd, runCost } from "@/lib/agent-cost";
import { C, Frame, Header, OG_SIZE } from "@/lib/og/brand";
import { DISPLAY, MONO, ogFonts } from "@/lib/og/fonts";

// Share card for the calculator: the same 10-step agent priced on live rates,
// so the spread between models is the hook.
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
  // Spread: the priciest, two in between, the cheapest.
  const picks =
    rows.length >= 4
      ? [
          rows[0],
          rows[Math.floor(rows.length / 3)],
          rows[Math.floor((2 * rows.length) / 3)],
          rows[rows.length - 1],
        ]
      : rows;
  const max = picks[0]?.total ?? 0;
  const min = picks[picks.length - 1]?.total ?? 0;
  const multiple = picks.length > 1 && min > 0 ? Math.round(max / min) : null;

  return new ImageResponse(
    (
      <Frame glow={C.amber}>
        <Header right="free calculator" />
        <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", width: 520 }}>
            <div style={{ display: "flex", fontFamily: MONO, fontSize: 18, color: C.amber, letterSpacing: 2 }}>
              SAME AGENT · SAME TASK
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 20,
                fontFamily: DISPLAY,
                fontSize: 60,
                lineHeight: 1.08,
                letterSpacing: -1.2,
              }}
            >
              What does your AI agent cost per run?
            </div>
            <div style={{ display: "flex", marginTop: 22, fontSize: 23, lineHeight: 1.4, color: C.muted }}>
              {multiple
                ? `Up to ${multiple}x apart on identical work, at live prices.`
                : "Per run, per day, per month. Live pricing for every major model."}
            </div>
          </div>
          {picks.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: "auto",
                width: 500,
                padding: "26px 28px",
                borderRadius: 22,
                border: `1px solid ${C.border}`,
                backgroundColor: "rgba(13,13,17,0.92)",
              }}
            >
              <div style={{ display: "flex", fontFamily: MONO, fontSize: 15, color: C.faint, letterSpacing: 1 }}>
                10-STEP RESEARCH AGENT · PER RUN
              </div>
              {picks.map((row, index) => (
                <div key={row.name} style={{ display: "flex", flexDirection: "column", marginTop: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", fontFamily: MONO, fontSize: 18, color: "#d4d4d4" }}>
                      {row.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        fontSize: 22,
                        fontWeight: 600,
                        color: index === 0 ? C.amber : C.text,
                      }}
                    >
                      {formatUsd(row.total)}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      marginTop: 8,
                      height: 10,
                      borderRadius: 6,
                      backgroundColor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        width: `${max > 0 ? Math.max((row.total / max) * 100, 2) : 0}%`,
                        height: 10,
                        borderRadius: 6,
                        backgroundImage:
                          index === 0
                            ? `linear-gradient(90deg, ${C.amber}, ${C.red})`
                            : "linear-gradient(90deg, rgba(56,189,248,0.4), rgba(56,189,248,0.9))",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div style={{ display: "flex", fontFamily: MONO, fontSize: 18, color: C.muted }}>
          agentcost.tech/ai-agent-cost-calculator
        </div>
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
