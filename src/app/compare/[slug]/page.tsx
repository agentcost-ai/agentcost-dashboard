import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { comparisons, getComparison } from "@/lib/comparisons";

type Params = { slug: string };

export async function generateStaticParams(): Promise<Params[]> {
  return comparisons.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return { title: "Comparison Not Found" };

  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `https://agentcost.tech/compare/${c.slug}` },
  };
}

export default async function ComparePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: c.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const others = comparisons.filter((o) => o.slug !== c.slug);

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <Navbar />

      <article className="mx-auto max-w-4xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
          Comparison
        </p>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
          {c.title}
        </h1>
        <p className="mt-6 text-base leading-relaxed text-neutral-400 sm:text-lg">
          {c.whatTheyAre}
        </p>

        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-neutral-300">
          {c.intro.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Feature / pricing table */}
        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight text-white">
          AgentCost vs {c.competitor} at a glance
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-160 text-left text-[14px]">
            <thead className="bg-white/3 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Feature</th>
                <th className="px-4 py-3 font-medium text-white">AgentCost</th>
                <th className="px-4 py-3 font-medium">{c.competitor}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row) => (
                <tr key={row.feature} className="border-t border-white/6">
                  <td className="px-4 py-3 text-neutral-400">{row.feature}</td>
                  <td className="px-4 py-3 text-neutral-100">{row.agentcost}</td>
                  <td className="px-4 py-3 text-neutral-400">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12.5px] text-neutral-600">
          {c.competitor} details read from{" "}
          <a
            href={c.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
          >
            their own pricing page
          </a>{" "}
          on {c.verifiedOn}. Pricing changes — check the source before deciding.
        </p>

        {/* Honest both-ways guidance */}
        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/2 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              When to choose {c.competitor}
            </h2>
            <ul className="space-y-3">
              {c.chooseThem.map((item) => (
                <li key={item} className="flex gap-2.5 text-[14px] text-neutral-400">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-neutral-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/4 p-6">
            <h2 className="mb-4 text-lg font-semibold text-white">
              When to choose AgentCost
            </h2>
            <ul className="space-y-3">
              {c.chooseUs.map((item) => (
                <li key={item} className="flex gap-2.5 text-[14px] text-neutral-300">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-sky-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ — matches the FAQPage JSON-LD above */}
        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight text-white">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {c.faqs.map((f) => (
            <div key={f.q}>
              <h3 className="text-[15px] font-medium text-white">{f.q}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-neutral-400">
                {f.a}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl border border-white/10 bg-[#0b0b0d] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">
            Try AgentCost in two minutes
          </h2>
          <p className="mt-2 text-[14px] text-neutral-400">
            Free, MIT-licensed, self-hosted. No signup needed for the live demo.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/demo?src=compare"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#0a0a0b] transition-colors hover:bg-neutral-100"
            >
              Explore the live demo
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href="/docs/sdk"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Read the docs
            </Link>
          </div>
        </div>

        {/* Internal links — never leave a page as a crawl dead-end */}
        <div className="mt-12 border-t border-white/6 pt-6">
          <p className="mb-3 text-[13px] text-neutral-500">Other comparisons</p>
          <div className="flex flex-wrap gap-3">
            {others.map((o) => (
              <Link
                key={o.slug}
                href={`/compare/${o.slug}`}
                className="rounded-full border border-white/10 px-4 py-1.5 text-[13px] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
              >
                {o.title}
              </Link>
            ))}
            <Link
              href="/pricing"
              className="rounded-full border border-white/10 px-4 py-1.5 text-[13px] text-neutral-400 transition-colors hover:border-white/20 hover:text-white"
            >
              AgentCost pricing
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
