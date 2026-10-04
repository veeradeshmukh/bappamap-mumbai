import { describe, it, expect, beforeEach } from "vitest";
import { hashClientIp, checkRateLimit, resetRateLimits } from "@/lib/security/rate-limit";

describe("Privacy-Preserving Rate Limiter", () => {
    beforeEach(() => {
        resetRateLimits();
    });

    it("generates deterministic one-way salted IP hash without storing raw IP", () => {
        const ip = "192.168.1.100";
        const hash1 = hashClientIp(ip, "test-salt-secret");
        const hash2 = hashClientIp(ip, "test-salt-secret");

        expect(hash1).toBe(hash2);
        expect(hash1).toHaveLength(64); // SHA-256 hex string
        expect(hash1).not.toContain(ip); // Privacy check
    });

    it("allows up to 5 requests per 10-minute window for an IP hash", () => {
        const ipHash = hashClientIp("10.0.0.1", "test-salt");

        for (let i = 0; i < 5; i++) {
            const allowed = checkRateLimit(ipHash, 5, 10 * 60 * 1000);
            expect(allowed.isAllowed).toBe(true);
            expect(allowed.remaining).toBe(4 - i);
        }

        // 6th request is throttled
        const throttled = checkRateLimit(ipHash, 5, 10 * 60 * 1000);
        expect(throttled.isAllowed).toBe(false);
        expect(throttled.remaining).toBe(0);
    });

    it("tracks rate limits separately for different IP hashes", () => {
        const hashA = hashClientIp("10.0.0.1", "test-salt");
        const hashB = hashClientIp("10.0.0.2", "test-salt");

        for (let i = 0; i < 5; i++) {
            checkRateLimit(hashA, 5, 10 * 60 * 1000);
        }

        expect(checkRateLimit(hashA, 5, 10 * 60 * 1000).isAllowed).toBe(false);
        expect(checkRateLimit(hashB, 5, 10 * 60 * 1000).isAllowed).toBe(true);
    });
});
