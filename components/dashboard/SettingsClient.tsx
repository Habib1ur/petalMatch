"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck, Trash2, User } from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";

interface SettingsClientProps {
  initialName: string;
  initialEmail: string;
  initialRetentionDays: number | null;
}

export function SettingsClient({
  initialName,
  initialEmail,
  initialRetentionDays,
}: SettingsClientProps) {
  const { toast } = useToast();

  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [retentionDays, setRetentionDays] = useState(
    initialRetentionDays !== null ? String(initialRetentionDays) : ""
  );
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          retentionDays: retentionDays ? Number(retentionDays) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to update settings", "error");
        return;
      }
      toast("Account settings saved", "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Failed to update password", "error");
        return;
      }
      toast("Password updated & other sessions revoked", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      toast("Network error", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRunCleanup = async () => {
    setCleaning(true);
    try {
      const days = Number(retentionDays);
      const res = await fetch(`/api/admin/settings?days=${days}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Cleanup failed", "error");
        return;
      }
      toast(`Removed ${data.deletedCount} expired submissions`, "success");
      setCleanupOpen(false);
    } catch {
      toast("Network error during cleanup", "error");
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your administrator account, security, and data retention policy.
        </p>
      </div>

      {/* Profile & Retention */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 text-base font-semibold">
          <User className="h-4 w-4 text-violet-500" />
          <h2>Profile & Data Retention</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Display Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
            Data Retention Period (Days — leave blank to keep forever)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="number"
              min={1}
              max={3650}
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              placeholder="Keep forever"
              className="w-48 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
            {retentionDays && Number(retentionDays) >= 1 && (
              <button
                type="button"
                onClick={() => setCleanupOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Purge older than {retentionDays}d now</span>
              </button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
          >
            {savingProfile ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>

      {/* Password Update */}
      <form
        onSubmit={handleChangePassword}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 text-base font-semibold">
          <KeyRound className="h-4 w-4 text-pink-500" />
          <h2>Change Password</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              Current Password
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
              New Password (min 8 chars)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Changing your password revokes all other active device sessions.
          </span>
          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-xl bg-slate-900 dark:bg-violet-600 px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={cleanupOpen}
        title="Purge old submissions?"
        description={`This will permanently delete all submissions older than ${retentionDays} days from PostgreSQL.`}
        confirmLabel="Purge Submissions"
        loading={cleaning}
        onConfirm={handleRunCleanup}
        onCancel={() => setCleanupOpen(false)}
      />
    </div>
  );
}
