import { describe, it, expect } from "vitest";
import { calculateDecayedCrowdLevel, CrowdReportItem } from "@/lib/crowd/decay-engine";

describe("Crowd Decay Engine (120-minute sliding window)", () => {
    const fixedNow = new Date("2027-09-15T18:00:00.000Z");

    it("falls back to baseline level when no reports are provided", () => {
        const result = calculateDecayedCrowdLevel([], "moderate", 120, fixedNow);
        expect(result.level).toBe("moderate");
        expect(result.activeReportCount).toBe(0);
        expect(result.confidence).toBe(0);
    });

    it("calculates accurate level for single fresh report", () => {
        const reports: CrowdReportItem[] = [
            {
                level: "heavy",
                timestamp: new Date("2027-09-15T17:50:00.000Z") // 10 minutes ago
            }
        ];

        const result = calculateDecayedCrowdLevel(reports, "low", 120, fixedNow);
        expect(result.level).toBe("heavy");
        expect(result.activeReportCount).toBe(1);
        expect(result.score).toBe(3);
    });

    it("discards reports submitted beyond the 120-minute sliding window", () => {
        const reports: CrowdReportItem[] = [
            {
                level: "very_heavy",
                timestamp: new Date("2027-09-15T15:30:00.000Z") // 150 minutes ago
            }
        ];

        const result = calculateDecayedCrowdLevel(reports, "low", 120, fixedNow);
        expect(result.level).toBe("low");
        expect(result.activeReportCount).toBe(0);
        expect(result.confidence).toBe(0);
    });

    it("prioritizes recent observations over older ones through linear decay weighting", () => {
        const reports: CrowdReportItem[] = [
            {
                // Fresh report 5 mins ago: weight = (1 - 5/120) = 115/120 ≈ 0.958
                level: "very_heavy", // value 4
                timestamp: new Date("2027-09-15T17:55:00.000Z")
            },
            {
                // Old report 110 mins ago: weight = (1 - 110/120) = 10/120 ≈ 0.083
                level: "low", // value 1
                timestamp: new Date("2027-09-15T16:10:00.000Z")
            }
        ];

        const result = calculateDecayedCrowdLevel(reports, "moderate", 120, fixedNow);
        expect(result.activeReportCount).toBe(2);
        // Score should be dominated by the 5-min fresh report and be very_heavy
        expect(result.score).toBeGreaterThan(3.6);
        expect(result.level).toBe("very_heavy");
    });

    it("maps score thresholds correctly to crowd categories", () => {
        const makeReport = (level: "low" | "moderate" | "heavy" | "very_heavy") => [
            { level, timestamp: new Date("2027-09-15T17:59:00.000Z") }
        ];

        expect(calculateDecayedCrowdLevel(makeReport("low"), "heavy", 120, fixedNow).level).toBe(
            "low"
        );
        expect(
            calculateDecayedCrowdLevel(makeReport("moderate"), "heavy", 120, fixedNow).level
        ).toBe("moderate");
        expect(calculateDecayedCrowdLevel(makeReport("heavy"), "low", 120, fixedNow).level).toBe(
            "heavy"
        );
        expect(
            calculateDecayedCrowdLevel(makeReport("very_heavy"), "low", 120, fixedNow).level
        ).toBe("very_heavy");
    });

    it("gracefully handles invalid timestamps and future clock skew", () => {
        const reports: CrowdReportItem[] = [
            {
                level: "heavy",
                timestamp: "invalid-date-string"
            },
            {
                level: "low",
                timestamp: new Date("2027-09-15T18:05:00.000Z") // 5 minutes in future
            }
        ];

        const result = calculateDecayedCrowdLevel(reports, "moderate", 120, fixedNow);
        expect(result.activeReportCount).toBe(1);
        expect(result.level).toBe("low");
    });
});
