"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api";
import {
  Key,
  Check,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Code,
  Plus,
  BookOpen,
  ChevronRight,
  Trash2,
  AlertTriangle,
  Users,
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-neutral-700/50 hover:bg-neutral-600/50 transition-colors"
    >
      {copied ? (
        <Check size={12} className="text-green-400" />
      ) : (
        <Copy size={12} className="text-neutral-400" />
      )}
    </button>
  );
}

export default function SettingsPage() {
  const [project, setProject] = useState<ProjectInfo | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [config, setConfig] = useState<SavedConfig>(DEFAULT_CONFIG);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRotatingKey, setIsRotatingKey] = useState(false);
  const [showSnippetKey, setShowSnippetKey] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [dangerZoneExpanded, setDangerZoneExpanded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("agentcost_config");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig({
          ...DEFAULT_CONFIG,
          apiKey: parsed.apiKey || "",
          projectId: parsed.projectId || "",
          autoRefresh: parsed.autoRefresh ?? true,
          refreshInterval: parsed.refreshInterval ?? 30,
        });
      } catch {
        console.error("Failed to parse saved config");
      }
    }
  }, []);

  const fetchProject = useCallback(async () => {
    if (!config.apiKey) return;
    try {
      const projectData = await api.getProject();
      setProject(projectData);
    } catch {
      setProject(null);
    }
  }, [config.apiKey]);

  useEffect(() => {
    if (config.apiKey) fetchProject();
  }, [config.apiKey, fetchProject]);

  const updateConfig = (updates: Partial<SavedConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem("agentcost_config", JSON.stringify(config));

      // Dispatch a custom event so other components know config changed
      window.dispatchEvent(new Event("agentcost_config_updated"));

      setSaveMessage({ type: "success", text: "Configuration saved!" });
      setHasChanges(false);

      // If API key was cleared, refresh the page to show onboarding
      if (!config.apiKey) {
        window.location.reload();
      }
    } catch {
      setSaveMessage({ type: "error", text: "Failed to save" });
    }
    setIsSaving(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    try {
      const newProject = await api.createProject(newProjectName.trim());
      setProject(newProject);

      // Auto-save the API key and project ID to localStorage
      const updatedConfig = {
        ...config,
        apiKey: newProject.api_key ?? "",
        projectId: newProject.id,
      };
      localStorage.setItem("agentcost_config", JSON.stringify(updatedConfig));
      setConfig(updatedConfig);

      // Dispatch a custom event so other components know config changed
      window.dispatchEvent(new Event("agentcost_config_updated"));

      setSaveMessage({
        type: "success",
        text: "Project created and API key saved!",
      });
      setShowCreateProject(false);
      setNewProjectName("");
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to create project:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to create project. Make sure you're logged in.",
      });
    }
    setIsCreatingProject(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const rotateApiKey = async () => {
    if (!project) return;
    setIsRotatingKey(true);
    try {
      const result = await api.rotateProjectApiKey(project.id);
      const updatedConfig = {
        ...config,
        apiKey: result.api_key ?? "",
        projectId: project.id,
      };
      localStorage.setItem("agentcost_config", JSON.stringify(updatedConfig));
      setConfig(updatedConfig);
      window.dispatchEvent(new Event("agentcost_config_updated"));

      setSaveMessage({
        type: "success",
        text: "API key rotated. Save the new key now.",
      });
    } catch (error) {
      console.error("Failed to rotate API key:", error);
      setSaveMessage({
        type: "error",
        text: "Failed to rotate API key. Make sure you're logged in with admin access.",
      });
    }
    setIsRotatingKey(false);
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-neutral-400">
          Configure your AgentCost connection
        </p>
      </div>

      {/* API Key & Project */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-900/30 text-amber-400">
            <Key size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">
              API Key & Project
            </h3>
            <p className="text-sm text-neutral-400">
              Your API credentials for the SDK
            </p>

            <div className="mt-4 space-y-4">
              {project ? (
                <>
                  {/* API Key Display (Read-only) */}
                  <div>
                    <label className="block text-sm text-neutral-400">
                      API Key
                    </label>
                    <div className="mt-1 flex gap-2">
                      <div className="relative flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 pr-20">
                        <code className="text-white font-mono text-sm">
                          {config.apiKey
                            ? showApiKey
                              ? config.apiKey
                              : "•".repeat(Math.min(config.apiKey.length, 32))
                            : "API keys are shown once at creation."}
                        </code>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <button
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="p-1 text-neutral-400 hover:text-white"
                            disabled={!config.apiKey}
                          >
                            {showApiKey ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                          {config.apiKey && <CopyButton text={config.apiKey} />}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      API keys are write-only secrets and are shown once at
                      creation. Store them securely.
                    </p>
                    <div className="mt-3">
                      <button
                        onClick={rotateApiKey}
                        disabled={isRotatingKey}
                        className="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-3 py-2 text-xs text-white hover:bg-neutral-600 disabled:opacity-50"
                      >
                        <RefreshCw
                          size={12}
                          className={isRotatingKey ? "animate-spin" : ""}
                        />
                        Rotate API Key
                      </button>
                    </div>
                  </div>

                  {/* Project Info */}
                  <div className="bg-neutral-800/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-400" />
                        <span className="font-medium text-white">
                          {project.name}
                        </span>
                      </div>
                    </div>

                    {/* Project ID with Copy */}
                    <div className="p-3 bg-neutral-900/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm text-neutral-400">
                            Project ID
                          </span>
                          <p className="text-white font-mono text-sm">
                            {project.id}
                          </p>
                        </div>
                        <CopyButton text={project.id} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border border-dashed border-neutral-700 rounded-lg p-4">
                  {showCreateProject ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Project name"
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={createProject}
                          disabled={isCreatingProject || !newProjectName.trim()}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-50"
                        >
                          {isCreatingProject ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Plus size={16} />
                          )}
                          Create
                        </button>
                        <button
                          onClick={() => setShowCreateProject(false)}
                          className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowCreateProject(true)}
                      className="flex items-center gap-2 text-primary-400 hover:text-primary-300"
                    >
                      <Plus size={16} />
                      Create a new project to get an API key
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Team Management */}
      {project && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900/30 text-blue-400">
              <Users size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Team Management
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Invite team members and manage their access to this project
                  </p>
                </div>
                <Link
                  href="/settings/team"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
                >
                  <Users size={16} />
                  Manage Team
                  <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Danger Zone - Delete Project */}
      {project && (
        <Card className="border-red-900/50">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/30 text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-neutral-400">
                    Irreversible actions that affect your project
                  </p>
                </div>
                <button
                  onClick={() => setDangerZoneExpanded(!dangerZoneExpanded)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                >
                  {dangerZoneExpanded ? "Hide" : "Show"} Danger Zone
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${dangerZoneExpanded ? "rotate-90" : ""}`}
                  />
                </button>
              </div>

              {dangerZoneExpanded && (
                <div className="mt-4 border border-red-900/50 rounded-lg p-4 bg-red-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">Delete Project</h4>
                      <p className="text-sm text-neutral-400 mt-1">
                        Permanently delete &quot;{project.name}&quot; and all
                        its data including events, analytics, and API keys.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="shrink-0 px-4 py-2 rounded-lg border border-red-600 text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      Delete Project
                    </button>
                  </div>

                  {showDeleteConfirm && (
                    <div className="mt-4 pt-4 border-t border-red-900/50">
                      <p className="text-sm text-red-300 mb-3">
                        This action <strong>cannot be undone</strong>. Please
                        type{" "}
                        <code className="bg-red-900/30 px-1 rounded">
                          {project.name}
                        </code>{" "}
                        to confirm.
                      </p>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder={`Type "${project.name}" to confirm`}
                          className="flex-1 rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-white placeholder-red-300/50 focus:border-red-500 focus:outline-none"
                        />
                        <button
                          onClick={async () => {
                            if (deleteConfirmText !== project.name) return;
                            setIsDeleting(true);
                            try {
                              await api.deleteProject(project.id);
                              // Clear config and reload
                              localStorage.removeItem("agentcost_config");
                              window.dispatchEvent(
                                new Event("agentcost_config_updated"),
                              );
                              setProject(null);
                              setConfig(DEFAULT_CONFIG);
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText("");
                              setDangerZoneExpanded(false);
                              setSaveMessage({
                                type: "success",
                                text: "Project deleted successfully",
                              });
                            } catch (error) {
                              setSaveMessage({
                                type: "error",
                                text: "Failed to delete project",
                              });
                            }
                            setIsDeleting(false);
                          }}
                          disabled={
                            deleteConfirmText !== project.name || isDeleting
                          }
                          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {isDeleting ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Delete Forever
                        </button>
                        <button
                          onClick={() => {
                            setShowDeleteConfirm(false);
                            setDeleteConfirmText("");
                          }}
                          className="px-4 py-2 rounded-lg bg-neutral-700 text-white hover:bg-neutral-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Auto-Refresh */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-900/30 text-emerald-400">
            <Activity size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Auto-Refresh</h3>
            <p className="text-sm text-neutral-400">
              Automatically refresh dashboard data
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-neutral-300">Enable auto-refresh</span>
              <button
                onClick={() =>
                  updateConfig({ autoRefresh: !config.autoRefresh })
                }
                className={`relative h-6 w-11 rounded-full transition-colors ${config.autoRefresh ? "bg-primary-600" : "bg-neutral-600"}`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${config.autoRefresh ? "left-6" : "left-1"}`}
                />
              </button>
            </div>
            {config.autoRefresh && (
              <div className="mt-4">
                <label className="block text-sm text-neutral-400">
                  Interval (seconds)
                </label>
                <input
                  type="number"
                  value={config.refreshInterval}
                  onChange={(e) =>
                    updateConfig({
                      refreshInterval: parseInt(e.target.value) || 30,
                    })
                  }
                  min={5}
                  max={300}
                  className="mt-1 w-32 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={saveConfig}
          disabled={!hasChanges || isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Zap size={16} />
          )}
          Save Configuration
        </button>
        {saveMessage && (
          <div
            className={`flex items-center gap-2 ${saveMessage.type === "success" ? "text-emerald-400" : "text-red-400"}`}
          >
            {saveMessage.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <XCircle size={16} />
            )}
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Quick Start */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-900/30 text-purple-400">
            <Code size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Quick Start</h3>
            <p className="text-sm text-neutral-400">
              Use your configuration in your Python code
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              API keys are shown once at creation and stored locally if you save
              them. If your key is not stored, rotate the key to generate a new
              one.
            </p>
            <div className="mt-4 bg-neutral-900 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
                <span className="text-sm text-neutral-400">Python</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowSnippetKey(!showSnippetKey)}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                    disabled={!config.apiKey}
                  >
                    {showSnippetKey ? "Hide key" : "Show key"}
                  </button>
                  <CopyButton
                    text={`from agentcost import track_costs\n\ntrack_costs.init(\n    api_key="${showSnippetKey && config.apiKey ? config.apiKey : "your_api_key"}",\n    project_id="${config.projectId || project?.id || "your_project_id"}"\n)\n\n# Your LangChain code is now tracked!`}
                  />
                </div>
              </div>
              <pre className="p-4 overflow-x-auto text-sm">
                <code className="text-neutral-300">
                  <span className="text-purple-400">from</span>{" "}
                  <span className="text-blue-400">agentcost</span>{" "}
                  <span className="text-purple-400">import</span> track_costs
                  {"\n\n"}
                  track_costs.init({"\n"}
                  {"    "}api_key=
                  <span className="text-green-400">
                    &quot;
                    {showSnippetKey && config.apiKey
                      ? config.apiKey
                      : "your_api_key"}
                    &quot;
                  </span>
                  ,{"\n"}
                  {"    "}project_id=
                  <span className="text-green-400">
                    &quot;{config.projectId || project?.id || "your_project_id"}
                    &quot;
                  </span>
                  ,{"\n"}){"\n\n"}
                  <span className="text-neutral-500">
                    # Your LangChain code is now tracked!
                  </span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </Card>

      {/* Documentation */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-900/30 text-blue-400">
            <BookOpen size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Documentation</h3>
            <p className="text-sm text-neutral-400">
              Learn how to use AgentCost effectively
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/docs/sdk"
                className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors group"
              >
                <div>
                  <p className="font-medium text-white">SDK Documentation</p>
                  <p className="text-sm text-neutral-400">
                    Python SDK setup and usage
                  </p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-neutral-500 group-hover:text-white transition-colors"
                />
              </Link>
              <Link
                href="/docs/api"
                className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition-colors group"
              >
                <div>
                  <p className="font-medium text-white">API Reference</p>
                  <p className="text-sm text-neutral-400">REST API endpoints</p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-neutral-500 group-hover:text-white transition-colors"
                />
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
