import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { shareLinkSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.shareLink.findFirst({
    where: { id, adminId: admin.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => null);

    // Allow quick toggle of isActive without requiring full payload
    if (
      body &&
      typeof body === "object" &&
      Object.keys(body).length === 1 &&
      typeof body.isActive === "boolean"
    ) {
      const updated = await prisma.shareLink.update({
        where: { id },
        data: { isActive: body.isActive },
      });
      return NextResponse.json({ link: updated });
    }

    const parsed = shareLinkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid link data" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (data.slug !== existing.slug) {
      const slugConflict = await prisma.shareLink.findUnique({
        where: { slug: data.slug },
        select: { id: true },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: `The slug "${data.slug}" is already in use.` },
          { status: 409 }
        );
      }
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

    const updated = await prisma.shareLink.update({
      where: { id },
      data: {
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

    return NextResponse.json({ link: updated });
  } catch (error) {
    console.error("Update share link error:", error);
    return NextResponse.json(
      { error: "Failed to update sharing link" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.shareLink.findFirst({
    where: { id, adminId: admin.id },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  await prisma.shareLink.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
