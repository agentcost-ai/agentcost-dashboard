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

/**
 * The site name and its fallbacks, shared by WebSite and Organization (Google:
 * "use the same name and alternateName that you're using for your site name").
 *
 * "AgentCost" is also used by agentcost.in and agentcost.ai, and Google "generally
 * won't use the same site name for two different sites that are global in nature".
 * Its documented fallback is the lowercase domain as the LAST alternateName,
 * which Google says it will "strongly consider".
 * https://developers.google.com/search/docs/appearance/site-names
 */
export const SITE_NAME = "AgentCost";
export const SITE_ALTERNATE_NAMES = ["Agent Cost", "agentcost.tech"];

/**
 * Raster logo for Organization markup. Google requires at least 112x112px, a
 * crawlable URL, and a Google Images format; a PNG avoids any doubt about SVG.
 */
export const LOGO = {
  "@type": "ImageObject",
  url: `${SITE_URL}/logo.png`,
  contentUrl: `${SITE_URL}/logo.png`,
  width: 512,
  height: 512,
  caption: "AgentCost logo",
} as const;

export const GITHUB_ORG_URL = "https://github.com/agentcost-ai";
export const PYPI_URL = "https://pypi.org/project/agentcost/";
export const SDK_REPO_URL = "https://github.com/agentcost-ai/agentcost-sdk";

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    url: SITE_URL,
    logo: LOGO,
    image: LOGO.url,
    slogan: "Never wonder which agent spiked your AI bill again",
    description:
      "AgentCost traces every LLM call to the agent, run and step that made it, so a spike in your AI bill always has a name. Open source with a free hosted cloud, covering OpenAI, Anthropic, Gemini and LangChain across 3,500+ models.",
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
    // Profiles that are verifiably ours. The GitHub org has agentcost.tech as a
    // verified domain, which is the strongest off-site tie between the name and
    // this site. Add a LinkedIn company page, X account, Product Hunt, Crunchbase
    // or Wikidata item here once they exist -- never a URL that isn't ours.
    sameAs: [GITHUB_ORG_URL, PYPI_URL, "https://dev.to/kushagra125"],
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
    // Google reads the site name from THIS node on the homepage; Organization
    // alone does not set it.
    url: SITE_URL, // must equal the homepage canonical exactly
    name: SITE_NAME,
    alternateName: SITE_ALTERNATE_NAMES,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function softwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    "@id": SOFTWARE_ID,
    name: SITE_NAME,
    alternateName: "agentcost",
    url: SITE_URL,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Any",
    image: LOGO.url,
    isAccessibleForFree: true,
    license: `${SDK_REPO_URL}/blob/main/LICENSE`,
    sameAs: [SDK_REPO_URL, PYPI_URL],
    description:
      "Traces every LLM call to the agent, run and step that made it, for OpenAI, Anthropic, Gemini and LangChain across 3,500+ models.",
    downloadUrl: PYPI_URL,
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
