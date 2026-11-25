import assert from "node:assert/strict";
import {
  calculateCompatibilityScore,
  getCompatibilityTier,
  normalizeName,
} from "../lib/compatibility";
import { checkRateLimit } from "../lib/rate-limit";
import { escapeCsvCell } from "../lib/security";
import {
  loginSchema,
  sanitizeTextInput,
  shareLinkSchema,
  submissionSchema,
} from "../lib/validations";

// 1. Name normalization & deterministic compatibility scoring
assert.equal(normalizeName("  Neha   "), "neha");
const s1 = calculateCompatibilityScore("Habib", "Neha");
const s2 = calculateCompatibilityScore("  habib ", "NEHA");
const s3 = calculateCompatibilityScore("Neha", "Habib");
assert.ok(s1 >= 1 && s1 <= 100, "Score must be between 1 and 100");
assert.equal(s1, s2, "Normalization must produce identical scores");
assert.equal(s1, s3, "Pair order must produce identical scores");

// 2. Compatibility tier mapping
assert.match(getCompatibilityTier(95).message, /chemistry/i);
assert.match(getCompatibilityTier(82).message, /blooming/i);
assert.match(getCompatibilityTier(73).message, /spark/i);
assert.match(getCompatibilityTier(55).message, /potential/i);
assert.match(getCompatibilityTier(35).message, /time/i);
assert.match(getCompatibilityTier(12).message, /waiting to bloom/i);

// 3. XSS sanitization & Zod schemas
assert.equal(sanitizeTextInput("  <script>Alice</script>  "), "scriptAlice/script");
assert.equal(submissionSchema.safeParse({ participantName: "", crushName: "Bob", slug: "welcome" }).success, false);
assert.equal(submissionSchema.safeParse({ participantName: "Alice", crushName: "Bob", slug: "welcome" }).success, true);
assert.equal(loginSchema.safeParse({ email: "ADMIN@petalmatch.com", password: "secret" }).success, true);
assert.equal(shareLinkSchema.safeParse({ name: "Campus", slug: "campus-2026" }).success, true);
assert.equal(shareLinkSchema.safeParse({ name: "Bad", slug: "bad slug!" }).success, false);

// 4. Rate limiter
const key = `test-rl-${Date.now()}`;
assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
assert.equal(checkRateLimit(key, 2, 10_000).allowed, true);
assert.equal(checkRateLimit(key, 2, 10_000).allowed, false);

// 5. CSV formula-injection protection
assert.equal(escapeCsvCell('=CMD("calc")'), `"'=CMD(""calc"")"`);
assert.equal(escapeCsvCell("Neha"), `"Neha"`);

console.log("All PetalMatch core verification checks passed!");
