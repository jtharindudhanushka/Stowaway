/**
 * Fixed-window in-memory rate limiter.
 *
 * Scope note: this is per-instance. On a multi-instance deployment each
 * instance keeps its own counters, so the effective limit is
 * `limit × instances`. That is fine as an abuse brake — it stops a single
 * client hammering one instance — but it is not a billing-grade quota.
 * Swap the store for Redis/Upstash if you need a global guarantee.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Keep the map from growing without bound on a long-lived instance.
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/** Clear a key early — e.g. after a successful login. */
export function resetRateLimit(key: string) {
  buckets.delete(key);
}
