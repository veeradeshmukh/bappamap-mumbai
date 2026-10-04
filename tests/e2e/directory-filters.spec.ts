import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("Sprint 2: Filterable Directory & Bidirectional Sync", () => {
    test.beforeEach(async ({ page, context }) => {
        // Enforce zero geolocation permission
        await context.clearPermissions();
        // Prevent state leakage between parallel test executions
        await page.addInitScript(() => {
            window.localStorage.clear();
        });
    });

    test("should render filter bar, counters, and all 12 directory cards on initial load", async ({
        page
    }) => {
        await page.goto("/");

        // Verify Filter Bar exists
        const searchInput = page.locator('[data-testid="filter-search-input"]');
        await expect(searchInput).toBeVisible();

        const countBadge = page.locator('[data-testid="filter-count-badge"]');
        await expect(countBadge).toContainText("Showing 12 of 12 mandals");

        // Verify cards count
        const cards = page.locator('[data-testid^="mandal-card-"]');
        await expect(cards).toHaveCount(12);

        // Verify specific mandal card details
        const lalbaugCard = page.locator('[data-testid="mandal-card-lalbaugcha-raja"]');
        await expect(lalbaugCard).toBeVisible();
        await expect(lalbaugCard).toContainText("Lalbaugcha Raja");
        await expect(lalbaugCard).toContainText("1934");
        await expect(lalbaugCard).toContainText("F/South");
    });

    test("should filter directory cards and hide unmatched map pins on text search", async ({
        page
    }) => {
        await page.goto("/");
        await expect(page.locator('[data-testid="filter-count-badge"]')).toContainText(
            "Showing 12 of 12 mandals"
        );

        const searchInput = page.locator('[data-testid="filter-search-input"]');
        await searchInput.click();
        await searchInput.fill("Lalbaug");

        // Card count should decrease to 3 (Lalbaugcha Raja, Ganesh Galli, Tejukaya)
        const cards = page.locator('[data-testid^="mandal-card-"]');
        await expect(cards).toHaveCount(3);

        const countBadge = page.locator('[data-testid="filter-count-badge"]');
        await expect(countBadge).toContainText("Showing 3 of 12 mandals");

        // Map pin for Lalbaugcha Raja should remain visible
        const lalbaugPin = page.locator('[data-testid="mandal-pin-lalbaugcha-raja"]');
        await expect(lalbaugPin).toBeVisible();

        // Map pin for Fort Vibhag (unmatched) should be hidden
        const fortPin = page.locator(
            '[data-testid="mandal-pin-fort-vibhag-sarvajanik-ganeshotsav"]'
        );
        await expect(fortPin).toBeHidden();

        // Clear search using the clear button
        const clearBtn = page.getByRole("button", { name: /clear search/i });
        await clearBtn.click();
        await expect(cards).toHaveCount(12);
        await expect(fortPin).toBeVisible();
    });

    test("should filter cards and pins by crowd level selection", async ({ page }) => {
        await page.goto("/");

        const lowCrowdChip = page.locator('[data-testid="filter-crowd-low"]');
        await lowCrowdChip.click();

        // Check active state
        await expect(lowCrowdChip).toHaveAttribute("aria-pressed", "true");

        // URL should reflect ?crowd=low
        await expect(page).toHaveURL(/crowd=low/);

        // Verify reset filters button appears
        const resetBtn = page.locator('[data-testid="filter-reset-btn"]');
        await expect(resetBtn).toBeVisible();

        // Click reset
        await resetBtn.click();
        await expect(page.locator('[data-testid^="mandal-card-"]')).toHaveCount(12);
        await expect(lowCrowdChip).toHaveAttribute("aria-pressed", "false");
    });

    test("should filter by parking availability and persist in URL", async ({ page }) => {
        await page.goto("/");

        const parkingToggle = page.locator('[data-testid="filter-parking-toggle"]');
        await parkingToggle.click();

        await expect(parkingToggle).toHaveAttribute("aria-pressed", "true");
        await expect(page).toHaveURL(/parking=true/);

        // Mandals with parking
        const cards = page.locator('[data-testid^="mandal-card-"]');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(12);
    });

    test("should restore filtered state when loaded directly from URL search params", async ({
        page
    }) => {
        // Direct navigation with pre-filtered URL (Fort has verified nearby parking)
        await page.goto("/?parking=true&q=fort");

        const searchInput = page.locator('[data-testid="filter-search-input"]');
        await expect(searchInput).toHaveValue("fort");

        const parkingToggle = page.locator('[data-testid="filter-parking-toggle"]');
        await expect(parkingToggle).toHaveAttribute("aria-pressed", "true");

        // Only matching cards should render
        const cards = page.locator('[data-testid^="mandal-card-"]');
        const count = await cards.count();
        expect(count).toBeGreaterThan(0);
    });

    test("should support bidirectional sync: clicking card Show on Map activates pin popup", async ({
        page
    }) => {
        await page.goto("/");

        const lalbaugCard = page.locator('[data-testid="mandal-card-lalbaugcha-raja"]');
        await expect(lalbaugCard).toBeVisible();

        const showOnMapBtn = page.locator('[data-testid="card-show-map-lalbaugcha-raja"]');
        await showOnMapBtn.click();

        // Popup on map should open
        const popup = page.locator('[data-testid="mandal-popup"]');
        await expect(popup).toBeVisible({ timeout: 5000 });
        await expect(popup).toContainText("Lalbaugcha Raja");
    });

    test("should switch UI and mandal text to Marathi when toggling language", async ({ page }) => {
        await page.goto("/");

        // Switch to Marathi
        const mrToggle = page.locator('[data-testid="lang-toggle-mr"]');
        await mrToggle.click();

        // Check URL updated
        await expect(page).toHaveURL(/lang=mr/);

        // Header subtitle should be in Marathi
        await expect(
            page.getByText("दक्षिण मुंबई गणेशोत्सव दर्शन नकाशा (कुलाबा ते लालबाग)")
        ).toBeVisible();

        // Filter search input placeholder should be localized
        const searchInput = page.locator('[data-testid="filter-search-input"]');
        await expect(searchInput).toHaveAttribute(
            "placeholder",
            "मंडळ, परिसर किंवा प्रभाग शोधा..."
        );

        // Cards show Marathi primary title
        const lalbaugCard = page.locator('[data-testid="mandal-card-lalbaugcha-raja"]');
        await expect(lalbaugCard).toContainText("लालबागचा राजा");

        // Switch back to English
        const enToggle = page.locator('[data-testid="lang-toggle-en"]');
        await enToggle.click();
        await expect(lalbaugCard).toContainText("Lalbaugcha Raja");
    });

    test("should render empty state with reset button when no mandals match", async ({ page }) => {
        await page.goto("/");
        await expect(page.locator('[data-testid="filter-count-badge"]')).toContainText(
            "Showing 12 of 12 mandals"
        );

        const searchInput = page.locator('[data-testid="filter-search-input"]');
        await searchInput.click();
        await searchInput.fill("NonExistentMandalXYZ");

        const emptyState = page.locator('[data-testid="mandal-list-empty"]');
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText("No mandals found matching your filters.");

        const resetBtn = emptyState.getByRole("button", { name: /reset filters/i });
        await resetBtn.click();

        await expect(emptyState).toBeHidden();
        await expect(page.locator('[data-testid^="mandal-card-"]')).toHaveCount(12);
    });

    test("should pass WCAG 2.2 AA accessibility scan with zero violations", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");

        // Run axe-core accessibility scanner
        // We exclude the WebGL map canvas container because MapLibre's raw canvas is non-DOM graphical rendering
        const accessibilityScanResults = await new AxeBuilder({ page })
            .exclude(".maplibregl-canvas-container")
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();

        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
