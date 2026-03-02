const bucket = new Map<string, { count: number; resetAt: number }>();

export const enforceFixedWindowRateLimit = (
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfterMs: number } => {
  const now = Date.now();
  const current = bucket.get(key);

  if (!current || now > current.resetAt) {
    bucket.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return { ok: true };
  }

  if (current.count >= limit) {
    return {
      ok: false,
      retryAfterMs: Math.max(current.resetAt - now, 1000)
    };
  }

  current.count += 1;
  bucket.set(key, current);
  return { ok: true };
};
