"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { useToast } from "@/components/ui/ToastProvider";
import { formatDate, formatDateTime, formatTime } from "@/lib/utils";

interface ShareLinkOption {
  id: string;
  name: string;
  slug: string;
}

interface SubmissionRow {
  id: string;
  participantName: string;
  crushName: string;
  compatibilityScore: number;
  createdAt: string;
  shareLink: ShareLinkOption;
}

export function SubmissionsClient({
  links,
}: {
  links: ShareLinkOption[];
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<SubmissionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [searchField, setSearchField] = useState("either");
  const [linkId, setLinkId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSubmission, setActiveSubmission] =
    useState<SubmissionRow | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "15",
        sort,
        searchField,
      });
      if (search.trim()) params.set("search", search.trim());
      if (linkId !== "all") params.set("linkId", linkId);
      if (from) params.set("from", from);
      if (to) params.set("to", to);

      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setRows(data.submissions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setSelectedIds([]);
    } catch {
      toast("Failed to load submissions", "error");
    } finally {
      setLoading(false);
    }
  }, [page, sort, searchField, search, linkId, from, to, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSubmissions();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchSubmissions]);

  const toggleSelectAll = () => {
    if (selectedIds.length === rows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(rows.map((r) => r.id));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSingle = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${deleteTargetId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast("Submission deleted", "success");
      if (activeSubmission?.id === deleteTargetId) {
        setActiveSubmission(null);
      }
      setDeleteTargetId(null);
      fetchSubmissions();
    } catch {
      toast("Failed to delete submission", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/admin/submissions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      toast(`Deleted ${data.deletedCount} submissions`, "success");
      setBulkConfirmOpen(false);
      setSelectedIds([]);
      fetchSubmissions();
    } catch {
      toast("Bulk delete failed", "error");
    } finally {
      setDeleting(false);
    }
  };

  const exportUrl = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (linkId !== "all") params.set("linkId", linkId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return `/api/admin/submissions/export?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submissions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total.toLocaleString()} private compatibility responses collected.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setBulkConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          )}
          <a
            href={exportUrl()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="h-4 w-4 text-violet-500" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search names..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 py-2 pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none"
          />
        </div>

        <select
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value);
            setPage(1);
          }}
          aria-label="Search field"
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          <option value="either">Either name</option>
          <option value="participant">Participant only</option>
          <option value="crush">Crush only</option>
        </select>

        <select
          value={linkId}
          onChange={(e) => {
            setLinkId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by sharing link"
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          <option value="all">All sharing links</option>
          {links.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} (/{l.slug})
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(1);
          }}
          aria-label="Sort submissions"
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="score_desc">Highest score</option>
          <option value="score_asc">Lowest score</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(1);
            }}
            aria-label="From date"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xs focus:border-violet-500 focus:outline-none"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(1);
            }}
            aria-label="To date"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-2 text-xs focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs uppercase text-slate-500 dark:text-slate-400">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && selectedIds.length === rows.length}
                    onChange={toggleSelectAll}
                    aria-label="Select all rows"
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                  />
                </th>
                <th className="p-3.5 font-medium">ID</th>
                <th className="p-3.5 font-medium">Participant</th>
                <th className="p-3.5 font-medium">Crush</th>
                <th className="p-3.5 font-medium">Compatibility</th>
                <th className="p-3.5 font-medium">Sharing Link</th>
                <th className="p-3.5 font-medium">Date</th>
                <th className="p-3.5 font-medium">Time</th>
                <th className="p-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="p-4">
                      <div className="h-5 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="p-12 text-center text-sm text-slate-500 dark:text-slate-400"
                  >
                    No submissions match your filters.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setActiveSubmission(row)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td
                      className="p-3.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleOne(row.id)}
                        aria-label={`Select submission ${row.id}`}
                        className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                      />
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-400">
                      {row.id.slice(0, 8)}…
                    </td>
                    <td className="p-3.5 font-medium">{row.participantName}</td>
                    <td className="p-3.5 font-medium text-pink-500">
                      {row.crushName}
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-500">
                        {row.compatibilityScore}%
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400">
                      {row.shareLink.name}
                    </td>
                    <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="p-3.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatTime(row.createdAt)}
                    </td>
                    <td
                      className="p-3.5 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(row.id)}
                        aria-label="Delete submission"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 dark:border-slate-700 p-1.5 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Side Panel */}
      {activeSubmission && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setActiveSubmission(null)}
        >
          <div
            className="h-full w-full max-w-md border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-6 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Submission Details</h2>
              <button
                type="button"
                onClick={() => setActiveSubmission(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 rounded-2xl bg-gradient-to-br from-violet-500/15 to-pink-500/15 p-5 text-center border border-violet-500/20">
              <p className="text-lg font-semibold">
                {activeSubmission.participantName} ♡{" "}
                <span className="text-pink-500">
                  {activeSubmission.crushName}
                </span>
              </p>
              <p className="mt-2 text-4xl font-bold text-violet-500">
                {activeSubmission.compatibilityScore}%
              </p>
            </div>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs uppercase text-slate-400">
                  Participant Name
                </dt>
                <dd className="mt-1 font-medium">
                  {activeSubmission.participantName}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Crush Name</dt>
                <dd className="mt-1 font-medium">
                  {activeSubmission.crushName}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">
                  Associated Link
                </dt>
                <dd className="mt-1 font-medium">
                  {activeSubmission.shareLink.name} (/m/
                  {activeSubmission.shareLink.slug})
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">
                  Submitted At
                </dt>
                <dd className="mt-1 font-medium">
                  {formatDateTime(activeSubmission.createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">
                  Submission ID
                </dt>
                <dd className="mt-1 font-mono text-xs break-all text-slate-400">
                  {activeSubmission.id}
                </dd>
              </div>
            </dl>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTargetId(activeSubmission.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 py-2.5 text-sm font-medium text-white hover:bg-rose-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Submission</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete submission?"
        description="This will permanently remove this submission from your PostgreSQL database."
        loading={deleting}
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeleteTargetId(null)}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        title={`Delete ${selectedIds.length} submissions?`}
        description="This action cannot be undone. All selected submissions will be permanently deleted."
        confirmLabel={`Delete ${selectedIds.length}`}
        loading={deleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkConfirmOpen(false)}
      />
    </div>
  );
}
