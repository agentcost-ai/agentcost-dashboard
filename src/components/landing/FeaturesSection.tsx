import { FeatureCarousel } from "./FeatureCarousel";

/* ─────────────────────────────────────────────
   Capabilities — the section header plus the
   capability carousel (FeatureCarousel.tsx).
   ───────────────────────────────────────────── */

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">
            Capabilities
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
            Your invoice says what you spent.
            <br />
            <span className="text-neutral-500">It never says what you spent it on.</span>
          </h2>
          <p className="mt-5 text-[17px] leading-7 text-neutral-300">
            Nine things AgentCost tells you that a token total cannot — for
            what already ran, and for what you are about to ship.
          </p>
        </div>

        <div className="mt-14">
          <FeatureCarousel />
        </div>
      </div>
    </section>
  );
}
