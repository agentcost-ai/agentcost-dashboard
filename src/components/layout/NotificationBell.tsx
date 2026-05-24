"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import { api, type NotificationItem } from "@/lib/api";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 60_000;

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString();
}

function severityIcon(severity: NotificationItem["severity"]) {
  if (severity === "critical")
    return <AlertCircle size={16} className="text-red-400 shrink-0" />;
  if (severity === "warning")
    return <AlertTriangle size={16} className="text-amber-400 shrink-0" />;
  return <Info size={16} className="text-sky-400 shrink-0" />;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await api.getUnreadNotificationCount();
      setUnreadCount(data.unread_count);
    } catch {
      // Silently ignore; the bell shouldn't break the dashboard
    }
  }, []);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.listNotifications({ limit: 20 });
      setItems(data.items);
      setUnreadCount(data.unread_count);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial unread count + polling
  useEffect(() => {
    fetchUnreadCount();
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchUnreadCount]);

  // Refresh list when opening
  useEffect(() => {
    if (open) fetchList();
  }, [open, fetchList]);

  // Close on outside click
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    const previous = items;
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await api.markNotificationRead(id);
    } catch {
      setItems(previous);
      fetchUnreadCount();
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    setMarkingAll(true);
    const previous = items;
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      await api.markAllNotificationsRead();
    } catch {
      setItems(previous);
      fetchUnreadCount();
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : "Notifications"
        }
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border border-neutral-800 bg-neutral-900 shadow-xl z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              <p className="text-xs text-neutral-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {markingAll ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CheckCheck size={12} />
              )}
              Mark all read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && items.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-neutral-500">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-sm text-red-400">
                {error}
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell
                  size={28}
                  className="mx-auto mb-3 text-neutral-700"
                />
                <p className="text-sm text-neutral-400">
                  No notifications yet
                </p>
                <p className="text-xs text-neutral-600 mt-1">
                  Budget alerts and important updates will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-800/60">
                {items.map((n) => {
                  const content = (
                    <div className="flex items-start gap-3 px-4 py-3 hover:bg-neutral-800/40 transition-colors">
                      <div className="pt-0.5">{severityIcon(n.severity)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              n.is_read
                                ? "text-neutral-400"
                                : "text-white font-medium",
                            )}
                          >
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                          )}
                        </div>
                        {n.body && (
                          <p className="mt-1 text-xs text-neutral-500 leading-relaxed line-clamp-2">
                            {n.body}
                          </p>
                        )}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-neutral-600">
                            {formatRelative(n.created_at)}
                          </span>
                          {!n.is_read && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMarkRead(n.id);
                              }}
                              className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-white transition-colors"
                            >
                              <Check size={11} />
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                  return (
                    <li key={n.id}>
                      {n.link ? (
                        <Link
                          href={n.link}
                          onClick={() => {
                            setOpen(false);
                            if (!n.is_read) handleMarkRead(n.id);
                          }}
                          className="block"
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
