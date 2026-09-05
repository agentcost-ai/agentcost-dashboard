"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Search,
  ListTree,
  ThumbsUp,
  ThumbsDown,
  Github,
  Globe,
  FileText,
  Hash,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { DOCS_PAGES, adjacentPages, type DocsPage } from "@/lib/docs-nav";
import { MethodLabel } from "./primitives";

/* ── Navigation model ────────────────────────────────────────────────── */

const GET_STARTED = [
  { label: "Introduction", href: "/docs" },
  { label: "Quick start", href: "/docs#quick-start" },
  { label: "Install the SDK", href: "/docs/sdk#installation" },
];

const RESOURCES = [
  { label: "OpenAPI spec", href: "/openapi.json", external: true },
  { label: "llms.txt", href: "/llms.txt", external: true },
  { label: "GitHub", href: "https://github.com/agentcost-ai", external: true },
  { label: "PyPI package", href: "https://pypi.org/project/agentcost/", external: true },
];

const LEARN: DocsPage[] = DOCS_PAGES.filter((p) => p.href !== "/docs");

interface SearchHit {
  title: string;
  group: string;
  href: string;
  method?: string;
}

const SEARCH_INDEX: SearchHit[] = DOCS_PAGES.flatMap((page) => [
  { title: page.label === "Overview" ? "Introduction" : page.label, group: "Pages", href: page.href },
  ...page.sections.map((s) => ({
    title: s.label,
    group: page.label,
    href: `${page.href}#${s.id}`,
    method: s.method,
  })),
]);

/* ── Sidebar ─────────────────────────────────────────────────────────── */

function NavLink({
  href,
  active,
  children,
  external,
  onNavigate,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
  external?: boolean;
  onNavigate?: () => void;
}) {
  const className = cn(
    "flex items-center gap-2 rounded-lg px-3 py-[7px] text-[14px] transition-colors",
    active ? "bg-white/10 font-medium text-white" : "text-neutral-400 hover:text-white",
  );
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onNavigate}>
      {children}
    </Link>
  );
}

function Sidebar({
  pathname,
  onOpenSearch,
  onNavigate,
}: {
  pathname: string;
  onOpenSearch: () => void;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const isOpen = (page: DocsPage) => open[page.href] ?? page.href === pathname;

  return (
    <nav aria-label="Documentation" className="flex h-full flex-col">
      <button
        type="button"
        onClick={onOpenSearch}
        className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[14px] text-neutral-400 transition-colors hover:border-white/20 hover:text-neutral-200"
      >
        <Search size={15} aria-hidden />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="rounded border border-white/10 px-1.5 py-0.5 font-sans text-[11px] text-neutral-500">
          Ctrl K
        </kbd>
      </button>

      <div className="mt-6 space-y-7 overflow-y-auto pb-6">
        <div>
          <p className="mb-1.5 px-3 text-[14px] font-semibold text-white">Get started</p>
          {GET_STARTED.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              active={item.href === pathname}
              onNavigate={onNavigate}
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[14px] font-semibold text-white">Learn</p>
          {LEARN.map((page) => {
            const current = page.href === pathname;
            const expanded = isOpen(page);
            return (
              <div key={page.href}>
                <div className="flex items-center">
                  <NavLink href={page.href} active={current} onNavigate={onNavigate}>
                    {page.label}
                  </NavLink>
                  {page.sections.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setOpen((o) => ({ ...o, [page.href]: !expanded }))}
                      className="ml-auto rounded p-1 text-neutral-600 transition-colors hover:text-neutral-300"
                      aria-label={expanded ? `Collapse ${page.label}` : `Expand ${page.label}`}
                    >
                      {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {expanded && page.sections.length > 0 && (
                  <ul className="my-1 ml-4 border-l border-white/10 pl-1">
                    {page.sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`${page.href}#${s.id}`}
                          onClick={onNavigate}
                          className="flex items-center gap-2 rounded-md px-2 py-[5px] text-[13px] text-neutral-500 transition-colors hover:text-white"
                        >
                          {s.method && <MethodLabel method={s.method} />}
                          <span className="truncate">{s.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[14px] font-semibold text-white">Resources</p>
          {RESOURCES.map((item) => (
            <NavLink key={item.href} href={item.href} external={item.external}>
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ── Search (Ctrl K) ─────────────────────────────────────────────────── */

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const q = query.trim().toLowerCase();
  const hits = useMemo(
    () =>
      q
        ? SEARCH_INDEX.filter(
            (h) => h.title.toLowerCase().includes(q) || h.group.toLowerCase().includes(q),
          ).slice(0, 14)
        : SEARCH_INDEX.filter((h) => h.group === "Pages"),
    [q],
  );

  // Group hits under their page so a result reads "API › Ingest events".
  const groups = useMemo(() => {
    const out: Array<{ group: string; items: Array<SearchHit & { index: number }> }> = [];
    hits.forEach((hit, index) => {
      const g = out.find((x) => x.group === hit.group);
      if (g) g.items.push({ ...hit, index });
      else out.push({ group: hit.group, items: [{ ...hit, index }] });
    });
    return out;
  }, [hits]);

  const go = useCallback(
    (hit: SearchHit) => {
      onClose();
      router.push(hit.href);
    },
    [onClose, router],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[14vh] backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      <div
        className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c0d] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.9)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-5">
          <Search size={18} className="shrink-0 text-neutral-500" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setCursor((c) => Math.min(c + 1, hits.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setCursor((c) => Math.max(c - 1, 0));
              } else if (e.key === "Enter" && hits[cursor]) {
                go(hits[cursor]);
              } else if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder="Search documentation"
            className="h-14 w-full bg-transparent text-[16px] text-white outline-none placeholder:text-neutral-500 focus:outline-none focus-visible:outline-none"
          />
          <kbd className="hidden shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 font-sans text-[11px] text-neutral-500 sm:block">
            esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto border-t border-white/8 px-2 py-2">
          {hits.length === 0 && (
            <p className="px-4 py-8 text-center text-[14px] text-neutral-500">
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          )}
          {groups.map((g) => (
            <div key={g.group} className="py-1.5">
              <p className="px-3 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-500">
                {g.group}
              </p>
              <ul>
                {g.items.map((hit) => (
                  <li key={hit.href + hit.title}>
                    <button
                      type="button"
                      onMouseEnter={() => setCursor(hit.index)}
                      onClick={() => go(hit)}
                      className={cn(
                        "flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors",
                        hit.index === cursor ? "bg-white/8 text-white" : "text-neutral-300",
                      )}
                    >
                      {hit.method ? (
                        <MethodLabel method={hit.method} />
                      ) : hit.group === "Pages" ? (
                        <FileText size={15} className="shrink-0 text-neutral-500" aria-hidden />
                      ) : (
                        <Hash size={15} className="shrink-0 text-neutral-500" aria-hidden />
                      )}
                      <span className="flex-1 truncate">{hit.title}</span>
                      {hit.index === cursor && (
                        <CornerDownLeft size={14} className="shrink-0 text-neutral-500" aria-hidden />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-white/8 px-5 py-2.5 text-[11.5px] text-neutral-500">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 px-1 font-sans">↑</kbd>
            <kbd className="rounded border border-white/10 px-1 font-sans">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded border border-white/10 px-1 font-sans">↵</kbd>
            open
          </span>
          <span className="ml-auto">{hits.length} result{hits.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}

/* ── On this page ────────────────────────────────────────────────────── */

interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

function useHeadings(articleRef: React.RefObject<HTMLElement | null>) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("section[id] > h2, [id] > h3"),
    );
    const found: Heading[] = nodes
      .map((h) => {
        const id = h.parentElement?.id;
        if (!id) return null;
        return {
          id,
          text: h.textContent?.trim() ?? "",
          level: h.tagName === "H2" ? 2 : 3,
        } as Heading;
      })
      .filter((h): h is Heading => h !== null);
    setHeadings(found);
    setActive(found[0]?.id ?? null);

    const targets = found
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [articleRef, pathname]);

  return { headings, active };
}

function OnThisPage({ headings, active }: { headings: Heading[]; active: string | null }) {
  if (headings.length < 2) return null;
  return (
    <nav aria-label="On this page" className="text-[14px]">
      <p className="mb-3 flex items-center gap-2 font-medium text-white">
        <ListTree size={15} aria-hidden />
        On this page
      </p>
      <ul>
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={cn(
                "block border-l py-[5px] pr-2 transition-colors",
                h.level === 3 ? "pl-7" : "pl-4",
                active === h.id
                  ? "border-white font-medium text-white"
                  : "border-white/10 text-neutral-400 hover:text-white",
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ── Footer ──────────────────────────────────────────────────────────── */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function Helpful({ pathname }: { pathname: string }) {
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const vote = (value: "yes" | "no") => {
    setAnswer(value);
    track("docs_helpful", { page: pathname, helpful: value === "yes" });
    // Stored anonymously (page + answer) and tallied in the admin console.
    fetch(`${API_URL}/v1/docs/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: pathname, helpful: value === "yes" }),
      keepalive: true,
    }).catch(() => {});
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
      <span className="text-neutral-400">
        {answer ? "Thanks for the feedback." : "Was this page helpful?"}
      </span>
      {!answer && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => vote("yes")}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-neutral-200 transition-colors hover:border-white/25 hover:text-white"
          >
            <ThumbsUp size={14} /> Yes
          </button>
          <button
            type="button"
            onClick={() => vote("no")}
            className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-neutral-200 transition-colors hover:border-white/25 hover:text-white"
          >
            <ThumbsDown size={14} /> No
          </button>
        </div>
      )}
    </div>
  );
}

function PagerCard({
  href,
  label,
  direction,
}: {
  href: string;
  label: string;
  direction: "prev" | "next";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-w-[220px] flex-col gap-1 rounded-xl border border-white/10 p-4 !no-underline transition-colors hover:border-white/25",
        direction === "next" ? "items-end text-right" : "items-start",
      )}
    >
      <span className="text-[15px] font-medium text-white">{label}</span>
      <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
        {direction === "prev" && <ChevronRight size={12} className="rotate-180" aria-hidden />}
        {direction === "prev" ? "Previous" : "Next"}
        {direction === "next" && <ChevronRight size={12} aria-hidden />}
      </span>
    </Link>
  );
}

/* ── Shell ───────────────────────────────────────────────────────────── */

export function DocsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const articleRef = useRef<HTMLElement | null>(null);
  const { headings, active } = useHeadings(articleRef);
  const { prev, next } = useMemo(() => adjacentPages(pathname), [pathname]);
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const wide = pathname === "/docs/models";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[90rem] gap-10 px-4 sm:px-6">
      {searchOpen && <SearchDialog onClose={() => setSearchOpen(false)} />}

      <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-5.5rem)] w-64 shrink-0 rounded-xl bg-white/[0.03] p-4 lg:block">
        <Sidebar pathname={pathname} onOpenSearch={() => setSearchOpen(true)} />
      </aside>

      <div className="min-w-0 flex-1">
        <div className="border-b border-white/10 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNav((v) => !v)}
            className="flex items-center gap-2 text-sm text-neutral-200"
            aria-expanded={mobileNav}
          >
            <ChevronRight size={14} className={cn("transition-transform", mobileNav && "rotate-90")} aria-hidden />
            Browse documentation
          </button>
          {mobileNav && (
            <div className="mt-4 rounded-xl bg-white/[0.03] p-4">
              <Sidebar
                pathname={pathname}
                onOpenSearch={() => setSearchOpen(true)}
                onNavigate={() => setMobileNav(false)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-12">
          <article
            ref={articleRef}
            className={cn(
              "docs-prose min-w-0 flex-1 py-10 sm:py-12",
              wide ? "max-w-none" : "max-w-[42rem]",
            )}
          >
            {children}

            <footer className="mt-16 space-y-8">
              <Helpful pathname={pathname} />
              {(prev || next) && (
                <div className="flex flex-wrap items-stretch justify-between gap-4">
                  {prev ? <PagerCard href={prev.href} label={prev.label} direction="prev" /> : <span />}
                  {next && <PagerCard href={next.href} label={next.label} direction="next" />}
                </div>
              )}
              <div className="flex items-center gap-5 border-t border-white/10 pt-6 text-neutral-400">
                <a href="https://github.com/agentcost-ai" target="_blank" rel="noopener noreferrer" className="!no-underline hover:text-white" aria-label="GitHub">
                  <Github size={18} />
                </a>
                <a href="https://agentcost.tech" className="!no-underline hover:text-white" aria-label="Website">
                  <Globe size={18} />
                </a>
              </div>
            </footer>
          </article>

          {!wide && (
            <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-5.5rem)] w-56 shrink-0 overflow-y-auto py-12 xl:block">
              <OnThisPage headings={headings} active={active} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
