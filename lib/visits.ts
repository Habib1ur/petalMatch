import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createVisitorIdentifier } from "@/lib/security";

/**
 * Record a visit to a ShareLink without storing raw IP addresses.
 * Deduplicates by visitorIdentifier within the same day bucket.
 */
export async function recordShareLinkVisit(shareLinkId: string): Promise<void> {
  try {
    const hdrs = await headers();
    const forwarded = hdrs.get("x-forwarded-for");
    const ip =
      forwarded?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip")?.trim() ||
      "127.0.0.1";
    const userAgent = hdrs.get("user-agent");
    const visitorIdentifier = createVisitorIdentifier(ip, userAgent);

    const existing = await prisma.linkVisit.findFirst({
      where: {
        shareLinkId,
        visitorIdentifier,
      },
      select: { id: true },
    });

    if (!existing) {
      await prisma.linkVisit.create({
        data: {
          shareLinkId,
          visitorIdentifier,
        },
      });
    }
  } catch {
    // Non-fatal: never block page render if visit logging fails
  }
}
