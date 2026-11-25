"use client";

import { useCallback, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Crown, Eye, HeartHandshake, Percent, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

interface LinkOption {
  id: string;
  name: string;
  slug: string;
}

interface AnalyticsPayload {
  overview: {
    totalSubmissions: number;
    todaySubmissions: number;
    activeLinksCount: number;
    totalVisits: number;
    avgCompatibility: number;
    conversionRate: number;
    topCrushName: string;
    topCrushCount: number;
  };
  crushLeaderboard: Array<{
    normalizedName: string;
    displayName: string;
    count: number;
    avgScore: number;
  }>;
  mostActiveLinks: Array<{
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    visits: number;
    submissions: number;
    conversionRate: number;
  }>;
  series: {
    daily: Array<{ label: string; submissions: number; visits: number }>;
    weekly: Array<{ label: string; submissions: number; visits: number }>;
    monthly: Array<{ label: string; submissions: number; visits: number }>;
  };
}

export function AnalyticsClient({
  links,
  initialData,
}: {
  links: LinkOption[];
  initialData: AnalyticsPayload;
}) {
  const { toast } = useToast();
  const [data, setData] = useState<AnalyticsPayload>(initialData);
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [linkId, setLinkId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(
    async (nextLinkId: string, nextFrom: string, nextTo: string) => {
      if (nextLinkId === "all" && !nextFrom && !nextTo) {
        setData(initialData);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (nextLinkId !== "all") params.set("linkId", nextLinkId);
        if (nextFrom) params.set("from", nextFrom);
        if (nextTo) params.set("to", nextTo);
        const res = await fetch(`/api/admin/analytics?${params.toString()}`);
        if (!res.ok) throw new Error();
        const json = (await res.json()) as AnalyticsPayload;
        setData(json);
      } catch {
        toast("Failed to refresh analytics", "error");
      } finally {
        setLoading(false);
      }
    },
    [initialData, toast]
  );

  const handleLinkChange = (value: string) => {
    setLinkId(value);
    void refresh(value, from, to);
  };

  const handleFromChange = (value: string) => {
    setFrom(value);
    void refresh(linkId, value, to);
  };

  const handleToChange = (value: string) => {
    setTo(value);
    void refresh(linkId, from, value);
  };

  const activeSeries = data.series[granularity];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Submission trends, link conversion rates, and private crush leaderboard.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={linkId}
            onChange={(e) => handleLinkChange(e.target.value)}
            aria-label="Filter analytics by link"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All sharing links</option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={from}
            onChange={(e) => handleFromChange(e.target.value)}
            aria-label="Start date"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:border-violet-500 focus:outline-none"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => handleToChange(e.target.value)}
            aria-label="End date"
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs uppercase text-slate-400">
            <span>Total Visits</span>
            <Eye className="h-4 w-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {data.overview.totalVisits.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs uppercase text-slate-400">
            <span>Total Submissions</span>
            <HeartHandshake className="h-4 w-4 text-pink-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {data.overview.totalSubmissions.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs uppercase text-slate-400">
            <span>Conversion Rate</span>
            <Percent className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {data.overview.conversionRate}%
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs uppercase text-slate-400">
            <span>Avg. Compatibility</span>
            <Sparkles className="h-4 w-4 text-violet-500" />
          </div>
          <p className="mt-2 text-2xl font-bold">
            {data.overview.avgCompatibility}%
          </p>
        </div>
      </div>

      {/* Submission & Visit Chart */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">
            Visits & Submissions ({granularity})
          </h2>
          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-1 text-xs">
            {(["daily", "weekly", "monthly"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGranularity(g)}
                className={`rounded-lg px-3 py-1.5 font-medium capitalize transition-colors ${
                  granularity === g
                    ? "bg-violet-600 text-white"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="h-72 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
        ) : activeSeries.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-slate-500">
            No time-series data for this filter range yet.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSeries}>
                <defs>
                  <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EC4899" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#334155",
                    borderRadius: "12px",
                    color: "#F8FAFC",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  name="Visits"
                  stroke="#8B5CF6"
                  fill="url(#visitGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="submissions"
                  name="Submissions"
                  stroke="#EC4899"
                  fill="url(#subGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Crush Name Leaderboard */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 text-rose-500" />
            <h2 className="text-base font-semibold">
              Most Frequently Submitted Crush Names
            </h2>
          </div>

          {data.crushLeaderboard.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-sm text-slate-500">
              No crush names recorded yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {data.crushLeaderboard.map((item, idx) => (
                <div
                  key={item.normalizedName}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 px-3.5 py-2.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-bold text-violet-500">
                      {idx + 1}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {item.displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs">
                    <span className="text-slate-400">
                      Avg {item.avgScore}%
                    </span>
                    <span className="rounded-full bg-pink-500/15 px-2.5 py-0.5 font-semibold text-pink-500">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Active Links */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold">
            Most Active Sharing Links
          </h2>

          {data.mostActiveLinks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-10 text-center text-sm text-slate-500">
              No sharing links created yet.
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.mostActiveLinks.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="#94A3B8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#F8FAFC",
                    }}
                  />
                  <Bar
                    dataKey="visits"
                    name="Visits"
                    fill="#8B5CF6"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="submissions"
                    name="Submissions"
                    fill="#EC4899"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
