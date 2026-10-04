import { describe, it, expect } from "vitest";
import { getSeedMandals, getMandalBySlug } from "@/lib/data/mandals";
import { isWithinSouthMumbai } from "@/lib/geo/bounds";

describe("Seed Mandals Data Integrity", () => {
    const mandals = getSeedMandals();

    it("should load at least 10 verified mandals", () => {
        expect(mandals.length).toBeGreaterThanOrEqual(10);
    });

    it("should ensure every mandal has valid English and Marathi names", () => {
        for (const mandal of mandals) {
            expect(mandal.nameEn.trim().length).toBeGreaterThan(0);
            expect(mandal.nameMr.trim().length).toBeGreaterThan(0);
            expect(mandal.localityEn.trim().length).toBeGreaterThan(0);
            expect(mandal.localityMr.trim().length).toBeGreaterThan(0);
        }
    });

    it("should ensure all seed coordinates fall strictly within South Mumbai bounds", () => {
        for (const mandal of mandals) {
            const isInside = isWithinSouthMumbai(mandal.latitude, mandal.longitude);
            expect(
                isInside,
                `Mandal "${mandal.nameEn}" at (${mandal.latitude}, ${mandal.longitude}) is outside South Mumbai!`
            ).toBe(true);
        }
    });

    it("should ensure every mandal has a valid historic founding year", () => {
        for (const mandal of mandals) {
            expect(mandal.foundedYear).toBeGreaterThanOrEqual(1800);
            expect(mandal.foundedYear).toBeLessThanOrEqual(2027);
        }
    });

    it("should include Keshavji Naik Chawl (1893) and Lalbaugcha Raja (1934)", () => {
        const keshavji = mandals.find((m) => m.slug === "keshavji-naik-chawl");
        expect(keshavji).toBeDefined();
        expect(keshavji?.foundedYear).toBe(1893);

        const lalbaug = mandals.find((m) => m.slug === "lalbaugcha-raja");
        expect(lalbaug).toBeDefined();
        expect(lalbaug?.foundedYear).toBe(1934);
    });

    it("should retrieve a mandal by slug with getMandalBySlug", () => {
        const found = getMandalBySlug("girgaoncha-raja");
        expect(found).toBeDefined();
        expect(found?.nameEn).toContain("Girgaoncha Raja");

        const notFound = getMandalBySlug("non-existent-mandal");
        expect(notFound).toBeUndefined();
    });
});
