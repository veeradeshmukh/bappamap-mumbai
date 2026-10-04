import { describe, it, expect } from "vitest";
import {
    calculateTargetDimensions,
    validateImageFile,
    MAX_IMAGE_SIZE_BYTES
} from "@/lib/media/canvas-processor";

describe("Canvas Processor & Image Sanitization", () => {
    describe("calculateTargetDimensions()", () => {
        it("returns original dimensions when image is smaller than maxDimension", () => {
            const dims = calculateTargetDimensions(800, 600, 1600);
            expect(dims).toEqual({ width: 800, height: 600 });
        });

        it("scales down width proportionally when width exceeds maxDimension", () => {
            const dims = calculateTargetDimensions(3200, 1600, 1600);
            expect(dims).toEqual({ width: 1600, height: 800 });
        });

        it("scales down height proportionally when height exceeds maxDimension", () => {
            const dims = calculateTargetDimensions(1200, 2400, 1600);
            expect(dims).toEqual({ width: 800, height: 1600 });
        });

        it("handles square images larger than maxDimension", () => {
            const dims = calculateTargetDimensions(4000, 4000, 1600);
            expect(dims).toEqual({ width: 1600, height: 1600 });
        });
    });

    describe("validateImageFile()", () => {
        it("accepts valid image files (JPEG, PNG, WebP) under 5 MB", () => {
            const validFile = new File(["dummy-content"], "pandal.jpg", {
                type: "image/jpeg"
            });
            const result = validateImageFile(validFile);
            expect(result.valid).toBe(true);
        });

        it("rejects non-image file types", () => {
            const pdfFile = new File(["dummy-pdf"], "document.pdf", {
                type: "application/pdf"
            });
            const result = validateImageFile(pdfFile);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("image");
        });

        it("rejects files exceeding 5 MB limit", () => {
            // Create simulated large file
            const largeFile = new File(
                [new Uint8Array(MAX_IMAGE_SIZE_BYTES + 1024)],
                "massive.jpg",
                { type: "image/jpeg" }
            );
            const result = validateImageFile(largeFile);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("5 MB");
        });
    });
});
