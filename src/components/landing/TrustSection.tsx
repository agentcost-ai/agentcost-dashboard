import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PrivacyPlayer } from "./PrivacyPlayer";

/* ─────────────────────────────────────────────
   Privacy — copy on the left, the event itself
   on the right (PrivacyPlayer.tsx). Every claim
   mirrors /docs/privacy, which links to the SDK
   source that builds each field.
   ───────────────────────────────────────────── */

const PROOF: Array<[string, string]> = [
  [
    "Verifiable, not promised",
    "The wire payload is documented field by field, and each field links to the open-source SDK line that builds it.",
  ],
  [
    "Hashed, not stored",
    "Duplicate detection uses a SHA-256 digest computed locally from the prompt. Only the one-way digest leaves your process.",
  ],
  [
    "Self-host for zero exposure",
    "The same MIT-licensed stack runs on your infrastructure with Docker. Nothing leaves your environment — no telemetry, no phone-home.",
  ],
];

export function TrustSection() {
  return (
    <section id="privacy" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-20">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-sky-400">
              Privacy
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-[2.6rem]">
              Built to know what your agents cost.
              <br />
              <span className="text-neutral-500">Never what they said.</span>
            </h2>
            <p className="mt-5 text-[17px] leading-7 text-neutral-300">
              The SDK is a metadata-only tracker. An event is token counts,
              timings and cost. Open any field on the right to see exactly where
              it comes from — and press <span className="text-white">+</span> for
              everything that never leaves your process.
            </p>

            <dl className="mt-10 divide-y divide-white/8 border-y border-white/8">
              {PROOF.map(([title, body]) => (
                <div key={title} className="grid gap-1.5 py-5 sm:grid-cols-[12rem_1fr] sm:gap-8">
                  <dt className="text-[15px] font-medium text-white">{title}</dt>
                  <dd className="text-[15px] leading-6 text-neutral-400">{body}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[15px]">
              <Link
                href="/docs/privacy"
                className="inline-flex items-center gap-1.5 font-medium text-white transition-colors hover:text-neutral-300"
              >
                Read the data contract
                <ArrowRight size={15} aria-hidden />
              </Link>
              <Link href="/privacy" className="text-neutral-400 transition-colors hover:text-white">
                Privacy policy
              </Link>
            </div>
          </div>

          <PrivacyPlayer />
        </div>
      </div>
    </section>
  );
}
