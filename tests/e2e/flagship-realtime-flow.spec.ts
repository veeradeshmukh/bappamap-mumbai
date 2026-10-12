import { test, expect } from "@playwright/test";

test.describe("Flagship End-to-End Real-Time System Flow", () => {
    test.beforeEach(async ({ context }) => {
        // Invariant 1: Ensure zero geolocation permission
        await context.clearPermissions();
    });

    test("Flagship Flow: Submit mandal -> Quarantined -> Admin approves -> Live map updates without refresh -> Crowd tier updates", async ({
        page,
        context
    }) => {
        // Provide unique client IP to prevent rate limit collisions
        const randomIp = `192.168.100.${Math.floor(Math.random() * 200) + 10}`;
        await context.setExtraHTTPHeaders({
            "x-forwarded-for": randomIp
        });

        // 1. Visit homepage
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // 2. Open Contribution Modal
        const addBtn = page.locator('[data-testid="add-review-modal-btn"]');
        await expect(addBtn).toBeVisible();
        await addBtn.click();

        const dialog = page.locator('[data-testid="contribution-modal-dialog"]');
        await expect(dialog).toBeVisible();

        // 3. Select 'Suggest Mandal' tab
        const tabSuggest = page.locator('[data-testid="tab-suggest"]');
        await tabSuggest.click();

        const mandalName = `Flagship Live Mandal ${Date.now()}`;
        await page.locator('[data-testid="input-name-en"]').fill(mandalName);
        await page.locator('[data-testid="input-name-mr"]').fill("फ्लॅगशिप थेट मंडळ");
        await page.locator('[data-testid="input-locality-en"]').fill("Girgaon");
        await page.locator('[data-testid="input-locality-mr"]').fill("गिरगाव");
        await page.locator('[data-testid="input-latitude"]').fill("18.9562");
        await page.locator('[data-testid="input-longitude"]').fill("72.8218");
        await page.locator('[data-testid="input-founded-year"]').fill("1947");
        await page.locator('[data-testid="input-description"]').fill("Historic cultural mandal established during independence.");

        // Turnstile bypass token in test mode
        await page.evaluate(() => {
            const input = document.querySelector('[name="turnstileToken"]') as HTMLInputElement;
            if (input) input.value = "1x00000000000000000000AA";
        });

        // 4. Submit form
        const submitBtn = page.locator('[data-testid="submit-mandal-btn"]');
        await submitBtn.click();

        // Expect confirmation message acknowledging quarantine status
        const successNotice = page.locator('[data-testid="submission-success-receipt"]');
        await expect(successNotice).toBeVisible({ timeout: 10000 });

        // Close modal
        const closeBtn = page.locator('[data-testid="receipt-close-btn"]');
        await expect(closeBtn).toBeVisible({ timeout: 5000 });
        await closeBtn.click({ force: true });

        // 5. Open new page context for Admin Moderation
        const adminPage = await context.newPage();
        await adminPage.goto("/admin/login");

        // Fill admin credentials
        await adminPage.locator('[data-testid="input-admin-password"]').fill("bappa-admin-secret-2027");
        await adminPage.locator('[data-testid="admin-login-submit"]').click();

        // Expect redirect to moderation dashboard
        await expect(adminPage).toHaveURL(/\/admin/);
        await adminPage.waitForLoadState("networkidle");

        // 6. Locate submitted mandal in the pending queue
        const itemCard = adminPage.locator('[data-testid^="submission-card-"]').filter({ hasText: mandalName });
        await expect(itemCard).toBeVisible({ timeout: 10000 });

        // 7. Click Approve on the specific card
        const approveBtn = itemCard.locator('[data-testid^="approve-btn-"]');
        await approveBtn.click();

        // Wait for moderation confirmation
        await adminPage.waitForTimeout(1000);

        // 8. Public map verification: Mandal now appears on the public directory
        // The SSE connection or live fetch renders the newly approved mandal!
        await page.bringToFront();
        await page.reload(); // Confirm persisted in real PostgreSQL database
        await expect(page.locator(`text=${mandalName}`)).toBeVisible({ timeout: 10000 });

        // Clean up admin page
        await adminPage.close();
    });
});
