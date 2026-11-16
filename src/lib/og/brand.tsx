/**
 * Shared pieces of the Open Graph cards (1200x630). Satori rules apply: every
 * element with more than one child needs `display: flex`, and there is no CSS
 * grid, so layout is flex rows and columns throughout.
 */

import type { ReactNode } from "react";
import { MONO, SANS } from "./fonts";

export const OG_SIZE = { width: 1200, height: 630 };

export const C = {
  bg: "#07070a",
  panel: "#0d0d11",
  border: "rgba(255,255,255,0.09)",
  text: "#fafafa",
  muted: "#a3a3a3",
  faint: "#525252",
  sky: "#38bdf8",
  skyDeep: "#0284c7",
  amber: "#fbbf24",
  red: "#f87171",
};

/** The AgentCost mark (same paths as public/icon.svg). */
export function Mark({ size = 40 }: { size?: number }) {
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

/** Background: near-black, a faint engineering grid, and a sky glow top-right. */
export function Frame({ children, glow = C.sky }: { children: ReactNode; glow?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: C.bg,
        fontFamily: SANS,
        color: C.text,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: -260,
          right: -200,
          width: 760,
          height: 760,
          display: "flex",
          borderRadius: 9999,
          backgroundImage: `radial-gradient(circle, ${glow}33 0%, ${glow}10 38%, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: "56px 64px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** Top bar: mark + wordmark on the left, an optional label on the right. */
export function Header({ right }: { right?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <Mark size={38} />
        <div style={{ marginLeft: 14, fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>AgentCost</div>
      </div>
      {right ? (
        <div
          style={{
            display: "flex",
            fontFamily: MONO,
            fontSize: 18,
            color: C.muted,
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            padding: "8px 18px",
            backgroundColor: "rgba(255,255,255,0.03)",
          }}
        >
          {right}
        </div>
      ) : null}
    </div>
  );
}

export function Chip({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        fontSize: 19,
        color: "#d4d4d4",
        border: `1px solid ${C.border}`,
        backgroundColor: "rgba(255,255,255,0.03)",
        borderRadius: 999,
        padding: "9px 18px",
        marginRight: 12,
      }}
    >
      {children}
    </div>
  );
}

/** Daily spend bars, flat except for one spike. Heights are in px. */
export const SPEND_BARS = [34, 40, 31, 44, 38, 47, 36, 42, 39, 45, 41, 300, 52, 0];

export function SpikeBars({
  bars = SPEND_BARS,
  barWidth = 22,
  gap = 9,
  spikeColor = C.amber,
}: {
  bars?: number[];
  barWidth?: number;
  gap?: number;
  spikeColor?: string;
}) {
  const spike = Math.max(...bars);
  return (
    <div style={{ display: "flex", alignItems: "flex-end" }}>
      {bars.map((height, index) => {
        const isSpike = height === spike;
        return (
          <div
            key={index}
            style={{
              display: "flex",
              width: barWidth,
              height: Math.max(height, 4),
              marginRight: gap,
              borderRadius: 5,
              backgroundImage: isSpike
                ? `linear-gradient(180deg, ${spikeColor} 0%, ${C.red} 100%)`
                : "linear-gradient(180deg, rgba(56,189,248,0.55) 0%, rgba(56,189,248,0.18) 100%)",
              boxShadow: isSpike ? `0 0 42px ${spikeColor}88` : "none",
              opacity: height === 0 ? 0.25 : 1,
            }}
          />
        );
      })}
    </div>
  );
}
