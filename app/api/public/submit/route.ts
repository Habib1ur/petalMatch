import { NextResponse } from "next/server";
import {
  calculateCompatibilityScore,
  cleanDisplayName,
  getCompatibilityTier,
  normalizeName,
} from "@/lib/compatibility";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import { submissionSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`public-submit:${ip}`, 25, 60 * 1000);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: `You're trying a little too fast! Please wait ${rate.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = submissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ||
            "Please enter both names carefully.",
        },
        { status: 400 }
      );
    }

    const { slug } = parsed.data;
    const participantName = cleanDisplayName(parsed.data.participantName);
    const crushName = cleanDisplayName(parsed.data.crushName);
    const normalizedParticipantName = normalizeName(participantName);
    const normalizedCrushName = normalizeName(crushName);
    const compatibilityScore = calculateCompatibilityScore(
      participantName,
      crushName
    );
    const tier = getCompatibilityTier(compatibilityScore);

    // Root website ("/") broadcasts the submission to every admin's dashboard
    if (slug === "__root__") {
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          shareLinks: {
            where: { slug: { startsWith: "root-" } },
            select: { id: true },
            take: 1,
          },
        },
      });

      if (admins.length > 0) {
        await prisma.$transaction(async (tx) => {
          for (const admin of admins) {
            let targetLinkId = admin.shareLinks[0]?.id;
            if (!targetLinkId) {
              const rootSlug = `root-${admin.id.slice(-8).toLowerCase()}`;
              const createdLink = await tx.shareLink.upsert({
                where: { slug: rootSlug },
                update: {},
                create: {
                  adminId: admin.id,
                  slug: rootSlug,
                  name: "Root Website (/)",
                  description: "Submissions from the main home page",
                  isActive: true,
                },
                select: { id: true },
              });
              targetLinkId = createdLink.id;
            }

            await tx.submission.create({
              data: {
                shareLinkId: targetLinkId,
                participantName,
                crushName,
                normalizedParticipantName,
                normalizedCrushName,
                compatibilityScore,
              },
            });
          }
        });
      }

      return NextResponse.json({
        participantName,
        crushName,
        compatibilityScore,
        tier,
      });
    }

    const shareLink = await prisma.shareLink.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { submissions: true },
        },
      },
    });

    if (!shareLink) {
      return NextResponse.json(
        { error: "This PetalMatch link could not be found." },
        { status: 404 }
      );
    }

    if (!shareLink.isActive) {
      return NextResponse.json(
        { error: "This PetalMatch link is no longer active." },
        { status: 410 }
      );
    }

    if (shareLink.expiresAt && shareLink.expiresAt <= new Date()) {
      return NextResponse.json(
        { error: "This PetalMatch link has expired." },
        { status: 410 }
      );
    }

    if (
      shareLink.maxSubmissions !== null &&
      shareLink._count.submissions >= shareLink.maxSubmissions
    ) {
      return NextResponse.json(
        { error: "This PetalMatch link has reached its submission limit." },
        { status: 410 }
      );
    }

    await prisma.submission.create({
      data: {
        shareLinkId: shareLink.id,
        participantName,
        crushName,
        normalizedParticipantName,
        normalizedCrushName,
        compatibilityScore,
      },
    });

    // Return ONLY the participant's own result — never expose IDs, stats, or other submissions
    return NextResponse.json({
      participantName,
      crushName,
      compatibilityScore,
      tier,
    });
  } catch (error) {
    console.error("Public submission error:", error);
    return NextResponse.json(
      { error: "Something went wrong while calculating your match." },
      { status: 500 }
    );
  }
}
