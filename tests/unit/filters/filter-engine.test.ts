import { describe, it, expect } from "vitest";
import { filterMandals, serializeFiltersToUrl, parseFiltersFromUrl } from "@/lib/filters/engine";
import { ActiveFilters } from "@/lib/filters/types";
import { MandalItem } from "@/types/mandal";

describe("Filter Engine", () => {
    const mockMandals: MandalItem[] = [
        {
            slug: "keshavji-naik-chawl",
            nameEn: "Keshavji Naik Chawl Sarvajanik Ganeshotsav Mandal",
            nameMr: "केशवजी नाईक चाळ सार्वजनिक गणेशोत्सव मंडळ",
            localityEn: "Girgaon",
            localityMr: "गिरगाव",
            bmcWard: "D",
            foundedYear: 1893,
            latitude: 18.9554,
            longitude: 72.8213,
            currentCrowdLevel: "moderate",
            avgRating: 4.8,
            reviewCount: 320,
            attributes: {
                parkingNearby: false,
                wheelchairAccessible: true
            }
        },
        {
            slug: "lalbaugcha-raja",
            nameEn: "Lalbaugcha Raja",
            nameMr: "लालबागचा राजा",
            localityEn: "Lalbaug",
            localityMr: "लालबाग",
            bmcWard: "F/South",
            foundedYear: 1934,
            latitude: 18.9912,
            longitude: 72.8363,
            currentCrowdLevel: "very_heavy",
            avgRating: 4.9,
            reviewCount: 4500,
            attributes: {
                parkingNearby: true,
                wheelchairAccessible: false
            }
        },
        {
            slug: "khetwadi-12th-lane",
            nameEn: "Khetwadi 12th Lane (Khetwadicha Ganraj)",
            nameMr: "खेतवाडी १२ वी गल्ली (खेतवाडीचा गणराज)",
            localityEn: "Grant Road / Khetwadi",
            localityMr: "ग्रँट रोड / खेतवाडी",
            bmcWard: "D",
            foundedYear: 1959,
            latitude: 18.9612,
            longitude: 72.8219,
            currentCrowdLevel: "heavy",
            avgRating: 4.7,
            reviewCount: 1800,
            attributes: {
                parkingNearby: false,
                wheelchairAccessible: true
            }
        },
        {
            slug: "fort-vibhag",
            nameEn: "Fort Vibhag Sarvajanik Ganeshotsav Mandal",
            nameMr: "फोर्ट विभाग सार्वजनिक गणेशोत्सव मंडळ",
            localityEn: "Fort",
            localityMr: "फोर्ट",
            bmcWard: "A",
            foundedYear: 1954,
            latitude: 18.9348,
            longitude: 72.8351,
            currentCrowdLevel: "low",
            avgRating: 4.3,
            reviewCount: 210,
            attributes: {
                parkingNearby: true,
                wheelchairAccessible: true
            }
        }
    ];

    describe("filterMandals()", () => {
        it("returns all mandals when no filters or search query are provided", () => {
            const results = filterMandals(mockMandals, {}, "");
            expect(results).toHaveLength(4);
        });

        it("filters by text query matching English name", () => {
            const results = filterMandals(mockMandals, {}, "Lalbaug");
            expect(results).toHaveLength(1);
            expect(results[0].slug).toBe("lalbaugcha-raja");
        });

        it("filters by text query matching Marathi name", () => {
            const results = filterMandals(mockMandals, {}, "केशवजी");
            expect(results).toHaveLength(1);
            expect(results[0].slug).toBe("keshavji-naik-chawl");
        });

        it("filters by locality and ward query", () => {
            const girgaonResults = filterMandals(mockMandals, {}, "girgaon");
            expect(girgaonResults).toHaveLength(1);
            expect(girgaonResults[0].slug).toBe("keshavji-naik-chawl");

            const wardAResults = filterMandals(mockMandals, {}, "Ward A");
            expect(wardAResults).toHaveLength(1);
            expect(wardAResults[0].slug).toBe("fort-vibhag");
        });

        it("filters by single crowd level", () => {
            const lowResults = filterMandals(mockMandals, { crowdLevels: ["low"] }, "");
            expect(lowResults).toHaveLength(1);
            expect(lowResults[0].slug).toBe("fort-vibhag");
        });

        it("filters by multiple crowd levels (OR within crowd dimension)", () => {
            const results = filterMandals(mockMandals, { crowdLevels: ["low", "moderate"] }, "");
            expect(results).toHaveLength(2);
            const slugs = results.map((m) => m.slug);
            expect(slugs).toContain("fort-vibhag");
            expect(slugs).toContain("keshavji-naik-chawl");
        });

        it("filters by parking availability", () => {
            const parkingOnly = filterMandals(mockMandals, { parkingNearbyOnly: true }, "");
            expect(parkingOnly).toHaveLength(2);
            const slugs = parkingOnly.map((m) => m.slug);
            expect(slugs).toContain("lalbaugcha-raja");
            expect(slugs).toContain("fort-vibhag");
        });

        it("filters by minimum rating threshold", () => {
            const highRated = filterMandals(mockMandals, { minRating: 4.8 }, "");
            expect(highRated).toHaveLength(2);
            const slugs = highRated.map((m) => m.slug);
            expect(slugs).toContain("keshavji-naik-chawl");
            expect(slugs).toContain("lalbaugcha-raja");
        });

        it("combines multiple filter dimensions correctly (AND across dimensions)", () => {
            const combined = filterMandals(
                mockMandals,
                {
                    parkingNearbyOnly: true,
                    crowdLevels: ["low", "very_heavy"],
                    minRating: 4.5
                },
                ""
            );
            // Lalbaugcha Raja: parking=true, crowd=very_heavy, rating=4.9 (passes)
            // Fort: parking=true, crowd=low, rating=4.3 (fails rating >= 4.5)
            expect(combined).toHaveLength(1);
            expect(combined[0].slug).toBe("lalbaugcha-raja");
        });

        it("returns empty array when no mandals match", () => {
            const results = filterMandals(mockMandals, {}, "NonExistentMandal12345");
            expect(results).toHaveLength(0);
        });

        it("handles edge cases: null/undefined attributes gracefully", () => {
            const corruptedMandal: MandalItem = {
                slug: "no-attr",
                nameEn: "No Attr",
                nameMr: "नो ॲट्रिब्यूट",
                localityEn: "Colaba",
                localityMr: "कुलाबा",
                bmcWard: "A",
                foundedYear: 2000,
                latitude: 18.91,
                longitude: 72.82
            };
            const results = filterMandals([corruptedMandal], { parkingNearbyOnly: true }, "");
            expect(results).toHaveLength(0);
        });
    });

    describe("URL serialization and deserialization", () => {
        it("serializes active filters to URL search params string", () => {
            const filters: ActiveFilters = {
                crowdLevels: ["low", "moderate"],
                parkingNearbyOnly: true,
                minRating: 4.5
            };
            const queryString = serializeFiltersToUrl(filters, "lalbaug");
            const params = new URLSearchParams(queryString);

            expect(params.get("q")).toBe("lalbaug");
            expect(params.get("crowd")).toBe("low,moderate");
            expect(params.get("parking")).toBe("true");
            expect(params.get("rating")).toBe("4.5");
        });

        it("omits empty or default filter values from URL string", () => {
            const filters: ActiveFilters = {
                crowdLevels: [],
                parkingNearbyOnly: false,
                minRating: 0
            };
            const queryString = serializeFiltersToUrl(filters, "");
            expect(queryString).toBe("");
        });

        it("parses URL search params into ActiveFilters object and search query", () => {
            const searchParams = new URLSearchParams(
                "q=girgaon&crowd=heavy,very_heavy&parking=true&rating=4"
            );
            const { filters, searchQuery } = parseFiltersFromUrl(searchParams);

            expect(searchQuery).toBe("girgaon");
            expect(filters.crowdLevels).toEqual(["heavy", "very_heavy"]);
            expect(filters.parkingNearbyOnly).toBe(true);
            expect(filters.minRating).toBe(4);
        });

        it("handles malformed or invalid query params safely", () => {
            const searchParams = new URLSearchParams("crowd=invalid_crowd,low&rating=not-a-number");
            const { filters, searchQuery } = parseFiltersFromUrl(searchParams);

            expect(searchQuery).toBe("");
            expect(filters.crowdLevels).toEqual(["low"]); // invalid removed
            expect(filters.parkingNearbyOnly).toBe(false);
            expect(filters.minRating).toBe(0); // NaN fallback to 0
        });
    });
});
