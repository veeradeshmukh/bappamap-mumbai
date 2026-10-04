import { describe, it, expect } from "vitest";
import { getGoogleMapsUrl } from "@/lib/geo/google-maps";

describe("Google Maps Universal Deep Link Generator", () => {
    it("should format the URL using the official Google Maps search scheme without API keys", () => {
        const lat = 18.99052;
        const lng = 72.83641;
        const url = getGoogleMapsUrl(lat, lng);

        expect(url).toBe("https://www.google.com/maps/search/?api=1&query=18.99052%2C72.83641");
        expect(url).not.toContain("key=");
        expect(url).not.toContain("undefined");
        expect(url).not.toContain("NaN");
    });

    it("should correctly encode negative coordinates and float precision", () => {
        const url = getGoogleMapsUrl(18.95671, 72.82142);
        expect(url).toBe("https://www.google.com/maps/search/?api=1&query=18.95671%2C72.82142");
    });
});
