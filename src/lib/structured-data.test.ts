import { describe, expect, it } from "vitest";

import { CONTACT_EMAIL, SITE_URL } from "./site";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ID,
  breadcrumbList,
  jsonLd,
  SITE_ALTERNATE_NAMES,
  SITE_NAME,
  organizationSchema,
  siteGraph,
  websiteSchema,
} from "./structured-data";

describe("Organization schema", () => {
  const organization = organizationSchema() as Record<string, unknown>;

  it("carries a contactPoint with an email and a contactType", () => {
    // The audit's finding: an Organization with no contactPoint gives an AI no
    // way to verify the business or answer a contact question.
    const points = organization.contactPoint as Record<string, unknown>[];
    expect(Array.isArray(points)).toBe(true);
    expect(points.length).toBeGreaterThan(0);
    for (const point of points) {
      expect(point["@type"]).toBe("ContactPoint");
      expect(point.contactType).toBeTruthy();
      expect(point.email).toBe(CONTACT_EMAIL);
    }
  });

  it("publishes a well-formed PostalAddress when one is configured", () => {
    // ORGANIZATION_ADDRESS is null until a real address is supplied — an
    // invented one would be worse than none. When it is set, it must be
    // complete enough to be a valid schema.org PostalAddress.
    if (ORGANIZATION_ADDRESS === null) {
      expect(organization.address).toBeUndefined();
      return;
    }
    const address = organization.address as Record<string, unknown>;
    expect(address["@type"]).toBe("PostalAddress");
    expect(address.addressCountry).toMatch(/^[A-Z]{2}$/);
  });

  it("keeps the fields the site already published", () => {
    expect(organization.name).toBe("AgentCost");
    expect(organization.url).toBe(SITE_URL);
    expect(organization.slogan).toBe("Never wonder which agent spiked your AI bill again");
    expect(organization.sameAs).toEqual([
      "https://github.com/agentcost-ai",
      "https://pypi.org/project/agentcost/",
      "https://dev.to/kushagra125",
    ]);
    expect(organization.founder).toEqual({ "@id": `${SITE_URL}/#founder` });
  });

  it("adds the entity signals a brand-name search leans on", () => {
    expect(organization.email).toBe(CONTACT_EMAIL);
    expect(organization.foundingDate).toBeTruthy();
    expect((organization.knowsAbout as string[]).length).toBeGreaterThan(0);
  });
});

describe("site name and logo (Google Search Central rules)", () => {
  const organization = organizationSchema() as Record<string, unknown>;
  const website = websiteSchema() as Record<string, unknown>;

  it("puts name and alternateName on the WebSite node, where Google reads the site name", () => {
    expect(website.name).toBe(SITE_NAME);
    expect(website.url).toBe(SITE_URL);
    expect(website.alternateName).toEqual(SITE_ALTERNATE_NAMES);
  });

  it("ends alternateName with the lowercase domain, Google's documented fallback", () => {
    const names = SITE_ALTERNATE_NAMES as readonly string[];
    expect(names.at(-1)).toBe(new URL(SITE_URL).hostname);
    expect(names.at(-1)).toBe(names.at(-1)?.toLowerCase());
  });

  it("uses the same name and alternateName on Organization", () => {
    expect(organization.name).toBe(website.name);
    expect(organization.alternateName).toEqual(website.alternateName);
  });

  it("publishes a raster logo of at least 112x112px", () => {
    const logo = organization.logo as Record<string, unknown>;
    expect(logo["@type"]).toBe("ImageObject");
    expect(String(logo.url)).toMatch(/\.png$/);
    expect(Number(logo.width)).toBeGreaterThanOrEqual(112);
    expect(Number(logo.height)).toBeGreaterThanOrEqual(112);
  });
});

describe("the site graph", () => {
  const graph = siteGraph()["@graph"] as Record<string, unknown>[];

  it("holds exactly one node of each expected type", () => {
    expect(graph.map((node) => node["@type"])).toEqual([
      "Organization",
      "Person",
      "WebSite",
      "SoftwareApplication",
    ]);
  });

  it("wires every node back to the same Organization @id", () => {
    const website = graph.find((node) => node["@type"] === "WebSite");
    const software = graph.find((node) => node["@type"] === "SoftwareApplication");
    expect(website?.publisher).toEqual({ "@id": ORGANIZATION_ID });
    expect(software?.publisher).toEqual({ "@id": ORGANIZATION_ID });
  });

  it("serialises to valid JSON", () => {
    expect(() => JSON.parse(jsonLd(siteGraph()).__html)).not.toThrow();
  });
});

describe("breadcrumbList", () => {
  it("numbers positions from 1 and makes items absolute", () => {
    const crumbs = breadcrumbList([
      { name: "AgentCost", path: "/" },
      { name: "Documentation", path: "/docs" },
    ]) as { itemListElement: Record<string, unknown>[] };

    expect(crumbs.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "AgentCost", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Documentation",
        item: `${SITE_URL}/docs`,
      },
    ]);
  });
});
