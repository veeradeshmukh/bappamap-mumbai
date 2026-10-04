import { describe, it, expect } from "vitest";
import {
    isWithinSouthMumbai,
    SOUTH_MUMBAI_BOUNDS,
    MAP_CENTER,
    MIN_ZOOM,
    MAX_ZOOM,
    DEFAULT_ZOOM
} from "@/lib/geo/bounds";

describe("South Mumbai Geographic Bounding & Zoom Specs", () => {
    describe("Coordinate Boundary Validation", () => {
        it("should accept coordinates within South Mumbai", () => {
            // Keshavji Naik Chawl (Girgaon)
            expect(isWithinSouthMumbai(18.95671, 72.82142)).toBe(true);
            // Lalbaugcha Raja (Lalbaug)
            expect(isWithinSouthMumbai(18.99052, 72.83641)).toBe(true);
            // Fort Vibhag (Fort)
            expect(isWithinSouthMumbai(18.93982, 72.83541)).toBe(true);
            // Colaba Point
            expect(isWithinSouthMumbai(18.895, 72.815)).toBe(true);
        });

        it("should reject coordinates outside South Mumbai", () => {
            // Bandra (Suburbs)
            expect(isWithinSouthMumbai(19.0596, 72.8295)).toBe(false);
            // Andheri
            expect(isWithinSouthMumbai(19.1136, 72.8697)).toBe(false);
            // Thane
            expect(isWithinSouthMumbai(19.2183, 72.9781)).toBe(false);
            // Arabian Sea far west
            expect(isWithinSouthMumbai(18.95, 72.7)).toBe(false);
            // Null Island / Origin
            expect(isWithinSouthMumbai(0.0, 0.0)).toBe(false);
        });
    });

    describe("Map Camera Constraints", () => {
        it("should have correct South Mumbai bounding box coordinates", () => {
            const [sw, ne] = SOUTH_MUMBAI_BOUNDS;
            // Southwest: Colaba coast
            expect(sw[0]).toBe(72.78);
            expect(sw[1]).toBe(18.89);
            // Northeast: Parel/Lalbaug boundary
            expect(ne[0]).toBe(72.87);
            expect(ne[1]).toBe(19.015);
        });

        it("should center on the South Mumbai centroid", () => {
            expect(MAP_CENTER[0]).toBeCloseTo(72.825, 3);
            expect(MAP_CENTER[1]).toBeCloseTo(18.955, 3);
        });

        it("should enforce zoom restrictions to prevent wander-off", () => {
            expect(MIN_ZOOM).toBe(12.0);
            expect(MAX_ZOOM).toBe(17.5);
            expect(DEFAULT_ZOOM).toBe(13.5);
        });
    });
});
