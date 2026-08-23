/**
 * Site-wide JSON-LD.
 *
 * Lifted out of app/layout.tsx so the graph has one definition and the pages
 * that need to extend it (about, contact, docs) reference the same @id values
 * instead of restating the organisation.
 */

import { CONTACT_EMAIL, SITE_URL } from "@/lib/site";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const FOUNDER_ID = `${SITE_URL}/#founder`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;

export type PostalAddress = {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  /** ISO 3166-1 alpha-2, e.g. "IN". */
  addressCountry: string;
};

/**
 * The registered business address, published in Organization JSON-LD and on
 * /contact. Null until a real address is supplied — an invented one would be
 * worse than none, since this is exactly the field an AI checks to decide
 * whether a business is real.
 */
export const ORGANIZATION_ADDRESS: PostalAddress | null = null;

function postalAddress(address: PostalAddress) {
  return { "@type": "PostalAddress", ...address };
}

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: "AgentCost",
    alternateName: ["Agent Cost", "AgentCost.tech"],
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
    slogan: "Real-time LLM cost observability",
    description:
      "AgentCost is an open-source LLM cost observability platform with a free hosted cloud. Track, analyze, and optimize OpenAI, Anthropic, Gemini, and LangChain spending in real time across 3,500+ models.",
    foundingDate: "2026-02",
    email: CONTACT_EMAIL,
    knowsAbout: [
      "LLM cost tracking",
      "AI agent observability",
      "OpenAI API pricing",
      "Anthropic API pricing",
      "LangChain instrumentation",
      "FinOps for AI",
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
        url: `${SITE_URL}/contact`,
        availableLanguage: ["English"],
      },
      {
        "@type": "ContactPoint",
        contactType: "technical support",
        email: CONTACT_EMAIL,
        url: `${SITE_URL}/docs`,
        availableLanguage: ["English"],
      },
    ],
    ...(ORGANIZATION_ADDRESS ? { address: postalAddress(ORGANIZATION_ADDRESS) } : {}),
    sameAs: [
      "https://github.com/agentcost-ai",
      "https://pypi.org/project/agentcost/",
      "https://dev.to/kushagra125",
    ],
    founder: { "@id": FOUNDER_ID },
  };
}

export function founderSchema() {
  return {
    "@type": "Person",
    "@id": FOUNDER_ID,
    name: "Kushagra Agrawal",
    url: "https://www.linkedin.com/in/kushagra--agrawal/",
    sameAs: [
      "https://www.linkedin.com/in/kushagra--agrawal/",
      "https://x.com/KushagraA15",
      "https://github.com/DS-Kushagra",
    ],
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: "AgentCost",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function softwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: "AgentCost",
    url: SITE_URL,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    description:
      "Real-time LLM cost tracking and optimization for OpenAI, Anthropic, Gemini, and LangChain across 3,500+ models.",
    downloadUrl: "https://pypi.org/project/agentcost/",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** The graph rendered on every page from the root layout. */
export function siteGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      founderSchema(),
      websiteSchema(),
      softwareApplicationSchema(),
    ],
  };
}

/** Breadcrumbs for a nested page. Pass paths relative to the site root. */
export function breadcrumbList(
  trail: { name: string; path: string }[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };
}

/** Serialise a schema object for a <script type="application/ld+json"> tag. */
export function jsonLd(schema: unknown): { __html: string } {
  return { __html: JSON.stringify(schema) };
}
