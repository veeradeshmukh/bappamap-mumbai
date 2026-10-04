import { describe, it, expect } from "vitest";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

describe("Turnstile Token Verification", () => {
    it("accepts Cloudflare official test passing token (1x...)", async () => {
        const result = await verifyTurnstileToken("1x00000000000000000000AA", "127.0.0.1");
        expect(result.success).toBe(true);
    });

    it("rejects Cloudflare official test failing token (2x...)", async () => {
        const result = await verifyTurnstileToken("2x00000000000000000000AB", "127.0.0.1");
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
    });

    it("rejects empty or missing token", async () => {
        const result = await verifyTurnstileToken("", "127.0.0.1");
        expect(result.success).toBe(false);
    });
});
