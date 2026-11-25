import { ImageResponse } from "next/og";
import { renderPetalMatchOgCard } from "@/lib/og-card";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    renderPetalMatchOgCard({
      heading: "Let's see what the stars say about you two.",
      subtitle: "Two names. One little experiment. A surprising result.",
    }),
    size
  );
}
