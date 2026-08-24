import { afterEach, describe, expect, it, vi } from "vitest";

import { TOOLS, TOOLS_BY_NAME, callTool } from "./tools";

// The tools read the catalogue through lib/catalog; stub that boundary so the
// tests exercise the tool logic rather than the network.
vi.mock("@/lib/catalog", () => ({
  fetchRawCatalog: vi.fn(),
}));

const { fetchRawCatalog } = await import("@/lib/catalog");
const mockCatalog = vi.mocked(fetchRawCatalog);

const CATALOG = {
  "gpt-4o": { input: 0.0025, output: 0.01, cached_input: 0.00125, provider: "openai", mode: "chat", deprecation_date: null },
  "gpt-3.5-turbo": { input: 0.0005, output: 0.0015, cached_input: null, provider: "openai", mode: "chat", deprecation_date: "2026-12-31" },
  "claude-sonnet-4-6": { input: 0.003, output: 0.015, cached_input: null, provider: "anthropic", mode: "chat", deprecation_date: null },
  "gemini-2-flash": { input: 0.0001, output: 0.0004, cached_input: null, provider: "google", mode: "chat", deprecation_date: "2026-09-01" },
};

function withCatalog() {
  mockCatalog.mockResolvedValue({ pricing: CATALOG } as never);
}

afterEach(() => vi.resetAllMocks());

describe("tool definitions", () => {
  it("gives every tool a name, description and object inputSchema", () => {
    for (const tool of TOOLS) {
      expect(tool.name, tool.name).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(tool.description.length, tool.name).toBeGreaterThan(40);
      expect(tool.inputSchema.type, tool.name).toBe("object");
      expect(tool.title, tool.name).toBeTruthy();
    }
  });

  it("declares an outputSchema so clients can validate structuredContent", () => {
    for (const tool of TOOLS) {
      expect(tool.outputSchema, tool.name).toBeTruthy();
    }
  });

  it("marks every tool read-only, because none of them writes anything", () => {
    for (const tool of TOOLS) {
      expect(tool.annotations, tool.name).toMatchObject({ readOnlyHint: true });
    }
  });

  it("has unique names and a lookup that agrees with the list", () => {
    expect(TOOLS_BY_NAME.size).toBe(TOOLS.length);
  });

  it("returns tools in a stable order, so clients can cache the list", () => {
    expect(TOOLS.map((t) => t.name)).toEqual([
      "list_models",
      "get_model_pricing",
      "estimate_cost",
      "list_model_deprecations",
    ]);
  });
});

describe("list_models", () => {
  it("sorts cheapest input first — the usual reason to list models", async () => {
    withCatalog();
    const res = await callTool("list_models", {});
    const structured = res.structuredContent as { models: { model: string }[] };
    expect(structured.models[0].model).toBe("gemini-2-flash");
    expect(res.isError).toBeUndefined();
  });

  it("filters by provider", async () => {
    withCatalog();
    const res = await callTool("list_models", { provider: "openai" });
    const structured = res.structuredContent as { models: { provider: string }[]; matched: number };
    expect(structured.matched).toBe(2);
    expect(structured.models.every((m) => m.provider === "openai")).toBe(true);
  });

  it("filters by a case-insensitive name substring", async () => {
    withCatalog();
    const res = await callTool("list_models", { query: "SONNET" });
    const structured = res.structuredContent as { models: { model: string }[] };
    expect(structured.models).toHaveLength(1);
    expect(structured.models[0].model).toBe("claude-sonnet-4-6");
  });

  it("honours limit and reports how many matched before truncation", async () => {
    withCatalog();
    const res = await callTool("list_models", { limit: 2 });
    const structured = res.structuredContent as { returned: number; matched: number };
    expect(structured.returned).toBe(2);
    expect(structured.matched).toBe(4);
  });

  it("returns an actionable tool error when nothing matches", async () => {
    withCatalog();
    const res = await callTool("list_models", { provider: "nonesuch" });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/broader query|omit the provider/);
  });

  it("reports the catalogue being down as a retryable tool error", async () => {
    mockCatalog.mockResolvedValue(null as never);
    const res = await callTool("list_models", {});
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/retry/i);
  });
});

describe("get_model_pricing", () => {
  it("returns rates and a readable summary", async () => {
    withCatalog();
    const res = await callTool("get_model_pricing", { model: "gpt-4o" });
    expect(res.structuredContent).toMatchObject({
      model: "gpt-4o",
      provider: "openai",
      input: 0.0025,
      matched_to: "gpt-4o",
    });
    expect(res.content[0].text).toContain("gpt-4o");
  });

  it("says plainly when cached tokens bill at the full input rate", async () => {
    withCatalog();
    const res = await callTool("get_model_pricing", { model: "claude-sonnet-4-6" });
    expect(res.content[0].text).toMatch(/full input rate/);
  });

  it("requires a model argument", async () => {
    withCatalog();
    const res = await callTool("get_model_pricing", {});
    expect(res.isError).toBe(true);
  });

  it("points at list_models when the name is unknown", async () => {
    withCatalog();
    const res = await callTool("get_model_pricing", { model: "not-a-model" });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("list_models");
  });
});

describe("estimate_cost", () => {
  it("prices a single call", async () => {
    withCatalog();
    const res = await callTool("estimate_cost", {
      model: "gpt-4o",
      input_tokens: 12000,
      output_tokens: 800,
    });
    // 12 * 0.0025 + 0.8 * 0.01 = 0.038
    expect((res.structuredContent as { total_cost: number }).total_cost).toBeCloseTo(0.038, 10);
  });

  it("multiplies out a whole job", async () => {
    withCatalog();
    const res = await callTool("estimate_cost", {
      model: "gpt-4o",
      input_tokens: 1000,
      output_tokens: 1000,
      calls: 1000,
    });
    expect((res.structuredContent as { total_cost: number }).total_cost).toBeCloseTo(12.5, 10);
    expect(res.content[0].text).toContain("1,000 calls");
  });

  it("flags when cached tokens were billed at the full input rate", async () => {
    withCatalog();
    const res = await callTool("estimate_cost", {
      model: "claude-sonnet-4-6",
      input_tokens: 0,
      output_tokens: 0,
      cached_input_tokens: 10000,
    });
    expect(res.structuredContent).toMatchObject({ cached_billed_at_input_rate: true });
    expect(res.content[0].text).toMatch(/no cached-input rate/);
  });

  it("turns bad input into a tool error the model can fix, not a throw", async () => {
    withCatalog();
    const res = await callTool("estimate_cost", { model: "gpt-4o", input_tokens: -5 });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/negative/);
  });

  it("refuses to price a model it cannot resolve", async () => {
    withCatalog();
    const res = await callTool("estimate_cost", {
      model: "imaginary-model",
      input_tokens: 1,
      output_tokens: 1,
    });
    expect(res.isError).toBe(true);
  });
});

describe("list_model_deprecations", () => {
  it("lists only models with a date, soonest first", async () => {
    withCatalog();
    const res = await callTool("list_model_deprecations", {});
    const structured = res.structuredContent as {
      deprecations: { model: string; deprecation_date: string }[];
    };
    expect(structured.deprecations.map((d) => d.model)).toEqual([
      "gemini-2-flash",
      "gpt-3.5-turbo",
    ]);
  });

  it("filters by provider", async () => {
    withCatalog();
    const res = await callTool("list_model_deprecations", { provider: "openai" });
    expect((res.structuredContent as { matched: number }).matched).toBe(1);
  });

  it("reports an empty result as success, not an error", async () => {
    mockCatalog.mockResolvedValue({
      pricing: { "a-model": { input: 1, output: 1, provider: "x", deprecation_date: null } },
    } as never);
    const res = await callTool("list_model_deprecations", {});
    expect(res.isError).toBeUndefined();
    expect((res.structuredContent as { returned: number }).returned).toBe(0);
  });
});

describe("unknown tools", () => {
  it("is reported in-band so the model can recover", async () => {
    const res = await callTool("no_such_tool", {});
    expect(res.isError).toBe(true);
  });
});
