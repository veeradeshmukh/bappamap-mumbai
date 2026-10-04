import { NextResponse } from "next/server";
import {
    verifyAdminCredentials,
    generateAdminSessionToken,
    ADMIN_COOKIE_NAME,
    SESSION_MAX_AGE_SECONDS
} from "@/lib/auth/admin-auth";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { password, email = "admin@bappamap.in" } = body || {};

        if (!password || !verifyAdminCredentials(password)) {
            return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
        }

        const token = generateAdminSessionToken(email);

        const response = NextResponse.json({
            success: true,
            email
        });

        // Set secure HttpOnly session cookie
        response.cookies.set({
            name: ADMIN_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: SESSION_MAX_AGE_SECONDS
        });

        return response;
    } catch {
        return NextResponse.json({ error: "Unable to process login request." }, { status: 400 });
    }
}
