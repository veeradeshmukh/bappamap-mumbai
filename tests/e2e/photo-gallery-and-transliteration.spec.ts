import { test, expect } from "@playwright/test";

test.describe("Auto-Marathi Transliteration & Community Photo Gallery", () => {
    test.beforeEach(async ({ page, context }) => {
        await context.clearPermissions();
        await page.addInitScript(() => {
            window.localStorage.clear();
        });
    });

    test("should automatically transliterate English name and locality into Marathi in Suggest Mandal form", async ({
        page
    }) => {
        await page.goto("/");

        // Open modal
        const addBtn = page.locator('[data-testid="add-review-modal-btn"]');
        await addBtn.click();

        const modal = page.locator('[data-testid="contribution-modal-dialog"]');
        await expect(modal).toBeVisible();

        // Switch to suggest tab
        const suggestTab = page.locator('[data-testid="tab-suggest"]');
        await suggestTab.click();

        // Type English Mandal Name
        const nameEn = page.locator('[data-testid="input-name-en"]');
        const nameMr = page.locator('[data-testid="input-name-mr"]');

        await nameEn.fill("Girgaoncha Raja");

        // Should automatically populate Marathi name with specialized transliteration
        await expect(nameMr).toHaveValue("गिरगावचा राजा", { timeout: 4000 });
        await expect(page.locator("text=✨ Auto-translated").first()).toBeVisible();

        // Type English Locality
        const localityEn = page.locator('[data-testid="input-locality-en"]');
        const localityMr = page.locator('[data-testid="input-locality-mr"]');

        await localityEn.fill("Girgaon");

        // Should automatically populate Marathi locality
        await expect(localityMr).toHaveValue("गिरगाव", { timeout: 4000 });

        // User manual override should be preserved
        await nameMr.fill("माझा लाडका बाप्पा");
        await nameEn.fill("Girgaoncha Raja Unique");

        // Manual override remains untouched
        await expect(nameMr).toHaveValue("माझा लाडका बाप्पा");
    });

    test("should display photo gallery when clicking photo trigger on cards with approved photos", async ({
        page
    }) => {
        await page.goto("/");

        // Check if there is any card with a gallery button or banner
        const galleryBtn = page.locator('[data-testid^="card-gallery-banner-"], [data-testid^="card-gallery-badge-"]').first();
        const hasPhotos = await galleryBtn.isVisible().catch(() => false);

        if (hasPhotos) {
            await galleryBtn.click();

            const galleryModal = page.locator('[data-testid="mandal-gallery-modal"]');
            await expect(galleryModal).toBeVisible();

            const activeImg = page.locator('[data-testid="gallery-active-image"]');
            await expect(activeImg).toBeVisible();

            // Close via close button
            const closeBtn = page.locator('[data-testid="gallery-close-btn"]');
            await closeBtn.click();
            await expect(galleryModal).toBeHidden();
        }
    });
});
