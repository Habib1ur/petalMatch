import { createHash, createHmac, randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

const FALLBACK_SECRET = "petalmatch-dev-secret-change-in-production";

export function getAppSecret(): string {
  return process.env.APP_SECRET || FALLBACK_SECRET;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function getClientIp(request: NextRequest | Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "127.0.0.1";
}

/**
 * Create a privacy-preserving visitor identifier for LinkVisit deduplication
 * without storing raw IP addresses in the database.
 */
export function createVisitorIdentifier(
  ip: string,
  userAgent: string | null
): string {
  const dayBucket = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", getAppSecret())
    .update(`${ip}|${userAgent ?? ""}|${dayBucket}`)
    .digest("hex")
    .slice(0, 32);
}

/**
 * Escape a value safely for CSV export (including formula injection mitigation).
 */
export function escapeCsvCell(value: string | number): string {
  const raw = String(value);
  const formulaSafe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  const escaped = formulaSafe.replace(/"/g, '""');
  return `"${escaped}"`;
}
