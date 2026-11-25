interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const globalForRateLimit = globalThis as unknown as {
  __petalmatchRateLimit?: Map<string, RateLimitEntry>;
};

const store =
  globalForRateLimit.__petalmatchRateLimit ?? new Map<string, RateLimitEntry>();
globalForRateLimit.__petalmatchRateLimit = store;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * In-memory sliding/fixed window rate limiter suitable for single-instance Render
 * web services and API route protection.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Opportunistic cleanup to keep memory bounded
  if (store.size > 5000) {
    for (const [k, v] of store.entries()) {
      if (v.resetAt <= now) {
        store.delete(k);
      }
    }
  }

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}
