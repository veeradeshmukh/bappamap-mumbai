import { z } from "zod";
import { SOUTH_MUMBAI_BOUNDS } from "@/lib/geo/bounds";

const MIN_LNG = SOUTH_MUMBAI_BOUNDS[0][0]; // 72.78
const MIN_LAT = SOUTH_MUMBAI_BOUNDS[0][1]; // 18.89
const MAX_LNG = SOUTH_MUMBAI_BOUNDS[1][0]; // 72.87
const MAX_LAT = SOUTH_MUMBAI_BOUNDS[1][1]; // 19.015

export const MandalSuggestionSchema = z.object({
    submissionType: z.literal("new_mandal"),
    nameEn: z.string().min(3, "English name must be at least 3 characters").max(100),
    nameMr: z.string().min(3, "Marathi name must be at least 3 characters").max(100),
    localityEn: z.string().min(2, "Locality must be at least 2 characters").max(50),
    localityMr: z.string().min(2, "Locality must be at least 2 characters").max(50),
    bmcWard: z.string().min(1, "BMC Ward is required").max(10).default("D"),
    latitude: z
        .number({ invalid_type_error: "Latitude must be a valid number" })
        .min(MIN_LAT, `Latitude must be >= ${MIN_LAT} (South Mumbai bound)`)
        .max(MAX_LAT, `Latitude must be <= ${MAX_LAT} (South Mumbai bound)`),
    longitude: z
        .number({ invalid_type_error: "Longitude must be a valid number" })
        .min(MIN_LNG, `Longitude must be >= ${MIN_LNG} (South Mumbai bound)`)
        .max(MAX_LNG, `Longitude must be <= ${MAX_LNG} (South Mumbai bound)`),
    foundedYear: z.number().int().min(1800).max(2027).optional(),
    description: z.string().max(1000).optional(),
    turnstileToken: z.string().min(10, "Security verification token is required")
});

export const ReviewSubmissionSchema = z.object({
    submissionType: z.literal("review"),
    mandalSlug: z.string().min(1, "Target mandal is required"),
    authorName: z.string().min(2).max(50).default("Devotee"),
    rating: z.number().int().min(1).max(5),
    crowdObservation: z.enum(["low", "moderate", "heavy", "very_heavy"]).optional(),
    comment: z.string().min(5, "Comment must be at least 5 characters").max(1000),
    turnstileToken: z.string().min(10, "Security verification token is required")
});

export const PhotoSubmissionSchema = z.object({
    submissionType: z.literal("photo"),
    mandalSlug: z.string().min(1, "Target mandal is required"),
    contributorName: z.string().min(2).max(50).default("Devotee"),
    caption: z.string().max(200).optional(),
    turnstileToken: z.string().min(10, "Security verification token is required")
});

export interface ProblemDetailsInvalidParam {
    name: string;
    reason: string;
}

export interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance: string;
    invalidParams?: ProblemDetailsInvalidParam[];
}

export function createProblemDetails(params: {
    status: number;
    title: string;
    detail: string;
    instance: string;
    type?: string;
    invalidParams?: ProblemDetailsInvalidParam[];
}): ProblemDetails {
    return {
        type: params.type || `https://bappamap.in/errors/${params.status}`,
        title: params.title,
        status: params.status,
        detail: params.detail,
        instance: params.instance,
        invalidParams: params.invalidParams
    };
}
