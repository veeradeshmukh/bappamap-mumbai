import crypto from "crypto";

const DEFAULT_ADMIN_EMAIL = "admin@bappamap.in";
const DEFAULT_DEV_PASSWORD = "bappa-admin-secret-2027";
const DEFAULT_SESSION_SECRET = "bappa-session-secret-salt-2027";

export const ADMIN_COOKIE_NAME = "bappa_admin_session";
export const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60; // 24 hours

interface SessionPayload {
    email: string;
    exp: number;
}

function getSessionSecret(): string {
    return process.env.ADMIN_SESSION_SECRET || DEFAULT_SESSION_SECRET;
}

/**
 * Validates admin credentials against configured environment secret.
 */
export function verifyAdminCredentials(password: string): boolean {
    const expectedPassword = process.env.ADMIN_PASSWORD || DEFAULT_DEV_PASSWORD;
    if (!password || typeof password !== "string") {
        return false;
    }
    // Constant-time comparison to prevent timing attacks
    const passwordBuffer = Buffer.from(password);
    const expectedBuffer = Buffer.from(expectedPassword);
    if (passwordBuffer.length !== expectedBuffer.length) {
        return false;
    }
    return crypto.timingSafeEqual(passwordBuffer, expectedBuffer);
}

/**
 * Creates a cryptographically signed session token for an authenticated admin.
 */
export function generateAdminSessionToken(email: string = DEFAULT_ADMIN_EMAIL): string {
    const payload: SessionPayload = {
        email,
        exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
        .createHmac("sha256", getSessionSecret())
        .update(payloadB64)
        .digest("base64url");

    return `${payloadB64}.${signature}`;
}

/**
 * Validates token signature and expiration timestamp.
 */
export function verifyAdminSessionToken(token: string): {
    valid: boolean;
    email?: string;
} {
    if (!token || typeof token !== "string" || !token.includes(".")) {
        return { valid: false };
    }

    const [payloadB64, signature] = token.split(".");
    if (!payloadB64 || !signature) {
        return { valid: false };
    }

    const expectedSignature = crypto
        .createHmac("sha256", getSessionSecret())
        .update(payloadB64)
        .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expectedBuffer.length) {
        return { valid: false };
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return { valid: false };
    }

    try {
        const payload: SessionPayload = JSON.parse(
            Buffer.from(payloadB64, "base64url").toString("utf-8")
        );

        if (Date.now() > payload.exp) {
            return { valid: false };
        }

        return { valid: true, email: payload.email };
    } catch {
        return { valid: false };
    }
}

/**
 * Extracts session token from incoming request (Cookie or Bearer authorization).
 */
export function getAdminSessionFromRequest(req: Request): {
    isAuthenticated: boolean;
    email?: string;
} {
    // 1. Check Authorization Bearer header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7).trim();
        const verification = verifyAdminSessionToken(token);
        if (verification.valid) {
            return { isAuthenticated: true, email: verification.email };
        }
    }

    // 2. Check Cookie header
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").reduce<Record<string, string>>((acc, pair) => {
        const [k, v] = pair.trim().split("=");
        if (k && v) {
            acc[k] = decodeURIComponent(v);
        }
        return acc;
    }, {});

    const sessionCookie = cookies[ADMIN_COOKIE_NAME];
    if (sessionCookie) {
        const verification = verifyAdminSessionToken(sessionCookie);
        if (verification.valid) {
            return { isAuthenticated: true, email: verification.email };
        }
    }

    return { isAuthenticated: false };
}
