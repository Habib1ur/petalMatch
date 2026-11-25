import { NextResponse } from "next/server";
import { createAdminSession, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import { generateRandomSlug } from "@/lib/utils";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`register:ip:${ip}`, 10, 60 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many registration attempts. Please try again in ${ipLimit.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid registration details" },
        { status: 400 }
      );
    }

    const { name, email, password, rememberMe } = parsed.data;

    const existing = await prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const starterSlug = `match-${generateRandomSlug(5).toLowerCase()}`;

    const admin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash,
        shareLinks: {
          create: {
            slug: starterSlug,
            name: "My First Link",
            description: "Default starter sharing link",
            customHeading: "Let's see what the stars say about you two.",
            welcomeMessage: "Two names. One little experiment. A surprising result.",
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    await createAdminSession(admin.id, rememberMe);

    return NextResponse.json({ admin }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Unable to create account right now. Please try again." },
      { status: 500 }
    );
  }
}
