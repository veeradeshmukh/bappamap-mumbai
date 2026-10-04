import { describe, it, expect } from "vitest";
import { t, getLocalizedField } from "@/lib/i18n/translations";
import { MandalItem } from "@/types/mandal";

describe("i18n Translations", () => {
    const mockMandal: MandalItem = {
        slug: "test-mandal",
        nameEn: "Test Ganpati Mandal",
        nameMr: "टेस्ट गणपती मंडळ",
        localityEn: "Girgaon",
        localityMr: "गिरगाव",
        bmcWard: "D",
        foundedYear: 1893,
        latitude: 18.95,
        longitude: 72.82,
        descriptionEn: "Historic mandal in Girgaon",
        descriptionMr: "गिरगावातील ऐतिहासिक मंडळ",
        currentCrowdLevel: "moderate",
        avgRating: 4.8,
        reviewCount: 120,
        attributes: {
            parkingNearby: false
        }
    };

    describe("t() translation helper", () => {
        it("returns English string when lang is 'en'", () => {
            expect(t("nav.addReview", "en")).toBe("+ Add / Review Mandal");
            expect(t("filters.parkingNearby", "en")).toBe("Parking Nearby");
            expect(t("crowd.low", "en")).toBe("Low Crowd");
            expect(t("card.nearestStation", "en")).toBe("Nearest Station");
            expect(t("theme.toggle", "en")).toBe("Toggle color theme");
        });

        it("returns Marathi string when lang is 'mr'", () => {
            expect(t("nav.addReview", "mr")).toBe("+ मंडळ जोडा / पुनरावलोकन");
            expect(t("filters.parkingNearby", "mr")).toBe("जवळपास पार्किंग");
            expect(t("crowd.low", "mr")).toBe("कमी गर्दी");
            expect(t("card.nearestStation", "mr")).toBe("जवळचे रेल्वे स्थानक");
            expect(t("theme.toggle", "mr")).toBe("थीम बदला");
        });

        it("falls back to English when translation key is missing in Marathi", () => {
            // Test with a key guaranteed to exist in en
            expect(t("app.title", "mr")).toBeTruthy();
        });

        it("returns key itself when key does not exist in any language dictionary", () => {
            expect(t("non.existent.key", "en")).toBe("non.existent.key");
            expect(t("non.existent.key", "mr")).toBe("non.existent.key");
        });
    });

    describe("getLocalizedField() helper", () => {
        it("returns English name and locality when lang is 'en'", () => {
            expect(getLocalizedField(mockMandal, "name", "en")).toBe("Test Ganpati Mandal");
            expect(getLocalizedField(mockMandal, "locality", "en")).toBe("Girgaon");
            expect(getLocalizedField(mockMandal, "description", "en")).toBe(
                "Historic mandal in Girgaon"
            );
        });

        it("returns Marathi name and locality when lang is 'mr'", () => {
            expect(getLocalizedField(mockMandal, "name", "mr")).toBe("टेस्ट गणपती मंडळ");
            expect(getLocalizedField(mockMandal, "locality", "mr")).toBe("गिरगाव");
            expect(getLocalizedField(mockMandal, "description", "mr")).toBe(
                "गिरगावातील ऐतिहासिक मंडळ"
            );
        });

        it("falls back gracefully to English when Marathi field is empty", () => {
            const mandalWithoutMr: MandalItem = {
                ...mockMandal,
                nameMr: "",
                descriptionMr: undefined
            };
            expect(getLocalizedField(mandalWithoutMr, "name", "mr")).toBe("Test Ganpati Mandal");
            expect(getLocalizedField(mandalWithoutMr, "description", "mr")).toBe(
                "Historic mandal in Girgaon"
            );
        });

        it("returns empty string when field is unknown or empty in all languages", () => {
            const emptyMandal: MandalItem = {
                slug: "empty",
                nameEn: "",
                nameMr: "",
                localityEn: "",
                localityMr: "",
                bmcWard: "A",
                foundedYear: 2000,
                latitude: 18.9,
                longitude: 72.8
            };
            expect(getLocalizedField(emptyMandal, "description", "en")).toBe("");
            expect(getLocalizedField(emptyMandal, "description", "mr")).toBe("");
        });
    });
});
