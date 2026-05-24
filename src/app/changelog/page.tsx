import type { Metadata } from "next";
import { changelogEntries } from "@/lib/content";

export const metadata: Metadata = {
  title: "AgentCost Changelog",
  description: "Track product releases, fixes, and platform improvements.",
  alternates: { canonical: "https://agentcost.tech/changelog" },
};

export default function ChangelogPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <div className="mx-auto max-w-4xl px-6 py-20">
        <p className="text-sm uppercase tracking-widest text-emerald-400 mb-4">Changelog</p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4">
          Product updates you can trust
        </h1>
        <p className="text-neutral-400 text-lg max-w-3xl mb-12">
          Transparent release notes across platform features, API changes, and reliability upgrades.
        </p>

        <div className="space-y-6">
          {changelogEntries.map((entry) => (
            <section
              key={entry.version}
              className="rounded-2xl border border-white/10 bg-white/2 p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-2xl font-semibold text-white">{entry.version}</h2>
                <span className="text-sm text-neutral-400">{entry.date}</span>
              </div>
              <p className="text-neutral-300 mb-4">{entry.summary}</p>
              <ul className="space-y-2 text-neutral-400">
                {entry.changes.map((change, index) => (
                  <li key={index}>• {change}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
