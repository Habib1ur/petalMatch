import { SubmissionsClient } from "@/components/dashboard/SubmissionsClient";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const admin = await requireAdmin();
  const links = await prisma.shareLink.findMany({
    where: { adminId: admin.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, slug: true },
  });

  return <SubmissionsClient links={links} />;
}
