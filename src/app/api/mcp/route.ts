import {
  HEADER_MISMATCH,
  INTERNAL_ERROR,
  INVALID_PARAMS,
  INVALID_REQUEST,
  METHOD_NOT_FOUND,
  PARSE_ERROR,
  discoverResult,
  error,
  initializeResult,
  isModernVersion,
  isSupportedVersion,
  requestedVersion,
  result,
  unsupportedVersionError,
  validateRequestHeaders,
  type JsonRpcId,
  type JsonRpcRequest,
} from "@/lib/mcp/protocol";
import { TOOLS, TOOLS_BY_NAME, callTool } from "@/lib/mcp/tools";

/**
 * The AgentCost MCP endpoint (Streamable HTTP).
 *
 * Answers both protocol eras on one path: the stateless 2026-07-28 revision
 * and the older `initialize` handshake that most deployed clients still use.
 *
 * Responses are always a single JSON object rather than an SSE stream. The
 * transport allows either, and every tool here resolves in one round trip
 * against a cached catalogue — there is no progress to stream.
 */

export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, MCP-Protocol-Version, Mcp-Method, Mcp-Name, Authorization",
  "Access-Control-Expose-Headers": "MCP-Protocol-Version",
};

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extra },
  });
}

/**
 * The transport requires Origin validation to stop DNS-rebinding attacks.
 * This server is deliberately public and cross-origin callable, so any real
 * web origin is allowed — what gets rejected is a malformed one, which no
 * browser sends and which is the shape used to smuggle past naive checks.
 */
function originAllowed(origin: string | null): boolean {
  if (!origin) return true;
  if (origin === "null") return false;
  try {
    const { protocol } = new URL(origin);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: JSON_HEADERS });
}

/**
 * 2026-07-28 removed the GET stream and session deletion. The spec says a
 * server that supports only this shape should answer both with 405.
 */
export async function GET() {
  return json(
    error(null, METHOD_NOT_FOUND, "This MCP endpoint accepts POST only. GET streams were removed in protocol revision 2026-07-28."),
    405,
    { Allow: "POST, OPTIONS" },
  );
}

export const DELETE = GET;

export async function POST(request: Request) {
  if (!originAllowed(request.headers.get("origin"))) {
    return json(error(null, INVALID_REQUEST, "Invalid Origin header."), 403);
  }

  let body: JsonRpcRequest;
  try {
    body = (await request.json()) as JsonRpcRequest;
  } catch {
    return json(error(null, PARSE_ERROR, "Request body is not valid JSON."), 400);
  }

  if (!body || typeof body !== "object" || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return json(
      error(null, INVALID_REQUEST, 'Body must be a JSON-RPC 2.0 message with "jsonrpc": "2.0" and a "method".'),
      400,
    );
  }

  // A notification carries no id and expects no result.
  const isNotification = body.id === undefined || body.id === null;
  const id: JsonRpcId = isNotification ? null : (body.id as JsonRpcId);

  const version = requestedVersion(body, request.headers.get("mcp-protocol-version"));

  if (!isSupportedVersion(version)) {
    return json(unsupportedVersionError(id, version), 400);
  }

  // Header/body agreement is required from 2026-07-28. Legacy clients never
  // send those headers, so enforcing it on them would break working setups.
  if (isModernVersion(version) && !isNotification) {
    const check = validateRequestHeaders(body, request.headers);
    if (!check.ok) {
      return json(error(id, HEADER_MISMATCH, check.message), 400);
    }
  }

  if (isNotification) {
    // The only notification legacy clients send here is notifications/initialized.
    return new Response(null, { status: 202, headers: JSON_HEADERS });
  }

  const params = (body.params ?? {}) as Record<string, unknown>;

  try {
    switch (body.method) {
      case "server/discover":
        return json(discoverResult(id), 200, { "MCP-Protocol-Version": version });

      case "initialize":
        return json(initializeResult(id, params.protocolVersion), 200);

      case "ping":
        // Removed in 2026-07-28, still sent by legacy clients as a keepalive.
        return json(result(id, {}), 200);

      case "tools/list":
        return json(
          result(
            id,
            {
              // Deterministic order: the spec asks for it so clients can cache
              // the list and so tool definitions stay prompt-cacheable.
              tools: TOOLS,
            },
            { ttlMs: 3_600_000, scope: "public" },
          ),
          200,
          { "MCP-Protocol-Version": version },
        );

      case "tools/call": {
        const name = params.name;
        if (typeof name !== "string") {
          return json(error(id, INVALID_PARAMS, 'tools/call requires a string "name" parameter.'), 200);
        }
        if (!TOOLS_BY_NAME.has(name)) {
          return json(
            error(id, INVALID_PARAMS, `Unknown tool: ${name}. Call tools/list for the available tools.`),
            200,
          );
        }
        const args = (params.arguments ?? {}) as Record<string, unknown>;
        const toolResult = await callTool(name, args);
        return json(result(id, { ...toolResult }), 200, {
          "MCP-Protocol-Version": version,
        });
      }

      default:
        // The transport asks for 404 with -32601 so a client can tell an
        // unimplemented method from a legacy server that has no MCP endpoint.
        return json(
          error(id, METHOD_NOT_FOUND, `Method not found: ${body.method}`),
          404,
        );
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unknown error";
    return json(error(id, INTERNAL_ERROR, `Internal error handling ${body.method}: ${message}`), 500);
  }
}
