type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
// Keeps memory bounded if the caller sends many different keys.
const MAX_KEYS = 10_000;

function prune(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
  let overflow = buckets.size - MAX_KEYS;
  if (overflow > 0) {
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (--overflow <= 0) {
        break;
      }
    }
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: true } | { ok: false; retryAfter: number } {
  const now = Date.now();
  prune(now);
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (current.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }
  current.count += 1;
  return { ok: true };
}
