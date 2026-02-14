"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api, UserProfile, SessionInfo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  User,
  Shield,
  Monitor,
  Key,
  LogOut,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Award,
} from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export default function AccountPage() {
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Profile form
  const [editName, setEditName] = useState("");

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fetchProfile = useCallback(async () => {
    try {
      const [profileData, sessionsData] = await Promise.all([
        api.getProfile(),
        api.getSessions(),
      ]);
      setProfile(profileData);
      setEditName(profileData.name || "");
      setSessions(sessionsData.sessions);
    } catch {
      showMessage("error", "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile({ name: editName || null });
      setProfile(updated);
      showMessage("success", "Profile updated successfully");
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showMessage("error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      showMessage("error", "Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showMessage("success", "Password changed successfully");
    } catch (err) {
      showMessage(
        "error",
        err instanceof Error ? err.message : "Failed to change password",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRevokeSession(sessionId: string) {
    try {
      await api.revokeSession(sessionId);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      showMessage("success", "Session revoked");
    } catch {
      showMessage("error", "Failed to revoke session");
    }
  }

  async function handleLogoutAll() {
    if (!confirm("This will log you out of all devices. Continue?")) return;
    try {
      await api.logoutAll();
      showMessage("success", "All sessions revoked. Redirecting...");
      setTimeout(() => logout(), 1500);
    } catch {
      showMessage("error", "Failed to revoke all sessions");
    }
  }

  async function handleResendVerification() {
    if (!profile) return;
    try {
      await api.resendVerification(profile.email);
      showMessage("success", "Verification email sent");
    } catch {
      showMessage("error", "Failed to send verification email");
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <RefreshCw className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const isGoogleUser = profile?.auth_provider === "google";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage your profile, password, and active sessions
        </p>
      </div>

      {/* Messages */}
      {message && (
        <Card
          className={
            message.type === "success"
              ? "border-emerald-900/50 bg-emerald-950/20"
              : "border-red-900/50 bg-red-950/20"
          }
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle size={16} className="text-emerald-400" />
            ) : (
              <AlertTriangle size={16} className="text-red-400" />
            )}
            <p
              className={
                message.type === "success" ? "text-emerald-400" : "text-red-400"
              }
            >
              {message.text}
            </p>
          </div>
        </Card>
      )}

      {/* Profile Section */}
      <Card>
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-900/30 text-primary-400">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">Profile</h2>
            <p className="text-sm text-neutral-400">
              Your personal information
            </p>
          </div>
          {profile?.milestone_badge && (
            <span className="ml-auto">
              <Badge variant="default">
                <Award size={12} className="mr-1" />
                {profile.milestone_badge.replace(/_/g, " ")}
              </Badge>
            </span>
          )}
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Email
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="flex-1 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2 text-sm text-neutral-400"
              />
              {profile?.email_verified ? (
                <Badge variant="success">Verified</Badge>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  className="text-xs text-primary-400 hover:text-primary-300"
                >
                  Resend verification
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-300">
              Display Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-500">
            <span>
              Provider:{" "}
              <span className="text-neutral-300">
                {profile?.auth_provider === "google" ? "Google" : "Email"}
              </span>
            </span>
            {profile?.user_number && (
              <span>
                User #{" "}
                <span className="text-neutral-300">{profile.user_number}</span>
              </span>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-500 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </Card>

      {/* Password Section */}
      {!isGoogleUser && (
        <Card>
          <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-900/30 text-amber-400">
              <Key size={20} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">
                Change Password
              </h2>
              <p className="text-sm text-neutral-400">
                Update your account password
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-500 disabled:opacity-50"
              >
                {saving ? "Changing..." : "Change Password"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Sessions Section */}
      <Card>
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-900/30 text-blue-400">
              <Monitor size={20} />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">
                Active Sessions
              </h2>
              <p className="text-sm text-neutral-400">
                Devices where you&apos;re signed in
              </p>
            </div>
          </div>
          <button
            onClick={handleLogoutAll}
            className="flex items-center gap-1.5 rounded-lg border border-red-800/50 bg-red-950/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/40"
          >
            <LogOut size={14} />
            Revoke All
          </button>
        </div>

        {sessions.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-500">
            No active sessions
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border border-neutral-800 bg-neutral-800/30 px-4 py-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Monitor size={14} className="text-neutral-400" />
                    <span className="text-sm font-medium text-neutral-200">
                      {session.device_info
                        ? session.device_info.length > 60
                          ? session.device_info.substring(0, 60) + "..."
                          : session.device_info
                        : "Unknown device"}
                    </span>
                    {session.is_current && (
                      <Badge variant="success">Current</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-neutral-500">
                    {session.ip_address && (
                      <span>IP: {session.ip_address}</span>
                    )}
                    <span>
                      Last active: {formatRelativeTime(session.last_used_at)}
                    </span>
                    <span>
                      Expires: {formatRelativeTime(session.expires_at)}
                    </span>
                  </div>
                </div>
                {!session.is_current && (
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="rounded p-1.5 text-neutral-500 hover:bg-red-950/30 hover:text-red-400"
                    title="Revoke session"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Security Info */}
      <Card>
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-900/30 text-emerald-400">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">
              Security Overview
            </h2>
            <p className="text-sm text-neutral-400">Account security status</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-neutral-800/50 px-4 py-3">
            <p className="text-xs text-neutral-500">Email Verification</p>
            <p className="text-sm font-medium text-neutral-200">
              {profile?.email_verified ? (
                <span className="text-emerald-400">Verified</span>
              ) : (
                <span className="text-amber-400">Unverified</span>
              )}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-800/50 px-4 py-3">
            <p className="text-xs text-neutral-500">Auth Provider</p>
            <p className="text-sm font-medium text-neutral-200">
              {profile?.auth_provider === "google"
                ? "Google OAuth"
                : "Email & Password"}
            </p>
          </div>
          <div className="rounded-lg bg-neutral-800/50 px-4 py-3">
            <p className="text-xs text-neutral-500">Active Sessions</p>
            <p className="text-sm font-medium text-neutral-200">
              {sessions.length}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
