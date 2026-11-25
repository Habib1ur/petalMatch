import { ImageResponse } from "next/og";
import { renderPetalMatchOgCard } from "@/lib/og-card";
import { prisma } from "@/lib/prisma";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function ShareLinkOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await prisma.shareLink
    .findUnique({
      where: { slug },
      select: { customHeading: true, welcomeMessage: true },
    })
    .catch(() => null);

  return new ImageResponse(
    renderPetalMatchOgCard({
      heading:
        link?.customHeading || "Let's see what the stars say about you two.",
      subtitle:
        link?.welcomeMessage ||
        "Two names. One little experiment. A surprising result.",
    }),
    size
  );
}
