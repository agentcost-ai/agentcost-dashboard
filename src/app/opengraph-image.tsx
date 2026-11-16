import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { C, Frame, Header, OG_SIZE, PAD_X } from "@/lib/og/brand";
import { DISPLAY, ogFonts } from "@/lib/og/fonts";

// Site-wide share card, used by every page without its own. The homepage's
// question, answered by the real product: the Agents page ranking agents by
// spend (demo data, the same capture as the hero). Regenerate the crop with
// `node scripts/og-screenshot.mjs` when the hero capture changes.
export const alt =
  "AgentCost. Your AI bill spiked. Which agent did it? Below, the AgentCost Agents page ranking each agent by spend, with cost per run, cache rate and guardrail breaches.";
export const size = OG_SIZE;
export const contentType = "image/png";

// Crop is 1700x488; shown 1150 wide it bleeds off the right and bottom edges.
const SHOT_WIDTH = 1150;
const SHOT_HEIGHT = Math.round((1150 * 488) / 1700);

export default async function OpenGraphImage() {
  const shot = await readFile(join(process.cwd(), "src/assets/og/agents-ranked.png"));
  const shotSrc = `data:image/png;base64,${shot.toString("base64")}`;

  return new ImageResponse(
    (
      <Frame>
        <Header />
        <div style={{ display: "flex", flexDirection: "column", marginTop: 46 }}>
          <div style={{ display: "flex", fontFamily: DISPLAY, fontSize: 64, lineHeight: 1.06, letterSpacing: -1.4 }}>
            Your AI bill spiked.
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: DISPLAY,
              fontSize: 64,
              lineHeight: 1.06,
              letterSpacing: -1.4,
              color: C.dim,
            }}
          >
            Which agent did it?
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element -- Satori, not the DOM */}
        <img
          src={shotSrc}
          width={SHOT_WIDTH}
          height={SHOT_HEIGHT}
          alt=""
          style={{
            position: "absolute",
            left: PAD_X,
            top: 318,
            borderTopLeftRadius: 14,
            border: `1px solid ${C.rule}`,
          }}
        />
      </Frame>
    ),
    { ...OG_SIZE, fonts: await ogFonts() },
  );
}
