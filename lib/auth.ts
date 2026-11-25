import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateSessionToken, hashToken } from "@/lib/security";

export const SESSION_COOKIE_NAME = "petalmatch_session";
const REMEMBER_ME_DAYS = 30;
const SHORT_SESSION_HOURS = 12;
const ROTATION_INTERVAL_MS = 24 * 60 * 60 * 1000; // Rotate token every 24h

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

function getSessionDurationMs(rememberMe: boolean): number {
  return rememberMe
    ? REMEMBER_ME_DAYS * 24 * 60 * 60 * 1000
    : SHORT_SESSION_HOURS * 60 * 60 * 1000;
}

export async function setSessionCookie(
  rawToken: string,
  expiresAt: Date,
  rememberMe: boolean
) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(rememberMe ? { expires: expiresAt } : {}),
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function createAdminSession(
  adminId: string,
  rememberMe: boolean
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = generateSessionToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + getSessionDurationMs(rememberMe));
  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent")?.slice(0, 250) ?? null;

  await prisma.session.create({
    data: {
      adminId,
      tokenHash,
      rememberMe,
      userAgent,
      expiresAt,
    },
  });

  await setSessionCookie(rawToken, expiresAt, rememberMe);
  return { rawToken, expiresAt };
}

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  name: string;
  retentionDays: number | null;
  sessionId: string;
}

/**
 * Validate the current session cookie, rotate if stale (>24h), and return the Admin.
 * Never throws; returns null when unauthenticated or expired.
 */
export async function getCurrentAdmin(): Promise<AuthenticatedAdmin | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawToken) return null;

    const tokenHash = hashToken(rawToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            name: true,
            retentionDays: true,
          },
        },
      },
    });

    if (!session) return null;

    const now = new Date();
    if (session.expiresAt <= now) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    // Rotate session token & extend sliding window if lastUsedAt > 24h ago
    const elapsedSinceUse = now.getTime() - session.lastUsedAt.getTime();
    if (elapsedSinceUse > ROTATION_INTERVAL_MS) {
      const nextRawToken = generateSessionToken();
      const nextTokenHash = hashToken(nextRawToken);
      const nextExpiresAt = new Date(
        now.getTime() + getSessionDurationMs(session.rememberMe)
      );

      await prisma.session
        .update({
          where: { id: session.id },
          data: {
            tokenHash: nextTokenHash,
            lastUsedAt: now,
            expiresAt: nextExpiresAt,
          },
        })
        .catch(() => {});

      // Cookie mutation is only allowed in Route Handlers / Server Actions; ignore in RSC
      try {
        await setSessionCookie(nextRawToken, nextExpiresAt, session.rememberMe);
      } catch {
        // Safe no-op during Server Component render
      }
    }

    return {
      ...session.admin,
      sessionId: session.id,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<AuthenticatedAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/login");
  }
  return admin;
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await prisma.session.deleteMany({ where: { tokenHash } }).catch(() => {});
  }
  await clearSessionCookie();
}
