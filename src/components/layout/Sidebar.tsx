"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Cpu,
  List,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  LogOut,
  User,
  BookOpen,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const navigation = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agents", href: "/agents", icon: Users },
  { name: "Models", href: "/models", icon: Cpu },
  { name: "Events", href: "/events", icon: List },
  { name: "Optimizations", href: "/optimizations", icon: Zap },
  { name: "Feedback", href: "/feedback", icon: MessageSquare },
  { name: "Settings", href: "/settings", icon: Settings },
];

const docsLinks = [
  { name: "SDK Documentation", href: "/docs/sdk" },
  { name: "API Reference", href: "/docs/api" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showDocsMenu, setShowDocsMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const docsMenuRef = useRef<HTMLDivElement>(null);

  // Update CSS custom property when collapsed state changes
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--sidebar-width",
      collapsed ? "4rem" : "16rem",
    );
  }, [collapsed]);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        docsMenuRef.current &&
        !docsMenuRef.current.contains(event.target as Node)
      ) {
        setShowDocsMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.name) {
      const parts = user.name.split(" ");
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    if (!user) return "User";
    return user.name || user.email.split("@")[0];
  };

  return (
    <aside
      aria-label="Main sidebar"
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-neutral-800 bg-neutral-900/50 backdrop-blur-sm",
        collapsed ? "w-16" : "w-64",
      )}
      style={{
        transition: "width 0.2s ease-out",
        willChange: "width",
      }}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-neutral-800 px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                <span className="text-sm font-bold text-white">AC</span>
              </div>
              <span className="text-lg font-semibold text-white">
                AgentCost
              </span>
            </div>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 mx-auto">
              <span className="text-sm font-bold text-white">AC</span>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              aria-label="Collapse sidebar"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="flex h-10 items-center justify-center text-neutral-400 hover:bg-neutral-800 hover:text-white border-b border-neutral-800"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary-600/10 text-primary-400"
                    : "text-neutral-400 hover:bg-neutral-800 hover:text-white",
                  collapsed && "justify-center px-2",
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  size={20}
                  className={cn(
                    "shrink-0",
                    isActive
                      ? "text-primary-400"
                      : "text-neutral-500 group-hover:text-white",
                  )}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          {/* Documentation Dropdown */}
          {!collapsed && (
            <div ref={docsMenuRef} className="relative pt-2">
              <button
                onClick={() => setShowDocsMenu(!showDocsMenu)}
                className="w-full group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BookOpen
                    size={20}
                    className="shrink-0 text-neutral-500 group-hover:text-white"
                  />
                  <span>Documentation</span>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    "transition-transform",
                    showDocsMenu && "rotate-180",
                  )}
                />
              </button>

              {showDocsMenu && (
                <div className="mt-1 ml-8 space-y-1">
                  {docsLinks.map((doc) => (
                    <Link
                      key={doc.href}
                      href={doc.href}
                      className="block px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-lg transition-colors"
                      onClick={() => setShowDocsMenu(false)}
                    >
                      {doc.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collapsed docs icon */}
          {collapsed && (
            <Link
              href="/docs/sdk"
              className="group flex items-center justify-center rounded-lg px-2 py-2.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              title="Documentation"
            >
              <BookOpen
                size={20}
                className="text-neutral-500 group-hover:text-white"
              />
            </Link>
          )}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-neutral-800 p-3">
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => !collapsed && setShowUserMenu(!showUserMenu)}
              aria-haspopup="true"
              aria-expanded={showUserMenu}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors",
                collapsed && "justify-center",
              )}
            >
              {/* Avatar */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-700 text-white font-medium text-sm">
                {getUserInitials()}
              </div>

              {!collapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {getDisplayName()}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "text-neutral-400 transition-transform shrink-0",
                      showUserMenu && "rotate-180",
                    )}
                  />
                </>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserMenu && !collapsed && (
              <div
                role="menu"
                className="absolute bottom-full left-0 right-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-neutral-700">
                  <p className="text-xs text-neutral-400">Signed in as</p>
                  <p className="text-sm text-white font-medium truncate">
                    {user?.email}
                  </p>
                </div>

                <div className="p-1">
                  <Link
                    href="/account"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white rounded transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}

            {/* Collapsed logout button */}
            {collapsed && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 mt-2 rounded-lg text-neutral-400 hover:bg-red-900/20 hover:text-red-400 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>

          {/* Version */}
          {!collapsed && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <p className="text-xs text-neutral-600 text-center">
                AgentCost v0.1.0
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
