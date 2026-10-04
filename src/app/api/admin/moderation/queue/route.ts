import { NextResponse } from "next/server";
import { getAdminSessionFromRequest } from "@/lib/auth/admin-auth";
import {
    getQuarantineSubmissions,
    getQuarantineStats,
    ModerationStatus
} from "@/lib/submissions/quarantine-store";
import { createProblemDetails } from "@/lib/submissions/schemas";

export async function GET(req: Request) {
    const session = getAdminSessionFromRequest(req);
    if (!session.isAuthenticated) {
        const problem = createProblemDetails({
            status: 401,
            title: "Unauthorized",
            detail: "Valid admin session is required to access the moderation queue.",
            instance: "/api/admin/moderation/queue",
            type: "https://bappamap.in/errors/unauthorized"
        });
        return new NextResponse(JSON.stringify(problem), {
            status: 401,
            headers: { "Content-Type": "application/problem+json" }
        });
    }

    const { searchParams } = new URL(req.url);
    const statusParam = searchParams.get("status");

    let statusFilter: ModerationStatus | undefined;
    if (
        statusParam === "pending" ||
        statusParam === "approved" ||
        statusParam === "rejected" ||
        statusParam === "flagged"
    ) {
        statusFilter = statusParam;
    }

    const submissions = getQuarantineSubmissions(statusFilter);
    const stats = getQuarantineStats();

    return NextResponse.json({
        submissions,
        stats
    });
}
