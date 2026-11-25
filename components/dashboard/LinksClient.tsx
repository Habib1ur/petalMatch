"use client";

import { useCallback, useState } from "react";
import {
  Copy,
  Edit3,
  ExternalLink,
  Plus,
  Power,
  QrCode,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { QrModal } from "@/components/dashboard/QrModal";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDate, generateRandomSlug, getAppUrl } from "@/lib/utils";

interface ShareLinkItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  customHeading: string | null;
  welcomeMessage: string | null;
  isActive: boolean;
  expiresAt: string | null;
  maxSubmissions: number | null;
  createdAt: string;
  visitsCount: number;
  submissionsCount: number;
  conversionRate: number;
}

interface LinkFormState {
  name: string;
  slug: string;
  description: string;
  customHeading: string;
  welcomeMessage: string;
  expiresAt: string;
  maxSubmissions: string;
  isActive: boolean;
}

const EMPTY_FORM: LinkFormState = {
  name: "",
  slug: "",
  description: "",
  customHeading: "",
  welcomeMessage: "",
  expiresAt: "",
  maxSubmissions: "",
  isActive: true,
};

export function LinksClient({
  initialLinks,
}: {
  initialLinks: ShareLinkItem[];
}) {
  const { toast } = useToast();
  const [links, setLinks] = useState<ShareLinkItem[]>(initialLinks);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<LinkFormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [qrLink, setQrLink] = useState<ShareLinkItem | null>(null);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/links");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLinks(data.links);
    } catch {
      toast("Failed to load sharing links", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      slug: generateRandomSlug(6),
    });
    setModalOpen(true);
  };

  const openEditModal = (link: ShareLinkItem) => {
    setEditingId(link.id);
    setForm({
      name: link.name,
      slug: link.slug,
      description: link.description || "",
      customHeading: link.customHeading || "",
      welcomeMessage: link.welcomeMessage || "",
      expiresAt: link.expiresAt ? link.expiresAt.slice(0, 10) : "",
      maxSubmissions:
        link.maxSubmissions !== null ? String(link.maxSubmissions) : "",
      isActive: link.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        customHeading: form.customHeading,
        welcomeMessage: form.welcomeMessage,
        isActive: form.isActive,
        expiresAt: form.expiresAt || null,
        maxSubmissions: form.maxSubmissions
          ? Number(form.maxSubmissions)
          : null,
      };

      const url = editingId
        ? `/api/admin/links/${editingId}`
        : "/api/admin/links";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || "Could not save link", "error");
        return;
      }

      toast(
        editingId ? "Sharing link updated" : "Sharing link created!",
        "success"
      );
      setModalOpen(false);
      loadLinks();
    } catch {
      toast("Network error while saving link", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (link: ShareLinkItem) => {
    try {
      const res = await fetch(`/api/admin/links/${link.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (!res.ok) throw new Error();
      toast(
        link.isActive ? "Link deactivated" : "Link reactivated",
        "info"
      );
      loadLinks();
    } catch {
      toast("Failed to update link status", "error");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/links/${deleteId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast("Sharing link deleted", "success");
      setDeleteId(null);
      loadLinks();
    } catch {
      toast("Failed to delete link", "error");
    } finally {
      setDeleting(false);
    }
  };

  const fullUrl = (slug: string) => `${getAppUrl()}/m/${slug}`;

  const copyLinkUrl = async (slug: string) => {
    try {
      await navigator.clipboard.writeText(fullUrl(slug));
      toast("Link URL copied!", "success");
    } catch {
      toast("Failed to copy link", "error");
    }
  };

  const getStatusBadge = (link: ShareLinkItem) => {
    const expired = link.expiresAt && new Date(link.expiresAt) <= new Date();
    const maxed =
      link.maxSubmissions !== null &&
      link.submissionsCount >= link.maxSubmissions;

    if (!link.isActive) {
      return (
        <span className="inline-flex rounded-full bg-slate-500/15 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          Inactive
        </span>
      );
    }
    if (expired) {
      return (
        <span className="inline-flex rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-500">
          Expired
        </span>
      );
    }
    if (maxed) {
      return (
        <span className="inline-flex rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-500">
          Limit reached
        </span>
      );
    }
    return (
      <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-500">
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sharing Links</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create unique romantic links and track visits, submissions, and conversions.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-600/20 hover:bg-violet-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Link</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]"
            />
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">
          <p className="text-base font-medium mb-1">No sharing links yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
            Create your first PetalMatch link and send it to friends!
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create First Link</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {links.map((link) => (
            <div
              key={link.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base font-semibold truncate">
                        {link.name}
                      </h2>
                      {getStatusBadge(link)}
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-violet-500">
                      /m/{link.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => copyLinkUrl(link.slug)}
                      title="Copy URL"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-500"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <a
                      href={`/m/${link.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open link"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-500"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setQrLink(link)}
                      title="Generate QR Code"
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-500"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {link.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                    {link.description}
                  </p>
                )}

                <div className="my-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3 text-center">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Visits
                    </p>
                    <p className="text-base font-bold">{link.visitsCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Submissions
                    </p>
                    <p className="text-base font-bold text-pink-500">
                      {link.submissionsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Conversion
                    </p>
                    <p className="text-base font-bold text-violet-500">
                      {link.conversionRate}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  Created {formatDate(link.createdAt)}
                  {link.expiresAt
                    ? ` · Expires ${formatDate(link.expiresAt)}`
                    : ""}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openEditModal(link)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(link)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Power className="h-3.5 w-3.5" />
                    <span>{link.isActive ? "Pause" : "Activate"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(link.id)}
                    className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-medium text-rose-500 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">
                {editingId ? "Edit Sharing Link" : "Create Sharing Link"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
                  Link Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="University Friends"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
                  Unique Slug *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="university"
                    className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 font-mono text-sm focus:border-violet-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, slug: generateRandomSlug(6) })
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    <span>Random</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
                  Description (Private)
                </label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Shared in campus group chat"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
                  Custom Landing Heading (Optional)
                </label>
                <input
                  type="text"
                  value={form.customHeading}
                  onChange={(e) =>
                    setForm({ ...form, customHeading: e.target.value })
                  }
                  placeholder="Let's see what the stars say about you two."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
                  Custom Welcome Message (Optional)
                </label>
                <input
                  type="text"
                  value={form.welcomeMessage}
                  onChange={(e) =>
                    setForm({ ...form, welcomeMessage: e.target.value })
                  }
                  placeholder="Two names. One little experiment. A surprising result."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
                    Expiration Date
                  </label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm({ ...form, expiresAt: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase text-slate-400">
                    Max Submissions
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.maxSubmissions}
                    onChange={(e) =>
                      setForm({ ...form, maxSubmissions: e.target.value })
                    }
                    placeholder="Unlimited"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-600 text-violet-600"
                />
                <span>Link is active</span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-violet-600 px-5 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete sharing link?"
        description="Deleting this link will also permanently delete all submissions and visit records associated with it."
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <QrModal
        open={Boolean(qrLink)}
        linkName={qrLink?.name || ""}
        url={qrLink ? fullUrl(qrLink.slug) : ""}
        onClose={() => setQrLink(null)}
      />
    </div>
  );
}
