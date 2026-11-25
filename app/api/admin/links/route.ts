import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shareLinkSchema } from "@/lib/validations";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.shareLink.findMany({
    where: { adminId: admin.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          submissions: true,
          visits: true,
        },
      },
    },
  });

  const formatted = links.map((link) => {
    const visits = link._count.visits;
    const submissions = link._count.submissions;
    const conversionRate =
      visits > 0 ? Math.round((submissions / visits) * 1000) / 10 : 0;

    return {
      id: link.id,
      slug: link.slug,
      name: link.name,
      description: link.description,
      customHeading: link.customHeading,
      welcomeMessage: link.welcomeMessage,
      isActive: link.isActive,
      expiresAt: link.expiresAt,
      maxSubmissions: link.maxSubmissions,
      createdAt: link.createdAt,
      updatedAt: link.updatedAt,
      visitsCount: visits,
      submissionsCount: submissions,
      conversionRate,
    };
  });

  return NextResponse.json({ links: formatted });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = shareLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid link data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const existing = await prisma.shareLink.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: `The slug "${data.slug}" is already in use.` },
        { status: 409 }
      );
    }

    const expiresAtDate =
      data.expiresAt && data.expiresAt.trim() !== ""
        ? new Date(data.expiresAt)
        : null;

    if (expiresAtDate && Number.isNaN(expiresAtDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid expiration date" },
        { status: 400 }
      );
    }

    const maxSubmissions =
      typeof data.maxSubmissions === "number" &&
      !Number.isNaN(data.maxSubmissions)
        ? data.maxSubmissions
        : null;

    const created = await prisma.shareLink.create({
      data: {
        adminId: admin.id,
        slug: data.slug,
        name: data.name,
        description: data.description || null,
        customHeading: data.customHeading || null,
        welcomeMessage: data.welcomeMessage || null,
        isActive: data.isActive,
        expiresAt: expiresAtDate,
        maxSubmissions,
      },
    });

    return NextResponse.json({ link: created }, { status: 201 });
  } catch (error) {
    console.error("Create share link error:", error);
    return NextResponse.json(
      { error: "Failed to create sharing link" },
      { status: 500 }
    );
  }
}
