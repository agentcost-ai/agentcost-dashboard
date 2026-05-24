"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, type ProjectListItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface ActiveProjectContextValue {
  /** All projects the current user can access (owned + member). */
  projects: ProjectListItem[];
  /** The currently active project, or null if none selected / accessible. */
  activeProject: ProjectListItem | null;
  /** True while the project list is being fetched. */
  isLoading: boolean;
  /** Non-null when the project list failed to load. */
  error: string | null;
  /** Select a project as active (persists to localStorage). */
  selectProject: (projectId: string) => void;
  /** Re-fetch the project list (e.g. after creating a project). */
  refresh: () => Promise<void>;
}

const ActiveProjectContext = createContext<ActiveProjectContextValue | null>(
  null,
);

function readActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("agentcost_active_project_id");
}

export function ActiveProjectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => readActiveId());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    if (!isAuthenticated) {
      setProjects([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = await api.listMyProjects();
      setProjects(items);

      // Reconcile the active project against the freshly loaded list.
      const currentId = readActiveId();
      const accessibleIds = new Set(items.map((p) => p.id));
      if (currentId && !accessibleIds.has(currentId)) {
        // Active id no longer accessible (revoked, deleted, account switch).
        api.setActiveProjectId(null);
        setActiveId(null);
      }
      // Auto-select if user has exactly one project and none is active.
      if (!readActiveId() && items.length > 0) {
        // Prefer an active, owned, non-pending project.
        const preferred =
          items.find(
            (p) => p.is_active && p.is_owner && !p.is_pending,
          ) ??
          items.find((p) => p.is_active && !p.is_pending) ??
          items[0];
        if (preferred) {
          api.setActiveProjectId(preferred.id);
          setActiveId(preferred.id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load + on auth state change.
  useEffect(() => {
    if (!isAuthLoading) fetchProjects();
  }, [isAuthLoading, fetchProjects]);

  // Cross-tab + same-tab sync of the active project id.
  useEffect(() => {
    function handleChange() {
      setActiveId(readActiveId());
    }
    window.addEventListener("agentcost_active_project_changed", handleChange);
    window.addEventListener("storage", handleChange);
    return () => {
      window.removeEventListener(
        "agentcost_active_project_changed",
        handleChange,
      );
      window.removeEventListener("storage", handleChange);
    };
  }, []);

  const selectProject = useCallback((projectId: string) => {
    api.setActiveProjectId(projectId);
    setActiveId(projectId);
  }, []);

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeId) ?? null,
    [projects, activeId],
  );

  const value = useMemo<ActiveProjectContextValue>(
    () => ({
      projects,
      activeProject,
      isLoading,
      error,
      selectProject,
      refresh: fetchProjects,
    }),
    [projects, activeProject, isLoading, error, selectProject, fetchProjects],
  );

  return (
    <ActiveProjectContext.Provider value={value}>
      {children}
    </ActiveProjectContext.Provider>
  );
}

export function useActiveProject(): ActiveProjectContextValue {
  const ctx = useContext(ActiveProjectContext);
  if (!ctx) {
    throw new Error(
      "useActiveProject must be used inside <ActiveProjectProvider>",
    );
  }
  return ctx;
}
