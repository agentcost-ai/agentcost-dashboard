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
import { seriesColor } from "@/lib/palette";
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
        "group relative flex h-9 items-center gap-3 rounded-xl text-[13.5px] transition-colors",
        collapsed ? "justify-center px-0" : "px-3",
        active
          ? collapsed
            ? "bg-indigo-300/15 text-white ring-1 ring-inset ring-indigo-300/30"
            : "bg-white/[0.07] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
      )}
    >
      {/* The one mark that says where you are. With no label beside it the
          collapsed rail leans on it harder: a taller pill and a tinted tile. */}
      {active && (
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-full bg-indigo-300",
            collapsed ? "-left-2 h-6 w-1 shadow-[0_0_10px_rgba(165,180,252,0.8)]" : "-left-2 h-4 w-[3px]",
          )}
        />
      )}
      <item.icon
        size={17}
        strokeWidth={1.6}
        className={cn(
          "shrink-0",
          active ? (collapsed ? "text-indigo-200" : "text-white") : "text-neutral-500 group-hover:text-neutral-300",
        )}
      />
      {!collapsed && <span className="truncate">{item.name}</span>}
      {!collapsed && count ? (
        <span className="ml-auto rounded-full bg-red-400/15 px-1.5 py-px text-[11px] font-medium tabular-nums text-red-300">
          {count}
        </span>
      ) : null}
      {/* Collapsed, the count has no room: a dot keeps the warning visible. */}
      {collapsed && count ? (
        <span aria-hidden className="absolute right-2 top-1.5 size-1.5 rounded-full bg-red-400" />
      ) : null}
    </Link>
  );
}

/** Small caps heading over a group of links. A hairline when collapsed. */
function GroupLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) return <div className="mx-1.5 my-3 border-t border-white/8" />;
  return (
    <p className="mb-1.5 mt-6 px-3 text-[10.5px] font-medium uppercase tracking-[0.16em] text-neutral-600">
      {children}
    </p>
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
      <div className={cn("flex h-16 items-center", isCollapsed ? "justify-center px-0" : "justify-between pl-4 pr-2.5")}>
        <Link href="/dashboard" className="flex items-center gap-2.5" aria-label="AgentCost home">
          {/* The mark as it is everywhere else: the glyph in brand sky, no tile. */}
          <Grid2x2Plus size={22} strokeWidth={2} className="text-sky-400" />
          {!isCollapsed && <span className="text-[15px] font-semibold tracking-tight text-white">AgentCost</span>}
        </Link>
        {!isCollapsed && (
          <>
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="hidden size-8 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-white/5 hover:text-neutral-200 lg:flex"
            >
              <PanelLeftClose size={16} strokeWidth={1.6} />
            </button>
            <button
              onClick={onMobileClose}
              aria-label="Close navigation"
              className="flex size-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/5 hover:text-white lg:hidden"
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
      <div className={cn("pb-1", isCollapsed ? "px-1.5" : "px-3")}>
        <div className={cn(!isCollapsed && "rounded-xl border border-white/8 bg-white/[0.03]")}>
          <ProjectSwitcher collapsed={isCollapsed} />
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 overflow-y-auto pb-3", isCollapsed ? "px-2" : "px-3")}>
        <GroupLabel collapsed={isCollapsed}>Watch</GroupLabel>
        <div className="space-y-0.5">
          {READ.map((item) => (
            <div key={item.href}>
              <NavItem item={item} active={isActive(item.href)} collapsed={isCollapsed} onClick={onMobileClose} />
              {/* The top spenders, in the colours they carry on the charts */}
              {item.href === "/agents" && !isCollapsed && topAgents.length > 0 && (
                <div className="my-1 ml-[1.35rem] border-l border-white/8 pl-2">
                  {topAgents.map((a, i) => {
                    const active = activeAgent === a.agent_name;
                    return (
                      <Link
                        key={a.agent_name}
                        href={`/agents/${encodeURIComponent(a.agent_name)}`}
                        onClick={onMobileClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex h-8 items-center gap-2.5 rounded-lg px-2 text-[12.5px] transition-colors",
                          active ? "bg-white/[0.07] text-white" : "text-neutral-400 hover:bg-white/[0.04] hover:text-white",
                        )}
                      >
                        <span
                          aria-hidden
                          className="size-2 shrink-0 rounded-[3px]"
                          style={{ backgroundColor: seriesColor(i) }}
                        />
                        <span className="min-w-0 flex-1 truncate">{a.agent_name}</span>
                        <span className={cn("shrink-0 text-[11px] tabular-nums", active ? "text-neutral-300" : "text-neutral-600")}>
                          ${a.total_cost >= 100 ? a.total_cost.toFixed(0) : a.total_cost.toFixed(2)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        <GroupLabel collapsed={isCollapsed}>Act</GroupLabel>
        <div className="space-y-0.5">
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
      <div className={cn("space-y-0.5 border-t border-white/6 pb-2 pt-3", isCollapsed ? "px-2" : "px-3")}>
        {FOOTER.map((item) => (
          <NavItem key={item.href} item={item} active={isActive(item.href)} collapsed={isCollapsed} onClick={onMobileClose} />
        ))}
      </div>

      {/* Account */}
      <div ref={menuRef} className={cn("relative", isCollapsed ? "p-2 pt-0" : "p-3 pt-1")}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={isCollapsed ? displayName : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl text-left transition-colors",
            isCollapsed
              ? "justify-center px-0 py-1.5 hover:bg-white/5"
              : "border border-white/8 bg-white/[0.03] px-2.5 py-2 hover:border-white/14",
          )}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-200 text-[11px] font-semibold text-[#0d0d14]">
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
              "absolute bottom-full z-50 mb-1.5 overflow-hidden rounded-xl border border-white/10 bg-[#141417] p-1.5 shadow-2xl shadow-black/60",
              isCollapsed ? "left-2 w-52" : "left-3 right-3",
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
