import { AnalyticsClient } from "@/components/charts/AnalyticsClient";
import { getAdminAnalytics } from "@/lib/analytics";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const admin = await requireAdmin();

  const [links, initialData] = await Promise.all([
    prisma.shareLink.findMany({
      where: { adminId: admin.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true },
    }),
    getAdminAnalytics({ adminId: admin.id }),
  ]);

  return <AnalyticsClient links={links} initialData={initialData} />;
}
