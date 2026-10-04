export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

export interface QuarantineSubmission {
    id: string;
    submissionType: "new_mandal" | "review" | "photo";
    payload: Record<string, unknown>;
    status: ModerationStatus;
    createdAt: string;
    ipHash?: string;
    photoDataUrl?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewerNotes?: string;
}

const globalForQuarantine = globalThis as unknown as {
    __bappamapQuarantineStore?: QuarantineSubmission[];
};

const quarantineStore: QuarantineSubmission[] = globalForQuarantine.__bappamapQuarantineStore ?? [];

globalForQuarantine.__bappamapQuarantineStore = quarantineStore;

/**
 * Persists an incoming submission into the quarantine store with status 'pending'.
 */
export function saveToQuarantine(data: {
    submissionType: "new_mandal" | "review" | "photo";
    payload: Record<string, unknown>;
    ipHash?: string;
    photoDataUrl?: string;
}): QuarantineSubmission {
    const submission: QuarantineSubmission = {
        id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        submissionType: data.submissionType,
        payload: data.payload,
        status: "pending",
        createdAt: new Date().toISOString(),
        ipHash: data.ipHash,
        photoDataUrl: data.photoDataUrl
    };

    quarantineStore.push(submission);
    return submission;
}

/**
 * Returns quarantined submissions, optionally filtered by moderation status.
 */
export function getQuarantineSubmissions(status?: ModerationStatus): QuarantineSubmission[] {
    if (!status) {
        return [...quarantineStore];
    }
    return quarantineStore.filter((s) => s.status === status);
}

/**
 * Updates the moderation status and audit log of a quarantined submission.
 */
export function updateSubmissionStatus(
    id: string,
    action: "approve" | "reject" | "flag",
    reviewerNotes?: string,
    reviewerUser: string = "admin@bappamap.in"
): QuarantineSubmission | null {
    const submission = quarantineStore.find((s) => s.id === id);
    if (!submission) {
        return null;
    }

    const statusMap: Record<"approve" | "reject" | "flag", ModerationStatus> = {
        approve: "approved",
        reject: "rejected",
        flag: "flagged"
    };

    submission.status = statusMap[action];
    submission.reviewedAt = new Date().toISOString();
    submission.reviewedBy = reviewerUser;
    if (reviewerNotes !== undefined) {
        submission.reviewerNotes = reviewerNotes;
    }

    return submission;
}

/**
 * Returns count statistics for all moderation states in quarantine.
 */
export function getQuarantineStats(): {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    flagged: number;
} {
    return {
        total: quarantineStore.length,
        pending: quarantineStore.filter((s) => s.status === "pending").length,
        approved: quarantineStore.filter((s) => s.status === "approved").length,
        rejected: quarantineStore.filter((s) => s.status === "rejected").length,
        flagged: quarantineStore.filter((s) => s.status === "flagged").length
    };
}

/**
 * Retrieves all approved user reviews, optionally filtered by target mandal slug.
 */
export function getApprovedReviews(mandalSlug?: string): QuarantineSubmission[] {
    return quarantineStore.filter((s) => {
        if (s.status !== "approved" || s.submissionType !== "review") {
            return false;
        }
        if (mandalSlug && s.payload.mandalSlug !== mandalSlug) {
            return false;
        }
        return true;
    });
}

/**
 * Retrieves all approved new mandal proposals.
 */
export function getApprovedMandals(): QuarantineSubmission[] {
    return quarantineStore.filter(
        (s) => s.status === "approved" && s.submissionType === "new_mandal"
    );
}

/**
 * Clears the quarantine store (used for test isolation).
 */
export function clearQuarantine(): void {
    quarantineStore.length = 0;
}
