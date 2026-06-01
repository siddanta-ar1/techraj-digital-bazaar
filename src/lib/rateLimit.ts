/**
 * Sliding-window in-memory rate limiter.
 *
 * Works per-process. In a single-instance deployment (VPS, Docker) this gives
 * exact limits. On multi-instance serverless (Vercel functions) each instance
 * has its own counter, so the effective limit is multiplied by instance count
 * — still provides meaningful protection against rapid automated abuse.
 *
 * For strict cross-instance limiting, swap the store for Redis/Upstash.
 */

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

// Housekeeping: prune keys older than 10 minutes every 5 minutes
// so the map doesn't grow unbounded in long-running processes.
let pruneTimer: ReturnType<typeof setInterval> | null = null;
function ensurePruneTimer() {
  if (pruneTimer) return;
  pruneTimer = setInterval(() => {
    const cutoff = Date.now() - 10 * 60 * 1000;
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 5 * 60 * 1000);
  // Don't keep Node.js alive just for this timer
  if (pruneTimer.unref) pruneTimer.unref();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

/**
 * @param key        Unique identifier (e.g. `"ip:order:1.2.3.4"`)
 * @param limit      Max requests allowed in the window
 * @param windowMs   Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  ensurePruneTimer();

  const now = Date.now();
  const windowStart = now - windowMs;

  const entry = store.get(key) ?? { timestamps: [] };
  // Keep only timestamps within the current window
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetInMs: oldest + windowMs - now,
    };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: limit - entry.timestamps.length,
    resetInMs: windowMs,
  };
}

/** Extract the real client IP from Next.js request headers. */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
