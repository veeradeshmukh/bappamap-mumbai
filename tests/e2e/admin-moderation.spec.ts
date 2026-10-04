import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Sprint 4: Admin Moderation Portal & Quarantine Lifecycle", () => {
    test.beforeEach(async ({ page, context }) => {
        // Enforce zero geolocation permission
        await context.clearPermissions();
        await page.addInitScript(() => {
            window.localStorage.clear();
        });
        // Provide unique client IP to prevent test runner rate-limit collisions
        const randomOctet = Math.floor(Math.random() * 200) + 10;
        const randomSubnet = Math.floor(Math.random() * 200) + 10;
        await context.setExtraHTTPHeaders({
            "x-forwarded-for": `192.168.${randomSubnet}.${randomOctet}`
        });
    });

    test("should redirect unauthenticated users from /admin to /admin/login", async ({ page }) => {
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/admin\/login/);

        const loginForm = page.locator('[data-testid="admin-login-form"]');
        await expect(loginForm).toBeVisible();
    });

    test("should reject invalid login credentials and display error alert", async ({ page }) => {
        await page.goto("/admin/login");

        await page.locator('[data-testid="input-admin-password"]').fill("wrong-passkey");
        await page.locator('[data-testid="admin-login-submit"]').click();

        const errorAlert = page.locator('[data-testid="login-error-alert"]');
        await expect(errorAlert).toBeVisible();
        await expect(errorAlert).toContainText("Invalid admin password");
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test("should sign in successfully and display the moderation dashboard", async ({ page }) => {
        await page.goto("/admin/login");

        await page.locator('[data-testid="input-admin-password"]').fill("bappa-admin-secret-2027");
        await page.locator('[data-testid="admin-login-submit"]').click();

        await expect(page).toHaveURL("/admin");
        await expect(page.locator("text=BappaMap Moderation")).toBeVisible();
        await expect(page.locator('[data-testid="admin-logout-btn"]')).toBeVisible();
    });

    test("should inspect pending submissions, submit reviewer notes, and approve an item", async ({
        page,
        request
    }) => {
        // 1. Submit a community review via public API
        const clientIp = `192.168.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 10}`;
        const submitRes = await request.post("/api/submissions", {
            headers: {
                "x-forwarded-for": clientIp
            },
            data: {
                submissionType: "review",
                mandalSlug: "lalbaugcha-raja",
                authorName: "Devotee Suresh",
                rating: 5,
                crowdObservation: "heavy",
                comment: "Beautiful darshan and disciplined management.",
                turnstileToken: "1x00000000000000000000AA"
            }
        });
        expect(submitRes.status()).toBe(202);
        const submitData = await submitRes.json();
        const submissionId = submitData.submissionId;

        // 2. Login to admin portal
        await page.goto("/admin/login");
        await page.locator('[data-testid="input-admin-password"]').fill("bappa-admin-secret-2027");
        await page.locator('[data-testid="admin-login-submit"]').click();
        await expect(page).toHaveURL("/admin");

        // 3. Locate the submission card in pending queue
        const submissionCard = page.locator(`[data-testid="submission-card-${submissionId}"]`);
        await expect(submissionCard).toBeVisible({ timeout: 10000 });
        await expect(submissionCard).toContainText("lalbaugcha-raja");
        await expect(submissionCard).toContainText("Devotee Suresh");

        // 4. Enter reviewer notes and click Approve
        await page
            .locator(`[data-testid="reviewer-notes-input-${submissionId}"]`)
            .fill("Verified appropriate community feedback.");
        await page.locator(`[data-testid="approve-btn-${submissionId}"]`).click();

        // 5. Verify the item moves from pending queue
        await expect(submissionCard).toBeHidden({ timeout: 10000 });

        // 6. Switch to Approved tab and verify it appears with Approved badge
        await page.locator('[data-testid="filter-tab-approved"]').click();
        const approvedCard = page.locator(`[data-testid="submission-card-${submissionId}"]`);
        await expect(approvedCard).toBeVisible({ timeout: 10000 });
        await expect(approvedCard).toContainText("Approved");
        await expect(approvedCard).toContainText("Verified appropriate community feedback.");
    });

    test("should reject a submission and reflect in rejected queue tab", async ({
        page,
        request
    }) => {
        // 1. Submit a proposal to quarantine
        const clientIp = `192.168.${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 200) + 10}`;
        const submitRes = await request.post("/api/submissions", {
            headers: {
                "x-forwarded-for": clientIp
            },
            data: {
                submissionType: "new_mandal",
                nameEn: "Spam Pandal Proposal",
                nameMr: "स्पॅम मंडळ",
                localityEn: "Girgaon",
                localityMr: "गिरगाव",
                bmcWard: "D",
                latitude: 18.9554,
                longitude: 72.8213,
                turnstileToken: "1x00000000000000000000AA"
            }
        });
        expect(submitRes.status()).toBe(202);
        const { submissionId } = await submitRes.json();

        // 2. Login to admin
        await page.goto("/admin/login");
        await page.locator('[data-testid="input-admin-password"]').fill("bappa-admin-secret-2027");
        await page.locator('[data-testid="admin-login-submit"]').click();
        await expect(page).toHaveURL("/admin");

        // 3. Reject submission
        const submissionCard = page.locator(`[data-testid="submission-card-${submissionId}"]`);
        await expect(submissionCard).toBeVisible({ timeout: 10000 });

        await page
            .locator(`[data-testid="reviewer-notes-input-${submissionId}"]`)
            .fill("Duplicate spam entry.");
        await page.locator(`[data-testid="reject-btn-${submissionId}"]`).click();
        await expect(submissionCard).toBeHidden({ timeout: 10000 });

        // 4. Verify in Rejected tab
        await page.locator('[data-testid="filter-tab-rejected"]').click();
        const rejectedCard = page.locator(`[data-testid="submission-card-${submissionId}"]`);
        await expect(rejectedCard).toBeVisible({ timeout: 10000 });
        await expect(rejectedCard).toContainText("Rejected");
    });

    test("should sign out and revoke admin session", async ({ page }) => {
        // Login
        await page.goto("/admin/login");
        await page.locator('[data-testid="input-admin-password"]').fill("bappa-admin-secret-2027");
        await page.locator('[data-testid="admin-login-submit"]').click();
        await expect(page).toHaveURL("/admin");

        // Sign Out
        await page.locator('[data-testid="admin-logout-btn"]').click();
        await expect(page).toHaveURL(/\/admin\/login/);

        // Attempt direct access
        await page.goto("/admin");
        await expect(page).toHaveURL(/\/admin\/login/);
    });

    test("should pass WCAG 2.2 AA accessibility scan on login and admin portal", async ({
        page
    }) => {
        // Scan login page
        await page.goto("/admin/login");
        const loginScan = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
        expect(loginScan.violations).toEqual([]);

        // Login to dashboard
        await page.locator('[data-testid="input-admin-password"]').fill("bappa-admin-secret-2027");
        await page.locator('[data-testid="admin-login-submit"]').click();
        await expect(page).toHaveURL("/admin");

        // Scan dashboard
        const dashboardScan = await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
        expect(dashboardScan.violations).toEqual([]);
    });
});
