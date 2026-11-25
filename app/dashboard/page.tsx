import Link from "next/link";
import {
  ArrowUpRight,
  CalendarHeart,
  Crown,
  Eye,
  HeartHandshake,
  Link2,
  Sparkles,
} from "lucide-react";
import { getAdminAnalytics } from "@/lib/analytics";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const admin = await requireAdmin();

  const [analytics, recentSubmissions] = await Promise.all([
    getAdminAnalytics({ adminId: admin.id }),
    prisma.submission.findMany({
      where: { shareLink: { adminId: admin.id } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        shareLink: {
          select: { name: true, slug: true },
        },
      },
    }),
  ]);

  const { overview, crushLeaderboard } = analytics;

  const kpis = [
    {
      label: "Total Submissions",
      value: overview.totalSubmissions.toLocaleString(),
      icon: HeartHandshake,
      accent: "text-violet-500 bg-violet-500/10",
    },
    {
      label: "Today's Submissions",
      value: overview.todaySubmissions.toLocaleString(),
      icon: CalendarHeart,
      accent: "text-pink-500 bg-pink-500/10",
    },
    {
      label: "Active Links",
      value: overview.activeLinksCount.toLocaleString(),
      icon: Link2,
      accent: "text-emerald-500 bg-emerald-500/10",
    },
    {
      label: "Total Link Visits",
      value: overview.totalVisits.toLocaleString(),
      icon: Eye,
      accent: "text-sky-500 bg-sky-500/10",
    },
    {
      label: "Avg. Compatibility",
      value: `${overview.avgCompatibility}%`,
      icon: Sparkles,
      accent: "text-amber-500 bg-amber-500/10",
    },
    {
      label: "Top Crush Name",
      value: overview.topCrushName,
      sub:
        overview.topCrushCount > 0
          ? `${overview.topCrushCount} submissions`
          : "No data yet",
      icon: Crown,
      accent: "text-rose-500 bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time activity across all your PetalMatch sharing links.
          </p>
        </div>
        <Link
          href="/dashboard/links"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-600/20 hover:bg-violet-700 transition-colors"
        >
          <span>Manage Sharing Links</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${kpi.accent}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight truncate">
                {kpi.value}
              </p>
              {kpi.sub && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {kpi.sub}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Submissions */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent Submissions</h2>
            <Link
              href="/dashboard/submissions"
              className="text-xs font-medium text-violet-500 hover:text-violet-400"
            >
              View all →
            </Link>
          </div>

          {recentSubmissions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No submissions yet. Share one of your links to start collecting matches!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase text-slate-500 dark:text-slate-400">
                    <th className="pb-2.5 font-medium">Participant</th>
                    <th className="pb-2.5 font-medium">Crush</th>
                    <th className="pb-2.5 font-medium">Score</th>
                    <th className="pb-2.5 font-medium">Link</th>
                    <th className="pb-2.5 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                  {recentSubmissions.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-medium">{item.participantName}</td>
                      <td className="py-3 text-pink-500 font-medium">
                        {item.crushName}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex rounded-full bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-500">
                          {item.compatibilityScore}%
                        </span>
                      </td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400">
                        /{item.shareLink.slug}
                      </td>
                      <td className="py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(item.createdAt)} · {formatTime(item.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Crush Leaderboard */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold">Top Crush Names</h2>
            <Link
              href="/dashboard/analytics"
              className="text-xs font-medium text-violet-500 hover:text-violet-400"
            >
              Full analytics →
            </Link>
          </div>

          {crushLeaderboard.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Crush leaderboard will appear once submissions arrive.
            </div>
          ) : (
            <ul className="space-y-2.5">
              {crushLeaderboard.slice(0, 6).map((entry, idx) => (
                <li
                  key={entry.normalizedName}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/50 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-500">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {entry.displayName}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {entry.count} {entry.count === 1 ? "submission" : "submissions"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
