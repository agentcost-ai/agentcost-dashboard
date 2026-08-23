#!/usr/bin/env node
/**
 * Verify every public endpoint and machine-readable file against a running site.
 *
 *   node scripts/verify-agent-endpoints.mjs                       # localhost:3100
 *   node scripts/verify-agent-endpoints.mjs https://agentcost.tech
 *
 * The checks are the ones the agent-readiness audit runs, written out so they
 * can be re-run after every deploy rather than trusted from memory.
 */

const BASE = (process.argv[2] ?? "http://localhost:3100").replace(/\/+$/, "");

let passed = 0;
const failures = [];

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  ok    ${name}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ""}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function get(path, headers = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers,
    redirect: "manual",
    signal: AbortSignal.timeout(120_000),
  });
  return { response, body: await response.text() };
}

function header(response, name) {
  return response.headers.get(name) ?? "";
}

async function main() {
  console.log(`Verifying ${BASE}\n`);

  // --- 1. Agent-friendly 404 -------------------------------------------------
  console.log("404 handling");
  {
    const { response, body } = await get("/some-path-that-does-not-exist");
    check("unknown path returns 404", response.status === 404, `got ${response.status}`);
    check(
      "404 body carries the markdown recovery block",
      body.includes("# 404") && body.includes("/llms.txt") && body.includes("/sitemap.xml"),
    );
    check("404 links the docs index and the spec", body.includes("/openapi.json"));
  }
  {
    const { response, body } = await get("/some-path-that-does-not-exist", {
      Accept: "text/markdown",
    });
    check("markdown 404 returns 404", response.status === 404, `got ${response.status}`);
    check(
      "markdown 404 is served as text/markdown",
      header(response, "content-type").includes("text/markdown"),
      header(response, "content-type"),
    );
    check("markdown 404 body is markdown", body.trimStart().startsWith("# 404"));
  }

  // --- 2. Markdown content negotiation (acceptmarkdown.com) ------------------
  console.log("\nContent negotiation");
  for (const path of ["/", "/docs/sdk", "/pricing", "/compare/helicone"]) {
    const { response, body } = await get(path, { Accept: "text/markdown" });
    check(
      `${path} serves markdown for Accept: text/markdown`,
      response.status === 200 && header(response, "content-type").includes("text/markdown"),
      `${response.status} ${header(response, "content-type")}`,
    );
    check(`${path} markdown body starts with an H1`, body.trimStart().startsWith("# "));
    check(
      `${path} varies on Accept`,
      header(response, "vary").toLowerCase().includes("accept"),
      header(response, "vary"),
    );
  }
  {
    const { response } = await get("/", { Accept: "text/html" });
    check("HTML variant is still HTML", header(response, "content-type").includes("text/html"));
    // Not asserted: `Vary: Accept` on the HTML variant. Next's page renderer
    // appends its own RSC Vary last and replaces the key, so neither proxy.ts
    // nor next.config.ts headers can add Accept to an App Router page response.
    // The markdown variant (checked above) does carry it, and the markdown
    // branch is a rewrite, so the two representations have different cache keys.
    if (!header(response, "vary").toLowerCase().includes("accept")) {
      console.log("  note  HTML variant Vary lacks Accept (Next framework limit)");
    }
  }
  {
    const { response } = await get("/");
    check("no Accept header still serves HTML", header(response, "content-type").includes("text/html"));
  }
  {
    const browser =
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8";
    const { response } = await get("/", { Accept: browser });
    check("browser Accept serves HTML", header(response, "content-type").includes("text/html"));
  }
  {
    const { response } = await get("/", { Accept: "text/html;q=0.2, text/markdown;q=0.9" });
    check(
      "q-values are honoured",
      header(response, "content-type").includes("text/markdown"),
      header(response, "content-type"),
    );
  }
  {
    const { response } = await get("/", { Accept: "application/pdf" });
    check("unsupported type is rejected with 406", response.status === 406, `got ${response.status}`);
  }
  {
    // Next's client router fetches RSC payloads with Accept: text/x-component.
    // Negotiating those would 406 them and break client-side navigation.
    const { response } = await get("/pricing", { Accept: "text/x-component", RSC: "1" });
    check(
      "RSC payload requests are not negotiated",
      response.status === 200 && header(response, "content-type").includes("text/x-component"),
      `${response.status} ${header(response, "content-type")}`,
    );
  }

  // --- 3. Machine-readable files --------------------------------------------
  console.log("\nMachine-readable files");
  {
    const { response, body } = await get("/llms.txt");
    check("/llms.txt is 200", response.status === 200, `got ${response.status}`);
    check("/llms.txt starts with an H1", body.startsWith("# AgentCost"));
    check("/llms.txt has a blockquote summary", body.split("\n")[2]?.startsWith("> "));
    check("/llms.txt has when-to-use guidance", body.includes("## When to use AgentCost"));
  }
  {
    const { response, body } = await get("/llms-full.txt");
    check("/llms-full.txt is 200", response.status === 200, `got ${response.status}`);
    check("/llms-full.txt is substantial", body.length > 10_000, `${body.length} bytes`);
  }
  for (const path of ["/openapi.json", "/api/openapi.json"]) {
    const { response, body } = await get(path);
    check(`${path} is 200`, response.status === 200, `got ${response.status}`);
    let spec = null;
    try {
      spec = JSON.parse(body);
    } catch {
      /* reported below */
    }
    check(`${path} is valid OpenAPI 3.1`, spec?.openapi?.startsWith("3.1"), spec?.openapi);
    check(`${path} declares servers`, Array.isArray(spec?.servers) && spec.servers.length > 0);
  }
  {
    const { response, body } = await get("/api/openapi.yaml");
    check("/api/openapi.yaml is 200", response.status === 200, `got ${response.status}`);
    check("/api/openapi.yaml looks like the spec", body.includes('"openapi"'));
  }
  {
    const { response, body } = await get("/robots.txt");
    check("/robots.txt is 200", response.status === 200);
    check("/robots.txt points at the sitemap", body.includes("sitemap.xml"));
  }
  {
    const { response, body } = await get("/sitemap.xml");
    check("/sitemap.xml is 200", response.status === 200);
    for (const path of ["/about", "/contact", "/docs<"]) {
      check(`sitemap lists ${path.replace("<", "")}`, body.includes(`${BASE}${path}`) || body.includes(`agentcost.tech${path}`));
    }
  }

  // --- 4. Public API ---------------------------------------------------------
  console.log("\nPublic API");
  {
    const { response, body } = await get("/api/v1");
    check("/api/v1 is 200 JSON", response.status === 200 && header(response, "content-type").includes("json"));
    check("/api/v1 lists its endpoints", body.includes("estimate") && body.includes("pricing"));
  }
  {
    const { response, body } = await get("/api/v1/health");
    check("/api/v1/health is 200", response.status === 200, `got ${response.status}`);
    check("/api/v1/health reports status ok", JSON.parse(body).status === "ok");
  }
  {
    const { response, body } = await get("/api/v1/pricing");
    check("/api/v1/pricing is 200", response.status === 200, `got ${response.status}`);
    const payload = JSON.parse(body);
    check(
      "/api/v1/pricing returns a catalogue",
      Object.keys(payload.pricing ?? {}).length > 100,
      `${Object.keys(payload.pricing ?? {}).length} models`,
    );
  }
  {
    const { response, body } = await get("/api/v1/pricing/gpt-4o");
    check("/api/v1/pricing/{model} is 200", response.status === 200, `got ${response.status}`);
    const payload = JSON.parse(body);
    check("single-model lookup returns rates", typeof payload.input === "number");
  }
  {
    const { response } = await get("/api/v1/pricing/deprecations");
    check("/api/v1/pricing/deprecations is 200", response.status === 200, `got ${response.status}`);
  }
  {
    const { response } = await get("/api/v1/pricing/sync/status");
    check("/api/v1/pricing/sync/status is 200", response.status === 200, `got ${response.status}`);
  }
  {
    const response = await fetch(`${BASE}/api/v1/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", input_tokens: 12000, output_tokens: 800 }),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = await response.json();
    check("POST /api/v1/estimate is 200", response.status === 200, `got ${response.status}`);
    check("estimate returns a total cost", typeof payload.total_cost === "number", JSON.stringify(payload).slice(0, 120));
    check("estimate names the matched catalogue entry", Boolean(payload.matched_to));
  }

  // --- 5. JSON error responses ----------------------------------------------
  console.log("\nJSON errors");
  {
    const { response, body } = await get("/api/v1/not-a-real-endpoint");
    check("unknown API path is 404", response.status === 404, `got ${response.status}`);
    check("unknown API path returns JSON", header(response, "content-type").includes("json"));
    const payload = JSON.parse(body);
    check("error carries a code, message and hint", Boolean(payload.error?.code && payload.error?.message && payload.error?.hint));
    check("error keeps the legacy string detail", typeof payload.detail === "string");
  }
  {
    const response = await fetch(`${BASE}/api/v1/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input_tokens: 10 }),
      signal: AbortSignal.timeout(60_000),
    });
    const payload = await response.json();
    check("estimate rejects a bad body with 422", response.status === 422, `got ${response.status}`);
    check("validation error has code validation_error", payload.error?.code === "validation_error");
  }
  {
    const response = await fetch(`${BASE}/api/v1/estimate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "definitely-not-a-model", input_tokens: 1, output_tokens: 1 }),
      signal: AbortSignal.timeout(120_000),
    });
    const payload = await response.json();
    check("unknown model returns 404 with a hint", response.status === 404 && Boolean(payload.error?.hint), `got ${response.status}`);
  }

  // --- 6. Trust anchor pages -------------------------------------------------
  console.log("\nTrust anchors");
  for (const path of ["/about", "/contact", "/privacy", "/terms", "/docs"]) {
    const { response, body } = await get(path);
    check(`${path} is 200`, response.status === 200, `got ${response.status}`);
    const text = body
      .replace(/<script[\s\S]*?<\/script>/g, "")
      .replace(/<style[\s\S]*?<\/style>/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    check(`${path} has at least 500 characters of content`, text.length >= 500, `${text.length} chars`);
  }
  {
    const { body } = await get("/");
    check("Organization JSON-LD includes contactPoint", body.includes('"contactPoint"'));
    check(
      "Organization JSON-LD includes address (pending a real address)",
      body.includes('"address"'),
      "ORGANIZATION_ADDRESS is still null in src/lib/structured-data.ts",
    );
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const failure of failures) console.log(`  - ${failure}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
