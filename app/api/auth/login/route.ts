import { NextResponse } from "next/server";
import { createAdminSession, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const ipLimit = checkRateLimit(`login:ip:${ip}`, 15, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${ipLimit.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid credentials" },
        { status: 400 }
      );
    }

    const { email, password, rememberMe } = parsed.data;
    const emailLimit = checkRateLimit(
      `login:email:${email}`,
      10,
      15 * 60 * 1000
    );
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts for this account. Try again in ${emailLimit.retryAfterSeconds}s.`,
        },
        { status: 429 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    await createAdminSession(admin.id, rememberMe);

    return NextResponse.json({
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
