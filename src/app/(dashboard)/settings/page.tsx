"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BudgetSettingsCard } from "@/components/settings/BudgetSettingsCard";
import {
  SectionCard,
  SettingRow,
  Toggle,
  fieldClass,
  monoFieldClass,
  buttonPrimary,
  buttonSecondary,
  buttonDanger,
} from "@/components/ui/Panels";
import {
  api,
  getStoredApiKeyForProject,
  getFallbackProjectKey,
  storeProjectApiKey,
  removeStoredProjectApiKey,
} from "@/lib/api";
import { useActiveProject } from "@/contexts/ActiveProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import {
  Check,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Plus,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface ProjectInfo {
  id: string;
  name: string;
  description: string | null;
  api_key: string | null;
  key_prefix?: string | null;
  created_at: string;
  is_active: boolean;
}

interface SavedConfig {
  apiKey: string;
  projectId: string;
  autoRefresh: boolean;
  refreshInterval: number;
}

const DEFAULT_CONFIG: SavedConfig = {
  apiKey: "",
  projectId: "",
  autoRefresh: false,
  refreshInterval: 30,
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label}
      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-white"
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
    </button>
  );
}

export default function SettingsPage() {
  const { activeProject, refresh: refreshProjectList, selectProject } = useActiveProject();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [config, setConfig] = useState<SavedConfig>(DEFAULT_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [showSnippetKey, setShowSnippetKey] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDesc, setEditProjectDesc] = useState("");
  const [isSavingProject, setIsSavingProject] = useState(false);

  // Open the create-project form automatically when navigated via
  // /settings?new=1 (e.g. from the project switcher). Adjusted during render
  // rather than in an effect so the form is open on the first painted frame.
  const wantsCreateForm = searchParams?.get("new") === "1";
  const [sawCreateParam, setSawCreateParam] = useState(false);
  if (wantsCreateForm && !sawCreateParam) {
    setSawCreateParam(true);
    setShowCreateProject(true);
  }

  useEffect(() => {
    const saved = localStorage.getItem("agentcost_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Hydrating from localStorage, which does not exist during the server
        // render. Seeding this in useState instead would make the first client
        // render disagree with the server HTML.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setConfig((prev) => ({
          ...prev,
          autoRefresh: parsed.autoRefresh ?? true,
          refreshInterval: parsed.refreshInterval ?? 30,
        }));
      } catch {
        console.error("Failed to parse saved config");
      }
    }
  }, []);

  // The displayed key must belong to the displayed project — keys are stored
  // per project, so switching projects re-resolves (and never shows another
  // project's key). With no resolved project at all (legacy SDK-only setups
  // whose project isn't in the JWT list), fall back to the stored legacy pair
  // so fetchProject's api.getProject() path can still identify the project.
  useEffect(() => {
    const displayedId = project?.id ?? activeProject?.id ?? "";
    if (displayedId) {
      // Both branches read the per-project key out of localStorage, so this
      // cannot be derived during render on the server.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfig((prev) => ({
        ...prev,
        projectId: displayedId,
        apiKey: getStoredApiKeyForProject(displayedId),
      }));
    } else {
      const fallback = getFallbackProjectKey();
      setConfig((prev) => ({
        ...prev,
        projectId: fallback.projectId,
        apiKey: fallback.apiKey,
      }));
    }
  }, [project?.id, activeProject?.id]);

  // Hoisted out of the dependency arrays below: the React Compiler cannot
  // preserve a manual memo whose deps are optional-chained member expressions.
  const activeProjectId = activeProject?.id;

  const fetchProject = useCallback(async () => {
    // Prefer the active project from the JWT-backed list (works for members
    // even without the project's raw API key). Fall back to the legacy
    // API-key path (/v1/projects/me) for users who only have an API key
    // configured.
    if (activeProjectId) {
      try {
        const data = await api.getProjectById(activeProjectId);
        setProject(data);
        return;
      } catch {
        // fall through to API-key path
      }
    }
    if (config.apiKey) {
      try {
        const data = await api.getProject();
        setProject(data);
      } catch {
        setProject(null);
      }
    } else {
      setProject(null);
    }
  }, [activeProjectId, config.apiKey]);

  useEffect(() => {
    // Data fetching, not state synchronisation: fetchProject only setStates
    // synchronously on the "no project at all" path, and that must still clear
    // a stale project. Restructuring it to satisfy the rule would mean holding
    // the previous project on screen after switching away from it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProject();
  }, [fetchProject]);

  const flash = (type: "success" | "error", text: string) => {
    setSaveMessage({ type, text });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const updateConfig = (updates: Partial<SavedConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      // Only the refresh preferences are editable here — merge them into the
      // stored config so the per-project API key map is never clobbered.
      let saved: Record<string, unknown> = {};
      try {
        saved = JSON.parse(localStorage.getItem("agentcost_config") || "{}");
      } catch {
        // Corrupt config: fall through and rewrite it from scratch.
      }
      localStorage.setItem(
        "agentcost_config",
        JSON.stringify({
          ...saved,
          autoRefresh: config.autoRefresh,
          refreshInterval: config.refreshInterval,
        }),
      );
      window.dispatchEvent(new Event("agentcost_config_updated"));
      flash("success", "Preferences saved.");
      setHasChanges(false);
    } catch {
      flash("error", "Failed to save.");
    }
    setIsSaving(false);
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    try {
      const newProject = await api.createProject(newProjectName.trim());
      setProject(newProject);
      track("project_created");
      // Auto-save the new project's API key (per-project, owner-scoped).
      // storeProjectApiKey dispatches "agentcost_config_updated" itself.
      if (newProject.api_key) {
        storeProjectApiKey(newProject.id, newProject.api_key, user?.id);
      }
      setConfig((prev) => ({
        ...prev,
        apiKey: newProject.api_key ?? "",
        projectId: newProject.id,
      }));
      selectProject(newProject.id);
      await refreshProjectList();
      flash("success", "Project created. Its API key is saved in this browser.");
      setShowCreateProject(false);
      setNewProjectName("");
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to create project:", error);
      flash("error", "Failed to create project. Make sure you're logged in.");
    }
    setIsCreatingProject(false);
  };

  const rotateApiKey = async () => {
    if (!project) return;
    setIsRotatingKey(true);
    try {
      const result = await api.rotateProjectApiKey(project.id);
      if (result.api_key) {
        storeProjectApiKey(project.id, result.api_key, user?.id);
      }
      setConfig((prev) => ({ ...prev, apiKey: result.api_key ?? "", projectId: project.id }));
      flash("success", "API key rotated. Save the new key now.");
    } catch (error) {
      console.error("Failed to rotate API key:", error);
      flash("error", "Failed to rotate the API key. Admin access is required.");
    }
    setIsRotatingKey(false);
  };

  const saveProjectDetails = async () => {
    if (!project || !editProjectName.trim()) return;
    setIsSavingProject(true);
    try {
      const updated = await api.updateProject(project.id, {
        name: editProjectName.trim(),
        description: editProjectDesc.trim() || undefined,
      });
      setProject(updated);
      setIsEditingProject(false);
      flash("success", "Project updated.");
    } catch {
      flash("error", "Failed to update the project.");
    }
    setIsSavingProject(false);
  };

  const deleteProject = async () => {
    if (!project || deleteConfirmText !== project.name) return;
    setIsDeleting(true);
    try {
      await api.deleteProject(project.id);
      // Drop only the deleted project's key (other projects keep theirs) and
      // clear the active selection so the dashboard doesn't render stale
      // data. removeStoredProjectApiKey fires the config-updated event itself.
      removeStoredProjectApiKey(project.id);
      localStorage.removeItem("agentcost_active_project_id");
      window.dispatchEvent(new Event("agentcost_active_project_changed"));
      await refreshProjectList();
      setProject(null);
      setConfig(DEFAULT_CONFIG);
      setShowDeleteConfirm(false);
      setDeleteConfirmText("");
      flash("success", "Project deleted.");
    } catch {
      flash("error", "Failed to delete the project.");
    }
    setIsDeleting(false);
  };

  const snippet = `from agentcost import track_costs\n\ntrack_costs.init(\n    api_key="${showSnippetKey && config.apiKey ? config.apiKey : "your_api_key"}",\n    project_id="${config.projectId || project?.id || "your_project_id"}"\n)\n\n# Your OpenAI, Anthropic, Gemini, and LangChain calls are now tracked.`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {project ? project.name : "No project selected"}
            {project && (
              <span className="text-neutral-600">
                {" "}· created{" "}
                {new Date(project.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveMessage && (
            <span
              className={cn(
                "flex items-center gap-1.5 text-[13px]",
                saveMessage.type === "success" ? "text-emerald-300" : "text-red-300",
              )}
              role="status"
            >
              {saveMessage.type === "success" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              {saveMessage.text}
            </span>
          )}
          <button type="button" onClick={() => setShowCreateProject(true)} className={buttonPrimary}>
            <Plus size={14} />
            New project
          </button>
        </div>
      </div>

      {showCreateProject && (
        <SectionCard
          title="Create a project"
          description="Each project has its own API key, members, budget and analytics. Switch between them from the sidebar."
        >
          <div className="flex flex-col gap-2 px-5 py-4 sm:flex-row">
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createProject();
                }
              }}
              placeholder="Project name"
              autoFocus
              className={cn(fieldClass, "sm:max-w-sm")}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={createProject}
                disabled={isCreatingProject || !newProjectName.trim()}
                className={buttonPrimary}
              >
                {isCreatingProject ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProjectName("");
                }}
                className={buttonSecondary}
              >
                Cancel
              </button>
            </div>
          </div>
          <p className="border-t border-white/6 px-5 py-3 text-[12.5px] text-neutral-500">
            The new project becomes active and its API key is shown once. Store it securely.
          </p>
        </SectionCard>
      )}

      {/* Project: identity and credentials in one place */}
      <SectionCard
        title="Project"
        description="Name, ID and the API key the SDK uses. The key is shown once at creation and kept only in the browser where it was created."
        action={
          project && !isEditingProject ? (
            <button
              type="button"
              onClick={() => {
                setEditProjectName(project.name);
                setEditProjectDesc(project.description || "");
                setIsEditingProject(true);
              }}
              className={buttonSecondary}
            >
              Edit
            </button>
          ) : undefined
        }
      >
        {!project ? (
          <p className="px-5 py-6 text-sm text-neutral-500">
            No project yet. Use “New project” above to create one.
          </p>
        ) : isEditingProject ? (
          <>
            <SettingRow label="Name" align="start">
              <input
                type="text"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                className={cn(fieldClass, "sm:max-w-md")}
              />
            </SettingRow>
            <SettingRow label="Description" align="start">
              <textarea
                value={editProjectDesc}
                onChange={(e) => setEditProjectDesc(e.target.value)}
                rows={3}
                placeholder="What this project tracks"
                className={cn(fieldClass, "h-auto resize-none py-2 sm:max-w-md")}
              />
            </SettingRow>
            <div className="flex justify-end gap-2 px-5 py-3">
              <button type="button" onClick={() => setIsEditingProject(false)} className={buttonSecondary}>
                Cancel
              </button>
              <button
                type="button"
                onClick={saveProjectDetails}
                disabled={isSavingProject || !editProjectName.trim()}
                className={buttonPrimary}
              >
                {isSavingProject && <RefreshCw size={14} className="animate-spin" />}
                Save changes
              </button>
            </div>
          </>
        ) : (
          <>
            <SettingRow label="Name">
              <span className="text-[13.5px] text-white sm:text-right">{project.name}</span>
            </SettingRow>
            <SettingRow label="Description">
              <span className="text-[13.5px] text-neutral-300 sm:text-right">
                {project.description || <span className="text-neutral-600">Not set</span>}
              </span>
            </SettingRow>
            <SettingRow label="Project ID" description="Pass this as project_id in track_costs.init().">
              <span className="flex items-center gap-1 sm:justify-end">
                <code className="break-all font-mono text-[12.5px] text-neutral-200">{project.id}</code>
                <CopyButton text={project.id} label="Copy project ID" />
              </span>
            </SettingRow>
            <SettingRow label="API key" description="Used by track_costs.init(). The server cannot display it again." align="start">
            <div className="w-full sm:max-w-md">
              <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 pl-3 pr-1">
                <code className="min-w-0 flex-1 break-all py-2 font-mono text-[12.5px] text-neutral-200">
                  {config.apiKey
                    ? showApiKey
                      ? config.apiKey
                      : "•".repeat(Math.min(config.apiKey.length, 32))
                    : "No key stored in this browser."}
                </code>
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={!config.apiKey}
                  aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-white/5 hover:text-white disabled:opacity-40"
                >
                  {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {config.apiKey && <CopyButton text={config.apiKey} label="Copy API key" />}
              </div>
            </div>
          </SettingRow>
            <SettingRow
              label="Rotate key"
              description="Generates a new key and invalidates the old one. Update every SDK that uses it."
            >
              <button type="button" onClick={rotateApiKey} disabled={isRotatingKey} className={buttonSecondary}>
                <RefreshCw size={13} className={isRotatingKey ? "animate-spin" : ""} />
                Rotate API key
              </button>
            </SettingRow>
          </>
        )}
      </SectionCard>

      {/* Team */}
      {project && (
        <SectionCard title="Team" description="Invite people and set what each of them can see and change.">
          <SettingRow label="Members" description="Roles, invitations and pending requests.">
            <Link href="/settings/team" className={buttonSecondary}>
              Manage team
              <ChevronRight size={14} />
            </Link>
          </SettingRow>
        </SectionCard>
      )}

      {/* Budget */}
      {project && (
        <div id="budget" className="scroll-mt-24">
          <BudgetSettingsCard projectId={project.id} />
        </div>
      )}

      {/* Dashboard preferences */}
      <SectionCard
        title="Dashboard"
        description="Preferences for this browser."
        action={
          <button
            type="button"
            onClick={saveConfig}
            disabled={!hasChanges || isSaving}
            className={buttonPrimary}
          >
            {isSaving && <RefreshCw size={14} className="animate-spin" />}
            Save
          </button>
        }
      >
        <SettingRow label="Auto-refresh" description="Reload dashboard data on an interval.">
          <Toggle
            label="Enable auto-refresh"
            checked={config.autoRefresh}
            onChange={(v) => updateConfig({ autoRefresh: v })}
          />
        </SettingRow>
        {config.autoRefresh && (
          <SettingRow label="Interval" description="Seconds between refreshes, 5 to 300.">
            <input
              type="number"
              value={config.refreshInterval}
              onChange={(e) => updateConfig({ refreshInterval: parseInt(e.target.value) || 30 })}
              min={5}
              max={300}
              className={cn(fieldClass, "w-28 tabular-nums")}
            />
          </SettingRow>
        )}
      </SectionCard>

      {/* Quick start */}
      <SectionCard
        title="Quick start"
        description="Your project wired into Python. Toggle the key on to copy a ready-to-run snippet."
        action={
          <>
            <button
              type="button"
              onClick={() => setShowSnippetKey(!showSnippetKey)}
              disabled={!config.apiKey}
              className={buttonSecondary}
            >
              {showSnippetKey ? "Hide key" : "Show key"}
            </button>
            <CopyButton text={snippet} label="Copy snippet" />
          </>
        }
      >
        <pre className="overflow-x-auto px-5 py-4 font-mono text-[12.5px] leading-6 text-neutral-300">
          <code>
            <span className="text-neutral-500">from</span> agentcost{" "}
            <span className="text-neutral-500">import</span> track_costs{"\n\n"}
            track_costs.init({"\n"}
            {"    "}api_key=
            <span className="text-neutral-100">
              &quot;{showSnippetKey && config.apiKey ? config.apiKey : "your_api_key"}&quot;
            </span>
            ,{"\n"}
            {"    "}project_id=
            <span className="text-neutral-100">
              &quot;{config.projectId || project?.id || "your_project_id"}&quot;
            </span>
            {"\n"}){"\n\n"}
            <span className="text-neutral-500">
              # Your OpenAI, Anthropic, Gemini, and LangChain calls are now tracked.
            </span>
          </code>
        </pre>
      </SectionCard>

      {/* Documentation */}
      <SectionCard title="Documentation">
        <SettingRow label="SDK" description="Setup, tracing, outcomes and tools.">
          <Link
            href="/docs/sdk"
            className="text-[13px] text-neutral-300 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Read the SDK docs
          </Link>
        </SettingRow>
        <SettingRow label="API" description="Every endpoint, with examples.">
          <Link
            href="/docs/api"
            className="text-[13px] text-neutral-300 underline decoration-white/20 underline-offset-2 hover:text-white"
          >
            Read the API reference
          </Link>
        </SettingRow>
      </SectionCard>

      {/* Danger zone */}
      {project && (
        <SectionCard
          title="Danger zone"
          tone="danger"
          description="Deleting a project removes its events, analytics, guardrails and API keys. This cannot be undone."
        >
          <SettingRow label="Delete project" description={`Permanently delete “${project.name}”.`}>
            {!showDeleteConfirm ? (
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className={buttonDanger}>
                Delete project
              </button>
            ) : (
              <div className="w-full space-y-2 sm:max-w-md">
                <p className="text-[12.5px] text-neutral-400">
                  Type <code className="text-neutral-200">{project.name}</code> to confirm.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={project.name}
                    className={monoFieldClass}
                  />
                  <button
                    type="button"
                    onClick={deleteProject}
                    disabled={deleteConfirmText !== project.name || isDeleting}
                    className={cn(buttonDanger, "shrink-0")}
                  >
                    {isDeleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Delete forever
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteConfirmText("");
                    }}
                    className={cn(buttonSecondary, "shrink-0")}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </SettingRow>
        </SectionCard>
      )}
    </div>
  );
}
