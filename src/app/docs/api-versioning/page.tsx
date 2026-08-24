import type { Metadata } from "next";
import Link from "next/link";

import { SITE_URL } from "@/lib/site";
import {
  DEPRECATIONS,
  MINIMUM_NOTICE_DAYS,
  POLICY_URL,
} from "@/lib/http/deprecation";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "AgentCost API Versioning & Deprecation Policy",
  description:
    "How the AgentCost API is versioned, how deprecations are signalled with Deprecation and Sunset headers, and the minimum notice before any endpoint is retired.",
  alternates: { canonical: POLICY_URL },
};

export default function ApiVersioningPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLd(
          breadcrumbList([
            { name: "AgentCost", path: "/" },
            { name: "Documentation", path: "/docs" },
            { name: "API versioning", path: "/docs/api-versioning" },
          ]),
        )}
      />

      <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-sky-400/80">
        API Policy
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        AgentCost API versioning &amp; deprecation
      </h1>
      <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-neutral-400">
        An agent should not integrate against a surface that can change without
        warning. This is what we promise about changes, and how you find out
        about them in the response itself rather than by reading a blog.
      </p>

      <h2 className="mt-12 mb-4 text-xl font-semibold text-white">Versioning</h2>
      <div className="space-y-4 text-[14px] leading-relaxed text-neutral-400">
        <p>
          The API is versioned in the URL path. Every endpoint lives under{" "}
          <code className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[13px] text-neutral-200">
            /v1/
          </code>
          , on both hosts:{" "}
          <code className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[13px] text-neutral-200">
            https://api.agentcost.tech/v1/…
          </code>{" "}
          and the cached mirror at{" "}
          <code className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[13px] text-neutral-200">
            {SITE_URL}/api/v1/…
          </code>
          .
        </p>
        <p>
          Within a version we only make additive changes: new endpoints, new
          optional request fields, new fields in a response. Existing field names
          keep their meaning and their type. A change that would break a working
          client — removing a field, narrowing a type, changing a status code —
          means a new version path, not an edit to this one.
        </p>
        <p>
          Treat unknown response fields as forward compatibility, not as errors.
          Your client should ignore fields it does not recognise.
        </p>
      </div>

      <h2 className="mt-12 mb-4 text-xl font-semibold text-white">
        How a deprecation is signalled
      </h2>
      <div className="space-y-4 text-[14px] leading-relaxed text-neutral-400">
        <p>
          Every API response carries a link to this page, so a client can find
          the policy without knowing where to look:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-black/40 p-4 font-mono text-[12.5px] leading-relaxed text-neutral-200">
{`Link: <${POLICY_URL}>; rel="deprecation"; type="text/html"`}
        </pre>
        <p>
          That link alone does <strong className="text-neutral-200">not</strong>{" "}
          mean anything is deprecated — it points at the policy. When an endpoint
          is actually retiring, two more headers appear on its responses:
        </p>
        <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-black/40 p-4 font-mono text-[12.5px] leading-relaxed text-neutral-200">
{`Deprecation: @1780272000
Sunset: Wed, 01 Jul 2026 00:00:00 GMT
Link: <${POLICY_URL}>; rel="deprecation"; type="text/html",
      <https://api.agentcost.tech/v2/pricing>; rel="successor-version"`}
        </pre>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <code className="font-mono text-[13px] text-neutral-200">Deprecation</code>{" "}
            is a Structured Fields Date — an <code className="font-mono">@</code>{" "}
            followed by whole seconds since the Unix epoch — marking when the
            endpoint was announced as deprecated. It keeps working.
          </li>
          <li>
            <code className="font-mono text-[13px] text-neutral-200">Sunset</code>{" "}
            (RFC 8594) is an HTTP-date marking when it stops working. It is never
            earlier than the deprecation instant.
          </li>
          <li>
            A{" "}
            <code className="font-mono text-[13px] text-neutral-200">
              successor-version
            </code>{" "}
            link points at the replacement, when there is one.
          </li>
        </ul>
        <p>
          If your client sees a{" "}
          <code className="font-mono text-[13px] text-neutral-200">Sunset</code>{" "}
          header, you have until that date. Log it, and migrate.
        </p>
      </div>

      <h2 className="mt-12 mb-4 text-xl font-semibold text-white">Notice period</h2>
      <p className="text-[14px] leading-relaxed text-neutral-400">
        At least{" "}
        <strong className="text-neutral-200">{MINIMUM_NOTICE_DAYS} days</strong>{" "}
        between the <code className="font-mono text-[13px]">Deprecation</code>{" "}
        date and the <code className="font-mono text-[13px]">Sunset</code> date on
        any public endpoint. The headers are the notice — you do not have to be
        subscribed to anything to receive it.
      </p>

      <h2 className="mt-12 mb-4 text-xl font-semibold text-white">
        Currently deprecated
      </h2>
      {DEPRECATIONS.length === 0 ? (
        <p className="rounded-xl border border-neutral-800 bg-neutral-950/40 p-5 text-[14px] text-neutral-400">
          Nothing. No endpoint in{" "}
          <code className="font-mono text-[13px] text-neutral-200">/v1/</code> is
          deprecated or scheduled for retirement, so no response currently carries
          a <code className="font-mono text-[13px]">Deprecation</code> or{" "}
          <code className="font-mono text-[13px]">Sunset</code> header.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left text-[13.5px]">
            <thead className="bg-white/3 text-neutral-400">
              <tr>
                <th className="px-4 py-3 font-medium">Endpoint</th>
                <th className="px-4 py-3 font-medium">Deprecated</th>
                <th className="px-4 py-3 font-medium">Sunset</th>
                <th className="px-4 py-3 font-medium">Replacement</th>
              </tr>
            </thead>
            <tbody>
              {DEPRECATIONS.map((entry) => (
                <tr key={entry.path} className="border-t border-white/6">
                  <td className="px-4 py-3 font-mono text-neutral-200">{entry.path}</td>
                  <td className="px-4 py-3 text-neutral-400">{entry.deprecatedOn}</td>
                  <td className="px-4 py-3 text-neutral-400">{entry.sunsetOn}</td>
                  <td className="px-4 py-3 text-neutral-400">
                    {entry.replacement ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-12 mb-4 text-xl font-semibold text-white">
        Model deprecations are a different thing
      </h2>
      <p className="text-[14px] leading-relaxed text-neutral-400">
        This page is about the AgentCost API retiring. Providers also retire{" "}
        <em>models</em>, and that is tracked separately — see{" "}
        <code className="rounded bg-white/6 px-1.5 py-0.5 font-mono text-[13px] text-neutral-200">
          GET /api/v1/pricing/deprecations
        </code>{" "}
        or the{" "}
        <Link
          href="/docs/mcp"
          className="text-neutral-200 underline underline-offset-4 hover:text-white"
        >
          list_model_deprecations
        </Link>{" "}
        MCP tool.
      </p>

      <p className="mt-10 text-[14px] text-neutral-400">
        Related:{" "}
        <Link
          href="/docs/api"
          className="text-neutral-200 underline underline-offset-4 hover:text-white"
        >
          REST API reference
        </Link>{" "}
        ·{" "}
        <a
          href="/openapi.json"
          className="text-neutral-200 underline underline-offset-4 hover:text-white"
        >
          OpenAPI spec
        </a>
      </p>
    </div>
  );
}
