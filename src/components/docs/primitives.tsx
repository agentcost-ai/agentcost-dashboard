"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Copy,
  Check,
  Info,
  TriangleAlert,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { endpointId } from "@/lib/docs-nav";

/* ── Page header ─────────────────────────────────────────────────────── */

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-10">
      {eyebrow && <p className="text-sm text-neutral-400">{eyebrow}</p>}
      <div className="mt-2 flex items-start justify-between gap-6">
        <h1 className="text-[2.25rem] font-bold leading-[1.15] tracking-tight text-white">
          {title}
        </h1>
        <CopyPageButton />
      </div>
      {children && (
        <div className="mt-3 space-y-3 text-[17px] leading-7 text-neutral-400">
          {children}
        </div>
      )}
    </header>
  );
}

/** Copies the readable text of the current article. */
function CopyPageButton() {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const article = document.querySelector("article");
        if (!article) return;
        await navigator.clipboard.writeText(article.innerText);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="mt-1.5 hidden shrink-0 items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-neutral-300 transition-colors hover:border-white/25 hover:text-white sm:inline-flex"
      title="Copy page as text"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? "Copied" : "Copy page"}
    </button>
  );
}

/* ── Sections ────────────────────────────────────────────────────────── */

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: React.ReactNode;
  /** Accepted for backwards compatibility; no longer rendered. */
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="docs-section scroll-mt-24 pt-12 first:pt-0">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function SubSection({
  id,
  title,
  children,
}: {
  id?: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="docs-section scroll-mt-24">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

/* ── Cards ───────────────────────────────────────────────────────────── */

export function CardGrid({
  cols = 3,
  children,
}: {
  cols?: 2 | 3;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-4",
        cols === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2",
      )}
    >
      {children}
    </div>
  );
}

export function Card({
  href,
  icon,
  title,
  children,
  external,
}: {
  href: string;
  /** A rendered icon element (server components can pass JSX, not component refs). */
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  external?: boolean;
}) {
  const body = (
    <>
      {icon && <span className="block text-white" aria-hidden>{icon}</span>}
      <p className={cn("text-[15px] font-semibold leading-snug text-white", icon && "mt-4")}>
        {title}
        {external && (
          <ArrowUpRight size={13} className="ml-1 inline text-neutral-500" aria-hidden />
        )}
      </p>
      {children && (
        <p className="mt-1.5 text-sm leading-6 text-neutral-400">{children}</p>
      )}
    </>
  );
  const className =
    "docs-card block rounded-xl border border-white/10 bg-white/[0.02] p-5 !no-underline transition-colors hover:border-white/25 hover:bg-white/[0.04]";
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

/* ── Code ────────────────────────────────────────────────────────────── */

export function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className={cn(
        "rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-white/8 hover:text-white",
        className,
      )}
      aria-label="Copy to clipboard"
      title="Copy"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

export function CodeBlock({
  code,
  language = "bash",
  title,
}: {
  code: string;
  language?: string;
  /** Optional filename or caption shown instead of the language. */
  title?: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0e]">
      <div className="flex h-10 items-center justify-between border-b border-white/8 pl-4 pr-2">
        <span className="text-xs text-neutral-400">{title ?? language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="overflow-x-auto p-4 text-[13.5px] leading-6 text-neutral-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ── Callouts ────────────────────────────────────────────────────────── */

export function Callout({
  tone = "note",
  title,
  children,
}: {
  tone?: "note" | "warning";
  title?: string;
  children: React.ReactNode;
}) {
  const Icon = tone === "warning" ? TriangleAlert : Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 text-[15px] leading-6",
        tone === "warning"
          ? "border-amber-400/20 bg-amber-400/[0.05] text-neutral-200"
          : "border-white/10 bg-white/[0.03] text-neutral-300",
      )}
    >
      <Icon
        size={18}
        className={cn("mt-0.5 shrink-0", tone === "warning" ? "text-amber-400" : "text-neutral-400")}
        aria-hidden
      />
      <div className="min-w-0 space-y-2">
        {title && <p className="font-medium text-white">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/* ── Endpoints ───────────────────────────────────────────────────────── */

const METHOD_TONE: Record<string, string> = {
  GET: "bg-emerald-400/10 text-emerald-400",
  POST: "bg-sky-400/10 text-sky-400",
  PUT: "bg-amber-400/10 text-amber-400",
  PATCH: "bg-amber-400/10 text-amber-400",
  DELETE: "bg-red-400/10 text-red-400",
};

export function MethodLabel({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[18px] min-w-[38px] items-center justify-center rounded px-1.5 font-mono text-[10px] font-bold uppercase leading-none tracking-wide",
        METHOD_TONE[method] ?? "bg-white/10 text-neutral-300",
        className,
      )}
    >
      {method === "DELETE" ? "DEL" : method}
    </span>
  );
}

export function Endpoint({
  method,
  path,
  description,
  auth = true,
  children,
}: {
  method: string;
  path: string;
  description: string;
  auth?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article
      id={endpointId(method, path)}
      className="docs-section scroll-mt-24 border-t border-white/10 pt-8"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <MethodLabel method={method} />
        <code className="!border-0 !bg-transparent !p-0 font-mono text-[15px] font-medium text-white">
          {path}
        </code>
        {auth && (
          <span className="ml-auto rounded-md border border-white/10 px-2 py-0.5 text-[11px] text-neutral-400">
            Auth required
          </span>
        )}
      </div>
      <p className="text-neutral-300">{description}</p>
      {children}
    </article>
  );
}

/** Legacy alias kept so migrated pages compile unchanged. */
export const MethodBadge = MethodLabel;
