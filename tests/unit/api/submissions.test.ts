import { describe, it, expect, beforeEach } from "vitest";
import { POST } from "@/app/api/submissions/route";
import { resetRateLimits } from "@/lib/security/rate-limit";
import { clearQuarantine, getQuarantineSubmissions } from "@/lib/submissions/quarantine-store";

describe("POST /api/submissions Endpoint", () => {
    beforeEach(() => {
        resetRateLimits();
        clearQuarantine();
    });

    it("accepts a valid review submission and returns 202 Accepted with pending quarantine", async () => {
        const body = {
            submissionType: "review",
            mandalSlug: "lalbaugcha-raja",
            authorName: "Amit Devotee",
            rating: 5,
            crowdObservation: "heavy",
            comment: "Queues are orderly and darshan is peaceful.",
            turnstileToken: "1x00000000000000000000AA"
        };

        const req = new Request("http://localhost:3000/api/submissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": "203.0.113.1"
            },
            body: JSON.stringify(body)
        });

        const res = await POST(req);
        expect(res.status).toBe(202);

        const data = await res.json();
        expect(data.status).toBe("success");
        expect(data.submissionId).toBeDefined();

        const quarantined = getQuarantineSubmissions("pending");
        expect(quarantined).toHaveLength(1);
        expect(quarantined[0].submissionType).toBe("review");
    });

    it("rejects invalid turnstile tokens with HTTP 403 Forbidden and RFC 7807 format", async () => {
        const body = {
            submissionType: "review",
            mandalSlug: "lalbaugcha-raja",
            rating: 4,
            comment: "Nice decoration and arrangements.",
            turnstileToken: "2x00000000000000000000AB" // Fails verification
        };

        const req = new Request("http://localhost:3000/api/submissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": "203.0.113.2"
            },
            body: JSON.stringify(body)
        });

        const res = await POST(req);
        expect(res.status).toBe(403);
        expect(res.headers.get("Content-Type")).toContain("application/problem+json");

        const problem = await res.json();
        expect(problem.status).toBe(403);
        expect(problem.title).toBe("Bot Verification Failed");
    });

    it("rejects mandal suggestions outside South Mumbai with HTTP 400 and RFC 7807 problem details", async () => {
        const body = {
            submissionType: "new_mandal",
            nameEn: "Bandra Mandal",
            nameMr: "वांद्रे मंडळ",
            localityEn: "Bandra West",
            localityMr: "वांद्रे पश्चिम",
            latitude: 19.055, // Outside South Mumbai (max 19.015)
            longitude: 72.83,
            turnstileToken: "1x00000000000000000000AA"
        };

        const req = new Request("http://localhost:3000/api/submissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": "203.0.113.3"
            },
            body: JSON.stringify(body)
        });

        const res = await POST(req);
        expect(res.status).toBe(400);
        expect(res.headers.get("Content-Type")).toContain("application/problem+json");

        const problem = await res.json();
        expect(problem.status).toBe(400);
        expect(problem.invalidParams).toBeDefined();
        expect(problem.invalidParams.some((p: { name: string }) => p.name === "latitude")).toBe(
            true
        );
    });

    it("silently accepts bot honeypot submissions without saving to quarantine", async () => {
        const body = {
            submissionType: "review",
            mandalSlug: "lalbaugcha-raja",
            rating: 5,
            comment: "Spam comment by a bot.",
            turnstileToken: "1x00000000000000000000AA",
            bappa_hp_website: "http://spam-link.example.com" // Honeypot filled!
        };

        const req = new Request("http://localhost:3000/api/submissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": "203.0.113.4"
            },
            body: JSON.stringify(body)
        });

        const res = await POST(req);
        expect(res.status).toBe(202);

        // Verification: Honeypot submission was discarded and NOT added to quarantine
        const quarantined = getQuarantineSubmissions();
        expect(quarantined).toHaveLength(0);
    });

    it("enforces rate limits after 5 requests from the same IP hash", async () => {
        const ip = "203.0.113.99";

        for (let i = 0; i < 5; i++) {
            const req = new Request("http://localhost:3000/api/submissions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-forwarded-for": ip
                },
                body: JSON.stringify({
                    submissionType: "review",
                    mandalSlug: "lalbaugcha-raja",
                    rating: 5,
                    comment: "Valid repeated review submission.",
                    turnstileToken: "1x00000000000000000000AA"
                })
            });
            const res = await POST(req);
            expect(res.status).toBe(202);
        }

        // 6th request
        const req6 = new Request("http://localhost:3000/api/submissions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-forwarded-for": ip
            },
            body: JSON.stringify({
                submissionType: "review",
                mandalSlug: "lalbaugcha-raja",
                rating: 5,
                comment: "Should be throttled.",
                turnstileToken: "1x00000000000000000000AA"
            })
        });

        const res6 = await POST(req6);
        expect(res6.status).toBe(429);
        expect(res6.headers.get("Content-Type")).toContain("application/problem+json");
    });
});
