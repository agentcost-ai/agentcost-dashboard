import { useState, useEffect, useCallback, useRef } from "react";

interface UseAutoRefreshOptions {
  enabled?: boolean;
  interval?: number; // in seconds
  onRefresh?: () => Promise<void>;
}

interface UseAutoRefreshReturn {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  refresh: () => Promise<void>;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (enabled: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
}

export function useAutoRefresh({
  enabled = false,
  interval = 30,
  onRefresh,
}: UseAutoRefreshOptions = {}): UseAutoRefreshReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(enabled);
  const [refreshInterval, setRefreshInterval] = useState(interval);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem("agentcost_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.autoRefresh === "boolean") {
          setAutoRefreshEnabled(parsed.autoRefresh);
        }
        if (typeof parsed.refreshInterval === "number") {
          setRefreshInterval(parsed.refreshInterval);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      }
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  // Refetch when the active project changes (project switcher, or the
  // post-login reconciliation in ActiveProjectContext replacing a stale id).
  // Without this, the page that mounted with the old id keeps its error
  // state until a manual browser refresh.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleProjectChange = () => {
      refresh();
    };
    window.addEventListener(
      "agentcost_active_project_changed",
      handleProjectChange,
    );
    return () =>
      window.removeEventListener(
        "agentcost_active_project_changed",
        handleProjectChange,
      );
  }, [refresh]);

  // Set up auto-refresh interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (autoRefreshEnabled && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        refresh();
      }, refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefreshEnabled, refreshInterval, refresh]);

  return {
    isRefreshing,
    lastRefresh,
    refresh,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshInterval,
    setRefreshInterval,
  };
}

// Hook for fetching data with loading and error states
interface UseFetchDataOptions<T> {
  fetchFn: () => Promise<T>;
  dependencies?: unknown[];
  autoRefreshEnabled?: boolean;
  refreshInterval?: number;
}

interface UseFetchDataReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  lastRefresh: Date | null;
}

export function useFetchData<T>({
  fetchFn,
  dependencies = [],
  autoRefreshEnabled = false,
  refreshInterval = 30,
}: UseFetchDataOptions<T>): UseFetchDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn]);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  const { isRefreshing, lastRefresh, refresh } = useAutoRefresh({
    enabled: autoRefreshEnabled,
    interval: refreshInterval,
    onRefresh: fetchData,
  });

  return {
    data,
    isLoading,
    error,
    refresh,
    isRefreshing,
    lastRefresh,
  };
}

// Format relative time for last refresh
export function formatLastRefresh(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 5) return "Just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;

  return date.toLocaleString();
}
