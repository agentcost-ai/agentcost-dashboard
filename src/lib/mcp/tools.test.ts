import { afterEach, describe, expect, it, vi } from "vitest";

import { TOOLS, TOOLS_BY_NAME, callTool } from "./tools";

// The tools read the catalogue through lib/catalog; stub that boundary so the
// tests exercise the tool logic rather than the network.
vi.mock("@/lib/catalog", () => ({
  PRICING_API: "https://api.test",
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
      "get_spend_overview",
      "get_spend_breakdown",
      "get_budget_state",
      "get_run_cost",
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

describe("account tools", () => {
  const KEY = { apiKey: "sk_test" };

  /** Answer each upstream path from a table; anything unlisted is a 404. */
  function withApi(routes: Record<string, { status?: number; body?: unknown }>) {
    const fetchMock = vi.fn(async (url: string | URL, init?: RequestInit) => {
      void init;
      const path = String(url).replace("https://api.test", "");
      const route = routes[path];
      const status = route ? (route.status ?? 200) : 404;
      return new Response(JSON.stringify(route?.body ?? {}), { status });
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  afterEach(() => vi.unstubAllGlobals());

  it("asks for the API key rather than calling upstream without one", async () => {
    const fetchMock = withApi({});
    for (const name of ["get_spend_overview", "get_spend_breakdown", "get_budget_state", "get_run_cost"]) {
      const res = await callTool(name, { dimension: "agent", trace_id: "t1" });
      expect(res.isError, name).toBe(true);
      expect(res.content[0].text, name).toMatch(/Authorization: Bearer/);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("forwards the caller's key and never puts it in the answer", async () => {
    const fetchMock = withApi({
      "/v1/analytics/overview?range=30d": {
        body: { total_cost: 12.5, total_calls: 1000, total_tokens: 50000, avg_cost_per_call: 0.0125, avg_latency_ms: 900, success_rate: 99.1 },
      },
    });
    const res = await callTool("get_spend_overview", { range: "30d" }, KEY);
    expect(res.structuredContent).toMatchObject({ total_cost: 12.5, total_calls: 1000 });
    expect(res.content[0].text).toContain("$12.50");
    expect(JSON.stringify(res)).not.toContain("sk_test");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({ Authorization: "Bearer sk_test" });
    expect(init.cache).toBe("no-store");
  });

  it("rejects a range the API does not have instead of silently defaulting", async () => {
    withApi({});
    const res = await callTool("get_spend_overview", { range: "1y" }, KEY);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("90d");
  });

  it("says the key was rejected when the API answers 401", async () => {
    withApi({ "/v1/analytics/overview?range=7d": { status: 401 } });
    const res = await callTool("get_spend_overview", {}, KEY);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/rejected the API key/);
  });

  it("breaks spend down most expensive first", async () => {
    withApi({
      "/v1/analytics/by/agent?range=7d&limit=20": {
        body: [
          { key: "router", total_calls: 10, total_cost: 1 },
          { key: "coder", total_calls: 5, total_cost: 9 },
        ],
      },
    });
    const res = await callTool("get_spend_breakdown", { dimension: "agent" }, KEY);
    const structured = res.structuredContent as { groups: { key: string }[]; returned: number };
    expect(structured.groups.map((g) => g.key)).toEqual(["coder", "router"]);
    expect(structured.returned).toBe(2);
  });

  it("requires a known dimension", async () => {
    withApi({});
    const res = await callTool("get_spend_breakdown", { dimension: "team" }, KEY);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain("workflow");
  });

  it("finds the project from the key before reading its budget", async () => {
    withApi({
      "/v1/projects/me": { body: { id: "p-1" } },
      "/v1/projects/p-1/budget-state": {
        body: { enabled: true, budget: 5000, spend_mtd: 4820.15, remaining: 179.85, utilization_percent: 96.4, exhausted: false, period_ends_at: "2026-11-01T00:00:00+00:00" },
      },
    });
    const res = await callTool("get_budget_state", {}, KEY);
    expect(res.structuredContent).toMatchObject({ remaining: 179.85, exhausted: false });
    expect(res.content[0].text).toContain("$4820.15 of $5000.00");
  });

  it("reports a project with no budget as success, not an error", async () => {
    withApi({
      "/v1/projects/me": { body: { id: "p-1" } },
      "/v1/projects/p-1/budget-state": {
        body: { enabled: false, budget: null, spend_mtd: 3, remaining: null, utilization_percent: null, exhausted: false, period_ends_at: "x" },
      },
    });
    const res = await callTool("get_budget_state", {}, KEY);
    expect(res.isError).toBeUndefined();
    expect(res.content[0].text).toMatch(/No budget is set/);
  });

  it("lists a run's calls and flags the failed ones", async () => {
    withApi({
      "/v1/analytics/traces/run-1": {
        body: {
          trace_id: "run-1", workflow: "refactor-run", total_cost: 0.05, total_calls: 2, failed_calls: 1,
          spans: [
            { step_name: "plan", tool_name: null, model: "gpt-4o", cost: 0.02, success: true },
            { step_name: null, tool_name: "edit_file", model: "gpt-4o", cost: 0.03, success: false },
          ],
        },
      },
    });
    const res = await callTool("get_run_cost", { trace_id: "run-1" }, KEY);
    const text = res.content[0].text;
    expect(text).toContain("$0.05 for 2 calls in refactor-run, 1 failed.");
    expect(text).toMatch(/edit_file — gpt-4o — failed/);
  });

  it("says plainly when the run does not exist", async () => {
    withApi({});
    const res = await callTool("get_run_cost", { trace_id: "nope" }, KEY);
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toContain('"nope"');
  });
});
