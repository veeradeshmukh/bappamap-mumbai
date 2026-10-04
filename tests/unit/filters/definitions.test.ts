import { describe, it, expect } from "vitest";
import { MANDAL_FILTER_DEFINITIONS } from "@/lib/filters/definitions";
import { MandalItem } from "@/types/mandal";

describe("Mandal Filter Definitions", () => {
    const sampleMandal: MandalItem = {
        slug: "test-mandal",
        nameEn: "Test",
        nameMr: "टेस्ट",
        localityEn: "Girgaon",
        localityMr: "गिरगाव",
        bmcWard: "D",
        foundedYear: 1893,
        latitude: 18.95,
        longitude: 72.82,
        currentCrowdLevel: "moderate",
        avgRating: 4.8,
        attributes: {
            parkingNearby: true
        }
    };

    it("verifies crowd definition predicate", () => {
        const crowdDef = MANDAL_FILTER_DEFINITIONS.find((d) => d.id === "crowd");
        expect(crowdDef).toBeDefined();

        // Default / empty array passes
        expect(crowdDef!.predicate(sampleMandal, [])).toBe(true);
        // Matching level passes
        expect(crowdDef!.predicate(sampleMandal, ["moderate"])).toBe(true);
        // Non-matching level fails
        expect(crowdDef!.predicate(sampleMandal, ["heavy"])).toBe(false);

        // Mandal with no crowd level
        const noCrowdMandal: MandalItem = { ...sampleMandal, currentCrowdLevel: undefined };
        expect(crowdDef!.predicate(noCrowdMandal, ["low"])).toBe(false);
    });

    it("verifies parking definition predicate", () => {
        const parkingDef = MANDAL_FILTER_DEFINITIONS.find((d) => d.id === "parking");
        expect(parkingDef).toBeDefined();

        // False filter passes everything
        expect(parkingDef!.predicate(sampleMandal, false)).toBe(true);
        // True filter passes mandal with parking
        expect(parkingDef!.predicate(sampleMandal, true)).toBe(true);

        const noParkingMandal: MandalItem = {
            ...sampleMandal,
            attributes: { parkingNearby: false }
        };
        expect(parkingDef!.predicate(noParkingMandal, true)).toBe(false);

        const nullAttrMandal: MandalItem = {
            ...sampleMandal,
            attributes: undefined
        };
        expect(parkingDef!.predicate(nullAttrMandal, true)).toBe(false);
    });

    it("verifies min_rating definition predicate", () => {
        const ratingDef = MANDAL_FILTER_DEFINITIONS.find((d) => d.id === "min_rating");
        expect(ratingDef).toBeDefined();

        // 0 passes everything
        expect(ratingDef!.predicate(sampleMandal, 0)).toBe(true);
        // Lower or equal threshold passes
        expect(ratingDef!.predicate(sampleMandal, 4.5)).toBe(true);
        expect(ratingDef!.predicate(sampleMandal, 4.8)).toBe(true);
        // Higher threshold fails
        expect(ratingDef!.predicate(sampleMandal, 4.9)).toBe(false);

        const unratedMandal: MandalItem = { ...sampleMandal, avgRating: undefined };
        expect(ratingDef!.predicate(unratedMandal, 4.0)).toBe(false);
    });
});
