import { describe, it, expect, beforeEach } from "vitest";
import { GET as getQueue } from "@/app/api/admin/moderation/queue/route";
import { PATCH as updateSubmission } from "@/app/api/admin/moderation/[id]/route";
import { saveToQuarantine, clearQuarantine } from "@/lib/submissions/quarantine-store";
import { generateAdminSessionToken, ADMIN_COOKIE_NAME } from "@/lib/auth/admin-auth";

describe("Admin Moderation API Endpoints", () => {
    beforeEach(() => {
        clearQuarantine();
    });

    const createAuthHeaders = (email: string = "admin@bappamap.in") => {
        const token = generateAdminSessionToken(email);
        return {
            cookie: `${ADMIN_COOKIE_NAME}=${token}`,
            "Content-Type": "application/json"
        };
    };

    describe("GET /api/admin/moderation/queue", () => {
        it("rejects unauthenticated requests with HTTP 401 Unauthorized", async () => {
            const req = new Request("http://localhost:3000/api/admin/moderation/queue");
            const res = await getQueue(req);

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.title).toBe("Unauthorized");
        });

        it("returns queue submissions and statistics for authenticated admin", async () => {
            saveToQuarantine({
                submissionType: "review",
                payload: { mandalSlug: "girgaoncha-raja", rating: 5, comment: "Peaceful darshan" }
            });

            const req = new Request("http://localhost:3000/api/admin/moderation/queue", {
                headers: createAuthHeaders()
            });

            const res = await getQueue(req);
            expect(res.status).toBe(200);

            const body = await res.json();
            expect(body.submissions).toHaveLength(1);
            expect(body.submissions[0].submissionType).toBe("review");
            expect(body.stats.total).toBe(1);
            expect(body.stats.pending).toBe(1);
        });

        it("filters submissions by status parameter", async () => {
            const sub = saveToQuarantine({
                submissionType: "new_mandal",
                payload: { nameEn: "New Mandal" }
            });

            // Make an authenticated approve action
            const patchReq = new Request(`http://localhost:3000/api/admin/moderation/${sub.id}`, {
                method: "PATCH",
                headers: createAuthHeaders(),
                body: JSON.stringify({ action: "approve" })
            });
            await updateSubmission(patchReq, { params: Promise.resolve({ id: sub.id }) });

            // Query with ?status=pending
            const pendingReq = new Request(
                "http://localhost:3000/api/admin/moderation/queue?status=pending",
                {
                    headers: createAuthHeaders()
                }
            );
            const pendingRes = await getQueue(pendingReq);
            const pendingBody = await pendingRes.json();
            expect(pendingBody.submissions).toHaveLength(0);

            // Query with ?status=approved
            const approvedReq = new Request(
                "http://localhost:3000/api/admin/moderation/queue?status=approved",
                {
                    headers: createAuthHeaders()
                }
            );
            const approvedRes = await getQueue(approvedReq);
            const approvedBody = await approvedRes.json();
            expect(approvedBody.submissions).toHaveLength(1);
        });
    });

    describe("PATCH /api/admin/moderation/[id]", () => {
        it("rejects unauthenticated requests with HTTP 401 Unauthorized", async () => {
            const req = new Request("http://localhost:3000/api/admin/moderation/sub-123", {
                method: "PATCH",
                body: JSON.stringify({ action: "approve" })
            });

            const res = await updateSubmission(req, {
                params: Promise.resolve({ id: "sub-123" })
            });
            expect(res.status).toBe(401);
        });

        it("returns HTTP 404 when target submission does not exist", async () => {
            const req = new Request("http://localhost:3000/api/admin/moderation/sub-not-found", {
                method: "PATCH",
                headers: createAuthHeaders(),
                body: JSON.stringify({ action: "approve" })
            });

            const res = await updateSubmission(req, {
                params: Promise.resolve({ id: "sub-not-found" })
            });
            expect(res.status).toBe(404);
            const body = await res.json();
            expect(body.title).toBe("Not Found");
        });

        it("approves submission, updates status, and appends reviewer notes", async () => {
            const sub = saveToQuarantine({
                submissionType: "review",
                payload: { mandalSlug: "lalbaugcha-raja", comment: "Great darshan" }
            });

            const req = new Request(`http://localhost:3000/api/admin/moderation/${sub.id}`, {
                method: "PATCH",
                headers: createAuthHeaders("lead-moderator@bappamap.in"),
                body: JSON.stringify({
                    action: "approve",
                    reviewerNotes: "Verified authentic devotee review."
                })
            });

            const res = await updateSubmission(req, {
                params: Promise.resolve({ id: sub.id })
            });
            expect(res.status).toBe(200);

            const body = await res.json();
            expect(body.success).toBe(true);
            expect(body.submission.status).toBe("approved");
            expect(body.submission.reviewerNotes).toBe("Verified authentic devotee review.");
            expect(body.submission.reviewedBy).toBe("lead-moderator@bappamap.in");
            expect(body.submission.reviewedAt).toBeDefined();
        });

        it("rejects submission and archives it without publishing", async () => {
            const sub = saveToQuarantine({
                submissionType: "photo",
                payload: { caption: "Spam advertising" }
            });

            const req = new Request(`http://localhost:3000/api/admin/moderation/${sub.id}`, {
                method: "PATCH",
                headers: createAuthHeaders(),
                body: JSON.stringify({
                    action: "reject",
                    reviewerNotes: "Commercial advertising poster."
                })
            });

            const res = await updateSubmission(req, {
                params: Promise.resolve({ id: sub.id })
            });
            expect(res.status).toBe(200);

            const body = await res.json();
            expect(body.submission.status).toBe("rejected");
        });
    });
});
