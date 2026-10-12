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

export interface SubmissionResponse {
    submissionId: string;
    message: string;
    status: string;
}
