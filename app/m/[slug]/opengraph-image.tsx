import { ImageResponse } from "next/og";
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

  const heading =
    link?.customHeading || "Let's see what the stars say about you two.";
  const subtitle =
    link?.welcomeMessage ||
    "Two names. One little experiment. A surprising result.";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #FBCFE8 0%, #E9D5FF 50%, #FFF1E6 100%)",
          fontFamily: "Georgia, serif",
          padding: 64,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255, 255, 255, 0.85)",
            borderRadius: 36,
            padding: "56px 72px",
            border: "2px solid rgba(245, 166, 200, 0.6)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: "0.28em",
              color: "#D979A7",
              fontWeight: 700,
              marginBottom: 18,
            }}
          >
            PETALMATCH
          </div>
          <div
            style={{
              fontSize: 50,
              color: "#35283A",
              fontWeight: 600,
              textAlign: "center",
              lineHeight: 1.15,
              marginBottom: 20,
            }}
          >
            {heading}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#8D7D8D",
              textAlign: "center",
            }}
          >
            {subtitle}
          </div>
        </div>
      </div>
    ),
    size
  );
}
