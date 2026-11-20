import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { AgentCostCalculator } from "@/components/calculator/AgentCostCalculator";
import { getCatalog } from "@/lib/catalog";
import {
  MONTH_DAYS,
  SCENARIOS,
  calculatorModels,
  featuredModels,
  formatTokens,
  formatUsd,
  monthlyCost,
  runCost,
  runTokens,
} from "@/lib/agent-cost";
import { SITE_URL } from "@/lib/site";
import { ORGANIZATION_ID, breadcrumbList, jsonLd } from "@/lib/structured-data";

const PATH = "/ai-agent-cost-calculator";
const TITLE = "AI Agent Cost Calculator: What an Agent Costs per Run";
const DESCRIPTION =
  "Estimate what an AI agent costs per run, per day and per month on Claude, GPT, Gemini, Grok and DeepSeek, with live pricing for every major model. See why multi-step agents cost more than the token math suggests.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { type: "website", url: PATH, title: TITLE, description: DESCRIPTION },
};

// Same daily ISR window as /docs/models: prices come from the live catalogue at
// build time and refresh once a day, so the table never quotes stale rates for long.
export const revalidate = 86400;

const RUNS_PER_DAY = 1000;

function syncedOn(lastUpdated: string | null | undefined): string | null {
  if (!lastUpdated) return null;
  const date = new Date(lastUpdated);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

export default async function AgentCostCalculatorPage() {
  const today = new Date().toISOString().slice(0, 10);
  const { models, syncStatus } = await getCatalog();
  const featured = featuredModels(models, today);
  const pickerModels = calculatorModels(models, today);
  // The picker must contain every model the comparison can select.
  const pickerNames = new Set(pickerModels.map((m) => m.model_name));
  const allPickable = [...pickerModels, ...featured.filter((m) => !pickerNames.has(m.model_name))];
  const defaultModel =
    featured.find((m) => m.model_name === "claude-sonnet-5-5")?.model_name ??
    featured[0]?.model_name ??
    allPickable[0]?.model_name ??
    "";
  const pricingDate = syncedOn(syncStatus?.last_updated);

  const research = SCENARIOS[1];
  const researchCosts = featured.map((m) => runCost(research.workload, m).total);
  const cheapest = researchCosts.length ? Math.min(...researchCosts) : null;
  const priciest = researchCosts.length ? Math.max(...researchCosts) : null;

  const tableRows = featured.map((m) => ({
    model: m,
    perRun: SCENARIOS.map((s) => runCost(s.workload, m).total),
  }));

  const coding = SCENARIOS[2];
  const codingTokens = runTokens(coding.workload);
  const codingGrowthShare = Math.round((codingTokens.growthInput / codingTokens.input) * 100);

  const faqs = [
    {
      q: "How much does an AI agent cost to run?",
      a:
        cheapest != null && priciest != null
          ? `It depends on the model and on how many steps the agent takes. A 10-step research agent costs about ${formatUsd(cheapest)} to ${formatUsd(priciest)} per run across today's major models${pricingDate ? ` (pricing as of ${pricingDate})` : ""}, which is ${formatUsd(monthlyCost(cheapest, RUNS_PER_DAY))} to ${formatUsd(monthlyCost(priciest, RUNS_PER_DAY))} a month at ${RUNS_PER_DAY.toLocaleString("en-US")} runs a day. Use the calculator above with your own step count and token sizes.`
          : "It depends on the model and on how many steps the agent takes. Enter your step count and token sizes in the calculator above to get a per-run, per-day and per-month estimate.",
    },
    {
      q: "Why do AI agents cost more than a single LLM call?",
      a: `Because every step re-sends the whole conversation. An agent's context grows with each tool result and each answer, and the model bills all of it as input again on the next step, so input tokens grow with the square of the step count. In the 30-step coding agent above, ${codingGrowthShare}% of the input tokens are context re-sent from earlier steps.`,
    },
    {
      q: "Does prompt caching reduce AI agent cost?",
      a: "Yes, when the provider publishes a cached-input rate. The system prompt and tool definitions are identical on every step, so after the first step they can be read from cache at a fraction of the input price. Turn on prompt caching in the calculator to see the difference for your model. Some providers also charge a premium to write the cache; that is not included here.",
    },
    {
      q: "How accurate is this AI agent cost calculator?",
      a: "The rates are the providers' published per-token prices, synced daily from AgentCost's model catalog. The workload is an assumption you control: real agents vary step count from run to run, retry failed calls and loop. To see the actual cost of each run, per agent, instrument the agent with AgentCost.",
    },
    {
      q: "Which model is cheapest for AI agents?",
      a: "Per token, the small models (Haiku, Flash-Lite, Nano, DeepSeek Flash) are an order of magnitude cheaper than flagship models. Per completed task, a cheaper model that needs more steps or more retries can cost more. Compare models on the same workload in the calculator, then measure real runs before switching.",
    },
  ];

  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}${PATH}#calculator`,
    name: "AI Agent Cost Calculator",
    url: `${SITE_URL}${PATH}`,
    description: DESCRIPTION,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    browserRequirements: "Requires JavaScript",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORGANIZATION_ID },
    ...(syncStatus?.last_updated ? { dateModified: syncStatus.last_updated } : {}),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const crumbs = breadcrumbList([
    { name: "AgentCost", path: "/" },
    { name: "AI Agent Cost Calculator", path: PATH },
  ]);

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(pageLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(faqLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(crumbs)} />
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
          Free tool · live pricing
        </p>
        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
          AI agent cost calculator
        </h1>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-neutral-400 sm:text-lg">
          {cheapest != null && priciest != null ? (
            <>
              A 10-step AI agent costs between{" "}
              <strong className="font-semibold text-white">{formatUsd(cheapest)}</strong> and{" "}
              <strong className="font-semibold text-white">{formatUsd(priciest)}</strong> per run on
              today&apos;s major models. The model is only half of it: agents re-send their whole context
              on every step, so cost grows faster than the step count. Set your own workload below.
            </>
          ) : (
            <>
              Estimate what your agent costs per run, per day and per month. Agents re-send their whole
              context on every step, so cost grows faster than the step count.
            </>
          )}
        </p>
        {pricingDate && (
          <p className="mt-3 text-[13px] text-neutral-600">
            Rates for {pickerModels.length} models, synced {pricingDate}.
          </p>
        )}

        <section className="mt-10" aria-label="Calculator">
          <AgentCostCalculator
            models={allPickable}
            compareModels={featured}
            defaultModel={defaultModel}
          />
        </section>

        {tableRows.length > 0 && (
          <section className="mt-20">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              What an AI agent costs per run, by model
            </h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-neutral-400">
              Three typical agents on current models, without prompt caching. Monthly figures assume{" "}
              {RUNS_PER_DAY.toLocaleString("en-US")} runs a day for {MONTH_DAYS} days.
            </p>
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full min-w-180 text-left text-[14px]">
                <thead className="bg-white/3 text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Model</th>
                    {SCENARIOS.map((s) => (
                      <th key={s.id} className="px-4 py-3 font-medium">
                        {s.name}
                        <span className="block text-[12px] font-normal text-neutral-600">
                          {s.workload.steps} steps
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 font-medium">Research agent / month</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.model.model_name} className="border-t border-white/6">
                      <td className="px-4 py-3">
                        <span className="font-mono text-[13px] text-neutral-100">{row.model.model_name}</span>
                        <span className="block text-[12px] text-neutral-600">{row.model.provider}</span>
                      </td>
                      {row.perRun.map((cost, i) => (
                        <td key={SCENARIOS[i].id} className="px-4 py-3 tabular-nums text-neutral-300">
                          {formatUsd(cost)}
                        </td>
                      ))}
                      <td className="px-4 py-3 tabular-nums text-neutral-100">
                        {formatUsd(monthlyCost(row.perRun[1], RUNS_PER_DAY))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 space-y-1 text-[13px] text-neutral-500">
              {SCENARIOS.map((s) => {
                const t = runTokens(s.workload);
                return (
                  <li key={s.id}>
                    <span className="text-neutral-400">{s.name}:</span> {s.description}{" "}
                    {formatTokens(t.input)} input and {formatTokens(t.output)} output tokens per run.
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="mt-20 grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">How AI agent cost is calculated</h2>
            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-neutral-300">
              <p>
                An LLM bills per token: input tokens at one rate, output tokens at a higher one. A chatbot
                makes one call per question, so its cost is easy to predict. An agent makes many calls per
                task, and each call carries everything that came before it.
              </p>
              <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b0b0d] p-4 font-mono text-[13px] leading-6 text-neutral-200">
{`input  = steps × base + growth × steps × (steps − 1) / 2
output = steps × output_per_step
cost   = input × input_rate + output × output_rate`}
              </pre>
              <p>
                The second term is the one that surprises people. Double the steps and the re-sent context
                roughly quadruples. In the 30-step coding agent above, {codingGrowthShare}% of the input
                tokens are context the model has already seen.
              </p>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">What drives the bill, and how to cut it</h2>
            <ul className="mt-5 space-y-4 text-[15px] leading-relaxed text-neutral-300">
              <li>
                <strong className="text-white">Step count.</strong> Fewer, better-planned steps beat a
                cheaper model that wanders. Cap iterations and stop loops early.
              </li>
              <li>
                <strong className="text-white">Tool result size.</strong> A search that returns 5,000
                tokens is paid for on every later step. Trim, summarise or drop old results.
              </li>
              <li>
                <strong className="text-white">Prompt caching.</strong> Put the system prompt and tool
                schemas first and keep them stable, so the provider can serve them from cache.
              </li>
              <li>
                <strong className="text-white">Model per step.</strong> Routing and extraction rarely need
                a flagship model. Use a small one for those steps and keep the large one for reasoning.
              </li>
              <li>
                <strong className="text-white">Retries.</strong> A failed call still bills. Retries and
                silent loops are the most common cause of an unexplained spike.
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-20 max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-white">Questions</h2>
          <div className="mt-6 space-y-7">
            {faqs.map((f) => (
              <div key={f.q}>
                <h3 className="text-[16px] font-medium text-white">{f.q}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-400">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-2xl border border-white/10 bg-[#0b0b0d] p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">
            Stop estimating. See what each agent actually spent.
          </h2>
          <p className="mt-2 max-w-2xl text-[15px] text-neutral-400">
            AgentCost records every LLM call with its real token counts and cost, and attributes it to the
            agent and step that made it. Python or TypeScript, free and open source.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#0a0a0b] hover:bg-neutral-200"
            >
              Start free <ArrowRight className="size-3.5" aria-hidden />
            </Link>
            <Link
              href="/docs/models"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-neutral-200 hover:border-white/30"
            >
              Browse all model prices
            </Link>
            <Link
              href="/docs/coding-agents"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-neutral-200 hover:border-white/30"
            >
              Track Claude Code &amp; Codex costs
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );
}
