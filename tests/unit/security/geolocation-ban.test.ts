import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    if (!fs.existsSync(dirPath)) return arrayOfFiles;
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (file.endsWith(".ts") || file.endsWith(".tsx") || file.endsWith(".js")) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

describe("Security Guardrail: Geolocation API Ban", () => {
    it("should ensure no source files invoke navigator.geolocation or geolocation methods", () => {
        const srcDir = path.resolve(__dirname, "../../../src");
        const files = getAllFiles(srcDir);

        expect(files.length).toBeGreaterThan(0);

        for (const file of files) {
            const content = fs.readFileSync(file, "utf-8");
            expect(content).not.toContain("navigator.geolocation");
            expect(content).not.toContain("getCurrentPosition");
            expect(content).not.toContain("watchPosition");
            expect(content).not.toContain("GeolocateControl");
        }
    });
});
