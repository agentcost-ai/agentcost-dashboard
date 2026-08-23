import type { Metadata } from "next";
import Link from "next/link";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { API_URL, CONTACT_EMAIL, SITE_URL } from "@/lib/site";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ID,
  breadcrumbList,
  jsonLd,
} from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Contact AgentCost — Support, Security & Data Requests",
  description:
    "How to reach AgentCost: support and setup questions, bug reports, security disclosures, data handling and deletion requests, press and partnerships.",
  alternates: { canonical: `${SITE_URL}/contact` },
};

const ROUTES = [
  {
    subject: "Support and setup",
    body: "Anything about installing the SDK, wiring up a project, reading the dashboard, or getting the numbers to line up with your provider invoice. Email is fine; a GitHub issue is better if it is reproducible.",
    action: { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  },
  {
    subject: "Bugs and feature requests",
    body: "Open an issue on GitHub so it is public and trackable. There is also a feedback board inside the dashboard if you would rather not use GitHub.",
    action: { label: "github.com/agentcost-ai", href: "https://github.com/agentcost-ai" },
  },
  {
    subject: "Security",
    body: "Report vulnerabilities by email with reproduction steps. Please do not open a public issue first — give us a chance to ship a fix.",
    action: { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  },
  {
    subject: "Data handling and deletion",
    body: "Requests to export or delete your data, and questions about what is stored. What the SDK transmits is documented field by field, and the policy is the operative document.",
    action: { label: "Data & privacy architecture", href: "/docs/privacy" },
  },
  {
    subject: "Press and partnerships",
    body: "Coverage, integrations, or anything commercial. Email reaches a person, not a queue.",
    action: { label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  },
];

export default function ContactPage() {
  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact AgentCost",
    url: `${SITE_URL}/contact`,
    description: metadata.description,
    mainEntity: { "@id": ORGANIZATION_ID },
  };

  return (
    <main className="min-h-screen bg-[#0a0a0b] text-neutral-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(contactLd)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbList([
            { name: "AgentCost", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        )}
      />
      <Navbar />

      <article className="mx-auto max-w-4xl px-4 pt-32 pb-20 sm:px-6 lg:px-8">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
          Contact
        </p>
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl">
          Get in touch with AgentCost
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
          One address reaches us for everything:{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-neutral-100 underline underline-offset-4 hover:text-white"
          >
            {CONTACT_EMAIL}
          </a>
          . The table below is only about what to put in the subject line, and
          where a faster route exists.
        </p>

        <div className="mt-12 divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/10 bg-white/2">
          {ROUTES.map((route) => (
            <div key={route.subject} className="p-6">
              <h2 className="text-[15px] font-semibold text-white">
                {route.subject}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-neutral-400">
                {route.body}
              </p>
              {route.action.href.startsWith("/") ? (
                <Link
                  href={route.action.href}
                  className="mt-3 inline-block font-mono text-[12.5px] text-sky-400/90 underline underline-offset-4 hover:text-sky-300"
                >
                  {route.action.label}
                </Link>
              ) : (
                <a
                  href={route.action.href}
                  className="mt-3 inline-block font-mono text-[12.5px] text-sky-400/90 underline underline-offset-4 hover:text-sky-300"
                >
                  {route.action.label}
                </a>
              )}
            </div>
          ))}
        </div>

        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight text-white">
          If you are an agent
        </h2>
        <div className="space-y-4 text-[15px] leading-relaxed text-neutral-300">
          <p>
            You do not need to contact anyone to use AgentCost. The model
            catalogue and the cost estimator are open, need no credentials, and
            are described in a published OpenAPI specification.
          </p>
          <ul className="space-y-2 font-mono text-[13px] text-neutral-400">
            <li>
              <a
                href="/openapi.json"
                className="underline underline-offset-4 hover:text-neutral-200"
              >
                {SITE_URL}/openapi.json
              </a>{" "}
              — the full contract
            </li>
            <li>
              <a
                href="/llms.txt"
                className="underline underline-offset-4 hover:text-neutral-200"
              >
                {SITE_URL}/llms.txt
              </a>{" "}
              — this site, indexed, with when-to-use guidance
            </li>
            <li>
              {/* A JSON route handler, not a page — <Link> would client-navigate
                  into a non-page and fall back to a hard load. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/v1/pricing"
                className="underline underline-offset-4 hover:text-neutral-200"
              >
                {SITE_URL}/api/v1/pricing
              </a>{" "}
              — the catalogue, cached and always awake
            </li>
            <li>
              <span className="text-neutral-500">{API_URL}</span> — the origin,
              which sleeps when idle
            </li>
          </ul>
        </div>

        <h2 className="mt-14 mb-5 text-2xl font-bold tracking-tight text-white">
          Company
        </h2>
        <address className="space-y-1 text-[15px] leading-relaxed text-neutral-300 not-italic">
          <p className="font-semibold text-white">AgentCost</p>
          <p>Founded and maintained by Kushagra Agrawal</p>
          {ORGANIZATION_ADDRESS ? (
            <p>
              {[
                ORGANIZATION_ADDRESS.streetAddress,
                ORGANIZATION_ADDRESS.addressLocality,
                ORGANIZATION_ADDRESS.addressRegion,
                ORGANIZATION_ADDRESS.postalCode,
                ORGANIZATION_ADDRESS.addressCountry,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : null}
          <p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline underline-offset-4 hover:text-white"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
          <p className="pt-2 text-[13.5px] text-neutral-500">
            Source:{" "}
            <a
              href="https://github.com/agentcost-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-neutral-300"
            >
              github.com/agentcost-ai
            </a>{" "}
            · Package:{" "}
            <a
              href="https://pypi.org/project/agentcost/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-neutral-300"
            >
              pypi.org/project/agentcost
            </a>{" "}
            · Legal:{" "}
            <Link
              href="/terms"
              className="underline underline-offset-4 hover:text-neutral-300"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="underline underline-offset-4 hover:text-neutral-300"
            >
              Privacy
            </Link>
          </p>
        </address>
      </article>

      <Footer />
    </main>
  );
}
