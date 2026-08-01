const store = new Map();
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 120; // 120 req/min per IP
function cleanup() {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now)
            store.delete(key);
    }
}
// Lightweight periodic cleanup
setInterval(cleanup, WINDOW_MS);
export function checkRateLimit(ip) {
    const now = Date.now();
    const entry = store.get(ip);
    if (!entry || entry.resetAt < now) {
        store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, retryAfter: 0 };
    }
    if (entry.count >= MAX_REQUESTS) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, retryAfter };
    }
    entry.count++;
    return { allowed: true, retryAfter: 0 };
}
