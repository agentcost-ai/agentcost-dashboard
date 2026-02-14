"use client";

import Link from "next/link";
import { Grid2x2Plus, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
            <p className="text-gray-400 text-base">
              Last updated: {lastUpdated}
            </p>
            <p className="text-gray-400 text-base mt-2">Version 1.0</p>
          </div>

          {/* Introduction */}
          <section className="mb-10">
            <p className="text-gray-300 leading-relaxed">
              At AgentCost, we are committed to protecting your privacy and
              ensuring the security of your data. This Privacy Policy explains
              how we collect, use, store, and protect information when you use
              our service.
            </p>
          </section>

          {/* Section 1 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                1
              </span>
              Information We Collect
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Account Information
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>
                      Email address (required for account creation and
                      authentication)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Display name (optional)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>
                      Password (stored securely using industry-standard hashing)
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Usage Metadata
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Agent names and identifiers you define</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Model names and providers used</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Token counts (input and output)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>API call timestamps and latency metrics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Calculated costs based on token usage</span>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">
                  Technical Information
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>
                      IP addresses (for security and consent verification)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>
                      Browser and device information (user agent strings)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                    <span>Session information for authentication</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-green-500/10 text-green-400 text-sm font-bold">
                2
              </span>
              Information We Do NOT Collect
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
                <p className="mb-4 font-medium text-green-400">
                  We are committed to your privacy. We explicitly do NOT
                  collect:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>
                      <strong className="text-white">
                        Your prompts or queries
                      </strong>{" "}
                      — The actual content you send to LLMs is never transmitted
                      to or stored by AgentCost
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>
                      <strong className="text-white">LLM responses</strong> —
                      The content generated by AI models is never captured by
                      our service
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>
                      <strong className="text-white">
                        Sensitive business data
                      </strong>{" "}
                      — We only track metadata about usage, not the content of
                      your work
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2.5 shrink-0" />
                    <span>
                      <strong className="text-white">
                        Personal information beyond email
                      </strong>{" "}
                      — We do not collect names, addresses, phone numbers, or
                      payment information
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                3
              </span>
              How We Use Your Information
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">
                      Provide cost tracking analytics
                    </strong>{" "}
                    — Calculate and display your AI usage costs and patterns
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">
                      Generate optimization insights
                    </strong>{" "}
                    — Analyze usage patterns to suggest cost-saving
                    opportunities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">Improve the service</strong>{" "}
                    — Use aggregated, anonymized data to enhance features and
                    performance
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">
                      Communicate important updates
                    </strong>{" "}
                    — Send service announcements, security alerts, and policy
                    changes
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">Ensure security</strong> —
                    Detect and prevent unauthorized access or abuse
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
              Data Storage and Security
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11 space-y-4">
              <p>
                Your data is stored securely using PostgreSQL with
                industry-standard encryption. We implement multiple layers of
                security to protect your information:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    Passwords are hashed using bcrypt with secure salt
                    generation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    API keys are cryptographically generated and securely stored
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    All data transmission is encrypted using TLS/HTTPS
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>JWT tokens are used for secure session management</span>
                </li>
              </ul>
              <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-lg mt-4">
                <p className="text-blue-300">
                  <strong className="text-white">Self-Hosted Option:</strong>{" "}
                  AgentCost can be self-hosted, giving you complete control over
                  your data storage and security. When self-hosted, your data
                  never leaves your infrastructure.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                5
              </span>
              Data Sharing
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11 space-y-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="font-medium text-white mb-3">
                  Our commitment to your privacy:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>We do NOT sell your data to third parties</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>We do NOT share your data with advertisers</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>
                      We do NOT use your data for purposes other than providing
                      the service
                    </span>
                  </li>
                </ul>
              </div>
              <p>
                We may share aggregated, anonymized statistics publicly to
                demonstrate service usage patterns. Such data cannot be used to
                identify individual users or their specific usage.
              </p>
              <p>
                We may disclose information if required by law, such as in
                response to a valid subpoena or court order.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                6
              </span>
              Your Rights
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11">
              <p className="mb-4">
                You have the following rights regarding your data:
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">Right to Access</strong> —
                    Request a copy of the personal data we hold about you
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">
                      Right to Rectification
                    </strong>{" "}
                    — Request correction of inaccurate personal data
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">Right to Erasure</strong> —
                    Request deletion of your account and associated data
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">
                      Right to Data Portability
                    </strong>{" "}
                    — Export your data in a machine-readable format through the
                    dashboard
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 shrink-0" />
                  <span>
                    <strong className="text-white">
                      Right to Withdraw Consent
                    </strong>{" "}
                    — Withdraw your consent at any time by discontinuing use of
                    the service
                  </span>
                </li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us at the email
                address below.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                7
              </span>
              Data Retention
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11 space-y-4">
              <p>
                We retain your personal data for as long as your account is
                active or as needed to provide you with the Service. Usage data
                and analytics are retained to provide historical cost tracking
                and trend analysis.
              </p>
              <p>
                Upon account deletion, we will delete or anonymize your personal
                data within 30 days, except where we are required to retain
                certain information for legal or legitimate business purposes.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 text-white text-sm font-bold">
                8
              </span>
              Changes to This Policy
            </h2>
            <div className="text-gray-300 leading-relaxed pl-11 space-y-4">
              <p>
                We may update this Privacy Policy from time to time. When we
                make significant changes, we will notify you by email and update
                the "Last updated" date at the top of this page.
              </p>
              <p>
                We encourage you to review this Privacy Policy periodically.
                Your continued use of the Service after any changes indicates
                your acceptance of the updated policy.
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
                For questions, concerns, or requests regarding this Privacy
                Policy or your personal data, please contact us at:
              </p>
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <a
                  href="mailto:hello@agentcost.tech"
                  className="text-white hover:text-gray-300 transition-colors font-medium"
                >
                  hello@agentcost.tech
                </a>
              </div>
              <p className="mt-4 text-gray-400 text-sm">
                We aim to respond to all privacy-related inquiries within 72
                hours.
              </p>
            </div>
          </section>

          {/* Footer Links */}
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="flex flex-wrap gap-6 text-sm">
              <Link
                href="/terms"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Terms of Service
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
