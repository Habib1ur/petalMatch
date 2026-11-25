import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const searchField = url.searchParams.get("searchField") || "either"; // either | participant | crush
  const linkId = url.searchParams.get("linkId") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";
  const sort = url.searchParams.get("sort") || "newest";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize") || "15"))
  );

  const where: Prisma.SubmissionWhereInput = {
    shareLink: {
      adminId: admin.id,
    },
  };

  if (linkId && linkId !== "all") {
    where.shareLinkId = linkId;
  }

  if (search) {
    if (searchField === "participant") {
      where.participantName = { contains: search, mode: "insensitive" };
    } else if (searchField === "crush") {
      where.crushName = { contains: search, mode: "insensitive" };
    } else {
      where.OR = [
        { participantName: { contains: search, mode: "insensitive" } },
        { crushName: { contains: search, mode: "insensitive" } },
      ];
    }
  }

  if (from || to) {
    where.createdAt = {};
    if (from) {
      const fromDate = new Date(from);
      if (!Number.isNaN(fromDate.getTime())) {
        where.createdAt.gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(to);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }
  }

  let orderBy: Prisma.SubmissionOrderByWithRelationInput = {
    createdAt: "desc",
  };
  if (sort === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sort === "score_desc") {
    orderBy = { compatibilityScore: "desc" };
  } else if (sort === "score_asc") {
    orderBy = { compatibilityScore: "asc" };
  }

  const [total, submissions] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        shareLink: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    submissions,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
