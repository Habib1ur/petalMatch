import { CompatibilityExperience } from "@/components/result/CompatibilityExperience";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Use the seeded "welcome" link or the first active link for the root experience
  const defaultLink = await prisma.shareLink
    .findFirst({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ slug: "asc" }, { createdAt: "asc" }],
      select: {
        slug: true,
        customHeading: true,
        welcomeMessage: true,
      },
    })
    .catch(() => null);

  return (
    <CompatibilityExperience
      slug={defaultLink?.slug ?? "welcome"}
      customHeading={defaultLink?.customHeading}
      welcomeMessage={defaultLink?.welcomeMessage}
      isDemo
    />
  );
}
