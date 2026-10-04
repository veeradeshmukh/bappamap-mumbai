import { describe, it, expect, beforeEach } from "vitest";
import {
    saveToQuarantine,
    getQuarantineSubmissions,
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
});
