"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { api, ProjectMember, PendingInvitation } from "@/lib/api";
import { parseApiError } from "@/lib/utils";
import { useActiveProject } from "@/contexts/ActiveProjectContext";
import {
  Users,
  UserPlus,
  Shield,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  RefreshCw,
  Mail,
  Clock,
  Crown,
  AlertTriangle,
  ChevronLeft,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

type Role = "admin" | "member" | "viewer";

const ROLE_CONFIG: Record<
  Role,
  { label: string; icon: typeof Shield; color: string; description: string }
> = {
  admin: {
    label: "Admin",
    icon: Crown,
    color: "text-amber-400 bg-amber-900/30",
    description: "Full access to project settings, members, and data",
  },
  member: {
    label: "Member",
    icon: Edit,
    color: "text-blue-400 bg-blue-900/30",
    description: "Can view analytics and create events",
  },
  viewer: {
    label: "Viewer",
    icon: Eye,
    color: "text-neutral-400 bg-neutral-700/30",
    description: "Read-only access to analytics",
  },
};

function RoleBadge({ role }: { role: Role }) {
  const config = ROLE_CONFIG[role];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function StatusBadge({ isPending }: { isPending: boolean }) {
  if (isPending) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-900/30 text-yellow-400">
        <Clock size={10} />
        Pending
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-900/30 text-emerald-400">
      <Check size={10} />
      Active
    </span>
  );
}

function RoleDropdown({
  value,
  onChange,
  disabled = false,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const roles: Role[] = ["admin", "member", "viewer"];
  const selectedConfig = ROLE_CONFIG[value];
  const SelectedIcon = selectedConfig.icon;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2.5 text-white focus:border-primary-500 focus:outline-none transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-800"}`}
      >
        <div className="flex items-center gap-2">
          <div className={`p-1 rounded ${selectedConfig.color}`}>
            <SelectedIcon size={14} />
          </div>
          <span>{selectedConfig.label}</span>
        </div>
        <ChevronDown
          size={16}
          className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl overflow-hidden">
          {roles.map((role) => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            const isSelected = role === value;

            return (
              <button
                key={role}
                type="button"
                onClick={() => {
                  onChange(role);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-neutral-700 transition-colors ${isSelected ? "bg-neutral-700/50" : ""}`}
              >
                <div className={`p-1.5 rounded ${config.color} mt-0.5`}>
                  <Icon size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">
                      {config.label}
                    </span>
                    {isSelected && (
                      <Check size={14} className="text-primary-400" />
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {config.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit role state
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role>("member");
  const [isUpdating, setIsUpdating] = useState(false);

  // Remove member state
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [staleConfig, setStaleConfig] = useState(false);
  const { activeProject } = useActiveProject();

  const fetchData = useCallback(async () => {
    try {
      // Resolve the project id from the JWT-backed active project (works for
      // invited members who don't have the project's raw API key). Fall back
      // to /v1/projects/me (API-key auth) when no active project is selected.
      let resolvedProjectId: string | null = activeProject?.id ?? null;
      if (!resolvedProjectId) {
        try {
          const project = await api.getProject();
          resolvedProjectId = project.id;
        } catch {
          // No active project AND no API key — show the recovery banner.
          setStaleConfig(true);
          setError(null);
          setIsLoading(false);
          return;
        }
      }
      setProjectId(resolvedProjectId);

      // Get members (JWT + permission check — only succeeds if the current
      // user owns or is a member of this project). A 403 here means the
      // resolved project belongs to someone else.
      let membersData: ProjectMember[];
      try {
        membersData = await api.getProjectMembers(resolvedProjectId);
      } catch (membersErr) {
        const msg =
          membersErr instanceof Error ? membersErr.message : String(membersErr);
        if (msg.includes("403") || msg.toLowerCase().includes("don't have access")) {
          setStaleConfig(true);
          setError(null);
          setIsLoading(false);
          return;
        }
        throw membersErr;
      }
      setStaleConfig(false);
      setMembers(membersData);

      // Get current user from localStorage
      const userJson = localStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        setCurrentUserId(user.id);
        setCurrentUserEmail(user.email?.toLowerCase() || null);
        // Find current user's role - check if they're the owner first
        const currentMember = membersData.find((m) => m.user_id === user.id);
        if (currentMember) {
          // Owner flag takes precedence
          setCurrentUserRole(
            currentMember.is_owner ? "admin" : currentMember.role,
          );
        } else {
          // If user is not in members list but can view this page, they might be the owner
          // The API would have returned 403 if they had no access
          setCurrentUserRole("admin");
        }
      }

      // Get pending invitations for current user
      try {
        const invitations = await api.getPendingInvitations();
        setPendingInvitations(invitations);
      } catch {
        // User might not have pending invitations
      }

      setError(null);
    } catch (err) {
      const friendlyError = parseApiError(err);
      setError(friendlyError);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [activeProject?.id]);

  const handleClearStaleConfig = useCallback(() => {
    localStorage.removeItem("agentcost_config");
    localStorage.removeItem("agentcost_active_project_id");
    window.dispatchEvent(new Event("agentcost_config_updated"));
    window.dispatchEvent(new Event("agentcost_active_project_changed"));
    window.location.href = "/settings";
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleInvite = async () => {
    if (!projectId || !inviteEmail.trim()) return;

    // Check for self-invitation
    if (inviteEmail.trim().toLowerCase() === currentUserEmail) {
      setInviteError("You cannot invite yourself to the project.");
      return;
    }

    setIsInviting(true);
    setInviteError(null);

    try {
      await api.inviteMember(projectId, inviteEmail.trim(), inviteRole);
      showSuccess(`Invitation sent to ${inviteEmail}`);
      setShowInviteModal(false);
      setInviteEmail("");
      setInviteRole("member");
      fetchData();
    } catch (err) {
      const message = parseApiError(err);
      setInviteError(message);
    } finally {
      setIsInviting(false);
    }
  };

  const handleUpdateRole = async (userId: string) => {
    if (!projectId) return;
    setIsUpdating(true);

    try {
      await api.updateMemberRole(projectId, userId, editRole);
      showSuccess("Role updated successfully");
      setEditingMember(null);
      fetchData();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!projectId) return;
    setIsRemoving(true);

    try {
      await api.removeMember(projectId, userId);
      showSuccess("Member removed successfully");
      setRemovingMember(null);
      fetchData();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setIsRemoving(false);
    }
  };

  const handleAcceptInvitation = async (invProjectId: string) => {
    try {
      await api.acceptInvitation(invProjectId);
      showSuccess("Invitation accepted!");
      fetchData();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const handleDeclineInvitation = async (invProjectId: string) => {
    try {
      await api.declineInvitation(invProjectId);
      showSuccess("Invitation declined");
      fetchData();
    } catch (err) {
      setError(parseApiError(err));
    }
  };

  const canManageMembers = currentUserRole === "admin";
  const canEditRole = (memberRole: Role) => {
    if (!canManageMembers) return false;
    // Admins can only be modified by other admins
    if (memberRole === "admin" && currentUserRole !== "admin") return false;
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-400px">
        <RefreshCw className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <ChevronLeft size={20} className="text-neutral-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Team Management</h1>
            <p className="mt-1 text-neutral-400">
              Manage team members and their access to this project
            </p>
          </div>
        </div>
        {canManageMembers && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium transition-colors"
          >
            <UserPlus size={18} />
            Invite Member
          </button>
        )}
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-900/30 border border-emerald-700 text-emerald-400">
          <Check size={18} />
          {successMessage}
        </div>
      )}

      {/* Stale API key from a previous account */}
      {staleConfig && (
        <Card className="border-amber-900/50">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-900/30 text-amber-400">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">
                This API key belongs to a different account
              </h3>
              <p className="mt-1 text-sm text-neutral-400">
                The API key stored in your browser is linked to a project you
                don&apos;t have access to as{" "}
                <span className="text-neutral-200">
                  {currentUserEmail || "the current user"}
                </span>
                . This usually happens after switching accounts. Clear the saved
                API key, then create a new project (or paste the API key for a
                project you own) on the Settings page.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleClearStaleConfig}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 transition-colors"
                >
                  Clear saved API key &amp; go to Settings
                </button>
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 rounded-lg bg-neutral-700 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-600 transition-colors"
                >
                  Go to Settings
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-900/30 border border-red-700 text-red-400">
          <AlertTriangle size={18} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Pending Invitations for Current User */}
      {pendingInvitations.length > 0 && (
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-900/30 text-yellow-400">
              <Mail size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-white">
                Pending Invitations
              </h3>
              <p className="text-sm text-neutral-400">
                You have been invited to join the following projects
              </p>
              <div className="mt-4 space-y-3">
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv.project_id}
                    className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-neutral-700"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {inv.project_name}
                      </p>
                      <p className="text-sm text-neutral-400">
                        Invited by{" "}
                        {inv.invited_by?.name ||
                          inv.invited_by?.email ||
                          "Unknown"}{" "}
                        as <RoleBadge role={inv.role} />
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(inv.project_id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                      >
                        <Check size={14} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleDeclineInvitation(inv.project_id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm"
                      >
                        <X size={14} />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-900/30 text-primary-400">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">Team Members</h3>
                <p className="text-sm text-neutral-400">
                  {members.length} member{members.length !== 1 ? "s" : ""} in
                  this project
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw
                  size={16}
                  className={`text-neutral-400 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <div className="mt-4 divide-y divide-neutral-800">
              {members.map((member) => (
                <div key={member.user_id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-linear-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-medium">
                        {(member.name || member.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {member.name || member.email}
                          </span>
                          {member.user_id === currentUserId && (
                            <span className="text-xs text-neutral-500">
                              (you)
                            </span>
                          )}
                          {member.is_owner && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-900/30 text-purple-400">
                              <Crown size={10} />
                              Project Owner
                            </span>
                          )}
                          <StatusBadge isPending={member.is_pending} />
                        </div>
                        <p className="text-sm text-neutral-400">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {editingMember === member.user_id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editRole}
                            onChange={(e) =>
                              setEditRole(e.target.value as Role)
                            }
                            className="rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-1.5 text-sm text-white focus:border-primary-500 focus:outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleUpdateRole(member.user_id)}
                            disabled={isUpdating}
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => setEditingMember(null)}
                            className="p-1.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <RoleBadge role={member.role} />
                          {canEditRole(member.role) &&
                            member.user_id !== currentUserId && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    setEditingMember(member.user_id);
                                    setEditRole(member.role);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                                  title="Change role"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    setRemovingMember(member.user_id)
                                  }
                                  className="p-1.5 rounded-lg hover:bg-red-900/30 text-neutral-400 hover:text-red-400 transition-colors"
                                  title="Remove member"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Remove confirmation */}
                  {removingMember === member.user_id && (
                    <div className="mt-3 p-3 rounded-lg bg-red-900/20 border border-red-900/50">
                      <p className="text-sm text-red-300">
                        Remove <strong>{member.name || member.email}</strong>{" "}
                        from this project?
                      </p>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={isRemoving}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-50"
                        >
                          {isRemoving ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Trash2 size={12} />
                          )}
                          Remove
                        </button>
                        <button
                          onClick={() => setRemovingMember(null)}
                          className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-900/30 text-purple-400">
            <Shield size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-white">Role Permissions</h3>
            <p className="text-sm text-neutral-400">
              Understanding what each role can do
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {(
                Object.entries(ROLE_CONFIG) as [
                  Role,
                  typeof ROLE_CONFIG.admin,
                ][]
              ).map(([role, config]) => {
                const Icon = config.icon;
                return (
                  <div
                    key={role}
                    className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${config.color}`}>
                        <Icon size={16} />
                      </div>
                      <span className="font-medium text-white">
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-400">
                      {config.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md mx-4 bg-neutral-900 rounded-xl border border-neutral-700 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-900/30 text-primary-400">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Invite Team Member
                </h2>
              </div>

              {inviteError && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700 text-red-400 text-sm">
                  {inviteError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                    className="w-full rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-white focus:border-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm text-neutral-400 mb-1">
                    Role
                  </label>
                  <RoleDropdown value={inviteRole} onChange={setInviteRole} />
                  <p className="mt-2 text-xs text-neutral-500">
                    {ROLE_CONFIG[inviteRole].description}
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-neutral-700">
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail("");
                    setInviteError(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={isInviting || !inviteEmail.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50 transition-colors"
                >
                  {isInviting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Mail size={16} />
                  )}
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
