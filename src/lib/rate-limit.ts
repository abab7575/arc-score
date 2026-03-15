// Simple in-memory rate limiter
// Tracks IP -> { count, resetTime }
// Cleans up expired entries periodically

const store = new Map<string, { count: number; resetTime: number }>();

// Clean up every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store) {
    if (now > value.resetTime) store.delete(key);
  }
}, 5 * 60 * 1000);

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = store.get(ip);

  if (!record || now > record.resetTime) {
    store.set(ip, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 };
  }

  record.count++;
  return { success: true, remaining: limit - record.count };
}
