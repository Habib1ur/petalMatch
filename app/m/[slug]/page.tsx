import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExpiredLinkView } from "@/components/landing/ExpiredLinkView";
import { CompatibilityExperience } from "@/components/result/CompatibilityExperience";
import { prisma } from "@/lib/prisma";
import { recordShareLinkVisit } from "@/lib/visits";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const link = await prisma.shareLink
    .findUnique({
      where: { slug },
      select: {
        name: true,
        customHeading: true,
        welcomeMessage: true,
      },
    })
    .catch(() => null);

  if (!link) {
    return {
      title: "Link Not Found",
    };
  }

  const title = link.customHeading || "Let's see what the stars say about you two.";
  const description =
    link.welcomeMessage ||
    "Two names. One little experiment. A surprising compatibility result on PetalMatch.";

  return {
    title: `${link.name} — PetalMatch`,
    description,
    openGraph: {
      title: `PetalMatch · ${title}`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `PetalMatch · ${title}`,
      description,
    },
  };
}

export default async function ShareLinkPage({ params }: PageProps) {
  const { slug } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { submissions: true },
      },
    },
  });

  if (!shareLink) {
    notFound();
  }

  if (!shareLink.isActive) {
    return (
      <ExpiredLinkView reason="This PetalMatch link has been paused by its creator." />
    );
  }

  if (shareLink.expiresAt && shareLink.expiresAt <= new Date()) {
    return (
      <ExpiredLinkView reason="This PetalMatch link has passed its expiration date." />
    );
  }

  if (
    shareLink.maxSubmissions !== null &&
    shareLink._count.submissions >= shareLink.maxSubmissions
  ) {
    return (
      <ExpiredLinkView reason="This PetalMatch link has reached its maximum number of responses." />
    );
  }

  await recordShareLinkVisit(shareLink.id);

  return (
    <CompatibilityExperience
      slug={shareLink.slug}
      customHeading={shareLink.customHeading}
      welcomeMessage={shareLink.welcomeMessage}
    />
  );
}
