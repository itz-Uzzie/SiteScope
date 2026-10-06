type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

export function rateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    if (buckets.size > 10_000) for (const [item, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(item);
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= LIMIT) return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
