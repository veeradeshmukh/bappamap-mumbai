import { describe, it, expect } from "vitest";
import {
    MandalSuggestionSchema,
    ReviewSubmissionSchema,
    PhotoSubmissionSchema,
    createProblemDetails
} from "@/lib/submissions/schemas";

describe("Submission Schemas & RFC 7807 Generator", () => {
    describe("MandalSuggestionSchema", () => {
        it("validates a valid mandal suggestion in South Mumbai", () => {
            const validData = {
                submissionType: "new_mandal",
                nameEn: "New South Mumbai Mandal",
                nameMr: "नवीन दक्षिण मुंबई मंडळ",
                localityEn: "Girgaon",
                localityMr: "गिरगाव",
                bmcWard: "D",
                latitude: 18.955,
                longitude: 72.822,
                foundedYear: 1990,
                description: "A community mandal in Girgaon.",
                turnstileToken: "1x00000000000000000000AA"
            };

            const result = MandalSuggestionSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it("rejects coordinates outside South Mumbai bounding box", () => {
            const outOfBoundsData = {
                submissionType: "new_mandal",
                nameEn: "Andheri Mandal",
                nameMr: "अंधेरी मंडळ",
                localityEn: "Andheri West",
                localityMr: "अंधेरी पश्चिम",
                bmcWard: "K/West",
                latitude: 19.1136, // Outside South Mumbai (max 19.015)
                longitude: 72.8697,
                turnstileToken: "1x00000000000000000000AA"
            };

            const result = MandalSuggestionSchema.safeParse(outOfBoundsData);
            expect(result.success).toBe(false);
            if (!result.success) {
                const issues = result.error.issues;
                expect(issues.some((i) => i.path.includes("latitude"))).toBe(true);
            }
        });

        it("rejects missing or short names and tokens", () => {
            const invalidData = {
                submissionType: "new_mandal",
                nameEn: "A", // too short (< 3)
                nameMr: "",
                localityEn: "Fort",
                localityMr: "फोर्ट",
                latitude: 18.95,
                longitude: 72.82,
                turnstileToken: "short"
            };

            const result = MandalSuggestionSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe("ReviewSubmissionSchema", () => {
        it("validates a complete review submission", () => {
            const validReview = {
                submissionType: "review",
                mandalSlug: "lalbaugcha-raja",
                authorName: "Sunil P.",
                rating: 5,
                crowdObservation: "heavy",
                comment: "Darshan was serene, volunteer queues moving steadily.",
                turnstileToken: "1x00000000000000000000AA"
            };

            const result = ReviewSubmissionSchema.safeParse(validReview);
            expect(result.success).toBe(true);
        });

        it("defaults authorName to 'Devotee' when omitted", () => {
            const reviewWithoutAuthor = {
                submissionType: "review",
                mandalSlug: "lalbaugcha-raja",
                rating: 4,
                comment: "Clean arrangements and respectful atmosphere.",
                turnstileToken: "1x00000000000000000000AA"
            };

            const result = ReviewSubmissionSchema.safeParse(reviewWithoutAuthor);
            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.data.authorName).toBe("Devotee");
            }
        });

        it("rejects invalid rating values (< 1 or > 5 or non-integer)", () => {
            const invalidRating = {
                submissionType: "review",
                mandalSlug: "lalbaugcha-raja",
                rating: 6,
                comment: "Excellent darshan line management.",
                turnstileToken: "1x00000000000000000000AA"
            };

            const result = ReviewSubmissionSchema.safeParse(invalidRating);
            expect(result.success).toBe(false);
        });
    });

    describe("PhotoSubmissionSchema", () => {
        it("validates photo submission metadata", () => {
            const validPhotoMeta = {
                submissionType: "photo",
                mandalSlug: "lalbaugcha-raja",
                caption: "Festive facade decoration",
                contributorName: "Aarav S.",
                turnstileToken: "1x00000000000000000000AA"
            };

            const result = PhotoSubmissionSchema.safeParse(validPhotoMeta);
            expect(result.success).toBe(true);
        });
    });

    describe("createProblemDetails() RFC 7807 helper", () => {
        it("formats RFC 7807 Problem Details object correctly", () => {
            const problem = createProblemDetails({
                status: 400,
                title: "Invalid Request Parameters",
                detail: "Coordinates must fall within South Mumbai.",
                instance: "/api/submissions",
                invalidParams: [
                    {
                        name: "latitude",
                        reason: "Expected number <= 19.015, received 19.12"
                    }
                ]
            });

            expect(problem.status).toBe(400);
            expect(problem.title).toBe("Invalid Request Parameters");
            expect(problem.detail).toBe("Coordinates must fall within South Mumbai.");
            expect(problem.instance).toBe("/api/submissions");
            expect(problem.invalidParams).toHaveLength(1);
            expect(problem.type).toContain("https://bappamap.in/errors/");
        });
    });
});
