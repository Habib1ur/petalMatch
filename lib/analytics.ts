import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/lib/utils";

export interface AnalyticsFilters {
  adminId: string;
  linkId?: string;
  from?: string;
  to?: string;
}

function buildDateFilter(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  const filter: Prisma.DateTimeFilter = {};
  if (from) {
    const d = new Date(from);
    if (!Number.isNaN(d.getTime())) filter.gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!Number.isNaN(d.getTime())) {
      d.setHours(23, 59, 59, 999);
      filter.lte = d;
    }
  }
  return Object.keys(filter).length > 0 ? filter : undefined;
}

function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export async function getAdminAnalytics(filters: AnalyticsFilters) {
  const { adminId, linkId, from, to } = filters;
  const dateFilter = buildDateFilter(from, to);

  const submissionWhere: Prisma.SubmissionWhereInput = {
    shareLink: { adminId },
    ...(linkId && linkId !== "all" ? { shareLinkId: linkId } : {}),
    ...(dateFilter ? { createdAt: dateFilter } : {}),
  };

  const visitWhere: Prisma.LinkVisitWhereInput = {
    shareLink: { adminId },
    ...(linkId && linkId !== "all" ? { shareLinkId: linkId } : {}),
    ...(dateFilter ? { visitedAt: dateFilter } : {}),
  };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalSubmissions,
    todaySubmissions,
    activeLinksCount,
    totalVisits,
    scoreAgg,
    topCrushGroups,
    links,
    submissionsForSeries,
    visitsForSeries,
  ] = await Promise.all([
    prisma.submission.count({ where: submissionWhere }),
    prisma.submission.count({
      where: {
        shareLink: { adminId },
        ...(linkId && linkId !== "all" ? { shareLinkId: linkId } : {}),
        createdAt: { gte: todayStart },
      },
    }),
    prisma.shareLink.count({
      where: {
        adminId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    }),
    prisma.linkVisit.count({ where: visitWhere }),
    prisma.submission.aggregate({
      where: submissionWhere,
      _avg: { compatibilityScore: true },
    }),
    prisma.submission.groupBy({
      by: ["normalizedCrushName"],
      where: submissionWhere,
      _count: { normalizedCrushName: true },
      _avg: { compatibilityScore: true },
      orderBy: { _count: { normalizedCrushName: "desc" } },
      take: 25,
    }),
    prisma.shareLink.findMany({
      where: {
        adminId,
        ...(linkId && linkId !== "all" ? { id: linkId } : {}),
      },
      include: {
        _count: {
          select: {
            submissions: true,
            visits: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.submission.findMany({
      where: submissionWhere,
      select: { createdAt: true, compatibilityScore: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.linkVisit.findMany({
      where: visitWhere,
      select: { visitedAt: true },
      orderBy: { visitedAt: "asc" },
    }),
  ]);

  const avgCompatibility = scoreAgg._avg.compatibilityScore
    ? Math.round(scoreAgg._avg.compatibilityScore * 10) / 10
    : 0;

  const conversionRate =
    totalVisits > 0
      ? Math.round((totalSubmissions / totalVisits) * 1000) / 10
      : 0;

  const crushLeaderboard = topCrushGroups.map((group) => ({
    normalizedName: group.normalizedCrushName,
    displayName: toTitleCase(group.normalizedCrushName),
    count: group._count.normalizedCrushName,
    avgScore: group._avg.compatibilityScore
      ? Math.round(group._avg.compatibilityScore)
      : 0,
  }));

  const topCrush = crushLeaderboard[0] ?? null;

  // Build daily, weekly, monthly series
  const dailyMap = new Map<string, { label: string; submissions: number; visits: number }>();
  const weeklyMap = new Map<string, { label: string; submissions: number; visits: number }>();
  const monthlyMap = new Map<string, { label: string; submissions: number; visits: number }>();

  for (const s of submissionsForSeries) {
    const dayKey = s.createdAt.toISOString().slice(0, 10);
    const weekKey = getIsoWeekKey(s.createdAt);
    const monthKey = s.createdAt.toISOString().slice(0, 7);

    const d = dailyMap.get(dayKey) ?? { label: dayKey, submissions: 0, visits: 0 };
    d.submissions += 1;
    dailyMap.set(dayKey, d);

    const w = weeklyMap.get(weekKey) ?? { label: weekKey, submissions: 0, visits: 0 };
    w.submissions += 1;
    weeklyMap.set(weekKey, w);

    const m = monthlyMap.get(monthKey) ?? { label: monthKey, submissions: 0, visits: 0 };
    m.submissions += 1;
    monthlyMap.set(monthKey, m);
  }

  for (const v of visitsForSeries) {
    const dayKey = v.visitedAt.toISOString().slice(0, 10);
    const weekKey = getIsoWeekKey(v.visitedAt);
    const monthKey = v.visitedAt.toISOString().slice(0, 7);

    const d = dailyMap.get(dayKey) ?? { label: dayKey, submissions: 0, visits: 0 };
    d.visits += 1;
    dailyMap.set(dayKey, d);

    const w = weeklyMap.get(weekKey) ?? { label: weekKey, submissions: 0, visits: 0 };
    w.visits += 1;
    weeklyMap.set(weekKey, w);

    const m = monthlyMap.get(monthKey) ?? { label: monthKey, submissions: 0, visits: 0 };
    m.visits += 1;
    monthlyMap.set(monthKey, m);
  }

  const sortSeries = (map: Map<string, { label: string; submissions: number; visits: number }>) =>
    Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));

  const mostActiveLinks = links
    .map((l) => {
      const visits = l._count.visits;
      const submissions = l._count.submissions;
      return {
        id: l.id,
        name: l.name,
        slug: l.slug,
        isActive: l.isActive,
        visits,
        submissions,
        conversionRate:
          visits > 0 ? Math.round((submissions / visits) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.submissions - a.submissions || b.visits - a.visits);

  return {
    overview: {
      totalSubmissions,
      todaySubmissions,
      activeLinksCount,
      totalVisits,
      avgCompatibility,
      conversionRate,
      topCrushName: topCrush ? topCrush.displayName : "—",
      topCrushCount: topCrush ? topCrush.count : 0,
    },
    crushLeaderboard,
    mostActiveLinks,
    series: {
      daily: sortSeries(dailyMap),
      weekly: sortSeries(weeklyMap),
      monthly: sortSeries(monthlyMap),
    },
  };
}
