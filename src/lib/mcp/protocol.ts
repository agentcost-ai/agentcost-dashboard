/**
 * MCP protocol framing for the AgentCost server.
 *
 * Dual-era on purpose. Revision 2026-07-28 made MCP stateless — no
 * `initialize` handshake, no session id, protocol version and client identity
 * carried per-request in `_meta`, and `server/discover` for capability
 * lookup. Most deployed clients still speak the older handshake era, so this
 * server answers both on one endpoint, which the spec explicitly allows
 * ("A dual-era server MAY serve both eras concurrently on the same endpoint").
 *
 * Pure functions only — no I/O — so the framing is testable without HTTP.
 */

/** Current stateless revision. */
export const MODERN_VERSION = "2026-07-28";

/**
 * Versions this server actually implements, newest first.
 *
 * Deliberately not a longer list: claiming a revision we have not implemented
 * would make a client pick it and then hit shapes we do not produce.
 * 2025-03-26 is here because the transport says a server MAY treat a request
 * with no MCP-Protocol-Version header as that version.
 */
export const SUPPORTED_VERSIONS = [MODERN_VERSION, "2025-06-18", "2025-03-26"] as const;

/** Assumed when a request carries no version at all. */
export const ASSUMED_LEGACY_VERSION = "2025-03-26";

export const SERVER_INFO = {
  name: "agentcost",
  title: "AgentCost",
  version: "1.0.0",
} as const;

/**
 * Shown to the model deciding whether to use this server. Concrete jobs beat a
 * product pitch: a model reads this to answer "is this relevant to the task in
 * front of me", not "is this a nice product".
 */
export const INSTRUCTIONS = [
  "AgentCost exposes public LLM model pricing. No credentials, no sign-up.",
  "",
  "Use these tools when you need to:",
  "- price a named model (per-1,000-token input, output, cached-input and cache-write rates)",
  "- find a cheaper model with comparable rates, across 50+ providers",
  "- work out what a call or a whole job will cost in dollars before running it",
  "- check whether a model has an announced retirement date",
  "",
  "Rates are USD per 1,000 tokens. A null cached-input rate means the provider",
  "publishes none, and cached tokens bill at the full input rate — estimate_cost",
  "reports which happened via cached_billed_at_input_rate.",
  "",
  "These tools do not read the caller's own spend; that needs an authenticated",
  "AgentCost account. See https://agentcost.tech/docs/api.",
].join("\n");

/** JSON-RPC 2.0 reserved codes. */
export const PARSE_ERROR = -32700;
export const INVALID_REQUEST = -32600;
export const METHOD_NOT_FOUND = -32601;
export const INVALID_PARAMS = -32602;
export const INTERNAL_ERROR = -32603;

/**
 * MCP-allocated codes (2026-07-28 renumbered these into the -32020..-32099
 * range reserved for the specification).
 */
export const HEADER_MISMATCH = -32020;
export const MISSING_REQUIRED_CLIENT_CAPABILITY = -32021;
export const UNSUPPORTED_PROTOCOL_VERSION = -32022;

export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
};

const META_VERSION = "io.modelcontextprotocol/protocolVersion";
const META_SERVER_INFO = "io.modelcontextprotocol/serverInfo";

/** True for revisions that carry per-request metadata instead of a handshake. */
export function isModernVersion(version: string): boolean {
  return version >= MODERN_VERSION;
}

export function isSupportedVersion(version: string): boolean {
  return (SUPPORTED_VERSIONS as readonly string[]).includes(version);
}

/**
 * The version a legacy `initialize` should be answered with.
 *
 * Per the lifecycle spec: echo the client's version when supported, otherwise
 * respond with the latest we support and let the client decide whether it can
 * continue.
 */
export function negotiateLegacyVersion(requested: unknown): string {
  if (typeof requested === "string" && isSupportedVersion(requested)) return requested;
  return "2025-06-18";
}

/** The protocol version a request declares, from `_meta` or the HTTP header. */
export function requestedVersion(
  body: JsonRpcRequest,
  header: string | null,
): string {
  const meta = body.params?._meta as Record<string, unknown> | undefined;
  const fromMeta = meta?.[META_VERSION];
  if (typeof fromMeta === "string") return fromMeta;
  if (header) return header;
  return ASSUMED_LEGACY_VERSION;
}

export type HeaderCheck = { ok: true } | { ok: false; message: string };

/**
 * Header/body agreement, required from 2026-07-28 onward.
 *
 * The point is not ceremony: a load balancer may route on `Mcp-Name` while the
 * server executes on the body value, so a mismatch is a real security bug. Only
 * enforced for modern requests — legacy clients never send these headers.
 */
export function validateRequestHeaders(
  body: JsonRpcRequest,
  headers: Headers,
): HeaderCheck {
  const versionHeader = headers.get("mcp-protocol-version");
  const meta = body.params?._meta as Record<string, unknown> | undefined;
  const metaVersion = meta?.[META_VERSION];

  if (versionHeader && typeof metaVersion === "string" && versionHeader !== metaVersion) {
    return {
      ok: false,
      message: `Header mismatch: MCP-Protocol-Version header value '${versionHeader}' does not match body value '${metaVersion}'.`,
    };
  }

  if (!headers.get("mcp-method")) {
    return { ok: false, message: "Missing required header: Mcp-Method." };
  }

  const methodHeader = headers.get("mcp-method");
  if (methodHeader !== body.method) {
    return {
      ok: false,
      message: `Header mismatch: Mcp-Method header value '${methodHeader}' does not match body value '${body.method}'.`,
    };
  }

  // Mcp-Name is required only for the methods that carry a name or uri.
  if (body.method === "tools/call") {
    const nameHeader = headers.get("mcp-name");
    if (!nameHeader) {
      return { ok: false, message: "Missing required header: Mcp-Name." };
    }
    const bodyName = body.params?.name;
    if (decodeHeaderValue(nameHeader) !== bodyName) {
      return {
        ok: false,
        message: `Header mismatch: Mcp-Name header value '${nameHeader}' does not match body value '${String(bodyName)}'.`,
      };
    }
  }

  return { ok: true };
}

/**
 * Undo the `=?base64?...?=` sentinel the transport prescribes for values that
 * cannot be carried as plain ASCII.
 */
export function decodeHeaderValue(value: string): string {
  if (!value.startsWith("=?base64?") || !value.endsWith("?=")) return value;
  const encoded = value.slice("=?base64?".length, -"?=".length);
  try {
    return new TextDecoder().decode(
      Uint8Array.from(atob(encoded), (char) => char.charCodeAt(0)),
    );
  } catch {
    return value;
  }
}

type Framed<T> = T & {
  resultType: "complete";
  ttlMs?: number;
  cacheScope?: "public" | "private";
  _meta: Record<string, unknown>;
};

/**
 * Wrap a result, stamping the fields every 2026-07-28 result carries.
 *
 * Generic over the payload so callers keep their own field types — spreading
 * into a `Record<string, unknown>` would erase them.
 */
export function result<T extends Record<string, unknown>>(
  id: JsonRpcId,
  payload: T,
  cache?: { ttlMs: number; scope: "public" | "private" },
): { jsonrpc: "2.0"; id: JsonRpcId; result: Framed<T> } {
  return {
    jsonrpc: "2.0" as const,
    id,
    result: {
      // Required from 2026-07-28. Older clients ignore the extra field, so one
      // code path serves both eras.
      resultType: "complete",
      ...payload,
      ...(cache ? { ttlMs: cache.ttlMs, cacheScope: cache.scope } : {}),
      _meta: {
        [META_SERVER_INFO]: { name: SERVER_INFO.name, version: SERVER_INFO.version },
        ...((payload._meta as Record<string, unknown>) ?? {}),
      },
    } as Framed<T>,
  };
}

export function error(
  id: JsonRpcId,
  code: number,
  message: string,
  data?: Record<string, unknown>,
) {
  return {
    jsonrpc: "2.0" as const,
    id,
    error: { code, message, ...(data ? { data } : {}) },
  };
}

export function unsupportedVersionError(id: JsonRpcId, requested: string) {
  return error(id, UNSUPPORTED_PROTOCOL_VERSION, "Unsupported protocol version", {
    supported: [...SUPPORTED_VERSIONS],
    requested,
  });
}

/** Server capabilities. listChanged is false — the catalogue tools never change shape. */
export const CAPABILITIES = { tools: { listChanged: false } } as const;

export function discoverResult(id: JsonRpcId) {
  return result(
    id,
    {
      supportedVersions: [...SUPPORTED_VERSIONS],
      capabilities: CAPABILITIES,
      instructions: INSTRUCTIONS,
    },
    { ttlMs: 3_600_000, scope: "public" },
  );
}

/** The legacy `initialize` reply, for clients that still open with a handshake. */
export function initializeResult(id: JsonRpcId, requested: unknown) {
  return result(id, {
    protocolVersion: negotiateLegacyVersion(requested),
    capabilities: CAPABILITIES,
    serverInfo: SERVER_INFO,
    instructions: INSTRUCTIONS,
  });
}
