import { describe, it, expect } from "vitest";
import {
    verifyAdminCredentials,
    generateAdminSessionToken,
    verifyAdminSessionToken,
    getAdminSessionFromRequest,
    ADMIN_COOKIE_NAME
} from "@/lib/auth/admin-auth";

describe("Admin Authentication Service", () => {
    describe("verifyAdminCredentials", () => {
        it("returns true for valid password", () => {
            expect(verifyAdminCredentials("bappa-admin-secret-2027")).toBe(true);
        });

        it("returns false for invalid password", () => {
            expect(verifyAdminCredentials("wrong-password")).toBe(false);
            expect(verifyAdminCredentials("")).toBe(false);
        });
    });

    describe("generateAdminSessionToken & verifyAdminSessionToken", () => {
        it("generates a signed token that verifies successfully", () => {
            const token = generateAdminSessionToken("admin@bappamap.in");
            expect(token).toContain(".");

            const verification = verifyAdminSessionToken(token);
            expect(verification.valid).toBe(true);
            expect(verification.email).toBe("admin@bappamap.in");
        });

        it("rejects tampered tokens", () => {
            const token = generateAdminSessionToken("admin@bappamap.in");
            const tampered = token.slice(0, -6) + "xxxxxx";
            const verification = verifyAdminSessionToken(tampered);
            expect(verification.valid).toBe(false);
        });

        it("rejects empty or malformed tokens", () => {
            expect(verifyAdminSessionToken("").valid).toBe(false);
            expect(verifyAdminSessionToken("invalid-token-without-dot").valid).toBe(false);
        });
    });

    describe("getAdminSessionFromRequest", () => {
        it("authenticates via valid cookie", () => {
            const token = generateAdminSessionToken("admin@bappamap.in");
            const req = new Request("http://localhost:3000/api/admin/moderation/queue", {
                headers: {
                    cookie: `${ADMIN_COOKIE_NAME}=${token}; other=value`
                }
            });

            const session = getAdminSessionFromRequest(req);
            expect(session.isAuthenticated).toBe(true);
            expect(session.email).toBe("admin@bappamap.in");
        });

        it("authenticates via valid Bearer authorization header", () => {
            const token = generateAdminSessionToken("admin@bappamap.in");
            const req = new Request("http://localhost:3000/api/admin/moderation/queue", {
                headers: {
                    authorization: `Bearer ${token}`
                }
            });

            const session = getAdminSessionFromRequest(req);
            expect(session.isAuthenticated).toBe(true);
            expect(session.email).toBe("admin@bappamap.in");
        });

        it("rejects request with missing or invalid credentials", () => {
            const req = new Request("http://localhost:3000/api/admin/moderation/queue");
            const session = getAdminSessionFromRequest(req);
            expect(session.isAuthenticated).toBe(false);
        });
    });
});
