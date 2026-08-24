"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Grid2x2Plus } from "lucide-react";
import { track } from "@/lib/analytics";
import { comparisons } from "@/lib/comparisons";
import { AnnotatedArrow } from "./AnnotatedArrow";

const columns = [
  {
    title: "Product",
    links: [
      // Root-anchored so they work from /pricing, /blog, etc.
      { label: "Features", href: "/#features" },
      { label: "Integration", href: "/#integration" },
      { label: "Pricing", href: "/pricing" },
      { label: "Dashboard", href: "/auth/login" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "API Reference", href: "/docs/api" },
      { label: "Model Catalog", href: "/docs/models" },
      { label: "MCP Server", href: "/docs/mcp" },
      // external: a raw file, not an app route — <Link> would try a client-side
      // navigation to a non-page and fall back to a hard load.
      // llms.txt is deliberately NOT listed: agents probe /llms.txt by
      // convention rather than following links, and it reads as noise to a
      // human. It stays linked from /docs and the 404 page.
      { label: "OpenAPI Spec", href: "/openapi.json", external: true },
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
  {
    // Generated from lib/comparisons.ts so a new comparison page is linked
    // site-wide the moment it exists — no crawl-orphan pages.
    title: "Compare",
    links: comparisons.map((c) => ({
      label: `vs ${c.competitor}`,
      href: `/compare/${c.slug}`,
    })),
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      {
        label: "GitHub",
        href: "https://github.com/agentcost-ai",
        external: true,
      },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      {
        label: "License (MIT)",
        href: "https://github.com/agentcost-ai/agentcost-sdk/blob/main/LICENSE",
      },
    ],
  },
];

/* Cost-skyline layers. Each path is a jagged cost-chart silhouette that tiles
   at x=1440 (same y at both ends), duplicated via <use> so a translateX(-50%)
   loop is seamless. Flat fills only — depth comes from layering, not
   gradients. */
const HILL_BACK =
  "M0,96 L80,88 L140,110 L220,70 L300,104 L380,60 L460,92 L540,52 L620,96 " +
  "L700,78 L780,116 L860,66 L940,98 L1020,58 L1100,90 L1180,74 L1260,108 " +
  "L1340,64 L1440,96 L1440,240 L0,240 Z";
const HILL_MID =
  "M0,150 L70,138 L150,164 L230,124 L310,158 L390,118 L470,150 L550,132 " +
  "L630,168 L710,126 L790,156 L870,140 L950,172 L1030,122 L1110,152 " +
  "L1190,136 L1270,166 L1350,128 L1440,150 L1440,240 L0,240 Z";
const HILL_FRONT =
  "M0,176 L90,164 L170,192 L250,148 L330,180 L410,140 L490,172 L570,154 " +
  "L650,196 L730,144 L810,176 L890,158 L970,198 L1050,146 L1130,178 " +
  "L1210,160 L1290,192 L1370,150 L1440,176 L1440,240 L0,240 Z";
/* The front layer's top edge, stroked — the skyline IS a cost line. */
const COST_LINE =
  "M0,176 L90,164 L170,192 L250,148 L330,180 L410,140 L490,172 L570,154 " +
  "L650,196 L730,144 L810,176 L890,158 L970,198 L1050,146 L1130,178 " +
  "L1210,160 L1290,192 L1370,150 L1440,176";
/* A few "data points" on the cost line's peaks and valleys. */
const LINE_DOTS: Array<[number, number]> = [
  [250, 148],
  [410, 140],
  [650, 196],
  [730, 144],
  [970, 198],
  [1050, 146],
  [1370, 150],
];

function SkylineLayer({
  path,
  fill,
  heightClass,
  driftClass,
  zClass,
  line,
}: {
  path: string;
  fill: string;
  heightClass: string;
  driftClass: string;
  zClass: string;
  line?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute bottom-0 left-0 w-[200%] ${zClass}`}
    >
      <div className={`${driftClass} will-change-transform`}>
        <svg
          className={`block w-full ${heightClass}`}
          viewBox="0 0 2880 240"
          preserveAspectRatio="none"
        >
          {[0, 1440].map((x) => (
            <g key={x} transform={`translate(${x},0)`}>
              <path d={path} fill={fill} />
              {line && (
                <>
                  <path
                    d={COST_LINE}
                    fill="none"
                    stroke="#38bdf8"
                    strokeOpacity="0.32"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  {LINE_DOTS.map(([cx, cy]) => (
                    <circle
                      key={cx}
                      cx={cx}
                      cy={cy}
                      r="3.5"
                      fill="#38bdf8"
                      fillOpacity="0.45"
                    />
                  ))}
                </>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

const letterVariants = {
  hidden: { y: "0.45em", opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Footer() {
  const stageRef = useRef<HTMLDivElement>(null);
  // Amount-based, no rootMargin: the stage hugs the page bottom, and on short
  // viewports a negative margin excludes it entirely — the reveal never fired
  // on phones.
  const stageInView = useInView(stageRef, { once: true, amount: 0.3 });

  return (
    <footer className="relative overflow-hidden border-t border-white/6 bg-[#07070a]">
      {/* Link columns */}
      <div className="relative z-30 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 sm:pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8 sm:gap-10">
          {/* Brand column — description only. No mini logo lockup: the navbar
              carries the brand up top and the giant wordmark carries it below,
              a third repeat here was noise. Double-width (col-span-2 of 6),
              the classic footer shape: wide description column, narrow link
              columns. Flex so the meta line centers in the leftover height. */}
          <div className="col-span-2 flex flex-col">
            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
              Open-source LLM cost observability. Track, analyze, and optimize
              your AI spending.
            </p>

            {/* Meta — one row: year, then the two chips */}
            <div className="flex-1 flex flex-col justify-center mt-8">
              <div className="flex flex-nowrap items-center gap-x-2 text-xs whitespace-nowrap text-neutral-500">
                <span>AgentCost © {new Date().getFullYear()}</span>
                <span
                  aria-hidden
                  className="size-1 rounded-full bg-neutral-700"
                />
                <a
                  href="https://github.com/agentcost-ai/agentcost-sdk/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/8 px-2.5 py-1 text-neutral-500 hover:border-white/20 hover:text-neutral-300 transition-colors"
                >
                  MIT License
                </a>
                <a
                  href="https://github.com/agentcost-ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => track("github_clicked", { location: "footer" })}
                  className="flex items-center gap-1.5 rounded-full border border-white/8 px-2.5 py-1 text-neutral-500 hover:border-white/20 hover:text-neutral-300 transition-colors"
                >
                  <svg
                    className="size-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-400 mb-4">
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-neutral-500 hover:text-neutral-200 transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="inline-block text-sm text-neutral-500 hover:text-neutral-200 transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Brand stage — giant wordmark over a drifting cost skyline */}
      <div ref={stageRef} className="relative mt-4 sm:mt-2">
        <h2 className="sr-only">AgentCost</h2>

        {/* Back layers drift behind the wordmark. Heights track the clamped
            wordmark size per breakpoint so the front layer overlaps the lower
            third of the letters and never swallows them. */}
        <SkylineLayer
          path={HILL_BACK}
          fill="#141824"
          heightClass="h-14 sm:h-20 md:h-28 lg:h-40 xl:h-44 2xl:h-52"
          driftClass="footer-drift-slow"
          zClass="z-0"
        />
        <SkylineLayer
          path={HILL_MID}
          fill="#10141f"
          heightClass="h-11 sm:h-16 md:h-20 lg:h-32 xl:h-36 2xl:h-40"
          driftClass="footer-drift-mid"
          zClass="z-0"
        />

        {/* Handwritten annotation — our landing signature. Mounted only when
            the stage scrolls into view so the draw-in actually plays. */}
        {stageInView && (
          <AnnotatedArrow
            label="every token, accounted for"
            dir="left"
            delay={0.9}
            className="absolute right-[6%] top-1 z-30 hidden -rotate-6 sm:flex"
          />
        )}

        {/* Wordmark */}
        <motion.div
          aria-hidden
          initial="hidden"
          animate={stageInView ? "show" : "hidden"}
          transition={{ staggerChildren: 0.045, delayChildren: 0.1 }}
          className="relative z-10 flex select-none items-baseline justify-center whitespace-nowrap px-2 pt-6 sm:pt-2 -mb-[0.16em] text-[clamp(3.4rem,14vw,13rem)] font-bold leading-none tracking-[-0.045em] text-neutral-100"
        >
          <motion.span
            variants={letterVariants}
            className="mr-[0.1em] inline-flex self-center translate-y-[0.04em]"
          >
            <Grid2x2Plus
              className="size-[0.56em] text-sky-400"
              strokeWidth={2.2}
            />
          </motion.span>
          {"AgentCost".split("").map((ch, i) => (
            <motion.span
              key={i}
              variants={letterVariants}
              whileHover={{ y: "-0.05em" }}
              className="inline-block"
            >
              {ch}
            </motion.span>
          ))}
        </motion.div>

        {/* Front layer overlaps the letterforms, like the inspiration's
            foreground clouds — its top edge stroked as a live cost line */}
        <SkylineLayer
          path={HILL_FRONT}
          fill="#0b0e15"
          heightClass="h-8 sm:h-12 md:h-16 lg:h-24 xl:h-28 2xl:h-32"
          driftClass="footer-drift-fast"
          zClass="z-20"
          line
        />
      </div>
    </footer>
  );
}
