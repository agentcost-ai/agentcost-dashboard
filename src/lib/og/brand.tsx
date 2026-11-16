/**
 * Shared pieces of the Open Graph cards (1200x630).
 *
 * Deliberately plain: the site's own background, its two typefaces, hairline
 * rules, and the real product where a picture is needed. No glows, gradients,
 * pills or illustrative numbers -- a share card should look like the product,
 * not like a template.
 *
 * Satori rules apply: every element with more than one child needs
 * `display: flex`, and there is no CSS grid.
 */

import type { ReactNode } from "react";
import { SANS } from "./fonts";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  bg: "#0a0a0b",
  rule: "#262626",
  text: "#fafafa",
  muted: "#a3a3a3",
  dim: "#737373",
  faint: "#525252",
  sky: "#38bdf8",
};

export const PAD_X = 72;

/** The AgentCost mark (same paths as public/icon.svg). */
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={C.sky}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v17a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1H3" />
      <path d="M16 19h6" />
      <path d="M19 22v-6" />
    </svg>
  );
}

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        backgroundColor: C.bg,
        fontFamily: SANS,
        color: C.text,
        padding: `60px ${PAD_X}px 56px`,
      }}
    >
      {children}
    </div>
  );
}

/** Wordmark on the left, the page's address on the right. */
export function Header({ url = "agentcost.tech" }: { url?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Mark size={28} />
        <div style={{ display: "flex", marginLeft: 12, fontSize: 24, fontWeight: 600, letterSpacing: -0.3 }}>
          AgentCost
        </div>
      </div>
      <div style={{ display: "flex", fontSize: 20, color: C.dim }}>{url}</div>
    </div>
  );
}

/** A hairline rule with a line of small text either side. */
export function Footer({ left, right }: { left: string; right?: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderTop: `1px solid ${C.rule}`,
        paddingTop: 22,
        fontSize: 20,
        color: C.dim,
      }}
    >
      <div style={{ display: "flex" }}>{left}</div>
      {right ? <div style={{ display: "flex" }}>{right}</div> : null}
    </div>
  );
}

/** Small uppercase label above a headline. */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: 2.2,
        color: C.dim,
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}
