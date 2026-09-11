import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { BookingLink } from "@/components/BookingLink";
import { CopyEmail } from "@/components/CopyEmail";
import { API_URL, BOOKING_URL, SITE_URL } from "@/lib/site";
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

type Action =
  | { kind: "mail"; label: string }
  | { kind: "internal"; label: string; href: string }
  | { kind: "external"; label: string; href: string }
  | { kind: "booking"; label: string };

interface Route {
  subject: string;
  body: string;
  action: Action;
}

const ROUTES: Route[] = [
  {
    subject: "Support",
    body: "Installing the SDK, wiring up a project, or matching the dashboard to your provider invoice.",
    action: { kind: "mail", label: "Copy email" },
  },
  {
    subject: "Bugs and requests",
    body: "Open an issue so it is public and trackable. The dashboard also has a feedback board.",
    action: { kind: "external", label: "GitHub", href: "https://github.com/agentcost-ai" },
  },
  {
    subject: "Security",
    body: "Email reproduction steps. No public issue first; give us a chance to ship a fix.",
    action: { kind: "mail", label: "Copy email" },
  },
  {
    subject: "Data and deletion",
    body: "Export or delete your data, or ask what is stored. Every transmitted field is documented.",
    action: { kind: "internal", label: "Privacy docs", href: "/docs/privacy" },
  },
  {
    subject: "Press and partnerships",
    body: "Coverage, integrations, or anything commercial.",
    action: { kind: "mail", label: "Copy email" },
  },
  {
    subject: "A call",
    body: "Team rollout, self-hosting, or fit. Thirty minutes with the founder.",
    action: { kind: "booking", label: "Book" },
  },
];

const AGENT_ENDPOINTS = [
  { path: "/openapi.json", label: `${SITE_URL}/openapi.json`, note: "The full contract." },
  { path: "/llms.txt", label: `${SITE_URL}/llms.txt`, note: "This site, indexed, with when-to-use guidance." },
  { path: "/api/v1/pricing", label: `${SITE_URL}/api/v1/pricing`, note: "The catalogue, cached and always awake." },
  { path: null, label: API_URL, note: "The origin, which sleeps when idle." },
];

const ACTION_CLASS =
  "group inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-neutral-300 transition-colors hover:text-white";
const ARROW_CLASS =
  "size-3.5 transition-transform duration-200 group-hover:translate-x-0.5";

function RouteAction({ action }: { action: Action }) {
  switch (action.kind) {
    case "mail":
      return (
        <CopyEmail location="contact_row" icon className={ACTION_CLASS}>
          {action.label}
        </CopyEmail>
      );
    case "internal":
      return (
        <Link href={action.href} className={ACTION_CLASS}>
          {action.label}
          <ArrowRight className={ARROW_CLASS} aria-hidden />
        </Link>
      );
    case "external":
      return (
        <a href={action.href} target="_blank" rel="noopener noreferrer" className={ACTION_CLASS}>
          {action.label}
          <ArrowUpRight className={ARROW_CLASS} aria-hidden />
        </a>
      );
    case "booking":
      return (
        <BookingLink location="contact_row" className={ACTION_CLASS}>
          {action.label}
          <ArrowUpRight className={ARROW_CLASS} aria-hidden />
        </BookingLink>
      );
  }
}

export default function ContactPage() {
  const contactLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact AgentCost",
    url: `${SITE_URL}/contact`,
    description: metadata.description,
    mainEntity: { "@id": ORGANIZATION_ID },
  };

  const routes = BOOKING_URL ? ROUTES : ROUTES.filter((r) => r.action.kind !== "booking");

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

      <article className="mx-auto max-w-6xl px-4 pt-32 pb-24 sm:px-6 sm:pt-36 lg:px-8">
        <div className="grid gap-x-20 gap-y-14 lg:grid-cols-[1fr_1.3fr]">
          {/* Left: the statement and the person */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-neutral-500">
              Contact
            </p>
            <h1 className="font-display mt-5 text-[2.6rem] font-normal leading-[1.05] tracking-[-0.02em] text-white sm:text-[3.4rem]">
              <span className="block">A person,</span>
              <span className="block">not a queue.</span>
            </h1>
            <p className="mt-6 max-w-[40ch] text-[17px] leading-7 text-neutral-400">
              One address for everything:{" "}
              <CopyEmail
                location="contact_intro"
                className="text-neutral-100 underline underline-offset-4 hover:text-white"
              />
              . It is read and answered by the person who builds AgentCost.
            </p>

            {BOOKING_URL ? (
              <div className="mt-12 border-t border-white/8 pt-8">
                <p className="text-[15px] font-medium text-white">Kushagra Agrawal</p>
                <p className="mt-0.5 text-[13px] text-neutral-500">Founder and maintainer</p>
                <p className="mt-4 max-w-[40ch] text-[15px] leading-7 text-neutral-400">
                  Some questions go faster out loud: rolling AgentCost out across
                  a team, the self-hosted install, or whether it fits what you
                  are building. Thirty minutes, no slide deck.
                </p>
                <BookingLink
                  location="contact"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-[#0a0a0b] transition-colors hover:bg-neutral-200"
                >
                  Book 30 minutes
                  <ArrowUpRight className="size-3.5" aria-hidden />
                </BookingLink>
              </div>
            ) : null}
          </div>

          {/* Right: the routes */}
          <ul className="divide-y divide-white/8 border-t border-white/8">
            {routes.map((route) => (
              <li
                key={route.subject}
                className="grid gap-x-8 gap-y-2 py-6 sm:grid-cols-[10.5rem_1fr_auto] sm:items-baseline"
              >
                <h2 className="text-[15px] font-medium text-white">{route.subject}</h2>
                <p className="text-[14px] leading-6 text-neutral-400">{route.body}</p>
                <div className="sm:justify-self-end">
                  <RouteAction action={route.action} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Agents */}
        <div className="mt-24 grid gap-x-20 gap-y-8 border-t border-white/8 pt-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <h2 className="text-[15px] font-medium text-white">If you are an agent</h2>
            <p className="mt-3 max-w-[40ch] text-[14px] leading-6 text-neutral-400">
              You do not need to contact anyone. The model catalogue and the
              cost estimator are open, need no credentials, and are described
              in a published OpenAPI specification.
            </p>
          </div>
          <ul className="divide-y divide-white/8">
            {AGENT_ENDPOINTS.map((e) => (
              <li
                key={e.label}
                className="grid gap-x-8 gap-y-1 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-baseline"
              >
                {e.path ? (
                  // Route handlers, not pages: <Link> would client-navigate into a non-page.
                  <a
                    href={e.path}
                    className="font-mono text-[13px] text-neutral-200 underline-offset-4 hover:underline"
                  >
                    {e.label}
                  </a>
                ) : (
                  <span className="font-mono text-[13px] text-neutral-500">{e.label}</span>
                )}
                <span className="text-[13.5px] text-neutral-500">{e.note}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <address className="mt-16 border-t border-white/8 pt-8 text-[13px] leading-6 text-neutral-500 not-italic">
          <p>
            <span className="text-neutral-300">AgentCost</span> · Founded and
            maintained by Kushagra Agrawal
            {ORGANIZATION_ADDRESS ? (
              <>
                {" · "}
                {[
                  ORGANIZATION_ADDRESS.streetAddress,
                  ORGANIZATION_ADDRESS.addressLocality,
                  ORGANIZATION_ADDRESS.addressRegion,
                  ORGANIZATION_ADDRESS.postalCode,
                  ORGANIZATION_ADDRESS.addressCountry,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </>
            ) : null}
          </p>
          <p>
            <a
              href="https://github.com/agentcost-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-neutral-300 hover:underline"
            >
              github.com/agentcost-ai
            </a>
            {" · "}
            <a
              href="https://pypi.org/project/agentcost/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-4 hover:text-neutral-300 hover:underline"
            >
              pypi.org/project/agentcost
            </a>
            {" · "}
            <Link href="/terms" className="underline-offset-4 hover:text-neutral-300 hover:underline">
              Terms
            </Link>
            {" · "}
            <Link href="/privacy" className="underline-offset-4 hover:text-neutral-300 hover:underline">
              Privacy
            </Link>
          </p>
        </address>
      </article>

      <Footer />
    </main>
  );
}
