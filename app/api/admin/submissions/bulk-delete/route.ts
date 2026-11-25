import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
});

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bulkDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please select at least one submission" },
      { status: 400 }
    );
  }

  const result = await prisma.submission.deleteMany({
    where: {
      id: { in: parsed.data.ids },
      shareLink: {
        adminId: admin.id,
      },
    },
  });

  return NextResponse.json({ deletedCount: result.count });
}
