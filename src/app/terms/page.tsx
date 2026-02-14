"use client";

import Link from "next/link";
import { Grid2x2Plus, ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
  const lastUpdated = "January 30, 2026";

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-[#0a0a0b]/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Home</span>
            </Link>
            <Link href="/" className="flex items-center gap-2 text-white">
              <Grid2x2Plus className="size-5" />
              <span className="text-lg font-semibold">AgentCost</span>
            </Link>
            <div className="w-16" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <article className="prose prose-invert prose-lg max-w-none">
          {/* Title */}
          <div className="mb-12 pb-8 border-b border-gray-800/50">
            <h1 className="text-4xl font-bold text-white mb-4">
              Terms of Service
            </h1>
            <p className="text-gray-400 text-base">
              Last updated: {lastUpdated}
            </p>
            <p className="text-gray-400 text-base mt-2">Version 1.0</p>
          </div>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                1
              </span>
              Acceptance of Terms
            </h2>
            <div className="text-gray-300 leading-relaxed space-y-4 pl-11">
              <p>
                By accessing or using AgentCost ("the Service"), you agree to be
                bound by these Terms of Service ("Terms"). If you do not agree
                to these Terms, you may not use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you
                and AgentCost. Your continued use of the Service following any
                modifications to these Terms constitutes acceptance of those
                changes.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                2
              </span>
              Description of Service
            </h2>
            <div className="text-gray-300 leading-relaxed space-y-4 pl-11">
              <p>
                AgentCost is a cost tracking and analytics platform for AI
                agents and Large Language Model (LLM) applications. The Service
                enables users to monitor, analyze, and optimize their AI-related
                expenditures through API integration and dashboard analytics.
              </p>
              <p>
                The Service is provided "as is" and "as available" without
                warranties of any kind, either express or implied, including but
                not limited to warranties of merchantability, fitness for a
                particular purpose, or non-infringement.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                3
              </span>
              User Responsibilities
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <p className="mb-4">As a user of the Service, you agree to:</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Maintain the security and confidentiality of your API keys
                    and account credentials. You are solely responsible for all
                    activities that occur under your account.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Use the Service only for lawful purposes and in compliance
                    with all applicable laws and regulations.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Not attempt to gain unauthorized access to any portion of
                    the Service, other accounts, computer systems, or networks
                    connected to the Service.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Not interfere with or disrupt the integrity or performance
                    of the Service or the data contained therein.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Provide accurate and complete information when creating your
                    account and keep this information up to date.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                4
              </span>
              Data Collection and Usage
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Data We Collect
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Agent identifiers and names</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>
                      Model usage information (model names, provider details)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Token counts (input and output)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Cost calculations and usage statistics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Timestamps and latency metrics</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                <h3 className="text-lg font-medium text-green-400 mb-3">
                  Data We Do NOT Collect
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>Your actual prompts or queries sent to LLMs</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>LLM responses or generated content</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>
                      Personal data beyond account registration information
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>
                      Sensitive business data or proprietary information
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                5
              </span>
              Limitations of Liability
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <p className="mb-4">
                To the maximum extent permitted by applicable law, AgentCost and
                its officers, directors, employees, and agents shall not be
                liable for:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Inaccurate cost calculations or estimations. Cost data is
                    provided for informational purposes and should be verified
                    against your LLM provider's billing statements.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Service interruptions, downtime, or unavailability, whether
                    scheduled or unscheduled.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Loss of data, whether due to technical failures, security
                    breaches, or other causes.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Any indirect, incidental, special, consequential, or
                    punitive damages arising from your use of the Service.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                6
              </span>
              Account Termination
            </h2>
            <div className="text-gray-300 leading-relaxed space-y-4 pl-11">
              <p>
                We reserve the right to suspend or terminate your account and
                access to the Service at our sole discretion, without prior
                notice, for conduct that we determine violates these Terms or is
                harmful to other users, us, or third parties, or for any other
                reason.
              </p>
              <p>
                You may terminate your account at any time by contacting us or
                using the account deletion feature in your settings. Upon
                termination, your right to use the Service will immediately
                cease.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                7
              </span>
              Modifications to Terms
            </h2>
            <div className="text-gray-300 leading-relaxed space-y-4 pl-11">
              <p>
                We reserve the right to modify these Terms at any time. When we
                make changes, we will update the "Last updated" date at the top
                of this page and, where appropriate, notify you via email or
                through the Service.
              </p>
              <p>
                Your continued use of the Service after any such modifications
                constitutes your acceptance of the revised Terms. If you do not
                agree to the modified Terms, you must discontinue your use of
                the Service.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                8
              </span>
              Governing Law
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <p>
                These Terms shall be governed by and construed in accordance
                with applicable laws, without regard to conflict of law
                principles. Any disputes arising under these Terms shall be
                resolved through binding arbitration or in the courts of
                competent jurisdiction.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                9
              </span>
              Contact Information
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <p className="mb-4">
                For questions, concerns, or requests regarding these Terms of
                Service, please contact us at:
              </p>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <a
                  href="mailto:hello@agentcost.tech"
                  className="text-white hover:text-gray-300 transition-colors font-medium"
                >
                  hello@agentcost.tech
                </a>
              </div>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex flex-wrap gap-6 text-sm">
              <Link
                href="/privacy"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/auth/register"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Create Account
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
