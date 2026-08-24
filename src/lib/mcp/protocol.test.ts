import { describe, expect, it } from "vitest";

import {
  ASSUMED_LEGACY_VERSION,
  HEADER_MISMATCH,
  MODERN_VERSION,
  SUPPORTED_VERSIONS,
  UNSUPPORTED_PROTOCOL_VERSION,
  decodeHeaderValue,
  discoverResult,
  initializeResult,
  isModernVersion,
  isSupportedVersion,
  negotiateLegacyVersion,
  requestedVersion,
  result,
  unsupportedVersionError,
  validateRequestHeaders,
  type JsonRpcRequest,
} from "./protocol";

const META = "io.modelcontextprotocol/protocolVersion";

function request(over: Partial<JsonRpcRequest> = {}): JsonRpcRequest {
  return { jsonrpc: "2.0", id: 1, method: "tools/list", ...over };
}

describe("version support", () => {
  it("claims only revisions this server implements", () => {
    expect(SUPPORTED_VERSIONS[0]).toBe(MODERN_VERSION);
    for (const version of SUPPORTED_VERSIONS) {
      expect(isSupportedVersion(version)).toBe(true);
    }
    expect(isSupportedVersion("1900-01-01")).toBe(false);
    // Not implemented, so not claimed — a client that picked it would hit
    // shapes we do not produce.
    expect(isSupportedVersion("2025-11-25")).toBe(false);
  });

  it("separates the stateless era from the handshake era", () => {
    expect(isModernVersion(MODERN_VERSION)).toBe(true);
    expect(isModernVersion("2025-06-18")).toBe(false);
    expect(isModernVersion("2025-03-26")).toBe(false);
  });

  it("echoes a supported version back on a legacy initialize", () => {
    expect(negotiateLegacyVersion("2025-06-18")).toBe("2025-06-18");
    expect(negotiateLegacyVersion(MODERN_VERSION)).toBe(MODERN_VERSION);
  });

  it("answers an unsupported initialize with the latest legacy version we speak", () => {
    expect(negotiateLegacyVersion("1900-01-01")).toBe("2025-06-18");
    expect(negotiateLegacyVersion(undefined)).toBe("2025-06-18");
    expect(negotiateLegacyVersion(42)).toBe("2025-06-18");
  });
});

describe("requestedVersion", () => {
  it("prefers the version in _meta", () => {
    const body = request({ params: { _meta: { [META]: MODERN_VERSION } } });
    expect(requestedVersion(body, "2025-06-18")).toBe(MODERN_VERSION);
  });

  it("falls back to the HTTP header", () => {
    expect(requestedVersion(request(), "2025-06-18")).toBe("2025-06-18");
  });

  it("assumes 2025-03-26 when neither is present, per the transport spec", () => {
    expect(requestedVersion(request(), null)).toBe(ASSUMED_LEGACY_VERSION);
  });
});

describe("header validation", () => {
  const modernHeaders = (over: Record<string, string> = {}) =>
    new Headers({
      "mcp-protocol-version": MODERN_VERSION,
      "mcp-method": "tools/list",
      ...over,
    });

  it("accepts a well-formed modern request", () => {
    expect(validateRequestHeaders(request(), modernHeaders()).ok).toBe(true);
  });

  it("rejects a version header that disagrees with the body", () => {
    // A load balancer may route on the header while the server executes on the
    // body — a mismatch is a real security bug, not pedantry.
    const body = request({ params: { _meta: { [META]: "2025-06-18" } } });
    const check = validateRequestHeaders(body, modernHeaders());
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.message).toMatch(/MCP-Protocol-Version/);
  });

  it("requires Mcp-Method and rejects one that disagrees", () => {
    const missing = validateRequestHeaders(
      request(),
      new Headers({ "mcp-protocol-version": MODERN_VERSION }),
    );
    expect(missing.ok).toBe(false);

    const wrong = validateRequestHeaders(
      request(),
      modernHeaders({ "mcp-method": "tools/call" }),
    );
    expect(wrong.ok).toBe(false);
  });

  it("requires Mcp-Name on tools/call and matches it against the body", () => {
    const body = request({ method: "tools/call", params: { name: "estimate_cost" } });

    const missing = validateRequestHeaders(body, modernHeaders({ "mcp-method": "tools/call" }));
    expect(missing.ok).toBe(false);

    const wrong = validateRequestHeaders(
      body,
      modernHeaders({ "mcp-method": "tools/call", "mcp-name": "list_models" }),
    );
    expect(wrong.ok).toBe(false);

    const right = validateRequestHeaders(
      body,
      modernHeaders({ "mcp-method": "tools/call", "mcp-name": "estimate_cost" }),
    );
    expect(right.ok).toBe(true);
  });

  it("does not demand Mcp-Name on methods that carry no name", () => {
    expect(validateRequestHeaders(request(), modernHeaders()).ok).toBe(true);
  });

  it("compares Mcp-Name after decoding the base64 sentinel", () => {
    const body = request({ method: "tools/call", params: { name: "héllo" } });
    const encoded = `=?base64?${Buffer.from("héllo", "utf8").toString("base64")}?=`;
    const check = validateRequestHeaders(
      body,
      modernHeaders({ "mcp-method": "tools/call", "mcp-name": encoded }),
    );
    expect(check.ok).toBe(true);
  });
});

describe("decodeHeaderValue", () => {
  it("passes plain ASCII through untouched", () => {
    expect(decodeHeaderValue("estimate_cost")).toBe("estimate_cost");
  });

  it("decodes the sentinel form", () => {
    const encoded = `=?base64?${Buffer.from("Hello, 世界", "utf8").toString("base64")}?=`;
    expect(decodeHeaderValue(encoded)).toBe("Hello, 世界");
  });

  it("returns the raw value rather than throwing on malformed base64", () => {
    expect(decodeHeaderValue("=?base64?!!!not-base64!!!?=")).toContain("base64");
  });
});

describe("result framing", () => {
  it("stamps resultType and serverInfo on every result", () => {
    const framed = result(7, { tools: [] });
    expect(framed.jsonrpc).toBe("2.0");
    expect(framed.id).toBe(7);
    expect(framed.result.resultType).toBe("complete");
    expect(framed.result._meta["io.modelcontextprotocol/serverInfo"]).toMatchObject({
      name: "agentcost",
    });
  });

  it("adds the cache hints when a cache policy is given", () => {
    const framed = result(1, {}, { ttlMs: 60_000, scope: "public" });
    expect(framed.result.ttlMs).toBe(60_000);
    expect(framed.result.cacheScope).toBe("public");
  });

  it("omits cache hints when none is given", () => {
    const framed = result(1, {});
    expect(framed.result).not.toHaveProperty("ttlMs");
  });
});

describe("server/discover", () => {
  const framed = discoverResult("d1");

  it("advertises supported versions, capabilities and instructions", () => {
    expect(framed.result.supportedVersions).toEqual([...SUPPORTED_VERSIONS]);
    expect(framed.result.capabilities).toMatchObject({ tools: {} });
    expect(String(framed.result.instructions)).toContain("AgentCost");
  });

  it("is cacheable, as the spec allows", () => {
    expect(framed.result.ttlMs).toBeGreaterThan(0);
    expect(framed.result.cacheScope).toBe("public");
  });
});

describe("legacy initialize", () => {
  it("returns the negotiated version, capabilities, serverInfo and instructions", () => {
    const framed = initializeResult(1, "2025-06-18");
    expect(framed.result.protocolVersion).toBe("2025-06-18");
    expect(framed.result.capabilities).toMatchObject({ tools: {} });
    expect(framed.result.serverInfo).toMatchObject({ name: "agentcost" });
    expect(framed.result.instructions).toBeTruthy();
  });
});

describe("errors", () => {
  it("uses the MCP-allocated code and lists supported versions", () => {
    const framed = unsupportedVersionError(1, "1900-01-01");
    expect(framed.error.code).toBe(UNSUPPORTED_PROTOCOL_VERSION);
    expect(framed.error.code).toBe(-32022);
    expect(framed.error.data).toEqual({
      supported: [...SUPPORTED_VERSIONS],
      requested: "1900-01-01",
    });
  });

  it("uses the renumbered header-mismatch code", () => {
    expect(HEADER_MISMATCH).toBe(-32020);
  });
});
