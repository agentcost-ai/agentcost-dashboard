"use client";

import { useState } from "react";

function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/**
 * Interactive savings estimator. Honest by design: the recoverable share is a
 * user-set assumption (not a guarantee), the result is clearly labelled an
 * estimate, and the levers named are the ones the product actually surfaces
 * (model right-sizing + prompt caching).
 */
export function SavingsEstimator() {
  const [spend, setSpend] = useState(3000);
  const [rate, setRate] = useState(25);

  const monthly = (spend * rate) / 100;
  const annual = monthly * 12;
  const keptPct = 100 - rate;

  return (
    <div className="rounded-2xl border border-white/8 bg-[#0b0b0d] p-6 sm:p-8">
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-7">
          <div>
            <label className="mb-2 block text-[13px] font-medium text-neutral-300">
              Your monthly LLM spend
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/2 px-4 py-3 focus-within:border-sky-500/40">
              <span className="text-lg font-semibold text-neutral-500">$</span>
              <input
                type="number"
                min={0}
                step={100}
                value={spend}
                onChange={(e) =>
                  setSpend(Math.max(0, Number(e.target.value) || 0))
                }
                className="w-full bg-transparent text-lg font-semibold text-white outline-none tabular-nums"
              />
              <span className="text-[13px] text-neutral-600">/ mo</span>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-[13px] font-medium text-neutral-300">
                Recoverable share (your assumption)
              </label>
              <span className="text-[13px] font-semibold text-sky-400 tabular-nums">
                {rate}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={1}
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <p className="mt-2 text-[12px] leading-relaxed text-neutral-500">
              Most recoverable spend comes from right-sizing over-powered models
              and caching repeated prompts — the two levers AgentCost surfaces
              for you automatically.
            </p>
          </div>
        </div>

        {/* Output */}
        <div className="flex flex-col justify-between gap-5 rounded-xl border border-white/6 bg-white/2 p-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-neutral-500">
              Estimated savings
            </p>
            <p className="mt-2 text-[2.6rem] font-bold leading-none tracking-tight text-emerald-400 tabular-nums">
              {formatUsd(monthly)}
              <span className="text-base font-medium text-neutral-500">
                {" "}
                / mo
              </span>
            </p>
            <p className="mt-1.5 text-[13px] text-neutral-400 tabular-nums">
              ≈ {formatUsd(annual)} per year recovered
            </p>
          </div>

          {/* Flat split bar: kept vs recoverable */}
          <div>
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full bg-neutral-600"
                style={{ width: `${keptPct}%` }}
              />
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11.5px] text-neutral-500">
              <span>Current spend</span>
              <span className="text-emerald-400">Recoverable</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-white/8 bg-[#0b0b0d] px-4 py-3">
            <span className="text-[13px] text-neutral-400">
              What AgentCost costs you
            </span>
            <span className="text-lg font-bold text-white">$0</span>
          </div>
        </div>
      </div>

      <p className="mt-5 text-[11.5px] text-neutral-600">
        Illustrative estimate — actual savings depend on your models, traffic,
        and prompt patterns. AgentCost shows you the specific opportunities; you
        decide what to act on.
      </p>
    </div>
  );
}
