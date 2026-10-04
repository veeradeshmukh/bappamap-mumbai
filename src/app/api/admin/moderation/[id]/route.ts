import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSessionFromRequest } from "@/lib/auth/admin-auth";
import { updateSubmissionStatus } from "@/lib/submissions/quarantine-store";
import { createProblemDetails } from "@/lib/submissions/schemas";

const ModerationActionSchema = z.object({
    action: z.enum(["approve", "reject", "flag"]),
    reviewerNotes: z.string().max(500).optional()
});

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    const session = getAdminSessionFromRequest(req);
    if (!session.isAuthenticated) {
        const problem = createProblemDetails({
            status: 401,
            title: "Unauthorized",
            detail: "Admin authentication required.",
            instance: "/api/admin/moderation",
            type: "https://bappamap.in/errors/unauthorized"
        });
        return new NextResponse(JSON.stringify(problem), {
            status: 401,
            headers: { "Content-Type": "application/problem+json" }
        });
    }

    const { id } = await context.params;

    try {
        const body = await req.json();
        const parsed = ModerationActionSchema.safeParse(body);

        if (!parsed.success) {
            const problem = createProblemDetails({
                status: 400,
                title: "Invalid Request Parameters",
                detail: parsed.error.issues[0]?.message || "Invalid moderation action payload.",
                instance: `/api/admin/moderation/${id}`
            });
            return new NextResponse(JSON.stringify(problem), {
                status: 400,
                headers: { "Content-Type": "application/problem+json" }
            });
        }

        const updated = updateSubmissionStatus(
            id,
            parsed.data.action,
            parsed.data.reviewerNotes,
            session.email
        );

        if (!updated) {
            const problem = createProblemDetails({
                status: 404,
                title: "Not Found",
                detail: `Quarantined submission with ID '${id}' was not found.`,
                instance: `/api/admin/moderation/${id}`
            });
            return new NextResponse(JSON.stringify(problem), {
                status: 404,
                headers: { "Content-Type": "application/problem+json" }
            });
        }

        return NextResponse.json({
            success: true,
            submission: updated
        });
    } catch {
        const problem = createProblemDetails({
            status: 400,
            title: "Malformed Request",
            detail: "Unable to parse request body.",
            instance: `/api/admin/moderation/${id}`
        });
        return new NextResponse(JSON.stringify(problem), {
            status: 400,
            headers: { "Content-Type": "application/problem+json" }
        });
    }
}
