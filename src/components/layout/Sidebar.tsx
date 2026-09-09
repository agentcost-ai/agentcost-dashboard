"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ChevronsUpDown,
  Cpu,
  FileText,
  Grid2x2Plus,
  LayoutDashboard,
  List,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  User,
  Users,
  Workflow,
  X,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api, type AgentStats } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectSwitcher } from "@/components/layout/ProjectSwitcher";
import { useActiveProject } from "@/contexts/ActiveProjectContext";


type Item = { name: string; href: string; icon: LucideIcon };

const READ: Item[] = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Workflows", href: "/workflows", icon: Workflow },
  { name: "Models", href: "/models", icon: Cpu },
  { name: "Events", href: "/events", icon: List },
];

const ACT: Item[] = [
  { name: "Optimizations", href: "/optimizations", icon: Zap },
  { name: "Guardrails", href: "/guardrails", icon: ShieldCheck },
  { name: "Reports", href: "/reports", icon: FileText },
];

const FOOTER: Item[] = [
  { name: "Feedback", href: "/feedback", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Docs", href: "/docs/sdk", icon: BookOpen },
];

const VERSION = "v0.1.0";
const TOP_AGENTS = 5;

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

function NavItem({
  item,
  active,
  collapsed,
  count,
  onClick,
}: {
  item: Item;
  active: boolean;
  collapsed: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.name : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-8 items-center gap-2.5 rounded-md text-[13px] font-medium transition-colors",
        collapsed ? "justify-center px-0" : "px-2",
        active ? "bg-white/8 text-white" : "text-neutral-300 hover:bg-white/5 hover:text-white",
      )}
    >
      <item.icon
        size={18}
        strokeWidth={1.75}
        className={cn("shrink-0", active ? "text-neutral-100" : "text-neutral-400 group-hover:text-neutral-200")}
      />
      {!collapsed && <span className="truncate">{item.name}</span>}
      {!collapsed && count ? (
        <span className="ml-auto text-[12px] tabular-nums text-red-300">{count}</span>
      ) : null}
    </Link>
  );
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { activeProject } = useActiveProject();
  const [collapsed, setCollapsed] = useState(false);
  const isCollapsed = collapsed && !mobileOpen;
  const [menuOpen, setMenuOpen] = useState(false);
  const [breaching, setBreaching] = useState(0);
  const [topAgents, setTopAgents] = useState<AgentStats[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", collapsed ? "3.5rem" : "15rem");
  }, [collapsed]);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Live state for the nav: breaching agents on Guardrails, the top spenders
  // under Agents. Last 7 days, refetched when the project changes, not on
  // every navigation.
  useEffect(() => {
    if (!api.hasProjectAccess()) return;
    let cancelled = false;
    api
      .getGuardrailCompliance("7d")
      .then((res) => {
        if (!cancelled) setBreaching(res.agents.filter((a) => a.status === "breach").length);
      })
      .catch(() => {});
    api
      .getAgentStats("7d", TOP_AGENTS)
      .then((rows) => {
        if (!cancelled) setTopAgents(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeProject?.id]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const activeAgent = pathname.startsWith("/agents/") ? decodeURIComponent(pathname.slice("/agents/".length)) : null;

  const initials = (() => {
    if (!user) return "U";
    if (user.name) {
      const parts = user.name.trim().split(/\s+/);
      return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0]).toUpperCase();
    }
    return user.email[0].toUpperCase();
  })();
  const displayName = user?.name || user?.email.split("@")[0] || "User";

  return (
    <aside
      aria-label="Main sidebar"
      className={cn(
        "fixed left-0 top-0 z-40 flex h-dvh flex-col bg-[#0a0a0b]",
        "border-r border-white/6 lg:border-r-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "w-14" : "w-60",
      )}
      style={{ transition: "width 0.18s ease-out, transform 0.18s ease-out" }}
    >
      {/* Brand */}
      <div className={cn("flex h-12 items-center", isCollapsed ? "justify-center px-0" : "justify-between pl-4 pr-2")}>
        <Link href="/dashboard" className="flex items-center gap-2" aria-label="AgentCost home">
          <Grid2x2Plus size={18} className="text-sky-400" strokeWidth={1.75} />
          {!isCollapsed && <span className="text-[14px] font-semibold tracking-tight text-white">AgentCost</span>}
        </Link>
        {!isCollapsed && (
          <>
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="hidden size-7 items-center justify-center rounded-md text-neutral-500 hover:bg-white/5 hover:text-neutral-200 lg:flex"
            >
              <PanelLeftClose size={15} strokeWidth={1.75} />
            </button>
            <button
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="flex size-9 items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </>
        )}
      </div>
      {isCollapsed && (
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="mx-auto mb-1 flex size-8 items-center justify-center rounded-md text-neutral-500 hover:bg-white/5 hover:text-neutral-200"
        >
          <PanelLeftOpen size={15} strokeWidth={1.75} />
        </button>
      )}

      {/* Workspace */}
      <div className={cn("pb-2", isCollapsed ? "px-1" : "px-2")}>
        <ProjectSwitcher collapsed={isCollapsed} />
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto", isCollapsed ? "px-1.5" : "px-2")}>
        <div className="space-y-px">
          {READ.map((item) => (
            <div key={item.href}>
              <NavItem item={item} active={isActive(item.href)} collapsed={isCollapsed} onClick={onMobileClose} />
              {item.href === "/agents" && !isCollapsed && topAgents.length > 0 && (
                <div className="relative my-px ml-4 border-l border-white/8 pl-2">
                  {topAgents.map((a) => {
                    const active = activeAgent === a.agent_name;
                    return (
                      <Link
                        key={a.agent_name}
                        href={`/agents/${encodeURIComponent(a.agent_name)}`}
                        onClick={onMobileClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-7 items-center rounded-md px-2 text-[12.5px] transition-colors",
                          active ? "bg-white/8 text-white" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100",
                        )}
                      >
                        <span className="truncate">{a.agent_name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={cn("my-3 border-t border-white/6", !isCollapsed && "mx-2")} />

        <div className="space-y-px">
          {ACT.map((item) => (
            <NavItem
              key={item.href}
              item={item}
              active={isActive(item.href)}
              collapsed={isCollapsed}
              count={item.href === "/guardrails" ? breaching : undefined}
              onClick={onMobileClose}
            />
          ))}
        </div>
      </nav>

      {/* Footer links */}
      <div className={cn("space-y-px pb-1 pt-2", isCollapsed ? "px-1.5" : "px-2")}>
        {FOOTER.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} collapsed={isCollapsed} onClick={onMobileClose} />
        ))}
      </div>

      {/* Account */}
      <div ref={menuRef} className={cn("relative border-t border-white/6", isCollapsed ? "p-1.5" : "p-2")}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={isCollapsed ? displayName : undefined}
          className={cn(
            "flex w-full items-center gap-2.5 rounded-md text-left transition-colors hover:bg-white/5",
            isCollapsed ? "justify-center px-0 py-1.5" : "px-2 py-1.5",
          )}
        >
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/10 text-[10px] font-semibold text-neutral-100">
            {initials}
          </span>
          {!isCollapsed && (
            <>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium leading-tight text-white">{displayName}</span>
                <span className="block truncate text-[11px] leading-tight text-neutral-500">{user?.email}</span>
              </span>
              <ChevronsUpDown size={13} className="shrink-0 text-neutral-500" />
            </>
          )}
        </button>

        {menuOpen && (
          <div
            role="menu"
            className={cn(
              "absolute bottom-full z-50 mb-1 overflow-hidden rounded-lg border border-white/8 bg-[#141417] p-1 shadow-2xl shadow-black/60",
              isCollapsed ? "left-1.5 w-52" : "left-2 right-2",
            )}
          >
            <div className="px-2 py-1.5">
              <p className="truncate text-[12px] text-neutral-400">{user?.email}</p>
            </div>
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-neutral-200 hover:bg-white/5 hover:text-white"
            >
              <User size={14} strokeWidth={1.75} />
              Account settings
            </Link>
            <button
              role="menuitem"
              onClick={async () => {
                setMenuOpen(false);
                await logout();
              }}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-red-300 hover:bg-red-500/10"
            >
              <LogOut size={14} strokeWidth={1.75} />
              Sign out
            </button>
            <p className="px-2 pb-1 pt-2 text-[11px] text-neutral-600">AgentCost {VERSION}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
