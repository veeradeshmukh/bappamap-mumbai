import { NextResponse } from "next/server";
import {
    MandalSuggestionSchema,
    ReviewSubmissionSchema,
    PhotoSubmissionSchema,
    createProblemDetails
} from "@/lib/submissions/schemas";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { hashClientIp, checkRateLimit } from "@/lib/security/rate-limit";
import { saveToQuarantine } from "@/lib/submissions/quarantine-store";

function problemJsonResponse(problem: ReturnType<typeof createProblemDetails>, status: number) {
    return new NextResponse(JSON.stringify(problem), {
        status,
        headers: {
            "Content-Type": "application/problem+json"
        }
    });
}

export async function POST(req: Request) {
    // 1. Extract and hash client IP
    const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";

    const ipHash = hashClientIp(clientIp);

    // 2. Enforce Rate Limiting (5 requests per 10-minute window)
    const rateCheck = checkRateLimit(ipHash, 5, 10 * 60 * 1000);
    if (!rateCheck.isAllowed) {
        const problem = createProblemDetails({
            status: 429,
            title: "Too Many Requests",
            detail: "Rate limit exceeded. Please wait 10 minutes before submitting another report.",
            instance: "/api/submissions",
            type: "https://bappamap.in/errors/rate-limit-exceeded"
        });
        return problemJsonResponse(problem, 429);
    }

    // 3. Parse Request Payload
    let body: Record<string, unknown> = {};
    let photoDataUrl: string | undefined;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
        try {
            const formData = await req.formData();
            formData.forEach((val, key) => {
                if (key === "photo") {
                    // Blob or File
                    photoDataUrl = "file_blob_quarantine";
                } else if (typeof val === "string") {
                    try {
                        body[key] = JSON.parse(val);
                    } catch {
                        body[key] = val;
                    }
                }
            });
        } catch {
            const problem = createProblemDetails({
                status: 400,
                title: "Invalid Form Data",
                detail: "Unable to parse multipart form payload.",
                instance: "/api/submissions"
            });
            return problemJsonResponse(problem, 400);
        }
    } else {
        try {
            body = (await req.json()) as Record<string, unknown>;
        } catch {
            const problem = createProblemDetails({
                status: 400,
                title: "Invalid JSON",
                detail: "Unable to parse JSON payload.",
                instance: "/api/submissions"
            });
            return problemJsonResponse(problem, 400);
        }
    }

    // 4. Honeypot Bot Detection
    // If the invisible honeypot field is filled out, silently accept without persisting
    if (body.bappa_hp_website) {
        return NextResponse.json(
            {
                status: "success",
                message: "Submission received and queued for community moderation.",
                submissionId: "sub-quarantined-bot"
            },
            { status: 202 }
        );
    }

    // 5. Cloudflare Turnstile Bot Challenge Verification
    const turnstileToken = String(body.turnstileToken || "");
    const turnstileResult = await verifyTurnstileToken(turnstileToken, clientIp);

    if (!turnstileResult.success) {
        const problem = createProblemDetails({
            status: 403,
            title: "Bot Verification Failed",
            detail: turnstileResult.error || "Turnstile challenge validation failed.",
            instance: "/api/submissions",
            type: "https://bappamap.in/errors/turnstile-verification-failed"
        });
        return problemJsonResponse(problem, 403);
    }

    // 6. Schema Validation based on submissionType
    const submissionType = body.submissionType;

    if (submissionType === "new_mandal") {
        const parsed = MandalSuggestionSchema.safeParse(body);
        if (!parsed.success) {
            const invalidParams = parsed.error.issues.map((i) => ({
                name: i.path.join("."),
                reason: i.message
            }));
            const problem = createProblemDetails({
                status: 400,
                title: "Invalid Request Parameters",
                detail: "Mandal suggestion contains invalid or out-of-bounds parameters.",
                instance: "/api/submissions",
                invalidParams
            });
            return problemJsonResponse(problem, 400);
        }

        const record = saveToQuarantine({
            submissionType: "new_mandal",
            payload: parsed.data as Record<string, unknown>,
            ipHash
        });

        return NextResponse.json(
            {
                status: "success",
                message: "Submission received and queued for community moderation.",
                submissionId: record.id
            },
            { status: 202 }
        );
    } else if (submissionType === "review") {
        const parsed = ReviewSubmissionSchema.safeParse(body);
        if (!parsed.success) {
            const invalidParams = parsed.error.issues.map((i) => ({
                name: i.path.join("."),
                reason: i.message
            }));
            const problem = createProblemDetails({
                status: 400,
                title: "Invalid Request Parameters",
                detail: "Review contains invalid parameters.",
                instance: "/api/submissions",
                invalidParams
            });
            return problemJsonResponse(problem, 400);
        }

        const record = saveToQuarantine({
            submissionType: "review",
            payload: parsed.data as Record<string, unknown>,
            ipHash
        });

        return NextResponse.json(
            {
                status: "success",
                message: "Submission received and queued for community moderation.",
                submissionId: record.id
            },
            { status: 202 }
        );
    } else if (submissionType === "photo") {
        const parsed = PhotoSubmissionSchema.safeParse(body);
        if (!parsed.success) {
            const invalidParams = parsed.error.issues.map((i) => ({
                name: i.path.join("."),
                reason: i.message
            }));
            const problem = createProblemDetails({
                status: 400,
                title: "Invalid Request Parameters",
                detail: "Photo submission contains invalid parameters.",
                instance: "/api/submissions",
                invalidParams
            });
            return problemJsonResponse(problem, 400);
        }

        const record = saveToQuarantine({
            submissionType: "photo",
            payload: parsed.data as Record<string, unknown>,
            ipHash,
            photoDataUrl: (body.photoDataUrl as string) || photoDataUrl
        });

        return NextResponse.json(
            {
                status: "success",
                message: "Submission received and queued for community moderation.",
                submissionId: record.id
            },
            { status: 202 }
        );
    }

    const problem = createProblemDetails({
        status: 400,
        title: "Unknown Submission Type",
        detail: `Expected submissionType to be one of ['new_mandal', 'review', 'photo'], received '${submissionType}'.`,
        instance: "/api/submissions"
    });
    return problemJsonResponse(problem, 400);
}
