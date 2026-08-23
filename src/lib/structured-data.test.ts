import { describe, expect, it } from "vitest";

import { CONTACT_EMAIL, SITE_URL } from "./site";
import {
  ORGANIZATION_ADDRESS,
  ORGANIZATION_ID,
  breadcrumbList,
  jsonLd,
  organizationSchema,
  siteGraph,
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
    expect(organization.logo).toBe(`${SITE_URL}/icon.svg`);
    expect(organization.slogan).toBe("Real-time LLM cost observability");
    expect(organization.alternateName).toEqual(["Agent Cost", "AgentCost.tech"]);
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
