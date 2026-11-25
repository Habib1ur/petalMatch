import { LinksClient } from "@/components/dashboard/LinksClient";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const admin = await requireAdmin();

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

  const initialLinks = links.map((link) => {
    const visits = link._count.visits;
    const submissions = link._count.submissions;
    return {
      id: link.id,
      slug: link.slug,
      name: link.name,
      description: link.description,
      customHeading: link.customHeading,
      welcomeMessage: link.welcomeMessage,
      isActive: link.isActive,
      expiresAt: link.expiresAt ? link.expiresAt.toISOString() : null,
      maxSubmissions: link.maxSubmissions,
      createdAt: link.createdAt.toISOString(),
      visitsCount: visits,
      submissionsCount: submissions,
      conversionRate:
        visits > 0 ? Math.round((submissions / visits) * 1000) / 10 : 0,
    };
  });

  return <LinksClient initialLinks={initialLinks} />;
}
