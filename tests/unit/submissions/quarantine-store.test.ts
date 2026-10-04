import { describe, it, expect, beforeEach } from "vitest";
import {
    saveToQuarantine,
    getQuarantineSubmissions,
    updateSubmissionStatus,
    getQuarantineStats,
    getApprovedReviews,
    getApprovedMandals,
    clearQuarantine
} from "@/lib/submissions/quarantine-store";

describe("Quarantine Store", () => {
    beforeEach(() => {
        clearQuarantine();
    });

    it("saves a submission with moderation_status = 'pending'", () => {
        const record = saveToQuarantine({
            submissionType: "review",
            payload: {
                mandalSlug: "lalbaugcha-raja",
                rating: 5,
                comment: "Great arrangements."
            },
            ipHash: "abcdef123456"
        });

        expect(record.id).toBeDefined();
        expect(record.status).toBe("pending");
        expect(record.createdAt).toBeDefined();
        expect(record.submissionType).toBe("review");

        const all = getQuarantineSubmissions();
        expect(all).toHaveLength(1);
        expect(all[0].id).toBe(record.id);
    });

    it("retrieves submissions filtered by status", () => {
        saveToQuarantine({
            submissionType: "new_mandal",
            payload: { nameEn: "Test Mandal" },
            ipHash: "hash1"
        });

        const pending = getQuarantineSubmissions("pending");
        expect(pending).toHaveLength(1);

        const approved = getQuarantineSubmissions("approved");
        expect(approved).toHaveLength(0);
    });

    it("updates submission status, records reviewer notes, and tracks audit metadata", () => {
        const record = saveToQuarantine({
            submissionType: "review",
            payload: {
                mandalSlug: "girgaoncha-raja",
                comment: "Darshan experience"
            }
        });

        const updated = updateSubmissionStatus(
            record.id,
            "approve",
            "Verified appropriate review",
            "moderator@bappamap.in"
        );

        expect(updated).not.toBeNull();
        expect(updated?.status).toBe("approved");
        expect(updated?.reviewerNotes).toBe("Verified appropriate review");
        expect(updated?.reviewedBy).toBe("moderator@bappamap.in");
        expect(updated?.reviewedAt).toBeDefined();

        const approvedReviews = getApprovedReviews("girgaoncha-raja");
        expect(approvedReviews).toHaveLength(1);
        expect(approvedReviews[0].id).toBe(record.id);
    });

    it("calculates quarantine counts and statistics accurately across statuses", () => {
        const sub1 = saveToQuarantine({
            submissionType: "new_mandal",
            payload: { nameEn: "M1" }
        });
        const sub2 = saveToQuarantine({
            submissionType: "review",
            payload: { comment: "R1" }
        });
        saveToQuarantine({
            submissionType: "photo",
            payload: { caption: "P1" }
        });

        updateSubmissionStatus(sub1.id, "approve");
        updateSubmissionStatus(sub2.id, "reject", "Spam content");

        const stats = getQuarantineStats();
        expect(stats.total).toBe(3);
        expect(stats.pending).toBe(1);
        expect(stats.approved).toBe(1);
        expect(stats.rejected).toBe(1);
        expect(stats.flagged).toBe(0);

        const approvedMandals = getApprovedMandals();
        expect(approvedMandals).toHaveLength(1);
        expect(approvedMandals[0].id).toBe(sub1.id);
    });

    it("returns null when attempting to update a non-existent submission", () => {
        const result = updateSubmissionStatus("non-existent-id", "approve");
        expect(result).toBeNull();
    });
});
