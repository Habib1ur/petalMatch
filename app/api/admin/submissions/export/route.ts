import type { Prisma } from "@prisma/client";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { escapeCsvCell } from "@/lib/security";

export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() || "";
  const linkId = url.searchParams.get("linkId") || "";
  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  const where: Prisma.SubmissionWhereInput = {
    shareLink: {
      adminId: admin.id,
    },
  };

  if (linkId && linkId !== "all") {
    where.shareLinkId = linkId;
  }

  if (search) {
    where.OR = [
      { participantName: { contains: search, mode: "insensitive" } },
      { crushName: { contains: search, mode: "insensitive" } },
    ];
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

  const submissions = await prisma.submission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      shareLink: {
        select: { name: true, slug: true },
      },
    },
  });

  const format = url.searchParams.get("format") || "csv";
  if (format === "json") {
    return Response.json({ submissions });
  }

  const headers = [
    "Submission ID",
    "Participant Name",
    "Crush Name",
    "Compatibility (%)",
    "Sharing Link",
    "Link Slug",
    "Submitted At (ISO)",
  ];

  const rows = submissions.map((s) =>
    [
      escapeCsvCell(s.id),
      escapeCsvCell(s.participantName),
      escapeCsvCell(s.crushName),
      escapeCsvCell(s.compatibilityScore),
      escapeCsvCell(s.shareLink.name),
      escapeCsvCell(s.shareLink.slug),
      escapeCsvCell(s.createdAt.toISOString()),
    ].join(",")
  );

  const csv = [headers.map(escapeCsvCell).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="petalmatch-submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
