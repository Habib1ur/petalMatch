import { createHash } from "node:crypto";

export interface CompatibilityTier {
  min: number;
  max: number;
  message: string;
  subtitle: string;
}

/**
 * Configurable compatibility message tiers.
 * Ordered from highest percentage range to lowest.
 */
export const COMPATIBILITY_TIERS: CompatibilityTier[] = [
  {
    min: 90,
    max: 100,
    message: "Okay, that's a lot of chemistry! 🌸",
    subtitle: "The petals practically aligned themselves for you two.",
  },
  {
    min: 80,
    max: 89,
    message: "Something beautiful might be blooming.",
    subtitle: "There is a warm, unmistakable glow around these two names.",
  },
  {
    min: 70,
    max: 79,
    message: "There's definitely a little spark.",
    subtitle: "A sweet connection with plenty of room to grow.",
  },
  {
    min: 50,
    max: 69,
    message: "Interesting... there's potential!",
    subtitle: "A curious pairing that might surprise you both.",
  },
  {
    min: 30,
    max: 49,
    message: "Maybe a little more time is needed.",
    subtitle: "Every garden takes patience before the first bloom.",
  },
  {
    min: 0,
    max: 29,
    message: "Some stories are still waiting to bloom.",
    subtitle: "Even quiet beginnings can turn into favorite chapters.",
  },
];

/**
 * Normalize a name consistently for deterministic scoring and leaderboard aggregation.
 * Trims leading/trailing whitespace, collapses internal whitespace, and lowercases.
 */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Format a normalized or raw name into a clean display form while preserving user casing
 * if provided, or collapsing extra spaces.
 */
export function cleanDisplayName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/**
 * Deterministic, playful server-side compatibility algorithm.
 * - Produces a score between 1 and 100.
 * - Order-independent (A + B yields the same score as B + A) after normalization.
 * - Uses SHA-256 + a gentle bell-leaning distribution so scores feel fun and varied.
 */
export function calculateCompatibilityScore(
  participantName: string,
  crushName: string
): number {
  const a = normalizeName(participantName);
  const b = normalizeName(crushName);

  // Sort alphabetically so (A, B) and (B, A) always produce the exact same score
  const pair = [a, b].sort().join("::petalmatch::");
  const digest = createHash("sha256").update(pair, "utf8").digest();

  // Combine two 32-bit slices for a rich deterministic seed
  const n1 = digest.readUInt32BE(0);
  const n2 = digest.readUInt32BE(4);

  // If both names are identical, give a playful high-harmony score (88-99)
  if (a.length > 0 && a === b) {
    return 88 + (n1 % 12);
  }

  // Blend uniform hash (1..100) with a slight harmonic boost so results span 1..100 naturally
  const base = ((n1 ^ n2) >>> 0) % 100; // 0..99
  return base + 1; // 1..100
}

export function getCompatibilityTier(score: number): CompatibilityTier {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  return (
    COMPATIBILITY_TIERS.find(
      (tier) => clamped >= tier.min && clamped <= tier.max
    ) ?? COMPATIBILITY_TIERS[COMPATIBILITY_TIERS.length - 1]
  );
}
