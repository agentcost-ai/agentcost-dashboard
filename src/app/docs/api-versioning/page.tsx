import type { Metadata } from "next";
import Link from "next/link";

import { SITE_URL } from "@/lib/site";
import {
  DEPRECATIONS,
  MINIMUM_NOTICE_DAYS,
  POLICY_URL,
} from "@/lib/http/deprecation";
import { breadcrumbList, jsonLd } from "@/lib/structured-data";
import { PageHeader, Section } from "@/components/docs/primitives";

export const metadata: Metadata = {
  title: "AgentCost API Versioning & Deprecation Policy",
  description:
    "How the AgentCost API is versioned, how deprecations are signalled with Deprecation and Sunset headers, and the minimum notice before any endpoint is retired.",
  alternates: { canonical: POLICY_URL },
};

export default function ApiVersioningPage() {
  return (
    <>
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

        <PageHeader eyebrow="Policy" title={<>API Versioning &amp; Deprecation</>}>
        <p>An agent should not integrate against a surface that can change
            without warning. This is what we promise about changes, and how you
            find out about them in the response itself rather than from a blog.</p>
      </PageHeader>

        <Section id="versioning" title="Versioning">
          <div className="space-y-4">
            <p>
              The API is versioned in the URL path. Every endpoint lives under{" "}
              <code>
                /v1/
              </code>
              , on both{" "}
              <code>
                https://api.agentcost.tech/v1/…
              </code>{" "}
              and the cached mirror at{" "}
              <code>
                {SITE_URL}/api/v1/…
              </code>
              .
            </p>
            <p>
              Within a version we only make additive changes: new endpoints, new
              optional request fields, new fields in a response. Existing field
              names keep their meaning and their type. A change that would break
              a working client — removing a field, narrowing a type, changing a
              status code — means a new version path, not an edit to this one.
            </p>
            <p>
              Treat unknown response fields as forward compatibility, not as
              errors. Your client should ignore fields it does not recognise.
            </p>
          </div>
        </Section>

        <Section id="how-a-deprecation-is-signalled" title="How a deprecation is signalled">
          <div className="space-y-4">
            <p>
              Every API response carries a link to this page, so a client can
              find the policy without knowing where to look:
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/8 bg-[#0c0c0e] p-4 font-mono text-[13px] leading-6 text-neutral-200">
{`Link: <${POLICY_URL}>; rel="deprecation"; type="text/html"`}
            </pre>
            <p>
              That link alone does{" "}
              <strong className="text-neutral-200">not</strong> mean anything is
              deprecated — it points at the policy. When an endpoint is actually
              retiring, two more headers appear on its responses:
            </p>
            <pre className="overflow-x-auto rounded-lg border border-white/8 bg-[#0c0c0e] p-4 font-mono text-[13px] leading-6 text-neutral-200">
{`Deprecation: @1782864000
Sunset: Wed, 01 Jul 2026 00:00:00 GMT
Link: <${POLICY_URL}>; rel="deprecation"; type="text/html",
      <https://api.agentcost.tech/v2/pricing>; rel="successor-version"`}
            </pre>
            <ul className="ml-5 space-y-2">
              <li>
                <code>
                  Deprecation
                </code>{" "}
                is a Structured Fields Date — an{" "}
                <code>@</code> followed by whole
                seconds since the Unix epoch — marking when the endpoint was
                announced as deprecated. It keeps working.
              </li>
              <li>
                <code>
                  Sunset
                </code>{" "}
                (RFC 8594) is an HTTP-date marking when it stops working. It is
                never earlier than the deprecation instant.
              </li>
              <li>
                A{" "}
                <code>
                  successor-version
                </code>{" "}
                link points at the replacement, when there is one.
              </li>
            </ul>
            <p>
              If your client sees a{" "}
              <code>Sunset</code>{" "}
              header, you have until that date. Log it, and migrate.
            </p>
          </div>
        </Section>

        <Section id="notice-period" title="Notice period">
          <p>
            At least{" "}
            <strong className="text-neutral-200">{MINIMUM_NOTICE_DAYS} days</strong>{" "}
            between the{" "}
            <code>Deprecation</code>{" "}
            date and the{" "}
            <code>Sunset</code>{" "}
            date on any public endpoint. The headers are the notice — you do not
            have to be subscribed to anything to receive it.
          </p>
        </Section>

        <Section id="currently-deprecated" title="Currently deprecated">
          {DEPRECATIONS.length === 0 ? (
            <p>
              Nothing. No endpoint in{" "}
              <code>
                /v1/
              </code>{" "}
              is deprecated or scheduled for retirement, so no response currently
              carries a{" "}
              <code>Deprecation</code>{" "}
              or{" "}
              <code>Sunset</code>{" "}
              header.
            </p>
          ) : (
            <div className="docs-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="font-medium">Endpoint</th>
                    <th className="font-medium">Deprecated</th>
                    <th className="font-medium">Sunset</th>
                    <th className="font-medium">Replacement</th>
                  </tr>
                </thead>
                <tbody>
                  {DEPRECATIONS.map((entry) => (
                    <tr key={entry.path}>
                      <td className="font-mono text-neutral-200">
                        {entry.path}
                      </td>
                      <td>
                        {entry.deprecatedOn}
                      </td>
                      <td>{entry.sunsetOn}</td>
                      <td>
                        {entry.replacement ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section id="model-deprecations-are-a-different-thing" title="Model deprecations are a different thing">
          <p>
            This page is about the AgentCost API retiring. Providers also retire{" "}
            <em>models</em>, and that is tracked separately — see{" "}
            <code>
              GET /api/v1/pricing/deprecations
            </code>{" "}
            or the{" "}
            <Link
              href="/docs/mcp"
             
            >
              list_model_deprecations
            </Link>{" "}
            MCP tool.
          </p>
        </Section>

        <p>
          Related:{" "}
          <Link
            href="/docs/api"
           
          >
            REST API reference
          </Link>{" "}
          ·{" "}
          <Link
            href="/docs/mcp"
           
          >
            MCP server
          </Link>{" "}
          ·{" "}
          <a
            href="/openapi.json"
           
          >
            OpenAPI spec
          </a>
        </p>
    </>
  );
}
