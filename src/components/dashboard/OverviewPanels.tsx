"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentSummary } from "@/lib/api";
import { ACCENT, ACCENT_SOFT } from "@/lib/palette";

/* ─────────────────────────────────────────────
   Overview building blocks. One accent (the
   Agents indigo), one raised surface, large
   light numerals. Colour is otherwise reserved
   for status: red for spend going up or a
   breach, emerald for spend coming down.
   ───────────────────────────────────────────── */

export const SURFACE =
  "rounded-2xl border border-white/8 bg-[#131317] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

export function usd(n: number, digits = 2): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** A dollar figure with the cents set back, so the eye lands on the dollars. */
export function Money({ value, className }: { value: number; className?: string }) {
  const [whole, cents] = usd(value).split(".");
  return (
    <span className={cn("tabular-nums", className)}>
      {whole}
      <span className="text-neutral-500">.{cents}</span>
    </span>
  );
}

/** Change against the previous window. Spend going up is the bad direction. */
export function Change({ percent, className }: { percent: number | null; className?: string }) {
  if (percent === null) {
    return (
      <span className={cn("rounded-full bg-white/5 px-2 py-0.5 text-[11.5px] font-medium text-neutral-400", className)}>
        new
      </span>
    );
  }
  const flat = Math.abs(percent) < 0.05;
  const up = percent > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11.5px] font-medium tabular-nums",
        flat
          ? "bg-white/5 text-neutral-400"
          : up
            ? "bg-red-500/10 text-red-300"
            : "bg-emerald-500/10 text-emerald-300",
        className,
      )}
    >
      {!flat && <Icon className="size-3" aria-hidden />}
      {flat ? "flat" : `${Math.abs(percent).toFixed(1)}%`}
    </span>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-[11.5px] font-medium uppercase tracking-[0.12em] text-neutral-500", className)}>
      {children}
    </p>
  );
}

const TONES = {
  accent: { line: ACCENT_SOFT, glow: ACCENT },
  alert: { line: "#fca5a5", glow: "#ef4444" },
} as const;

type Point = { x: number; y: number };

/** Smooth path through the points: horizontal tangents, so no overshoot. */
function curve(pts: Point[]): string {
  return pts
    .map((p, i) => {
      if (i === 0) return `M${p.x},${p.y}`;
      const prev = pts[i - 1];
      const mid = (prev.x + p.x) / 2;
      return `C${mid},${prev.y} ${mid},${p.y} ${p.x},${p.y}`;
    })
    .join(" ");
}

function scale(data: number[], width: number, height: number, top: number, bottom: number): Point[] {
  const min = Math.min(...data);
  const span = Math.max(...data) - min || 1;
  return data.map((v, i) => ({
    x: (i * width) / (data.length - 1),
    y: height - bottom - ((v - min) / span) * (height - top - bottom),
  }));
}

/**
 * Daily spend as a glowing line. Behind it, faintly, the same days' call
 * volume: when spend climbs away from calls, each call got more expensive.
 * The peak day sits in a lit column, marked and priced.
 */
function TrendArea({
  cost,
  calls,
  tone,
}: {
  cost: number[];
  calls: number[];
  tone: keyof typeof TONES;
}) {
  const id = useId();
  if (cost.length < 2) return <div className="h-28" />;

  const W = 100;
  const H = 44;
  const { line, glow } = TONES[tone];
  const pts = scale(cost, W, H, 13, 6);
  const ghost = calls.length === cost.length ? scale(calls, W, H, 8, 10) : null;
  const path = curve(pts);

  const max = Math.max(...cost);
  const peakIndex = cost.indexOf(max);
  const peak = pts[peakIndex];
  const step = W / (cost.length - 1);
  const mean = cost.reduce((s, v) => s + v, 0) / cost.length;
  const meanY = pts.length ? H - 6 - ((mean - Math.min(...cost)) / (max - Math.min(...cost) || 1)) * (H - 19) : H / 2;
  const pct = (p: Point) => ({ left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%` });
  const peakLeft = (peak.x / W) * 100;

  return (
    <div className="relative h-28">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full overflow-visible"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={glow} stopOpacity={0.3} />
            <stop offset="100%" stopColor={glow} stopOpacity={0} />
          </linearGradient>
          <linearGradient id={`${id}-band`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity={0.015} />
          </linearGradient>
          <filter id={`${id}-blur`} x="-20%" y="-60%" width="140%" height="220%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>

        {/* The peak day's column */}
        <rect
          x={Math.max(0, peak.x - step / 2)}
          y={2}
          width={Math.min(step, W - Math.max(0, peak.x - step / 2))}
          height={H - 2}
          rx={1.5}
          fill={`url(#${id}-band)`}
        />

        {ghost && (
          <path
            d={curve(ghost)}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        )}
        <line
          x1={0}
          x2={W}
          y1={meanY}
          y2={meanY}
          stroke="rgba(255,255,255,0.2)"
          strokeDasharray="3 4"
          vectorEffect="non-scaling-stroke"
        />

        <path d={`${path} L${W},${H} L0,${H} Z`} fill={`url(#${id}-fill)`} />
        <path d={path} fill="none" stroke={glow} strokeWidth={2.2} opacity={0.75} filter={`url(#${id}-blur)`} />
        <path
          d={path}
          fill="none"
          stroke={line}
          strokeWidth={2}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {[peak].map((p, i) => (
        <span
          key={i}
          className="absolute size-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[#131317]"
          style={{ ...pct(p), borderColor: line, boxShadow: `0 0 10px ${glow}` }}
          aria-hidden
        />
      ))}
      <span
        className="absolute -translate-x-1/2 -translate-y-full whitespace-nowrap text-[11px] font-medium tabular-nums text-white"
        style={{
          left: `${Math.min(84, Math.max(16, peakLeft))}%`,
          top: `calc(${(peak.y / H) * 100}% - 10px)`,
        }}
      >
        {usd(max)}
        <span className="ml-1 font-normal text-neutral-500">peak</span>
      </span>
    </div>
  );
}

/** One of the agents that drove the bill: what it spent, how that moved, and why. */
export function TopAgentCard({ agent, rank }: { agent: AgentSummary; rank: number }) {
  const model = [...agent.models].sort((a, b) => b.cost - a.cost)[0]?.model;
  const breach = agent.signal.kind === "breach";
  // Red is for the agent whose spend actually jumped, so it stays rare enough
  // to mean something.
  const jumped = (agent.cost_change_percent ?? 0) >= 10;

  return (
    <Link
      href={`/agents/${encodeURIComponent(agent.agent_name)}`}
      className={cn(
        SURFACE,
        "group relative flex flex-col overflow-hidden p-5 transition-colors duration-200 hover:border-white/16",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 font-mono text-[12px] text-neutral-300">
            {String(rank).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-[11.5px] text-neutral-500">{model ?? "no model seen"}</p>
            <p className="truncate text-[14px] font-medium text-white">{agent.agent_name}</p>
          </div>
        </div>
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/10 text-neutral-400 transition-colors group-hover:border-white/25 group-hover:text-white">
          <ArrowUpRight className="size-3.5" aria-hidden />
        </span>
      </div>

      <p className="mt-6 text-[12px] text-neutral-500">Spend · {agent.share_percent.toFixed(0)}% of total</p>
      <Money
        value={agent.total_cost}
        className="mt-1 text-[2.1rem] font-light leading-none tracking-[-0.02em] text-white"
      />
      <div className="mt-2.5 flex items-center gap-2 text-[11.5px] text-neutral-500">
        <Change percent={agent.cost_change_percent} />
        vs previous window
      </div>

      <div className="-mx-5 mt-3">
        <TrendArea
          cost={agent.daily.map((d) => d.cost)}
          calls={agent.daily.map((d) => d.calls)}
          tone={jumped ? "alert" : "accent"}
        />
      </div>

      <p className="flex items-start gap-2 border-t border-white/6 pt-3.5 text-[12.5px] leading-snug text-neutral-400">
        <span
          className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", breach ? "bg-red-400" : "bg-indigo-300")}
          aria-hidden
        />
        <span className="line-clamp-2">
          <span className={breach ? "text-red-300" : "text-neutral-200"}>{agent.signal.title}.</span>{" "}
          {agent.signal.detail}
        </span>
      </p>
    </Link>
  );
}

/* A fixed scatter of stars: generated once from a seed so server and client
   agree and the sky does not reshuffle on every render. */
const STARS = (() => {
  let seed = 7;
  const next = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  return Array.from({ length: 46 }, () => ({
    x: next() * 100,
    y: next() * 62,
    r: 0.35 + next() * 0.75,
    o: 0.25 + next() * 0.6,
  }));
})();

/**
 * The accent panel: a night sky over a rising glow. Used once per page, for
 * the one thing worth acting on.
 */
export function AccentPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "relative flex flex-col overflow-hidden rounded-2xl border border-indigo-200/20 bg-[#0d0d16] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(199,210,254,0.92)_0%,rgba(165,180,252,0.7)_10%,rgba(129,140,248,0.42)_26%,rgba(99,102,241,0.16)_46%,transparent_68%)]" />
        <div className="absolute inset-x-[-20%] bottom-[-35%] h-[70%] rounded-[50%] bg-indigo-300/40 blur-3xl" />
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r * 0.22} fill="#fff" opacity={s.o} />
          ))}
        </svg>
        {/* A shooting star */}
        <span className="absolute right-[9%] top-[30%] h-px w-24 origin-right -rotate-[32deg] bg-linear-to-l from-white/80 via-white/25 to-transparent" />
        <span className="absolute right-[9%] top-[30%] size-[3px] -translate-y-px translate-x-px rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.7)]" />
      </div>
      <div className="relative flex flex-1 flex-col p-6 sm:p-7">{children}</div>
    </section>
  );
}

export function PanelSkeleton({ className }: { className?: string }) {
  return <div className={cn(SURFACE, "animate-pulse bg-white/[0.03]", className)} />;
}
