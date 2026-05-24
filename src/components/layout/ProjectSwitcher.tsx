"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronsUpDown,
  Crown,
  FolderOpen,
  Plus,
  Clock,
  Loader2,
  Eye,
  ShieldOff,
} from "lucide-react";
import { useActiveProject } from "@/contexts/ActiveProjectContext";
import { cn } from "@/lib/utils";

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  admin: { label: "Admin", color: "bg-amber-900/30 text-amber-400" },
  member: { label: "Member", color: "bg-blue-900/30 text-blue-400" },
  viewer: { label: "Viewer", color: "bg-neutral-700/40 text-neutral-300" },
};

export function ProjectSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { projects, activeProject, selectProject, isLoading } =
    useActiveProject();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (collapsed) {
    return (
      <div className="flex h-10 items-center justify-center">
        <FolderOpen size={18} className="text-neutral-500" />
      </div>
    );
  }

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-neutral-500">
        <Loader2 size={14} className="animate-spin" />
        Loading projects…
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Link
        href="/settings"
        className="flex items-center gap-2 rounded-lg border border-dashed border-neutral-700 px-3 py-2 text-xs text-neutral-400 hover:border-primary-500 hover:text-white transition-colors"
      >
        <Plus size={14} />
        Create your first project
      </Link>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "w-full flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-2.5 py-2 text-left transition-colors",
          "hover:bg-neutral-800 focus:outline-none focus:border-primary-500",
        )}
      >
        <FolderOpen size={16} className="text-primary-400 shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] uppercase tracking-wider text-neutral-500">
            Project
          </span>
          <span className="block truncate text-sm font-medium text-white">
            {activeProject?.name ?? "Select a project"}
          </span>
        </span>
        <ChevronsUpDown size={14} className="text-neutral-500 shrink-0" />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-2 max-h-[60vh] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl"
        >
          <div className="px-3 py-2 border-b border-neutral-800">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">
              Your projects ({projects.length})
            </p>
          </div>
          <ul className="py-1">
            {projects.map((p) => {
              const isActive = p.id === activeProject?.id;
              const badge = ROLE_BADGE[p.role] ?? ROLE_BADGE.viewer;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onClick={() => {
                      selectProject(p.id);
                      setOpen(false);
                    }}
                    disabled={p.is_pending}
                    className={cn(
                      "w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "bg-neutral-800/80"
                        : "hover:bg-neutral-800/50",
                      p.is_pending && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {p.is_owner ? (
                        <Crown size={14} className="text-amber-400" />
                      ) : p.role === "viewer" ? (
                        <Eye size={14} className="text-neutral-400" />
                      ) : (
                        <FolderOpen size={14} className="text-primary-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "truncate text-sm",
                            isActive
                              ? "text-white font-medium"
                              : "text-neutral-200",
                          )}
                        >
                          {p.name}
                        </span>
                        {isActive && (
                          <Check size={14} className="text-primary-400 shrink-0" />
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            badge.color,
                          )}
                        >
                          {badge.label}
                        </span>
                        {p.is_owner && (
                          <span className="rounded-full bg-amber-900/30 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                            Owner
                          </span>
                        )}
                        {p.is_pending && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-900/30 px-1.5 py-0.5 text-[10px] font-medium text-yellow-400">
                            <Clock size={10} /> Pending invite
                          </span>
                        )}
                        {!p.is_active && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                            <ShieldOff size={10} /> Disabled
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-neutral-800 p-2">
            <Link
              href="/settings?new=1"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <Plus size={14} className="text-primary-400" />
              Create new project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
