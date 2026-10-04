import { describe, it, expect } from "vitest";
import { BAPPAMAP_STYLE } from "@/lib/map/theme";

describe("MapLibre Custom Basalt Theme Specification", () => {
    it("should be a valid Mapbox Style Specification v8", () => {
        expect(BAPPAMAP_STYLE.version).toBe(8);
        expect(BAPPAMAP_STYLE.name).toBe("BappaMap Basalt Dark");
    });

    it("should use OpenFreeMap vector planet source without paid keys", () => {
        const source = BAPPAMAP_STYLE.sources.openfreemap as { type: string; url: string };
        expect(source.type).toBe("vector");
        expect(source.url).toContain("openfreemap.org");
    });

    it("should style the background with dark Arabian Sea color #070A10", () => {
        const bgLayer = BAPPAMAP_STYLE.layers.find((l) => l.id === "background");
        expect(bgLayer).toBeDefined();
        const paint = bgLayer?.paint as Record<string, unknown>;
        expect(paint?.["background-color"]).toBe("#070A10");
    });

    it("should include layers for land, water, roads, and place labels", () => {
        const layerIds = BAPPAMAP_STYLE.layers.map((l) => l.id);
        expect(layerIds).toContain("land");
        expect(layerIds).toContain("water");
        expect(layerIds).toContain("roads-primary");
        expect(layerIds).toContain("place-labels");
    });
});
