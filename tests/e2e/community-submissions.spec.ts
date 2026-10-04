import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Sprint 3: Community Contribution Flows & Privacy Pre-Flight", () => {
    test.beforeEach(async ({ page, context }) => {
        // Enforce zero geolocation permission
        await context.clearPermissions();
        // Prevent cross-test state leakage
        await page.addInitScript(() => {
            window.localStorage.clear();
        });
        // Provide unique client IP per test to avoid rate-limit collisions across parallel browser workers
        const randomOctet = Math.floor(Math.random() * 200) + 10;
        const randomSubnet = Math.floor(Math.random() * 200) + 10;
        await context.setExtraHTTPHeaders({
            "x-forwarded-for": `192.168.${randomSubnet}.${randomOctet}`
        });
    });

    test("should open modal when clicking + Add / Review Mandal and close via ESC key", async ({
        page
    }) => {
        await page.goto("/");

        const addReviewBtn = page.locator('[data-testid="add-review-modal-btn"]');
        await expect(addReviewBtn).toBeVisible();
        await addReviewBtn.click();

        const dialog = page.locator('[data-testid="contribution-modal-dialog"]');
        await expect(dialog).toBeVisible();

        // Check tabs exist
        await expect(page.locator('[data-testid="tab-suggest"]')).toBeVisible();
        await expect(page.locator('[data-testid="tab-review"]')).toBeVisible();
        await expect(page.locator('[data-testid="tab-photo"]')).toBeVisible();

        // Close via Escape key
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
    });

    test("should close modal when clicking the close button", async ({ page }) => {
        await page.goto("/");

        await page.locator('[data-testid="add-review-modal-btn"]').click();
        const dialog = page.locator('[data-testid="contribution-modal-dialog"]');
        await expect(dialog).toBeVisible();

        const closeBtn = page.locator('[data-testid="modal-close-btn"]');
        await closeBtn.click();
        await expect(dialog).toBeHidden();
    });

    test("should reject out-of-bounds coordinates when suggesting a mandal", async ({ page }) => {
        await page.goto("/");

        await page.locator('[data-testid="add-review-modal-btn"]').click();
        await page.locator('[data-testid="tab-suggest"]').click();

        // Fill form with coordinates in suburbs (outside South Mumbai bounds)
        await page.locator('[data-testid="input-name-en"]').fill("Andheri Mandal");
        await page.locator('[data-testid="input-name-mr"]').fill("अंधेरी मंडळ");
        await page.locator('[data-testid="input-locality-en"]').fill("Andheri West");
        await page.locator('[data-testid="input-locality-mr"]').fill("अंधेरी पश्चिम");
        await page.locator('[data-testid="input-latitude"]').fill("19.1136"); // Outside 19.015 max
        await page.locator('[data-testid="input-longitude"]').fill("72.8697");

        await page.locator('[data-testid="submit-mandal-btn"]').click();

        // Validation error should appear
        const errorAlert = page.locator('[data-testid="mandal-form-error"]');
        await expect(errorAlert).toBeVisible();
        await expect(errorAlert).toContainText("South Mumbai");
    });

    test("should submit valid new mandal and show volunteer moderation receipt", async ({
        page
    }) => {
        await page.goto("/");

        await page.locator('[data-testid="add-review-modal-btn"]').click();
        await page.locator('[data-testid="tab-suggest"]').click();

        // Fill valid South Mumbai mandal
        await page.locator('[data-testid="input-name-en"]').fill("Mazgaoncha Raja");
        await page.locator('[data-testid="input-name-mr"]').fill("माझगावचा राजा");
        await page.locator('[data-testid="input-locality-en"]').fill("Mazgaon");
        await page.locator('[data-testid="input-locality-mr"]').fill("माझगाव");
        await page.locator('[data-testid="select-bmc-ward"]').selectOption("E");
        await page.locator('[data-testid="input-latitude"]').fill("18.9680");
        await page.locator('[data-testid="input-longitude"]').fill("72.8420");
        await page.locator('[data-testid="input-founded-year"]').fill("1965");
        await page.locator('[data-testid="input-description"]').fill("Historic pandal in Mazgaon");

        // Submit
        await page.locator('[data-testid="submit-mandal-btn"]').click();

        // Confirmation receipt should appear
        const receipt = page.locator('[data-testid="submission-success-receipt"]');
        await expect(receipt).toBeVisible({ timeout: 5000 });

        const submissionId = page.locator('[data-testid="receipt-submission-id"]');
        await expect(submissionId).toBeVisible();
        const idText = await submissionId.innerText();
        expect(idText).toMatch(/^sub-/);

        // Click Back to Map
        await page.locator('[data-testid="receipt-close-btn"]').click();
        await expect(receipt).toBeHidden();
    });

    test("should submit review and crowd report with star rating", async ({ page }) => {
        await page.goto("/");

        await page.locator('[data-testid="add-review-modal-btn"]').click();

        // Switch to Review & Crowd tab
        const reviewTab = page.locator('[data-testid="tab-review"]');
        await reviewTab.click();
        await expect(reviewTab).toHaveAttribute("aria-selected", "true");

        // Select mandal
        await page.locator('[data-testid="select-review-mandal"]').selectOption("lalbaugcha-raja");

        // Enter author name
        await page.locator('[data-testid="input-review-author"]').fill("Devotee Rohan");

        // Select 4-star rating
        await page.locator('[data-testid="rating-star-4"]').click();

        // Select crowd observation chip (heavy)
        const heavyChip = page.locator('[data-testid="crowd-chip-heavy"]');
        await heavyChip.click();
        await expect(heavyChip).toHaveAttribute("aria-pressed", "true");

        // Enter review comment
        await page
            .locator('[data-testid="textarea-review-comment"]')
            .fill("Mukh darshan line moved smoothly within 45 minutes. Highly disciplined.");

        // Submit review
        await page.locator('[data-testid="submit-review-btn"]').click();

        // Verify receipt
        const receipt = page.locator('[data-testid="submission-success-receipt"]');
        await expect(receipt).toBeVisible({ timeout: 5000 });
        await expect(page.locator('[data-testid="receipt-submission-id"]')).toBeVisible();

        await page.locator('[data-testid="receipt-close-btn"]').click();
        await expect(receipt).toBeHidden();
    });

    test("should strip EXIF and upload photo with preview thumbnail", async ({ page }) => {
        await page.goto("/");

        await page.locator('[data-testid="add-review-modal-btn"]').click();

        // Switch to Upload Photo tab
        const photoTab = page.locator('[data-testid="tab-photo"]');
        await photoTab.click();

        // Select target mandal
        await page.locator('[data-testid="select-photo-mandal"]').selectOption("girgaoncha-raja");

        // Set file on input
        const fileInput = page.locator('[data-testid="input-photo-file"]');
        await fileInput.setInputFiles({
            name: "darshan-pandal.png",
            mimeType: "image/png",
            buffer: Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                "base64"
            )
        });

        // Wait for canvas processing to complete and show preview
        const preview = page.locator('[data-testid="photo-preview-thumbnail"]');
        await expect(preview).toBeVisible({ timeout: 5000 });

        const strippedBadge = page.locator('[data-testid="photo-exif-stripped-badge"]');
        await expect(strippedBadge).toBeVisible();
        await expect(strippedBadge).toContainText("EXIF & GPS metadata stripped");

        // Fill caption & contributor
        await page.locator('[data-testid="input-photo-contributor"]').fill("Devotee Ananya");
        await page.locator('[data-testid="input-photo-caption"]').fill("Evening Aarti Darshan");

        // Submit photo
        await page.locator('[data-testid="submit-photo-btn"]').click();

        // Verify receipt
        const receipt = page.locator('[data-testid="submission-success-receipt"]');
        await expect(receipt).toBeVisible({ timeout: 5000 });
    });

    test("should pass WCAG 2.2 AA accessibility scan on contribution modal", async ({ page }) => {
        await page.goto("/");
        await page.locator('[data-testid="add-review-modal-btn"]').click();

        const dialog = page.locator('[data-testid="contribution-modal-dialog"]');
        await expect(dialog).toBeVisible();

        // Run axe scan on modal dialog
        const accessibilityScanResults = await new AxeBuilder({ page })
            .include('[data-testid="contribution-modal-dialog"]')
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
