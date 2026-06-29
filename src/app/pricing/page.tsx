import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Infinity as InfinityIcon,
  Server,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Users,
  Database,
  Gauge,
} from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { CTASection } from "@/components/landing/CTASection";
import { SavingsEstimator } from "@/components/pricing/SavingsEstimator";

export const metadata: Metadata = {
  title: "Pricing — Free & Open Source | AgentCost",
  description:
    "AgentCost is free, open-source LLM cost observability under the MIT License — no tiers, no seat limits, no paywalls. Estimate what you could recover from your AI spend.",
  alternates: { canonical: "https://agentcost.tech/pricing" },
  openGraph: {
    title: "AgentCost Pricing — Free & Open Source",
    description:
      "Free forever, MIT-licensed, self-hosted. Estimate what you could recover from your LLM spend.",
    url: "https://agentcost.tech/pricing",
  },
};

const INCLUDED = [
  { icon: InfinityIcon, label: "Unlimited events & history", sub: "No row caps, no sampling, no retention limits" },
  { icon: Users, label: "Unlimited team members", sub: "Owner / admin / member / viewer roles" },
  { icon: Database, label: "2,900+ models tracked", sub: "Pricing synced from LiteLLM, always current" },
  { icon: Gauge, label: "Real-time analytics & alerts", sub: "Dashboards, budgets, anomaly detection" },
  { icon: Server, label: "Self-host anywhere", sub: "Docker-ready · your data never leaves your infra" },
  { icon: ShieldCheck, label: "No telemetry, no lock-in", sub: "We can't see your data — you own all of it" },
];

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <Navbar />

      <section className="relative overflow-hidden px-6 pt-36 pb-16">
        {/* Single-hue ambient glow (flat, on-brand) */}
        <div className="pointer-events-none absolute left-1/2 top-10 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-sky-500/5 blur-[120px]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
            Pricing
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
            The tool is free.
            <br />
            <span className="text-neutral-500">The savings are not.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            AgentCost is fully open-source under the MIT License — no tiers, no
            seat limits, no paywalled features. You pay nothing; you keep
            everything you save.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-[13px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-emerald-300">
              <Check className="size-3.5" /> $0 / month, forever
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-neutral-300">
              <GitBranch className="size-3.5" /> MIT open source
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/3 px-3 py-1.5 text-neutral-300">
              <Server className="size-3.5" /> Self-hosted
            </span>
          </div>
        </div>
      </section>

      {/* Savings estimator — the unique, interactive part */}
      <section className="px-6 pb-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold tracking-tight text-white">
                Estimate what you&apos;ll recover
              </h2>
              <p className="text-[13px] text-neutral-500">
                Because the real question isn&apos;t what AgentCost costs — it&apos;s
                what your untracked spend does.
              </p>
            </div>
          </div>
          <SavingsEstimator />
        </div>
      </section>

      {/* The single free plan */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0d] p-8 sm:p-10">
            <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-sky-500/5 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-sky-400/80">
                  The only plan
                </p>
                <h3 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  Free
                </h3>
                <p className="mt-1 text-[14px] text-neutral-500">
                  Everything, for everyone. Self-hosted on your infrastructure.
                </p>
              </div>
              <div className="text-right">
                <span className="text-5xl font-bold tracking-tight text-white">
                  $0
                </span>
                <span className="text-base text-neutral-500"> / month</span>
              </div>
            </div>

            <div className="my-8 h-px w-full bg-white/8" />

            <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {INCLUDED.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    <item.icon className="size-3.5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-white">
                      {item.label}
                    </p>
                    <p className="text-[12.5px] text-neutral-500">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/auth/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#0a0a0b] transition-colors hover:bg-neutral-100"
              >
                Start tracking free
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo?src=pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Explore the live demo
              </Link>
            </div>
            <p className="mt-5 font-mono text-[11px] tracking-wide text-neutral-700">
              No credit card · No usage limits · No vendor lock-in
            </p>
          </div>

          {/* Honest "why free" note */}
          <p className="mx-auto mt-8 max-w-2xl text-center text-[13px] leading-relaxed text-neutral-500">
            Why free? Cost observability shouldn&apos;t cost you more. AgentCost
            is open source so you can read every line, run it yourself, and trust
            that the numbers it reports are the only thing it&apos;s after.
          </p>
        </div>
      </section>

      <CTASection />
      <Footer />
    </main>
  );
}
