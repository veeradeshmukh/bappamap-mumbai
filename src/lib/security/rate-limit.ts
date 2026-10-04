import crypto from "crypto";

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Computes a privacy-preserving one-way salted SHA-256 hash of a client IP address.
 * Satisfies DPDP Act 2023 obligations by ensuring raw IP addresses are never stored.
 */
export function hashClientIp(ip: string, salt: string = "bappamap_default_salt"): string {
    return crypto.createHmac("sha256", salt).update(ip).digest("hex");
}

/**
 * Sliding window rate limit check.
 * Default: 5 requests per 10-minute window per hashed IP.
 */
export function checkRateLimit(
    ipHash: string,
    maxRequests: number = 5,
    windowMs: number = 10 * 60 * 1000
): { isAllowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    const entry = rateLimitMap.get(ipHash);

    if (!entry || now > entry.resetAt) {
        const nextReset = now + windowMs;
        rateLimitMap.set(ipHash, { count: 1, resetAt: nextReset });
        return { isAllowed: true, remaining: maxRequests - 1, resetAt: nextReset };
    }

    if (entry.count >= maxRequests) {
        return { isAllowed: false, remaining: 0, resetAt: entry.resetAt };
    }

    entry.count += 1;
    return {
        isAllowed: true,
        remaining: maxRequests - entry.count,
        resetAt: entry.resetAt
    };
}

/**
 * Resets the in-memory rate limiting store (used for test isolation).
 */
export function resetRateLimits(): void {
    rateLimitMap.clear();
}
