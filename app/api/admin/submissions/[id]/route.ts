import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deleted = await prisma.submission.deleteMany({
    where: {
      id,
      shareLink: {
        adminId: admin.id,
      },
    },
  });

  if (deleted.count === 0) {
    return NextResponse.json(
      { error: "Submission not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
