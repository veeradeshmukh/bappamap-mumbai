import { test, expect } from "@playwright/test";

test.describe("Sprint 1 Walking Skeleton: South Mumbai Map & Pins", () => {
    test.beforeEach(async ({ context }) => {
        // Explicitly block any geolocation permission
        await context.clearPermissions();
    });

    test("should load the map page without requesting user geolocation", async ({ page }) => {
        page.on("dialog", () => {
            throw new Error("Unexpected browser dialog appeared!");
        });

        await page.goto("/");

        // Header and branding
        await expect(page.locator("h1")).toContainText("BappaMap");
        await expect(page.getByText("SoBo Edition")).toBeVisible();

        // Zero Geolocation policy assurance is present
        await expect(page.getByText("Zero Geolocation Policy")).toBeVisible();

        // Map container is rendered
        const mapContainer = page.locator('[data-testid="maplibre-container"]');
        await expect(mapContainer).toBeVisible();
    });

    test("should render verified mandal pins and open popup with universal Google Maps link on click", async ({
        page
    }) => {
        await page.goto("/");

        // Locate Lalbaugcha Raja pin
        const lalbaugPin = page.locator('[data-testid="mandal-pin-lalbaugcha-raja"]');
        await expect(lalbaugPin).toBeVisible({ timeout: 10000 });

        // Trigger click on the pin
        await lalbaugPin.dispatchEvent("click");

        // Popup should appear
        const popup = page.locator('[data-testid="mandal-popup"]');
        await expect(popup).toBeVisible();
        await expect(popup).toContainText("Lalbaugcha Raja");
        await expect(popup).toContainText("लालबागचा राजा");
        await expect(popup).toContainText("Lalbaug Market");
        await expect(popup).toContainText("1934");

        // Verify the universal Google Maps link format
        const gmapsBtn = page.locator('[data-testid="google-maps-btn"]');
        await expect(gmapsBtn).toBeVisible();
        const href = await gmapsBtn.getAttribute("href");

        expect(href).toBe("https://www.google.com/maps/search/?api=1&query=18.99052%2C72.83641");
        expect(await gmapsBtn.getAttribute("target")).toBe("_blank");
        expect(await gmapsBtn.getAttribute("rel")).toContain("noopener");
    });

    test("should support keyboard navigation parity (Tab and Enter) to open pin popup", async ({
        page
    }) => {
        await page.goto("/");

        const keshavjiPin = page.locator('[data-testid="mandal-pin-keshavji-naik-chawl"]');
        await expect(keshavjiPin).toBeVisible({ timeout: 10000 });

        // Focus via keyboard
        await keshavjiPin.focus();
        await page.keyboard.press("Enter");

        const popup = page.locator('[data-testid="mandal-popup"]');
        await expect(popup).toBeVisible();
        await expect(popup).toContainText("Keshavji Naik Chawl");
        await expect(popup).toContainText("केशवजी नाईक चाळ");
        await expect(popup).toContainText("1893");
    });

    test("should open popup on marker hover without scrolling the viewport", async ({ page }) => {
        await page.goto("/");

        const lalbaugPin = page.locator('[data-testid="mandal-pin-lalbaugcha-raja"]');
        await expect(lalbaugPin).toBeVisible({ timeout: 10000 });

        // Trigger hover event on the map pin
        await lalbaugPin.dispatchEvent("mouseenter");

        // Popup should appear on the map
        const popup = page.locator('[data-testid="mandal-popup"]');
        await expect(popup).toBeVisible();
        await expect(popup).toContainText("Lalbaugcha Raja");

        // Verify viewport did not scroll away to directory cards
        const scrollY = await page.evaluate(() => window.scrollY);
        expect(scrollY).toBe(0);
    });
});
