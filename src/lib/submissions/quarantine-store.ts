export type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

export interface QuarantineSubmission {
    id: string;
    submissionType: "new_mandal" | "review" | "photo";
    payload: Record<string, unknown>;
    status: ModerationStatus;
    createdAt: string;
    ipHash?: string;
    photoDataUrl?: string;
}

const quarantineStore: QuarantineSubmission[] = [];

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
 * Clears the quarantine store (used for test isolation).
 */
export function clearQuarantine(): void {
    quarantineStore.length = 0;
}
