import { NextResponse } from "next/server";
import {
  getCurrentAdmin,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  changePasswordSchema,
  updateProfileSchema,
} from "@/lib/validations";

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid profile details" },
      { status: 400 }
    );
  }

  const { name, email, retentionDays } = parsed.data;
  if (email !== admin.email) {
    const existing = await prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Another administrator already uses this email." },
        { status: 409 }
      );
    }
  }

  const updated = await prisma.admin.update({
    where: { id: admin.id },
    data: {
      name,
      email,
      retentionDays: retentionDays ?? null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      retentionDays: true,
    },
  });

  return NextResponse.json({ admin: updated });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid password input" },
      { status: 400 }
    );
  }

  const dbAdmin = await prisma.admin.findUnique({
    where: { id: admin.id },
    select: { passwordHash: true },
  });

  if (!dbAdmin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const valid = await verifyPassword(
    parsed.data.currentPassword,
    dbAdmin.passwordHash
  );
  if (!valid) {
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );
  }

  const nextHash = await hashPassword(parsed.data.newPassword);
  await prisma.$transaction([
    prisma.admin.update({
      where: { id: admin.id },
      data: { passwordHash: nextHash },
    }),
    // Revoke all other sessions when password changes
    prisma.session.deleteMany({
      where: {
        adminId: admin.id,
        id: { not: admin.sessionId },
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}

/**
 * Trigger data retention cleanup: deletes submissions older than configured retentionDays
 * (or explicit ?days=N query param).
 */
export async function DELETE(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const daysParam = url.searchParams.get("days");
  const days = daysParam ? Number(daysParam) : admin.retentionDays;

  if (!days || !Number.isFinite(days) || days < 1) {
    return NextResponse.json(
      { error: "Please set a valid retention period (in days) first." },
      { status: 400 }
    );
  }

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const deleted = await prisma.submission.deleteMany({
    where: {
      shareLink: { adminId: admin.id },
      createdAt: { lt: cutoff },
    },
  });

  return NextResponse.json({ deletedCount: deleted.count });
}
